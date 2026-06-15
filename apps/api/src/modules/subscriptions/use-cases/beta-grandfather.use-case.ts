import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AdminRepository } from '../../admin/repositories/admin.repository';

/** Beta grandfather end date — BIZ-DECISIONS-§15 (2026-06-14). */
const GRANDFATHER_ENDS = new Date('2026-09-01T00:00:00.000Z');

/**
 * BetaGrandfatherUseCase — одноразовый батч-comp для beta-когорты.
 * BIZ-DECISIONS-§15: все продавцы в системе на момент запуска получают
 * tier=PRO бесплатно до 01.09.2026.
 *
 * Idempotent UPSERT: повторный вызов не меняет данные если они уже выставлены.
 * Endpoint: POST /admin/subscriptions/beta-grandfather (subscription:moderate).
 *
 * Логика:
 *  - Если у продавца нет подписки → INSERT PRO ACTIVE до 01.09.2026.
 *  - Если есть → UPDATE tier=PRO, status=ACTIVE, currentPeriodEnd=01.09.2026.
 *    Исключение: CHURNED — таких не трогаем (они сами ушли).
 */
@Injectable()
export class BetaGrandfatherUseCase {
  private readonly logger = new Logger(BetaGrandfatherUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly adminRepo: AdminRepository,
  ) {}

  async execute(adminUserId: string): Promise<{ upserted: number }> {
    const now = new Date();

    const upserted = await this.prisma.$executeRaw`
      INSERT INTO "subscriptions"
        ("id", "sellerId", "tier", "status",
         "currentPeriodStart", "currentPeriodEnd",
         "discountPercent", "discountReason",
         "createdAt", "updatedAt")
      SELECT
        gen_random_uuid()::text,
        s."id",
        'PRO'::"SubscriptionTier",
        'ACTIVE'::"SubscriptionStatus",
        ${now},
        ${GRANDFATHER_ENDS},
        100,
        'BETA_GRANDFATHER',
        ${now},
        ${now}
      FROM "sellers" s
      WHERE s."isBlocked" = false
      ON CONFLICT ("sellerId") DO UPDATE SET
        "tier"               = 'PRO'::"SubscriptionTier",
        "status"             = CASE
                                 WHEN EXCLUDED."status" = 'CHURNED'::"SubscriptionStatus"
                                 THEN "subscriptions"."status"
                                 ELSE 'ACTIVE'::"SubscriptionStatus"
                               END,
        "currentPeriodStart" = ${now},
        "currentPeriodEnd"   = GREATEST("subscriptions"."currentPeriodEnd", ${GRANDFATHER_ENDS}),
        "discountPercent"    = 100,
        "discountReason"     = 'BETA_GRANDFATHER',
        "updatedAt"          = ${now}
    `;

    await this.adminRepo.writeAuditLog({
      actorUserId: adminUserId,
      action: 'SUBSCRIPTION_BETA_GRANDFATHER',
      entityType: 'Subscription',
      entityId: 'batch',
      payload: {
        upsertedCount: Number(upserted),
        grandfatherEndsAt: GRANDFATHER_ENDS.toISOString(),
        tier: 'PRO',
      },
    });

    this.logger.log(
      `Beta grandfather: upserted=${upserted} sellers → PRO ACTIVE until ${GRANDFATHER_ENDS.toISOString()}`,
    );
    return { upserted: Number(upserted) };
  }
}
