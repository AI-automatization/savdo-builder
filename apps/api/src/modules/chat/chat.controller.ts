import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
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
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { GetThreadMessagesUseCase } from './use-cases/get-thread-messages.use-case';
import { ListMyThreadsUseCase } from './use-cases/list-my-threads.use-case';
import { ResolveThreadUseCase } from './use-cases/resolve-thread.use-case';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly prisma: PrismaService,
    private readonly createThreadUseCase: CreateThreadUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getThreadMessagesUseCase: GetThreadMessagesUseCase,
    private readonly listMyThreadsUseCase: ListMyThreadsUseCase,
    private readonly resolveThreadUseCase: ResolveThreadUseCase,
  ) {}

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
  async createThread(@CurrentUser() user: JwtPayload, @Body() dto: CreateThreadDto) {
    const buyerId = await this.resolveBuyerId(user.sub);

    return this.createThreadUseCase.execute({
      buyerId,
      contextType: dto.contextType,
      contextId: dto.contextId,
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
    // Participant check is done inside the use case using userId.
    // The thread stores buyerId (Buyer.id) and sellerId (Seller.id), but
    // participant verification must be done using the User.id stored as
    // senderUserId on messages. For thread access, we resolve the profile id.
    const { participantId } = await this.resolveParticipantId(user.sub, user.role);

    return this.getThreadMessagesUseCase.execute({
      threadId,
      readerUserId: participantId,
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
    const { participantId } = await this.resolveParticipantId(user.sub, user.role);

    return this.sendMessageUseCase.execute({
      threadId,
      senderUserId: participantId,
      text: dto.text,
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

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  // GET /api/v1/admin/chat/threads
  @Get('admin/chat/threads')
  @Roles('ADMIN')
  async adminListThreads(
    @Query('page') page = 1,
    @Query('limit') limit = 30,
    @Query('status') status?: string,
  ) {
    const where = status ? { status } : {};
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

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Returns buyerId and/or sellerId (profile IDs, not user IDs) based on role.
   * For ADMIN: resolves whichever profiles exist on the user account.
   */
  private async resolveParticipant(
    userId: string,
    role: string,
  ): Promise<{ buyerId?: string; sellerId?: string }> {
    if (role === 'BUYER') {
      const buyerId = await this.resolveBuyerId(userId);
      return { buyerId };
    }

    if (role === 'SELLER') {
      const sellerId = await this.resolveSellerProfileId(userId);
      return { sellerId };
    }

    // ADMIN or dual-role: resolve profiles from DB directly
    const user = await this.usersRepo.findById(userId);
    return {
      buyerId: user?.buyer?.id,
      sellerId: user?.seller?.id,
    };
  }

  /**
   * Returns a single `participantId` for message access checks.
   * For ADMIN: prefers buyer profile, falls back to seller.
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
