import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionPaymentsRepository } from '../repositories/subscription-payments.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * CompSubscriptionUseCase — admin даёт seller'у N месяцев бесплатно.
 * Кейсы: grandfathered beta cohort, реферал-бонус, маркетинговая компенсация.
 * Создаёт SubscriptionPayment с method=COMP, amount=0, переводит в ACTIVE.
 * Audit: SUBSCRIPTION_COMPED.
 */
@Injectable()
export class CompSubscriptionUseCase {
  private readonly logger = new Logger(CompSubscriptionUseCase.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly paymentsRepo: SubscriptionPaymentsRepository,
    private readonly adminRepo: AdminRepository,
    private readonly storesRepo: StoresRepository,
  ) {}

  async execute(
    adminUserId: string,
    subscriptionId: string,
    data: { tier: SubscriptionTier; months: number; reason: string },
  ) {
    if (data.months < 1 || data.months > 36) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'months must be between 1 and 36',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!data.reason || data.reason.trim().length < 3) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'reason is required (min 3 chars)',
        HttpStatus.BAD_REQUEST,
      );
    }
    const subscription = await this.subscriptionsRepo.findById(subscriptionId);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const now = new Date();
    const periodStart = subscription.currentPeriodEnd && subscription.currentPeriodEnd > now
      ? subscription.currentPeriodEnd
      : now;
    const periodEnd = new Date(periodStart.getTime() + data.months * 30 * 24 * 60 * 60 * 1000);

    const payment = await this.paymentsRepo.create({
      subscriptionId,
      amountUzs: 0,
      method: 'COMP',
      status: 'CONFIRMED',
      periodStart,
      periodEnd,
      confirmedByUserId: adminUserId,
      confirmedAt: now,
      notes: `COMP: ${data.reason}`,
    });

    const updated = await this.subscriptionsRepo.update(subscriptionId, {
      tier: data.tier,
      status: 'ACTIVE',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      graceEndsAt: null,
      suspendedAt: null,
      trialEndsAt: null,
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: adminUserId,
      action: 'SUBSCRIPTION_COMPED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      payload: {
        paymentId: payment.id,
        tier: data.tier,
        months: data.months,
        reason: data.reason,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        prevStatus: subscription.status,
      },
    });
    this.logger.log(
      `Subscription ${subscriptionId} comped by admin=${adminUserId}, tier=${data.tier}, months=${data.months}, reason="${data.reason}"`,
    );

    // Reactivate store если был скрыт
    if (subscription.status === 'SUSPENDED' || subscription.status === 'PAST_DUE' || subscription.status === 'CANCELLED') {
      try {
        const store = await this.storesRepo.findBySellerId(subscription.sellerId);
        if (store && store.status === 'APPROVED' && !store.isPublic) {
          await this.storesRepo.update(store.id, { isPublic: true });
          this.logger.log(`Store ${store.id} re-published after COMP grant`);
        }
      } catch (e) {
        this.logger.error(`Failed to re-publish store: ${(e as Error).message}`);
      }
    }

    return { subscription: updated, payment };
  }
}
