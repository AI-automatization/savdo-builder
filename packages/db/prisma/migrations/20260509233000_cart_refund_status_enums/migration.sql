-- DB-AUDIT-002 part 2 (09.05.2026): String -> Enum для Cart.status и
-- OrderRefund.status. Раньше значения хардкодились в комментарии и
-- размазаны строками в коде — теперь typesafe Prisma enum.

-- ──────────────────────────────────────────────────────────────────
-- 1) CartStatus
-- ──────────────────────────────────────────────────────────────────

CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'MERGED', 'EXPIRED');

-- Снимаем default чтобы можно было поменять тип колонки
ALTER TABLE "carts" ALTER COLUMN "status" DROP DEFAULT;

-- Конверсия lowercase -> UPPERCASE через USING expression
ALTER TABLE "carts"
  ALTER COLUMN "status" TYPE "CartStatus"
  USING (CASE LOWER("status")
    WHEN 'active'    THEN 'ACTIVE'::"CartStatus"
    WHEN 'converted' THEN 'CONVERTED'::"CartStatus"
    WHEN 'merged'    THEN 'MERGED'::"CartStatus"
    WHEN 'expired'   THEN 'EXPIRED'::"CartStatus"
    ELSE 'ACTIVE'::"CartStatus"
  END);

ALTER TABLE "carts" ALTER COLUMN "status" SET DEFAULT 'ACTIVE'::"CartStatus";

-- ──────────────────────────────────────────────────────────────────
-- 2) RefundStatus
-- ──────────────────────────────────────────────────────────────────

CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

ALTER TABLE "order_refunds" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "order_refunds"
  ALTER COLUMN "status" TYPE "RefundStatus"
  USING (CASE LOWER("status")
    WHEN 'pending'   THEN 'PENDING'::"RefundStatus"
    WHEN 'completed' THEN 'COMPLETED'::"RefundStatus"
    WHEN 'failed'    THEN 'FAILED'::"RefundStatus"
    WHEN 'reversed'  THEN 'REVERSED'::"RefundStatus"
    ELSE 'COMPLETED'::"RefundStatus"
  END);

ALTER TABLE "order_refunds" ALTER COLUMN "status" SET DEFAULT 'COMPLETED'::"RefundStatus";
