-- DB-AUDIT-001: добавлены недостающие индексы под hot-path запросы.
-- Schema drift: AdminUser MFA-поля и OrderRefund таблица существовали в DB,
-- но schema.prisma не отражала их (код использовал prisma as any). Эта
-- миграция добавляет ТОЛЬКО индексы — поля уже существуют с
-- 20260503020000_super_admin_rbac_mfa_refunds.

-- 1. media_files.bucket — used in migration filter & proxy resolve
CREATE INDEX IF NOT EXISTS "media_files_bucket_idx" ON "media_files"("bucket");

-- 2. chat_threads.status — used in admin chat list filter
CREATE INDEX IF NOT EXISTS "chat_threads_status_idx" ON "chat_threads"("status");
