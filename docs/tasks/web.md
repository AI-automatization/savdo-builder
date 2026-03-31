# Web Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`
Агент: `web-developer`, `ui-builder`, `api-tester`

---

## Phase B — API интеграция (в работе)

### Готово ✅ (ветка `feature/api-layer`)
- [x] axios client + JWT interceptors (оба приложения)
- [x] Auth storage + AuthContext (оба приложения)
- [x] TanStack Query provider (оба приложения)
- [x] API functions по контрактам из docs/contracts/
- [x] TanStack Query hooks (оба приложения)
- [x] Seller `/login` → useRequestOtp + useVerifyOtp
- [x] Seller `/dashboard` → useStore + useSellerOrders
- [x] Seller `/products` (список) → useSellerProducts
- [x] Buyer `/:slug` (витрина) → serverGetStoreBySlug + serverGetProducts (server component)
- [x] Buyer `/:slug/products/:id` → useProduct + useAddToCart

### В работе / Следующие задачи
- [ ] **Прописать `NEXT_PUBLIC_API_URL`** в `.env.local` обоих приложений (Railway URL готов)
- [ ] Seller: `/products/create` — форма создания товара + useCreateProduct
- [ ] Seller: `/products/:id/edit` — форма редактирования товара
- [ ] Seller: `/orders` (список) — подключить useSellerOrders с фильтрами
- [ ] Seller: `/orders/:id` — детальная страница + смена статуса через useUpdateOrderStatus
- [ ] Seller onboarding flow — 5 экранов (docs/V1.1/07_seller_onboarding_funnel.md)
- [ ] Buyer: `/cart` — подключить useCart / useUpdateCartItem / useRemoveCartItem
- [ ] Buyer: `/checkout` — подключить useCheckoutPreview + useConfirmCheckout
- [ ] Buyer: `/orders` — подключить useOrders
- [ ] Buyer: `/orders/:id` — подключить useOrder
- [ ] Analytics events: storefront_viewed, product_viewed, add_to_cart, checkout_started, order_created

---

## Правила

- Не трогать `apps/api`, `packages/db`
- `packages/types` — только читать
- OTP только через Telegram Bot — Eskiz.uz/SMS запрещены
- Если нужен новый endpoint → написать в docs/contracts/ + сообщить Полатру
- После завершения задачи → перенести в docs/done/web.md
