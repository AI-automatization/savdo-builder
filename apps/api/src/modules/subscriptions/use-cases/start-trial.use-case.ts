import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { SubscriptionsRepository } from '../repositories/subscriptions.repository';
import { DomainException } from '../../../common/exceptions/domain.exception';
import { ErrorCode } from '../../../shared/constants/error-codes';
import { DEFAULT_TRIAL_TIER, TRIAL_DAYS } from '../plan-config';

/**
 * StartTrialUseCase — создаёт TRIAL-подписку для seller'а при первом обращении.
 * Вызывается из onboarding (после создания store) или admin'ом для backfill.
 * Idempotent: если подписка уже есть — возвращает существующую без ошибки.
 */
@Injectable()
export class StartTrialUseCase {
  private readonly logger = new Logger(StartTrialUseCase.name);

  constructor(private readonly subscriptionsRepo: SubscriptionsRepository) {}

  async execute(sellerId: string) {
    const existing = await this.subscriptionsRepo.findBySellerId(sellerId);
    if (existing) {
      this.logger.log(`Trial already exists for seller=${sellerId} (status=${existing.status})`);
      return existing;
    }
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const subscription = await this.subscriptionsRepo.create({
      sellerId,
      tier: DEFAULT_TRIAL_TIER,
      status: 'TRIAL',
      trialStartedAt: now,
      trialEndsAt,
    });
    this.logger.log(
      `Trial started for seller=${sellerId} tier=${DEFAULT_TRIAL_TIER} ends=${trialEndsAt.toISOString()}`,
    );
    return subscription;
  }

  /** Защитник от создания подписки без существующего seller (вызывается из use-cases где sellerId уже валиден). */
  async requireOrStart(sellerId: string) {
    const sub = await this.subscriptionsRepo.findBySellerId(sellerId);
    if (sub) return sub;
    return this.execute(sellerId);
  }
}
