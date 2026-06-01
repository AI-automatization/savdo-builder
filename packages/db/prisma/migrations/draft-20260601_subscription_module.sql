-- DRAFT migration for SUBSCRIPTION-MODULE-001
-- Это reference SQL — НЕ запускать руками.
-- Полат: запусти `pnpm --filter db prisma migrate dev --name add_subscription_module`
-- (из packages/db с DATABASE_URL в env) — Prisma сгенерирует канонический файл
-- migrations/<timestamp>_add_subscription_module/migration.sql и применит на dev.
-- На prod: pg_dump → migrate deploy → smoke test.
--
-- Безопасность: 4 новых enum'а + 2 новые таблицы + 2 nullable relations.
-- ADD-only — данных в existing таблицах не трогает. Соответствует prod-data-safety.

-- ─── Enums ──────────────────────────────────────────────────────────

CREATE TYPE "SubscriptionTier" AS ENUM ('STARTER', 'PRO', 'BUSINESS');

CREATE TYPE "SubscriptionStatus" AS ENUM (
  'TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CHURNED', 'CANCELLED'
);

CREATE TYPE "SubscriptionPaymentMethod" AS ENUM (
  'MANUAL_TRANSFER', 'CLICK', 'PAYME', 'COMP'
);

CREATE TYPE "SubscriptionPaymentStatus" AS ENUM (
  'PENDING', 'CONFIRMED', 'REFUNDED', 'FAILED'
);

-- ─── subscriptions ──────────────────────────────────────────────────

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "tier" "SubscriptionTier" NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "trialStartedAt" TIMESTAMP(3),
  "trialEndsAt" TIMESTAMP(3),
  "currentPeriodStart" TIMESTAMP(3),
  "currentPeriodEnd" TIMESTAMP(3),
  "graceEndsAt" TIMESTAMP(3),
  "suspendedAt" TIMESTAMP(3),
  "churnedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "autoRenew" BOOLEAN NOT NULL DEFAULT false,
  "discountPercent" INTEGER NOT NULL DEFAULT 0,
  "discountEndsAt" TIMESTAMP(3),
  "discountReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscriptions_sellerId_key" ON "subscriptions"("sellerId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_currentPeriodEnd_idx" ON "subscriptions"("currentPeriodEnd");
CREATE INDEX "subscriptions_graceEndsAt_idx" ON "subscriptions"("graceEndsAt");
CREATE INDEX "subscriptions_trialEndsAt_idx" ON "subscriptions"("trialEndsAt");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_sellerId_fkey"
  FOREIGN KEY ("sellerId") REFERENCES "sellers"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── subscription_payments ──────────────────────────────────────────

CREATE TABLE "subscription_payments" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "amountUzs" INTEGER NOT NULL,
  "method" "SubscriptionPaymentMethod" NOT NULL,
  "status" "SubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "notes" TEXT,
  "externalId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_payments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscription_payments_subscriptionId_idx" ON "subscription_payments"("subscriptionId");
CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments"("status");

ALTER TABLE "subscription_payments"
  ADD CONSTRAINT "subscription_payments_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_payments"
  ADD CONSTRAINT "subscription_payments_confirmedByUserId_fkey"
  FOREIGN KEY ("confirmedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Backfill: для existing sellers создать TRIAL subscription ──────
-- Это идеально делается через app-level seed script, но для прода можно SQL.
-- ОПАСНО: запустить ОДИН раз, проверить что нет duplicates.
-- Альтернатива: API endpoint POST /admin/subscriptions/backfill-trials.
--
-- INSERT INTO "subscriptions" (id, "sellerId", tier, status, "trialStartedAt", "trialEndsAt", "createdAt", "updatedAt")
-- SELECT
--   gen_random_uuid()::text,
--   s.id,
--   'PRO'::"SubscriptionTier",
--   'TRIAL'::"SubscriptionStatus",
--   NOW(),
--   NOW() + INTERVAL '14 days',
--   NOW(),
--   NOW()
-- FROM sellers s
-- WHERE s."isBlocked" = false
--   AND NOT EXISTS (SELECT 1 FROM subscriptions sub WHERE sub."sellerId" = s.id);
