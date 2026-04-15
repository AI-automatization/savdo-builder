# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/admin`, `apps/mobile-buyer`, `apps/mobile-seller`

> ⚠️ Admin panel передана Полату (ранее Яхьо). Яхьо больше не работает над `apps/admin`.

> ADM Phase A (ADM-001..008) — выполнено 01.04.2026, перенесено в `done.md`

---

---

## 🔴 Новые задачи для Полата (13.04.2026)

---

## 🔴 Новые задачи для Полата (15.04.2026) — после сессии 19 Азима

- [ ] **[API-VAR-001]** Нормализовать ответ variants: `optionValueIds: string[]` вместо junction
  - **Домен:** `apps/api`, `packages/types`
  - **Детали:** Сейчас репозитории `variants.repository.ts` и `products.repository.ts` включают `optionValues: { include: { optionValue: true } }`, и это junction-формат уходит на фронт. Тип `ProductVariant` в `packages/types` декларирует `optionValueIds: string[]`. Нужен маппер в controller/use-case: для каждого variant → `optionValueIds = optionValues.map(j => j.optionValueId)`, поле `optionValues` убрать из ответа. Затронутые эндпоинты: `GET /seller/products/:id/variants`, `GET /seller/products/:id` (product detail), `GET /storefront/products/:id`, `POST/PATCH /seller/products/:id/variants`.
  - **Заметка Азима:** На фронте я добавил defensive `extractOptionValueIds()` читающий оба формата. После твоей нормализации можно будет его упростить. См. `analiz/logs.md [API-VAR-001]`.

- [ ] **[API-LIST-001]** Добавить `variantCount` в `ProductListItem`
  - **Домен:** `apps/api`, `packages/types`
  - **Детали:** Сейчас `GET /seller/products` и `GET /storefront/products` возвращают массив `ProductListItem` без информации о вариантах. На карточке товара (web-buyer ProductCard, web-seller список) хочется показывать бейдж «есть варианты» / «3 варианта». Добавить поле `variantCount: number` (считать активные variants с `deletedAt=null, isActive=true`). Обновить тип в `packages/types/src/api/products.ts`. Азим после этого допилит UI.

- [ ] **[API-CONTRACT-001]** (опционально) Документация shape вариантов
  - **Детали:** После API-VAR-001 обновить `docs/contracts/` если описаны variants. Сейчас docs нет для этих эндпоинтов.

---

## ✅ Разблокировано для Азима (07.04.2026)

> Аудит кода показал: все задачи уже реализованы Абубакиром.

- [x] **[API-010]** `GET /api/v1/auth/me` — готово (`auth.controller.ts` + `GetMeUseCase`)
- [x] **[API-011]** `deliveryFeeType`/`deliveryFeeAmount` в `PATCH /seller/store` — готово (DTO + use-case)
- [x] **[API-012]** `buyer: { phone }` в `GET /seller/orders/:id` — готово (`orders.repository.ts` findById)
- [x] **[API-013]** `chat:new_message` → seller-room — готово (`chat.gateway.ts` + `send-message.use-case.ts`)
- [x] **[API-014]** `order:status_changed` → buyer-room — готово (`orders.gateway.ts` + `update-order-status.use-case.ts`)

---
## ✅ Выполнено (02.04.2026)

- [x] **[WEB-022]** `DEV_OTP_ENABLED=true` на Railway — Азим может тестировать OTP ✅
- [x] **[WEB-001]** Дубль `PaginationMeta` — дубля нет, TS2308 отсутствует ✅
- [x] **[WEB-015]** Socket.IO emit `order:new` / `order:status_changed` ✅
- [x] **[API-007]** Telegram Webhook — авто-регистрация при старте ✅
- [x] **[API-008]** Watch Paths — уже были в `apps/api/railway.toml` ✅
- [x] **[API-009]** R2 Storage — guard для отсутствия конфига ✅

---

---

## 🟡 Admin — Phase B (после стабильного backend admin API)

> Phase A уже сделана (макеты с моками). Phase B — подключение к реальному API.

- [x] **[ADM-008]** Интеграция admin auth (JWT) ✅
- [x] **[ADM-009]** Seller review queue — реальные данные + SLA-таймер ✅
- [x] **[ADM-010]** Store approve/reject/suspend flow + confirmation modal ✅ (сделано ранее)
- [x] **[ADM-011]** Product hide/restore ✅
- [x] **[ADM-012]** Order overview с фильтрами ✅
- [x] **[ADM-013]** Поиск по телефону / order number / slug ✅
- [x] **[ADM-014]** Seller detail страница с историей moderation actions ✅

---

## 🔴 Admin — Phase C (статусы без управления)

> Аудит 02.04.2026: найдены статусы которые отображаются в UI но изменить их через админку нельзя.


---

## 🟡 Dashboard аналитика (чарты)

- [x] **[ADM-021]** Dashboard charts ✅

---

## 🟡 Broadcast — Telegram рассылка из админки

- [x] **[ADM-019]** Backend: `POST /api/v1/admin/broadcast` — готово (`broadcast.use-case.ts` + `admin.controller.ts`)
- [x] **[ADM-020]** Admin UI: страница `/broadcast` — готово (`BroadcastPage.tsx` + роут в `App.tsx` + nav в `DashboardLayout.tsx`)

---

## 🧊 ЗАМОРОЖЕНО — Монетизация + Payme/Click (Phase 4)

> ❄️ Фриз до открытия бизнес-счёта в Click и Payme. Не брать в работу.

- [ ] **[PAY-001]** DB schema: таблицы `subscription_plans`, `subscriptions`, `payment_transactions`
  - **Домен:** `packages/db`
  - **Детали:** `subscription_plans` (id, name, price_uzs, duration_days, features jsonb). `subscriptions` (id, seller_id, plan_id, status: ACTIVE/EXPIRED/CANCELLED, starts_at, expires_at). `payment_transactions` (id, seller_id, subscription_id, provider: PAYME|CLICK, amount_uzs, status: PENDING/PAID/FAILED, provider_tx_id, created_at).

- [ ] **[PAY-002]** Backend: Payme webhook + активация подписки
  - **Домен:** `apps/api`
  - **Детали:** `POST /payments/payme` — принимает Payme JSON-RPC (CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction). При PerformTransaction → активировать подписку → открыть доступ к seller CRM.

- [ ] **[PAY-003]** Backend: Click webhook + активация подписки
  - **Домен:** `apps/api`
  - **Детали:** `POST /payments/click/prepare` + `POST /payments/click/complete`. При complete → активировать подписку.

- [ ] **[PAY-004]** Seller CRM: страница тарифов + кнопка оплаты
  - **Домен:** `apps/web-seller`
  - **Детали:** Страница `/billing` — список планов, текущая подписка, кнопка "Оплатить" → редирект на Payme/Click. После успешной оплаты → редирект обратно с активным доступом.
  - **Заметка:** Азимов домен

- [ ] **[PAY-005]** Admin: управление подписками продавцов
  - **Домен:** `apps/admin`
  - **Детали:** В SellerDetailPage показывать текущий план + историю платежей. Кнопка "Выдать подписку вручную" (для тестов и исключений).

---

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo

---

# Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`, `apps/tma`

> TMA создан (сессия 15). Ждём Полата по API-021 и API-022 чтобы подключить auth и бот.

## ✅ Сессия 13 (07.04.2026) — все блокеры закрыты

API-010, API-011, API-012, API-013, API-014 — реализованы на фронтенде.

## ✅ Сессия 14 (08.04.2026) — polish & refactor

- [x] **[WEB-030]** Notification badge в buyer BottomNavBar (профиль) — `useUnreadCount()` с auto-refetch 30s
- [x] **[WEB-031]** Извлечён `OtpGate` в shared компонент `components/auth/OtpGate.tsx` — убран дубликат из orders, chats, profile
- [x] **[WEB-032]** Созданы `lib/styles.ts` с glass tokens для buyer и seller
- [x] **[WEB-033]** TypeScript проверка: оба приложения компилируются без ошибок
- [x] **[WEB-034]** Cart badge в BottomNavBar — показывает кол-во товаров через `useCart()`
- [x] **[WEB-035]** Buyer orders пагинация — load-more кнопка, аккумуляция страниц
- [x] **[WEB-036]** Store cover image — баннер на витрине если `coverUrl` есть
- [x] **[WEB-037]** SVG icons extraction — `components/icons.tsx`, BottomNavBar мигрирован

Блокеров нет. Домен Азима свободен.

## ✅ Сессия 15 (09.04.2026) — TMA создан

- [x] **[TMA-001]** Полное Vite SPA приложение `apps/tma/` — 27 файлов, 13 коммитов
- [x] Buyer flow: каталог → магазин → корзина → checkout → заказы
- [x] Seller flow: dashboard → заказы (PATCH статусы) → настройки магазина
- [x] Telegram SDK: BackButton, MainButton, HapticFeedback
- [x] Build: ~70KB gzipped, 0 TS ошибок

## ✅ TMA — блокеры закрыты (10.04.2026)

- [x] **[API-021]** `POST /auth/telegram` — уже реализован (`auth.controller.ts:27`, `telegram-auth.use-case.ts`). HMAC-валидация initData, find-or-create user+buyer, возвращает `{ token, refreshToken, user }`. TMA вызывает его правильно.
- [x] **[API-022]** `BUYER_APP_URL → TMA_URL` — исправлено в `telegram-demo.handler.ts` (`handleBuyerStore`). Теперь генерирует deep link `t.me/{botUsername}?startapp=store_{slug}`.
- [x] **[TMA-003]** Деплой TMA на Railway ✅ — `Dockerfile` + `railway.toml` созданы, "telegram-app: Deployment successful" в Railway.
- [x] **[TMA-004]** Deep links — `parseStartParam()` в `HomePage.tsx` ✅

## 🟡 TMA — осталось Азиму

- [ ] **[TMA-002]** Протестировать auth flow в реальном Telegram (всё готово, нужен живой тест)
- [x] **[TMA-005]** Поиск магазинов на StoresPage ✅ (10.04.2026)
- [x] **[TMA-006]** Удалить старые `/twa` роуты из web-buyer ✅ (10.04.2026)

## ✅ Сессия 16b (10.04.2026) — Полный аудит + фиксы

- [x] **[AUDIT-001]** JSON.parse crash fix — CartPage, StorePage, CheckoutPage
- [x] **[AUDIT-002]** Error UI вместо silent `.catch(() => {})` в 3 TMA страницах
- [x] **[AUDIT-003]** AuthProvider catch — не зависает в loading при ошибке auth
- [x] **[AUDIT-004]** Токен сохраняется в sessionStorage (не теряется при reload)
- [x] **[AUDIT-005]** web-seller next.config.ts — убран невалидный experimental.turbo
- [x] **[AUDIT-006]** Валидация телефона +998 в TMA CheckoutPage
- [x] **[AUDIT-007]** API client: console.warn если NEXT_PUBLIC_API_URL не задан
- [x] **[AUDIT-008]** web-seller: удалён лишний pnpm-workspace.yaml

