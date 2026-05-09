import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
import { GetSystemHealthUseCase } from './use-cases/get-system-health.use-case';
import { MigrateTgMediaToR2UseCase } from './use-cases/migrate-tg-media-to-r2.use-case';

/**
 * AdminOpsController — devops/sysadmin утилиты.
 *
 * Subdomain: system health probe, feature flags read-only view, разовые
 * batch-операции вроде миграции TG-медиа в R2/Supabase.
 *
 * Public routes /admin/system/* и /admin/media/* unchanged.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminOpsController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly getSystemHealthUseCase: GetSystemHealthUseCase,
    private readonly migrateTgMediaUseCase: MigrateTgMediaToR2UseCase,
  ) {}

  private async requireAdmin(user: JwtPayload) {
    const adminUser = await this.adminRepo.findAdminByUserId(user.sub);
    if (!adminUser) {
      throw new DomainException(
        ErrorCode.ADMIN_NOT_FOUND,
        'Admin record not found for this user',
        HttpStatus.FORBIDDEN,
      );
    }
    return adminUser;
  }

  // ── System Health (DevOps Dashboard) ─────────────────────────────────────
  @Get('system/health')
  async getSystemHealth() {
    return this.getSystemHealthUseCase.execute();
  }

  // ── Feature flags (read-only view of process.env) ───────────────────────
  @Get('system/feature-flags')
  async getFeatureFlags() {
    return {
      flags: [
        { key: 'CHAT_ENABLED',                     label: 'Чат',                     value: process.env.CHAT_ENABLED !== 'false',                      envOverridable: true },
        { key: 'STORE_APPROVAL_REQUIRED',          label: 'Модерация магазинов',     value: process.env.STORE_APPROVAL_REQUIRED !== 'false',           envOverridable: true },
        { key: 'TELEGRAM_NOTIFICATIONS_ENABLED',   label: 'Уведомления Telegram',    value: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false',    envOverridable: true },
        { key: 'DEV_OTP_ENABLED',                  label: 'DEV OTP (код в логах)',   value: process.env.DEV_OTP_ENABLED === 'true',                    envOverridable: true },
        { key: 'OTP_REQUIRED_FOR_CHECKOUT',        label: 'OTP при оформлении',      value: process.env.OTP_REQUIRED_FOR_CHECKOUT === 'true',          envOverridable: true },
        { key: 'PAYMENT_ONLINE_ENABLED',           label: 'Онлайн-платежи',          value: process.env.PAYMENT_ONLINE_ENABLED === 'true',             envOverridable: true },
        { key: 'ANALYTICS_ENABLED',                label: 'Аналитика',                value: process.env.ANALYTICS_ENABLED !== 'false',                 envOverridable: true },
        { key: 'WEB_PUSH_ENABLED',                 label: 'Web Push',                value: process.env.WEB_PUSH_ENABLED === 'true',                   envOverridable: true },
        { key: 'MOBILE_PUSH_ENABLED',              label: 'Mobile Push',             value: process.env.MOBILE_PUSH_ENABLED === 'true',                envOverridable: true },
        { key: 'SMS_FALLBACK_ENABLED',             label: 'SMS Fallback (запрещён)', value: false, envOverridable: false, locked: true, reason: 'SMS/Eskiz запрещены законом РУз' },
        { key: 'SELLER_INSIGHTS_ENABLED',          label: 'Seller Insights',         value: process.env.SELLER_INSIGHTS_ENABLED === 'true',            envOverridable: true },
        { key: 'PRODUCT_IMAGE_ATTACHMENT_ENABLED', label: 'Фото к товарам',          value: process.env.PRODUCT_IMAGE_ATTACHMENT_ENABLED !== 'false',  envOverridable: true },
      ],
      note: 'Изменение feature flag требует перезапуска api. Через UI пока read-only — переменные задаются в Railway → Variables.',
    };
  }

  // ── Media migration (TG → Supabase) ─────────────────────────────────────
  // API-MEDIA-MIGRATION-TG-TO-R2-001: разово/батчами вытащить старые TG-фото
  // и залить в Supabase. См. comment в use-case для контекста.
  @Post('media/migrate-tg-to-r2')
  @AdminPermission('media:migrate')
  async migrateTgMediaToR2(
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    const parsedLimit = limit ? Number(limit) : 50;
    const result = await this.migrateTgMediaUseCase.execute(parsedLimit);
    await this.adminRepo.writeAuditLog({
      actorUserId: user.sub,
      action: 'media.migrate.tg_to_r2',
      entityType: 'media',
      entityId: 'batch',
      payload: { limit: parsedLimit, ...result },
    });
    return result;
  }
}
