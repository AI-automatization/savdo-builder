-- DB-AUDIT-002 part 6 (10.05.2026): String -> Enum для InAppNotification.type.
-- Legacy значения с точками/snake_case ('order.status_changed', 'store.approved')
-- маппятся в UPPERCASE_SNAKE_CASE (Prisma enum не поддерживает точки в идентификаторах).
-- swap-column паттерн.

DO $$ BEGIN
  CREATE TYPE "InAppNotificationType" AS ENUM (
    'ORDER_STATUS_CHANGED',
    'STORE_APPROVED',
    'STORE_REJECTED',
    'NEW_ORDER',
    'NEW_MESSAGE',
    'SELLER_VERIFIED',
    'MODERATION_ACTION',
    'GENERIC'
  );
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
  WHERE n.nspname = 'public' AND c.relname = 'in_app_notifications' AND a.attname = 'type';

  RAISE NOTICE '[in-app-notif-type] current: %', col_type;

  IF col_type = 'InAppNotificationType' THEN
    NULL;
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "in_app_notifications" ADD COLUMN "type_new" "InAppNotificationType"';
    -- Маппинг legacy dotted/snake-case -> enum
    EXECUTE $sql$
      UPDATE "in_app_notifications" SET "type_new" = CASE LOWER(TRIM(COALESCE("type", '')))
        WHEN 'order.status_changed' THEN 'ORDER_STATUS_CHANGED'::"InAppNotificationType"
        WHEN 'order_status_changed' THEN 'ORDER_STATUS_CHANGED'::"InAppNotificationType"
        WHEN 'store.approved'       THEN 'STORE_APPROVED'::"InAppNotificationType"
        WHEN 'store_approved'       THEN 'STORE_APPROVED'::"InAppNotificationType"
        WHEN 'store.rejected'       THEN 'STORE_REJECTED'::"InAppNotificationType"
        WHEN 'store_rejected'       THEN 'STORE_REJECTED'::"InAppNotificationType"
        WHEN 'new_order'            THEN 'NEW_ORDER'::"InAppNotificationType"
        WHEN 'new_message'          THEN 'NEW_MESSAGE'::"InAppNotificationType"
        WHEN 'seller.verified'      THEN 'SELLER_VERIFIED'::"InAppNotificationType"
        WHEN 'seller_verified'      THEN 'SELLER_VERIFIED'::"InAppNotificationType"
        WHEN 'moderation.action'    THEN 'MODERATION_ACTION'::"InAppNotificationType"
        WHEN 'moderation_action'    THEN 'MODERATION_ACTION'::"InAppNotificationType"
        ELSE 'GENERIC'::"InAppNotificationType"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "in_app_notifications" ALTER COLUMN "type_new" SET NOT NULL';
    EXECUTE 'ALTER TABLE "in_app_notifications" DROP COLUMN "type" CASCADE';
    EXECUTE 'ALTER TABLE "in_app_notifications" RENAME COLUMN "type_new" TO "type"';
  ELSE
    RAISE EXCEPTION '[in-app-notif-type] Unexpected type: %', col_type;
  END IF;
END $$;
