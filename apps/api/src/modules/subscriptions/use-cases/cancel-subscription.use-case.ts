import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';

/**
 * CancelSubscriptionUseCase — seller или admin отменяет подписку.
 * Phase 1: instant cancel (status = CANCELLED). cancelAtPeriodEnd зарезервирован для Phase 2.
 * Audit: SUBSCRIPTION_CANCELLED.
 */
@Injectable()
export class CancelSubscriptionUseCase {
  private readonly logger = new Logger(CancelSubscriptionUseCase.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly adminRepo: AdminRepository,
  ) {}

  /** Seller сам отменяет (через /seller/subscription/cancel). */
  async executeBySeller(userId: string, reason?: string) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    const subscription = await this.subscriptionsRepo.findBySellerId(seller.id);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.doCancel(seller.userId, subscription.id, subscription.status, {
      reason,
      byRole: 'seller',
    });
  }

  /** Admin отменяет (через /admin/subscriptions/:id/cancel). */
  async executeByAdmin(adminUserId: string, subscriptionId: string, reason: string) {
    const subscription = await this.subscriptionsRepo.findById(subscriptionId);
    if (!subscription) {
      throw new DomainException(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        'Subscription not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.doCancel(adminUserId, subscription.id, subscription.status, {
      reason,
      byRole: 'admin',
    });
  }

  private async doCancel(
    actorUserId: string,
    subscriptionId: string,
    prevStatus: string,
    opts: { reason?: string; byRole: 'seller' | 'admin' },
  ) {
    if (prevStatus === 'CANCELLED' || prevStatus === 'CHURNED') {
      throw new DomainException(
        ErrorCode.INVALID_PLAN_TRANSITION,
        `Already in terminal status=${prevStatus}`,
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.subscriptionsRepo.update(subscriptionId, {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    });
    await this.adminRepo.writeAuditLog({
      actorUserId,
      action: 'SUBSCRIPTION_CANCELLED',
      entityType: 'Subscription',
      entityId: subscriptionId,
      payload: { prevStatus, byRole: opts.byRole, reason: opts.reason ?? null },
    });
    this.logger.log(`Subscription ${subscriptionId} cancelled by ${opts.byRole}=${actorUserId}`);
    return updated;
  }
}
