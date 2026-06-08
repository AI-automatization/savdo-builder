-- API-ADMIN-MFA-UI-DEADLOCK-001 / API-ADMIN-MFA-PERSIST-001 backfill.
--
-- Миграция 20260606150000_session_mfa_verified_at добавила колонку
-- `user_sessions.mfaVerifiedAt` без DEFAULT. Все ранее залогиненные admin
-- сессии получили NULL. После redeploy refresh-session.use-case.ts:80-85 видит
-- NULL → выдаёт access с `mfaPending: true` → MfaEnforcedGuard кидает 403 на
-- каждый admin endpoint. UI до фикса 'auth:mfa-required' не редиректил на
-- TOTP-challenge — admin был залочен.
--
-- Этот backfill даёт ОДНОРАЗОВЫЙ grace для уже залогиненных активных админов
-- с включённым MFA. Refresh-токен сам по себе уже требовал прохождения MFA
-- на первом login → давая grace мы не открываем доступ тем, кто его не
-- проходил. После grace (8h) admin обычным образом пройдёт MFA challenge.
--
-- Фильтры:
--   - mfaVerifiedAt IS NULL — только wedged сессии
--   - expiresAt > NOW() — мёртвым refresh всё равно не воскреснет
--   - admin_users.isActive=true — отключённым админам grace не нужен
--   - admin_users.mfaEnabled=true — без MFA grace не имеет смысла
--   - users.deletedAt IS NULL AND status='ACTIVE' — заблокированных пропускаем

BEGIN;

UPDATE user_sessions s
SET "mfaVerifiedAt" = NOW()
WHERE s."mfaVerifiedAt" IS NULL
  AND s."expiresAt" > NOW()
  AND EXISTS (
    SELECT 1
    FROM admin_users a
    JOIN users u ON u.id = a."userId"
    WHERE a."userId" = s."userId"
      AND a."isActive" = true
      AND a."mfaEnabled" = true
      AND u."deletedAt" IS NULL
      AND u.status = 'ACTIVE'
  );

COMMIT;
