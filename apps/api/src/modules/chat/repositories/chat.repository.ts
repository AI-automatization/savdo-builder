import { Injectable } from '@nestjs/common';
import {
  ChatMessage,
  ChatMessageType,
  ChatThread,
  ChatThreadStatus,
  Prisma,
  ThreadType,
  Seller,
  Store,
  Buyer,
  User,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

/** Минимальный набор полей треда для проверок участника (write paths). */
export type ThreadParticipants = Pick<ChatThread, 'buyerId' | 'sellerId'>;

/** Тред в admin-списке: с last message + buyer/seller для отображения. */
export type AdminThreadListItem = ChatThread & {
  buyer: (Buyer & { user: Pick<User, 'phone'> }) | null;
  seller: Seller & { store: Pick<Store, 'name' | 'slug'> | null };
  messages: ChatMessage[];
};

/** Тред в admin-просмотре переписки. */
export type AdminThreadDetail = ChatThread & {
  buyer: (Buyer & { user: Pick<User, 'phone'> }) | null;
  seller: Seller & { store: Pick<Store, 'name'> | null };
  messages: ChatMessage[];
};

/** Сообщение с пожаловавшимся тредом для admin reports. */
export type ReportedMessage = Pick<
  ChatMessage,
  'id' | 'body' | 'reportedAt' | 'createdAt'
> & {
  thread: Pick<ChatThread, 'id' | 'status'> & {
    buyer: { user: Pick<User, 'phone'> } | null;
    seller: { store: Pick<Store, 'name'> | null };
  };
};

export type ThreadWithMessages = ChatThread & {
  messages: ChatMessage[];
  // MARKETING-LOCALIZATION-UZ-001: user.languageCode для локализации TG-уведомлений.
  seller: Seller & { store: Store | null; user: Pick<User, 'languageCode'> };
  buyer: (Buyer & { user: Pick<User, 'phone' | 'telegramId' | 'languageCode'> }) | null;
  product: { title: string } | null;
  order: { orderNumber: string } | null;
};

export interface CreateThreadData {
  buyerId: string;
  sellerId: string;
  threadType: ThreadType;
  productId?: string;
  orderId?: string;
}

export interface AddMessageData {
  threadId: string;
  senderUserId: string;
  body?: string | null;
  parentMessageId?: string | null;
  mediaId?: string | null;
  messageType?: ChatMessageType;
}

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findThreadById(id: string): Promise<ThreadWithMessages | null> {
    return this.prisma.chatThread.findUnique({
      where: { id },
      include: {
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
        seller: {
          include: { store: true, user: { select: { languageCode: true } } },
        },
        buyer: {
          include: {
            user: { select: { phone: true, telegramId: true, languageCode: true } },
          },
        },
        product: { select: { title: true } },
        order: { select: { orderNumber: true } },
      },
    }) as Promise<ThreadWithMessages | null>;
  }

  async findThreadByContext(
    buyerId: string,
    threadType: ThreadType,
    contextId: string,
  ): Promise<ChatThread | null> {
    const where =
      threadType === 'PRODUCT'
        ? { buyerId, threadType, productId: contextId }
        : { buyerId, threadType, orderId: contextId };

    return this.prisma.chatThread.findFirst({ where });
  }

  async findThreadsByBuyer(buyerId: string) {
    return this.prisma.chatThread.findMany({
      where: { buyerId, buyerDeletedAt: null },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        seller: { include: { store: { select: { id: true, name: true, slug: true } } } },
        product: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            salePrice: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: {
                media: { select: { id: true, objectKey: true, bucket: true } },
              },
            },
          },
        },
        order: { select: { orderNumber: true } },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true },
        },
      },
    });
  }

  async findThreadsBySeller(sellerId: string) {
    return this.prisma.chatThread.findMany({
      where: { sellerId, sellerDeletedAt: null },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        buyer: { include: { user: { select: { phone: true } } } },
        product: {
          select: {
            id: true,
            title: true,
            basePrice: true,
            salePrice: true,
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: {
                media: { select: { id: true, objectKey: true, bucket: true } },
              },
            },
          },
        },
        order: { select: { orderNumber: true } },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { body: true },
        },
      },
    });
  }

  async createThread(data: CreateThreadData): Promise<ChatThread> {
    return this.prisma.chatThread.create({
      data: {
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        threadType: data.threadType,
        productId: data.productId ?? null,
        orderId: data.orderId ?? null,
        status: 'OPEN',
      },
    });
  }

  async findMessageById(id: string): Promise<ChatMessage | null> {
    return this.prisma.chatMessage.findUnique({ where: { id } });
  }

  async findMessagesByIds(ids: string[]): Promise<ChatMessage[]> {
    if (!ids.length) return [];
    return this.prisma.chatMessage.findMany({ where: { id: { in: ids } } });
  }

  async addMessage(data: AddMessageData): Promise<ChatMessage> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          threadId: data.threadId,
          senderUserId: data.senderUserId,
          messageType: data.messageType ?? (data.mediaId ? ChatMessageType.IMAGE : ChatMessageType.TEXT),
          body: data.body ?? null,
          ...(data.parentMessageId ? { parentMessageId: data.parentMessageId } : {}),
          ...(data.mediaId ? { mediaId: data.mediaId } : {}),
        },
      });

      await tx.chatThread.update({
        where: { id: data.threadId },
        data: {
          lastMessageId: message.id,
          lastMessageAt: message.createdAt,
        },
      });

      return message;
    });
  }

  /**
   * Cursor-based pagination: returns messages older than the cursor message,
   * ordered newest-first so the caller can reverse for display.
   * Default limit 50.
   */
  async findMessages(
    threadId: string,
    options?: { limit?: number; before?: string },
  ): Promise<ChatMessage[]> {
    const limit = Math.min(options?.limit ?? 50, 100);

    if (options?.before) {
      const cursor = await this.prisma.chatMessage.findUnique({
        where: { id: options.before },
        select: { createdAt: true },
      });

      if (cursor) {
        return this.prisma.chatMessage.findMany({
          where: {
            threadId,
            isDeleted: false,
            createdAt: { lt: cursor.createdAt },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      }
    }

    return this.prisma.chatMessage.findMany({
      where: { threadId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async resolveThread(id: string): Promise<ChatThread> {
    return this.prisma.chatThread.update({
      where: { id },
      data: { status: 'CLOSED' },
    });
  }

  async markAsRead(threadId: string, role: 'buyer' | 'seller'): Promise<void> {
    const field = role === 'buyer' ? 'buyerLastReadAt' : 'sellerLastReadAt';
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { [field]: new Date() },
    });
  }

  async getUnreadCounts(
    threads: Array<{ id: string; buyerLastReadAt: Date | null; sellerLastReadAt: Date | null }>,
    role: 'buyer' | 'seller',
  ): Promise<Map<string, number>> {
    if (threads.length === 0) return new Map();

    const results = await Promise.all(
      threads.map(async (t) => {
        const cutoff = role === 'buyer' ? t.buyerLastReadAt : t.sellerLastReadAt;
        const count = await this.prisma.chatMessage.count({
          where: {
            threadId: t.id,
            isDeleted: false,
            createdAt: { gt: cutoff ?? new Date(0) },
          },
        });
        return { id: t.id, count };
      }),
    );

    return new Map(results.map(({ id, count }) => [id, count]));
  }

  // ─── Participant resolution (write paths) ────────────────────────────────────

  /** Лёгкая выборка buyerId/sellerId треда для проверки участника. */
  async findThreadParticipants(id: string): Promise<ThreadParticipants | null> {
    return this.prisma.chatThread.findUnique({
      where: { id },
      select: { buyerId: true, sellerId: true },
    });
  }

  // ─── Per-participant soft-delete / read tracking ─────────────────────────────

  /** Soft-delete треда для одного участника (buyer или seller). */
  async softDeleteThreadForParticipant(
    threadId: string,
    role: 'buyer' | 'seller',
  ): Promise<void> {
    const field = role === 'buyer' ? 'buyerDeletedAt' : 'sellerDeletedAt';
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { [field]: new Date() },
    });
  }

  // ─── Message moderation (edit / delete / report) ─────────────────────────────

  /** Soft-delete сообщения: контент обнуляется, ставится deletedAt. */
  async softDeleteMessage(id: string): Promise<void> {
    await this.prisma.chatMessage.update({
      where: { id },
      data: { isDeleted: true, body: null, deletedAt: new Date() },
    });
  }

  /** Обновляет текст сообщения и проставляет editedAt. */
  async updateMessageBody(id: string, body: string): Promise<ChatMessage> {
    return this.prisma.chatMessage.update({
      where: { id },
      data: { body, editedAt: new Date() },
    });
  }

  /** Сообщение с тредом для проверки участника при report. */
  async findMessageWithThreadParticipants(
    id: string,
  ): Promise<(Pick<ChatMessage, 'id'> & { thread: ThreadParticipants }) | null> {
    return this.prisma.chatMessage.findUnique({
      where: { id },
      select: {
        id: true,
        thread: { select: { buyerId: true, sellerId: true } },
      },
    });
  }

  /** Помечает сообщение как пожалованное (или снимает жалобу при reportedAt=null). */
  async setMessageReportedAt(id: string, reportedAt: Date | null): Promise<void> {
    await this.prisma.chatMessage.update({
      where: { id },
      data: { reportedAt },
    });
  }

  // ─── Admin queries ───────────────────────────────────────────────────────────

  /** Список тредов для admin-панели с пагинацией и фильтром по статусу. */
  async findThreadsForAdmin(params: {
    status?: ChatThreadStatus;
    skip: number;
    take: number;
  }): Promise<[AdminThreadListItem[], number]> {
    const where: Prisma.ChatThreadWhereInput = params.status
      ? { status: params.status }
      : {};

    return Promise.all([
      this.prisma.chatThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: params.skip,
        take: params.take,
        include: {
          buyer: { include: { user: { select: { phone: true } } } },
          seller: { include: { store: { select: { name: true, slug: true } } } },
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }) as Promise<AdminThreadListItem[]>,
      this.prisma.chatThread.count({ where }),
    ]);
  }

  /** Полная переписка треда для admin-просмотра. */
  async findThreadDetailForAdmin(id: string): Promise<AdminThreadDetail | null> {
    return this.prisma.chatThread.findUnique({
      where: { id },
      include: {
        buyer: { include: { user: { select: { phone: true } } } },
        seller: { include: { store: { select: { name: true } } } },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    }) as Promise<AdminThreadDetail | null>;
  }

  /** Hard-delete треда вместе со всеми сообщениями (admin action). */
  async hardDeleteThread(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.chatMessage.deleteMany({ where: { threadId: id } }),
      this.prisma.chatThread.delete({ where: { id } }),
    ]);
  }

  /** Список пожалованных сообщений для admin moderation. */
  async findReportedMessages(limit = 200): Promise<ReportedMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { reportedAt: { not: null } },
      orderBy: { reportedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        body: true,
        reportedAt: true,
        createdAt: true,
        thread: {
          select: {
            id: true,
            status: true,
            buyer: { select: { user: { select: { phone: true } } } },
            seller: { select: { store: { select: { name: true } } } },
          },
        },
      },
    }) as Promise<ReportedMessage[]>;
  }
}
