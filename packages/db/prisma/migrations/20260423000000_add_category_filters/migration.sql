-- CreateTable
CREATE TABLE "category_filters" (
    "id" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL,
    "nameUz" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_filters_categorySlug_idx" ON "category_filters"("categorySlug");

-- CreateIndex
CREATE UNIQUE INDEX "category_filters_categorySlug_key_key" ON "category_filters"("categorySlug", "key");
