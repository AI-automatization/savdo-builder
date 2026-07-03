import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MfaEnforcedGuard } from '../../common/guards/mfa-enforced.guard';
import { AdminPermissionGuard } from '../../common/guards/admin-permission.guard';
import { AdminAccessGuard } from '../../common/guards/admin-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminPermission } from '../../common/decorators/admin-permission.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { DomainException } from '../../common/exceptions/domain.exception';
import { ErrorCode } from '../../shared/constants/error-codes';

import { AdminRepository } from './repositories/admin.repository';
import { SubscriptionsRepository } from '../subscriptions/repositories/subscriptions.repository';
import { MarkPaidUseCase } from '../subscriptions/use-cases/mark-paid.use-case';
import { ExtendTrialUseCase } from '../subscriptions/use-cases/extend-trial.use-case';
import { CancelSubscriptionUseCase } from '../subscriptions/use-cases/cancel-subscription.use-case';
import { CompSubscriptionUseCase } from '../subscriptions/use-cases/comp-subscription.use-case';
import { BackfillTrialsUseCase } from '../subscriptions/use-cases/backfill-trials.use-case';
import { BetaGrandfatherUseCase } from '../subscriptions/use-cases/beta-grandfather.use-case';
import { MarkPaidDto } from '../subscriptions/dto/mark-paid.dto';
import { ExtendTrialDto } from '../subscriptions/dto/extend-trial.dto';
import { CancelSubscriptionDto } from '../subscriptions/dto/cancel-subscription.dto';
import { CompSubscriptionDto } from '../subscriptions/dto/comp-subscription.dto';

/**
 * Admin-facing subscriptions API.
 * BILLING-MACHINE-001 — list, mark paid, extend trial, cancel.
 */
@ApiTags('admin')
@ApiBearerAuth('jwt')
@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard, AdminAccessGuard, MfaEnforcedGuard, AdminPermissionGuard)
@Roles('ADMIN')
export class AdminSubscriptionsController {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly markPaid: MarkPaidUseCase,
    private readonly extendTrial: ExtendTrialUseCase,
    private readonly cancel: CancelSubscriptionUseCase,
    private readonly comp: CompSubscriptionUseCase,
    private readonly backfill: BackfillTrialsUseCase,
    private readonly betaGrandfather: BetaGrandfatherUseCase,
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

  @Get()
  async list(
    @Query('status') status: string | undefined,
    @Query('tier') tier: string | undefined,
    @Query('sellerId') sellerId: string | undefined,
    @Query('page') page: string | undefined,
    @Query('limit') limit: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    const validStatus = status && (['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CHURNED', 'CANCELLED'] as const).includes(status as SubscriptionStatus)
      ? (status as SubscriptionStatus)
      : undefined;
    const validTier = tier && (['FREE', 'PRO', 'STUDIO'] as const).includes(tier as SubscriptionTier)
      ? (tier as SubscriptionTier)
      : undefined;
    const result = await this.subscriptionsRepo.findAllAdmin({
      status: validStatus,
      tier: validTier,
      sellerId: sellerId || undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    const now = Date.now();
    const items = result.items.map((sub) => {
      const target =
        sub.status === 'TRIAL' ? sub.trialEndsAt
        : sub.status === 'ACTIVE' ? sub.currentPeriodEnd
        : sub.status === 'PAST_DUE' ? sub.graceEndsAt
        : null;
      const daysLeft = target ? Math.max(0, Math.ceil((target.getTime() - now) / 86_400_000)) : null;
      return { ...sub, daysLeft };
    });
    return { ...result, items };
  }

  @Get(':id')
  async detail(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    const subscription = await this.subscriptionsRepo.findById(id);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const now = Date.now();
    const target =
      subscription.status === 'TRIAL' ? subscription.trialEndsAt
      : subscription.status === 'ACTIVE' ? subscription.currentPeriodEnd
      : subscription.status === 'PAST_DUE' ? subscription.graceEndsAt
      : null;
    const daysLeft = target ? Math.max(0, Math.ceil((target.getTime() - now) / 86_400_000)) : null;
    return { ...subscription, daysLeft };
  }

  @Post(':id/mark-paid')
  @AdminPermission('subscription:moderate')
  async markPaidEndpoint(
    @Param('id') id: string,
    @Body() dto: MarkPaidDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.markPaid.execute(user.sub, id, {
      tier: dto.tier,
      amountUzs: dto.amountUzs,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
      method: dto.method,
      notes: dto.notes,
    });
  }

  @Post(':id/extend-trial')
  @AdminPermission('subscription:moderate')
  async extendTrialEndpoint(
    @Param('id') id: string,
    @Body() dto: ExtendTrialDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.extendTrial.execute(user.sub, id, { days: dto.days, reason: dto.reason });
  }

  @Post(':id/cancel')
  @AdminPermission('subscription:moderate')
  async cancelEndpoint(
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.cancel.executeByAdmin(user.sub, id, dto.reason ?? 'admin-action');
  }

  /** Admin grant N months free (beta cohort / migration / referral). */
  @Post(':id/comp')
  @AdminPermission('subscription:moderate')
  async compEndpoint(
    @Param('id') id: string,
    @Body() dto: CompSubscriptionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.requireAdmin(user);
    return this.comp.execute(user.sub, id, {
      tier: dto.tier,
      months: dto.months,
      reason: dto.reason,
    });
  }

  /**
   * Одноразовая операция backfill: TRIAL для всех existing sellers без подписки.
   * Idempotent (повторный вызов вернёт {created: 0}). Используется один раз после
   * деплоя BILLING-MACHINE-001 на prod.
   */
  @Post('backfill')
  @AdminPermission('subscription:moderate')
  async backfillEndpoint(@CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    return this.backfill.execute(user.sub);
  }

  /**
   * BIZ-DECISIONS-§15 (2026-06-14): Beta grandfather — все продавцы получают
   * tier=PRO ACTIVE бесплатно до 01.09.2026.
   * Idempotent UPSERT — безопасно вызывать повторно.
   * CHURNED-продавцы не затрагиваются.
   */
  @Post('beta-grandfather')
  @AdminPermission('subscription:moderate')
  async betaGrandfatherEndpoint(@CurrentUser() user: JwtPayload) {
    await this.requireAdmin(user);
    return this.betaGrandfather.execute(user.sub);
  }
}
