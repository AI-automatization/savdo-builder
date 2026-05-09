-- DB-AUDIT-002 part 2 — String -> Enum для Cart.status и OrderRefund.status.
--
-- ⚠️ HOTFIX v4 (09.05.2026 23:55 GMT+5):
-- v1-v3 падали с "operator does not exist: CartStatus = text" в ALTER COLUMN
-- TYPE с USING-выражением — не нашёл рабочую форму с CASE/COALESCE.
-- v4 использует bulletproof swap-column паттерн:
--   1) ADD COLUMN status_new <enum>
--   2) UPDATE с CASE (UPDATE работает корректно с обоими типами)
--   3) DROP старой колонки + RENAME новой + recreate index
-- Это стандартная идиома PG для проблемных type-conversions.
--
-- Идемпотентно: проверяет реальный underlying тип колонки через pg_type.
-- Если уже enum — только переустанавливает default. Если text/varchar — swap.

-- ──────────────────────────────────────────────────────────────────
-- 1) CartStatus
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'MERGED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
DECLARE col_type text;
BEGIN
  SELECT t.typname INTO col_type
  FROM pg_attribute a
  JOIN pg_class c     ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t      ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'carts' AND a.attname = 'status';

  RAISE NOTICE '[migration v4] carts.status current type: %', col_type;

  IF col_type = 'CartStatus' THEN
    -- Уже сконвертирована (v1 успел до crash) — только default переставим
    EXECUTE 'ALTER TABLE "carts" ALTER COLUMN "status" SET DEFAULT ''ACTIVE''::"CartStatus"';
    RAISE NOTICE '[migration v4] carts.status уже CartStatus, default переустановлен';
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    RAISE NOTICE '[migration v4] carts.status = %, конвертирую через swap', col_type;

    EXECUTE 'ALTER TABLE "carts" ADD COLUMN "status_v4_new" "CartStatus" DEFAULT ''ACTIVE''::"CartStatus" NOT NULL';
    EXECUTE $sql$
      UPDATE "carts" SET "status_v4_new" = CASE LOWER(TRIM(COALESCE("status", '')))
        WHEN 'active'    THEN 'ACTIVE'::"CartStatus"
        WHEN 'converted' THEN 'CONVERTED'::"CartStatus"
        WHEN 'merged'    THEN 'MERGED'::"CartStatus"
        WHEN 'expired'   THEN 'EXPIRED'::"CartStatus"
        ELSE 'ACTIVE'::"CartStatus"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "carts" DROP COLUMN "status" CASCADE';
    EXECUTE 'ALTER TABLE "carts" RENAME COLUMN "status_v4_new" TO "status"';
    -- Recreate index (drop column кэшем убил старый)
    EXECUTE 'CREATE INDEX IF NOT EXISTS "carts_status_idx" ON "carts"("status")';
    RAISE NOTICE '[migration v4] carts.status: swap done';
  ELSE
    RAISE EXCEPTION '[migration v4] Unexpected type for carts.status: %', col_type;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- 2) RefundStatus
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
DECLARE col_type text;
BEGIN
  SELECT t.typname INTO col_type
  FROM pg_attribute a
  JOIN pg_class c     ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t      ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'order_refunds' AND a.attname = 'status';

  RAISE NOTICE '[migration v4] order_refunds.status current type: %', col_type;

  IF col_type = 'RefundStatus' THEN
    EXECUTE 'ALTER TABLE "order_refunds" ALTER COLUMN "status" SET DEFAULT ''COMPLETED''::"RefundStatus"';
    RAISE NOTICE '[migration v4] order_refunds.status уже RefundStatus';
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    RAISE NOTICE '[migration v4] order_refunds.status = %, конвертирую через swap', col_type;

    EXECUTE 'ALTER TABLE "order_refunds" ADD COLUMN "status_v4_new" "RefundStatus" DEFAULT ''COMPLETED''::"RefundStatus" NOT NULL';
    EXECUTE $sql$
      UPDATE "order_refunds" SET "status_v4_new" = CASE LOWER(TRIM(COALESCE("status", '')))
        WHEN 'pending'   THEN 'PENDING'::"RefundStatus"
        WHEN 'completed' THEN 'COMPLETED'::"RefundStatus"
        WHEN 'failed'    THEN 'FAILED'::"RefundStatus"
        WHEN 'reversed'  THEN 'REVERSED'::"RefundStatus"
        ELSE 'COMPLETED'::"RefundStatus"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "order_refunds" DROP COLUMN "status" CASCADE';
    EXECUTE 'ALTER TABLE "order_refunds" RENAME COLUMN "status_v4_new" TO "status"';
    RAISE NOTICE '[migration v4] order_refunds.status: swap done';
  ELSE
    RAISE EXCEPTION '[migration v4] Unexpected type for order_refunds.status: %', col_type;
  END IF;
END $$;
