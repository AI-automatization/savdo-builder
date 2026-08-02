import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * ExtendTrialUseCase — admin продлевает триал на N дней (например при beta-онбординге).
 * Допустимо для TRIAL и PAST_DUE (если прошёл триал, не оплатил — даём ещё шанс).
 * Audit: SUBSCRIPTION_TRIAL_EXTENDED.
 */
@Injectable()
export class ExtendTrialUseCase {
  private readonly logger = new Logger(ExtendTrialUseCase.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly adminRepo: AdminRepository,
  ) {}

  async execute(adminUserId: string, subscriptionId: string, data: { days: number; reason?: string }) {
    if (data.days < 1 || data.days > 365) {
      throw new DomainException(
        ErrorCode.VALIDATION_ERROR,
        'days must be between 1 and 365',
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
    if (subscription.status !== 'TRIAL' && subscription.status !== 'PAST_DUE') {
      throw new DomainException(
        ErrorCode.INVALID_PLAN_TRANSITION,
        `Cannot extend trial from status=${subscription.status}`,
        HttpStatus.CONFLICT,
      );
    }

    const baseDate = subscription.trialEndsAt ?? new Date();
    const newTrialEnd = new Date(baseDate.getTime() + data.days * 24 * 60 * 60 * 1000);

    const updated = await this.subscriptionsRepo.update(subscriptionId, {
      status: 'TRIAL',
      trialEndsAt: newTrialEnd,
      graceEndsAt: null, // если был past_due, сбрасываем grace
    });

    await this.adminRepo.writeAuditLog({
      actorUserId: adminUserId,
      action: 'SUBSCRIPTION_TRIAL_EXTENDED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      payload: {
        days: data.days,
        reason: data.reason ?? null,
        prevTrialEnd: subscription.trialEndsAt?.toISOString() ?? null,
        newTrialEnd: newTrialEnd.toISOString(),
        prevStatus: subscription.status,
      },
    });
    this.logger.log(
      `Trial extended for sub=${subscriptionId} by ${data.days}d to ${newTrialEnd.toISOString()} (admin=${adminUserId})`,
    );

    return updated;
  }
}
