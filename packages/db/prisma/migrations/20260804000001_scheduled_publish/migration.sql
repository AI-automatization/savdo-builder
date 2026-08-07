-- FEAT-SCHEDULED-PUBLISH-001: продавец ставит будущее время публикации товара
-- (DRAFT -> ACTIVE), cron переводит статус и триггерит автопостинг в срок.
-- ADD-ONLY, nullable: данные не трогаем.
ALTER TABLE "products" ADD COLUMN "scheduledPublishAt" TIMESTAMP(3);
