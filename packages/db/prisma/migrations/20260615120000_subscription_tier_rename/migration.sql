-- BILLING-TIER-ENUM-SYNC-001: переименование тарифов по решению BIZ-DECISIONS-§15 (2026-06-14).
--
-- Решения Азима:
--   STARTER → FREE   (был платным 99k, теперь бесплатно навсегда до 50 товаров)
--   BUSINESS → STUDIO (ребрендинг + multi-store 3 магазина)
--   PRO остаётся (149k/мес вместо 299k — только цена меняется в plan-config.ts)
--
-- ALTER TYPE RENAME VALUE безопасен: все существующие строки с этим значением
-- автоматически получают новое имя без UPDATE/миграции данных (Postgres 10+).
-- ADD-only policy соблюдена: данные не теряются.

ALTER TYPE "SubscriptionTier" RENAME VALUE 'STARTER' TO 'FREE';
ALTER TYPE "SubscriptionTier" RENAME VALUE 'BUSINESS' TO 'STUDIO';
