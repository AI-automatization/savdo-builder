-- Phase: super-admin RBAC + MFA + refunds

-- 1) AdminUser расширение: RBAC role + TOTP MFA + login tracking
ALTER TABLE "admin_users"
  ADD COLUMN "adminRole"    TEXT      NOT NULL DEFAULT 'admin',
  ADD COLUMN "mfaSecret"    TEXT,
  ADD COLUMN "mfaEnabled"   BOOLEAN   NOT NULL DEFAULT false,
  ADD COLUMN "mfaEnabledAt" TIMESTAMP(3),
  ADD COLUMN "lastLoginAt"  TIMESTAMP(3),
  ADD COLUMN "lastLoginIp"  TEXT;

CREATE INDEX "admin_users_adminRole_idx" ON "admin_users"("adminRole");

-- 2) OrderRefund: история возвратов средств
CREATE TABLE "order_refunds" (
  "id"               TEXT          NOT NULL,
  "orderId"          TEXT          NOT NULL,
  "adminId"          TEXT          NOT NULL,
  "amount"           DECIMAL(12,2) NOT NULL,
  "reason"           TEXT          NOT NULL,
  "notes"            TEXT,
  "returnedToWallet" BOOLEAN       NOT NULL DEFAULT false,
  "status"           TEXT          NOT NULL DEFAULT 'completed',
  "createdAt"        TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "order_refunds_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "order_refunds"
  ADD CONSTRAINT "order_refunds_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_refunds"
  ADD CONSTRAINT "order_refunds_adminId_fkey"
  FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "order_refunds_orderId_idx"   ON "order_refunds"("orderId");
CREATE INDEX "order_refunds_adminId_idx"   ON "order_refunds"("adminId");
CREATE INDEX "order_refunds_createdAt_idx" ON "order_refunds"("createdAt");
