import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { SubscriptionTier, SubscriptionPaymentMethod } from '@prisma/client';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SubscriptionPaymentsRepository } from '../repositories/subscription-payments.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * MarkPaidUseCase — Phase 1 ручное подтверждение оплаты админом.
 * Создаёт SubscriptionPayment + переключает Subscription в ACTIVE с новым периодом.
 * Audit log: SUBSCRIPTION_PAYMENT_CONFIRMED.
 */
@Injectable()
export class MarkPaidUseCase {
  private readonly logger = new Logger(MarkPaidUseCase.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly paymentsRepo: SubscriptionPaymentsRepository,
    private readonly adminRepo: AdminRepository,
    private readonly storesRepo: StoresRepository,
  ) {}

  async execute(
    adminUserId: string,
    subscriptionId: string,
    data: {
      tier: SubscriptionTier;
      amountUzs: number;
      periodStart: Date;
      periodEnd: Date;
      method?: SubscriptionPaymentMethod;
      notes?: string;
    },
  ) {
    const subscription = await this.subscriptionsRepo.findById(subscriptionId);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (data.periodStart >= data.periodEnd) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'periodStart must be before periodEnd',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Создаём подтверждённый платёж
    const payment = await this.paymentsRepo.create({
      subscriptionId,
      amountUzs: data.amountUzs,
      method: data.method ?? 'MANUAL_TRANSFER',
      status: 'CONFIRMED',
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      confirmedByUserId: adminUserId,
      confirmedAt: new Date(),
      notes: data.notes,
    });

    // Переключаем подписку в ACTIVE
    const updated = await this.subscriptionsRepo.update(subscriptionId, {
      tier: data.tier,
      status: 'ACTIVE',
      currentPeriodStart: data.periodStart,
      currentPeriodEnd: data.periodEnd,
      // Сбрасываем grace/suspended если были (PAST_DUE → ACTIVE, SUSPENDED → ACTIVE)
      graceEndsAt: null,
      suspendedAt: null,
      // Сбрасываем trial-окончание (он уже отыгран)
      trialEndsAt: null,
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: adminUserId,
      action: 'SUBSCRIPTION_PAYMENT_CONFIRMED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      payload: {
        paymentId: payment.id,
        tier: data.tier,
        amountUzs: data.amountUzs,
        periodStart: data.periodStart.toISOString(),
        periodEnd: data.periodEnd.toISOString(),
        method: data.method ?? 'MANUAL_TRANSFER',
        prevStatus: subscription.status,
      },
    });
    this.logger.log(
      `Subscription ${subscriptionId} marked paid by admin=${adminUserId}, tier=${data.tier}, period=${data.periodStart.toISOString()}..${data.periodEnd.toISOString()}`,
    );

    // ISVISIBLE-SEMANTICS-001: сбрасываем isSuspendedByBilling (не трогаем isPublic).
    // isPublic — намерение продавца; isSuspendedByBilling — billing enforcement.
    if (subscription.status === 'SUSPENDED' || subscription.status === 'PAST_DUE' || subscription.status === 'CANCELLED') {
      try {
        const store = await this.storesRepo.findBySellerId(subscription.sellerId);
        if (store && store.isSuspendedByBilling) {
          await this.storesRepo.update(store.id, { isSuspendedByBilling: false });
          this.logger.log(`Store ${store.id} billing-unsuspended after subscription reactivation`);
        }
      } catch (e) {
        this.logger.error(`Failed to billing-unsuspend store for seller=${subscription.sellerId}: ${(e as Error).message}`);
      }
    }

    return { subscription: updated, payment };
  }
}
