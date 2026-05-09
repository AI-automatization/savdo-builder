-- DB-AUDIT-002 part 2 (09.05.2026): String -> Enum для Cart.status и
-- OrderRefund.status. Раньше значения хардкодились в комментарии и
-- размазаны строками в коде — теперь typesafe Prisma enum.
--
-- ⚠️ HOTFIX 09.05.2026 23:30 GMT+5: первая версия упала в проде с P3009.
-- Миграция переписана идемпотентной — каждый шаг под guard'ом
-- (CREATE TYPE через DO/EXCEPTION duplicate_object, ALTER COLUMN TYPE
-- только если столбец ещё text). Безопасно повторно запустить.
--
-- Если миграция в _prisma_migrations всё ещё в статусе failed:
--   pnpm --filter db exec prisma migrate resolve --rolled-back 20260509233000_cart_refund_status_enums
-- (запустить против прод-БД, потом передеплоить).

-- ──────────────────────────────────────────────────────────────────
-- 1) CartStatus
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "CartStatus" AS ENUM ('ACTIVE', 'CONVERTED', 'MERGED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'carts'
      AND column_name  = 'status'
      AND data_type    IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE "carts" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE "carts"
        ALTER COLUMN "status" TYPE "CartStatus"
        USING (CASE LOWER(TRIM(COALESCE("status", '')))
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

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'order_refunds'
      AND column_name  = 'status'
      AND data_type    IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE "order_refunds" ALTER COLUMN "status" DROP DEFAULT';
    EXECUTE $sql$
      ALTER TABLE "order_refunds"
        ALTER COLUMN "status" TYPE "RefundStatus"
        USING (CASE LOWER(TRIM(COALESCE("status", '')))
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
