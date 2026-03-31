# Web Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`
Агент: `web-developer`, `ui-builder`, `api-tester`

---

## Phase B — API интеграция (в работе)

### Готово (ветка `feature/api-layer`)
- [x] axios client + JWT interceptors (оба приложения)
- [x] Auth storage + AuthContext (оба приложения)
- [x] TanStack Query provider (оба приложения)
- [x] API functions по контрактам из docs/contracts/
- [x] TanStack Query hooks (оба приложения)

### Следующий шаг: подключить deps и подключить хуки к страницам
- [ ] **Запустить `pnpm install`** (axios + @tanstack/react-query, вручную из терминала)
- [ ] Подключить `useRequestOtp` / `useVerifyOtp` → seller `/login`
- [ ] Подключить `useStore` / `useSellerProducts` / `useSellerOrders` → seller dashboard/products/orders
- [ ] Подключить `useProducts` / `useProduct` → buyer storefront + product detail
- [ ] Подключить `useCart` / `useAddToCart` / `useUpdateCartItem` → buyer `/cart`
- [ ] Подключить `useCheckoutPreview` / `useConfirmCheckout` → buyer `/checkout`
- [ ] Подключить `useOrders` / `useOrder` → buyer `/orders`, `/orders/:id`
- [ ] Seller: страница `/products/create` (форма создания товара)
- [ ] Seller: страница `/products/:id/edit` (форма редактирования)
- [ ] Seller: `/orders/:id` (детальная страница заказа + смена статуса)
- [ ] Buyer: `/chats` (список чатов)
- [ ] Seller onboarding flow — 5 экранов (docs/V1.1/07_seller_onboarding_funnel.md)
- [ ] Analytics events: storefront_viewed, product_viewed, add_to_cart, checkout_started, order_created

---

## Правила

- Не трогать `apps/api`, `packages/db`
- `packages/types` — только читать
- Если нужен новый endpoint → написать в docs/contracts/ + сообщить Полатру
- После завершения → перенести в docs/done/web.md
