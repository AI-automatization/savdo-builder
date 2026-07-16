-- SELLER-PAYMENT-REQUISITES-001: реквизиты оплаты продавца (checkout MANUAL_TRANSFER).
-- ADD-only миграция: nullable колонки + булевы с дефолтами, данные не затрагиваются.

ALTER TABLE "stores" ADD COLUMN "paymentCardNumber" TEXT;
ALTER TABLE "stores" ADD COLUMN "paymentCardHolder" TEXT;
ALTER TABLE "stores" ADD COLUMN "paymentClickLink" TEXT;
ALTER TABLE "stores" ADD COLUMN "paymentPaymeLink" TEXT;
ALTER TABLE "stores" ADD COLUMN "acceptsCash" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "stores" ADD COLUMN "acceptsCardTransfer" BOOLEAN NOT NULL DEFAULT false;
