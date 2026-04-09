-- AlterTable: add telegramId to users
ALTER TABLE "users" ADD COLUMN "telegramId" BIGINT;

-- CreateIndex: unique constraint on telegramId
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");
