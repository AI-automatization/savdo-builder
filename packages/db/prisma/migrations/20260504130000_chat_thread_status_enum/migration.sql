-- DB-AUDIT-001-02: ChatThread.status был TEXT default 'active', но API пишет
-- 'OPEN'/'CLOSED' и сравнивает с 'CLOSED'. Старые записи могли быть 'active' и
-- проходили проверку `status !== 'CLOSED'`. Переводим в enum для consistency.

-- 1. Создать enum
CREATE TYPE "ChatThreadStatus" AS ENUM ('OPEN', 'CLOSED');

-- 2. Снять старый default чтобы можно было сменить тип столбца
ALTER TABLE "chat_threads" ALTER COLUMN "status" DROP DEFAULT;

-- 3. Backfill: нормализовать существующие значения к двум валидным
UPDATE "chat_threads" SET "status" = 'OPEN'   WHERE "status" IN ('active', 'open',   'OPEN');
UPDATE "chat_threads" SET "status" = 'CLOSED' WHERE "status" IN ('closed', 'CLOSED', 'resolved');
-- На случай если есть мусор — приводим к OPEN (нейтрально)
UPDATE "chat_threads" SET "status" = 'OPEN' WHERE "status" NOT IN ('OPEN', 'CLOSED');

-- 4. Сменить тип столбца
ALTER TABLE "chat_threads"
  ALTER COLUMN "status" TYPE "ChatThreadStatus" USING "status"::"ChatThreadStatus";

-- 5. Поставить новый default
ALTER TABLE "chat_threads" ALTER COLUMN "status" SET DEFAULT 'OPEN';
