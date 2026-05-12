-- FEAT-008: ProductReview model + denormalized aggregates on products

-- 1. ProductReview table
CREATE TABLE "product_reviews" (
    "id"          TEXT        NOT NULL,
    "productId"   TEXT        NOT NULL,
    "buyerId"     TEXT        NOT NULL,
    "orderItemId" TEXT        NOT NULL,
    "rating"      INTEGER     NOT NULL,
    "comment"     TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey"          PRIMARY KEY ("id"),
    CONSTRAINT "product_reviews_rating_check"  CHECK ("rating" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "product_reviews_orderItemId_key"
  ON "product_reviews"("orderItemId");
CREATE INDEX "product_reviews_productId_createdAt_idx"
  ON "product_reviews"("productId", "createdAt" DESC);
CREATE INDEX "product_reviews_buyerId_idx"
  ON "product_reviews"("buyerId");

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_buyerId_fkey"
  FOREIGN KEY ("buyerId") REFERENCES "buyers"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_reviews"
  ADD CONSTRAINT "product_reviews_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Денормализованные агрегаты на products — обновляются в use-case при insert/delete review
ALTER TABLE "products"
  ADD COLUMN "avgRating"   DECIMAL(3, 2),
  ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
