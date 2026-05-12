-- MARKETING-CART-ABANDONMENT-001: тайминг для cron-ремаркетинга.
--
-- nudgeSentAt — когда отправили последний TG-nudge (не спамим).
-- nudgeCount — сколько раз нудили (для аналитики и cap'а 1-2 раза).
--
-- ADD nullable + default — безопасно для прода (INV prod-data-safety):
-- существующие carts получают NULL/0 без backfill.

ALTER TABLE "carts"
  ADD COLUMN IF NOT EXISTS "nudgeSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nudgeCount"  INTEGER NOT NULL DEFAULT 0;

-- Композитный индекс для cron-сканера:
--   WHERE status='ACTIVE' AND updatedAt < now() - 4h AND nudgeSentAt IS NULL
-- Postgres использует index range scan по leading-key status, затем
-- nudgeSentAt (выбирает NULL быстро), потом фильтрует updatedAt.
CREATE INDEX IF NOT EXISTS "carts_status_nudgeSentAt_updatedAt_idx"
  ON "carts" ("status", "nudgeSentAt", "updatedAt");
