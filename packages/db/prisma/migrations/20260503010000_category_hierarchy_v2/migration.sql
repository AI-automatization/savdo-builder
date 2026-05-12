-- Phase 3: Расширение GlobalCategory до 4-уровневой иерархии
-- (Отрасль → Категория → Подкатегория → Тип товара)

ALTER TABLE "global_categories"
  ADD COLUMN "level"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isLeaf"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "iconEmoji" TEXT;

CREATE INDEX "global_categories_level_idx"  ON "global_categories"("level");
CREATE INDEX "global_categories_isLeaf_idx" ON "global_categories"("isLeaf");

-- CategoryFilter: добавить isRequired + isFilterable
ALTER TABLE "category_filters"
  ADD COLUMN "isRequired"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isFilterable" BOOLEAN NOT NULL DEFAULT true;

-- Product: добавить attributesJson (JSONB) для значений характеристик
ALTER TABLE "products"
  ADD COLUMN "attributesJson" JSONB;

-- GIN-индекс для быстрого фильтра по JSON-атрибутам в каталоге
CREATE INDEX "products_attributesJson_gin_idx" ON "products" USING GIN ("attributesJson" jsonb_path_ops);
