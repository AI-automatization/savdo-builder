-- DB-AUDIT-001 P2: composite indexes для горячих запросов.
-- Все индексы создаются обычным CREATE INDEX (не CONCURRENTLY), потому что
-- prisma migrate deploy не поддерживает CONCURRENTLY. На малых таблицах
-- (текущий объём данных) это безопасно. Для prod с миллионами строк надо
-- было бы создавать вручную через psql + CONCURRENTLY.

-- DB-AUDIT-001-03: Product feed (storefront) — WHERE status='ACTIVE' AND deletedAt IS NULL ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "products_status_deletedAt_createdAt_idx"
  ON "products"("status", "deletedAt", "createdAt" DESC);

-- DB-AUDIT-001-06: ProductImage — WHERE productId=? ORDER BY sortOrder ASC
CREATE INDEX IF NOT EXISTS "product_images_productId_sortOrder_idx"
  ON "product_images"("productId", "sortOrder");

-- DB-AUDIT-001-04: Order seller dashboard — WHERE storeId=? [AND status=?] ORDER BY placedAt DESC
CREATE INDEX IF NOT EXISTS "orders_storeId_status_placedAt_idx"
  ON "orders"("storeId", "status", "placedAt" DESC);

-- DB-AUDIT-001-04: Order buyer flow — WHERE buyerId=? [AND status=?] ORDER BY placedAt DESC
CREATE INDEX IF NOT EXISTS "orders_buyerId_status_placedAt_idx"
  ON "orders"("buyerId", "status", "placedAt" DESC);

-- DB-AUDIT-001-05: ChatMessage cursor pagination — WHERE threadId=? AND createdAt < ? ORDER BY createdAt DESC
CREATE INDEX IF NOT EXISTS "chat_messages_threadId_createdAt_idx"
  ON "chat_messages"("threadId", "createdAt" DESC);
