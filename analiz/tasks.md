# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 📋 Снимок состояния (на 23.04.2026, сессия 32)

## ✅ Закрыто Полатом в коммитах `5ca0666`, `f3a40a7`, `3e8d337` (сессии 29-31)

- `API-DECIMAL-NAN-001` → `toNum()` в cart.mapper везде
- `API-BUYER-PROFILE-001` → `ensureBuyerProfile` для существующих SELLER/ghost users
- `API-CART-CONTRACT-001` → `GET /cart` возвращает mapped Cart
- `API-CART-RESPONSE-001` → POST/PATCH /cart/items возвращают full Cart
- `API-CHECKOUT-CONTRACT-001` → preview-checkout по контракту CheckoutPreview
- `API-CART-MEDIA-001` → cart.mapper resolveMediaUrl
- `API-MEDIA-UPLOAD-500-001` → try/catch + 502 DomainException
- `API-SELLER-ORDER-DETAIL-MAPPER-001` / `API-BUYER-ORDER-DETAIL-MAPPER-001` / `API-SELLER-ORDER-DETAIL-CONTRACT-001` → общий `orders.mapper.ts` с `mapOrderDetail()` + `include: store`

## 🚧 Открыто — Полат (бэк, `apps/api` / `packages/db` / `packages/types`)

| ID | Важность | Кратко |
|----|----------|--------|
| `API-CHAT-ROLE-GUARD-001` | 🔴 | `POST /chat/threads` с `@Roles('BUYER')` даёт 403 пользователям с User.role=SELLER, у которых есть Buyer-профиль. Блокирует чат на dual-role аккаунтах. См. detail-секцию ниже. |
| `API-BUYER-AVATAR-001` | 🟡 | Нет поля `Buyer.avatarUrl` + endpoint загрузки + поле в `auth/me`. После — Azim прикрутит UI. |
| **Auth-история** | 🟡 | Почему `/auth/logout` 401 при первом выходе? И серия 401 на `/auth/me`, `/seller/store`, `/seller/summary`, `/chat/threads`, `/notifications/inbox` — JWT/session-id из refresh-token. Сделать тестовый заказ в prod и поймать трейс в Railway logs. |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

| ID | Важность | Кратко |
|----|----------|--------|
| Тест chat composer end-to-end | 🔴 | Блокирован `API-CHAT-ROLE-GUARD-001`. После фикса Полата — протестировать e2e на dual-role аккаунте. |
| Тест checkout redirect prepopulate | 🟡 | После закрытия `API-BUYER-ORDER-DETAIL-MAPPER-001` (уже закрыт) — проверить что `/orders/{id}` открывается сразу после checkout без `prepopulate`-костыля. Можно снять костыль из `useConfirmCheckout` и проверить что GET больше не падает. |
| `WEB-BUYER-AVATAR-UI-001` | 🟢 | Когда Полат закроет `API-BUYER-AVATAR-001` — на `/profile` повесить `<Image>` + `<input type=file>`, инвалидировать `['auth','me']`. |
| Подтвердить причину `/notifications` ошибки | 🟢 | F12 Network → `/notifications/inbox`. 401 = часть auth-серии, 404/500 = отдельная задача. |

---

## 🔴 [API-CHAT-ROLE-GUARD-001] `POST /chat/threads` → 403 на dual-role аккаунтах (SELLER + Buyer-профиль)

- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Блокирует чат для всех SELLER-пользователей которые зашли на web-buyer через тот же телефон (типичный кейс — тестирование своего магазина как покупатель). Юзер видит молчаливую красную ошибку при отправке первого сообщения.
- **Файлы:** `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:66-70`, `apps/api/src/modules/chat/chat.controller.ts:61-62`, `apps/api/src/common/guards/roles.guard.ts:28-30`
- **Воспроизведено (Азим, 23.04.2026, prod):** web-buyer → OTP-login тем телефоном, что зарегистрирован как SELLER → магазин → товар → фиолетовая кнопка чата → «Отправить» → Console `POST .../api/v1/chat/threads 403`.
- **Цепочка причин:**
  1. `verify-otp.use-case.ts:44-47` — для существующего User вызывает `ensureBuyerProfile` (ок), но **не меняет `User.role`**. Остаётся SELLER.
  2. `verify-otp.use-case.ts:66-70` — в JWT кладётся `role: resolvedUser.role` → `role: "SELLER"`.
  3. `chat.controller.ts:62` — `POST /chat/threads` декорирован `@Roles('BUYER')`.
  4. `roles.guard.ts:28-30` — `user.role` (SELLER) не в whitelist → 403 FORBIDDEN «Insufficient permissions».
- **Архитектурная несостыковка:** у одного User может быть и Buyer, и Seller профиль (один телефон). Но JWT `role` — скалярное поле. Endpoints через `@Roles('BUYER')` видят только User.role — первую созданную.
- **Варианты фикса (в порядке сложности):**
  1. **Минимальный, рекомендую:** убрать `@Roles('BUYER')` с `POST /chat/threads` в `chat.controller.ts:62`. Метод уже вызывает `resolveBuyerId(user.sub)` (строка 253-265), который бросает 422 «Buyer profile not found» если у User нет Buyer-записи. Это даёт нужную проверку — «любой с Buyer-профилем может создать тред». SELLER с Buyer-профилем больше не ловит 403. Аналогично стоит посмотреть `GET /chat/threads`, `GET /chat/threads/:id/messages`, `POST /chat/threads/:id/messages` — там `@Roles('BUYER', 'SELLER')`, на практике работает, но логика «смотри на профиль, а не на User.role» корректнее.
  2. **Системный:** в JWT класть `roles: string[]` вместо скаляра + обновить `RolesGuard` на пересечение. Закрывает серию похожих багов для dual-role пользователей.
- **Плюс фронт (Азим):** запланирован UX-toast на 403 с чат-mutation — показывать «чат временно недоступен» вместо молчаливой плашки. Это маскировка, снять после фикса.

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

