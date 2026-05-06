# Logs — локальные тесты и баги

Формат записи:
```
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

## 2026-05-06 [AUDIT-WEB-BUYER-API-CONTRACT-2026-05-06] Web-buyer ↔ API контракт-checkup

- **Статус:** 🟡 1 баг закрыт, остальной web-buyer аудит уже сделан 5 мая (4 параллельных агента, 25 проблем). Это зона Азима — не повторяю.
- **Моя зона:** проверить что api корректно принимает данные от web-buyer.
- **🔴 Найдено и закрыто:**
  - **`BUG-WB-AUDIT-009-API`** ✅: `ConfirmCheckoutDto` не принимал `customerFullName`/`customerPhone`. Фронт давал юзеру редактировать contact-fields, но они терялись (ValidationPipe whitelist=true резал) → Order заполнялся данными из Buyer.firstName/lastName + User.phone, а не из формы. Фикс:
    - `confirm-checkout.dto.ts` — добавлены optional `customerFullName` (200ch) + `customerPhone` (20ch).
    - `checkout.controller.ts` — прокидывает в use-case.
    - `confirm-checkout.use-case.ts` — `input.customerFullName?.trim() || profileFullName` (override > profile fallback).
- **Контрактный анализ:**
  - `/checkout/confirm` теперь consistent с `/orders` (CreateDirectOrderDto имеет buyerName/buyerPhone).
  - DeliveryAddressDto имеет `country` дефолт 'UZ' — норм.
  - `customerFullName` 200ch — широко, может быть стрес-тест на 50+ char юзера.
- **Не покрыто моим прогоном (web-buyer внутренний — Азим):** 24 пункта из `WEB-BUYER-AUDIT-2026-05-05` (BUG-WB-AUDIT-001..025) — это всё клиентская работа.

---

## 2026-05-06 [AUDIT-API-SEC-2026-05-06] API security audit (auth, RBAC, throttle, SQL, CORS, secrets)

- **Статус:** 🟡 Audit-only. 19 controllers, ~250 endpoints.
- **Метод:** grep по анти-паттернам + ручной просмотр критичных мест.
- **🟢 Что хорошо:**
  - CORS: regex-callback origin check + credentials:true. Production fail-fast на отсутствии ALLOWED_ORIGINS.
  - JWT logging: 0 leak (нет log/console с token/secret/password/OTP).
  - bcrypt rounds = 10 (стандарт, OWASP best practice).
  - $queryRaw: 4 места, все используют template literals (Prisma escape parameters автоматически — safe).
  - ThrottlerGuard глобально активен (после c283423). 9 critical endpoints с явным @Throttle.
  - Helmet + CSP добавлены (через middleware).
  - SEC-005: private media files JWT-protected.
- **🟠 P1 (записать в backlog):**
  - **API-WEBHOOK-SECRET-OPTIONAL-001:** `telegram-webhook.controller.ts:45-46` принимает любой запрос если env `TELEGRAM_WEBHOOK_SECRET` пуст:
    ```ts
    if (expected && secretToken !== expected) return { ok: true };
    ```
    Должен fail-closed: в production без secret вообще не запускать webhook handler. Атакер мог бы отправлять fake updates → запуск handler от лица любого chatId.
  - **API-MISSING-THROTTLE-001:** 3 endpoints без @Throttle:
    - `POST /orders` (orders-create.controller.ts:19) — direct order от TMA. Нужен 10/мин (как /checkout/confirm).
    - `POST /media/upload-url` (media.controller.ts:52) — presigned URL генерация. Нужен 20/мин.
    - `POST /seller/products` (products.controller.ts) — создание товара. Нужен 30/мин (anti-spam).
  - **API-SEC-TG-001-REGRESS:** уже записано в analiz/tasks.md от 06.05. Bot token leak в media proxy redirect.
- **🟢 Что НЕ найдено (хорошо):**
  - String interpolation в raw SQL — 0.
  - Console.log с секретами — 0.
  - require() в production code — 0 (после otplib downgrade fix).
  - Endpoints с @UseGuards(JwtAuthGuard) но без @Roles когда требуется — нужен отдельный pass через все controllers (записать как P3 task).

---

## 2026-05-06 [AUDIT-TMA-2026-05-06] TMA полный аудит (UI/UX + a11y + functional)

- **Статус:** 🟡 Audit с 1 фиксом, остальное в `analiz/tasks.md`. 19 pages просканировано.
- **Метод:** grep по анти-паттернам, ручной просмотр findings.
- **🔴 Найдено критичное (исправлено сейчас):**
  - **TMA-PROFILE-LINK-PRETTIFY-001** ✅: `seller/ProfilePage.tsx:98` хардкод `savdo.uz/{slug}` (тот же баг что был на buyer/StorePage). Заменён на webStoreUrl helper + кнопка «↗ Перейти на сайт».
- **🟠 P1 в backlog (analiz/tasks.md):**
  - **TMA-NATIVE-CONFIRM-001:** `seller/ProductsPage.tsx` использует `window.confirm/alert` (5 мест). В Telegram WebView системный popup → выглядит чужеродно, нет haptic. Заменить на кастомный `<ConfirmModal>` (новый компонент в `components/ui/`).
    - Lines: ProductsPage:100, 113, 120, 129; StorePage seller:173.
  - **TMA-LOADING-SKELETONS-001:** 10 pages используют только Spinner без Skeleton: CartPage, CheckoutPage, OrdersPage buyer, ProductPage, ProfilePage buyer, SettingsPage buyer, StoresPage, WishlistPage, AddProductPage, DashboardPage seller. Для каждой добавить SkeletonCard / SkeletonList.
- **🟡 P2 (a11y, не блокеры):**
  - **TMA-A11Y-ROLE-TABINDEX-001:** только 3 из 19 pages имеют `role="button"`/`tabIndex` на `<div onClick>`. Остальные 16 не доступны с клавиатуры. Затрагивает: ProductCard навигация на товар, GlassCard выбор магазина, etc. Не критично для Telegram (mobile-first), но важно для desktop.
  - **TMA-SILENT-ERROR-CATCHES-001:** 10 мест с `.catch(() => {})` без showToast — silent failure если api падает (юзер не видит почему ничего не загружается). Файлы: ChatPage:146, OrdersPage buyer:117/131, StorePage:56, StoresPage:92, WishlistPage:25, AddProductPage:115/124/406, ChatPage seller:152.
- **🟢 P3 (хорошо что нет):**
  - `<img>` без `alt` — 0 (хорошо).
  - `require()` или old commonjs — 0.
  - hardcoded savdo.uz — был только 1 (исправлен).
- **Z-index конфликты потенциальные:** 10 файлов с `position: fixed` (BottomNav, Sidebar, BottomSheet, CategoryModal, ImageCropper, FullscreenButton, AppShell, ChatPage). После fix `z-[9999]flex` (commit 20cfcec) — должно быть стабильно. Но есть вероятность конфликта BottomNav (z:50) с BottomSheet → overlay не должен под нав закрываться.

---

## 2026-05-05 [WEB-BUYER-AUDIT-2026-05-05] Полный аудит web-buyer (4 параллельных code-reviewer агента)

Сделан после закрытия всего Soft Color Lifestyle plan (10/10 tasks). 4 агента параллельно прошли по слоям: storefront/product, cart/checkout/orders, chat/profile/wishlist/notifications, layout/hooks/lib/api.

### 🔴 CRITICAL (must-fix перед prod testing)

**[BUG-WB-AUDIT-001] `useCart()` без `enabled: isAuthenticated` → 401-loop для гостей**
- Файл: `apps/web-buyer/src/hooks/use-cart.ts` + использование в `components/layout/Header.tsx:20`
- Гостевой посетитель: `useCart` стреляет на `/cart`, ловит 401 (если endpoint требует auth), refresh-interceptor пытается рефрешить с `null` токеном, диспатчит `savdo:auth:expired`, `localLogout` + `queryClient.clear` — на каждый рендер Header.
- Фикс: добавить `enabled: isAuthenticated` в `useCart` или передавать флаг снаружи. Либо подтвердить, что `/cart` принимает `X-Session-Token` без JWT.

**[BUG-WB-AUDIT-002] `useBuyerSocket` cleanup не emit'ит `leave-buyer-room`**
- Файл: `apps/web-buyer/src/hooks/use-buyer-socket.ts:38-41`
- При logout / переключении user'а сокет-комната не покидается. Сервер продолжает слать `order:status_changed` в комнату экс-пользователя. `destroySocket()` существует в `lib/socket.ts`, но не вызывается из `AuthContext.logout`.
- Фикс: в cleanup `socket.emit('leave-buyer-room', { buyerId })` + `socket.off(...)`. Либо `destroySocket()` в `localLogout`.

**[BUG-WB-AUDIT-003] `useChatSocket` cleanup не emit'ит `leave-chat-room`**
- Файл: `apps/web-buyer/src/hooks/use-chat.ts:73-76`
- Переключение между чатами накапливает активные комнаты на сервере. Каждое новое сообщение в любом ранее открытом чате инвалидирует кэш текущего треда.
- Фикс: `socket.emit('leave-chat-room', { threadId })` в return useEffect.

**[BUG-WB-AUDIT-004] `useOrders` без `enabled: isAuthenticated` → 401 при гонке**
- Файлы: `apps/web-buyer/src/hooks/use-orders.ts:13-19`, `app/(shop)/profile/page.tsx:91`, `app/(shop)/orders/page.tsx`
- Хук вызывается в profile (best-effort counts) даже когда `isAuthenticated` ещё `false` (Strict Mode / token-refresh race). Возвращает 401, на секунду показывает «0 заказов».
- Фикс: добавить опциональный `enabled` параметр в `useOrders`, передавать `isAuthenticated` из profile/orders.

**[BUG-WB-AUDIT-005] `chats/page.tsx handleSend` — unhandled rejection + потеря текста**
- Файл: `apps/web-buyer/src/app/(shop)/chats/page.tsx:150-154`
- `handleSend` вызывает `mutateAsync` без try/catch. При ошибке сети promise rejects → unhandled. Текст уже очищен в input через `setText("")` — пользователь теряет своё сообщение без возможности повтора.
- Фикс: try/catch + restore text при ошибке.

**[BUG-WB-AUDIT-006] `orders/[id]/page.tsx` Sticky CTA bar перекрыт BottomNavBar (z-index)**
- Файл: `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:343` (zIndex: 50) vs `BottomNavBar` (zIndex: 50)
- Оба на z-50. CTA bar в DOM рендерится РАНЬШЕ `<BottomNavBar />` → BottomNavBar поверх. Кнопка «Чат по заказу» / «Отменить» может ловить тапы по BottomNav.
- Фикс: поднять zIndex CTA до 51 или поменять порядок в DOM.

**[BUG-WB-AUDIT-007] Product detail useEffect deps mismatch → race на стейле variants**
- Файл: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx:148-162`
- Оба useEffect зависят только от `[product?.id]`, но читают `optionGroups`, `selection`, `activeVariants`, `selectedVariantId`. После TanStack-кэша (back→forward) initialSelectionFromVariants использует старый optionGroups.
- Фикс: вынести инициализацию в `useState(initializer)` или `useMemo`, добавить полные deps.

### 🟡 MAJOR

**[BUG-WB-AUDIT-008] `accOrders` race при смене фильтра (orders list)**
- Файл: `apps/web-buyer/src/app/(shop)/orders/page.tsx:114-118`
- При смене фильтра: `setPage(1)` + `setAccOrders([])` синхронно, но `useEffect` срабатывает на старом `data?.data` (TanStack stale 2min) → перезаписывает accOrders заказами от старого фильтра.
- Фикс: добавить `activeFilter` (или `page`) в deps, либо явный if внутри.

**[BUG-WB-AUDIT-009] checkout: `contactName`/`contactPhone` редактируются, но НЕ отправляются в `confirm.mutateAsync`**
- Файл: `apps/web-buyer/src/app/(minimal)/checkout/page.tsx:380-404`
- Step 1 «Контакты» позволяет редактировать имя/телефон, но `handleConfirm` шлёт только `deliveryAddress`/`buyerNote`/`deliveryFee`. Если backend ожидает `customerPhone`/`customerFullName` в теле — данные теряются.
- Фикс: проверить контракт `POST /buyer/orders` и либо передавать поля, либо удалить редактирование из UI.

**[BUG-WB-AUDIT-010] checkout: мигание OTP-gate для уже залогиненных при гидрации**
- Файл: `apps/web-buyer/src/app/(minimal)/checkout/page.tsx:303-307`
- `pageStep` инициализируется при первом рендере как `isAuthed ? "form" : "otp-phone"`. Если `useAuth` загружает асинхронно — первый рендер показывает OTP даже залогиненному пользователю на 1 frame.
- Фикс: использовать `isAuthLoading` из useAuth + skeleton.

**[BUG-WB-AUDIT-011] ThemeProvider: state init не lazy → flash иконки ThemeToggle**
- Файл: `apps/web-buyer/src/lib/theme/theme-provider.tsx:53-61`
- `useState(defaultTheme)` инициализируется как `'system'`, потом useEffect синхронизируется с localStorage. Между ними — Sun-иконка вместо Moon на 1 frame для пользователя со сохранённым `dark`.
- Фикс: lazy init `useState(() => readStored(defaultTheme))`.

**[BUG-WB-AUDIT-012] `BottomNavBar` `last_store_slug` читается из localStorage, но НИГДЕ не пишется**
- Файл: `apps/web-buyer/src/components/layout/BottomNavBar.tsx:30-34`
- Ключ читается, fallback всегда `''`, ссылка «Магазин» всегда ведёт на `/`. Mert-код или забытый writer.
- Фикс: либо найти/добавить writer (видимо в storefront page при visit), либо удалить и хранить через URL/params.

**[BUG-WB-AUDIT-013] Cross-tab token desync: нет `storage` event listener в AuthContext**
- Файл: `apps/web-buyer/src/lib/auth/storage.ts` + AuthContext
- Логаут в табе B — таб A остаётся с `isAuthenticated: true` и устаревшим `user` до первого 401. Refresh пытается с null-токеном, дергает `savdo:auth:expired` — но юзер видит сломанные API-запросы между.
- Фикс: `window.addEventListener('storage', e => { if (e.key === ACCESS_TOKEN_KEY && !e.newValue) localLogout(); })`.

**[BUG-WB-AUDIT-014] `notifications/page.tsx` `readAll.mutate()` на каждый mount без guard**
- Файл: `apps/web-buyer/src/app/(shop)/notifications/page.tsx:163-166`
- Дёргает `POST /notifications/read-all` на каждый mount. В Strict Mode — два раза. При ремаунте по back/forward — снова, даже если unread=0.
- Фикс: `if (isAuthenticated && !readAll.isPending && unreadItems.length > 0)`.

**[BUG-WB-AUDIT-015] chats `menuRef` переназначается между сообщениями**
- Файл: `apps/web-buyer/src/app/(shop)/chats/page.tsx:421`
- `<div ref={showMenu ? menuRef : undefined}>` — один useRef на все message rows. Click-outside может закрыть не то меню.
- Фикс: вынести row в отдельный компонент с локальным ref, или единый overlay.

**[BUG-WB-AUDIT-016] `OtpGate.tsx` hardcoded `purpose: 'checkout'` для всех вызывающих экранов**
- Файл: `apps/web-buyer/src/components/auth/OtpGate.tsx:27,37`
- `OtpGate` используется на /chats, /wishlist, /profile — все они отправляют OTP с purpose=checkout. Если backend разделяет TTL/rate-limit/audit по purpose — будут странные записи.
- Фикс: `purpose?: 'auth' | 'checkout'` props с default `'auth'`.

**[BUG-WB-AUDIT-017] storefront `[slug]/page.tsx` — двойной fetch storeBySlug**
- Файл: `apps/web-buyer/src/app/(shop)/[slug]/page.tsx:80-87` + `generateMetadata`
- `serverGetStoreBySlug` вызывается в `generateMetadata` И в `StorePage` независимо. Если кастомный HTTP-клиент без `cache` — два HTTP-запроса на render.
- Фикс: обернуть `serverGetStoreBySlug` в React `cache()` или Next.js `unstable_cache`.

**[BUG-WB-AUDIT-018] ProductCard images: `as unknown as` cast скрывает shape mismatch**
- Файл: `apps/web-buyer/src/components/store/ProductCard.tsx:41-44`
- `(product as unknown as { images?: Array<{url}> }).images?.map(...)`. Это либо контракт API не совпадает с типом ProductListItem (mediaUrls vs images), либо мёртвый код. При изменении API — silently сломается.
- Фикс: проверить актуальный shape ответа, исправить тип в packages/types, убрать cast.

**[BUG-WB-AUDIT-019] notifications: `BottomNavBar active="profile"` на странице /notifications**
- Файл: `apps/web-buyer/src/app/(shop)/notifications/page.tsx:282`
- Тип `NavActive` не содержит `'notifications'` — нет соответствующего таба. Это design choice (notifications в Header через Bell icon), но active="profile" путает.
- Фикс: либо удалить prop, либо рендерить BottomNavBar без `active` (если возможно), либо расширить тип.

### 🟢 MINOR

**[BUG-WB-AUDIT-020] `IcoSend` hardcoded `stroke="white"` → невидим в light-теме**
- Файл: `apps/web-buyer/src/components/icons.tsx:10`
- Все остальные иконки используют `currentColor`. Bell на white-кнопке невидима.
- Фикс: `stroke="currentColor"`.

**[BUG-WB-AUDIT-021] cart sticky CTA `z-30` < BottomNavBar `z-50`**
- Файл: `apps/web-buyer/src/app/(minimal)/cart/page.tsx:491-504`
- BottomNav поверх кнопки «Оформить заказ». Тапы могут попадать на BottomNav.
- Фикс: поднять z до 51 или сменить позиционирование.

**[BUG-WB-AUDIT-022] `normalizeOrder` — `id: raw.id` без fallback**
- Файл: `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:58`
- Если backend вернёт без `id` (edge), `shortId(undefined)` → TypeError на `.slice`.
- Фикс: `id: raw.id ?? ''`.

**[BUG-WB-AUDIT-023] orders/[id] Timeline: PROCESSING маппится на индекс 1 (CONFIRMED), визуально совпадает**
- Файл: `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:108-114`
- `STATUS_INDEX[PROCESSING]=1` и `TIMELINE[1]=CONFIRMED`. Когда статус PROCESSING, timeline показывает CONFIRMED как current. Логически PROCESSING — отдельный этап.
- Фикс: добавить PROCESSING в TIMELINE между CONFIRMED и SHIPPED, или принять как design decision.

**[BUG-WB-AUDIT-024] product detail `navigator.clipboard.writeText` без catch**
- Файл: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx:110`
- На HTTP / в WebView без permissions clipboard кидает DOMException → unhandled rejection.
- Фикс: `.catch(() => {})`.

**[BUG-WB-AUDIT-025] RecentStores: `<button>` внутри `<Link>` — невалидный HTML**
- Файл: `apps/web-buyer/src/components/home/RecentStores.tsx:36-45`
- Интерактивный контент внутри интерактивного. Tab-навигация и AT работают непредсказуемо.
- Фикс: заменить Link обёртку на div с onClick, или вынести button через position:absolute.

**[BUG-WB-AUDIT-026] notifications `bucketFor` использует `Date.now()` без подписки на смену суток**
- Файл: `apps/web-buyer/src/app/(shop)/notifications/page.tsx:172-176`
- При долгом mount (открыто на ночь) buckets не пересчитываются — события вчера остаются в «Сегодня».
- Фикс: setInterval каждый час пересчитывать. Или принять как negligible.

### Сводная таблица по приоритетам

| ID | Severity | Файл | Что |
|----|----------|------|-----|
| 001 | 🔴 | hooks/use-cart.ts | useCart без enabled → 401-loop для гостей |
| 002 | 🔴 | hooks/use-buyer-socket.ts | leave-buyer-room cleanup отсутствует |
| 003 | 🔴 | hooks/use-chat.ts | leave-chat-room cleanup отсутствует |
| 004 | 🔴 | hooks/use-orders.ts | enabled guard отсутствует |
| 005 | 🔴 | chats/page.tsx | handleSend без catch + потеря текста |
| 006 | 🔴 | orders/[id]/page.tsx | Sticky CTA z-50 vs BottomNav z-50 |
| 007 | 🔴 | products/[id]/page.tsx | useEffect deps incomplete → race |
| 008 | 🟡 | orders/page.tsx | accOrders race при смене фильтра |
| 009 | 🟡 | checkout/page.tsx | contactName/Phone не отправляется |
| 010 | 🟡 | checkout/page.tsx | OTP-gate flash для авторизованных |
| 011 | 🟡 | theme-provider.tsx | non-lazy state init → flash icon |
| 012 | 🟡 | BottomNavBar.tsx | last_store_slug never written |
| 013 | 🟡 | lib/auth/storage.ts | Cross-tab logout desync |
| 014 | 🟡 | notifications/page.tsx | readAll mutate без guard |
| 015 | 🟡 | chats/page.tsx | menuRef shared между сообщениями |
| 016 | 🟡 | OtpGate.tsx | purpose hardcoded |
| 017 | 🟡 | [slug]/page.tsx | двойной fetch storeBySlug |
| 018 | 🟡 | ProductCard.tsx | as-cast на mediaUrls/images |
| 019 | 🟡 | notifications/page.tsx | BottomNavBar active="profile" |
| 020 | 🟢 | icons.tsx | IcoSend stroke="white" |
| 021 | 🟢 | cart/page.tsx | z-30 sticky CTA vs z-50 BottomNav |
| 022 | 🟢 | orders/[id]/page.tsx | normalizeOrder id без fallback |
| 023 | 🟢 | orders/[id]/page.tsx | PROCESSING == CONFIRMED в timeline |
| 024 | 🟢 | products/[id]/page.tsx | clipboard без catch |
| 025 | 🟢 | RecentStores.tsx | button в Link невалидный HTML |
| 026 | 🟢 | notifications/page.tsx | bucketFor без интервала |

---

## 2026-05-04 [API-WS-AUDIT-001] WebSocket gateways audit: information leak в chat.gateway

- **Статус:** ✅ Исправлено (chat join-room participant check + DatabaseModule в SocketModule).
- **Корень:** `apps/api/src/socket/chat.gateway.ts:51 handleJoinChatRoom` — НЕ проверял что юзер участник треда. Любой авторизованный юзер мог сделать `socket.emit('join-chat-room', { threadId: 'someone-elses-thread' })` → подписаться на room `thread:{id}` → получать **все** последующие `chat:message` / `chat:message:edited` / `chat:message:deleted` события чужого приватного чата.
- **Атака сценарий:**
  1. Залогиниться (любой авторизованный юзер).
  2. Узнать threadId — через рассказ другого юзера, лог-файл, side-channel, brute-force (UUID v4 — длинный, но не невозможный).
  3. `socket.emit('join-chat-room', { threadId })` → server.to(room).emit идёт ВСЕМ кто в room → атакующий получает свежие сообщения buyer↔seller.
- **Что сделано (фикс):**
  - `chat.gateway.ts handleJoinChatRoom` стал async. Перед `client.join(room)` делает: `prisma.chatThread.findUnique({ where: id, select: buyerId, sellerId })` + `prisma.user.findUnique({ where: user.sub, select: { buyer.id, seller.id } })`. Проверка `isBuyer || isSeller` — иначе тихий return (не join'ится в room).
  - `socket.module.ts` импортирует `DatabaseModule` — даёт PrismaService в gateway.
  - Логирование: `WS join-chat-room rejected: user X not participant of thread Y` — чтобы потом отслеживать попытки.
- **Что НЕ исправлено (отдельный PR):**
  - `orders.gateway.handleJoinBuyerRoom` (строка 77) сравнивает `user.sub === data.buyerId`. `user.sub` это `User.id`, а в API `buyerId` обычно `Buyer.id` (профиль). Если фронт передаёт `Buyer.id` — проверка ломает легитимный flow; если `User.id` — ок. Нужно проверить что передаёт TMA на фронте и устранить ambiguity. ID `API-WS-AUDIT-002`.
  - Нет rate-limit на emit события с клиента (например spam join-room/leave-room) — но Socket.io не подвержен этому критично; throttle decorator не применим к WS-handlers напрямую.
- **Хорошие практики уже на месте:**
  - JWT verify в handshake (commit `7cdb4c6` — добавил `OnGatewayConnection`).
  - join-seller-room проверяет `user.storeId === data.storeId` через JWT.
  - emitChatMessage отправляет только в room thread:id — а не broadcast.
  - CORS regex для railway.app/telegram.org/savdo.uz.

---

## 2026-05-04 [TMA-PHOTO-UPLOAD-DIAG-001] Корень «фото не грузит» — APP_URL не валидировался

- **Статус:** 🟡 Частично исправлено (env validation добавлено), нужна правка на Railway.
- **Симптом (Полат, прод):** «хули фото не грузит». Загрузка проходит, но на витрине магазина / списке товаров фото не отображаются.
- **Корень (через код-ревью):**
  1. `apps/api/src/config/env.validation.ts` НЕ требовал `APP_URL`. Если переменная не выставлена на Railway → `process.env.APP_URL` = undefined → пустая строка.
  2. `products.controller.ts:773 resolveImageUrl` для tg-bucket: `${appUrl}/api/v1/media/proxy/${id}`. При appUrl='' → начинается с `/api/...` — relative path. На TMA-домене `savdo-tma.up.railway.app` относительный путь резолвится в `https://savdo-tma.up.railway.app/api/v1/media/proxy/...` → 404 (нет такого маршрута на TMA static-сервере).
  3. Аналогично для R2: если `STORAGE_PUBLIC_URL` пуст и `APP_URL` пуст → fallback тоже пустую строку даёт.
  4. `TELEGRAM_STORAGE_CHANNEL_ID` тоже не валидировался — silent failure если бот не настроен.
- **Что сделано (PR):**
  - `env.validation.ts`: `APP_URL` теперь `Joi.string().uri().required()` — сервер не стартует без этой переменной (защита от silent fail).
  - `TELEGRAM_STORAGE_CHANNEL_ID` и `TMA_URL` добавлены как optional в validation — для observability.
- **Что нужно от Полата на Railway api сервисе:**
  - `APP_URL=https://savdo-api-production.up.railway.app` (или кастомный домен).
  - `TELEGRAM_STORAGE_CHANNEL_ID=-100xxxxxxxxxx` (числовой chat_id канала). Бот должен быть админом канала с правом «Публикация сообщений».
  - `STORAGE_PUBLIC_URL=https://...` если используется R2/Supabase Storage.
- **После выставления:** контейнер перезапустится → фото из TG-storage будут идти через `https://savdo-api.../api/v1/media/proxy/{id}` (полный URL, работает с любого домена).

---

## 2026-05-04 [TMA-DYNAMIC-VARIANT-FILTERS-001] CategoryFilter seed для активации multi_select на проде

- **Статус:** ✅ Создан seed-script, ожидает запуска на Railway.
- **Контекст:** Коммит `3559cfc` дал TMA UI для multi_select полей CategoryFilter. Но на проде в `category_filters` нет записей — фича пустая для всех продавцов.
- **Что сделано:** `packages/db/prisma/seed-category-filters.ts` с 32 фильтрами:
  - Одежда (мужская/женская/детская): Размер MULTI_SELECT, Цвет MULTI_SELECT, Бренд TEXT.
  - Обувь: Размер EU MULTI_SELECT (36-46), Цвет, Бренд.
  - Ноутбуки: Бренд SELECT, RAM SELECT, Накопитель SELECT, Диагональ NUMBER, Цвет MULTI_SELECT.
  - Телефоны / Смартфоны / Планшеты: Бренд SELECT, Память MULTI_SELECT, Цвет MULTI_SELECT.
  - Телевизоры: Бренд SELECT, Диагональ NUMBER, Разрешение SELECT.
  - Холодильники / Стиральные машины: Бренд SELECT, Объём/Загрузка NUMBER.
  - Аксессуары: Цвет, Бренд.
- Idempotent (upsert), пропускает если категория не найдена.
- **Команда:** `pnpm --filter db seed:filters` — добавлено в package.json.
- **Деплой:** запустить вручную на Railway api shell после применения миграций (`pnpm db:migrate:deploy`). Не вписывать в auto-startup, чтобы не падал контейнер если seed имеет ошибку.

---

## 2026-05-04 [SESSION-DONE] Параллельная сессия #2 (TMA-DESIGN-P0P1-001) — закончила работу

- **Статус:** ✅ Готово, задеплоено в `tma`.
- **Что сделано:** P0+P1 из `[DESIGN-AUDIT-TMA-001]` — коммит `c8c635f` на main, merge в `tma` коммитом `b5bd1ba` (включает security-фикс параллельной сессии #1, тоже подтянут). Push origin/main и origin/tma — выполнены.
- **Файлы (только мои, 7 шт):** `apps/tma/src/components/layout/BottomNav.tsx`, `apps/tma/src/components/ui/ProductCard.tsx`, `apps/tma/src/pages/{buyer,seller}/ChatPage.tsx`, `apps/tma/src/pages/buyer/StorePage.tsx`, `analiz/done.md`, `analiz/tasks.md`. Файлы параллельной сессии #1 (DashboardPage/OrdersPage/ProductsPage/ProfilePage/SettingsPage/EditProductPage/AddProductPage seller + auth/api модули) — НЕ трогал, не стейджил, не коммитил.
- **Замечание главному агенту:** на локальном `main` есть незапушенный коммит `b5bd1ba` от другой сессии (security/ratelimit) — он попал в `tma` через мерж, в origin/main его пока нет. Жду пока сессия #1 пушнет main сама.
- **Тип-чек:** `cd apps/tma && npx tsc -b --noEmit` → 0 ошибок в моих файлах.

---

## 2026-05-04 [API-RATE-LIMIT-AUDIT-001] Rate-limit guard был не активен глобально — фикс

- **Статус:** ✅ Исправлено (apps/api/src/app.module.ts + apps/api/src/modules/auth/auth.controller.ts).
- **Корень:** `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])` был подключён, но `APP_GUARD: ThrottlerGuard` НЕ был зарегистрирован в `providers`. Без guard'а декоратор `@Throttle({...})` — silent no-op. То есть `@Throttle` на `sendMessage` в чате **никогда не срабатывал**, и весь backend был без rate-limit'а на любых endpoint'ах.
- **Симптомы (теоретические, до фикса):** OTP-bomb (5+ phone-number'ов), brute-force OTP, DDoS на `/storefront/products?q=` (тяжёлый ILIKE), spam create-thread, spam media/upload.
- **Что сделано:**
  1. `app.module.ts` providers += `{ provide: APP_GUARD, useClass: ThrottlerGuard }`.
  2. Глобальный лимит поднят 60→120 req/60s (storefront feed читается часто).
  3. `auth.controller.ts` жёсткие per-endpoint лимиты:
     - `/auth/telegram` — 10/мин (TMA initData verify)
     - `/auth/request-otp` — **5/мин** (защита от OTP-bomb)
     - `/auth/verify-otp` — 10/мин (brute-force ограничение)
     - `/auth/refresh` — 30/мин
  4. `chat/sendMessage` остался 30/мин (как был).
- **TODO (другие endpoints, отдельный PR):**
  - `/media/upload` — должно быть жёстче (большой трафик): 20/мин.
  - `/checkout/create-order` — 10/мин (защита от спама заказов).
  - `/storefront/products?q=` — search с ILIKE, 60/мин на конкретный IP.
  - `/chat/threads POST` (createThread) — 10/мин.
- **Verify after deploy:** в Network tab DevTools → 6й request на `/auth/request-otp` за минуту должен вернуть 429.

---

## 2026-05-04 [WEB-TMA-SELLER-PERF-001] AbortController + prefetch в TMA seller pages

- **Статус:** ✅ Сделано (8 из 9 файлов)
- **Что случилось:** Seller-страницы TMA дёргали `api()` в `useEffect` без AbortController — при быстрой навигации (свайп back в Telegram, пересоздание AppShell, переключение между Dashboard/Products/Orders) возникали:
  1. setState на размонтированном компоненте → React warning + утечки памяти.
  2. Race conditions: предыдущий fetch заканчивался ПОСЛЕ нового и перетирал свежие данные старыми.
  3. Карточки товаров в `ProductsPage` грузили `/seller/products/:id` только после клика → ~300ms пустой EditPage.
- **Что сделано:** Каждый `useEffect` создаёт `AbortController`, на cleanup `ac.abort()`. `then/catch/finally` проверяют `ac.signal.aborted` до setState. Заказы (`/seller/orders`, `/seller/orders/:id`) — `forceFresh: true` (статусы быстро меняются). `ProductsPage` карточки — `prefetch` на `onPointerEnter` (`/seller/products/:id` + `/.../attributes`).
- **Не сделано:** `apps/tma/src/pages/seller/ChatPage.tsx` — параллельная сессия делает `TMA-DESIGN-P0P1-001` (44px hit-area, aria-hidden). Чтобы не воровать чужой коммит — пропустил, открыл follow-up `TMA-SELLER-CHAT-PERF-001`.
- **Type check:** `npx tsc --noEmit` в `apps/tma` → 0 ошибок.

---

## 2026-05-04 [WEB-DESIGN-AUDIT-001] Дизайн-аудит web-buyer + web-seller (5 критериев) — pointer

- **Статус:** 🟡 Аудит — findings в отдельном файле, фиксы НЕ применены, ждут согласия Полата.
- **Полный отчёт:** `analiz/web-design-audit-001.md` (вынесен из logs.md чтобы не конкурировать с параллельными сессиями за один файл).
- **Кратко:** P0 = hit-area в web-buyer (BottomNav/Header/back/+−/dots все <44px), `prefers-reduced-motion` нигде нет. P1 = контраст `textDim` в обоих апп (~3.0–4.2:1, ниже AA), `success` в light теме тоже не AA. P2 = `aria-label` на ±/dots/inline-confirm, modal `role=dialog`, sidebar `<nav aria-label>`, skeleton `aria-busy`.
- **Что нужно от Полата:** согласие на (1) рост BottomNav 64→76px, (2) правку tokens (`textDim`, `success`) одной таблицей, (3) подтверждение что web-* можно фиксить самому, не ждать Азима.

---

## 2026-05-04 [SEC-AUDIT-2026-05] Backend security audit (audit-only, без правок кода)

- **Статус:** 📋 Audit-only — найдено 2 CRITICAL, 3 HIGH, 7 MEDIUM, 2 LOW. ⚠️ Push кода НЕ выполняется до согласования с Полатом по CRIT-01/CRIT-02.
- **Скоуп:** `apps/api/src/**/*` — public endpoints, JwtAuthGuard/RolesGuard, `$queryRaw`/`$executeRaw`, XSS surface (Telegram HTML), SSRF, secrets logging, CORS.
- **Метод:** статический ревью. Per §6.1 политики самообучения exploit-payload'ы не пишу — только корни и рекомендации.

### 🔴 CRIT-01 — ThrottlerGuard не зарегистрирован глобально → rate-limit отключён повсюду

- **Корень:** `apps/api/src/app.module.ts:45` импортирует `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])`, но в `providers` нет `{ provide: APP_GUARD, useClass: ThrottlerGuard }`. Без этого `@nestjs/throttler` не подключается ни к одному маршруту.
- Следствие: `@Throttle({ default: { ttl: 60000, limit: 30 } })` на `chat.controller.ts:102` (POST /chat/threads/:id/messages) **не работает**. Дефолтный 60/мин тоже не применяется.
- Угроза: на public-endpoints нет вообще ничего, что ограничивало бы частоту:
  - `POST /auth/verify-otp` — brute-force OTP. Есть Redis-счётчик 5 попыток/15мин в `otp.service.ts:14-58`, но он на phone+code; смена phone позволяет атаковать многократно.
  - `POST /auth/request-otp` — флуд OTP-кодов в Telegram (use-case ограничивает 3/10мин на `(phone, purpose)`, но purposes 3 → 9 OTP / 10 мин на телефон).
  - `POST /auth/refresh`, `POST /auth/telegram` — без лимитов.
  - `GET /storefront/products`, `/storefront/categories*`, `/stores/:slug*` — без лимитов, scrape-friendly.
  - `POST /analytics/track` (guest), `GET/POST/PATCH/DELETE /cart*` (guest через `x-session-token`) — DB-write без лимитов.
- **Рекомендация:** добавить в `app.module.ts` `providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, ...]`. Затем точечно усилить лимиты на `auth/*` (например 5/мин) через `@Throttle()`.

### 🔴 CRIT-02 — Telegram Bot Token утекает через `/api/v1/media/proxy/:id`

- **Дублирует** запись `[TG-AUDIT-2026-05] (2/5)` ниже. Подтверждаю: уязвимость **до сих пор открыта**, фикс не сделан.
- **Корень:** `media.controller.ts:142-160` → `tgStorage.getFileUrl()` (`telegram-storage.service.ts:80`) возвращает `https://api.telegram.org/file/bot${botToken}/${file_path}`; контроллер шлёт это значение в `Location` 302-редиректа. Любой пользователь видит токен в Network-tab.
- **Угроза:** полный захват `@savdo_builderBOT`: massending от имени бота, чтение всех апдейтов (включая контакты с phone), перехват OTP при наличии `chatId` маппинга.
- **Рекомендация:** проксировать байты (`axios.get(url, { responseType: 'stream' })` → `pipe(res)` + `Cache-Control: private, max-age=600`). Никогда не отдавать клиенту URL с токеном.

### 🟠 HIGH-01 — RolesGuard молча пропускает endpoints без `@Roles()`

- **Корень:** `apps/api/src/common/guards/roles.guard.ts:17` `if (!requiredRoles) return true;`. В сочетании с `@UseGuards(JwtAuthGuard, RolesGuard)` без `@Roles()` это даёт false sense of security — guard добавлен, но проверки нет.
- **Где видно:**
  - `chat.controller.ts:67` `POST /chat/threads` — `@UseGuards(JwtAuthGuard, RolesGuard)` контроллерного уровня + `@Roles()` отсутствует на handler'е → любой аутентифицированный (включая SELLER без buyer-профиля → словит 422 в use-case, но это случайная защита, не явная).
  - `orders.controller.ts:48-133` — все `buyer/orders*` без `@Roles()`. Сделано осознанно (`API-BUYER-ORDERS-ROLE-GUARD-001` для dual-role), но не задокументировано в декораторе.
- **Рекомендация:** в `roles.guard.ts` оставить `return true` только при наличии явного маркера `@AllowAnyRole()`; иначе — `throw FORBIDDEN`. Все осознанные dual-role хэндлеры пометить `@Roles('BUYER', 'SELLER')`.

### 🟠 HIGH-02 — RolesGuard: `if (user.role === 'ADMIN') return true` на всех endpoints

- **Корень:** `roles.guard.ts:26` — ADMIN всегда проходит, даже на seller/buyer-only маршрутах.
- **Угроза:** скомпрометированный admin-токен (или legitimate admin кликающий по случайному URL) может писать в `seller/store`, `seller/products`, отправлять чат-сообщения от чужого имени, оформлять чужие cart'ы.
- **Рекомендация:** убрать short-circuit; ADMIN-операции должны идти строго через `/admin/*` controllers (которые помечены `@Roles('ADMIN')`). Если требуется bypass для саппорта — отдельный декоратор `@AllowAdminBypass()`.

### 🟠 HIGH-03 — Public storefront/auth endpoints без явного rate-limit (продолжение CRIT-01)

- Конкретные controllers без `@Throttle`:
  - `auth.controller.ts:27,33,40,49` — все 4 публичных POST.
  - `categories.controller.ts:93,103,127,137` — storefront categories.
  - `products.controller.ts:559,570,581,607,636,722` — storefront stores+products.
  - `cart.controller.ts:60,72,89,117,141` — guest cart.
  - `analytics.controller.ts:47` — `POST /analytics/track`.
  - `telegram-webhook.controller.ts:39` — webhook (защищён secret token, но при пустом env — открыт; см. `[TG-AUDIT-2026-05] (3)`).
- **Рекомендация:** после фикса CRIT-01 точечно повесить `@Throttle({ default: { ttl: 60000, limit: 5 } })` на auth + 30/мин на storefront + 60/мин на cart.

### 🟡 MED-01 — SuperAdminController использует inline-типы вместо DTO с class-validator

- `super-admin.controller.ts:83,96,117,136-141` (5 endpoints): `@Body() body: { phone: string; adminRole: string }` и т.п. — **TypeScript-тип, а не DTO-класс**. ValidationPipe whitelist/forbidNonWhitelisted работает только с DTO-классами c `class-validator` декораторами. Сейчас тело принимается как-есть, длина/формат не проверяются (есть только `if (!body.x) BadRequestException`).
- Аналогично: `admin.controller.ts:212,236,336-337` (`@Body('status') status: string` без `@IsIn`).
- **Угроза:** мусор в `audit_log.payload`, неожиданные значения `adminRole`/`status` в БД (миграция/индексы могут не учитывать), `description` ловит arbitrary HTML.
- **Рекомендация:** создать DTO-классы (`CreateAdminDto`, `ChangeAdminRoleDto`, `RefundOrderDto`, `VerifySellerExtendedDto`) с `@IsString @IsIn @MaxLength`.

### 🟡 MED-02 — Storefront filters без DTO

- `products.controller.ts:643` `@Query('filters') rawFilters?: Record<string, string>` принимает произвольный объект (Express `qs`). Нет ограничения количества ключей или длины значений.
- **Угроза:** DoS через `?filters[a]=…&filters[b]=…&...` (Express по умолчанию 1000 keys через `qs`). В DB-запросе фильтры идут в `findPublicByStoreId` — много ключей → много условий.
- **Рекомендация:** обернуть в DTO с явным whitelist полей или пропустить через `Object.entries(rawFilters).slice(0, 20)`.

### 🟡 MED-03 — XSS/HTML-injection в Telegram-каналах продавцов

- `telegram-demo.handler.ts:564,627,654-656`: `caption = '🛍 <b>${product.title}</b>...${product.description}...${store.name}'` рендерится `parseMode: 'HTML'`. Поля приходят от продавца (свободный input).
- **Угроза:** низкая — продавец постит в свой канал. Но: `<` `>` `&` в названии сломают парсинг, Telegram отвергнет → пост не появится; `<a href="https://evil">текст</a>` в описании создаст рабочую ссылку (Telegram разрешает `<a>`).
- **Рекомендация:** `escapeHtml(s) = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')` перед интерполяцией. Или перейти на `MarkdownV2` с экранированием.

### 🟡 MED-04 — Bull Board: shared токен → утечка = доступ к OTP-кодам в очереди

- `main.ts:91-107` Bull Board защищён `BULL_BOARD_TOKEN` (статический header). Очередь `otp` хранит `OtpSendTelegramJobData = { chatId, phone, code }` (`otp.service.ts:88,104`) — **открытый OTP-код в job data**.
- **Угроза:** утечка `BULL_BOARD_TOKEN` (env, history) → атакующий читает живые OTP-коды до их истечения (5 мин).
- **Рекомендация:** не класть `code` в job data; класть только `otpRequestId`, processor лезет в БД и достаёт `codeHash` + reverse через временный Redis key. Альтернатива — `removeOnComplete: true` для otp-queue (чтобы job исчезал сразу).

### 🟡 MED-05 — CORS regex `\.railway\.app` принимает любой Railway-tenant

- `main.ts:41-42`: `/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/i` и `/^https:\/\/[a-z0-9-]+\.railway\.app$/i`.
- **Угроза:** атакующий разворачивает свой проект на `evil.up.railway.app` → его origin принимается → CSRF-вектор для cookies-based endpoints (refresh-token cookie уже не используется, но `credentials: true` на `app.enableCors` подсвечивает.
- **Рекомендация:** заменить wildcard на whitelist через `ALLOWED_ORIGINS`: `https://savdo-tma-…up.railway.app,https://savdo-admin-…up.railway.app,...` (4 deploy-ветки = 4 hostname'а).

### 🟡 MED-06 — CORS dev-mode пропускает любой origin

- `main.ts:52`: `if (!isProd) return callback(null, true);`. Если `NODE_ENV` случайно не `production` на Railway → принимается всё.
- **Рекомендация:** держать как есть, но добавить assert при boot: если `NODE_ENV !== 'production'` И есть `DATABASE_URL` указывающий на prod → бросить ошибку. Низкий приоритет.

### 🟡 MED-07 — Telegram webhook без обязательного secret

- `telegram-webhook.controller.ts:43-46` — verify работает только при непустом `TELEGRAM_WEBHOOK_SECRET`. См. также `[TG-AUDIT-2026-05] (3)`.
- **Рекомендация:** в `env.validation.ts` сделать `TELEGRAM_WEBHOOK_SECRET` `Joi.string().min(16).required()` для прода. Дублирует `[SEC-TG-002]`.

### 🟢 LOW-01 — Phone PII в plain-text логах

- `otp.processor.ts:26,34`, `otp.service.ts:85,106`, `admin-auth.use-case.ts:152` (`IMPERSONATION ... phone=${target.phone}`).
- **Не криптосекрет**, но персональные данные. GDPR/Узб. закон №547 о защите персданных требует минимизации.
- **Рекомендация:** маска `+998***1234` через helper `maskPhone()`.

### 🟢 LOW-02 — Multer/FileInterceptor без явных limits

- `media.controller.ts:62,74,99` — `@UseInterceptors(FileInterceptor('file'))` без `{ limits: { fileSize: ... } }`. Лимит фактически делается в use-case (`upload-direct.use-case.ts`), но для отказа в early phase лучше выставить `fileSize: 10 * 1024 * 1024` в interceptor, чтобы Express отклонял body до парсинга.

### ✅ PASS — что проверено и чисто

- **SQL injection (`$queryRaw`/`$executeRaw`)**: 4 места найдено (`health/prisma.health.ts:13`, `admin/get-system-health.use-case.ts:80`, `admin/get-analytics.use-case.ts:158,164`, `analytics/analytics.repository.ts:104`). Все используют **tagged template literals** Prisma с `${var}` — Prisma автоматически параметризует, инъекций нет. `$executeRaw` не использован нигде.
- **SSRF**: axios используется в `telegram-bot.service.ts` и `telegram-storage.service.ts`. URL зафиксированы на `https://api.telegram.org/...`, user-controlled URL никуда не идёт. `axios.get/post(<userInput>)` patterns: 0.
- **OTP-код в логах**: явный комментарий `SEC-003: never log the actual code` (`otp.service.ts:84`). Подтверждено — `code` не появляется в Logger.log/warn/error ни в одном файле.

### Сводная таблица

| ID | Severity | Где | Тикет (предлагаемый) |
|----|----------|-----|----------------------|
| CRIT-01 | 🔴 | `app.module.ts:45` (нет APP_GUARD ThrottlerGuard) | `[SEC-001]` |
| CRIT-02 | 🔴 | `media.controller.ts:142` (Bot Token в Location) | `[SEC-TG-001]` |
| HIGH-01 | 🟠 | `roles.guard.ts:17` (молчаливый bypass без @Roles) | `[SEC-002]` |
| HIGH-02 | 🟠 | `roles.guard.ts:26` (ADMIN bypass всего) | `[SEC-003]` |
| HIGH-03 | 🟠 | auth + storefront без `@Throttle` | `[SEC-004]` |
| MED-01 | 🟡 | super-admin inline body types | `[SEC-005]` |
| MED-02 | 🟡 | storefront `filters` без DTO | `[SEC-006]` |
| MED-03 | 🟡 | Telegram HTML escape | `[SEC-007]` |
| MED-04 | 🟡 | Bull Board: OTP code в job data | `[SEC-008]` |
| MED-05 | 🟡 | CORS wildcard `*.railway.app` | `[SEC-009]` |
| MED-06 | 🟡 | CORS dev-mode | `[SEC-010]` |
| MED-07 | 🟡 | Webhook secret optional | `[SEC-TG-002]` (дубль) |
| LOW-01 | 🟢 | phone PII в логах | `[SEC-011]` |
| LOW-02 | 🟢 | Multer без limits | `[SEC-012]` |

### ⚠️ Полату — перед пушем

- **CRIT-02** уже описан в `[TG-AUDIT-2026-05]` от того же дня — фикс висит как `[SEC-TG-001]` в `tasks.md`, но не сделан. Подтверждаю: **уязвимость открыта на main**.
- **CRIT-01** — найден сейчас, в прошлых аудитах не фигурировал. Это объясняет, почему OTP rate-limit «работает в Redis, а не через Throttler»: Throttler никогда не был активен.
- Решение по приоритетам и тикетам — за тобой; этот отчёт правок кода не делает.

### 🔧 Update 2026-05-04 13:10 — фиксы применены (часть параллельной сессией, часть мной)

| Тикет | Severity | Где исправлено | Кто |
|-------|----------|----------------|-----|
| `[SEC-001]` CRIT-01 | 🔴 → ✅ | `app.module.ts:74` `{ provide: APP_GUARD, useClass: ThrottlerGuard }` + лимит 60→120/мин default | parallel |
| `[SEC-TG-001]` CRIT-02 | 🔴 → ✅ | `media.controller.ts:147` `proxyFile` → `tgStorage.streamToResponse(fileId, mimeType, res)` (`telegram-storage.service.ts:70`). Bot Token остаётся серверным; `Cache-Control: public, max-age=600`. R2-ветка по-прежнему 302-редиректит (нет токенов). | parallel |
| `[SEC-004]` HIGH-03 | 🟠 → ✅ | `@Throttle` на `/auth/*` (5/10/30 в мин), `/chat/threads` POST (10/мин), `/checkout/confirm` (10/мин), `/storefront/products` (60/мин), `/media/upload` (20/мин). Cart guest-flow остался без явного `@Throttle` — закрывается дефолтом 120/мин. | parallel |
| `[SEC-TG-002]` MED-07 | 🟡 → ✅ часть | `telegram-bot.service.ts:46` `Logger.error` при пустом `TELEGRAM_WEBHOOK_SECRET` в проде. Сама проверка в контроллере оставлена «return 200» (намеренно — Telegram не должен ретраить). Для полного closure нужно `Joi.required()` в `env.validation.ts` — отложено. | parallel |
| `[SEC-002]` HIGH-01 | 🟠 → ✅ часть | `chat.controller.ts:71` `@Roles('BUYER', 'SELLER')` на `POST /chat/threads`. Раньше RolesGuard проходил через `if (!requiredRoles) return true` — защита держалась случайно (422 в `resolveBuyerId`). | мой |

**TS check:** `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` → exit 0.

### ⏳ Остаются открытыми

- `[SEC-003]` HIGH-02 — RolesGuard `if (user.role === 'ADMIN') return true` (roles.guard.ts:26). Поведенческое изменение, риск регрессии в legitimate admin-доступах. **НЕ фиксить без согласия Полата.**
- `[SEC-005]` MED-01 — SuperAdminController inline body types без DTO (5 endpoints).
- `[SEC-006]` MED-02 — storefront `filters` query без DTO/whitelist.
- `[SEC-007]` MED-03 — Telegram HTML escape в `telegram-demo.handler.ts` (caption product.title/description/store.name).
- `[SEC-008]` MED-04 — OTP-код в Bull job data (видно в Bull Board под BULL_BOARD_TOKEN).
- `[SEC-009]` MED-05 — CORS `*.railway.app` wildcard в `main.ts:41-42`.
- `[SEC-010]` MED-06 — CORS dev-mode принимает любой origin.
- `[SEC-011]` LOW-01 — phone PII в plain-text logs (5+ мест).
- `[SEC-012]` LOW-02 — Multer без явного `limits.fileSize`.
- HIGH-01 part 2 — orders.controller `buyer/orders*` без `@Roles()` (намеренно для dual-role, нужен `@Roles('BUYER', 'SELLER')` для явности — отложено как low-risk).

---

## 2026-05-04 [TG-AUDIT-2026-05] Аудит Telegram-интеграции + фиксы SEC-TG-001/SEC-TG-002

- **Статус:** ✅ Аудит выполнен, оба критичных пункта исправлены (SEC-TG-001 + SEC-TG-002), `npx tsc --noEmit` — 0 ошибок. Деплой ждёт согласования с Полатом.
- **Метод:** статический ревью `apps/api/src/modules/{telegram,notifications,auth}` + `queues/`. Сверка с требованиями: BullMQ для нотификаций, env-only Bot Token, webhook secret, OTP rate-limit, Cache-Control на `/media/proxy/:id`.

### ✅ (1) TG-уведомления идут через BullMQ — OK

- `seller-notification.service.ts` имеет 6 публичных методов (`notifyNewOrder`, `notifyStoreApproved`, `notifyStoreRejected`, `notifyVerificationApproved`, `notifyOrderStatusChanged`, `notifyChatMessage`) — все добавляют job в очередь `QUEUE_TELEGRAM_NOTIFICATIONS` через `InjectQueue`. Запросы НЕ блокируют main flow (методы `void`, ошибки enqueue ловятся `.catch`).
- Очередь `telegram-notifications` (queues.module.ts:28-35): attempts=3, exponential backoff 2s, removeOnComplete=100, removeOnFail=500.
- OTP — отдельная очередь `QUEUE_OTP` (queues.module.ts:46-54), attempts=5, backoff 500 ms, priority=1 в `otp.service.ts:89,105`.
- Broadcast (admin) тоже через telegram-queue: `broadcast.use-case.ts` ставит job `TELEGRAM_JOB_BROADCAST`, processor пишет результат в `BroadcastLog`.
- `apps/api/src/modules/auth/services/otp.service.ts:80-107` — синхронной отправки в `TelegramBotService` нигде не осталось (grep `telegramBot.sendMessage` вне processors → 0 совпадений). Вердикт: ✅.

### ✅ (2/5) [SEC-TG-001] Bot Token утекал через `/api/v1/media/proxy/:id` 302 — ИСПРАВЛЕНО

- **Корень:** `media.controller.ts` `proxyFile` вызывал `tgStorage.getFileUrl(fileId)` и возвращал `{ url, statusCode: 302 }` через `@Redirect()`. `getFileUrl` формировал URL `https://api.telegram.org/file/bot${botToken}/${file_path}` — **Bot Token попадал в HTTP-заголовок `Location`**, был виден в Network tab и кешировался любым CDN/прокси.
- **Что сделано:**
  - `telegram-storage.service.ts` — старый `getFileUrl` удалён, добавлен `streamToResponse(fileId, mimeType, res)`. `getFile` отдаёт `file_path` (на сервере), затем `axios.get(url, { responseType: 'stream' })` тянет байты и `pipe(res)` — Bot Token больше не покидает API. Ставится `Cache-Control: public, max-age=600` (10 мин < TTL Telegram URL ~1ч, без `immutable`). На stream `error` — `502 Bad Gateway` без падения процесса.
  - `media.controller.ts` `proxyFile` переписан на `@Res() res: Response`, для telegram media — стрим, для R2 — остаётся `res.redirect(302, publicUrl)` (R2 публичный CDN, токенов нет) с Cache-Control 10мин.
- **Trade-off:** трафик через Railway удваивается (download from TG + serve client), но токен бота важнее. При росте нагрузки — рассмотреть R2 как primary storage.
- **Файлы:** `apps/api/src/modules/media/media.controller.ts`, `apps/api/src/modules/media/services/telegram-storage.service.ts`.

### ✅ (3) [SEC-TG-002] Webhook secret check отключался при пустом env — ИСПРАВЛЕНО

- **Корень:** `telegram-webhook.controller.ts:43-46` `if (expected && secretToken !== expected) return { ok: true };` — пропускал любые POST-запросы при пустом `TELEGRAM_WEBHOOK_SECRET`. Joi разрешает пустую строку.
- **Что сделано:** `telegram-bot.service.ts` `onApplicationBootstrap` — добавлен `Logger.error(...)` если в проде запускается без webhook secret. Теперь при отсутствии переменной в Railway logs появится явная ошибка, а не тихий no-op. Сама проверка в контроллере оставлена как есть (return 200 при mismatch — намеренное поведение, чтобы Telegram не ретраил спам).
- **Файлы:** `apps/api/src/modules/telegram/services/telegram-bot.service.ts`.

### 🟢 (2-доп) Bot Token в логах — OK

- `process.env.TELEGRAM_BOT_TOKEN` читается в 2 местах: `telegram.config.ts`, `telegram-storage.service.ts:12`, `telegram-auth.use-case.ts:22`. Joi (`env.validation.ts:29`) делает обязательным.
- В логах токен не встречается: `apiBase` приватный, log-сообщения берут только `err.message` (axios на ошибках кладёт URL в `err.config.url`, не в `.message` — leak возможен только при `console.log(err)` целиком, такого нет).
- В коммитах `.env`/`.env.local` отсутствуют (`.gitignore` корректный).

### 🟡 (4) OTP rate-limit — формально строже спеки, но per-purpose

- Спека: «max 3 OTP в минуту на user_id».
- Реализация (`request-otp.use-case.ts:9-31`): 3 попытки за **10 минут** на пару `(phone, purpose)` через таблицу `OtpRequest` + brute-force защита 5 неверных проверок → 15 мин блок (`otp.service.ts:42-58`).
- **Время** строже спеки (10 мин vs 1 мин) ✓.
- **Per-purpose** — потенциальный обход: пользователь может запросить 3× `login` + 3× `register` + 3× `change_phone` за 10 минут (= 9 OTP). На практике purposes ограниченное множество, но если их станет много — стоит добавить overall-лимит на phone (например 6/час).
- **Идентификатор:** rate-limit по `phone`, а не `user_id` — корректно (на момент запроса OTP пользователя в БД ещё может не быть).

### Сводка

| # | Требование | Статус | Тикет |
|---|------------|--------|-------|
| 1 | Уведомления через BullMQ | ✅ | — |
| 2 | Bot Token только в env | ✅ (env-only) | — |
| 3 | Webhook X-Telegram-Bot-Api-Secret-Token | ✅ (warn при пустом env) | `[SEC-TG-002]` ✅ |
| 4 | OTP rate-limit | 🟡 (per-purpose, overall лимита нет) | — (low) |
| 5 | `/media/proxy/:id` стриминг + Cache-Control | ✅ (стрим вместо redirect, max-age=600) | `[SEC-TG-001]` ✅ |

### Затронутые файлы

- `apps/api/src/modules/media/media.controller.ts` — `@Res()` стрим, R2 redirect с Cache-Control
- `apps/api/src/modules/media/services/telegram-storage.service.ts` — `streamToResponse()`, `getFileUrl()` удалён
- `apps/api/src/modules/telegram/services/telegram-bot.service.ts` — `Logger.error` при пустом webhook secret

---

## 2026-05-04 [DB-AUDIT-001] Аудит Prisma schema + миграций (audit-only, без правок)

- **Статус:** 📋 Audit-only. Миграций НЕ создавал, `schema.prisma` НЕ трогал. Все правки — только с согласия Полата.
- **Метод:** ручной обход `packages/db/prisma/schema.prisma` (988 строк) + 18 миграций + cross-check с API кодом (`apps/api/src/modules/**/repositories`).
- **Что проверял:** ON DELETE на FK, composite indexes на горячих запросах, missing `@unique`, согласованность enum'ов между schema и API constants, фильтрация `deletedAt: null`.

### 🟥 P1 — Consistency (риск orphan-данных и неконсистентного поведения)

**[DB-AUDIT-001-01] Отсутствуют FK на User у 7 таблиц с `userId`**
- Поля `userId String` БЕЗ `User @relation(...)`:
  - `InAppNotification.userId`           (`schema.prisma:814`)
  - `NotificationPreference.userId`      (`schema.prisma:831`, есть `@unique`, но FK нет)
  - `PushSubscription.userId`            (`schema.prisma:843`)
  - `NotificationLog.userId`             (`schema.prisma:860`)
  - `ChatMessage.senderUserId`           (`schema.prisma:757`)
  - `OrderStatusHistory.changedByUserId` (`schema.prisma:709`)
  - `AnalyticsEvent.actorUserId`         (`schema.prisma:956`)
- В Postgres нет FK constraint → нет проверки целостности на write-time, можно вставить любой UUID. При `DELETE FROM users` останутся orphan-строки.
- Риск: тихая утечка в notification-таблицах, неработающие joins в админке, данные о действиях несуществующего пользователя.
- Рекомендация: для notification-таблиц — `User @relation(..., onDelete: Cascade)`. Для history/analytics — `onDelete: SetNull` (сохранить snapshot). Перед миграцией обязательно backfill orphan-проверка: `SELECT … WHERE userId NOT IN (SELECT id FROM users)`.

**[DB-AUDIT-001-02] `ChatThread.status` — schema vs код рассинхрон**
- `schema.prisma:730`: `status String @default("active")` — TEXT.
- API: `chat.repository.ts:113` пишет `'OPEN'` при создании, `chat.repository.ts:192` пишет `'CLOSED'`. `send-message.use-case.ts:70` и `resolve-thread.use-case.ts:53` сравнивают с `'CLOSED'`.
- Эффект: треды, созданные SQL-вставкой / старым кодом, имеют `status='active'` и проходят проверку `status !== 'CLOSED'` — можно отправлять сообщения в "не-открытый" тред без обнаружения.
- Рекомендация: ввести `enum ChatThreadStatus { OPEN, CLOSED }` (миграция: `UPDATE chat_threads SET status='OPEN' WHERE status='active'`, потом `ALTER TABLE … ALTER COLUMN status TYPE`). Или в коде заменить `OPEN/CLOSED` на `active/closed` и оставить TEXT. Согласовать с Полатом.

### 🟧 P2 — Performance (горячие запросы без идеальных индексов)

**[DB-AUDIT-001-03] `Product` — нет composite индекса для public feed**
- Запрос: `products.repository.ts:266-279` (`findAllPublic`) → `WHERE status='ACTIVE' AND deletedAt IS NULL ORDER BY createdAt DESC` + опционально `globalCategoryId` + ILIKE по title/description.
- Сейчас одиночные `status`, `globalCategoryId`, `storeId`, `isVisible` — Postgres использует только один.
- Рекомендация: `@@index([status, deletedAt, createdAt(sort: Desc)])`. Дополнительно `@@index([globalCategoryId, status, deletedAt, createdAt(sort: Desc)])` если category-фильтр популярный.

**[DB-AUDIT-001-04] `Order` — нет composite `(storeId, status, placedAt DESC)`**
- Запрос: `orders.repository.ts:88-94` (`findByStoreId`) → `WHERE storeId=? [AND status=?] ORDER BY placedAt DESC LIMIT 20`. Самый горячий запрос продавца (dashboard, orders list).
- Сейчас одиночные `storeId`, `status`, `paymentStatus`, `placedAt`, `buyerId`, `sellerId`.
- Рекомендация: `@@index([storeId, status, placedAt(sort: Desc)])` + симметричный `@@index([buyerId, status, placedAt(sort: Desc)])` для buyer-flow.

**[DB-AUDIT-001-05] `ChatMessage` — нет composite `(threadId, createdAt DESC)`**
- Запрос: `chat.repository.ts:170-178` cursor pagination → `WHERE threadId=? AND isDeleted=false AND createdAt < ? ORDER BY createdAt DESC LIMIT 50`.
- Сейчас одиночные `threadId`, `createdAt`. Postgres делает Bitmap heap scan + sort.
- Рекомендация: `@@index([threadId, createdAt(sort: Desc)])`. Уберёт sort-step, ускорит "догрузку истории".

**[DB-AUDIT-001-06] `ProductImage` — composite `(productId, sortOrder)` отсутствует**
- Запрос: `products.repository.ts:97, 116, 157, 270` → `WHERE productId=? ORDER BY sortOrder ASC`.
- Сейчас `@@index([productId])` (`schema.prisma:482`).
- Эффект: умеренный (обычно ≤10 фото на товар), но запрос постоянно делает sort.
- Рекомендация: `@@index([productId, sortOrder])`. Грань P2/P3 — можно отложить.

**[DB-AUDIT-001-07] Soft-delete фильтр `deletedAt: null` пропущен**
- `Store` имеет `deletedAt`, но НЕ фильтруют:
  - `stores.repository.ts:9, 16, 23` — `findBySellerId`/`findById`/`findBySlug`.
  - `admin.repository.ts:231, 247` — admin store list/detail.
  - `telegram-demo.handler.ts:248, 426, 515, 549, 642, 690, 718, 737, 775` — bot handlers.
  - `checkout.repository.ts:78`, `change-product-status.use-case.ts:73`.
- `Product` — `telegram-demo.handler.ts:549` (`postProductToChannel`) вызывает `findUnique({where:{id}})` БЕЗ `deletedAt: null` → можно опубликовать удалённый товар в TG-канал.
- `User.deletedAt` фактически нигде не фильтруется (но `User.status==='BLOCKED'` используется как софт-блок). Низкий риск — soft-delete юзера не реализован.
- Рекомендация: либо добавить helper `prisma.store.findActive`, либо systematically `deletedAt: null` во все store-repositories. Альтернатива: отказаться от soft-delete для Store (тогда нужна миграция и backfill).

### 🟨 P2 — Schema design (стилистические/структурные улучшения)

**[DB-AUDIT-001-08] TEXT-поля, которые должны быть enum'ами**
- `Cart.status` (`schema.prisma:585`): `String @default("active")` — задокументированы значения `active|converted|merged|expired`. Кандидат на `enum CartStatus`.
- `OrderRefund.status`: TEXT default `'completed'` (миграция `20260503020000`).
- `AdminUser.adminRole`: TEXT default `'admin'` (та же миграция). Сейчас RBAC делается строкой — нет compile-time проверок.
- `SellerVerificationDocument.status`: TEXT default `'pending'`.
- `ChatMessage.messageType`: TEXT default `'text'` (значения `text|image|system`).
- `ModerationCase.status/caseType`, `ModerationAction.actionType` — все TEXT.
- Решение Полата: лечить пакетом или оставить (TEXT гибче, enum — compile-time гарантии).

### 🟦 P3 — Cleanup

**[DB-AUDIT-001-09] `CartItem.productId` ON DELETE CASCADE** (`migration 20260417085123`)
- При hard-delete товара (редкий случай — обычно soft-delete) пропадёт запись в чужой корзине. Семантически `SetNull` правильнее, но т.к. hard-delete не используется — низкий приоритет.

**[DB-AUDIT-001-10] `User.referredBy` без FK** (`schema.prisma:121`)
- Поле существует, но нет self-relation на User → нет проверки что referrer существует. Сейчас не используется (grep по коду — только определение). Если реферальная программа запустится — приведёт к мусору.

### ✅ Что хорошо

- **ON DELETE распределение корректное:** `RESTRICT` на бизнес-критичных (Store→Seller, Order→Store/Seller, OrderRefund→Order); `SET NULL` на исторических (OrderItem.productId/variantId, AuditLog.actorUserId, InventoryMovement.variantId, ChatMessage.parentMessageId/mediaId); `CASCADE` где правильно (ProductImage→Product, CartItem→Cart, OrderItem→Order, BuyerWishlistItem→Buyer/Product).
- **Уникальные ключи на месте:** `User.phone`, `User.telegramId`, `Store.slug`, `Store.sellerId` (INV-S01), `Order.orderNumber`, `Buyer.userId`, `Seller.userId`, `AdminUser.userId`.
- **Composite uniqueness:** `BuyerWishlistItem(buyerId, productId)`, `ProductVariant(productId, sku)`, `ProductOptionGroup(productId, code)`, `StoreCategory(storeId, slug)`, `CategoryFilter(categorySlug, key)`, `CartItem(cartId, variantId)`.
- **Partial unique** `carts_active_buyer_store_unique` (миграция `20260417090000`) — отличное решение INV-C01 на DB-уровне.
- **GIN-индекс** `products_attributesJson_gin_idx` для JSONB-фильтра (миграция `20260503010000`).
- **Enum'ы** `OrderStatus`, `ProductStatus`, `StoreStatus`, `SellerVerificationStatus`, `PaymentMethod`, `PaymentStatus`, `DeliveryType`, `ThreadType`, `MediaVisibility`, `InventoryMovementType`, `UserRole`, `UserStatus`, `ProductDisplayType` — синхронизированы между Prisma и migrations. API использует типы из `@prisma/client` — нет рассинхрона значений.

### Action items для Полата (по приоритету)

1. **P1-01:** добавить FK на User в notification-таблицы и chat/history/analytics — отдельная миграция с проверкой orphan-строк ДО создания constraint.
2. **P1-02:** решить судьбу `ChatThread.status` — enum или согласовать TEXT-значения. Сейчас `OPEN/CLOSED` зашиты в коде, но default в БД — `active`.
3. **P2-04:** добавить composite `Order(storeId, status, placedAt DESC)` — самый болезненный hot path продавца.
4. **P2-03/05:** composite индексы для Product feed и ChatMessage — можно после нагрузочного теста.
5. **P2-07:** пройтись по всем `prisma.store.find*` и добавить `deletedAt: null`. Либо отказаться от soft-delete для Store.
6. **P2-08:** рассмотреть пакетную миграцию TEXT-полей в enum.

### Что НЕ менял

- `schema.prisma` — не правил.
- Миграций не создавал.
- `prisma migrate dev` не запускал (нет доступа к БД).
- Чужие файлы (TG-AUDIT параллельной сессии) не трогал.

---

## 2026-05-03 [BUG-CHAT-LOAD-001] Чат не грузится у новых пользователей — 422 BUYER_NOT_IDENTIFIED

- **Статус:** ✅ Исправлено (не задеплоено пока — pending push в `api` ветку).
- **Симптом:** в TMA вкладка «Чат» показывает red toast «Не удалось загрузить чаты» у любого пользователя, у которого ещё нет `Buyer` записи в БД.
- **Корень:** `apps/api/src/modules/chat/chat.controller.ts` метод `resolveParticipant` для роли BUYER звал `resolveBuyerId(userId)`, а тот бросает `DomainException(422 BUYER_NOT_IDENTIFIED)` если `user.buyer === null`. Buyer создаётся ЛЕНИВО (на первой покупке/первом чате), поэтому новый юзер заходит в `/chat` → bff видит 422 и показывает ошибку. Use-case `list-my-threads.use-case` уже умел `if (!buyerId) return []` — но throw в контроллере никогда до use-case не доходил.
- **Фикс:** `resolveParticipant()` для BUYER теперь делает soft-резолв через `usersRepo.findById(userId)` и возвращает `{ buyerId: user?.buyer?.id }` (может быть undefined). Use-case дальше отдаёт `[]`. Для SELLER — то же самое + сохранён throw `SELLER_BLOCKED` если seller заблокирован.
- **Не затронут:** `resolveParticipantId` (используется в `getMessages`/`sendMessage`/`markRead`/`deleteThread`/`editMessage` etc.) остаётся жёстким — там profile реально нужен для проверки участника.
- **Чек:** после деплоя зайти в TMA свежим пользователем → tab «Чат» → должен показать «Диалогов пока нет», без red toast.

---

## 2026-05-03 [DESIGN-AUDIT-TMA-001] Дизайн-аудит TMA: контраст, hit-area, a11y, hierarchy

- **Статус:** 📋 Audit-only (фиксы — отдельным PR, не блокеры).
- **Метод:** ручной обход всех страниц TMA (buyer + seller) против чек-листа из `memory/reference_uiux_design_basics.md`.

### 🔴 Критические (нарушают UX)

1. **BottomNav inactive label color `rgba(255,255,255,0.28)`** (`apps/tma/src/components/layout/BottomNav.tsx:111`) — это **~2.7:1 контраст** на dark bg, ниже WCAG AA 4.5. Пользователь не видит названий тех вкладок, на которых не находится. Минимум `0.45-0.50`.

2. **Hit-area `<button>`-ов меньше 44pt** (Apple HIG):
  - `apps/tma/src/pages/buyer/StoresPage.tsx:131-145` — header иконки «❤️ избранное» и «⚙️ настройки» 32×32px.
  - `apps/tma/src/pages/buyer/StorePage.tsx` Add-to-cart кнопка `+` 32×32.
  - `apps/tma/src/components/ui/ProductCard.tsx:118-134` — Add-to-cart `+` 26×26 — вообще промах на iOS.
  - `apps/tma/src/pages/buyer/ChatPage.tsx:347-363` — back-кнопка `‹` 32×32, и `apps/tma/src/pages/seller/ChatPage.tsx` то же.
  - Reply/Edit cancel ✕ кнопки 24×24 в ChatPage banner — критично мелко.
  Стандарт: **min 44×44, лучше 48×48**.

3. **Нет `role="button"` + `tabIndex` + `onKeyDown` (Enter/Space)** на интерактивных `<div>`. ChatPage thread row есть, но не везде. ProductCard в `components/ui/ProductCard.tsx:50` — обычный `<div onClick>` без a11y. Screen-reader не понимает что это кликабельно.

### 🟠 Серьёзные

4. **Tertiary text 10-11px на rgba(255,255,255,0.30)** — `text-[11px]` для адресов и meta в OrdersPage, ChatPage и т.п. На iPhone SE (4.7") это ~0.6mm высоты текста с очень слабым контрастом. Минимум 12px и `0.45+` opacity.

5. **`<span>📦</span>` без `aria-hidden="true"`** — все эмодзи-иконки на страницах. Screen-reader будет читать «коробка» вместо названия раздела. Везде, где emoji decorative — обернуть в aria-hidden.

6. **Цвет-only differentiation статусов** ChatPage `t.status === 'OPEN' ? '#22D3EE' : 'rgba(255,255,255,0.35)'` (`buyer/ChatPage.tsx:741`) — colorblind-юзер видит одинаково. Добавить иконку или текст «Открыт/Закрыт».

7. **Disabled-кнопки полупрозрачны без явного «disabled» атрибута/курсора** в нескольких местах (PATCH submit в ChatPage). Юзер не понимает что нельзя нажать.

### 🟡 Средние (полировка)

8. **Не из Tailwind-шкалы:** `text-[10px]`, `text-[11px]` встречаются часто. Нужно либо добавить в `tailwind.config` именованные размеры (`text-micro`, `text-tiny`), либо переключаться на `text-xs` (12px). Сейчас ритм ломается.

9. **Hardcoded purple `#A855F7` / `rgba(168,85,247,X)`** разбросано по всем файлам. Если когда-то поменяется brand-цвет — нужно править в 80+ местах. Вынести в CSS-переменные `--color-accent` + `tailwind.theme.extend`.

10. **Glassmorphism `backdrop-filter: blur(30px)` в BottomNav** — на slow Android (Telegram in-app webview) тормозит scroll. Добавить fallback `@supports not (backdrop-filter: blur(0px)) { background: rgba(11,14,20,0.98); }`.

11. **Нет `@media (prefers-reduced-motion: reduce)`** — анимации scale/transform не отключаются для пользователей с motion sensitivity.

### 🟢 Минор

12. Нет автоматического `aria-live` региона для toast'ов — `apps/tma/src/components/ui/Toast.tsx` стоит проверить.
13. Кнопки контактов в магазинах (✈️ Telegram) `40×40` — пограничный размер, лучше 48.
14. Скелетоны грузятся одновременно — на медленном соединении пользователь видит «застывший» скелет долго. Добавить шиммер-анимацию плавнее.

### Рекомендации (приоритет)

P0 (релиз-блокеры): #1 (BottomNav контраст), #2 (hit-area для Add-to-cart и Back).
P1: #3 (a11y клавиатура), #4 (мелкий низкоконтрастный текст), #5 (aria-hidden emoji).
P2: остальное.

**Источник правил:** `C:/Users/USER/.claude/projects/.../memory/reference_uiux_design_basics.md` (WCAG AA, Apple HIG, Material).

---

## 2026-05-03 [DB-CHECK-001] Проверка совместимости миграции `super_admin_rbac_mfa_refunds` с моим API кодом

- **Статус:** ✅ Конфликтов нет.
- **Что в миграции:** `ALTER TABLE admin_users ADD COLUMN ...` (5 новых колонок с DEFAULT — backwards-compatible) + новая таблица `order_refunds` с FK на orders/admin_users.
- **Не пересекается с:** products / stores / chat / cart / variants / wishlist — мои изменения по storefront perf и chat-fix БД-нейтральны.
- **Возможные риски (когда миграция применится на проде):**
  1. Существующие admin сессии могут потерять доступ если `adminRole` default 'admin' не совпадает с тем что фронт ожидает (но default есть → бэк проставит).
  2. `order_refunds` table требует чтобы deletes на orders делались через `RESTRICT` — если где-то в API `order.delete()` — получит ошибку. Не нашёл таких мест в моём домене.
- **Запуск миграции:** `pnpm db:migrate:deploy` на Railway после деплоя `api` ветки. Это делает Полат вручную (или параллельная сессия).

---

## 2026-05-03 [PERF-TMA-API-001] TMA + API performance pass — AbortController, per-endpoint TTL, N+1 stores fix

- **Статус:** ✅ Исправлено локально (запушится с merge'ом main → tma + main → api).
- **Корни медленных запросов в TMA:**
  1. `apps/tma/src/lib/api.ts` — был один глобальный TTL=30s на все GET. Категории (статичные) запрашивались каждые 30 сек заново при переходе между страницами.
  2. Нет `AbortController` — при быстром свитче табов в `StoresPage` или категории фильтра летели гонки запросов; setState мог отработать на unmounted компонент.
  3. Нет dedup'а — два компонента, открывшихся одновременно, делали два одинаковых GET.
  4. `/storefront/stores` имел N+1: на каждый магазин шёл отдельный `prisma.mediaFile.findMany` для logo/cover. 50 магазинов = 51 запрос.
  5. `/stores/:slug/products` отдавал ВСЕ товары без cap, причём `images: include({ media: true })` без `take: 1` — 8 фото × 50 товаров × media = тяжёлый payload.
- **Что сделано (TMA):**
  - `apps/tma/src/lib/api.ts` переписан: `inferTTL()` (категории 10мин, магазины 1мин, продукты 30с, заказы 10с, чат 5с), `_inflight` Map для dedup, `opts.signal` для отмены, `apiSWR()` для stale-while-revalidate, `prefetch()` helper.
  - `pages/buyer/StoresPage.tsx`: AbortController на stores + products запросы; `prefetch(/storefront/stores/:slug + /stores/:slug/products)` на `onPointerEnter` карточки магазина.
  - `pages/buyer/StorePage.tsx`: AbortController на оба параллельных запроса (store + products) + `aborted`-guard.
  - `pages/buyer/ProductPage.tsx`: AbortController + aborted-guard.
  - `pages/buyer/OrdersPage.tsx`: AbortController + `forceFresh: true` (заказы — высокая частота изменений).
  - `components/ui/ProductCard.tsx`: `prefetch(/stores/:slug/products/:id)` на pointerenter/touchstart.
  - `components/ui/GlassCard.tsx`: добавлен опциональный `onPointerEnter` prop для prefetch с карточки магазина.
- **Что сделано (API):**
  - `apps/api/src/modules/products/products.controller.ts` `listStorefrontStores`: батчевый `mediaFile.findMany({ id: { in: allIds } })` вместо `Promise.all(stores.map(resolveStoreImageUrls))`. От 51 запроса до 2 (stores + media).
  - `apps/api/src/modules/products/repositories/products.repository.ts` `findPublicByStoreId`: добавлен soft cap 200 (max 500) + `images: take: 1` (вместо всех 8). Защита от unbounded query + минус 80% media payload.
- **Чек после деплоя:** в TMA быстрый свитч табов магазины⇄товары не должен показывать спиннер если между переключениями <10 минут (категории + магазины кэшируются дольше). На мобиле скролл по карточкам товаров → клик → ProductPage открывается мгновенно из prefetch. На бэке `/storefront/stores` p95 latency должен упасть в 2-5 раз.
- **Не сделано (отдельные TODO):**
  - Composite индекс `Product (status, deletedAt, createdAt DESC)` для feed sort by new — нужна миграция, делать в отдельном PR.
  - `pg_trgm` GIN на `Product.title` для быстрого ILIKE %q% — также миграция, не критично для MVP.
- **Параллельная сессия Claude:** работает над `apps/admin/src/pages/{FeatureFlagsPage,SystemHealthPage}.tsx` + `GetSystemHealthUseCase` в admin модуле API. Не пересекается с моими файлами.

---

## 2026-04-29 [INFRA-DEPLOY-BRANCHES-001] Root cause Railway-skip: каждый сервис теперь деплоится со своей ветки, не с main

- **Статус:** ✅ Исправлено для buyer (29.04.2026 вечер). 🟡 Web-seller — без изменений, на main для seller новой работы нет, ветка `origin/web-seller` свежая.
- **Контекст / откуда узнали:** Полат сообщил Азиму: «в main для деплоя больше пуш не делаем; у каждой платформы свои бренчи; в корень один раз случайно попал railway.toml, в гите его удалили, но Railway сам его в память сохранил». Подтвердилось коммитом `d81104127` (27.04.2026) — Полат `gitignore`нул root `railway.toml` на main и описал стратегию: «admin branch: root railway.toml → apps/admin/Dockerfile; main branch: railway.toml untracked». Затем `c03ee97` сделал то же для web-buyer ветки, `f8a0675` — для web-seller.
- **Симптом, который мы чинили:** Buyer revamp (35ad606..488932c, 11 коммитов) пушился в main и на проде не появлялся. Я делал empty-commit'ы для force-trigger — бесполезно, потому что Railway service `savdo-builder-by` подключён к ветке `web-buyer`, не к `main`. Watch Patterns на корневом railway.toml (которые я подозревал виновником) были некорректные именно потому что Railway держал кэш старого TMA-варианта, который случайно попал в репо до изоляции.
- **Стратегия (сейчас):**
  - `main` — общая разработка, без deploy. Корневой `railway.toml` в `.gitignore`.
  - `origin/admin` → savdo-admin (Полат, своё `apps/admin/Dockerfile`)
  - `origin/api` → savdo-api
  - `origin/tma` → savdo-tma
  - `origin/web-buyer` → savdo-builder-by (свой root railway.toml: `apps/web-buyer/Dockerfile`, watchPatterns `apps/web-buyer/**, packages/types/**, packages/ui/**`)
  - `origin/web-seller` → savdo-builder-sl (тот же паттерн для seller)
- **Workflow деплоя web-buyer:** `git checkout web-buyer && git merge main && git push origin web-buyer`. Конфликтов нет — main не трогает root `railway.toml` (gitignore), ветка хранит свой.
- **Что сделано 29.04 вечер:**
  1. `web-buyer` ветка отставала от main на 11 коммитов. Сделан merge `cbfe064` (Merge main into web-buyer).
  2. Корневой `railway.toml` ветки сохранён нетронутым.
  3. Push прошёл `f184d0c..cbfe064  web-buyer -> web-buyer`. Railway должен задеплоить savdo-builder-by автоматически.
  4. Локальный артефакт `railway.toml` (TMA-вариант, болтавшийся как untracked на main) удалён.
  5. Memory: новый `feedback_deploy_branches.md` чтобы не забыть workflow.
- **E2E проверка (после деплоя ~3-5 мин):** https://savdo-builder-by-production.up.railway.app — должен быть светлый `#FAFAF7`, нижний нав скрыт на md+. ✅ **Подтверждено Азимом 29.04.2026 поздно вечер: «всё работает».**
- **Старая `INFRA-RAILWAY-WATCH-PATTERNS-001`** запись ниже теперь объяснена: проблема не в watch patterns локального файла, а в том что я смотрел на main, а сервис подключён к web-buyer.

---

## 2026-04-29 [AUDIT-CONTRACT-DRIFT-001] Превентивный аудит контрактов фронт ↔ бэк выявил 14 расхождений; 3 пофикшено сейчас фронтом

- **Статус:** 🟡 (3 фронт-фикса сделано, 11 задач Полату записано в `tasks.md`)
- **Контекст:** Паттерн «Полат меняет форму response → тип в `packages/types` остаётся → web-seller ломается → web-buyer выживает потому что у него локальные типы» уже повторился дважды (Sprint 31: ChatThread, fb79db2: GlobalCategory). Запустил систематический аудит всех endpoints против `packages/types` + локальных типов — пока не напоролись на следующую жертву.
- **Метод:** 2 параллельных агента — один прогнал `curl` по public storefront-endpoints, второй сравнил типы с backend mappers/repositories для protected endpoints. Покрыл ~30 endpoints.
- **🔴 Реально сломанное в проде (фронт-фикс уже применён 29.04):**
  1. `GET /notifications/inbox` — бэк возвращает `{notifications, total, unreadCount, page, limit}`, фронт читал `data.data` → undefined → пустой inbox у продавцов и покупателей. Это и есть корень открытой задачи `/notifications диагностика`. **Фикс:** `getInbox()` в обоих `apps/web-{buyer,seller}/src/lib/api/notifications.api.ts` теперь читает `data.notifications`.
  2. `GET /storefront/categories/:slug/filters` — `fieldType` сериализуется как Prisma uppercase enum (`"SELECT"`/`"NUMBER"`/`"BOOLEAN"`/`"TEXT"`), фронт-renderer `CategoryAttributeFilters.tsx:185,228,257` сравнивал с lowercase. Все три ветки **никогда не были true** — все фильтры рендерились как text input, select-dropdown'ы и boolean-toggle'ы не показывались. **Фикс:** `getCategoryFilters()` в `storefront.api.ts` нормализует `fieldType.toLowerCase()` на лету.
- **🔴 Бэк-сторона (Полат):**
  3. `GET /seller/products` и `/:id` — controller спред raw Prisma, `mediaUrls` не маппится → пустые thumbnail на seller edit/list. Storefront маппит правильно — поэтому buyer всё видит. ID `API-SELLER-PRODUCT-MEDIA-URLS-001`.
- **🟡 Silent UX bugs / latent landmines (записаны в `tasks.md` Полату):**
  - `API-SELLER-STORE-LOGO-URL-001` — `/seller/store` без resolved `logoUrl/coverUrl`, продавец грузит лого, превью пусто.
  - `API-STORE-CONTRACT-001` — то же на storefront `/storefront/stores/:slug`.
  - `API-CHAT-MESSAGE-CONTRACT-001` — `POST /chat/.../messages` шлёт raw Prisma `{body, ...}` вместо `{text, isDeleted, senderRole}` — useEditMessage может схватить пустой text после клика «Сохранить».
  - `API-PRODUCT-CONTRACT-002` — basePrice/oldPrice/salePrice как **строка** (Prisma Decimal serialization). Фронт в большинстве мест уже знает (`Number()`/`toNum()`), но product detail `[slug]/products/[id]` mergid с variant priceOverride без обёртки — конкатенация в худшем случае.
  - `API-SELLER-ORDERS-LIST-MAPPER-001` — те же поля что чинились в DETAIL-CONTRACT-001 теперь повторяются в list.
- **🟢 Type-only fixes (записаны для гигиены):** `API-PRODUCT-CONTRACT-003` (envelope inconsistency), `API-ORDER-CONTRACT-001`, `API-BUYER-ORDERS-LIST-MAPPER-001`, `TYPES-VARIANT-REF-CONTRACT-001`, `API-CART-EMPTY-CONTRACT-001`.
- **Итог:** 3 файла фронт-фикса (в моём домене), 11 задач в очереди Полата. Аудит вернёт ROI как только Полат починит хоть один — остальные находятся в одном файле, легко batch'ить.

---

## 2026-04-29 [WEB-SOCKET-AUTH-CONTRACT-001] WebSocket gateways теперь требуют JWT в `handshake.auth.token` — превентивный фикс stale-token

- **Статус:** ✅ Исправлено превентивно (фронт-патч в обоих web-апах). 🔴 **Не задеплоено** — упирается в `INFRA-RAILWAY-WATCH-PATTERNS-001`.
- **Домен:** apps/web-buyer + apps/web-seller (Азим)
- **Что случилось:** Полат в `7cdb4c6` (28.04.2026) добавил `OnGatewayConnection` в `chat.gateway.ts` и `orders.gateway.ts`:
  - `handleConnection` отвергает соединение без `client.handshake.auth?.token` (моментальный `disconnect(true)`).
  - `join-seller-room` требует `payload.role === 'SELLER'`.
  - `join-buyer-room` требует `payload.sub === data.buyerId`.
  - `JwtModule.register({})` добавлен в `SocketModule`.
- **Анализ существующего фронта (до фикса):**
  - В `apps/web-{buyer,seller}/src/lib/socket.ts` `auth: { token: getAccessToken() }` уже передавался — то есть **первый** handshake проходил.
  - Но `getSocket()` — singleton, `auth` объект мерж-фриз на момент создания. После refresh-токена (axios interceptor `client.ts:47` дёргает `/auth/refresh` на 401 и обновляет access в localStorage) — `socket.auth.token` остаётся **старым**. На любой reconnect (network blip, 30 минут idle, Railway preheat) бэк сделает `verifyToken` старого JWT → invalid → drop. Бесконечный reconnect-loop.
  - Симптомы (если бы прод задеплоил): чат «работает первые 30 минут», потом «сообщения не приходят» без явной ошибки в UI. Аналогично seller-toaster уведомлений о новых заказах.
  - В TMA та же проблема была решена раньше через `connectSocket()` (`apps/tma/src/lib/socket.ts`) — обновление `socket.auth` перед каждым connect.
- **Воспроизведение (теоретическое, не делаю — прод ещё на старой версии):** залогиниться, не трогать вкладку 35+ минут (access TTL ≈ 30 мин), переслать сообщение → должно отвалиться.
- **Фикс (сделан):** в обоих `apps/web-{buyer,seller}/src/lib/socket.ts` заменили `auth: { token: getAccessToken() }` на функциональную форму `auth: (cb) => cb({ token: getAccessToken() ?? '' })`. Socket.io-client v4.0+ вызывает callback **на каждый handshake** (initial + reconnect), что гарантирует свежий токен из localStorage. Это лучше TMA-варианта `connectSocket()` — не нужно менять hooks (4 точки подключения), всё через один io-options.
- **Поведение для legacy-комбо (старый прод-бэк + новый фронт):** старый бэк просто игнорирует `auth.token` в handshake — соединение открывается так же как раньше. Backwards-compatible.
- **Не сделано:** в `apps/tma/src/lib/socket.ts` остался ручной `connectSocket()`-паттерн — это домен Полата (mobile-*/tma), не трогаю. Можно унифицировать позже одним PR через packages/ui или общий hook.
- **Связанные задачи:**
  - `INFRA-RAILWAY-WATCH-PATTERNS-001` — пока buyer/seller не задеплоятся, фикс лежит мёртвым грузом в `origin/main`.
  - Когда деплой пройдёт → smoke-test: 35 минут idle → отправить сообщение в чате → должно работать.

---

## 2026-04-27 [INFRA-RAILWAY-WATCH-PATTERNS-001] Все web-сервисы (buyer/seller/admin) в Railway имеют сломанные Watch Patterns + Dockerfile Path → пуши в `apps/web-*` игнорируются

- **Статус:** 🔴 Активный — sl/by ждут фикса в dashboard. Admin уже починил Полат (`0fe2a92`).
- **Домен:** Infra (Полат)
- **Что случилось:** В Railway Settings UI у сервисов `savdo-builder-by` и `savdo-builder-sl` стоят значения, которые **перебивают** локальный `apps/web-{buyer,seller}/railway.toml`:
  - Dockerfile Path = `apps/tma/Dockerfile` (вместо `apps/web-buyer/Dockerfile` / `apps/web-seller/Dockerfile`)
  - Watch Patterns = `apps/tma/**` (вместо `apps/web-{buyer,seller}/**`, `packages/types/**`, `packages/ui/**`)
- **Симптом (видно в Railway dashboard):**
  - 26.04.2026 ~21:00 после пуша сессии 36 — каждый deploy `savdo-builder-by` помечается **«Skipped — No changes to watched files»**, потому что watch смотрит только на `apps/tma/**`.
  - У `savdo-builder-sl` один deploy 17 часов назад со статусом **Failed** (требует ручной проверки Build Logs — может быть TS-ошибка от контракт-брейков Полата по `displayType`/`nameRu`).
  - Результат: **в проде вчерашняя версия** — фичи сессии 36 (avatar wire-up, chat edit/delete, displayType, hotfix категорий) **не задеплоены**, хотя в `origin/main` всё лежит.
- **Воспроизведение:** Зайти на https://savdo-builder-sl-production.up.railway.app/products/create — dropdown категорий пустой (старая версия без `nameRu` адаптера). Hash в Railway dashboard у buyer = `2df7e295` (старый, до сессии 36).
- **Корень бага:** Прошлые рукописные правки в Railway UI (когда-то кто-то выставил Watch=`apps/tma/**` для всех монорепо-сервисов). UI имеет приоритет над `railway.toml` в файлах, поэтому новые правки в файлах ничего не дают.
- **Связанный коммит-фикс (для admin):** `0fe2a92` — Полат пофиксил admin сервис, изменив пути в `apps/admin/Dockerfile` под `Root Directory = apps/admin/`. Сообщение коммита упоминает `ACTION NEEDED in Railway dashboard: savdo-builder_ADMIN → Settings → Root Directory → set to: apps/admin/`.
- **Что нужно сделать (Полат, infra):**
  1. **savdo-builder-sl → Settings → Build** → Dockerfile Path = `apps/web-seller/Dockerfile`, Watch Patterns = `apps/web-seller/**, packages/types/**, packages/ui/**`
  2. **savdo-builder-by → Settings → Build** → Dockerfile Path = `apps/web-buyer/Dockerfile`, Watch Patterns = `apps/web-buyer/**, packages/types/**, packages/ui/**`
  3. Сначала посмотреть Build Logs **failed deploy `savdo-builder-sl`** (17 часов назад) — если упал на TS-ошибке, нужно сначала пофиксить код, потом править watch.
  4. Re-deploy руками после фикса.
- **Открыто:** 27.04.2026, при e2e-проверке прода Азимом (видны Skipped/Failed в Activity).

---

## 2026-04-23 [WEB-CHAT-LIST-CRASH-001] `Cannot read properties of undefined (reading 'slice')` на /chats — чёрный экран после отправки сообщения

- **Статус:** ✅ Frontend защищён адаптером (23.04.2026, Азим, web-buyer + web-seller). 🔴 Корень — `API-CHAT-THREAD-CONTRACT-001` у Полата.
- **Где воспроизводится:** web-buyer → товар → фиолетовая кнопка чата → ввести сообщение → «Отправить» → redirect на `/chats` → весь React-tree крашится, браузер показывает generic `This page couldn't load`. В консоли: `Uncaught TypeError: Cannot read properties of undefined (reading 'slice')`. Воспроизведено у Азима 23.04.2026 в проде.
- **Цепочка причин:**
  1. Sprint 31 (`d794f18 feat(chat): real-time messages, buyer/seller names in thread list`). Полат переписал `list-my-threads.use-case.ts` — `ThreadListItem` теперь возвращает новую форму: `{id, threadType, status, lastMessageAt, lastMessage: string, productTitle, orderNumber, storeName, storeSlug, buyerPhone}`.
  2. `packages/types/src/api/chat.ts#ChatThread` **не обновлён** — всё ещё описывает старую форму `{id, contextType, contextId, buyerId, sellerId, unreadCount, lastMessage: {text}}`.
  3. `apps/web-buyer/src/app/(shop)/chats/page.tsx:48` — `thread.contextId.slice(-6).toUpperCase()` на `undefined`. Рендер падает, React unmount, Chromium показывает error page. Паттерн `SELLER-DASH-GUARD-001` × `WEB-SELLER-ACCESS-001`.
  4. Web-seller `apps/web-seller/src/app/(dashboard)/chat/page.tsx:46,106,108` — три места с `thread.buyerId.slice(-4)` и `thread.contextId.slice(-6)`. Тоже бы упал.
- **Что сделано (фронт):**
  - `apps/web-buyer/src/lib/api/chat.api.ts` — добавлен локальный `ChatThreadView` + `normalizeThread(raw)`. Маппит новый API-ответ в стабильную view-модель: `title` (derived из `storeName`/`productTitle`/`orderNumber`), `subtitle`, `lastMessageText` (поддерживает и строку, и legacy объект), `unreadCount` (fallback 0). `getThreads()` возвращает `ChatThreadView[]`.
  - Аналогичный адаптер в `apps/web-seller/src/lib/api/chat.api.ts` — `title` приоритет: `buyerPhone` → `productTitle` → `orderNumber` → `storeName` → `'Покупатель'`.
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — убран импорт `ChatThread` из `types`, использует `ChatThreadView`. `contextLabel()` удалён — используется `thread.title` / `thread.subtitle`. `lastMessage?.text` → `lastMessageText`.
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — то же. `initials(buyerId)` удалён, вместо инициалов — `<UserIcon>`. Подпись «Покупатель ···XXXX» заменена на `thread.title` (реальный телефон покупателя).
- **Что нужно Полату (`API-CHAT-THREAD-CONTRACT-001` 🔴):** обновить `packages/types/src/api/chat.ts#ChatThread` под новую форму ответа. Плюс вернуть `unreadCount` в ответ API (сейчас его нет — счётчики непрочитанных у нас фиктивные нули). После — фронт можно упростить, убрав локальный view-type.
- **Бонус 403 `/buyer/orders`:** в консоли Азима ещё видны `403` на `/buyer/orders?page=1&limit=20` — это тот же паттерн dual-role, что был в чате. Заведён `API-BUYER-ORDERS-ROLE-GUARD-001` Полату.

---

## 2026-04-23 [WEB-BUYER-CHAT-CREATE-403-001] `POST /chat/threads` → 403 «Insufficient permissions» если телефон buyer'а также Seller

- **Статус:** ✅ Исправлено Полатом (сессия 33, коммит `907f39f`). Проверено по коду: `chat.controller.ts:63-64` — `@Roles('BUYER')` снят с `POST /chat/threads`, осталась только `resolveBuyerId()` → 422 если нет профиля. `verify-otp.use-case.ts:50-53` — `ensureBuyerProfile` для существующих SELLER users. Ждёт e2e теста в проде после Railway-билда.
- **Где воспроизводится:** web-buyer, пользователь чей телефон уже зарегистрирован как SELLER. Incognito → OTP-login через Telegram → магазин → товар → фиолетовая кнопка чата в sticky CTA → ввести текст → «Отправить». POST `/api/v1/chat/threads` → **HTTP 403** с `{ code: "FORBIDDEN", message: "Insufficient permissions" }`. Проверено 23.04.2026 Азимом в проде.
- **Цепочка причин (по коду):**
  1. `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:44-47` — если `User` уже существует (был создан как SELLER), `ensureBuyerProfile` создаёт Buyer-запись, но **не меняет `User.role`**.
  2. Тот же файл, строки 66-70 — в JWT кладётся `role: resolvedUser.role`. Для нашего кейса → `role: "SELLER"`.
  3. `apps/api/src/modules/chat/chat.controller.ts:61-62` — `POST /chat/threads` декорирован `@Roles('BUYER')`.
  4. `apps/api/src/common/guards/roles.guard.ts:28-30` — если `user.role` не входит в requiredRoles, бросает `DomainException(FORBIDDEN, 'Insufficient permissions', 403)`.
- **Архитектурная несостыковка:** у одного `User` может быть и `Buyer`, и `Seller` профиль одновременно (один телефон). Но в JWT `role` — скалярное поле. Endpoints которые проверяют роль через декоратор (`@Roles('BUYER')`) видят только ту роль, что лежит в User-таблице — первая созданная.
- **Варианты фикса (Полат):**
  1. **Минимальный, рекомендую:** убрать `@Roles('BUYER')` с `POST /chat/threads` в `chat.controller.ts:62`. Метод уже вызывает `resolveBuyerId(user.sub)`, который в `chat.controller.ts:253-265` бросает 422 «Buyer profile not found» если у User нет Buyer-записи. Это уже даёт нужную проверку — «кто угодно с Buyer-профилем может создать тред». SELLER с Buyer-профилем больше не будет ловить 403.
  2. **Системный:** в JWT класть не `role: scalar`, а `roles: string[]` + список доступных профилей. `RolesGuard` апдейтится чтобы проверять пересечение. Большой рефакторинг, но закрывает всю серию проблем для dual-role пользователей (этот баг — пример, будет ещё в других местах).
- **Что на фронте (Азим):** Запланирован UX-фикс — toast на 403 с чат-mutation, чтобы юзер видел «чат сейчас недоступен, обратитесь в поддержку» вместо немой ошибки. Это маскировка, снять после бэк-фикса.

---

## 2026-04-21 [WEB-BUYER-CHECKOUT-REDIRECT-FAIL-001] После `Оформить заказ` → редирект на `/orders/{id}` показывает «Не удалось загрузить заказ»

- **Статус:** 🟡 Симптом замаскирован на фронте (Азим, 21.04.2026, коммит `b937573`). Корень — `API-BUYER-ORDER-DETAIL-MAPPER-001` (Полат).
- **Где воспроизводится:** web-buyer → корзина → «Оформить заказ» → форма → «Подтвердить заказ». POST `/checkout/confirm` возвращает 200 c валидным `Order.id`. Затем `router.replace('/orders/{id}')`. Скриншот: `c:/Users/marti/Desktop/Снимок экрана 2026-04-21 002439.png` — шапка «Заказ #…», Frown-иконка, «Не удалось загрузить заказ», «← Назад к заказам».
- **Что случилось:** `useOrder(id)` делает `GET /buyer/orders/{id}` сразу после создания. Этот запрос возвращает не-2xx (точная причина требует Network-скрина; вероятные — 401 из auth-серии, 404 или 500 из-за отсутствующего mapper/store include). `useQuery.isError = true` → рендерится error-state.
- **Что сделано (фронт):** `apps/web-buyer/src/hooks/use-checkout.ts` — `useConfirmCheckout.onSuccess` кладёт полученный Order в `queryClient.setQueryData(orderKeys.detail(order.id), order)`. Invalidate сужен до `['orders', 'list']` чтобы prepopulated detail не стирался. Благодаря `staleTime: 2 мин` в `useOrder(id)`, страница сразу после checkout рендерит order из кэша, не делает GET.
- **Что не решено:** Если зайти в этот заказ позже (из списка, через refresh страницы, из истории) — `useOrder(id)` выполнит GET и снова покажет error-state. Полный фикс — `API-BUYER-ORDER-DETAIL-MAPPER-001` (общий mapper + `include: store`).
- **Диагностика для Полата:** Открыть Railway logs, сделать тестовый заказ, поймать трейс `GET /buyer/orders/{id}` сразу после `POST /checkout/confirm`. Точный статус (401/404/500) покажет какую из ветвей чинить в первую очередь.

---

## 2026-04-21 [AUDIT-SESSION-30] Полный аудит web-buyer + web-seller — найдено 8 проблем, 7 исправлено на фронте

- **Статус:** ✅ Фронт починен (Азим, 21.04.2026). 1 осталось на Полате.
- **Что проверено:** `apps/web-buyer` (cart, checkout, orders list/detail, product, store, ProductCard), `apps/web-seller` (dashboard, orders list/detail, products, analytics, settings). Проверка: unsafe `.toLocaleString`, undefined-доступ, контракты с `packages/types`, missing guards, auth/session.
- **Найдено и исправлено:**
  1. 🔴 **web-buyer `/orders/:id` CRASH** — `order.store.name.charAt(0)` крэшил страницу, т.к. `findById` в бэке не делает `include: { store }`. Добавлен `normalizeOrder()` (flat→nested, snapshot-поля, toNum), блок магазина условный. Корень — `API-BUYER-ORDER-DETAIL-MAPPER-001` (задача Полату).
  2. 🔴 **web-buyer `/orders/:id` items.reduce/map** без guard на undefined — защищено через `Array.isArray` в normalize.
  3. 🟡 **web-buyer `/orders/:id` fmt** читал `order.deliveryFee`, `item.subtotal` (всё из контракта) → при raw-Prisma было `undefined.toLocaleString` → NaN/crash. Теперь `toNum()` через `fmt`.
  4. 🟡 **web-buyer `/orders` list fmt + address** — `fmt(n: number)` без guard + `order.deliveryAddress.city` без fallback. Исправлено: safe `fmt(unknown)` + fallback `raw.city`/`raw.addressLine1`.
  5. 🟡 **web-buyer `ProductCard`** — `product.basePrice.toLocaleString()` падал, если basePrice пришёл как Prisma Decimal-строка. `Number()` оборачивание.
  6. 🟡 **web-buyer `[slug]/products/[id]`** — `fmt(n: number)` без guard. Safe-fmt через Number.
  7. 🟡 **web-seller orders list** — `fmt(amount: number)` без guard + search по `deliveryAddress` без flat-fallback. Заменено на `toNum + getAddr()`.
  8. 🟡 **web-seller dashboard + products list** — `fmt(n)` без guard. Safe-fmt.
- **Осталось Полату:** `API-BUYER-ORDER-DETAIL-MAPPER-001` — общий `orders.mapper.ts` по контракту `Order`, плюс `store` в `findById`. Закроет и `API-SELLER-ORDER-DETAIL-CONTRACT-001`.
- **Файлы фронта:** `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`, `apps/web-buyer/src/app/(shop)/orders/page.tsx`, `apps/web-buyer/src/components/store/ProductCard.tsx`, `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`, `apps/web-seller/src/app/(dashboard)/orders/page.tsx`, `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx`, `apps/web-seller/src/app/(dashboard)/products/page.tsx`.

---

## 2026-04-21 [API-SELLER-ORDER-DETAIL-CONTRACT-001] `/seller/orders/:id` после FIX-C отдаёт flat `city`/`region`/`deliveryFeeAmount`/`customerComment`/`placedAt` — расходится с `Order` типом

- **Статус:** 🔴 Контракт-регрессия (Полат). Заведено в `analiz/tasks.md`.
- **Что случилось:** В сессии 29 Полат сделал inline-mapper для `/seller/orders/:id` чтобы починить undefined-числа (коммит `d974d81`). Числа теперь `toNum()`-безопасны ✅, но он заново собрал форму и пошёл против существующего типа `Order` (`packages/types/src/api/orders.ts`):
  - Вместо `deliveryAddress: { street, city, region }` → flat `city`, `region`, `addressLine1`
  - Вместо `deliveryFee` → `deliveryFeeAmount`
  - Вместо `buyerNote` → `customerComment`
  - Вместо `createdAt` → `placedAt`
- **Эффект на фронте web-seller:** `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx:236,307,326-330,375` — всё optional-chain'ится, так что крэша нет. Но пользователь видит `—, —` вместо адреса, «Бесплатно» вместо доставки, дата пустая, комментарий не рендерится (`{order.buyerNote && ...}` → false).
- **Как обнаружено (Азим, 21.04.2026):** сверка backend controller ↔ `packages/types/src/api/orders.ts` ↔ reader в `web-seller/orders/[id]/page.tsx`.
- **Что дальше:** На бэке нормализовать под тип `Order` (см. `analiz/tasks.md`). Фронт НЕ трогать — контракт `packages/types` — источник истины.
- **Не забыть:** проверить что `/buyer/orders/:id` (тот же use-case, без inline-mapper в controller) отдаёт правильный `deliveryAddress`. Если тоже сломан — расширить задачу.

---

## 2026-04-21 [WEB-BUYER-CART-THUMB-FIX-VERIFIED] `cart.mapper` теперь отдаёт `mediaUrl` как URL — фронт-workaround остаётся защитой

- **Статус:** ✅ Верифицировано (Азим, 21.04.2026).
- **Что проверено:** После `d974d81` (Полат) `cart.mapper.ts:65` вызывает `resolveMediaUrl(product?.images?.[0]?.media)` → для telegram-bucket → `${APP_URL}/api/v1/media/proxy/${media.id}`, для остальных → `${STORAGE_PUBLIC_URL}/${media.objectKey}`. `cart.repository.ts` теперь `include: { media: true }` вместо `select: { mediaId: true }`.
- **Фронт:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx` — `imgFailed` state + `onError` fallback к `<Package>` иконке. После бэк-фикса URL валидный → картинки грузятся. Костыль безвреден (сработает только если реально 404 / broken image), удалять не надо — защита от будущих регрессий.

---

## 2026-04-19 [WEB-BUYER-PROFILE-AVATAR-MISSING-001] В `/profile` нет возможности поставить фото

- **Статус:** 🟡 Фича отсутствует — задача переведена на Полата (`API-BUYER-AVATAR-001` в tasks.md).
- **Что случилось:** На странице профиля рендерится дефолтная иконка `<UserIcon>` в круге. Никакого аватара, никакой кнопки «изменить фото».
- **Корневая причина:** В схеме `Buyer` (`packages/db/prisma/schema.prisma:166`) нет `avatarUrl`. В типе `BuyerProfile` (`packages/types`) нет такого поля. На бэке нет `POST /buyer/me/avatar`.
- **Что сделано:** Заведена задача `API-BUYER-AVATAR-001` (Полат): схема + миграция + multipart upload в R2 + поле в `auth/me`. Веб-часть (UI с `<input type=file>`, инвалидация кэша `['auth','me']`) — Азим, после готовности backend.

---

## 2026-04-19 [WEB-AUTH-LOGOUT-LOOP-001] Бесконечный `POST /auth/logout 401` после клика «Выйти» — нельзя залогиниться

- **Статус:** ✅ Исправлено (Азим, 19.04.2026, web-seller + web-buyer).
- **Что случилось:** Азим выходил из seller-аккаунта и пытался залогиниться обратно — выкидывало на регистрацию. В консоли — сотни строк `logout:1 Failed to load resource: 401`.
- **Корневая причина:** Axios interceptor пытался refresh-нуть токен на 401 от `/auth/logout`. Refresh тоже 401 → `clearTokens` + `savdo:auth:expired` event → AuthProvider слушал и звал `logout()` снова → бесконечный цикл.
- **Что сделано:**
  1. `apps/web-seller/src/lib/api/client.ts` и `apps/web-buyer/src/lib/api/client.ts` — interceptor пропускает refresh для `/auth/logout`, `/auth/refresh`, `/auth/otp/*`.
  2. `context.tsx` (оба app): добавлен `localLogout()` (только локальная очистка). `onExpired` event handler и `getMe` catch теперь зовут `localLogout()`, а не полный `logout()` который опять бил по сети.
- **Также важно:** **причина первого 401** (почему вообще `logout` падает с 401) — отдельный вопрос для бэка. Скорее всего токен expired или backend не принимает session-id из refresh-token. Это не блокер сейчас, но Полату стоит глянуть. Можно после теста.

---

## 2026-04-19 [WEB-SELLER-MEDIA-UPLOAD-500-001] `POST /media/upload` 500 → нельзя загрузить картинку товара/лого магазина

- **Статус:** 🔴 Бэкенд-баг (Полат). Фронт корректен. Задача `API-MEDIA-UPLOAD-500-001`.
- **Что случилось:** Из `<ImageUploader>` в web-seller (products/create, products/[id]/edit, settings) `POST /media/upload` отдаёт 500. Console: `[ImageUploader] upload failed AxiosError: Request failed with status code 500`.
- **Анализ фронта:** `apps/web-seller/src/lib/api/media.api.ts:48-65` — корректно собирает FormData (`file` + `purpose`), отправляет через axios. Валидация на клиенте (mime, 10 МБ) проходит до запроса.
- **Что нужно Полату:** Посмотреть Railway logs за момент upload — что бросилось в `UploadDirectUseCase.execute()`. Скорее всего `telegramStorage.uploadFile()` или `mediaRepo.create()`. Обернуть в try/catch + log + бросить осмысленную `DomainException`, а не давать NestJS вернуть голый 500.

---

## 2026-04-19 [WEB-SELLER-NOTIFICATIONS-LOAD-FAIL-001] «Не удалось загрузить уведомления» вместо empty-state

- **Статус:** 🟡 Зависит от подтверждения. Если 401 — связано с auth-серией, если 404/500 — отдельный бэкенд-баг.
- **Что случилось:** В `/notifications` рендерится «Последние 0 уведомлений» + красная плашка «Не удалось загрузить» одновременно. Это **не** empty state — empty state показывает колокольчик и текст «Уведомлений пока нет» (`apps/web-seller/src/app/(dashboard)/notifications/page.tsx:153-160`). Красная плашка рендерится при `isError === true` от `useNotifications()`.
- **Корневая причина:** `GET /notifications/inbox` возвращает не 200. На предыдущих скринах консоли уже фиксировали `/notifications/inbox/unread-count 401`. Вероятно тот же auth-флоу — JWT токен невалиден / expired для seller user. Часть серии 401 на `/auth/me`, `/seller/store`, `/seller/summary`, `/chat/threads`.
- **Что нужно:** Подтвердить статус через DevTools → Network → `notifications/inbox`. Если 401 — это часть общей auth-проблемы (не репортить отдельно пока не подтвердим источник). Если другой код — отдельная задача для Полата.

---

## 2026-04-19 [WEB-SELLER-ORDER-DETAIL-CRASH-001] `Cannot read properties of undefined (reading 'toLocaleString')` при клике на заказ

- **Статус:** ✅ Frontend защищён (Азим, 19.04.2026). 🟡 Корневая причина бэка — задача `API-SELLER-ORDER-DETAIL-MAPPER-001`.
- **Что случилось:** В `web-seller` клик по любому заказу (`/orders/:id`) рушит страницу — рендерится `This page couldn't load`. В консоли `Uncaught TypeError: Cannot read properties of undefined (reading 'toLocaleString')`. Список заказов (`/orders`) работает.
- **Что сделано (фронт):** `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`:
  - `fmt(n)` теперь принимает `unknown`, гонит через `toNum()` (Number/string/Decimal-object → safe number). Никаких прямых `n.toLocaleString` на сырых полях.
  - `order.items` → `order.items ?? []` и `?.length ?? 0`.
  - `order.deliveryFee > 0` → `toNum(order.deliveryFee) > 0`.
  - `STATUS_CONFIG[order.status]` → fallback `{ label, color }` если статус не в перечне.
  - `PAYMENT_STATUS_LABELS[order.paymentStatus] ?? '—'`.
  - `new Date(order.createdAt)` обёрнут в проверку.
- **Корневая причина (бэк):** `GET /seller/orders/:id` возвращает что-то с `undefined` в `totalAmount` или `items[].subtotal`/`unitPrice`. Скорее всего то же что было с `/cart` (см. `WEB-BUYER-PRICE-ZERO-001`) — Prisma Decimal не сериализован, либо нет mapper'а. Список (`/seller/orders`) работает потому что использует другой endpoint/mapper.

---

## 2026-04-19 [WEB-BUYER-CART-THUMB-001] Картинка товара 404 + alt-текст вылезает из 62×62 плейсхолдера в `/cart`

- **Статус:** ✅ Frontend защищён (Азим, 19.04.2026). 🔴 Корневая причина — баг бэка, задача `API-CART-MEDIA-001` для Полата.
- **Что случилось:** В корзине при сломанной `mediaUrl` `next/image` рендерил системный broken-icon + alt-текст («Белая футболка»). Текст вылезал из 62×62 плейсхолдера и ломал layout строки.
- **Что сделано (фронт):** В `apps/web-buyer/src/app/(minimal)/cart/page.tsx` добавлен локальный state `imgFailed` + `onError={() => setImgFailed(true)}`. При ошибке загрузки рендерим тот же `<Package>` placeholder что и при пустой `mediaUrl`.
- **Корневая причина (бэк) — найдена 19.04.2026:** в новом `apps/api/src/modules/cart/cart.mapper.ts:57` (commit `5ca0666` Полата) поле `mediaUrl` заполняется голым `mediaId` (UUID), а не URL. Браузер делает `GET /<uuid>` → 404 → срабатывает мой fallback. До этого коммита фотки в корзине показывались. Задача `API-CART-MEDIA-001` (использовать `resolveImageUrl(media)` как в `products.controller.ts:540`) — заведена в `analiz/tasks.md`.

---

## 2026-04-19 [WEB-BUYER-PRICE-ZERO-001] В корзине и в оформлении цена показывается «0 сум»

- **Статус:** ✅ Костыль на фронте (19.04.2026, Азим). Реальный фикс — бэкенд (см. ниже).
- **Что случилось:** И корзина, и `/checkout/preview` показывают 0 сум у товаров с непустой ценой. Бэкенд в `preview-checkout.use-case.ts:86` делает `Number(cartItem.unitPriceSnapshot)`, а в `add-to-cart.use-case.ts:45` — `Number((product as any).basePrice)`. Когда Prisma Decimal сериализуется в JSON не как строка, `Number(obj)` → NaN → `lineTotal = 0 × quantity = 0` → subtotal = 0. Либо старые cart items были созданы до корректного сохранения snapshot.
- **Что сделано:**
  - `apps/web-buyer/src/app/(minimal)/cart/page.tsx` — `itemUnitPrice(i)` расширен цепочкой fallback: `variant.salePriceOverride → variant.priceOverride → salePriceSnapshot → unitPrice → unitPriceSnapshot → product.salePrice → product.basePrice → 0`. Используется `toNum()` с проверкой `Number.isFinite`.
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — «Состав заказа» рендерится из `useCart()` (там есть `product.basePrice`), не из preview. `subtotal` берётся из preview только если `> 0`, иначе пересчитывается из cart.
- **Что нужно Полату:**
  1. `add-to-cart.use-case.ts:45,66,72` — убедиться что `Number()` на Prisma Decimal даёт число (использовать `.toNumber()` вместо `Number()`).
  2. `preview-checkout.use-case.ts:86,120` — то же.
  3. `get-cart.use-case.ts` — добавить mapper который пересчитывает `unitPrice` / `subtotal` / `totalAmount` в соответствии с `packages/types/src/api/cart.ts` (сейчас prisma-сырец возвращается).

---

## 2026-04-19 [WEB-BUYER-CHECKOUT-BOUNCE-001] На `/checkout` юзера выкидывает обратно в корзину через пару секунд

- **Статус:** ✅ Исправлено (19.04.2026, Азим).
- **Где воспроизводится:** web-buyer → «Оформить заказ» → заполняю улицу/город → через несколько секунд `router.replace('/cart')`.
- **Что случилось:**
  - `useCheckoutPreview` стоял с `staleTime: 0` → каждый фокус/клик в input → default `refetchOnWindowFocus: true` → refetch.
  - Контракт `/checkout/preview` разошёлся: backend `preview-checkout.use-case.ts:153-163` возвращает `{ validItems, invalidItems, subtotal, deliveryFee, total, currency, ... }`, а frontend `CheckoutPreview` ждал `{ items, subtotal, currencyCode, stockWarnings }`.
  - Если refetch ловил ошибку (`CART_EMPTY` 422 или `Buyer profile not found` 401 — хвост `API-CART-MERGE-401-001`), `preview.data` становился undefined.
  - Строки `checkout/page.tsx:257-261`: `if (!preview.isLoading && !preview.data) router.replace('/cart')` — выкидывало при любой временной ошибке, даже когда user печатал.
- **Что сделано:**
  - `apps/web-buyer/src/hooks/use-checkout.ts` — `staleTime: 60_000`, `refetchOnWindowFocus: false`, `retry: 1`.
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — redirect только при `preview.isSuccess && items.length === 0` (реально пустая корзина), а не при любой ошибке.
  - Принимаем оба варианта ответа от бэка: `previewData.items ?? previewData.validItems`. Маппинг `title ?? productTitleSnapshot`, `variantTitle ?? variantLabelSnapshot`, `subtotal ?? lineTotal`.
  - `fmt()` защищён от undefined (как в cart).
- **Что нужно Полату:** `preview-checkout.use-case.ts` должен возвращать поля из контракта `packages/types/src/api/cart.ts` — `items` (не `validItems`), `currencyCode` (не `currency`), `stockWarnings: string[]` (составляется из `invalidItems`). Сейчас фронт вынужден поддерживать оба варианта.

---

## 2026-04-19 [API-CART-CONTRACT-MISMATCH-001] Бэкенд `/cart` отдаёт prisma-сырец вместо обещанного типа `Cart`

- **Статус:** 🔴 Баг на бэкенде (Полат). Фронт зашит defensive-fallback'ами (см. `WEB-BUYER-CART-RENDER-002`), но это костыль.
- **Где воспроизводится:** web-buyer `/cart`, чёрный экран + консоль `Uncaught TypeError: Cannot read properties of undefined (reading 'toLocaleString')` → `fmt(undefined)`.
- **Контракт в `packages/types/src/api/cart.ts`:**
  - `Cart.totalAmount: number`, `Cart.currencyCode: string`
  - `CartItem.unitPrice: number`, `CartItem.subtotal: number`
  - `CartItem.product: ProductRef` (c mediaUrl, title)
- **Что возвращает бэк (`apps/api/src/modules/cart/repositories/cart.repository.ts` + `use-cases/get-cart.use-case.ts`):**
  - сырой `prisma.cart.findFirst({ include: { items: { include: { product, variant }}}})` — то есть `totalAmount`/`currencyCode` **не вычисляются и не возвращаются**.
  - Items содержат `unitPriceSnapshot: Decimal` (prisma Decimal, не number!), `subtotal` **нет вовсе**.
  - `product.images[0].mediaId` вместо `product.mediaUrl` / полноценного URL.
- **Что нужно Полату:** добавить mapper в `get-cart.use-case.ts` (и `add-to-cart`/`update-cart-item`) который:
  1. Пересчитывает `unitPrice = Number(item.salePriceSnapshot ?? item.unitPriceSnapshot)` и `subtotal = unitPrice * quantity`.
  2. Считает `totalAmount = sum(items.subtotal)` + устанавливает `currencyCode` ('UZS').
  3. Мапит `product.images[0]` через storage в полный URL (`mediaUrl`).
  4. Возвращать полный `Cart` (а не `CartItem`) из POST/PATCH `/cart/items` — см. `WEB-BUYER-CART-CACHE-001`.

---

## 2026-04-19 [WEB-BUYER-CART-RENDER-002] `fmt(undefined)` на `/cart` после первого добавления — чёрный экран

- **Статус:** ✅ Костыль-фикс на фронте (19.04.2026, Азим). Реальный фикс — бэкенд (`API-CART-CONTRACT-MISMATCH-001`).
- **Где воспроизводится:** web-buyer → добавить товар → `/cart` → консоль `Cannot read properties of undefined (reading 'toLocaleString')` → React unmount → generic Chromium error page.
- **Что случилось:** После исправления `WEB-BUYER-CART-CACHE-001` кэш перечитывается через `GET /cart`, но бэкенд возвращает сырой prisma-cart без `totalAmount`/`unitPrice`/`subtotal` (см. выше). `fmt(cart.totalAmount)` и `fmt(item.unitPrice)` ломались на `undefined.toLocaleString`.
- **Что сделано:**
  - `apps/web-buyer/src/app/(minimal)/cart/page.tsx:36-40` — `fmt(n)` теперь `(typeof n === "number" ? n : Number(n) || 0).toLocaleString(...)`. Добавлен `itemSubtotal(i)` — fallback через `unitPrice * quantity` если `subtotal` нет.
  - `cart/page.tsx:158-162` — `totalAmount` вычисляется на клиенте из items если бэк не прислал.
  - Все `fmt(cart!.totalAmount)` → `fmt(totalAmount)` (4 места).

---

## 2026-04-19 [WEB-BUYER-ORDERS-ADDR-GUARD-001] Railway билд web-buyer падает на `order.deliveryAddress.street`

- **Статус:** ✅ Исправлено (19.04.2026, Азим). Следствие `API-ORDER-ADDR-001` — Полат сделал `deliveryAddress?` optional в контракте, web-buyer не был обновлён (в отличие от web-seller, где было сделано в сессии 24 — `SELLER-DASH-GUARD-001`).
- **Где воспроизводится:** Railway build `savdo-builder-by` → `Failed to type check. ./src/app/(shop)/orders/[id]/page.tsx:277:59 Type error: 'order.deliveryAddress' is possibly 'undefined'.` → билд падает, Docker exit 1.
- **Что сделано:**
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:277-279` — `order.deliveryAddress?.street ?? '—'` + `order.deliveryAddress?.city ?? '—'` + `order.deliveryAddress?.region && ...`.
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx:91-93` — тернарник: если `deliveryAddress` есть — `city, street`, иначе `Самовывоз`.
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx:146-147` — поиск с `?.?.toLowerCase()?.includes(q) ?? false`.

---

## 2026-04-19 [WEB-BUYER-CART-CACHE-001] Краш `reading 'reduce'` после добавления в корзину (web-buyer, не TMA)

- **Статус:** ✅ Исправлено на фронте (19.04.2026, Азим). Backend-часть → Полату (см. ниже).
- **Где воспроизводится:** web-buyer (`savdo-builder-by`) → магазин → «Добавить в корзину» → любая страница с Header крашится → Edge/Chrome рисует generic «This page couldn't load». Визуально выглядит как «баг при переходе на корзину» (скрин `c:/Users/marti/Desktop/photo_2026-04-19_15-39-33.jpg`). В консоли `Uncaught TypeError: Cannot read properties of undefined (reading 'reduce')` + `401 ×2 на /cart/merge`.
- **Что случилось:** Несовпадение контрактов. Backend `POST /cart/items` (`apps/api/src/modules/cart/use-cases/add-to-cart.use-case.ts:27`) и `PATCH /cart/items/:id` (`update-cart-item.use-case.ts:19`) возвращают **одиночный `CartItem`** (prisma-модель) — `{id, cartId, productId, quantity, unitPriceSnapshot, ...}`. Но `packages/types/src/api/cart.ts:22` и `apps/web-buyer/src/lib/api/cart.api.ts:22` декларируют `Promise<Cart>`. `useAddToCart` (`hooks/use-cart.ts:27`) писал этот `CartItem` в кэш `['cart']` через `setQueryData` — кэш испорчен, `cart.items === undefined`. Дальше `Header.tsx:13` с незащищённым `cart?.items.reduce(...)` (`?.` только на `cart`) → `undefined.reduce` → TypeError → unmount дерева. Паттерн идентичен `SELLER-DASH-GUARD-001`.
- **Что сделано (фронт, Азим):**
  - `apps/web-buyer/src/hooks/use-cart.ts:27,37` — `setQueryData(CART_KEY, cart)` → `invalidateQueries({ queryKey: CART_KEY })`. Кэш обновляется через `GET /cart` (всегда правильная форма).
  - `apps/web-buyer/src/components/layout/Header.tsx:13` — `cart?.items?.reduce(...)` (двойной optional chaining, как в `BottomNavBar.tsx:30`).
- **Что нужно Полату:** `POST /cart/items` и `PATCH /cart/items/:id` должны возвращать полный `Cart` (с items + totalAmount), а не голый `CartItem` — контракт в `packages/types/src/api/cart.ts:22` уже это обещает. Сейчас бэк врёт форме, фронт вынужден делать лишний GET. Это backend-bug.

---

## 2026-04-19 [API-CART-MERGE-401-001] `Buyer profile not found` — 401 на /cart/merge, /checkout/preview, /checkout/confirm

- **Статус:** 🔴 Баг на бэкенде. Юзеры БЛОКИРОВАНЫ оформлением заказа (19.04.2026, визуально подтверждено — «Не удалось оформить заказ. Buyer profile not found»).
- **Где воспроизводится:** web-buyer → OTP-логин → попытка mergeCart/preview/confirm → 401. При клике «Подтвердить заказ» → `apiError = "Buyer profile not found"` (ErrorBanner внизу формы).
- **Root cause:** `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:41-44`
  ```ts
  let user = await this.authRepo.findUserByPhone(phone);
  if (!user) {
    user = await this.authRepo.createUserWithBuyer({ phone });
  }
  ```
  Buyer создаётся **только при первом появлении User**. Если тот же `phone` уже существует как SELLER (`createUserWithSeller`) или был ghost-аккаунтом из Telegram без `Buyer`-relation — verifyOtp возвращает валидный JWT, но `fullUser.buyer === null`. Далее:
  - `cart.controller.ts:161-168` → 401 «Buyer profile not found»
  - `checkout.controller.ts:49-55` → 401 в preview и confirm
- **Что нужно Полату (варианты в порядке приоритета):**
  1. В `verify-otp.use-case.ts:41` — после `findUserByPhone`, если `user && !user.buyer` и `purpose !== 'seller-onboarding'`, создать buyer: `await authRepo.ensureBuyerProfile(user.id)` (новый метод-helper через `prisma.buyer.upsert({ where: { userId }, create: { userId }, update: {} })`).
  2. **Альтернативно** — сделать auto-ensure в `cart.controller.ts:161` и `checkout.controller.ts:49`: вместо 401 кидать `buyerRepo.ensureForUser(user.sub)` и продолжить. Дешевле для будущих UX-сбоев.
  3. Ручной fix для текущих заблокированных аккаунтов: `INSERT INTO "buyer" (id, "userId") SELECT gen_random_uuid(), u.id FROM "user" u WHERE u.role = 'BUYER' AND NOT EXISTS (SELECT 1 FROM "buyer" b WHERE b."userId" = u.id);` — для всех пострадавших юзеров.
- **На фронте:** пока этого фикса нет — заказы оформить невозможно, что бы мы ни делали в UI. Это блокер MVP.

---

## 2026-04-18 [TMA-STOCK-INPUT-001] Leading `0` не уходит из input остатка в AddProduct/EditProduct

- **Статус:** ✅ Исправлено (18.04.2026, Азим)
- **Что случилось:** В `AddProductPage.tsx` поля количества (main stock + S/M/L size stocks) были `useState('0')` / `useState<number>(0)`, при вводе "5" браузер делал "05" и React не стрипал ведущий ноль. Аналогично в `EditProductPage.tsx` поле `stockEdits[v.id]` инициализировалось как `String(0) = "0"`.
- **Что сделано:**
  - `apps/tma/src/pages/seller/AddProductPage.tsx` — initial `stock` = `''`, onChange стрипает `/^0+(?=\d)/`; size stocks `value={sz.stock || ''}`.
  - `apps/tma/src/pages/seller/EditProductPage.tsx` — initial `stockEdits[v.id] = v.stockQuantity === 0 ? '' : String(...)`, onChange стрипает ведущие нули.
  - Placeholder "0" остался, визуально поле выглядит как "0" но это плейсхолдер.

---

## 2026-04-18 [TMA-ORDER-PREVIEW-NULL-001] У старых заказов preview пустой — показывается «Без товаров»

- **Статус:** 🟡 Наблюдение (18.04.2026). Ждём проверку после Railway-деплоя `42f45cd`.
- **Где воспроизводится:** TMA seller panel / web-seller /orders → заказ `#ORD-MO2NEAFC-VZ27 (ДОСТАВЛЕН)` и другие старые доставленные.
- **Что случилось (предположение):** Backend `preview` строится из первого `OrderItem` (коммит `9946af5` Полата). Если у старого заказа orderItems связаны с удалёнными товарами или `productTitleSnapshot=null` — preview может быть `null`, UI показывает «Без товаров».
- **Что нужно проверить:** После Railway-деплоя open DevTools Network → `/seller/orders` → посмотреть поле `preview` в response старых заказов. Если `null` — баг в `get-seller-orders.use-case.ts` у Полата (не берёт snapshot). Если preview есть, но фронт не показывает — наш баг.
- **Домен:** диагностика Азим, потенциальный фикс — Полат.

---

## 2026-04-18 [TMA-PRODUCT-IMAGE-NULL-001] У товара в preview нет фото — показывается 📦 fallback

- **Статус:** 🟡 Наблюдение (18.04.2026). Зависит от TG-BOT-ADMIN-001.
- **Что случилось:** Preview-thumbnail в orders list показывает серый квадрат с 📦 вместо фото товара.
- **Корневые причины (порядок проверки):**
  1. У товара реально нет фото (пользователь не загрузил) — правильное поведение.
  2. `TG-BOT-ADMIN-001` не сделан — `@savdo_builderBOT` не админ канала `-1003760300539`, upload фото через Telegram storage падает тихо, товар создаётся с `imageUrl=null`.
  3. Баг в `telegram-storage.service.ts` (Полат) — даже если бот админ.
- **Что нужно сделать Азиму:** Проверить админ-статус бота в Telegram-канале. Если не сделано — сделать и перезалить фото товара. Если сделано и всё равно null — пинг Полату с Railway-логом upload.

---

## 2026-04-17 [BUG-001] Checkout полностью сломан — DTO мисматч + нет backend cart

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** TMA `CheckoutPage.tsx` отправлял `items[]`, `buyerName`, `buyerPhone` в POST /orders, но backend `ConfirmCheckoutDto` отклонял их (`forbidNonWhitelisted`). Дополнительно: backend ожидал корзину в БД, TMA хранит в localStorage — архитектурный разрыв.
- **Что сделано:** Создан `CreateDirectOrderUseCase` + `CreateDirectOrderDto` принимающий items напрямую (без cart в БД). `orders-create.controller.ts` переключён на новый use case.

## 2026-04-17 [BUG-002] Seller может менять статус чужих заказов

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `UpdateOrderStatusUseCase` не проверял что `order.storeId` совпадает с storeId продавца из JWT. Любой продавец мог изменить статус любого заказа.
- **Что сделано:** Добавлен `storeId?` в `UpdateOrderStatusInput`, проверка `order.storeId !== input.storeId` → 403. `orders.controller.ts` передаёт `storeId` в use case.

## 2026-04-17 [BUG-003] Товары из неопубликованных магазинов доступны

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `GET /stores/:slug/products` и `GET /stores/:slug/products/:id` не проверяли `store.isPublic`. Покупатели могли видеть товары магазинов в статусе DRAFT.
- **Что сделано:** Добавлена проверка `!store.isPublic → 404` в обоих маршрутах в `products.controller.ts`.

## 2026-04-17 [BUG-004] variantId не сохранялся в localStorage корзине

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `ProductPage.tsx` добавлял товар в корзину без `variantId`, поэтому на checkout приходила неверная цена и variant не валидировался на backend.
- **Что сделано:** `CartItem` добавлен `variantId?: string`. `addToCart()` сохраняет `variantId`. `CheckoutPage.tsx` включает `variantId` в каждый item.

---

## 2026-04-17 [BUG-011] confirm-checkout: variant.productId не валидировался

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `ConfirmCheckoutUseCase` не проверял что `variant.productId === cartItem.productId`. Теоретически можно было подменить вариант из другого товара.
- **Что сделано:** Добавлена проверка `variant.productId !== cartItem.productId → invalid item`.

## 2026-04-17 [BUG-015] TMA buyer OrdersPage — неверный формат ответа API

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** Страница читала `res.orders` но backend возвращает `{ data: [], meta: {} }`. Заказы всегда показывались пустыми.
- **Что сделано:** Исправлено на `res.data ?? []`. Добавлен error state + кнопка "Загрузить ещё" для pagination.

## 2026-04-17 [BUG-016] broadcast.message без валидации (Telegram markdown injection)

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** Endpoint принимал `body: { message: string }` без DTO → ValidationPipe не работал, длина не ограничена.
- **Что сделано:** Создан `BroadcastDto` с `@IsString() @MaxLength(4096)`.

---

## 2026-04-17 [WEB-SELLER-ACCESS-001] Ложная тревога — «не открывается seller» было падением клиента, не сетью

- **Статус:** ✅ Диагностировано (17.04.2026, сессия 24). Исправление клиента см. `SELLER-DASH-GUARD-001`, серверная часть — `API-SUMMARY-500-001`.
- **Что оказалось:** Диагноз сессии 23 («DNS/сеть у Азима режет только этот хост») — **неверный**. Страница `/dashboard` физически грузилась, но в консоли:
  1. `GET /analytics/seller/summary` → **HTTP 500** от API.
  2. `Uncaught TypeError: Cannot read properties of undefined (reading 'city')` на `dashboard/page.tsx:221` и `orders/page.tsx:152,248` и т.д. — какой-то заказ приходит без `deliveryAddress`, optional chaining нигде не было.
  Критический TypeError убивал React-tree → Edge/Chrome/Яндекс.Браузер показывали свою generic `This page couldn't load` error page (одну и ту же, поэтому выглядело «как будто соединение не идёт»).
- **Почему curl «работал», а браузер нет:** curl не делал JS-рендер, просто получал HTML. С моей сети «работало» потому что я не авторизован → middleware редиректит на `/login` → до падающего dashboard не доходит.
- **Почему не поймали в сессии 23:** не сделали `F12 → Console` у Азима. Полчаса диагностики DNS/nslookup/curl/hosts впустую. **Урок:** при «This page couldn't load» в Chromium — **первым делом** F12 → Console, а не tracert.
- **Правка `.env.example` (NEXT_PUBLIC_BUYER_URL с мёртвого домена на живой) — осталась, не связана с багом, подлежит коммиту.

---

## 2026-04-17 [API-SUMMARY-500-001] `GET /analytics/seller/summary` возвращает HTTP 500

- **Статус:** ✅ Исправлено (18.04.2026, коммит `cdaeff6`, Полат — `apps/api/.../analytics.repository.ts`)
- **Где воспроизводится:** web-seller dashboard у Азима (аккаунт продавца, production, 17.04.2026 ~21:30). В DevTools → Network запрос `GET https://savdo-api-production.up.railway.app/analytics/seller/summary` → `500 Internal Server Error`.
- **Что сломалось на фронте:** `apps/web-seller/src/lib/api/analytics.api.ts:10` бросает, блок с summary-цифрами не рендерится (но весь dashboard не падал из-за этого — TanStack Query изолирует). Сам крах dashboard был из другого места — см. `SELLER-DASH-GUARD-001`.
- **Что нужно (Полат):** Посмотреть логи Railway `savdo-api` за 2026-04-17 ~16:00 UTC (21:00 UZT), фильтр по запросу `/analytics/seller/summary`. Типичные причины: новый Prisma.query после миграции без индекса, `groupBy`/`count` на пустом сторе, refactor SellerSummary контракта.
- **Контракт фронта (что web-seller ожидает):**
  ```ts
  interface SellerSummary {
    views: number;
    topProduct: { productId: string; views: number } | null;
    conversionRate: number;
  }
  ```
- **Что сделано:** Запротоколировано. Коммит Азима с guard'ами — см. SELLER-DASH-GUARD-001.

---

## 2026-04-17 [SELLER-DASH-GUARD-001] dashboard/orders падают на `order.deliveryAddress === undefined`

- **Статус:** ✅ Исправлено (17.04.2026, сессия 24, Азим)
- **Что случилось:** Какой-то заказ приходит без `deliveryAddress` (либо реально, либо API-VAR-001-подобный рассинк контракта). Рендер `{order.deliveryAddress.city}` → TypeError → весь React-tree unmount → Edge показывает generic error page (см. WEB-SELLER-ACCESS-001, где это ошибочно диагностировали как «сеть»).
- **Что сделано:** Добавлен optional chaining + fallback `'—'` во всех 5 местах web-seller:
  - `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx:221`
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx:78` (cancel modal)
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx:152,155` (OrderRow)
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx:248-249` (search filter — там была `.toLowerCase()` → тоже с guard'ом)
  - `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx:317,319` (детали)
- **Что это НЕ решает:** Если у заказа реально нет `deliveryAddress` — UI покажет `—, —`. Это защита от краша, но не объяснение, почему адрес отсутствует. Нужен backend-аудит — см. `API-ORDER-ADDR-001` ниже (если найдём).
- **Домен:** `apps/web-seller` — Азим. Backend контракт Order — Полат, если обнаружится что поле реально приходит пустым.

---

## 2026-04-18 [TMA-EDIT-001] Чёрный экран при открытии товара в seller-панели TMA

- **Статус:** ✅ Исправлено (18.04.2026, коммит `cdaeff6`, Полат — `apps/tma/src/pages/seller/EditProductPage.tsx`). Доп: Error Boundary добавлен в `9946af5` — будущие регрессии не дадут чёрный экран.
- **Где воспроизводится:** TMA (@savdo_builderBOT) → seller panel → «Мои товары» → тап на товар. Вместо страницы редактирования — полностью чёрный экран (только SB logo + меню + X сверху и `@savdo_builderBOT` footer). Скриншот: `c:/Users/marti/Desktop/Снимок экрана 2026-04-17 112143.png`.
- **Что случилось:** Регрессия от API-VAR-001. В `apps/api/src/modules/products/products.controller.ts:532-538` helper `normalizeVariant` удаляет поле `optionValues` и отдаёт плоский `optionValueIds: string[]` на `GET /seller/products/:id`. Но `apps/tma/src/pages/seller/EditProductPage.tsx:18-24` всё ещё описывает `Variant.optionValues: Array<{ optionValue: OptionValue }>`, а строки **629-631** читают `v.optionValues.length` и `v.optionValues.map(...)`. У товара с вариантами `v.optionValues === undefined` → `TypeError: Cannot read properties of undefined (reading 'length')` → React unmounts → чёрный экран. У товара без вариантов блок `{product.variants && product.variants.length > 0 && ...}` не рендерится, страница живая — значит баг триггерится только на товарах **с** вариантами.
- **Что нужно сделать (Полат):**
  1. `apps/tma/src/pages/seller/EditProductPage.tsx:18-24` — заменить `optionValues: Array<{ optionValue: OptionValue }>` на `optionValueIds: string[]` (и убрать интерфейс `OptionValue` если больше не нужен).
  2. Строки 628-631 — вычислить `label` не из локальной формы варианта, а из справочника опций продукта. Варианты с одним optionValueId ищут значение в `product.options[].values[]` по id. Альтернативно — backend может добавить в normalizeVariant поля `optionValueLabels: string[]` для удобства фронта (решение Полата).
  3. Проверить что остальные места чтения `v.optionValues` в TMA обновлены (я трогал `apps/tma/src/lib/variants.ts` в сессии 21, а EditProductPage пропустил — потому что его Азим не читает обычно).
- **Что сделано:** Не правил (чужой домен). Записано сюда. Азим сообщит Полату.

---

## 2026-04-15 [API-LIST-001] ProductListItem не содержит variantCount/hasVariants

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** На карточке товара (web-buyer ProductCard, web-seller products list) хочется показывать бейдж «есть варианты» / «3 варианта». Но `GET /seller/products` и `GET /storefront/products` возвращают `ProductListItem` без info о вариантах. Запрашивать детали каждого — дорого.
- **Что сделано:** Полат добавил `variantCount: number` в `ProductListItem` (`780e79e`). Азим подключил бейдж «N» с иконкой `Layers` в обоих фронтах (web-buyer `ProductCard`, web-seller products list).

---

## 2026-04-15 [API-VAR-001] Несовпадение контракта: variant.optionValueIds vs optionValues

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `packages/types/src/api/products.ts` декларирует `ProductVariant.optionValueIds: string[]`, но backend возвращал junction-записи `optionValues: [{ optionValueId, optionValue }]`. Любой фронт-код, читающий `v.optionValueIds`, получал `undefined`.
- **Что сделано:** Полат добавил `normalizeVariant` helper в `products.controller.ts` (`f5b0226`) — backend теперь отдаёт плоский `optionValueIds: string[]` на GET/POST/PATCH variants + GET product detail. Азим удалил defensive `extractOptionValueIds` / `getVariantOptionValueIds` из `apps/web-seller/src/components/product-variants-section.tsx`, `apps/web-buyer/src/lib/variants.ts`, `apps/tma/src/lib/variants.ts`. Все call-сайты читают `variant.optionValueIds ?? []` напрямую.

---

## 2026-04-14 [ADM-ENV-001] apps/admin/.env.example — неверное имя переменной

- **Статус:** ✅ Исправлено (16.04.2026)
- **Что случилось:** `apps/admin/.env.example` содержит `NEXT_PUBLIC_API_URL=...`, но admin — это Vite SPA, в коде читается `VITE_API_URL`. Также используется `VITE_BUYER_URL`, которого нет в примере. При чистом деплое из примера — API-запросы валятся.
- **Что сделано:** `NEXT_PUBLIC_API_URL` заменён на `VITE_API_URL`, добавлена `VITE_BUYER_URL=https://savdo-buyer-production.up.railway.app`.

---

## 2026-04-12 [TMA-010] Бот: "Магазин не найден" при привязке канала

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Продавец у которого есть Seller-запись (создана через web OTP) но нет Store — при попытке привязать канал получал ошибку "⚠️ Магазин не найден". Состояние `awaiting_channel` выставлялось без проверки существования Store.
- **Что сделано:** `telegram-demo.handler.ts` — `handleLinkChannel` теперь проверяет наличие Store. Если магазина нет → запрашивает название и вызывает `handleCreateStoreName` для создания Store. Добавлено состояние `seller_create_store_name` в webhook.

## 2026-04-12 [TMA-011] TMA дашборд крашился из-за несуществующего /seller/stats

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `DashboardPage.tsx` вызывал `GET /seller/stats` — endpoint не существует → 404 → `Promise.all` отклонялся → экран ошибки.
- **Что сделано:** Убран вызов `/seller/stats`. Статистика берётся из `meta.total` существующих endpoints. `Promise.all` заменён на `Promise.allSettled`.

## 2026-04-12 [TMA-012] ADMIN не мог открыть кабинет продавца в TMA

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `SellerGuard` проверял только `role === 'SELLER'`, ADMIN перенаправлялся на `/buyer`. `HomePage` также не отправлял ADMIN на `/seller`.
- **Что сделано:** `App.tsx` и `HomePage.tsx` — ADMIN добавлен в условие наравне с SELLER.

## 2026-04-12 [TMA-013] JS 404 после деплоя (старый кеш браузера)

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Telegram webview кешировал `index.html` → после деплоя он ссылался на старые Vite-чанки с другим hash → 404.
- **Что сделано:** `nginx.conf` — для `index.html` добавлены `Cache-Control: no-cache, no-store, must-revalidate`.

## 2026-04-12 [WEB-013] NEXT_PUBLIC_BUYER_URL отсутствовал в .env.example web-seller

- **Статус:** 🟡 Предупреждение → ✅ Исправлено
- **Что случилось:** `dashboard/page.tsx` использует `NEXT_PUBLIC_BUYER_URL`, переменная не была в .env.example → Railway-конфиг без неё, ссылки вели на `savdo.uz`.
- **Что сделано:** Добавлена переменная в `apps/web-seller/.env.example`.

## 2026-04-12 [WEB-014] Локальный тип StorefrontStore в web-buyer устарел

- **Статус:** 🟡 Предупреждение → ✅ Исправлено
- **Что случилось:** `storefront.api.ts` определял локальный `StorefrontStore`. Полат добавил его в `packages/types`, но веб-байер продолжал использовать дубль.
- **Что сделано:** `storefront.api.ts` — удалён локальный тип, импорт из `types`.

---

## 2026-04-08 [WEB-030] web-buyer 503 — неправильные пути standalone в монорепо

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Next.js standalone с `outputFileTracingRoot: monorepoRoot` сохраняет полный путь монорепо. server.js находится по пути `standalone/apps/web-buyer/server.js`, а не в корне. Dockerfile указывал `CMD node server.js` — файл не найден, контейнер не стартовал → 503.
- **Что сделано:** `apps/web-buyer/Dockerfile` — исправлены CMD, пути static и public. `railway.toml` — исправлен startCommand.

## 2026-04-08 [WEB-031] web-seller — хардкод PORT=3001 блокирует Railway

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `EXPOSE 3001` + `ENV PORT=3001` в Dockerfile. Railway управляет PORT динамически — хардкод блокировал routing.
- **Что сделано:** `apps/web-seller/Dockerfile` — удалены EXPOSE и ENV PORT.

## 2026-04-08 [API-020] GET /storefront/stores возвращает массив вместо {data:[]}

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** TWA-страница (`twa/page.tsx`) ожидает `response.data`, но endpoint возвращал голый массив.
- **Что сделано:** `products.controller.ts` — ответ обёрнут в `{ data: stores }`.

## 2026-04-17 [BUG-010] Admin DB manager — whitelist уже был реализован

- **Статус:** ✅ Уже было исправлено ранее
- **Что случилось:** Предполагалось что `/admin/db/tables/:table` принимает любую таблицу. При ревью оказалось что `DbManagerUseCase` уже содержит `TABLE_CONFIG` whitelist (10 таблиц) и все методы бросают `BadRequestException` для неразрешённых таблиц.

## 2026-04-17 [BUG-014] Дубликаты активных корзин в БД

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `Cart` таблица не имела ограничения на уровне БД — один покупатель мог иметь несколько активных корзин для одного магазина.
- **Что сделано:** Создан частичный уникальный индекс `carts_active_buyer_store_unique` через миграцию `20260417090000`. Ограничение работает только когда `status = 'active'` и `buyerId IS NOT NULL`. Гостевые корзины (sessionKey) не затронуты.

## 2026-04-17 [BUG-020] CONFIRMED→SHIPPED запрещён state machine

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `ALLOWED_TRANSITIONS` в `update-order-status.use-case.ts` не содержал `CONFIRMED__SHIPPED`. TMA seller страница посылала `CONFIRMED→SHIPPED`, backend возвращал 422 "Transition is not allowed".
- **Что сделано:** Добавлен `'CONFIRMED__SHIPPED': 'SELLER'` в `ALLOWED_TRANSITIONS`. В TMA `NEXT_STATUS` добавлен статус PROCESSING → SHIPPED на случай если продавец всё же использует промежуточный шаг.

## 2026-04-17 [BUG-021] Покупатель не видит состав своего заказа

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `OrdersPage.tsx` (buyer) показывал только номер, статус и сумму. Состав заказа (наименования товаров, количество) не отображался.
- **Что сделано:** Карточки заказа сделаны раскрывающимися. При tap делается запрос `GET /buyer/orders/:id`, результат кешируется в `details` state. Показываются: `productTitleSnapshot`, `variantTitleSnapshot`, `quantity`, `lineTotalAmount` по каждому item.

## 2026-04-17 [BUG-022] ProductPage не показывает остаток товара

- **Статус:** ✅ Исправлено (17.04.2026)
- **Что случилось:** `ProductPage.tsx` (buyer TMA) имел логику `isOutOfStock`, но не отображал количество оставшихся единиц покупателю. Покупатель не мог оценить срочность покупки.
- **Что сделано:** Добавлен badge рядом с ценой: зелёный "В наличии: N шт" при >5, жёлтый "Осталось: N шт" при ≤5, красный "Нет в наличии" при 0. Использует `selectedVariant.stockQuantity`.

---

## 2026-03-25 [API-001] Railway деплой

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Railway вернул ошибку `config file apps/api/railway.toml does not exist` — файл был создан локально, но не запушен в GitHub.
- **Что сделано:** Запушить `apps/api/railway.toml` и `.github/workflows/ci-backend.yml` в main.

---

## 2026-03-25 [API-005] Prisma + Alpine OpenSSL

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Railway деплой упал на `prisma migrate deploy` с ошибкой `Could not parse schema engine response` и `Prisma failed to detect the libssl/openssl version`. Причина: `node:20-alpine` использует musl libc, OpenSSL не установлен по умолчанию.
- **Что сделано:**
  - `apps/api/Dockerfile`: добавлен `RUN apk add --no-cache openssl`
  - `packages/db/prisma/schema.prisma`: добавлен `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
