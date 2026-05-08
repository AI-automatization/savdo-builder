-- StoreDirection: many-to-many между Store и GlobalCategory.
-- Заменяет single primaryGlobalCategoryId — продавец может выбрать несколько направлений.

CREATE TABLE "store_directions" (
    "storeId"          TEXT        NOT NULL,
    "globalCategoryId" TEXT        NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_directions_pkey" PRIMARY KEY ("storeId", "globalCategoryId")
);

CREATE INDEX "store_directions_globalCategoryId_idx"
  ON "store_directions"("globalCategoryId");

ALTER TABLE "store_directions"
  ADD CONSTRAINT "store_directions_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "stores"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "store_directions"
  ADD CONSTRAINT "store_directions_globalCategoryId_fkey"
  FOREIGN KEY ("globalCategoryId") REFERENCES "global_categories"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: переносим existing primaryGlobalCategoryId в новую таблицу.
INSERT INTO "store_directions" ("storeId", "globalCategoryId")
SELECT "id", "primaryGlobalCategoryId"
FROM "stores"
WHERE "primaryGlobalCategoryId" IS NOT NULL
  AND "deletedAt" IS NULL
ON CONFLICT DO NOTHING;
