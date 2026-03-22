import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { ListNotificationLogsDto } from './dto/list-notification-logs.dto';
import { ListInboxDto } from './dto/list-inbox.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { GetNotificationLogsUseCase } from './use-cases/get-notification-logs.use-case';
import { GetPreferencesUseCase } from './use-cases/get-preferences.use-case';
import { UpdatePreferenceUseCase } from './use-cases/update-preference.use-case';
import { GetInboxUseCase } from './use-cases/get-inbox.use-case';
import { MarkInboxReadUseCase } from './use-cases/mark-inbox-read.use-case';
import { MarkAllInboxReadUseCase } from './use-cases/mark-all-inbox-read.use-case';
import { DeleteInboxNotificationUseCase } from './use-cases/delete-inbox-notification.use-case';
import { NotificationRepository } from './repositories/notification.repository';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private readonly getNotificationLogsUseCase: GetNotificationLogsUseCase,
    private readonly getPreferencesUseCase: GetPreferencesUseCase,
    private readonly updatePreferenceUseCase: UpdatePreferenceUseCase,
    private readonly getInboxUseCase: GetInboxUseCase,
    private readonly markInboxReadUseCase: MarkInboxReadUseCase,
    private readonly markAllInboxReadUseCase: MarkAllInboxReadUseCase,
    private readonly deleteInboxNotificationUseCase: DeleteInboxNotificationUseCase,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  // ─────────────────────────────────────────────
  // Delivery log routes (existing)
  // ─────────────────────────────────────────────

  // GET /api/v1/notifications
  // Returns paginated delivery log for the authenticated user.
  // Supports optional filters: channel, eventType, deliveryStatus.
  @Get()
  async getLogs(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListNotificationLogsDto,
  ) {
    return this.getNotificationLogsUseCase.execute({
      userId: user.sub,
      query,
    });
  }

  // GET /api/v1/notifications/preferences
  // Returns the user's current channel preferences.
  @Get('preferences')
  async getPreferences(@CurrentUser() user: JwtPayload) {
    return this.getPreferencesUseCase.execute(user.sub);
  }

  // PUT /api/v1/notifications/preferences
  // Upserts the user's channel preferences.
  @Put('preferences')
  async updatePreferences(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.updatePreferenceUseCase.execute({
      userId: user.sub,
      dto,
    });
  }

  // ─────────────────────────────────────────────
  // In-app inbox routes (new)
  // ─────────────────────────────────────────────

  // GET /api/v1/notifications/inbox
  // Returns the paginated in-app inbox for the authenticated user.
  // Query params: unreadOnly?, page?, limit?
  @Get('inbox')
  async getInbox(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListInboxDto,
  ) {
    return this.getInboxUseCase.execute({ userId: user.sub, query });
  }

  // GET /api/v1/notifications/inbox/unread-count
  // Returns the number of unread in-app notifications for the user.
  @Get('inbox/unread-count')
  async getUnreadCount(@CurrentUser() user: JwtPayload): Promise<{ count: number }> {
    const count = await this.notificationRepo.countUnread(user.sub);
    return { count };
  }

  // PATCH /api/v1/notifications/inbox/read-all
  // Marks all in-app notifications as read for the authenticated user.
  // Must be declared before /:id to avoid NestJS route shadowing.
  @Patch('inbox/read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.markAllInboxReadUseCase.execute(user.sub);
  }

  // PATCH /api/v1/notifications/inbox/:id/read
  // Marks a single in-app notification as read.
  @Patch('inbox/:id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markOneRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.markInboxReadUseCase.execute({ id, userId: user.sub });
  }

  // DELETE /api/v1/notifications/inbox/:id
  // Deletes a single in-app notification owned by the authenticated user.
  @Delete('inbox/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    await this.deleteInboxNotificationUseCase.execute({ id, userId: user.sub });
  }
}
