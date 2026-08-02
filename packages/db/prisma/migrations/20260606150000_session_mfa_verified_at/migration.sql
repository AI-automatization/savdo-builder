-- API-ADMIN-MFA-PERSIST-001: add mfaVerifiedAt to user_sessions.
-- Solves: refresh-session всегда выставляет mfaPending=true для admin → каждый
-- destructive action в admin panel требует новый MFA challenge.
-- Fix: при успешном /admin/auth/mfa/login сохраняем timestamp в session.
-- refresh-session выдаёт чистый JWT если session.mfaVerifiedAt не старее
-- MFA_GRACE_HOURS (default 8h).

ALTER TABLE "user_sessions"
ADD COLUMN "mfaVerifiedAt" TIMESTAMP(3);

-- Индекс не нужен — поле читается только при refresh по уже найденному session.id.
