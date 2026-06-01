import { Injectable, HttpStatus } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { SellersRepository } from '../../sellers/repositories/sellers.repository';
import { StartTrialUseCase } from './start-trial.use-case';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { PLAN_CONFIG } from '../plan-config';

/**
 * GetCurrentSubscriptionUseCase — выдаёт состояние подписки seller'у.
 * Если у seller нет подписки (новый или существующий без trigger) — auto-start TRIAL.
 * Это закрывает дыру для existing sellers до миграции backfill (BILLING §6).
 */
@Injectable()
export class GetCurrentSubscriptionUseCase {
  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly sellersRepo: SellersRepository,
    private readonly startTrial: StartTrialUseCase,
  ) {}

  async execute(userId: string) {
    const seller = await this.sellersRepo.findByUserId(userId);
    if (!seller) {
      throw new DomainException(ErrorCode.NOT_FOUND, 'Seller not found', HttpStatus.NOT_FOUND);
    }
    const subscription = await this.startTrial.requireOrStart(seller.id);
    const plan = PLAN_CONFIG[subscription.tier];

    const now = Date.now();
    const daysLeft = (() => {
      const target =
        subscription.status === 'TRIAL'
          ? subscription.trialEndsAt
          : subscription.status === 'ACTIVE'
            ? subscription.currentPeriodEnd
            : subscription.status === 'PAST_DUE'
              ? subscription.graceEndsAt
              : null;
      if (!target) return null;
      return Math.max(0, Math.ceil((target.getTime() - now) / (24 * 60 * 60 * 1000)));
    })();

    return {
      id: subscription.id,
      tier: subscription.tier,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      graceEndsAt: subscription.graceEndsAt,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      daysLeft,
      plan: {
        priceUzs: plan.priceUzs,
        annualUzs: plan.annualUzs,
        productsLimit: plan.productsLimit,
        ordersLimitPerMonth: plan.ordersLimitPerMonth,
        features: plan.features,
      },
    };
  }
}
