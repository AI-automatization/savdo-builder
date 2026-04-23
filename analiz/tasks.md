# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 📋 Снимок состояния (на 23.04.2026, сессия 33)

## ✅ Закрыто Полатом в коммитах `907f39f`, `fb79db2` (сессия 33)

- `API-CHAT-ROLE-GUARD-001` → `@Roles('BUYER')` снят с `POST /chat/threads` (chat.controller.ts:63-64); + `ensureBuyerProfile` в verify-otp для существующих users
- **Chat real-time fix** — TMA слушал `chat:new_message`, gateway шлёт `chat:message` → привели к одному event (web-buyer/web-seller у нас уже слушали правильно)
- **Chat status unification** — `active/resolved` → `OPEN/CLOSED` во всех слоях (API + TMA + admin)
- **Chat UI** — имена тредов (название магазина / телефон), превью последнего сообщения, запрет отправки в CLOSED треды
- **Admin chats** — кнопка удаления + DELETE endpoint; fix STATUS_COLORS crash; bundle 900→300KB
- **Sprint 31 Categories** — 34 категории + 130 фильтров в БД, автосид через OnModuleInit; `GET /api/v1/storefront/categories/:slug/filters` (публичный); `POST /api/v1/admin/categories/seed` (ADMIN); `Product` API теперь включает `globalCategory { nameRu, nameUz }`
- **Security** — OTP через `crypto.randomInt`, брутфорс-защита (5 попыток → блок 15 мин через Redis), `/proxy/:id` только для PUBLIC, удалены дубли `/auth/otp/send|verify`
- **DB/Redis audit** — OTP graceful degrade при Redis down, try/catch на `JSON.parse(options)`

## 🚧 Открыто — Полат (бэк, `apps/api` / `packages/db` / `packages/types`)

| ID | Важность | Кратко |
|----|----------|--------|
| `API-CHAT-THREAD-CONTRACT-001` | 🔴 | **Sprint 31 сломал контракт чата.** `list-my-threads.use-case.ts` возвращает `{id, threadType, status, lastMessage: string, storeName, storeSlug, productTitle, orderNumber, buyerPhone}`, но тип `packages/types/src/api/chat.ts#ChatThread` всё ещё описывает старое `{id, contextType, contextId, buyerId, sellerId, unreadCount, lastMessage: {text}}`. Фронт падал с `Cannot read properties of undefined (reading 'slice')` на странице чатов. Обновить тип в packages/types (+ `unreadCount`, которого сейчас нет в API ответе). Web-buyer и web-seller переведены на локальный `ChatThreadView` через адаптер — после правки типа можно упростить. |
| `API-BUYER-ORDERS-ROLE-GUARD-001` | 🔴 | Те же грабли что были с чатом: `orders.controller.ts:48-49,85,97,108` декорированы `@Roles('BUYER')`. SELLER-пользователь с Buyer-профилем (dual-role) ловит 403 на `GET /buyer/orders` и не может посмотреть свои покупки. Минимальный фикс — снять `@Roles('BUYER')` с buyer-эндпоинтов (там есть `resolveBuyerId` по аналогии с чатом). Проверить заодно `/cart`, `/checkout` — те же `@Roles('BUYER')`? |
| `API-BUYER-AVATAR-001` | 🟡 | Нет поля `Buyer.avatarUrl` + endpoint загрузки + поле в `auth/me`. После — Azim прикрутит UI. |
| `API-PRODUCT-ATTRIBUTES-TYPE-001` | 🟡 | `findPublicById` (products.repository.ts:120) уже делает `include: attributes`, но в `packages/types/src/api/products.ts:62-69` поле `attributes: ProductAttribute[]` отсутствует. Добавить в тип `Product` (и в `ProductAttribute` с полями `id, name, value, sortOrder`). Фронт пока читает через локальный cast (см. web-buyer ProductPage, блок «Характеристики»). |
| `API-STOREFRONT-PRODUCT-FILTERS-001` | 🟡 | `GET /storefront/products?storeId=X` принимает только `globalCategoryId` / `storeCategoryId`. Для использования 130 фильтров Sprint 31 нужно принимать attribute-фильтры (напр. `?filters[brand]=Samsung&filters[ram]=8`). Без этого новый endpoint `/storefront/categories/:slug/filters` — просто метаданные без применения. |
| **Auth-история** | 🟡 | Почему `/auth/logout` 401 при первом выходе? И серия 401 на `/auth/me`, `/seller/store`, `/seller/summary`, `/chat/threads`, `/notifications/inbox` — JWT/session-id из refresh-token. Сделать тестовый заказ в prod и поймать трейс в Railway logs. |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

| ID | Важность | Кратко |
|----|----------|--------|
| Тест chat composer end-to-end | 🔴 | Разблокирован Полатом в `907f39f`. После Railway-билда — протестировать e2e на dual-role аккаунте. |
| `WEB-BUYER-CATEGORY-FILTERS-001` | 🟡 | Блокирован `API-STOREFRONT-PRODUCT-FILTERS-001`. Endpoint `/storefront/categories/:slug/filters` отдаёт метаданные, но `/storefront/products` их не принимает → чистая витрина без применения. Ждём бэка. |
| `WEB-BUYER-AVATAR-UI-001` | 🟢 | Когда Полат закроет `API-BUYER-AVATAR-001` — на `/profile` повесить `<Image>` + `<input type=file>`, инвалидировать `['auth','me']`. |
| Подтвердить причину `/notifications` ошибки | 🟢 | F12 Network → `/notifications/inbox`. 401 = часть auth-серии, 404/500 = отдельная задача. |

---

## 🟡 [API-BUYER-AVATAR-001] Buyer profile avatar — нет схемы / endpoint / поля в `auth/me`
- **Домен:** `apps/api`, `packages/db`, `packages/types`
- **Кто взял:** Полат
- **Важность:** 🟡 UX gap. Азим (19.04.2026) репортнул что в `web-buyer /profile` нельзя поставить своё фото, висит дефолтная иконка `<UserIcon>`. Фронт реализовать не может — нет ни поля, ни endpoint.
- **Что нужно:**
  1. **Schema (`packages/db/prisma/schema.prisma:166-182`):** добавить `avatarUrl String?` в `model Buyer`. Migration `add_buyer_avatar_url`.
  2. **Upload endpoint:** `POST /buyer/me/avatar` — multipart (`multipart/form-data`, поле `file`), валидация: image/jpeg|png|webp, ≤2 MB. Грузит в R2 (тот же бакет что и product media), записывает публичный URL в `Buyer.avatarUrl`. Возвращает обновлённый `BuyerProfile`.
  3. **Delete endpoint (опц.):** `DELETE /buyer/me/avatar` — обнуляет поле, удаляет из R2.
  4. **`GET /auth/me`:** поле `avatarUrl` в `User.buyer` ответе.
  5. **`packages/types`:** добавить `avatarUrl?: string | null` в `BuyerProfile` (см. `packages/types/src/api/auth.ts` где определён `User`).
- **Когда готово — Азим (web-buyer):** на `/profile` рядом с `<UserIcon>` рендерит круглую `<Image>` с `avatarUrl`, под ней кнопка «Изменить фото» — открывает `<input type="file" accept="image/*">`, шлёт в новый endpoint, инвалидирует `['auth','me']`.

---

## ✅ Задачи закрыты (18.04.2026)

| ID | Приоритет | Что | Статус |
|---|---|---|---|
| **TMA-EDIT-001** | 🔴 | Чёрный экран при тапе на товар (optionValues crash) | ✅ DONE — коммит `cdaeff6` |
| **TMA-ERR-BOUNDARY-001** | 🟡 | Error Boundary в TMA App.tsx | ✅ DONE — коммит текущей сессии |
| **API-SUMMARY-500-001** | 🔴 | /analytics/seller/summary → 500 | ✅ DONE — коммит `cdaeff6` |
| **API-ORDER-ADDR-001** | 🟡 | Заказ без deliveryAddress | ✅ DONE — deliveryAddress опциональный, строится из flat полей |
| **API-ORDER-PREVIEW-001** | 🟢 | Превью товара в списке заказов | ✅ DONE — поле `preview` в OrderListItem |
| **API-UPLOAD-ENV-001** | 🟡 | Telegram storage env vars | ✅ DONE — добавлено в Railway |

### ⚠️ На Азиме — одно действие вне кода

- **TG-BOT-ADMIN-001** — добавить `@savdo_builderBOT` администратором канала `-1003760300539` (Telegram storage) с правом «Публикация сообщений». Без этого API не сможет постить файлы → фото-upload молча ломается.

### 🟡 На Азиме — код

_(пусто — WEB-ORDER-PREVIEW-001 закрыт 18.04.2026, см. done.md)_

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

