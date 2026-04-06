-- AddColumn telegramChannelId and telegramChannelTitle to stores
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "telegramChannelId" TEXT;
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "telegramChannelTitle" TEXT;
