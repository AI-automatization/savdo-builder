import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetAdminNotificationsUseCase } from './use-cases/get-admin-notifications.use-case';

/**
 * ADMIN-NOTIFICATIONS-001
 *
 * GET /api/v1/admin/notifications?limit=20
 *   → агрегирует из moderation_cases (OPEN) + orders (PENDING) + stores (PENDING_REVIEW)
 *
 * Без write-path: "прочитанность" хранится в localStorage админ-приложения,
 * потому что одна команда (один superadmin) и нет требования аудита кто-что-видел.
 * Если потребуется — добавим отдельную таблицу AdminNotificationRead(userId, eventId, readAt).
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard)
@Roles('ADMIN')
export class AdminNotificationsController {
  constructor(
    private readonly getAdminNotificationsUseCase: GetAdminNotificationsUseCase,
  ) {}

  @Get()
  async list(@Query('limit') limit?: string) {
    const parsed = limit ? Math.min(Math.max(Number(limit) || 20, 1), 50) : 20;
    return this.getAdminNotificationsUseCase.execute(parsed);
  }
}
