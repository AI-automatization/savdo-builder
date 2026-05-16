import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';
import { UsersRepository } from '../users/repositories/users.repository';
import { SellersRepository } from '../sellers/repositories/sellers.repository';
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
import { MarkThreadReadUseCase } from './use-cases/mark-thread-read.use-case';
import { DeleteThreadUseCase } from './use-cases/delete-thread.use-case';
import { DeleteMessageUseCase } from './use-cases/delete-message.use-case';
import { EditMessageUseCase } from './use-cases/edit-message.use-case';
import { ReportMessageUseCase } from './use-cases/report-message.use-case';
import { AdminChatUseCases } from './use-cases/admin-chat.use-cases';

@ApiTags('chat')
@ApiBearerAuth('jwt')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard)
export class ChatController {
  constructor(
    private readonly usersRepo: UsersRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly createThreadUseCase: CreateThreadUseCase,
    private readonly createSellerThreadUseCase: CreateSellerThreadUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getThreadMessagesUseCase: GetThreadMessagesUseCase,
    private readonly listMyThreadsUseCase: ListMyThreadsUseCase,
    private readonly resolveThreadUseCase: ResolveThreadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly markThreadReadUseCase: MarkThreadReadUseCase,
    private readonly deleteThreadUseCase: DeleteThreadUseCase,
    private readonly deleteMessageUseCase: DeleteMessageUseCase,
    private readonly editMessageUseCase: EditMessageUseCase,
    private readonly reportMessageUseCase: ReportMessageUseCase,
    private readonly adminChatUseCases: AdminChatUseCases,
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
    // Dual-role: use-case сам резолвит senderUserId по тому, в какой роли
    // юзер участвует в треде.
    const ids = await this.resolveBothProfileIds(user.sub);

    return this.sendMessageUseCase.execute({
      threadId,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
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

    await this.markThreadReadUseCase.execute({
      threadId,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
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

    await this.deleteThreadUseCase.execute({
      threadId,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
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

    await this.deleteMessageUseCase.execute({
      threadId,
      messageId: msgId,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
    });
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
    const ids = await this.resolveBothProfileIds(user.sub);

    return this.editMessageUseCase.execute({
      threadId,
      messageId: msgId,
      text,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
    });
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

    await this.reportMessageUseCase.execute({
      messageId,
      reporterUserId: user.sub,
      buyerProfileId: ids.buyerProfileId,
      sellerProfileId: ids.sellerProfileId,
    });
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
    return this.adminChatUseCases.listThreads({ page, limit, status });
  }

  // GET /api/v1/admin/chat/threads/:id/messages
  @Get('admin/chat/threads/:id/messages')
  @Roles('ADMIN')
  async adminGetMessages(@Param('id') threadId: string) {
    return this.adminChatUseCases.getThreadMessages(threadId);
  }

  // DELETE /api/v1/admin/chat/threads/:id
  @Delete('admin/chat/threads/:id')
  @Roles('ADMIN')
  async adminDeleteThread(@Param('id') threadId: string) {
    return this.adminChatUseCases.deleteThread(threadId);
  }

  // GET /api/v1/admin/chat/reports
  @Get('admin/chat/reports')
  @Roles('ADMIN')
  async adminGetReports() {
    return this.adminChatUseCases.getReports();
  }

  // DELETE /api/v1/admin/chat/messages/:id/report  (dismiss report)
  @Delete('admin/chat/messages/:id/report')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN')
  async adminDismissReport(@Param('id') messageId: string): Promise<void> {
    await this.adminChatUseCases.dismissReport(messageId);
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
