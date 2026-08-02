import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { StoresRepository } from '../../stores/repositories/stores.repository';
import { GRACE_DAYS } from '../plan-config';

/**
 * ExpireSubscriptionsUseCase — батч-операция cron'а:
 *  - TRIAL → PAST_DUE  (trialEndsAt < now)
 *  - ACTIVE → PAST_DUE (currentPeriodEnd < now)
 *  - PAST_DUE → SUSPENDED (graceEndsAt < now) + store.isPublic = false (TODO: hook)
 *  - SUSPENDED → CHURNED (90d) — отдельный use-case (будущее)
 *
 * Audit: SUBSCRIPTION_AUTO_EXPIRED, SUBSCRIPTION_AUTO_SUSPENDED.
 * Идempotent: можно вызывать несколько раз в сутки — каждый раз обработает только новые.
 *
 * actorUserId = 'system-cron' (не привязан к реальному user — у нас нет system-user в auditLog).
 * NOTE (TODO): добавить user 'system' в users или использовать nullable actorUserId.
 */
@Injectable()
export class ExpireSubscriptionsUseCase {
  private readonly logger = new Logger(ExpireSubscriptionsUseCase.name);

  constructor(
    private readonly subscriptionsRepo: SubscriptionsRepository,
    private readonly adminRepo: AdminRepository,
    private readonly storesRepo: StoresRepository,
  ) {}

  async execute(now: Date = new Date()): Promise<{ trial: number; active: number; suspended: number }> {
    const stats = { trial: 0, active: 0, suspended: 0 };

    // 1. TRIAL → PAST_DUE (никто не оплатил после конца триала)
    const expiredTrials = await this.subscriptionsRepo.findExpiredTrials(now);
    for (const sub of expiredTrials) {
      const graceEndsAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      await this.subscriptionsRepo.update(sub.id, { status: 'PAST_DUE', graceEndsAt });
      this.logger.log(`TRIAL→PAST_DUE: sub=${sub.id} sellerId=${sub.sellerId} graceEnds=${graceEndsAt.toISOString()}`);
      stats.trial += 1;
    }

    // 2. ACTIVE → PAST_DUE (period закончился, не продлили)
    const expiredActive = await this.subscriptionsRepo.findExpiredActive(now);
    for (const sub of expiredActive) {
      const graceEndsAt = new Date(now.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
      await this.subscriptionsRepo.update(sub.id, { status: 'PAST_DUE', graceEndsAt });
      this.logger.log(`ACTIVE→PAST_DUE: sub=${sub.id} sellerId=${sub.sellerId} graceEnds=${graceEndsAt.toISOString()}`);
      stats.active += 1;
    }

    // 3. PAST_DUE → SUSPENDED (grace истёк)
    // ISVISIBLE-SEMANTICS-001: вместо isPublic=false ставим isSuspendedByBilling=true.
    // isPublic остаётся нетронутым — он отражает намерение продавца, а не billing.
    // Storefront фильтр: isPublic=true AND isSuspendedByBilling=false.
    // При реактивации подписки isSuspendedByBilling → false; isPublic не трогаем.
    const expiredGrace = await this.subscriptionsRepo.findExpiredGrace(now);
    for (const sub of expiredGrace) {
      await this.subscriptionsRepo.update(sub.id, { status: 'SUSPENDED', suspendedAt: now });
      try {
        const store = await this.storesRepo.findBySellerId(sub.sellerId);
        if (store && !store.isSuspendedByBilling) {
          await this.storesRepo.update(store.id, { isSuspendedByBilling: true });
          this.logger.log(`Store ${store.id} billing-suspended due to subscription suspension`);
        }
      } catch (e) {
        this.logger.error(`Failed to billing-suspend store for seller=${sub.sellerId}: ${(e as Error).message}`);
      }
      this.logger.log(`PAST_DUE→SUSPENDED: sub=${sub.id} sellerId=${sub.sellerId}`);
      stats.suspended += 1;
    }

    if (stats.trial + stats.active + stats.suspended > 0) {
      this.logger.log(
        `ExpireSubscriptions batch done: trial→past_due=${stats.trial}, active→past_due=${stats.active}, past_due→suspended=${stats.suspended}`,
      );
    }
    return stats;
  }
}
