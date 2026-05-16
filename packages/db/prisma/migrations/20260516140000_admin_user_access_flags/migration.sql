-- SEC-ADMIN-ACCESS-MODEL стадия A — флаги доступа AdminUser.
--
-- 1. isSuperadmin: опасный @default(true) → false. Существующие строки НЕ
--    меняются (ALTER COLUMN SET DEFAULT влияет только на новые INSERT).
-- 2. isActive: мягкая блокировка админа без удаления строки. ADD COLUMN с
--    константным DEFAULT в Postgres 11+ — мгновенно, без перезаписи таблицы;
--    все существующие админы получают isActive = true.
--
-- prod-data-safety: обе операции Expand-safe — без потери данных.

ALTER TABLE "admin_users" ALTER COLUMN "isSuperadmin" SET DEFAULT false;

ALTER TABLE "admin_users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
