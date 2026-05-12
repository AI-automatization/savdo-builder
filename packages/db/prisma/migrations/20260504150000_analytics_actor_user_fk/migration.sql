-- DB-AUDIT-001-01 phase 2: FK на User для analytics_events.actorUserId.
-- ON DELETE SET NULL — analytics это append-only история, snapshot должен
-- сохраняться даже если юзер удалён.

-- Backfill orphan rows: SET NULL для несуществующих userId
UPDATE "analytics_events"
  SET "actorUserId" = NULL
  WHERE "actorUserId" IS NOT NULL
    AND "actorUserId" NOT IN (SELECT "id" FROM "users");

-- Add FK constraint
ALTER TABLE "analytics_events"
  ADD CONSTRAINT "analytics_events_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
