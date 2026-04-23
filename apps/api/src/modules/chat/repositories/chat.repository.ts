import { Injectable } from '@nestjs/common';
import { ChatMessage, ChatThread, ThreadType, Seller, Store } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type ThreadWithMessages = ChatThread & {
  messages: ChatMessage[];
  seller: Seller & { store: Store | null };
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
  body: string;
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
          include: { store: true },
        },
      },
    });
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

  async findThreadsByBuyer(buyerId: string): Promise<ChatThread[]> {
    return this.prisma.chatThread.findMany({
      where: { buyerId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findThreadsBySeller(sellerId: string): Promise<ChatThread[]> {
    return this.prisma.chatThread.findMany({
      where: { sellerId },
      orderBy: { lastMessageAt: 'desc' },
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

  async addMessage(data: AddMessageData): Promise<ChatMessage> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          threadId: data.threadId,
          senderUserId: data.senderUserId,
          messageType: 'text',
          body: data.body,
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
}
