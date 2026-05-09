-- DB-AUDIT-002 part 2 (09.05.2026): String -> Enum для Cart.status и
-- OrderRefund.status. Раньше значения хардкодились в комментарии и
-- размазаны строками в коде — теперь typesafe Prisma enum.
--
-- ⚠️ HOTFIX v3 (09.05.2026 23:45 GMT+5):
-- v1 упал по неизвестной причине → состояние БД частичное (enum уже
-- создан, колонка возможно частично сконвертирована).
-- v2 (idempotent через information_schema.data_type) тоже упал —
-- 'CartStatus' = text при COALESCE("status", '') в USING-выражении.
-- v3 чинит:
--   1) проверка реального типа через pg_type.typname (надёжнее чем
--      information_schema.data_type который возвращает USER-DEFINED для enum)
--   2) `"status"::text` каст в COALESCE — работает и когда колонка text,
--      и когда уже CartStatus
--   3) обёртка в EXCEPTION на случай если состояние уже консистентное

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
  WHERE n.nspname = 'public'
    AND c.relname = 'carts'
    AND a.attname = 'status';

  IF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "carts" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE "carts"
        ALTER COLUMN "status" TYPE "CartStatus"
        USING (CASE LOWER(TRIM(COALESCE("status"::text, '')))
          WHEN 'active'    THEN 'ACTIVE'::"CartStatus"
          WHEN 'converted' THEN 'CONVERTED'::"CartStatus"
          WHEN 'merged'    THEN 'MERGED'::"CartStatus"
          WHEN 'expired'   THEN 'EXPIRED'::"CartStatus"
          ELSE 'ACTIVE'::"CartStatus"
        END)
    $sql$;
    EXECUTE 'ALTER TABLE "carts" ALTER COLUMN "status" SET DEFAULT ''ACTIVE''::"CartStatus"';
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
  WHERE n.nspname = 'public'
    AND c.relname = 'order_refunds'
    AND a.attname = 'status';

  IF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "order_refunds" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE "order_refunds"
        ALTER COLUMN "status" TYPE "RefundStatus"
        USING (CASE LOWER(TRIM(COALESCE("status"::text, '')))
          WHEN 'pending'   THEN 'PENDING'::"RefundStatus"
          WHEN 'completed' THEN 'COMPLETED'::"RefundStatus"
          WHEN 'failed'    THEN 'FAILED'::"RefundStatus"
          WHEN 'reversed'  THEN 'REVERSED'::"RefundStatus"
          ELSE 'COMPLETED'::"RefundStatus"
        END)
    $sql$;
    EXECUTE 'ALTER TABLE "order_refunds" ALTER COLUMN "status" SET DEFAULT ''COMPLETED''::"RefundStatus"';
  END IF;
END $$;
