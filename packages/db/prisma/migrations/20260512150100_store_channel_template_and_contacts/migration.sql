-- FEAT-TG-CHANNEL-TEMPLATE-001: настраиваемый шаблон поста в TG-канал
-- + контактные данные продавца, отдельно от telegramContactLink (тот ссылка
-- на личный чат, эти — для display в шаблоне).
--
-- Все поля NULL — существующие магазины используют дефолтный шаблон
-- из ChannelTemplateService.DEFAULT_TEMPLATE.
ALTER TABLE "stores" ADD COLUMN "channelPostTemplate"  TEXT NULL;
ALTER TABLE "stores" ADD COLUMN "channelContactPhone"  TEXT NULL;
ALTER TABLE "stores" ADD COLUMN "channelInstagramLink" TEXT NULL;
ALTER TABLE "stores" ADD COLUMN "channelTiktokLink"    TEXT NULL;
