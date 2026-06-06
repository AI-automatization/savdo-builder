-- API-USER-DELETE-FK-CASCADE-001: user_sessions FK на users должен быть Cascade.
-- Без этого hard-delete user (если когда-то понадобится) падал на FK RESTRICT
-- (PostgresError 23001).
-- Admin db-manager теперь делает soft-delete для users (deletedAt), но эта
-- миграция выравнивает schema → миграционные/seed скрипты и любые ручные
-- hard-delete тоже работают.

ALTER TABLE "user_sessions"
DROP CONSTRAINT "user_sessions_userId_fkey";

ALTER TABLE "user_sessions"
ADD CONSTRAINT "user_sessions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
