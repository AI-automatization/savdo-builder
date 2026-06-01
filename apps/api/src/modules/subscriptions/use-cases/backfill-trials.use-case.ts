import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AdminRepository } from '../../admin/repositories/admin.repository';
import { DEFAULT_TRIAL_TIER, TRIAL_DAYS } from '../plan-config';

/**
 * BackfillTrialsUseCase — одноразовая операция после деплоя BILLING-MACHINE-001.
 * Создаёт TRIAL-подписку для всех существующих non-blocked sellers у которых её ещё нет.
 * Idempotent: повторный вызов не создаст дубликаты (unique constraint на sellerId).
 *
 * Стратегия: один SQL INSERT через raw для performance — обрабатывает сотни sellers
 * одним statement без N*2 round-trips через Prisma.
 *
 * Endpoint: POST /admin/subscriptions/backfill (subscription:moderate).
 */
@Injectable()
export class BackfillTrialsUseCase {
  private readonly logger = new Logger(BackfillTrialsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminRepo: AdminRepository,
  ) {}

  async execute(adminUserId: string): Promise<{ created: number }> {
    const now = new Date();
    const trialEnds = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    // gen_random_uuid() из pgcrypto — есть в стандартной Postgres 13+ инсталляции.
    // Если расширение не активно — Prisma поднимает ошибку, fallback: использовать
    // через app-level loop. Для savdo-builder на Railway Postgres — оно есть.
    const created = await this.prisma.$executeRaw`
      INSERT INTO "subscriptions"
        ("id", "sellerId", "tier", "status", "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
      SELECT
        gen_random_uuid()::text,
        s."id",
        ${DEFAULT_TRIAL_TIER}::"SubscriptionTier",
        'TRIAL'::"SubscriptionStatus",
        ${now},
        ${trialEnds},
        ${now},
        ${now}
      FROM "sellers" s
      WHERE s."isBlocked" = false
        AND NOT EXISTS (
          SELECT 1 FROM "subscriptions" sub WHERE sub."sellerId" = s."id"
        )
    `;

    await this.adminRepo.writeAuditLog({
      actorUserId: adminUserId,
      action: 'SUBSCRIPTION_BACKFILL_TRIALS',
      entityType: 'Subscription',
      entityId: 'batch',
      payload: {
        createdCount: Number(created),
        trialEndsAt: trialEnds.toISOString(),
        tier: DEFAULT_TRIAL_TIER,
      },
    });

    this.logger.log(`Backfill trials: created ${created} subscriptions, trialEnds=${trialEnds.toISOString()}`);
    return { created: Number(created) };
  }
}
