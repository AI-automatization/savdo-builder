-- ISVISIBLE-SEMANTICS-001: разделить billing enforcement от seller intent.
-- isPublic = seller хочет/не хочет показывать магазин.
-- isSuspendedByBilling = платформа скрыла из-за просроченной подписки.
-- ADD с DEFAULT false — безопасно, существующие строки получают false.

ALTER TABLE "stores"
  ADD COLUMN "isSuspendedByBilling" BOOLEAN NOT NULL DEFAULT false;

-- Index для storefront hot-path:
-- WHERE "isPublic" = true AND "isSuspendedByBilling" = false AND "status" = 'APPROVED'
CREATE INDEX "stores_public_not_suspended_idx"
  ON "stores" ("isPublic", "isSuspendedByBilling")
  WHERE "isPublic" = true AND "isSuspendedByBilling" = false;
