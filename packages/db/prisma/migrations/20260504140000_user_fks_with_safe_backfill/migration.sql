-- DB-AUDIT-001-01: добавляем FK на User для notification/history таблиц.
-- До миграции: Postgres не проверял userId — могли быть orphan-rows. Перед
-- ADD CONSTRAINT делаем safe backfill.
--
-- Стратегия:
--   * Notification таблицы (in_app, prefs, push, log) — orphan = мусор → DELETE.
--     FK CASCADE: удаление юзера → удаление его уведомлений.
--   * order_status_history.changedByUserId — orphan = SET NULL (сохраняем
--     snapshot истории смены статуса даже если юзер удалён).
--
-- НЕ затронуты в этой миграции:
--   * chat_messages.senderUserId — хранит Buyer.id/Seller.id, не User.id
--     (polymorphic, see DB-AUDIT-001-01 false-positive note).
--   * analytics_events.actorUserId — отдельная миграция после проверки.

-- ─── 1) BACKFILL orphan rows ──────────────────────────────────────────────

DELETE FROM "in_app_notifications"
  WHERE "userId" NOT IN (SELECT "id" FROM "users");

DELETE FROM "notification_preferences"
  WHERE "userId" NOT IN (SELECT "id" FROM "users");

DELETE FROM "push_subscriptions"
  WHERE "userId" NOT IN (SELECT "id" FROM "users");

DELETE FROM "notification_logs"
  WHERE "userId" NOT IN (SELECT "id" FROM "users");

UPDATE "order_status_history"
  SET "changedByUserId" = NULL
  WHERE "changedByUserId" IS NOT NULL
    AND "changedByUserId" NOT IN (SELECT "id" FROM "users");

-- ─── 2) ADD FOREIGN KEYS ──────────────────────────────────────────────────

ALTER TABLE "in_app_notifications"
  ADD CONSTRAINT "in_app_notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_preferences"
  ADD CONSTRAINT "notification_preferences_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "push_subscriptions"
  ADD CONSTRAINT "push_subscriptions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_logs"
  ADD CONSTRAINT "notification_logs_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_status_history"
  ADD CONSTRAINT "order_status_history_changedByUserId_fkey"
  FOREIGN KEY ("changedByUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── 3) Index for new FK on order_status_history ──────────────────────────

CREATE INDEX IF NOT EXISTS "order_status_history_changedByUserId_idx"
  ON "order_status_history"("changedByUserId");
