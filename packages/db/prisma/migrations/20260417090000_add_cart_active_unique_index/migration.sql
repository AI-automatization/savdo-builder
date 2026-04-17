-- Partial unique index: one active cart per buyer per store (INV-C01 enforcement at DB level)
-- NULL buyerId (guest sessions) is excluded from the constraint intentionally.
CREATE UNIQUE INDEX IF NOT EXISTS "carts_active_buyer_store_unique"
ON "carts" ("buyerId", "storeId")
WHERE status = 'active' AND "buyerId" IS NOT NULL;
