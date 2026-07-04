-- FEAT-ORDERS-ARCHIVE-001: архивация закрытых заказов продавцом.
-- Nullable ADD COLUMN — безопасно для прод-данных (не теряет строки).
ALTER TABLE "orders"
  ADD COLUMN "sellerArchivedAt" TIMESTAMP(3);
