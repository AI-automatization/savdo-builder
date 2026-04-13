# Done — Азим + Полат

## 2026-04-13 — Сессия 17: SEO / OG + поиск заказов + buyer UX + onboarding fix

### 🔴 [WEB-SELLER-060] Починен BUYER→SELLER onboarding flow
- **Важность:** 🔴 КРИТИЧЕСКИЙ
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx`, `lib/api/seller.api.ts`, `hooks/use-seller.ts`
- **Что сделано:**
  - Onboarding вызывал `POST /seller/store` напрямую. Для BUYER это 403 (endpoint требует role=SELLER) — значит **ни один BUYER не мог стать продавцом через веб**.
  - Теперь Step2 сначала вызывает `POST /seller/apply` (Polat, 5405462) если `user.role !== 'SELLER'` — меняется роль, приходят новые токены, сохраняются через `login()`.
  - Добавлен `applySeller()` в `lib/api/seller.api.ts`, экспортирован тип `ApplySellerResponse`.
  - `useStore()` теперь принимает `{ enabled }` — для BUYER на onboarding не дёргаем `/seller/store` (вернул бы 403 в консоль).

---

## 2026-04-13 — Сессия 17: SEO / OG + поиск заказов + buyer UX

### ✅ [WEB-BUYER-050] web-buyer orders: поиск + CTA для пустого списка
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/(shop)/orders/page.tsx`
- **Что сделано:** Client-side поиск по `#ABC123` / адресу (показывается только при >3 заказах). В пустом состоянии при ALL-фильтре — кнопка «Перейти к магазинам» (ссылка на главную). Empty state для «не найдено» отдельным сообщением 🔍.

---

## 2026-04-13 — Сессия 17: SEO / OG + поиск заказов в web-seller

### ✅ [WEB-SELLER-040] web-seller orders: client-side поиск
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-seller/src/app/(dashboard)/orders/page.tsx`
- **Что сделано:** Поиск по `#ABC123` / городу / адресу над загруженными заказами. Автосброс при смене status-фильтра. Empty state разный для «ничего не найдено» vs «пустая категория». Счётчик показывает «Найдено X из Y загруженных». Backend search отдан Полату как `[API-032]`.

---

## 2026-04-13 — Сессия 17: SEO / OG теги для web-buyer

### ✅ [WEB-SEO-001] web-buyer: улучшен OG для страницы магазина
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/page.tsx`
- **Что сделано:** `generateMetadata` теперь использует coverUrl (шире для Telegram) с фолбэком на logoUrl. Добавлены twitter card, og:type, og:siteName, og:url, og:locale. Title формата "{store} — Savdo".

### ✅ [WEB-SEO-002] web-buyer: добавлен generateMetadata на странице товара
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/layout.tsx` (новый)
- **Что сделано:** Новый server-side layout с server fetch товара через `GET /storefront/products/:id`. OG image = первая mediaUrl, description = описание (обрезка 160 симв) или цена. Страница товара остаётся client component для интерактива.

### ✅ [WEB-SEO-003] web-buyer: metadataBase + default OG в root layout
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/layout.tsx`
- **Что сделано:** `metadataBase` из `NEXT_PUBLIC_BUYER_URL` — OG URLs теперь абсолютные (Telegram их требует). Добавлены default OG + twitter теги для главной. Title template "%s".

---

## 2026-04-10 — Сессия 16b: Полный аудит + фиксы багов

### ✅ [AUDIT-001] TMA: JSON.parse crash fix — CartPage, StorePage, CheckoutPage
- **Важность:** 🔴
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/pages/buyer/CartPage.tsx`, `StorePage.tsx`, `CheckoutPage.tsx`
- **Что сделано:** Обёрнуто JSON.parse localStorage в try/catch — при повреждённых данных корзина сбрасывается вместо краша

### ✅ [AUDIT-002] TMA: Error UI вместо silent .catch(() => {})
- **Важность:** 🔴
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `StoresPage.tsx`, `seller/DashboardPage.tsx`, `seller/OrdersPage.tsx`
- **Что сделано:** Все API ошибки теперь показывают UI с кнопкой "Попробовать снова"

### ✅ [AUDIT-003] TMA: AuthProvider catch — не зависает в loading
- **Важность:** 🔴
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/providers/AuthProvider.tsx`
- **Что сделано:** Добавлен .catch() в authenticateWithTelegram — при ошибке auth переходит в unauthenticated

### ✅ [AUDIT-004] TMA: Токен сохраняется в sessionStorage
- **Важность:** 🔴
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/lib/api.ts`
- **Что сделано:** Токен сохраняется в sessionStorage, восстанавливается при перезагрузке

### ✅ [AUDIT-005] web-seller: next.config.ts — убран невалидный experimental.turbo
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-seller/next.config.ts`
- **Что сделано:** Заменено experimental.turbo на turbopack.root + добавлен outputFileTracingRoot и transpilePackages

### ✅ [AUDIT-006] TMA: Валидация телефона +998 в CheckoutPage
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/pages/buyer/CheckoutPage.tsx`
- **Что сделано:** Формат +998XXXXXXXXX проверяется перед отправкой заказа

### ✅ [AUDIT-007] API client: console.warn если NEXT_PUBLIC_API_URL не задан
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/lib/api/client.ts`, `apps/web-seller/src/lib/api/client.ts`
- **Что сделано:** Warning в консоль если env var отсутствует — помогает диагностировать проблемы деплоя

### ✅ [AUDIT-008] web-seller: удалён лишний pnpm-workspace.yaml
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** удалён `apps/web-seller/pnpm-workspace.yaml`
- **Что сделано:** Дублирующий файл вызывал warning о множественных lockfiles при билде

## 2026-04-10 — Сессия 16: Чистка + аудит + фиксы

### ✅ [TMA-005] Поиск магазинов на StoresPage (TMA)
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/pages/buyer/StoresPage.tsx`
- **Что сделано:** Добавлен glass-стилизованный input с иконкой лупы, client-side фильтрация по имени/описанию через useMemo

### ✅ [TMA-006] Удалить старые /twa роуты из web-buyer
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** удалены `app/twa/`, `components/twa/` (4 файла)
- **Что сделано:** TMA — отдельное приложение, старые /twa роуты больше не нужны

### ✅ [WEB-040] OTP текст: "Код отправлен" → упоминание Telegram
- **Важность:** 🟡
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `components/auth/OtpGate.tsx`, `app/(minimal)/checkout/page.tsx`
- **Что сделано:** Текст "Код отправлен на..." заменён на "Код отправлен в Telegram на..." — соответствует реальному OTP flow через бот

### ✅ [WEB-041] Checkout: убран хардкод DELIVERY_FEE = 25_000
- **Важность:** 🔴
- **Дата:** 10.04.2026
- **Кто делал:** Азим
- **Файлы:** `app/(minimal)/checkout/page.tsx`
- **Что сделано:** Delivery fee теперь берётся из API preview response (deliveryFee). Когда Полат добавит реальную стоимость доставки в preview — заработает автоматически

---

## 2026-04-09 — Сессия 16: TMA Auth + Bot URL (Полат)

### ✅ [API-021] POST /api/v1/auth/telegram — авторизация через Telegram initData
- **Важность:** 🔴
- **Дата:** 09.04.2026
- **Кто делал:** Полат
- **Файлы:** auth.controller.ts, telegram-auth.use-case.ts, auth.repository.ts, schema.prisma
- **Что сделано:** Endpoint принимает `{ initData: string }`, валидирует HMAC-SHA256, находит/создаёт user по telegramId, возвращает JWT

### ✅ [API-022] Поменять BUYER_APP_URL/twa → TMA_URL
- **Важность:** 🔴
- **Дата:** 09.04.2026
- **Кто делал:** Полат
- **Файлы:** `apps/api/src/modules/telegram/telegram-demo.handler.ts`
- **Что сделано:** Бот теперь открывает отдельное TMA приложение через TMA_URL

---

## 2026-04-09 — Сессия 15: Telegram Mini App (TMA)

> **Задача от Полата:** создать отдельное приложение для Telegram бота, не использовать web-buyer/web-seller.

### ✅ [TMA-001] Telegram Mini App — отдельное Vite SPA
- **Важность:** 🔴
- **Дата:** 09.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/` — 27 файлов, 13 коммитов

**Что сделано:**

Создано с нуля отдельное приложение `apps/tma/` — Vite + React 19 + TypeScript + Tailwind CSS. Это фронтенд для Telegram Mini App (WebApp), который открывается внутри Telegram бота @savdo_builderBOT.

**Стек:**
- Vite (сборка, dev server) — НЕ Next.js, потому что SSR не нужен для Mini App
- React 19 + TypeScript strict
- Tailwind CSS v3 (glassmorphism дизайн)
- react-router-dom v6 (lazy loading всех страниц)
- Telegram WebApp SDK (BackButton, MainButton, HapticFeedback)

**Buyer flow (5 страниц):**
- `StoresPage` — каталог магазинов (GET /storefront/stores)
- `StorePage` — товары магазина + кнопка "добавить в корзину"
- `CartPage` — корзина (localStorage), интеграция с Telegram MainButton
- `CheckoutPage` — форма заказа (имя, телефон, адрес) → POST /orders
- `OrdersPage` — список заказов покупателя с цветными badge статусов

**Seller flow (3 страницы):**
- `DashboardPage` — 3 стат-карточки (товары, заказы, новые) + последние 5 заказов
- `OrdersPage` — список заказов + кнопки смены статуса (PATCH): Подтвердить → Отправить → Доставлен / Отменить
- `StorePage` — информация о магазине + inline-редактирование (имя, описание)

**Инфраструктура:**
- `TelegramProvider` — инициализация SDK, expand(), ready()
- `AuthProvider` — авторизация через initData → JWT (ждёт endpoint от Полата)
- `api.ts` — fetch-обёртка с автоматической инъекцией JWT токена
- `AppShell` — layout с ambient orbs, BottomNav (buyer/seller варианты), BackButton
- UI компоненты: GlassCard, Button, Badge, Spinner

**Цифры:**
- Build: **~70KB gzipped** (в 5-10 раз легче Next.js)
- 13 lazy-loaded JS чанков
- TypeScript: 0 ошибок
- Запуск: `pnpm dev:tma` → http://localhost:5173

**Спека:** `docs/superpowers/specs/2026-04-09-tma-design.md`
**План:** `docs/superpowers/plans/2026-04-09-tma-app.md`

**Что НЕ входило в scope:** OTP/SMS, чат, оплата, SEO, изменения в боте или API

---

## 2026-04-08 (сессия 14 — polish & refactor)

### ✅ [WEB-030] Notification badge в buyer навигации
- **Важность:** 🟡
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/components/layout/BottomNavBar.tsx`
- **Что сделано:** Добавлен badge непрочитанных уведомлений на иконку "Профиль" в BottomNavBar. Использует `useUnreadCount()` с auto-refetch каждые 30 сек. Disabled когда не авторизован.

### ✅ [WEB-031] Извлечён shared OtpGate компонент
- **Важность:** 🟢
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/components/auth/OtpGate.tsx` (новый), `orders/page.tsx`, `chats/page.tsx`, `profile/page.tsx`
- **Что сделано:** Убран дублированный OtpGate из 3 страниц buyer (orders, chats, profile). Теперь единый компонент с props: icon, title, subtitle.

### ✅ [WEB-032] Shared glass tokens
- **Важность:** 🟢
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/lib/styles.ts`, `apps/web-seller/src/lib/styles.ts`
- **Что сделано:** Созданы файлы с glass/glassDim/inputStyle токенами для будущего использования.

### ✅ [WEB-034] Cart badge в buyer навигации
- **Важность:** 🟡
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/components/layout/BottomNavBar.tsx`
- **Что сделано:** BottomNavBar показывает кол-во товаров в корзине через `useCart()`. Auto-fetch, не требует prop от parent.

### ✅ [WEB-035] Buyer orders пагинация
- **Важность:** 🟡
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/orders/page.tsx`
- **Что сделано:** Добавлен load-more с аккумуляцией страниц (как у seller). Лимит 20, reset при смене фильтра.

### ✅ [WEB-036] Store cover image на витрине
- **Важность:** 🟢
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/page.tsx`
- **Что сделано:** Если у магазина есть `coverUrl`, отображается баннер 128px с gradient overlay над store header.

### ✅ [WEB-037] SVG icons extraction
- **Важность:** 🟢
- **Дата:** 08.04.2026
- **Файлы:** `apps/web-buyer/src/components/icons.tsx` (новый), `BottomNavBar.tsx`
- **Что сделано:** 9 shared иконок (Shop, Cart, Chat, Orders, Profile, Back, Pin, Send, Chevron). BottomNavBar мигрирован.

---

## 2026-04-07 (сессия 13 — Полат)

### ✅ [BOT-FIX] callback_query не доставлялся (Полат)
- **Важность:** 🔴 Критическая
- **Дата:** 07.04.2026
- **Файлы:** `apps/api/src/modules/telegram/services/telegram-bot.service.ts`
- **Что сделано:** `allowed_updates` теперь включает `callback_query` — кнопки бота работают

### ✅ [TWA-FIX] GET /storefront/stores не существовал (Полат)
- **Важность:** 🔴 Критическая
- **Дата:** 07.04.2026
- **Файлы:** `apps/api/src/modules/products/products.controller.ts`, `apps/api/src/modules/stores/repositories/stores.repository.ts`
- **Что сделано:** Добавлен endpoint + `findAllPublished()` — TWA главная страница работает

### ✅ [ADM-Phase-C] Кнопка "Одобрить" для PENDING_REVIEW магазинов (Полат)
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:** `apps/api/src/modules/admin/use-cases/approve-store.use-case.ts` (новый), `admin.controller.ts`, `admin.module.ts`, `apps/admin/src/pages/StoreDetailPage.tsx`
- **Что сделано:** `POST /admin/stores/:id/approve` + кнопка в UI только для PENDING_REVIEW

## 2026-04-07 (сессия 13 — продолжение 2)

### ✅ [WEB-043] Seller настройки уведомлений (preferences)
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/notifications.api.ts` — добавлены `getPreferences()`, `updatePreferences()`
  - `apps/web-seller/src/hooks/use-notifications.ts` — `useNotifPreferences`, `useUpdateNotifPreferences`
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — секция `NotifPreferencesSection` (toggle Telegram + web push)
- **Что сделано:** Продавец может включить/выключить Telegram-уведомления и push в браузере прямо из настроек.

### ✅ [WEB-044] Cart badge в Header (web-buyer) + chat badge в sidebar (web-seller)
- **Важность:** 🔴 Баг-фикс + улучшение
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-buyer/src/components/layout/Header.tsx` — real cart count вместо хардкода `0`
  - `apps/web-seller/src/hooks/use-chat.ts` — `useUnreadChatCount()`
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — badge на "Чаты" (фиолетовый) + рефактор badge логики
- **Что сделано:** Покупатель видит реальное кол-во товаров в корзине. Продавец видит кол-во непрочитанных чатов в nav.

## 2026-04-07 (сессия 13 — продолжение)

### ✅ [WEB-042] Buyer уведомления
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/notifications.api.ts` — новый
  - `apps/web-buyer/src/hooks/use-notifications.ts` — новый (с `enabled: isAuthenticated`)
  - `apps/web-buyer/src/app/(shop)/notifications/page.tsx` — новый
  - `apps/web-buyer/src/components/layout/Header.tsx` — bell icon + unread badge
- **Что сделано:** Страница /notifications с табами "Все / Непрочитанные", auto mark-all-read on mount, клик → переход к заказу. Колокольчик с badge в шапке (показывается только при наличии непрочитанных). Auth gate для незалогиненных.

## 2026-04-07 (сессия 13 — Азим)

### ✅ [API-010] GET /auth/me — refresh user on mount
- **Важность:** 🔴 Критическая
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/auth.api.ts` — добавлен `getMe()`
  - `apps/web-seller/src/lib/auth/context.tsx` — refresh on mount
  - `apps/web-buyer/src/lib/api/auth.api.ts` — добавлен `getMe()`
  - `apps/web-buyer/src/lib/auth/context.tsx` — refresh on mount
- **Что сделано:** При старте приложения если есть токен — вызывается GET /auth/me, обновляется user state. При 401 — автоматический logout.

### ✅ [API-011] Секция "Доставка" в настройках магазина
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/seller.api.ts` — добавлены `deliveryFeeType`, `deliveryFeeAmount` в `updateStore()`
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — новый компонент `DeliverySettingsSection`
- **Что сделано:** Секция с select (бесплатно/фиксированная/договорная) + поле суммы (показывается только при fixed).

### ✅ [API-012] Телефон покупателя в деталях заказа
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`
- **Что сделано:** Показывается `order.buyer?.phone` как кликабельная ссылка `tel:` в разделе "Доставка и оплата".

### ✅ [API-013] chat:new_message → seller-room
- **Важность:** 🟡 Важная
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-seller/src/hooks/use-seller-socket.ts`
- **Что сделано:** Обработчик `chat:new_message` — toast + browser notification с именем покупателя.

### ✅ [API-014] Buyer socket — order:status_changed → buyer-room
- **Важность:** 🔴 Критическая
- **Дата:** 07.04.2026
- **Файлы:**
  - `apps/web-buyer/src/hooks/use-buyer-socket.ts` — новый хук
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx` — подключён
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — подключён
- **Что сделано:** Хук join `buyer:userId` room, слушает `order:status_changed`, invalidate queries → progress bar обновляется в реальном времени.

## 2026-04-05 (сессия 12)

### ✅ [ADM-020] Admin UI: страница /broadcast (Полат)
- **Важность:** 🟡 Важная
- **Дата:** 05.04.2026
- **Файлы:**
  - `apps/admin/src/pages/BroadcastPage.tsx` — новый
  - `apps/admin/src/App.tsx` — роут `/broadcast`
  - `apps/admin/src/layouts/DashboardLayout.tsx` — пункт "Рассылка" в nav
- **Что сделано:** Страница с textarea (HTML-теги), Telegram-превью, confirm-модалка с кол-вом получателей, таблица истории рассылок.

### ✅ [ADM-019] Backend: POST /admin/broadcast (Полат)
- **Важность:** 🟡 Важная
- **Дата:** 05.04.2026
- **Файлы:** уже был реализован в `broadcast.use-case.ts`, `admin.controller.ts`, `admin.module.ts`, схема `broadcast_logs`
- **Что сделано:** Эндпоинт существовал, зарегистрирован, работает. Подключён к UI.

### ✅ [API-014] Socket: order:status_changed → buyer-room (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 05.04.2026
- **Файлы:**
  - `apps/api/src/socket/orders.gateway.ts` — добавлены `join-buyer-room` handler и `emitOrderStatusChangedToBuyer`
  - `apps/api/src/modules/orders/use-cases/update-order-status.use-case.ts` — вызов `emitOrderStatusChangedToBuyer` после смены статуса
- **Что сделано:** При смене статуса заказа — emit `order:status_changed` в `buyer:{buyerId}`. Азим добавит `join-buyer-room` и hook в buyer app.

### ✅ [API-013] Socket: chat:new_message → seller-room (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 05.04.2026
- **Файлы:**
  - `apps/api/src/socket/chat.gateway.ts` — добавлен `emitChatNewMessage(storeId, { threadId })`
  - `apps/api/src/modules/chat/repositories/chat.repository.ts` — `findThreadById` включает `seller.store`, обновлён тип `ThreadWithMessages`
  - `apps/api/src/modules/chat/use-cases/send-message.use-case.ts` — emit в seller-room когда покупатель отправляет сообщение
- **Что сделано:** При новом сообщении от покупателя — emit `chat:new_message` в `seller:{storeId}` с payload `{ threadId }`. Азим добавит handler в `useSellerSocket`.

### ✅ [API-012] buyer.phone в деталях заказа продавца (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 05.04.2026
- **Файлы:**
  - `packages/types/src/api/orders.ts` — добавлено `buyer: { phone: string } | null` в `Order`
  - `apps/api/src/modules/orders/repositories/orders.repository.ts` — `OrderWithDetails` расширен, `findById` включает `buyer.user.phone`
- **Что сделано:** `GET /seller/orders/:id` теперь возвращает `buyer.user.phone`. Азим может показать телефон покупателя на странице деталей заказа.

### ✅ [API-011] deliveryFeeType + deliveryFeeAmount в UpdateStoreDto (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 05.04.2026
- **Файлы:**
  - `apps/api/src/modules/stores/dto/update-store.dto.ts` — добавлены `deliveryFeeType`, `deliveryFeeAmount`
  - `apps/api/src/modules/stores/repositories/stores.repository.ts` — добавлен `upsertDeliverySettings`
  - `apps/api/src/modules/stores/use-cases/update-store.use-case.ts` — upsert в `StoreDeliverySettings` при наличии полей
- **Что сделано:** `PATCH /seller/store` теперь принимает `deliveryFeeType: 'fixed'|'manual'|'none'` и `deliveryFeeAmount: number`. Обновление идёт в отдельную таблицу `store_delivery_settings` через upsert.

### ✅ [API-010] GET /auth/me (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 05.04.2026
- **Файлы:**
  - `apps/api/src/modules/auth/use-cases/get-me.use-case.ts` — новый
  - `apps/api/src/modules/auth/repositories/auth.repository.ts` — добавлен `findUserById`
  - `apps/api/src/modules/auth/auth.controller.ts` — `GET /auth/me` с `JwtAuthGuard`
  - `apps/api/src/modules/auth/auth.module.ts` — зарегистрирован `GetMeUseCase`
- **Что сделано:** Эндпоинт возвращает `{ success, data: { id, phone, isPhoneVerified, role } }`. Азим может вызывать при старте приложения для получения актуальных данных пользователя.

## 2026-04-03 (сессия 6)

### ✅ [ADM-021] Dashboard charts — recharts (Полат)
- **Важность:** 🟡 Важная
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/get-analytics.use-case.ts` — новый
  - `apps/api/src/modules/admin/admin.controller.ts` — `GET /admin/analytics/summary`
  - `apps/api/src/modules/admin/admin.module.ts` — зарегистрирован use-case
  - `apps/admin/src/pages/DashboardPage.tsx` — LineChart (30д) + BarChart (топ-5 магазинов)
  - `apps/admin/src/components/ui/input.tsx` — фикс светлой темы (CSS vars)
- **Что сделано:** Backend агрегирует заказы по дням и топ-5 магазинов за 30 дней. Frontend рендерит два графика через recharts. Input компонент теперь корректно работает в светлой теме.

### ✅ [WEB-033] Store categories CRUD + category select в product forms
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — StoreCategoriesSection (inline CRUD: add/edit/delete)
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — storeCategoryId select
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — storeCategoryId select + populate + isDirty fix
- **Что сделано:** CRUD категорий магазина в настройках — inline edit, add, delete с guard на concurrent ops и error handling. Category select в create/edit формах. isDirty учитывает category и media изменения. tsc --noEmit — 0 ошибок.

## 2026-04-03 (сессия 5)

### ✅ [WEB-027] Chat Gateway — emit `chat:message` (Полат)
- **Важность:** 🔴 Критическая (блокировал Азима)
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/api/src/socket/chat.gateway.ts` — новый, `join-chat-room` + `emitChatMessage`
  - `apps/api/src/socket/socket.module.ts` — добавлен `ChatGateway`
  - `apps/api/src/modules/chat/chat.module.ts` — импортирован `SocketModule`
  - `apps/api/src/modules/chat/use-cases/send-message.use-case.ts` — вызов `chatGateway.emitChatMessage` после сохранения
- **Что сделано:** По паттерну `orders.gateway.ts`. Gateway эмитит `chat:message` в комнату `thread:{threadId}`. Клиент вступает через `join-chat-room`. `tsc --noEmit` — без ошибок.

## 2026-04-03 (сессия 4)

### ✅ [WEB-032] Media upload — все 7 задач выполнены
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/media.api.ts` (новый) — Task 1
  - `apps/web-seller/src/components/image-uploader.tsx` (новый) — Task 2
  - `apps/web-seller/src/lib/api/products.api.ts` — Task 3 (mediaId?: string)
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — Task 4
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — Task 5
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — Task 6 (logo + cover)
- **Что сделано:** Media API layer + ImageUploader компонент (4 состояния, XHR progress, blob URL cleanup). Фото товара в create/edit формах. Logo + cover в настройках магазина. `tsc --noEmit` — 0 ошибок.

## 2026-04-03 (сессия 3)

### ✅ [WEB-031] In-app уведомления — seller
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/notifications.api.ts` (новый)
  - `apps/web-seller/src/hooks/use-notifications.ts` (новый)
  - `apps/web-seller/src/app/(dashboard)/notifications/page.tsx` (новый)
  - `apps/web-seller/src/app/(dashboard)/layout.tsx`
- **Что сделано:** Живой badge с пульсом на колокольчике (polling 30s). Страница /notifications с авто read-all, фильтром по вкладкам, навигацией к заказу по клику.

## 2026-04-03 (сессия 2)

### ✅ [WEB-030] Мелкие фиксы — products page + buyer profile
- **Важность:** 🟢
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx`
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx`
- **Что сделано:** (1) `<a href="/products/create">` → `<Link href>` (2 места) — убрана полная перезагрузка страницы при навигации. Заодно исправлен относительный импорт `../../../hooks/use-products` → `@/hooks/use-products`. (2) Убрана неиспользуемая деструктуризация `logout` из `useAuth()` в buyer/profile — `useLogout()` мутация уже делала то же самое.

---

## 2026-04-03

### ✅ [WEB-026] Socket.IO клиент — seller real-time заказы
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/socket.ts` (новый)
  - `apps/web-seller/src/hooks/use-seller-socket.ts` (новый)
  - `apps/web-seller/src/app/(dashboard)/layout.tsx`
  - `apps/web-seller/src/app/globals.css`
  - `apps/web-seller/package.json` (добавлен `socket.io-client`)
- **Что сделано:** Socket.IO клиент подключён к backend (OrdersGateway Полата). При `order:new` → invalidate list + toast уведомление. При `order:status_changed` → invalidate list + detail. Сокет монтируется в DashboardLayout, join-seller-room отправляется после получения storeId.

### ✅ [WEB-029] Analytics — реальный sink вместо console.log
- **Важность:** 🟡
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/analytics.ts`
  - `apps/web-buyer/src/lib/analytics.ts`
- **Что сделано:** `send()` теперь вызывает `POST /api/v1/analytics/track` (fire-and-forget). Buyer передаёт `storeId` из payload. Ошибки не пробрасываются — best-effort.

### ✅ [WEB-028] Seller analytics страница
- **Важность:** 🟢
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/analytics/page.tsx` (новый)
  - `apps/web-seller/src/hooks/use-analytics.ts` (новый)
  - `apps/web-seller/src/lib/api/analytics.api.ts` (новый)
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` (добавлен пункт "Аналитика" в nav)
- **Что сделано:** Страница `/analytics` с карточками views, conversionRate, топ товар. Топ товар рефетчит название через `useSellerProduct`. staleTime 5 мин.

---

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
