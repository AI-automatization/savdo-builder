-- CART-001: предотвращает дублирование non-variant товаров в корзине.
-- PostgreSQL @@unique([cartId, variantId]) не защищает NULL строки (NULL != NULL
-- в SQL), поэтому два параллельных addItem для одного товара без варианта
-- создавали два CartItem → двойное списание stock при checkout.
CREATE UNIQUE INDEX "cart_items_no_variant_unique"
ON "cart_items" ("cartId", "productId")
WHERE "variantId" IS NULL;

-- CART-002: предотвращает создание двух ACTIVE корзин для одного buyer
-- при параллельных запросах (double-tap / двойной вызов getOrCreateCart).
CREATE UNIQUE INDEX "carts_buyer_active_unique"
ON "carts" ("buyerId")
WHERE "status" = 'ACTIVE' AND "buyerId" IS NOT NULL;
