-- PERF-API-001: композитный индекс под hot path списков товаров одного магазина
-- (seller list GET /seller/products, storefront магазина):
-- WHERE "storeId" = ? AND "deletedAt" IS NULL ORDER BY "createdAt" DESC.
-- ADD-ONLY: данные не трогаем.
CREATE INDEX IF NOT EXISTS "products_storeId_deletedAt_createdAt_idx"
  ON "products"("storeId", "deletedAt", "createdAt" DESC);
