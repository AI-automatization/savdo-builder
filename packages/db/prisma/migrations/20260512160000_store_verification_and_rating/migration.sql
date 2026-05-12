-- MARKETING-VERIFIED-SELLER-001: trust signals для покупателей на storefront.
--
-- Добавляем 3 поля на Store:
--   • isVerified  — manual флаг от admin (галочка «Verified» в UI)
--   • avgRating   — денормализованный weighted avg из всех product reviews
--   • reviewCount — суммарное количество отзывов по всем товарам магазина
--
-- Все 3 поля additive с DEFAULT/NULL — существующие магазины получают
-- безопасные значения без блокировок. Backfill avgRating/reviewCount ниже —
-- пересчёт из существующих ProductReview.
ALTER TABLE "stores" ADD COLUMN "isVerified"  BOOLEAN          NOT NULL DEFAULT false;
ALTER TABLE "stores" ADD COLUMN "avgRating"   DECIMAL(3, 2)    NULL;
ALTER TABLE "stores" ADD COLUMN "reviewCount" INTEGER          NOT NULL DEFAULT 0;

-- Index для storefront sort (rating DESC NULLS LAST):
CREATE INDEX "stores_isVerified_avgRating_idx" ON "stores" ("isVerified", "avgRating" DESC);

-- Backfill: weighted average по всем продуктам магазина.
-- Σ(product.avgRating × product.reviewCount) / Σ(product.reviewCount).
-- Если у магазина 0 отзывов — avgRating остаётся NULL, reviewCount = 0.
UPDATE "stores" s
SET
  "avgRating" = sub."weightedAvg",
  "reviewCount" = sub."totalReviews"
FROM (
  SELECT
    p."storeId" AS store_id,
    SUM(p."reviewCount") AS "totalReviews",
    CASE
      WHEN SUM(p."reviewCount") > 0
      THEN ROUND(
        SUM(p."avgRating" * p."reviewCount")::numeric / SUM(p."reviewCount"),
        2
      )
      ELSE NULL
    END AS "weightedAvg"
  FROM "products" p
  WHERE p."reviewCount" > 0 AND p."deletedAt" IS NULL
  GROUP BY p."storeId"
) sub
WHERE s."id" = sub.store_id;
