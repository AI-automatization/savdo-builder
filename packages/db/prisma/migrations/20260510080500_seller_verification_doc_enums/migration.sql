-- DB-AUDIT-002 part 4 (10.05.2026): String -> Enum для SellerVerificationDocument.
-- Модель пока не используется в коде, но enum сделаем заранее чтобы не было
-- drift'а при будущей разработке.
-- swap-column паттерн (как cart_refund / moderation_enums).

DO $$ BEGIN
  CREATE TYPE "SellerVerificationDocumentType" AS ENUM ('PASSPORT', 'BUSINESS_DOC', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SellerVerificationDocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- documentType
DO $$
DECLARE col_type text;
BEGIN
  SELECT t.typname INTO col_type
  FROM pg_attribute a
  JOIN pg_class c     ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t      ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'seller_verification_documents' AND a.attname = 'documentType';

  RAISE NOTICE '[svd-enums] documentType type: %', col_type;

  IF col_type = 'SellerVerificationDocumentType' THEN
    NULL;
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "seller_verification_documents" ADD COLUMN "documentType_new" "SellerVerificationDocumentType"';
    EXECUTE $sql$
      UPDATE "seller_verification_documents" SET "documentType_new" = CASE LOWER(TRIM(COALESCE("documentType", '')))
        WHEN 'passport'     THEN 'PASSPORT'::"SellerVerificationDocumentType"
        WHEN 'business_doc' THEN 'BUSINESS_DOC'::"SellerVerificationDocumentType"
        WHEN 'other'        THEN 'OTHER'::"SellerVerificationDocumentType"
        ELSE 'OTHER'::"SellerVerificationDocumentType"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "seller_verification_documents" ALTER COLUMN "documentType_new" SET NOT NULL';
    EXECUTE 'ALTER TABLE "seller_verification_documents" DROP COLUMN "documentType" CASCADE';
    EXECUTE 'ALTER TABLE "seller_verification_documents" RENAME COLUMN "documentType_new" TO "documentType"';
  ELSE
    RAISE EXCEPTION '[svd-enums] Unexpected type for documentType: %', col_type;
  END IF;
END $$;

-- status
DO $$
DECLARE col_type text;
BEGIN
  SELECT t.typname INTO col_type
  FROM pg_attribute a
  JOIN pg_class c     ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t      ON t.oid = a.atttypid
  WHERE n.nspname = 'public' AND c.relname = 'seller_verification_documents' AND a.attname = 'status';

  RAISE NOTICE '[svd-enums] status type: %', col_type;

  IF col_type = 'SellerVerificationDocumentStatus' THEN
    EXECUTE 'ALTER TABLE "seller_verification_documents" ALTER COLUMN "status" SET DEFAULT ''PENDING''::"SellerVerificationDocumentStatus"';
  ELSIF col_type IN ('text', 'varchar', 'bpchar') THEN
    EXECUTE 'ALTER TABLE "seller_verification_documents" ADD COLUMN "status_new" "SellerVerificationDocumentStatus" DEFAULT ''PENDING''::"SellerVerificationDocumentStatus" NOT NULL';
    EXECUTE $sql$
      UPDATE "seller_verification_documents" SET "status_new" = CASE LOWER(TRIM(COALESCE("status", '')))
        WHEN 'pending'  THEN 'PENDING'::"SellerVerificationDocumentStatus"
        WHEN 'approved' THEN 'APPROVED'::"SellerVerificationDocumentStatus"
        WHEN 'rejected' THEN 'REJECTED'::"SellerVerificationDocumentStatus"
        ELSE 'PENDING'::"SellerVerificationDocumentStatus"
      END
    $sql$;
    EXECUTE 'ALTER TABLE "seller_verification_documents" DROP COLUMN "status" CASCADE';
    EXECUTE 'ALTER TABLE "seller_verification_documents" RENAME COLUMN "status_new" TO "status"';
  ELSE
    RAISE EXCEPTION '[svd-enums] Unexpected type for status: %', col_type;
  END IF;
END $$;
