import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { UsersRepository } from '../users/repositories/users.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
import { PrismaService } from '../../database/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ListMessagesDto } from './dto/list-messages.dto';
import { CreateThreadUseCase } from './use-cases/create-thread.use-case';
import { CreateSellerThreadUseCase } from './use-cases/create-seller-thread.use-case';
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { GetThreadMessagesUseCase } from './use-cases/get-thread-messages.use-case';
import { ListMyThreadsUseCase } from './use-cases/list-my-threads.use-case';
import { ResolveThreadUseCase } from './use-cases/resolve-thread.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';
import { ChatGateway } from '../../socket/chat.gateway';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly prisma: PrismaService,
    private readonly createThreadUseCase: CreateThreadUseCase,
    private readonly createSellerThreadUseCase: CreateSellerThreadUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getThreadMessagesUseCase: GetThreadMessagesUseCase,
    private readonly listMyThreadsUseCase: ListMyThreadsUseCase,
    private readonly resolveThreadUseCase: ResolveThreadUseCase,
    private readonly chatGateway: ChatGateway,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
  ) {}

  // GET /api/v1/chat/unread-count — UX-002 badge на иконке чата (polling 30s)
  // Лёгкий endpoint: возвращает { total, threads } для бейджа на bottom-nav.
  @Get('chat/unread-count')
  @Roles('BUYER', 'SELLER')
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    const { buyerId, sellerId } = await this.resolveParticipant(user.sub, user.role);
    return this.getUnreadCountUseCase.execute(user.role as 'BUYER' | 'SELLER', buyerId, sellerId);
  }

  // GET /api/v1/chat/threads
  @Get('chat/threads')
  @Roles('BUYER', 'SELLER')
  async listMyThreads(@CurrentUser() user: JwtPayload) {
    const { buyerId, sellerId } = await this.resolveParticipant(user.sub, user.role);

    return this.listMyThreadsUseCase.execute({
      role: user.role,
      buyerId,
      sellerId,
    });
  }

  // POST /api/v1/chat/threads
  @Post('chat/threads')
  @Throttle({ default: { ttl: 60_000, limit: 10 } }) // защита от спама создания тредов
  // SEC-AUDIT-2026-05 HIGH-01: explicit @Roles. RolesGuard returns true когда
  // @Roles() отсутствует — без этого декоратора защита создавалась только
  // случайно (resolveBuyerId кидает 422 у seller'а без buyer-профиля).
  @Roles('BUYER', 'SELLER')
  async createThread(@CurrentUser() user: JwtPayload, @Body() dto: CreateThreadDto) {
    const buyerId = await this.resolveBuyerId(user.sub);

    return this.createThreadUseCase.execute({
      buyerId,
      contextType: dto.contextType,
      contextId: dto.contextId,
      firstMessage: dto.firstMessage,
    });
  }

  // POST /api/v1/seller/chat/threads
  // FEAT-004: продавец инициирует чат с покупателем по своему заказу.
  // Idempotent: если тред уже существует — переиспользуется. Сообщение
  // обязательно (без него тред не создаётся, иначе спам-вектор).
  @Post('seller/chat/threads')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Roles('SELLER')
  async createSellerThread(
    @CurrentUser() user: JwtPayload,
    @Body() dto: { orderId: string; firstMessage: string },
  ) {
    if (!dto?.orderId || typeof dto.orderId !== 'string') {
      throw new BadRequestException('orderId is required');
    }
    if (!dto?.firstMessage || typeof dto.firstMessage !== 'string') {
      throw new BadRequestException('firstMessage is required');
    }
    const sellerProfileId = await this.resolveSellerProfileId(user.sub);
    return this.createSellerThreadUseCase.execute({
      sellerProfileId,
      orderId: dto.orderId,
      firstMessage: dto.firstMessage,
    });
  }

  // GET /api/v1/chat/threads/:id/messages
  @Get('chat/threads/:id/messages')
  @Roles('BUYER', 'SELLER')
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') threadId: string,
    @Query() query: ListMessagesDto,
  ) {
    // Read-path: проверяем оба профиля. Юзер мог открыть thread где он seller,
    // но JWT.role=BUYER (или наоборот) — single-role check давал 403.
    const ids = await this.resolveBothProfileIds(user.sub);

    return this.getThreadMessagesUseCase.execute({
      threadId,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
      limit: query.limit,
      before: query.before,
    });
  }

  // POST /api/v1/chat/threads/:id/messages
  @Post('chat/threads/:id/messages')
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  @Roles('BUYER', 'SELLER')
  async sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    // Dual-role: определяем senderUserId по тому, в какой роли юзер участвует в треде.
    const ids = await this.resolveBothProfileIds(user.sub);
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { buyerId: true, sellerId: true },
    });
    if (!thread) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Thread not found', HttpStatus.NOT_FOUND);
    }
    const senderUserId =
      ids.buyerProfileId && thread.buyerId === ids.buyerProfileId ? ids.buyerProfileId :
      ids.sellerProfileId && thread.sellerId === ids.sellerProfileId ? ids.sellerProfileId :
      null;
    if (!senderUserId) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Not a participant of this thread', HttpStatus.FORBIDDEN);
    }

    return this.sendMessageUseCase.execute({
      threadId,
      senderUserId,
      text: dto.text,
      parentMessageId: dto.parentMessageId,
      mediaId: dto.mediaId,
    });
  }

  // PATCH /api/v1/chat/threads/:id/resolve
  @Patch('chat/threads/:id/resolve')
  @Roles('SELLER')
  async resolveThread(@CurrentUser() user: JwtPayload, @Param('id') threadId: string) {
    const sellerId = await this.resolveSellerProfileId(user.sub);

    return this.resolveThreadUseCase.execute({
      threadId,
      sellerUserId: sellerId,
    });
  }

  // PATCH /api/v1/chat/threads/:id/read
  @Patch('chat/threads/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('BUYER', 'SELLER')
  async markThreadAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') threadId: string,
  ): Promise<void> {
    const ids = await this.resolveBothProfileIds(user.sub);

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { buyerId: true, sellerId: true },
    });

    if (!thread) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Thread not found', HttpStatus.NOT_FOUND);
    }

    const isBuyer = !!ids.buyerProfileId && thread.buyerId === ids.buyerProfileId;
    const isSeller = !!ids.sellerProfileId && thread.sellerId === ids.sellerProfileId;

    if (!isBuyer && !isSeller) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Not a participant', HttpStatus.FORBIDDEN);
    }

    const field = isBuyer ? 'buyerLastReadAt' : 'sellerLastReadAt';
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { [field]: new Date() },
    });
  }

  // DELETE /api/v1/chat/threads/:id  (soft-delete per participant)
  @Delete('chat/threads/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('BUYER', 'SELLER')
  async deleteThread(
    @CurrentUser() user: JwtPayload,
    @Param('id') threadId: string,
  ): Promise<void> {
    const ids = await this.resolveBothProfileIds(user.sub);

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      select: { buyerId: true, sellerId: true },
    });

    if (!thread) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Thread not found', HttpStatus.NOT_FOUND);
    }

    const isBuyer = !!ids.buyerProfileId && thread.buyerId === ids.buyerProfileId;
    const isSeller = !!ids.sellerProfileId && thread.sellerId === ids.sellerProfileId;

    if (!isBuyer && !isSeller) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Not a participant', HttpStatus.FORBIDDEN);
    }

    const field = isBuyer ? 'buyerDeletedAt' : 'sellerDeletedAt';
    await (this.prisma.chatThread as any).update({
      where: { id: threadId },
      data: { [field]: new Date() },
    });
  }

  // DELETE /api/v1/chat/threads/:threadId/messages/:msgId  (soft-delete, author only)
  @Delete('chat/threads/:threadId/messages/:msgId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('BUYER', 'SELLER')
  async deleteMessage(
    @CurrentUser() user: JwtPayload,
    @Param('threadId') threadId: string,
    @Param('msgId') msgId: string,
  ): Promise<void> {
    const ids = await this.resolveBothProfileIds(user.sub);

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: msgId },
      select: { id: true, threadId: true, senderUserId: true, isDeleted: true },
    });

    if (!message || message.threadId !== threadId) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Message not found', HttpStatus.NOT_FOUND);
    }

    if (message.isDeleted) return;

    // Author check: senderUserId — это Buyer.id или Seller.id. Юзер автор если
    // совпало с любым из его профилей.
    const isAuthor =
      (!!ids.buyerProfileId && message.senderUserId === ids.buyerProfileId) ||
      (!!ids.sellerProfileId && message.senderUserId === ids.sellerProfileId);

    if (!isAuthor) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only the author can delete this message', HttpStatus.FORBIDDEN);
    }

    await (this.prisma.chatMessage as any).update({
      where: { id: msgId },
      data: { isDeleted: true, body: null, deletedAt: new Date() },
    });

    this.chatGateway.emitChatMessageDeleted(threadId, msgId);
  }

  // PATCH /api/v1/chat/threads/:threadId/messages/:msgId  (edit, author only, 15 min window)
  @Patch('chat/threads/:threadId/messages/:msgId')
  @Roles('BUYER', 'SELLER')
  async editMessage(
    @CurrentUser() user: JwtPayload,
    @Param('threadId') threadId: string,
    @Param('msgId') msgId: string,
    @Body('text') text: string,
  ) {
    if (!text?.trim()) {
      throw new BadRequestException('text is required');
    }

    const ids = await this.resolveBothProfileIds(user.sub);

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: msgId },
      select: { id: true, threadId: true, senderUserId: true, isDeleted: true, createdAt: true },
    });

    if (!message || message.threadId !== threadId) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Message not found', HttpStatus.NOT_FOUND);
    }

    if (message.isDeleted) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Cannot edit a deleted message', HttpStatus.FORBIDDEN);
    }

    const isAuthorAsBuyer = !!ids.buyerProfileId && message.senderUserId === ids.buyerProfileId;
    const isAuthorAsSeller = !!ids.sellerProfileId && message.senderUserId === ids.sellerProfileId;

    if (!isAuthorAsBuyer && !isAuthorAsSeller) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Only the author can edit this message', HttpStatus.FORBIDDEN);
    }

    const ageMs = Date.now() - message.createdAt.getTime();
    if (ageMs > 15 * 60 * 1000) {
      throw new BadRequestException('Edit window expired (15 minutes)');
    }

    const updated = await (this.prisma.chatMessage as any).update({
      where: { id: msgId },
      data: { body: text.trim(), editedAt: new Date() },
    });

    this.chatGateway.emitChatMessageEdited(updated);

    return {
      id: updated.id,
      threadId: updated.threadId,
      text: updated.body ?? '',
      senderRole: isAuthorAsSeller ? 'SELLER' : 'BUYER',
      editedAt: updated.editedAt ? new Date(updated.editedAt).toISOString() : null,
      isDeleted: false,
      createdAt: new Date(updated.createdAt).toISOString(),
    };
  }

  // PATCH /api/v1/chat/messages/:id/report
  @Patch('chat/messages/:id/report')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('BUYER', 'SELLER')
  async reportMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') messageId: string,
  ): Promise<void> {
    const ids = await this.resolveBothProfileIds(user.sub);

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: { id: true, thread: { select: { buyerId: true, sellerId: true } } },
    });

    if (!message) {
      throw new DomainException(ErrorCode.THREAD_NOT_FOUND, 'Message not found', HttpStatus.NOT_FOUND);
    }

    const { buyerId, sellerId } = message.thread;
    const isParticipant =
      (!!ids.buyerProfileId && ids.buyerProfileId === buyerId) ||
      (!!ids.sellerProfileId && ids.sellerProfileId === sellerId);

    if (!isParticipant) {
      throw new DomainException(ErrorCode.FORBIDDEN, 'Not a participant', HttpStatus.FORBIDDEN);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma.chatMessage as any).update({
      where: { id: messageId },
      data: { reportedAt: new Date() },
    });

    this.logger.warn(`Message ${messageId} reported by user ${user.sub}`);
  }

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  // GET /api/v1/admin/chat/threads
  @Get('admin/chat/threads')
  @Roles('ADMIN')
  async adminListThreads(
    @Query('page') page = 1,
    @Query('limit') limit = 30,
    @Query('status') status?: 'OPEN' | 'CLOSED',
  ) {
    const allowedStatuses = ['OPEN', 'CLOSED'];
    const where = status && allowedStatuses.includes(status) ? { status } : {};
    const [threads, total] = await Promise.all([
      this.prisma.chatThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          buyer: { include: { user: { select: { phone: true } } } },
          seller: { include: { store: { select: { name: true, slug: true } } } },
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.chatThread.count({ where }),
    ]);

    return {
      data: threads.map((t) => ({
        id: t.id,
        status: t.status,
        threadType: t.threadType,
        lastMessageAt: t.lastMessageAt,
        storeName: t.seller?.store?.name ?? null,
        storeSlug: t.seller?.store?.slug ?? null,
        buyerPhone: t.buyer?.user?.phone ?? null,
        lastMessage: t.messages[0]?.body ?? null,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  // GET /api/v1/admin/chat/threads/:id/messages
  @Get('admin/chat/threads/:id/messages')
  @Roles('ADMIN')
  async adminGetMessages(@Param('id') threadId: string) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        buyer: { include: { user: { select: { phone: true } } } },
        seller: { include: { store: { select: { name: true } } } },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!thread) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Thread not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: thread.id,
      status: thread.status,
      storeName: thread.seller?.store?.name ?? null,
      buyerPhone: thread.buyer?.user?.phone ?? null,
      messages: thread.messages.map((m) => ({
        id: m.id,
        senderUserId: m.senderUserId,
        body: m.body,
        createdAt: m.createdAt,
      })),
    };
  }

  // DELETE /api/v1/admin/chat/threads/:id
  @Delete('admin/chat/threads/:id')
  @Roles('ADMIN')
  async adminDeleteThread(@Param('id') threadId: string) {
    const thread = await this.prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Thread not found', HttpStatus.NOT_FOUND);
    }
    await this.prisma.chatMessage.deleteMany({ where: { threadId } });
    await this.prisma.chatThread.delete({ where: { id: threadId } });
    return { success: true };
  }

  // GET /api/v1/admin/chat/reports
  @Get('admin/chat/reports')
  @Roles('ADMIN')
  async adminGetReports() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = await (this.prisma.chatMessage as any).findMany({
      where: { reportedAt: { not: null } },
      orderBy: { reportedAt: 'desc' },
      take: 200,
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
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (messages as any[]).map((m) => ({
      id: m.id,
      body: m.body ?? '',
      reportedAt: m.reportedAt,
      createdAt: m.createdAt,
      threadId: m.thread.id,
      threadStatus: m.thread.status,
      buyerPhone: m.thread.buyer?.user?.phone ?? null,
      storeName: m.thread.seller?.store?.name ?? null,
    }));
  }

  // DELETE /api/v1/admin/chat/messages/:id/report  (dismiss report)
  @Delete('admin/chat/messages/:id/report')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  async adminDismissReport(@Param('id') messageId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.prisma.chatMessage as any).update({
      where: { id: messageId },
      data: { reportedAt: null },
    });
    this.logger.log(`Report dismissed for message ${messageId}`);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Returns buyerId and/or sellerId (profile IDs, not user IDs) based on role.
   * For ADMIN: resolves whichever profiles exist on the user account.
   */
  private async resolveParticipant(
    userId: string,
    role: string,
  ): Promise<{ buyerId?: string; sellerId?: string }> {
    // Для list-my-threads (read-only): soft-резолв. Если профиля ещё нет —
    // use-case вернёт пустой список вместо 422. Это нормально для нового юзера,
    // который зашёл в "Чаты" до первой покупки или до создания магазина.
    if (role === 'BUYER') {
      const user = await this.usersRepo.findById(userId);
      return { buyerId: user?.buyer?.id };
    }

    if (role === 'SELLER') {
      const seller = await this.sellersRepo.findByUserId(userId);
      if (seller?.isBlocked) {
        throw new DomainException(
          ErrorCode.SELLER_BLOCKED,
          'Seller account is blocked',
          HttpStatus.FORBIDDEN,
        );
      }
      return { sellerId: seller?.id };
    }

    // ADMIN or dual-role: resolve profiles from DB directly
    const user = await this.usersRepo.findById(userId);
    return {
      buyerId: user?.buyer?.id,
      sellerId: user?.seller?.id,
    };
  }

  /**
   * Возвращает ОБА профиля юзера (buyer + seller). Юзер участвует в треде если
   * thread.buyerId === buyerProfileId ИЛИ thread.sellerId === sellerProfileId.
   * Это устраняет 403 когда JWT.role=BUYER, а thread на самом деле seller-thread юзера
   * (или наоборот) — JWT хранит одну активную роль, а профилей у юзера может быть два.
   */
  private async resolveBothProfileIds(
    userId: string,
  ): Promise<{ buyerProfileId?: string; sellerProfileId?: string }> {
    const user = await this.usersRepo.findById(userId);
    return {
      buyerProfileId: user?.buyer?.id,
      sellerProfileId: user?.seller?.id,
    };
  }

  /**
   * Returns a single `participantId` for message access checks (write paths).
   * Для read-only endpoints используй resolveBothProfileIds.
   */
  private async resolveParticipantId(
    userId: string,
    role: string,
  ): Promise<{ participantId: string }> {
    if (role === 'BUYER') {
      return { participantId: await this.resolveBuyerId(userId) };
    }

    if (role === 'SELLER') {
      return { participantId: await this.resolveSellerProfileId(userId) };
    }

    // ADMIN: try buyer first, then seller
    const user = await this.usersRepo.findById(userId);
    const profileId = user?.buyer?.id ?? user?.seller?.id;
    if (!profileId) {
      throw new DomainException(
        ErrorCode.FORBIDDEN,
        'No buyer or seller profile found for this account',
        HttpStatus.FORBIDDEN,
      );
    }
    return { participantId: profileId };
  }

  private async resolveBuyerId(userId: string): Promise<string> {
    const user = await this.usersRepo.findById(userId);

    if (!user?.buyer) {
      throw new DomainException(
        ErrorCode.BUYER_NOT_IDENTIFIED,
        'Buyer profile not found',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return user.buyer.id;
  }

  private async resolveSellerProfileId(userId: string): Promise<string> {
    const seller = await this.sellersRepo.findByUserId(userId);

    if (!seller) {
      throw new DomainException(
        ErrorCode.NOT_FOUND,
        'Seller profile not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (seller.isBlocked) {
      throw new DomainException(
        ErrorCode.SELLER_BLOCKED,
        'Seller account is blocked',
        HttpStatus.FORBIDDEN,
      );
    }

    return seller.id;
  }
}
