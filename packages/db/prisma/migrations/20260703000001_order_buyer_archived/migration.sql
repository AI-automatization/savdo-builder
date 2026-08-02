-- FEAT-ORDERS-ARCHIVE-001: архивация закрытых заказов покупателем.
-- Покупатель прячет DELIVERED/CANCELLED заказ из основного списка в «Архив».
-- ADD nullable колонки — безопасно (prod-data-safety): существующие строки = NULL
-- (остаются в основном списке), таблица не переписывается, откат = DROP COLUMN.
-- Индекс не добавляем: buyer-список мал (per-buyer), покрыт существующим
-- @@index([buyerId, status, placedAt]).

ALTER TABLE "orders"
  ADD COLUMN "buyerArchivedAt" TIMESTAMP(3);
