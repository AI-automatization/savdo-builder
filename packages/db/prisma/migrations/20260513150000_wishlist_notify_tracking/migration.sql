-- MARKETING-WISHLIST-NOTIFY-001: snapshots + nudge tracking для wishlist items.
--
-- priceSnapshot    — цена при добавлении (snapshot для детекции price-drop)
-- inStockSnapshot  — был ли товар в наличии при добавлении (back-in-stock)
-- notifiedAt       — когда последний раз нотифицировали (idempotency)
-- notifiedReason   — что нотифицировали (PRICE_DROP / BACK_IN_STOCK)
--
-- ADD nullable — safe для прода (INV prod-data-safety):
-- существующие записи получают NULL, cron не нотифицирует их пока не
-- будет «снимка». Это правильное поведение (не нудим о старом state).

ALTER TABLE "buyer_wishlist_items"
  ADD COLUMN IF NOT EXISTS "priceSnapshot"   DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "inStockSnapshot" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "notifiedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notifiedReason"  TEXT;

CREATE INDEX IF NOT EXISTS "buyer_wishlist_items_notifiedAt_idx"
  ON "buyer_wishlist_items" ("notifiedAt");
