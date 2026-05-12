-- DB-AUDIT-002 part 5 (10.05.2026): String -> Enum для ChatMessage.messageType.
-- swap-column паттерн.

DO $$ BEGIN
  CREATE TYPE "ChatMessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM');
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
  WHERE n.nspname = 'public' AND c.relname = 'chat_messages' AND a.attname = 'messageType';

  RAISE NOTICE '[chat-message-type] current: %', col_type;

  IF col_type = 'ChatMessageType' THEN
    EXECUTE 'ALTER TABLE "chat_messages" ALTER COLUMN "messageType" SET DEFAULT ''TEXT''::"ChatMessageType"';
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "chat_messages" ADD COLUMN "messageType_new" "ChatMessageType" DEFAULT ''TEXT''::"ChatMessageType" NOT NULL';
    EXECUTE $sql$
      UPDATE "chat_messages" SET "messageType_new" = CASE LOWER(TRIM(COALESCE("messageType", '')))
        WHEN 'text'   THEN 'TEXT'::"ChatMessageType"
        WHEN 'image'  THEN 'IMAGE'::"ChatMessageType"
        WHEN 'system' THEN 'SYSTEM'::"ChatMessageType"
        ELSE 'TEXT'::"ChatMessageType"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "chat_messages" DROP COLUMN "messageType" CASCADE';
    EXECUTE 'ALTER TABLE "chat_messages" RENAME COLUMN "messageType_new" TO "messageType"';
  ELSE
    RAISE EXCEPTION '[chat-message-type] Unexpected type: %', col_type;
  END IF;
END $$;
