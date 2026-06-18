# Хэндофф Полату — 2026-06-07 (от Азима)

Задачи, всплывшие на сессии по платёжной бизнес-модели. Все — **зона Полата**
(`apps/api`, `packages/db`, `packages/types`). Бизнес-контекст: `docs/business/payments-legal-tax-2026-06-07.md`.

Платёжная модель (решено): maxsavdo = чистый SaaS, деньги сделки идут **напрямую**
продавец↔покупатель (мы не процессим), **комиссии с GMV нет**, доход — только подписка.

---

## 1. 🔴 MEDIA-TG-MIGRATE-PROD-001 — мигрировать старые фото TG → Supabase

- **Симптом:** витрина `/azim-mnx4na25` — фото товаров грузятся из Telegram через прокси
  (`/api/v1/media/proxy/<id>`, ответ `200` + `x-storage-backend: telegram`), а не direct Supabase-CDN.
- **Корень:** у этих `MediaFile` `bucket='telegram'` — залиты 17–18.04.2026 в TG-fallback (Supabase
  тогда не был сконфигурирован), не мигрированы. **Не веб-баг** (фронт рендерит URL из API как есть).
- **Фикс (код уже есть, `MigrateTgMediaToR2UseCase`):**
  `POST /api/v1/admin/media/migrate-tg-to-r2?limit=200` (admin, `media:migrate`). Прогонять батчами,
  пока не останется записей с `bucket='telegram'`. Истёкшие TG file_id → `bucket='telegram-expired'`.
- **Проверка:** `curl -D - .../api/v1/media/proxy/<id>` → должен стать `302` на Supabase
  (а не `200` + `x-storage-backend: telegram`).
- **Файлы:** `apps/api/src/modules/admin/use-cases/migrate-tg-media-to-r2.use-case.ts`,
  `apps/api/src/modules/admin/admin-ops.controller.ts:90`.

---

## 2. 🟡 Поле реквизитов/карты продавца в `Seller`/`Store`

- **Зачем:** по платёжной модели продавец показывает свою карту, покупатель переводит сам. Нужно поле(я)
  под: номер карты, имя владельца, (опц.) Payme/Click-ссылку, набор принимаемых способов (наличные/перевод).
- **Где:** `packages/db` (`Seller` или `Store`) + `packages/types` + отдача в storefront API
  (`GET stores/:slug`, product detail) и в seller-кабинет (`GET /seller/me`).
- **Acceptance:** web-seller может сохранить реквизиты; storefront API их отдаёт для показа на checkout.

---

## 3. 🟡 Эндпоинт «отметить заказ оплаченным»

- **Зачем:** деньги мимо платформы → продавец вручную подтверждает приход (перевод/наличные). Сейчас
  `order.paymentStatus` во фронте только read-only (`web-seller/orders/[id]`), действия нет.
- **Где:** `apps/api` — endpoint смены `paymentStatus` (`UNPAID → PAID`) продавцом своего заказа + audit.
- **Acceptance:** продавец может перевести свой заказ в `PAID`; фронт получает обновлённый статус.

---

## 4. 🟡 `SubscriptionDto` + эндпоинт покупки подписки

- **Зачем:** в web-seller dashboard нужен экран «Тарифы» + покупка подписки. Схема
  (`Subscription`/`SubscriptionPayment`, `MANUAL_TRANSFER`) уже готова — не хватает контракта для фронта.
- **Где:** `apps/api` + `packages/types`:
  - `SubscriptionDto` в `GET /seller/me` (или `GET /seller/subscription`) — см. `billing-machine-spec-v1` §10.
  - Эндпоинт инициации оплаты (Phase 1 manual: создать `SubscriptionPayment(PENDING)`; админ подтверждает).
- **Acceptance:** фронт получает `SubscriptionDto` (tier/status/limits/usage) и может инициировать оплату.

---

### Что уже сделано на фронте (Азим, для контекста)
- `web-buyer/checkout`: теперь шлёт `paymentMethod` + `deliveryMode` (раньше игнорировались), копирайт
  способов оплаты переписан под реалии УЗ (без «курьер»/«POS»). Полноценный «перевод на карту» ждёт п.2.
