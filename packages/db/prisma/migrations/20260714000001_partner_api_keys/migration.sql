-- PARTNER-API-RAOS-001: партнёрские API-ключи (RAOS → MaxSavdo).
-- ADD-only миграция: новая таблица, существующие данные не затрагиваются.

CREATE TABLE "partner_api_keys" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partner_api_keys_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_api_keys_keyHash_key" ON "partner_api_keys"("keyHash");

CREATE INDEX "partner_api_keys_storeId_idx" ON "partner_api_keys"("storeId");

ALTER TABLE "partner_api_keys" ADD CONSTRAINT "partner_api_keys_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
