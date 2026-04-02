# Done — Полат

---

## 2026-04-02 (продолжение)

### ✅ [ADM-015] Store: REJECTED и ARCHIVED статусы — API + UI
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/reject-store.use-case.ts` (новый)
  - `apps/api/src/modules/admin/use-cases/archive-store.use-case.ts` (новый)
  - `apps/api/src/modules/admin/admin.controller.ts` — `POST /admin/stores/:id/reject`, `POST /admin/stores/:id/archive`
  - `apps/api/src/modules/admin/admin.module.ts` — зарегистрированы новые use-cases
  - `apps/api/src/shared/constants/error-codes.ts` — `ADMIN_STORE_ALREADY_REJECTED`, `ADMIN_STORE_ALREADY_ARCHIVED`
  - `apps/admin/src/pages/StoreDetailPage.tsx` — кнопки "Отклонить" и "В архив" + confirm-модалки
- **Что сделано:** Два новых эндпоинта + use-cases по паттерну suspend-store. INV-A01/A02 соблюдены. Кнопки скрываются если статус уже установлен.

### ✅ [ADM-016] Order: PATCH /admin/orders/:id/status + кнопка Cancel
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/admin-cancel-order.use-case.ts` (новый)
  - `apps/api/src/modules/admin/admin.controller.ts` — `PATCH /admin/orders/:id/status`
  - `apps/api/src/modules/admin/admin.module.ts` — зарегистрирован AdminCancelOrderUseCase
  - `apps/admin/src/pages/OrdersPage.tsx` — кнопка "Отменить" в строке + confirm-модалка
- **Что сделано:** Admin может отменить любой не-терминальный заказ. Use-case обходит ролевые ограничения. INV-A01 соблюдён. В UI кнопка скрыта для DELIVERED/CANCELLED.

### ✅ [ADM-017] Product: PATCH /admin/products/:id/archive + кнопка в ProductsPage
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/admin.controller.ts` — `PATCH /admin/products/:id/archive` с audit log
  - `apps/admin/src/pages/ProductsPage.tsx` — кнопка "В архив" рядом с hide/restore
- **Что сделано:** Новый эндпоинт по паттерну hide/restore. Пишет audit log (INV-A01). Кнопка скрыта если статус уже ARCHIVED.

### ✅ [ADM-018] ModerationCase: кнопки "Закрыть кейс" / "Переоткрыть"
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/moderation/moderation.controller.ts` — `PATCH /:id/close`, `PATCH /:id/reopen`
  - `apps/admin/src/pages/ModerationPage.tsx` — кнопка "Закрыть" на open-карточках + вкладка "Закрыты" с "Переоткрыть"
- **Что сделано:** Два новых эндпоинта. Каждый пишет `ModerationAction` + audit log (INV-A01). В UI — кнопка "Закрыть" в конце ряда кнопок на open-кейсах. Новая вкладка "Закрыты" загружает `/admin/moderation?status=closed` и показывает только кнопку "Переоткрыть".

---

## 2026-04-02

### ✅ [WEB-015] Socket.IO — emit `order:new` и `order:status_changed`
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/socket/orders.gateway.ts` (новый) — WebSocketGateway
  - `apps/api/src/socket/socket.module.ts` (новый) — экспортирует OrdersGateway
  - `apps/api/src/modules/orders/use-cases/update-order-status.use-case.ts` — emit после смены статуса
  - `apps/api/src/modules/checkout/use-cases/confirm-checkout.use-case.ts` — emit при создании заказа
  - `apps/api/src/modules/orders/orders.module.ts` — добавлен SocketModule
  - `apps/api/src/modules/checkout/checkout.module.ts` — добавлен SocketModule
- **Что сделано:** Seller подключается к room `seller:{storeId}` через событие `join-seller-room`. При новом заказе (checkout) → `order:new`. При смене статуса → `order:status_changed` с полями `id, storeId, status, oldStatus, totalAmount, currencyCode, deliveryFee, createdAt`. Азим может подключить WEB-026 (заменить polling на Socket.IO).

### ✅ [ADM-009] Moderation queue — SLA-таймер + assign + action labels
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:** `apps/admin/src/pages/ModerationPage.tsx`
- **Что сделано:** SLA 24ч от `createdAt` — зелёный >8ч, жёлтый 2–8ч, красный <2ч / просрочен. Граница карточки красная при overdue. Кнопка "Взять" (PATCH `/assign`) появляется только если не назначен. Все кнопки получили текстовые метки (было только иконки). Минимум 10 символов в причине отклонения.

### ✅ [ADM-011] Product hide/restore
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/products/repositories/products.repository.ts` — добавлен `findAll(filters)`
  - `apps/api/src/modules/admin/admin.controller.ts` — `GET /admin/products`, `PATCH /admin/products/:id/hide`, `PATCH /admin/products/:id/restore`
  - `apps/api/src/modules/admin/admin.module.ts` — добавлен `ProductsModule`
  - `apps/admin/src/pages/ProductsPage.tsx` (новый) — таблица товаров с фильтром статуса
  - `apps/admin/src/App.tsx` — роут `/products`
  - `apps/admin/src/layouts/DashboardLayout.tsx` — пункт "Товары" в nav
- **Что сделано:** Список всех товаров платформы. Фильтр по статусу. Кнопка "Скрыть" → `HIDDEN_BY_ADMIN`, "Восстановить" → `ACTIVE`. Миниатюра товара, цена, статус-бейдж.

### ✅ [ADM-008] Admin auth — token refresh + centralised auth helpers
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/admin/src/lib/api.ts` — добавлен `auth` хелпер, refresh singleton, retry после 401
  - `apps/admin/src/pages/LoginPage.tsx` — `auth.setTokens()` вместо прямого sessionStorage
  - `apps/admin/src/layouts/DashboardLayout.tsx` — logout через `auth.clear()`
  - `apps/admin/src/App.tsx` — `PrivateRoute` принимает access ИЛИ refresh токен
- **Что сделано:** Access token 15 мин → при 401 автоматически пробует refresh. Singleton promise предотвращает race condition при параллельных запросах. Если refresh тоже упал — `auth.clear()` + redirect `/login`.

### ✅ [WEB-022] DEV_OTP_ENABLED=true на Railway
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** Railway Dashboard — сервис `savdo-api` → Variables
- **Что сделано:** Установлен `DEV_OTP_ENABLED=true`. Азим теперь видит OTP коды в Railway Logs без Telegram бота.

### ✅ [ADM-012] Order overview с фильтрами
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/repositories/admin.repository.ts` — добавлен `listOrders(filters)`
  - `apps/api/src/modules/admin/admin.controller.ts` — `GET /admin/orders?status=&storeId=&page=&limit=`
  - `apps/api/src/modules/admin/admin.module.ts` — добавлен `OrdersModule`
  - `apps/admin/src/pages/OrdersPage.tsx` — таблица заказов с фильтрами по статусу
- **Что сделано:** Все заказы платформы. Фильтр по 6 статусам. Клиентская фильтрация по номеру/телефону/магазину. Пагинация 25 шт. Таблица: номер, магазин, покупатель, сумма, статус, дата.

### ✅ [ADM-013] Global search по телефону / номеру заказа / slug
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/repositories/admin.repository.ts` — `globalSearch(q)` — параллельный поиск users/orders/stores
  - `apps/api/src/modules/admin/admin.controller.ts` — `GET /admin/search?q=`
  - `apps/admin/src/layouts/DashboardLayout.tsx` — GlobalSearch компонент с 350ms debounce
- **Что сделано:** Поиск от 2 символов. Результаты разбиты по группам: пользователи (по телефону), заказы (по orderNumber), магазины (по name/slug). Клик → переход на нужную страницу. Закрытие по клику вне.

### ✅ [ADM-014] Seller detail — история moderation actions
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/repositories/admin.repository.ts` — `findSellerById` переписан: отдельный запрос `moderationCase.findMany({ where: { entityType: 'seller', entityId } })`
  - `apps/admin/src/pages/SellerDetailPage.tsx` — секция "История модерации"
- **Что сделано:** `ModerationCase` использует `entityId: String` (не FK), поэтому отдельный `findMany` в транзакции. Страница показывает до 20 последних кейсов, каждый с действиями (APPROVE/REJECT/REQUEST_CHANGES/ESCALATE), цветной левой полосой, телефоном администратора и комментарием.

---

## 2026-04-01

### ✅ [ADM-001..008] Admin Panel — с нуля до продакшна
- **Важность:** 🔴 Критическая
- **Дата:** 01.04.2026
- **Файлы:** `apps/admin/` (весь каталог), `apps/admin/Dockerfile`, `apps/admin/nginx.conf`, `apps/admin/railway.toml`, `apps/admin/src/lib/api.ts`, `apps/admin/src/lib/hooks.ts`, `apps/admin/src/pages/`
- **Что сделано:**
  - Переписан с Next.js → **Vite + React SPA** (правильный стек для SPA без SSR)
  - Дизайн: **Liquid Authority** (тёмная тема, navy + indigo)
  - OTP логин: 4-значный код, таймер 300 сек, `purpose: 'login'` в обоих запросах
  - Все страницы подключены к реальному API (sellers, stores, moderation, audit-logs, dashboard)
  - Dockerfile: multi-stage (builder + nginx), `VITE_API_URL` через ARG
  - nginx.conf: шаблон через `envsubst` (`$PORT`), размещён в `/etc/nginx/templates/`
  - Задеплоен на Railway → `https://savdo-builderadmin-production.up.railway.app`

### ✅ [API-005] Backend Railway деплой — исправлен
- **Важность:** 🔴 Критическая
- **Дата:** 01.04.2026
- **Файлы:** `apps/api/src/main.ts`, `apps/api/start.sh`, `apps/api/railway.toml`
- **Что сделано:** `app.listen(port, '0.0.0.0')` — Railway healthcheck не мог достучаться. Добавлен `start.sh`: сначала `prisma migrate deploy`, потом запуск. `healthcheckTimeout` → 300 сек.

### ✅ [API-006] CORS — все 4 домена
- **Важность:** 🔴 Критическая
- **Дата:** 01.04.2026
- **Файлы:** Railway Variables (`ALLOWED_ORIGINS`)
- **Что сделано:** Добавлены все фронтенды: `savdo-builder-production`, `savdo-builderadmin-production`, `savdo-builder-by-production`, `savdo-builder-sl-production`

### ✅ [TYPES-001] PaginationMeta — убран дубль TS2308
- **Важность:** 🔴 Критическая
- **Дата:** 01.04.2026
- **Файлы:** `packages/types/src/api/orders.ts`
- **Что сделано:** Удалён дублирующий `export interface PaginationMeta`. Единственный источник: `packages/types/src/common.ts`

### ✅ [GIT-001] Мердж `feature/api-layer` → `main`
- **Важность:** 🟡 Важная
- **Дата:** 01.04.2026
- **Файлы:** `pnpm-lock.yaml`, `docs/done/web.md` (конфликты разрешены через `--theirs`)
- **Что сделано:** Смержена ветка Azim с реальным API для web-buyer и web-seller

---

## 2026-03-31

### ✅ [WEB-D01] web-buyer — Dockerfile + railway.toml
- **Важность:** 🟡 Важная
- **Дата:** 31.03.2026
- **Файлы:** `apps/web-buyer/Dockerfile`, `apps/web-buyer/railway.toml`
- **Что сделано:**

| Параметр | Значение |
|----------|----------|
| Стадии сборки | `base → deps → builder → runner` |
| Монорепо | копируются `packages/` + `apps/web-buyer/` |
| Install | `pnpm install --no-frozen-lockfile` |
| Build | `pnpm --filter web-buyer build` |
| Build ARG | `NEXT_PUBLIC_API_URL` |
| Output | `.next/standalone` + `.next/static` + `public/` |
| PORT | `3002`, `HOSTNAME=0.0.0.0` |
| Start | `node apps/web-buyer/server.js` |
| watchPatterns | `apps/web-buyer/**`, `packages/types/**`, `packages/ui/**` |
| build.args | `NEXT_PUBLIC_API_URL = "${{api.RAILWAY_PUBLIC_DOMAIN}}"` |
| healthcheck | `/`, timeout 60s |
| restartPolicy | `ON_FAILURE`, max 3 retries |

### ✅ [WEB-D02] web-seller — Dockerfile + railway.toml
- **Важность:** 🟡 Важная
- **Дата:** 31.03.2026
- **Файлы:** `apps/web-seller/Dockerfile`, `apps/web-seller/railway.toml`
- **Что сделано:**

| Параметр | Значение |
|----------|----------|
| Стадии сборки | `base → deps → builder → runner` |
| Монорепо | копируются `packages/` + `apps/web-seller/` |
| Install | `pnpm install --no-frozen-lockfile` |
| Build | `pnpm --filter web-seller build` |
| Build ARG | `NEXT_PUBLIC_API_URL` |
| Output | `.next/standalone` + `.next/static` + `public/` |
| PORT | `3001`, `HOSTNAME=0.0.0.0` |
| Start | `node apps/web-seller/server.js` |
| watchPatterns | `apps/web-seller/**`, `packages/types/**`, `packages/ui/**` |
| build.args | `NEXT_PUBLIC_API_URL = "${{api.RAILWAY_PUBLIC_DOMAIN}}"` |
| healthcheck | `/`, timeout 60s |
| restartPolicy | `ON_FAILURE`, max 3 retries |

---

## 2026-03-25

### ✅ [API-001] render.yaml → Railway конфиг
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/api/railway.toml` (создан), `render.yaml` (удалён)
- **Что сделано:** Создан `apps/api/railway.toml` с Dockerfile builder, healthcheck на `/api/v1/health`, watchPatterns для `apps/api/**` и `packages/**`. Удалён `render.yaml`. Обновлён `docs/tasks/backend.md`.

### ✅ [API-002] CI/CD — GitHub Actions для backend
- **Важность:** 🟡 Важная
- **Файлы:** `.github/workflows/ci-backend.yml`
- **Что сделано:** Настроен CI pipeline — запускается только при изменениях в `apps/api/**`, `packages/db/**`, `packages/types/**`. Шаги: pnpm install → prisma generate → tsc --noEmit → lint → build → test. Сервисы: PostgreSQL 16 + Redis 7.

### ✅ [API-003] Socket.IO Redis Adapter
- **Важность:** 🟡 Важная
- **Файлы:** `apps/api/src/socket/redis-io.adapter.ts`, `apps/api/src/main.ts`
- **Что сделано:** Уже было полностью реализовано — `RedisIoAdapter` подключён в `main.ts`, использует `@socket.io/redis-adapter`. Задача закрыта как выполненная.

### ✅ [API-004] Seller Analytics Endpoint
- **Важность:** 🟢 Обычная
- **Файлы:** `apps/api/src/modules/analytics/repositories/analytics.repository.ts`, `apps/api/src/modules/analytics/use-cases/get-seller-summary.use-case.ts`, `apps/api/src/modules/analytics/analytics.controller.ts`, `apps/api/src/modules/analytics/analytics.module.ts`, `docs/contracts/web-seller.md`
- **Что сделано:** Добавлен `GET /api/v1/analytics/seller/summary` для SELLER роли. Возвращает `{ views, topProduct, conversionRate }` за последние 30 дней. Top product определяется через `$queryRaw` по jsonb полю `event_payload`. Контракт обновлён.

---

# Done — Азим

## 2026-04-01

### ✅ [WEB-010] Seller /products/create — форма с React Hook Form
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`
- **Что сделано:** Форма создания товара через RHF. Поля: title, description, basePrice, SKU, isVisible. `useCreateProduct()` → `track.productCreated()` → `router.push('/products')`. `react-hook-form` добавлен в web-seller.

### ✅ [WEB-011] Seller onboarding wizard — 4 шага
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/web-seller/src/app/(onboarding)/layout.tsx`, `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx`
- **Что сделано:** 4-шаговый wizard с progress bar. Шаг 1: name + slug (авто-генерация). Шаг 2: telegram + город → `createStore` + `updateProfile` параллельно. Шаг 3: первый товар (можно пропустить). Шаг 4: submit for review → `submitStore` → redirect `/dashboard`. Отдельный layout без sidebar.

### ✅ [WEB-012] Analytics events — seller + buyer
- **Важность:** 🟡 Важная
- **Файлы:** `apps/web-seller/src/lib/analytics.ts`, `apps/web-buyer/src/lib/analytics.ts`, `apps/web-buyer/src/components/TrackView.tsx`
- **Что сделано:** Типизированные events через union type. Seller: signup_started, otp_verified, store_created, seller_profile_completed, first_product_created, product_created, store_submitted_for_review, store_link_copied, order_status_changed. Buyer: storefront_viewed, product_viewed, variant_selected, add_to_cart, checkout_started, order_created. `console.debug` в dev, готов к PostHog/Segment. `TrackStorefrontView` — клиентский враппер для server component.

### ✅ [WEB-013] Buyer checkout → реальный API
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** Удалены все моки. Добавлен inline OTP gate (phone → code, purpose: "checkout"). После верификации: `useCheckoutPreview()` → форма адреса → `useConfirmCheckout()`. На успех: `track.orderCreated()` → `router.replace('/orders/:id')`. Защита от пустой корзины, stockWarnings, error banner.

### ✅ [WEB-014] Seller orders → PATCH статус
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/web-seller/src/app/(dashboard)/orders/page.tsx`
- **Что сделано:** Удалён mock ORDERS массив. `useSellerOrders()` с фильтрами по статусу (табы). Кнопки forward transition по state machine: PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED. Cancel modal с обязательной причиной (PENDING/CONFIRMED/PROCESSING→CANCELLED). `track.orderStatusChanged(id, from, to)` после каждого PATCH. Loading skeleton, empty state, error state. Responsive: карточки на мобиле, таблица на десктопе.

---

## 2026-04-02

### ✅ [WEB-021] Buyer /chats страница
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-buyer/src/lib/api/chat.api.ts` (новый), `apps/web-buyer/src/hooks/use-chat.ts` (новый), `apps/web-buyer/src/app/(shop)/chats/page.tsx` (новый)
- **Что сделано:** Страница отсутствовала — nav ссылался на 404. OTP gate если не авторизован. `useThreads()` → список чатов. `useMessages()` с polling каждые 10с (до Socket.IO). `useSendMessage()`. Отображает заказ по contextId. Mobile: список ↔ чат (toggle). Desktop: side-by-side. Buyer пишет справа (фиолетовый), продавец слева (серый с иконкой 🏪).

### ✅ [WEB-020] Buyer cart → реальные данные
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:** Убраны INITIAL_ITEMS и STORE_NAME mock. `useCart()` → реальные items. `useUpdateCartItem()` на +/- кнопках. `useRemoveCartItem()` на кнопке удаления и при qty→0. Фото товара через `product.mediaUrl` + fallback 📦. Variant title если есть. `cart.totalAmount` в итоге. Loading skeleton, empty state, error state. Badge на nav иконке.

### ✅ [WEB-019] Seller chat → реальный API
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-seller/src/lib/api/chat.api.ts` (новый), `apps/web-seller/src/hooks/use-chat.ts` (новый), `apps/web-seller/src/app/(dashboard)/chat/page.tsx`
- **Что сделано:** Убран CHATS mock. `useThreads()` → список тредов с unread count. `useMessages(threadId)` → история сообщений. `useSendMessage()` → отправка (Enter или кнопка). `useResolveThread()` → кнопка "Закрыть чат". Сообщения SELLER справа (фиолетовые), BUYER слева. Auto-scroll к последнему сообщению. Skeleton, empty state, closed state.

### ✅ [WEB-018] Buyer profile page
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/profile/page.tsx`
- **Что сделано:** Убрана заглушка. OTP gate если не авторизован. После логина: аватар + телефон, быстрые ссылки (заказы, корзина), logout с confirm-диалогом.

### ✅ [WEB-017] Buyer orders → реальные данные (список + детали)
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/orders/page.tsx`, `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`
- **Что сделано:** `/orders` — OTP gate если не авторизован, после логина `useOrders()` + фильтры по статусу. `/orders/:id` — убран MOCK_ORDER, реальные данные через `useOrder(id)`. Progress bar: PENDING/CONFIRMED/SHIPPED/DELIVERED. PROCESSING → шаг "Подтверждён". store.telegramContactLink → кнопка "Написать продавцу". `useCancelOrder()` для PENDING/CONFIRMED. Loading skeleton, error state.

### ✅ [WEB-025] Dashboard: copy store link + fix quick action + TS cleanup
- **Важность:** 🟡 Важная
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx`, `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`, `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`, `apps/web-seller/src/lib/api/products.api.ts`, `apps/web-seller/src/hooks/use-products.ts`, `apps/web-seller/next.config.ts`, `apps/web-buyer/next.config.ts`
- **Что сделано:** (1) Кнопка "Скопировать ссылку" на карточку слага в dashboard — `navigator.clipboard` + `track.storeLinkCopied()` + "Скопировано" badge 2s. (2) Quick action "Добавить товар" → `/products/create` (было `/products`). (3) Заказы в dashboard кликабельны → `/orders/:id`. (4) Исправлены TypeScript ошибки: `getSellerProduct` теперь возвращает `Product` (со `sku`), PaymentStatus приведён к реальному enum (UNPAID/PAID/REFUNDED), убраны несуществующие поля. (5) `tsc --noEmit` оба приложения — 0 ошибок.

### ✅ [WEB-023] Seller /products/:id/edit — редактирование товара
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`, `apps/web-seller/src/app/(dashboard)/products/page.tsx`
- **Что сделано:** Страница редактирования товара через RHF. `useSellerProduct(id)` + `useEffect` для pre-populate формы. `isDirty` guard на кнопке сохранения. Блок статусов: активен/черновик/архив через `useUpdateProductStatus()`. Удаление через `useDeleteProduct()` с confirm dialog. Admin-hidden banner если статус HIDDEN_BY_ADMIN. В списке товаров добавлена ссылка "Изменить" → `/products/:id/edit`.

### ✅ [WEB-024] Seller /orders/:id — детальная страница заказа
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`, `apps/web-seller/src/app/(dashboard)/orders/page.tsx`
- **Что сделано:** Детальная страница заказа. `useSellerOrder(id)` → список товаров с кол-вом и ценами, адрес доставки, метод и статус оплаты, комментарий покупателя. Action panel: forward transition + отмена с причиной (CancelModal). `track.orderStatusChanged()` после каждого действия. Loading skeleton, error state. В списке заказов: ID и адрес — кликабельные ссылки на детальную страницу.

### ✅ [WEB-016] Seller settings → реальная форма
- **Важность:** 🔴 Критическая
- **Дата:** 02.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/settings/page.tsx`
- **Что сделано:** Полностью переписан с мока на реальные данные. Две секции: (1) StoreSettingsSection — `useStore()` + `useUpdateStore()` + RHF, поля: name, description, city, region, telegramContactLink. (2) ProfileSettingsSection — `useSellerProfile()` + `useUpdateSellerProfile()` + RHF, поля: fullName, telegramUsername, languageCode. Каждая секция независима, своя кнопка сохранения. `isDirty` guard — кнопка активна только при изменениях. "Сохранено" badge на 3 сек после успеха. Loading skeleton, inline error. PATCH `/seller/store` + PATCH `/seller/me`.
