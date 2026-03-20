# Web Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`
Агент: `web-developer`, `ui-builder`, `api-tester`

---

## Phase A — Параллельно с backend

> Пока backend строится — работать с mock данными или задеплоенными стабами.

### Очередь
- [ ] Инициализировать apps/web-buyer (Next.js App Router)
- [ ] Инициализировать apps/web-seller (Next.js App Router)
- [ ] Настроить Tailwind + DaisyUI в обоих приложениях
- [ ] Базовый layout buyer storefront (header, footer, mobile-first)
- [ ] Базовый layout seller dashboard (sidebar, header)
- [ ] Storefront: страница магазина (статичная, без API)
- [ ] Storefront: страница товара (статичная)
- [ ] Seller: страница входа (OTP форма)

---

## Phase B — После стабильного backend

- [ ] Интеграция auth (OTP flow)
- [ ] Seller: создание магазина
- [ ] Seller: добавление товаров
- [ ] Storefront: реальные данные из API
- [ ] Cart + Checkout flow
- [ ] Seller: управление заказами
- [ ] Onboarding progress bar (docs/V1.1/07_seller_onboarding_funnel.md)
- [ ] Analytics events (storefront_viewed, add_to_cart, checkout_started, order_created)
- [ ] Тестирование API endpoints (api-tester агент)

---

## Правила

- Не трогать `apps/api`, `packages/db`
- packages/types — только читать
- Если нужен новый endpoint → написать в docs/contracts/ + сообщить Абубакиру
- После завершения → перенести в docs/done/web.md
