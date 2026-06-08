-- API-STORE-DRAFT-REMOVAL-001: убираем использование DRAFT-статуса у Store.
--
-- Бизнес-решение Polat 08.06.2026: магазины в DRAFT "теряются" — не видны
-- админам в модерации, продавец думает что подал заявку, но никто не проверяет.
-- Новая модель: создание магазина (seller flow) сразу → PENDING_REVIEW.
-- Admin-bypass create-store через AdminCreateStoreUseCase остаётся ACTIVE.
-- Unapprove возвращает в PENDING_REVIEW (не в DRAFT) — повторная проверка.
--
-- enum StoreStatus сохраняется (Postgres не позволяет DROP VALUE из enum без
-- пересборки типа; backend гарантирует что DRAFT больше нигде не записывается).
--
-- Default колонки status меняем DRAFT → PENDING_REVIEW (это применит prisma
-- migrate). Здесь обновляем существующие данные.

BEGIN;

-- 1. Сначала переводим существующие DRAFT в PENDING_REVIEW.
UPDATE "stores"
SET status = 'PENDING_REVIEW'
WHERE status = 'DRAFT';

-- 2. Меняем default колонки чтобы новые INSERT (без явного status) шли
--    сразу в PENDING_REVIEW.
ALTER TABLE "stores"
ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW';

-- 3. API-STORE-MODERATION-NOT-TRIGGERED-001 backfill: для всех магазинов в
--    PENDING_REVIEW, у которых ещё нет открытого moderation case,
--    создаём OPEN VERIFICATION case. Раньше submit-store-for-review только
--    менял status и не дёргал ModerationTrigger — магазины терялись в
--    очереди модерации. Backfill закрывает разрыв для existing данных.
INSERT INTO "moderation_cases" (
  "id", "entityType", "entityId", "caseType", "status", "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  'store',
  s.id,
  'VERIFICATION',
  'OPEN',
  NOW(),
  NOW()
FROM "stores" s
WHERE s.status = 'PENDING_REVIEW'
  AND NOT EXISTS (
    SELECT 1 FROM "moderation_cases" mc
    WHERE mc."entityType" = 'store'
      AND mc."entityId" = s.id
      AND mc.status = 'OPEN'
  );

COMMIT;
