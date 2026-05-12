-- FEAT-TG-AUTOPOST-001: opt-in авто-постинг товаров в Telegram канал продавца
-- Default false для новых магазинов (явный opt-in). Для существующих магазинов
-- с привязанным каналом — true (сохраняем прежнее поведение, иначе фича
-- пропадёт молча для тех кто уже пользовался).
ALTER TABLE "stores" ADD COLUMN "autoPostProductsToChannel" BOOLEAN NOT NULL DEFAULT false;
UPDATE "stores" SET "autoPostProductsToChannel" = true WHERE "telegramChannelId" IS NOT NULL;
