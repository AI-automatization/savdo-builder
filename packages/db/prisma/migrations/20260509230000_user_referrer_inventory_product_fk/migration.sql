-- DB-AUDIT-002 (09.05.2026): добавлены отсутствующие FK на User.referredBy
-- (self-reference для referral-программы) и InventoryMovement.productId.
-- Без них orphan-данные не валидировались — referredBy мог указывать на
-- удалённого юзера, productId — на удалённый продукт.

-- ─────────────────────────────────────────────────────────────────
-- 1) User.referredBy → users(id) self-FK (SET NULL on delete)
-- ─────────────────────────────────────────────────────────────────

-- Очистка orphan: если referredBy указывает на несуществующего юзера, обнуляем.
UPDATE "users" u
   SET "referredBy" = NULL
 WHERE u."referredBy" IS NOT NULL
   AND NOT EXISTS (
     SELECT 1 FROM "users" r WHERE r.id = u."referredBy"
   );

ALTER TABLE "users"
  ADD CONSTRAINT "users_referredBy_fkey"
  FOREIGN KEY ("referredBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "users_referredBy_idx" ON "users"("referredBy");

-- ─────────────────────────────────────────────────────────────────
-- 2) InventoryMovement.product_id → products(id) (RESTRICT on delete)
-- ─────────────────────────────────────────────────────────────────

-- Очистка orphan: удаляем движения склада, ссылающиеся на несуществующие
-- продукты (не должно быть в норме, но FK без backfill упадёт если есть).
DELETE FROM "inventory_movements" m
 WHERE NOT EXISTS (
   SELECT 1 FROM "products" p WHERE p.id = m."productId"
 );

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "inventory_movements_productId_idx" ON "inventory_movements"("productId");
