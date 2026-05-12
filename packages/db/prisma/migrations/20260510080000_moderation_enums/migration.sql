-- DB-AUDIT-002 part 3 (10.05.2026): String -> Enum для модерации.
-- ModerationCase.status, ModerationCase.caseType, ModerationAction.actionType
-- раньше были String с lowercase (legacy: 'open', 'verification', 'approve')
-- и UPPERCASE (newer: 'CLOSE', 'REOPEN', 'ASSIGN'). Унификация в enum.
--
-- Использует swap-column паттерн (подтверждённый рабочий после P3018 saga
-- с cart_refund_status_enums — ALTER COLUMN TYPE с USING падает на CASE).
-- Идемпотентно через pg_type.typname проверку.

-- ──────────────────────────────────────────────────────────────────
-- 1) ModerationCaseStatus
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ModerationCaseStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'CLOSED');
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
  WHERE n.nspname = 'public' AND c.relname = 'moderation_cases' AND a.attname = 'status';

  RAISE NOTICE '[migration moderation] moderation_cases.status type: %', col_type;

  IF col_type = 'ModerationCaseStatus' THEN
    EXECUTE 'ALTER TABLE "moderation_cases" ALTER COLUMN "status" SET DEFAULT ''OPEN''::"ModerationCaseStatus"';
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "moderation_cases" ADD COLUMN "status_new" "ModerationCaseStatus" DEFAULT ''OPEN''::"ModerationCaseStatus" NOT NULL';
    EXECUTE $sql$
      UPDATE "moderation_cases" SET "status_new" = CASE LOWER(TRIM(COALESCE("status", '')))
        WHEN 'open'      THEN 'OPEN'::"ModerationCaseStatus"
        WHEN 'in_review' THEN 'IN_REVIEW'::"ModerationCaseStatus"
        WHEN 'closed'    THEN 'CLOSED'::"ModerationCaseStatus"
        ELSE 'OPEN'::"ModerationCaseStatus"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "moderation_cases" DROP COLUMN "status" CASCADE';
    EXECUTE 'ALTER TABLE "moderation_cases" RENAME COLUMN "status_new" TO "status"';
  ELSE
    RAISE EXCEPTION '[migration moderation] Unexpected type for moderation_cases.status: %', col_type;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- 2) ModerationCaseType
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ModerationCaseType" AS ENUM ('VERIFICATION', 'ABUSE', 'MANUAL_REVIEW');
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
  WHERE n.nspname = 'public' AND c.relname = 'moderation_cases' AND a.attname = 'caseType';

  RAISE NOTICE '[migration moderation] moderation_cases.caseType type: %', col_type;

  IF col_type = 'ModerationCaseType' THEN
    -- already enum, no default needed (NOT NULL без default)
    NULL;
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    -- caseType — NOT NULL без default. UPDATE заполнит из старого "caseType".
    EXECUTE 'ALTER TABLE "moderation_cases" ADD COLUMN "caseType_new" "ModerationCaseType"';
    EXECUTE $sql$
      UPDATE "moderation_cases" SET "caseType_new" = CASE LOWER(TRIM(COALESCE("caseType", '')))
        WHEN 'verification'  THEN 'VERIFICATION'::"ModerationCaseType"
        WHEN 'abuse'         THEN 'ABUSE'::"ModerationCaseType"
        WHEN 'manual_review' THEN 'MANUAL_REVIEW'::"ModerationCaseType"
        ELSE 'MANUAL_REVIEW'::"ModerationCaseType"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "moderation_cases" ALTER COLUMN "caseType_new" SET NOT NULL';
    EXECUTE 'ALTER TABLE "moderation_cases" DROP COLUMN "caseType" CASCADE';
    EXECUTE 'ALTER TABLE "moderation_cases" RENAME COLUMN "caseType_new" TO "caseType"';
  ELSE
    RAISE EXCEPTION '[migration moderation] Unexpected type for moderation_cases.caseType: %', col_type;
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────
-- 3) ModerationActionType
-- ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ModerationActionType" AS ENUM (
    'APPROVE', 'REJECT', 'REQUEST_CHANGES', 'ESCALATE',
    'ASSIGN', 'CLOSE', 'REOPEN',
    'HIDE', 'SUSPEND', 'RESTORE', 'BLOCK'
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
  WHERE n.nspname = 'public' AND c.relname = 'moderation_actions' AND a.attname = 'actionType';

  RAISE NOTICE '[migration moderation] moderation_actions.actionType type: %', col_type;

  IF col_type = 'ModerationActionType' THEN
    NULL;
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "moderation_actions" ADD COLUMN "actionType_new" "ModerationActionType"';
    -- Используем UPPER (а не LOWER) потому что в коде уже UPPERCASE для большинства значений
    EXECUTE $sql$
      UPDATE "moderation_actions" SET "actionType_new" = CASE UPPER(TRIM(COALESCE("actionType", '')))
        WHEN 'APPROVE'         THEN 'APPROVE'::"ModerationActionType"
        WHEN 'REJECT'          THEN 'REJECT'::"ModerationActionType"
        WHEN 'REQUEST_CHANGES' THEN 'REQUEST_CHANGES'::"ModerationActionType"
        WHEN 'ESCALATE'        THEN 'ESCALATE'::"ModerationActionType"
        WHEN 'ASSIGN'          THEN 'ASSIGN'::"ModerationActionType"
        WHEN 'CLOSE'           THEN 'CLOSE'::"ModerationActionType"
        WHEN 'REOPEN'          THEN 'REOPEN'::"ModerationActionType"
        WHEN 'HIDE'            THEN 'HIDE'::"ModerationActionType"
        WHEN 'SUSPEND'         THEN 'SUSPEND'::"ModerationActionType"
        WHEN 'RESTORE'         THEN 'RESTORE'::"ModerationActionType"
        WHEN 'BLOCK'           THEN 'BLOCK'::"ModerationActionType"
        ELSE 'CLOSE'::"ModerationActionType"  -- fallback для неизвестных legacy
      END
    $sql$;
    EXECUTE 'ALTER TABLE "moderation_actions" ALTER COLUMN "actionType_new" SET NOT NULL';
    EXECUTE 'ALTER TABLE "moderation_actions" DROP COLUMN "actionType" CASCADE';
    EXECUTE 'ALTER TABLE "moderation_actions" RENAME COLUMN "actionType_new" TO "actionType"';
  ELSE
    RAISE EXCEPTION '[migration moderation] Unexpected type for moderation_actions.actionType: %', col_type;
  END IF;
END $$;
