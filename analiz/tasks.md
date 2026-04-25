# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 📋 Снимок состояния (на 25.04.2026, сессия 34)

## ✅ Закрыто Полатом в `18fa355`, `66b8be4` (24.04.2026)

- `API-BUYER-ORDERS-ROLE-GUARD-001` 🔴 — снят `@Roles('BUYER')` с buyer/orders endpoints
- `API-CHAT-THREAD-CONTRACT-001` 🔴 — `ChatThread` тип в packages/types обновлён (threadType/storeName/storeSlug/productTitle/orderNumber/buyerPhone, lastMessage: string|null)
- `API-PRODUCT-ATTRIBUTES-TYPE-001` 🟡 — `Product.attributes: ProductAttribute[]` в типе
- `API-STOREFRONT-PRODUCT-FILTERS-001` 🟡 — `/storefront/products?filters[brand]=Samsung` теперь работает
- `API-CATEGORY-SEED-CLEANUP-001` 🟡 — авто-категории убраны из seed + cleanupRemovedCategories на старте
- `API-BUYER-AVATAR-001` 🟡 — `POST /api/v1/media/buyer/avatar` (multipart, IMAGE_ONLY, 10MB), `BuyerProfile.avatarUrl` в /auth/me

## ✅ Закрыто Азимом в сессии 34 (25.04.2026)

- `WEB-BUYER-AVATAR-UI-001` 🟢 — клик-аватар на /profile, file picker с валидацией, refreshUser после загрузки
- `WEB-BUYER-CATEGORY-FILTERS-001` 🟡 — глобальные категории + 130 атрибут-фильтров на витрине магазина (`/[slug]?gcat=…&f.brand=…`)
- `WEB-SELLER-DESIGN-PHASE-2-001` 🟡 — solid surfaces tokens + миграция layout/dashboard/products
- `WEB-SELLER-DESIGN-PHASE-3-001` 🟡 — миграция остальных 10 страниц + 2 компонентов: orders list/detail, settings, analytics, notifications, login (full); products/create (full), products/edit + chat + onboarding + variants/option-groups (via alias). `grep backdropFilter` → 0 совпадений в web-seller
- `WEB-SELLER-DESIGN-PHASE-3-CLEANUP-001` 🟢 — финальная очистка alias-файлов: chat/edit/variants/option-groups/onboarding/image-uploader. **Все inline rgba(255,255,255,X) удалены из web-seller — `grep -rn` показывает 0 совпадений**
- `WEB-CHAT-THREAD-VIEW-CLEANUP-001` 🟢 — удалены локальные адаптеры, фронт работает с ChatThread из packages/types напрямую

## 🚧 Открыто — Полат (бэк, `apps/api` / `packages/db` / `packages/types`)

| ID | Важность | Кратко |
|----|----------|--------|
| `API-CHAT-UNREAD-COUNT-001` | 🟡 | После cleanup'а ChatThreadView фронт перестал показывать badge непрочитанных чатов в seller-sidebar (`useUnreadChatCount` → 0). Вернуть `unreadCount: number` в ответе `/chat/threads` (list-my-threads.use-case.ts) **и** в типе `packages/types/src/api/chat.ts#ChatThread`. Логика: COUNT(messages WHERE threadId AND createdAt > thread.lastReadAt[role]). |
| **Auth-история** | 🟡 | Почему `/auth/logout` 401 при первом выходе? И серия 401 на `/auth/me`, `/seller/store`, `/seller/summary`, `/chat/threads`, `/notifications/inbox` — JWT/session-id из refresh-token. Сделать тестовый заказ в prod и поймать трейс в Railway logs. |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

| ID | Важность | Кратко |
|----|----------|--------|
| Тест end-to-end в проде после `66b8be4` deploy | 🔴 | (1) Avatar upload на /profile (загрузить картинку, проверить что отображается, проверить /auth/me возвращает avatarUrl). (2) Category filters на витрине магазина — открыть store, нажать «Фильтры», выбрать категорию, выбрать значение фильтра, увидеть отфильтрованный список. (3) Web-seller solid surfaces — визуально оценить новый dashboard look. (4) Chat composer e2e (висит с сессии 33) на dual-role аккаунте. |
| `WEB-SELLER-AUTOMOTIVE-CLEANUP-001` | 🟢 | После того как Азим визуально подтвердит что Railway задеплоил `18fa355` и в `/products/create` dropdown категорий нет авто-пунктов — удалить `isHiddenCategory(slug)` regex-фильтр из `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` и `[id]/edit/page.tsx`. **ОПАСНО удалять до проверки** — если cleanup не отработал на проде, продавцы снова увидят авто. |
| Подтвердить причину `/notifications` ошибки | 🟢 | F12 Network → `/notifications/inbox`. 401 = часть auth-серии, 404/500 = отдельная задача. |

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

