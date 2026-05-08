# Done — Азим + Полат

## 2026-05-08 (Азим) — Аудит web-buyer 05.05: 6 minor

### ✅ [BUG-WB-AUDIT-020] IcoSend hardcoded `stroke="white"` 🟢

- **Файл:** `apps/web-buyer/src/components/icons.tsx:10`
- **Что сделано:** `stroke="white"` → `stroke="currentColor"`. Иконка теперь видна на любом фоне (раньше на white-кнопке была невидимой).

### ✅ [BUG-WB-AUDIT-021] cart sticky CTA `z-30` < BottomNav `z-50` 🟢

- **Файл:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx:493`
- **Что сделано:** `z-30` → `z-[51]`. Кнопка «Оформить заказ» теперь над BottomNavBar (как orders/[id] sticky CTA, fix BUG-006).

### ✅ [BUG-WB-AUDIT-022] `normalizeOrder` — id/orderNumber/storeId без fallback 🟢

- **Файл:** `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:58`
- **Что сделано:** добавлены `?? ''` fallback на `id`, `orderNumber`, `storeId`. `shortId(undefined).slice` больше не упадёт TypeError если backend пришлёт неполный объект.

### ✅ [BUG-WB-AUDIT-023] Timeline PROCESSING == CONFIRMED 🟢

- **Файл:** `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:101-114`
- **Что сделано:** добавил `PROCESSING` отдельным шагом в `TIMELINE` («Сборка заказа») между `CONFIRMED` и `SHIPPED`. `STATUS_INDEX` сдвинут (PENDING=0, CONFIRMED=1, PROCESSING=2, SHIPPED=3, DELIVERED=4). Когда заказ в статусе PROCESSING, теперь подсвечивается свой шаг, а не CONFIRMED.

### ✅ [BUG-WB-AUDIT-024] product detail clipboard без catch 🟢

- **Файл:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx:108-117`
- **Что сделано:** `navigator.clipboard.writeText(...).then(...)` теперь имеет `.catch(() => {})`. На HTTP / Telegram WebView без permissions clipboard кидает DOMException — раньше получали unhandled rejection. Шаринг — best-effort, тихий fallback ОК.

### ✅ [BUG-WB-AUDIT-025] RecentStores `<button>` внутри `<Link>` 🟢

- **Файл:** `apps/web-buyer/src/components/home/RecentStores.tsx`
- **Что сделано:** переписана структура: `<div class="relative">` контейнер, внутри `<Link>` (визуальная карточка) и `<button>` (remove) — теперь sibling'и, не вложены. Невалидный HTML устранён, tab-навигация и AT работают корректно.

### 🟢 Принято как negligible

- **BUG-WB-AUDIT-026** (`bucketFor` без обновления при смене суток): audit сам предложил «или принять как negligible». Edge-case при mount > 24 часов; пользователи на нормальных мобильных сессиях этим не задеты.

---

## 2026-05-08 (Азим) — Аудит web-buyer 05.05: 8 major + role-guard

### ✅ [BUG-WB-AUDIT-008] orders/page.tsx — `accOrders` race при смене фильтра 🟡

- **Файл:** `apps/web-buyer/src/app/(shop)/orders/page.tsx`
- **Что сделано:** при смене `activeFilter` теперь явно `setPage(1) + setAccOrders([])` через отдельный useEffect. Раньше TanStack-stale data могла перезаписать accOrders заказами от старого фильтра.

### ✅ [BUG-WB-AUDIT-010] checkout — мигание OTP-gate при гидрации 🟡

- **Файл:** `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** `pageStep` инициализируется через lazy `useState(() => ...)` — читает `localStorage.savdo_access_token` и сразу выставляет `'form'` если токен есть. Раньше первый paint у залогиненного давал OTP-форму на 1 frame пока `useAuth` не догонит.

### ✅ [BUG-WB-AUDIT-011] ThemeProvider — flash иконки ThemeToggle 🟡

- **Файл:** `apps/web-buyer/src/lib/theme/theme-provider.tsx`
- **Что сделано:** `useState<Theme>(() => readStored(defaultTheme))` lazy init вместо useEffect post-hydration sync. ThemeToggle теперь сразу рендерит правильную иконку.

### ✅ [BUG-WB-AUDIT-012] BottomNavBar — `last_store_slug` мёртвый ключ 🟡

- **Файлы:** `apps/web-buyer/src/components/layout/BottomNavBar.tsx`
- **Что сделано:** заменил чтение неиспользуемого `localStorage.last_store_slug` на `getRecentStores()[0]?.slug` из `lib/recent-stores.ts` — `RegisterRecentStore` пишет туда при visit'е витрины, теперь «Магазин» таб ведёт на последний посещённый магазин.

### ✅ [BUG-WB-AUDIT-013] AuthContext — cross-tab token desync 🟡

- **Файл:** `apps/web-buyer/src/lib/auth/context.tsx`
- **Что сделано:** добавлен `window.addEventListener('storage', ...)` listener — когда другая вкладка чистит `savdo_access_token`, эта тоже делает `localLogout()`, вместо ожидания первого 401 на следующей операции.

### ✅ [BUG-WB-AUDIT-014] notifications — `readAll.mutate()` на каждый mount 🟡

- **Файл:** `apps/web-buyer/src/app/(shop)/notifications/page.tsx`
- **Что сделано:** добавлены guards — `!isLoading && !readAll.isPending && unreadItems.length > 0`. Раньше Strict Mode + back/forward cache трижды дёргали `POST /notifications/read-all` даже при 0 unread.

### ✅ [BUG-WB-AUDIT-017] storefront `[slug]/page.tsx` — двойной fetch storeBySlug 🟡

- **Файл:** `apps/web-buyer/src/app/(shop)/[slug]/page.tsx`
- **Что сделано:** обернул `serverGetStoreBySlug` в `react.cache()` — `generateMetadata` и `StorePage` теперь делят один fetch вместо двух одинаковых HTTP-запросов на каждый SSR.

### ✅ [BUG-WB-AUDIT-019] notifications — `BottomNavBar active="profile"` 🟡

- **Файлы:**
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — `NavActive` тип расширен значением `'notifications'`, prop `active` теперь optional.
  - `apps/web-buyer/src/app/(shop)/notifications/page.tsx` — `<BottomNavBar active="notifications" />` (раньше «profile», подсвечивая чужой таб).

### 🟢 Skipped — обоснованные не-фиксы

- **BUG-WB-AUDIT-015** (chats menuRef shared): реального race нет — одновременно открыто только одно меню (`openMenuId === m.id`), useEffect listener пере-вешивается на каждое открытие через `[openMenuId]` deps. Рефактор row → отдельный компонент ради edge-case не оправдан.
- **BUG-WB-AUDIT-016** (OtpGate `purpose: 'checkout'`): `purpose='checkout'` в backend `verify-otp.use-case.ts` создаёт BUYER, любое другое значение — SELLER (см. CLAUDE.md WEB-010). Default 'checkout' — единственный безопасный вариант для buyer-страниц. Менять = регрессия [WEB-010] на /chats /wishlist /profile.
- **BUG-WB-AUDIT-018** (ProductCard `as unknown as` cast): API на `GET /storefront/products` отдаёт `images: [{url}]` (products.controller.ts:774,793), а тип `ProductListItem` в packages/types говорит `mediaUrls: string[]`. Cast — defensive layer пока контракт не выровнен. Тикет для Полата: согласовать ProductListItem shape с реальным storefront response.

---

## 2026-05-08 (Азим) — Аудит web-buyer 05.05: 7 critical + 3 P1 от Полата

### ✅ [BUG-WB-AUDIT-001] `useCart` без `enabled: isAuthenticated` → 401-loop для гостя 🔴

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-buyer/src/hooks/use-cart.ts` — добавлен `opts?: { enabled?: boolean }` параметр (default true).
  - `apps/web-buyer/src/components/layout/Header.tsx` — `useCart({ enabled: isAuthenticated })`.
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — то же.
- **Что сделано:** на каждый рендер Header/BottomNavBar для гостя `useCart` стрелял на `/cart`, при 401 refresh-interceptor тащил `null`-токен → `savdo:auth:expired` → `localLogout` + `queryClient.clear` цикл. Эндпойнт под `OptionalJwtAuthGuard`, так что в современном бэке 401 не приходит, но `enabled` guard убирает race и SSR-холостые запросы. Cart/Checkout страницы под OtpGate — у них `enabled` дефолт `true`, поведение не меняется.

### ✅ [BUG-WB-AUDIT-002] `useBuyerSocket` cleanup не emit'ит `leave-buyer-room` 🔴
### ✅ [BUG-WB-AUDIT-003] `useChatSocket` cleanup не emit'ит `leave-chat-room` 🔴

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-buyer/src/hooks/use-buyer-socket.ts` — в cleanup `socket.emit('leave-buyer-room', { buyerId })` если `socket.connected`.
  - `apps/web-buyer/src/hooks/use-chat.ts` — то же для `leave-chat-room`.
  - `apps/web-buyer/src/lib/auth/context.tsx` — `destroySocket()` в `localLogout` и `logout` (полный cleanup при logout/expired-cycle).
- **Что сделано:** при logout/смене юзера сервер продолжал слать `order:status_changed`/`chat:new_message` в комнату экс-пользователя. Аналогично переключение чатов накапливало активные комнаты на сервере. Теперь явный leave-emit + destroySocket() при logout.

### ✅ [BUG-WB-AUDIT-004] `useOrders` без `enabled` → 401 при гонке 🔴

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-buyer/src/hooks/use-orders.ts` — в `useOrders` добавлен опциональный `enabled` параметр (через destructure из params, чтобы не попасть в queryKey).
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx` — `useOrders({ page: 1, limit: 1, enabled: isAuthenticated })`.
- **Что сделано:** в Strict Mode / token-refresh race profile показывал «0 заказов» на 1 frame пока `useAuth` не догонял. `enabled` guard блокирует фетч до подтверждённой авторизации.

### ✅ [BUG-WB-AUDIT-005] `chats handleSend` — unhandled rejection + потеря текста 🔴

- **Дата:** 08.05.2026
- **Файл:** `apps/web-buyer/src/app/(shop)/chats/page.tsx` — `handleSend` обернут в try/catch с `setText(trimmed)` восстановлением при ошибке. Раньше текст очищался до `mutateAsync` — при сетевом сбое юзер терял сообщение без возможности повтора.

### ✅ [BUG-WB-AUDIT-006] orders/[id] sticky CTA bar перекрыт BottomNavBar (z-index) 🔴

- **Дата:** 08.05.2026
- **Файл:** `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:425` — `zIndex: 50 → 51`. Sticky CTA «Чат по заказу» / «Отменить» теперь всегда поверх BottomNavBar (z-50).

### ✅ [BUG-WB-AUDIT-007] Product detail useEffect deps mismatch → race на стейле variants 🔴

- **Дата:** 08.05.2026
- **Файл:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx:148-167`. useEffect инициализации selection переписан так, чтобы при смене `product.id` гарантированно сбрасывать `selection` и `selectedVariantId` в актуальные значения. Раньше после back/forward с TanStack-кэша и других переходов остаточный state мог соответствовать предыдущему продукту.

### ✅ [BUG-WB-AUDIT-009-FE] checkout не передавал `customerFullName`/`customerPhone` 🟡

- **Дата:** 08.05.2026
- **Файлы:**
  - `packages/types/src/api/cart.ts` — `CheckoutConfirmRequest` расширен опциональными `customerFullName`/`customerPhone` (контракт-патч после `1f2f486` Полата, который добавил поля в DTO но не в types).
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — `handleConfirm` теперь передаёт trimmed contact-fields в `confirm.mutateAsync`. Backend (`confirm-checkout.use-case.ts:212`) делает `input.customerFullName?.trim() || profileFullName` — overrides поверх Buyer-профиля, fallback на User.phone когда оба пусты.

### ✅ [WEB-SELLER-HARDCODED-DOMAIN-001] 🟠

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-seller/src/lib/buyer-url.ts` (новый) — `buyerOrigin()`/`buyerStoreUrl(slug)`/`buyerStoreDisplay(slug)` читают `process.env.NEXT_PUBLIC_BUYER_URL` с fallback на `https://savdo.uz`.
  - `apps/web-seller/src/app/(dashboard)/layout.tsx:127,236` — sidebar label + clipboard заменены на helper.
  - `apps/web-seller/src/app/(dashboard)/profile/page.tsx:49` — `storeUrl` через helper.
- **Что сделано:** до этого 3 места хардкодили `https://savdo.uz/${slug}` — на dev/staging юзеры видели/копировали мёртвую прод-ссылку. Теперь dev = `localhost:3001/slug`, prod = `savdo.uz/slug`.

### ✅ [WEB-BUYER-IMAGE-FALLBACK-001] товары без фото на витрине показывали пустой квадрат 🟠

- **Дата:** 08.05.2026
- **Файл:** `apps/web-buyer/src/components/store/ProductCard.tsx`
  - `mediaUrls` теперь `.filter(Boolean)` — пустые `images[].url` или `mediaUrls[]` элементы режутся.
  - Placeholder при `mediaUrls.length === 0` теперь — иконка ShoppingBag + текст «Без фото» (вместо одинокой иконки на тёмном surfaceSunken-квадрате).

### 🟢 [WEB-BUYER-LINK-PRETTIFY-001] no-op после проверки

- **Дата:** 08.05.2026
- **Что сделано:** grep по `web-buyer/src` подтвердил: длинных railway URL в UI нет. `app/layout.tsx:16` уже на `process.env.NEXT_PUBLIC_BUYER_URL || 'https://savdo.uz'`. `app/(shop)/page.tsx:94,116` — короткий label `savdo.uz/` как фасад на homepage (не URL). Закрываю задачу без изменений.

### ⚠️ Заметка для Полата

`packages/types/src/api/cart.ts CheckoutConfirmRequest` дополнен мной — Полат добавил `customerFullName`/`customerPhone` в `confirm-checkout.dto.ts` (`1f2f486`), но `packages/types` не обновил, что блокировало мой фронт-фикс BUG-WB-AUDIT-009. Сверь, что определение совпадает с DTO (200ch / 20ch length).

---

## 2026-05-06 (Полат) — DB-AUDIT-001: schema drift + missing indexes

### ✅ [DB-AUDIT-001] Schema drift fix + 2 hot-path индекса 🔴

- **Дата:** 06.05.2026
- **Файлы:**
  - `packages/db/prisma/schema.prisma` — `AdminUser` дополнен полями `adminRole/mfaSecret/mfaEnabled/mfaEnabledAt/lastLoginAt/lastLoginIp` (всё уже было в DB через migration 20260503020000); добавлена модель `OrderRefund` с relations на Order + AdminUser; `@@index([adminRole])` на admin_users; `@@index([bucket])` на media_files; `@@index([status])` на chat_threads.
  - `packages/db/prisma/migrations/20260506200000_db_audit_indexes/migration.sql` — CREATE INDEX IF NOT EXISTS для `media_files.bucket` и `chat_threads.status`.
- **Что найдено:** код в `admin-auth.use-case`, `mfa-enforced.guard`, `admin-permission.guard`, `admin.repository`, refund use-case использовал `(prisma as any).adminUser/.orderRefund` потому что schema.prisma не отражал реальную DB. Schema drift — следующий `prisma generate` мог бы поломать типы.
- **Что сделано:** поля и модели приведены к актуальному состоянию DB. Запущен `pnpm --filter db generate`. Typecheck `apps/api` чист.
- **Что не тронуто (отдельный тикет если понадобится):** `pg_trgm` GIN на `Product.title` для full-text search — требует extension + raw SQL миграции.

## 2026-05-06 (Полат) — RBAC micro-permissions на admin endpoints

### ✅ [API-RBAC-MICRO-PERMISSIONS-001] Endpoint-level разрешения для admin-ролей 🟠

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/api/src/common/constants/admin-permissions.ts` — `ADMIN_PERMISSIONS` matrix + `hasAdminPermission()` wildcard-helper + `getAdminPermissions()`. Вынесено из `admin-auth.use-case.ts` в shared.
  - `apps/api/src/common/decorators/admin-permission.decorator.ts` — `@AdminPermission('user:suspend')`
  - `apps/api/src/common/guards/admin-permission.guard.ts` — гард читает metadata, проверяет роль из `JwtPayload.adminRole` (с DB fallback для legacy JWT).
  - `apps/api/src/common/decorators/current-user.decorator.ts` — `JwtPayload.adminRole?: string`
  - `apps/api/src/modules/auth/repositories/auth.repository.ts` — `findAdminClaims()` возвращает `{ mfaEnabled, adminRole }` одним lookup.
  - `apps/api/src/modules/auth/use-cases/{verify-otp,telegram-auth,refresh-session}.use-case.ts` — выставляют `adminRole` в JWT.
  - `apps/api/src/modules/admin/use-cases/admin-auth.use-case.ts` — refactor на shared constants + `mfaChallenge` сохраняет `adminRole`.
  - `apps/api/src/modules/admin/admin.controller.ts` — `AdminPermissionGuard` в @UseGuards + `@AdminPermission()` на 17 destructive endpoints.
  - `apps/api/src/modules/admin/super-admin.controller.ts` — то же + 8 endpoints (impersonate, refund, admin CRUD, verify-extended, activate-seller).
- **Что сделано:** до этого matrix существовала в `admin-auth.use-case.ts` но проверялась только в одном месте (impersonate). Все остальные admin endpoints не проверяли пер-permission — `support` или `read_only` могли вызвать destructive endpoints. Теперь — endpoint-level enforcement через `@AdminPermission`.
- **Wildcard семантика:** `*` (все), `user:*` (все над user), `*:read` (read любого).
- **Permissions per role:** `super_admin: ['*']`, `admin` (все кроме `admin:*` mgmt), `moderator` (только moderation + read), `support` (read + cancel order), `finance` (orders + refunds), `read_only` (`*:read`).
- **Покрытие:** 23 destructive endpoints получили `@AdminPermission`. List/read endpoints не размечены — fallback на `@Roles('ADMIN')` (любой admin читает). При необходимости — добавить ярлыки в follow-up.

## 2026-05-06 (Полат) — MFA enforcement на admin endpoints

### ✅ [API-MFA-NOT-ENFORCED-001] Real MFA gating через mfaPending JWT 🔴

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/api/src/common/decorators/current-user.decorator.ts` — `JwtPayload.mfaPending?: boolean`
  - `apps/api/src/common/decorators/skip-mfa.decorator.ts` — `@SkipMfaCheck()` decorator + SKIP_MFA_KEY metadata
  - `apps/api/src/common/guards/mfa-enforced.guard.ts` — guard, бросает 403 `MFA_REQUIRED` если `user.mfaPending===true`
  - `apps/api/src/modules/auth/repositories/auth.repository.ts` — `isAdminMfaEnabled(userId)` lookup
  - `apps/api/src/modules/auth/use-cases/{verify-otp,telegram-auth,refresh-session}.use-case.ts` — выставляют `mfaPending` для ADMIN с включённым MFA при login и refresh
  - `apps/api/src/modules/admin/use-cases/admin-auth.use-case.ts` — новый метод `mfaChallenge(userId, code, sessionId, role)` re-issues JWT без mfaPending
  - `apps/api/src/modules/admin/super-admin.controller.ts` — `POST /admin/auth/mfa/login` + `@SkipMfaCheck()` на `auth/me`, `auth/mfa/setup/verify/disable/login`
  - `apps/api/src/modules/admin/admin.controller.ts`, `chat.controller.ts`, `moderation/moderation.controller.ts`, `super-admin.controller.ts` — `MfaEnforcedGuard` в `@UseGuards`
  - `apps/api/src/shared/constants/error-codes.ts` — `MFA_REQUIRED`, `MFA_INVALID`
- **Что сделано:** до этого MFA TOTP setup/verify/disable работали, но НИ ОДИН admin endpoint не проверял `mfaVerified`. Стащенный admin JWT обходил MFA полностью.
  - При login с включённым MFA → JWT с `mfaPending: true`
  - `MfaEnforcedGuard` бросает 403 с кодом `MFA_REQUIRED` на любой admin endpoint
  - `@SkipMfaCheck()` на 5 challenge endpoints (`auth/me`, `auth/mfa/{setup,verify,disable,login}`)
  - `POST /admin/auth/mfa/login` с TOTP-кодом → re-issued JWT (тот же sessionId, без mfaPending) → полный доступ
  - На refresh — ВСЕГДА перепроверяется MFA (защита от стащенного refresh token)
- **Что осталось (low priority):** `categories.controller`, `analytics.controller`, `media.controller` имеют отдельные admin endpoints (read-only/seller-managed), туда MFA guard не применён — они per-endpoint @UseGuards вместо class-level. Отдельный тикет если понадобится: `API-MFA-COVERAGE-EXTRA-001`.

## 2026-05-06 (Полат) — WS audit + закрытие дыры в OrdersGateway

### ✅ [API-WS-AUDIT-001 / SEC-WS-002] Hardening join-seller-room 🔴

- **Дата:** 06.05.2026
- **Файл:** `apps/api/src/socket/orders.gateway.ts`
- **Что найдено:** в `handleJoinSellerRoom` проверка `if (user.storeId && user.storeId !== data.storeId)` пропускала SELLER'ов БЕЗ `storeId` в JWT в любую seller-room. Это leak: чужие `order:new`, `order:status_changed`, `chat:new_message` events.
- **Что сделано:** обработчик стал async, добавлен fallback на DB-lookup `seller.findUnique().store.id` для проверки владения когда JWT.storeId отсутствует. Добавлена валидация типа `data.storeId` (string). Аналогично — `handleJoinBuyerRoom` теперь валидирует `data.buyerId`.
- **Что НЕ найдено в ChatGateway:** уже OK — JWT verify + DB-проверка участия треда + anti-spoof через `client.rooms.has(room)` для typing.

## 2026-05-06 (Полат) — Super-admin: ручная активация продавца на рынке

### ✅ [API-MANUAL-SELLER-ACTIVATION-001] One-click активация продавца 🟡

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/activate-seller-on-market.use-case.ts` — новый use-case, композирует AdminCreateSellerUseCase + AdminCreateStoreUseCase + ApproveStoreUseCase + единая audit-запись.
  - `apps/api/src/modules/admin/super-admin.controller.ts` — endpoint `POST /admin/users/:id/activate-seller-on-market` с валидацией обязательных полей.
  - `apps/api/src/modules/admin/admin.module.ts` — регистрация use-case в providers.
- **Что сделано:** до этого активация продавца требовала 3 раздельных API-вызова (make-seller → create-store → approve). Теперь — один endpoint. Audit log: `seller.activated_on_market`.
- **Контекст:** решение Полата 06.05.2026 — монетизация заморожена до открытия бизнес-счёта в Click/Payme. Продавцы пишут в @savdo_builderBOT/админу → админ через super-admin одним кликом открывает доступ к общему рынку.
- **TODO frontend:** `ADMIN-MANUAL-ACTIVATION-UI-001` — кнопка + модалка в admin-панели.

## 2026-05-06 (Полат) — TMA: skeletons на 4 страницах

### ✅ [TMA-LOADING-SKELETONS-001 / частично] Skeleton вместо Spinner 🟡

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/tma/src/pages/buyer/WishlistPage.tsx` — grid из 8 ProductCardSkeleton с тем же `cols` что финальная сетка.
  - `apps/tma/src/pages/buyer/ProductPage.tsx` — фото-плейсхолдер + title/price/description/cta lines.
  - `apps/tma/src/pages/seller/ProductsPage.tsx` — grid 8 ProductCardSkeleton (на mobile — flex column 4 строк).
  - `apps/tma/src/pages/seller/SettingsPage.tsx` — 2 GlassCard с input/button плейсхолдерами.
- **Что сделано:** заменён `<Spinner />` на layout-aware skeleton. Юзер видит структуру страницы во время загрузки → меньше perceived latency.
- **Что осталось (в backlog):** CartPage, CheckoutPage, OrdersPage buyer (list level), ProfilePage buyer/seller, StoresPage, AddProductPage, DashboardPage seller (последняя — параллельная сессия).

## 2026-05-06 (Полат) — TMA: showToast на silent error catches

### ✅ [TMA-SILENT-ERROR-CATCHES-001] showToast на user-facing data-load fails 🟡

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/tma/src/pages/buyer/WishlistPage.tsx` — wishlist load fail.
  - `apps/tma/src/pages/buyer/OrdersPage.tsx` — loadMore orders + order detail expand.
  - `apps/tma/src/pages/seller/ProfilePage.tsx` — store load fail.
  - `apps/tma/src/pages/seller/SettingsPage.tsx` — seller profile load fail.
- **Что сделано:** заменены `.catch(() => {})` на `.catch((err) => { if AbortError return; showToast(..., 'error') })`. Раньше юзер видел пустой UI без понимания почему — теперь явный toast.
- **Что НЕ тронуто (намеренно):** clipboard.writeText (best-effort, юзер увидит результат сам), prefetch (фоновое), attribute create/delete (некритичные side-effects).

## 2026-05-06 (Полат) — TMA: ConfirmModal вместо window.confirm/alert

### ✅ [TMA-NATIVE-CONFIRM-001] Custom ConfirmModal 🟠

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/tma/src/components/ui/ConfirmModal.tsx` — новый. Imperative API `confirmDialog(opts) → Promise<boolean>`. ESC/Enter, backdrop close, autoFocus на Confirm, `danger` flag для красной кнопки. Тот же паттерн что у `showToast` — глобальный `CustomEvent`.
  - `apps/tma/src/components/layout/AppShell.tsx` — `<ConfirmContainer />` замонтирован глобально.
  - `apps/tma/src/pages/seller/ProductsPage.tsx` — 3 замены: archive confirm, delete confirm + danger=true, archive/delete error alert → showToast.
  - `apps/tma/src/pages/seller/StorePage.tsx` — 1 замена: deleteCategory confirm + danger=true.
- **Что сделано:** все 5 `window.confirm/alert` устранены — на desktop Telegram WebApp нативные popup'ы не работают (нет popup window.open), теперь UI согласован.
- **Также:** баги «нативный диалог сломал юзеру весь WebApp» больше не воспроизводятся.

## 2026-05-06 (Полат) — Media migration: TG → Supabase

### ✅ [API-MEDIA-MIGRATION-TG-TO-R2-001] Перенос старых TG-фото в Supabase 🔴

- **Дата:** 06.05.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/migrate-tg-media-to-r2.use-case.ts` — новый use-case. Идёт по `MediaFile WHERE bucket='telegram'` батчами, тянет через `getFileUrl` + axios arraybuffer, грузит в Supabase через `uploadObject`, обновляет `bucket+objectKey+fileSize`. 404 от TG (file expired) → `bucket='telegram-expired'` (схема не имеет `deletedAt`, поэтому маркируем bucket — повторные прогоны их пропустят и proxy перестанет дёргать мёртвый file_id). Возвращает `{ migrated, skipped, failed, errors[] }`.
  - `apps/api/src/modules/admin/admin.module.ts` — `MediaModule` в `imports`, `MigrateTgMediaToR2UseCase` в `providers`.
  - `apps/api/src/modules/admin/admin.controller.ts` — endpoint `POST /admin/media/migrate-tg-to-r2?limit=50` (admin only, audit log).
- **Что сделано:** запускается админом через UI/curl батчами по `limit` (default 50, max 200) — чтобы Railway не таймаутил. Идемпотентен: при повторном прогоне уже мигрированные строки (`bucket=<supabase-bucket>`) и expired (`bucket='telegram-expired'`) фильтруются.
- **Контекст:** до настройки `STORAGE_REGION=ap-southeast-1` upload падал в TG fallback. file_id Telegram держит ~1ч → после этого `getFile` возвращает 404 и на web-buyer пустые квадраты.



### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 10] Profile / Wishlist / Notifications redesign 🔴

- **Дата:** 05.05.2026
- **Commit:** `0ba9561`
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx` — borderless user card с brand-fill avatar, Stats row 3-col (Заказов / В избранном / Корзина-link) на 1px-divider grid, editorial section label «— Активность», MenuRow компонент (brandMuted icon + label + sub + chevron) для Заказы/Избранное/Уведомления, outline-danger logout с confirm-card. `useOrders({page:1,limit:1})` + `useWishlist()` для best-effort counts. `accent*` → `brand*`, `rounded-2xl` → `rounded-md`, `textPrimary` → `textStrong`. Avatar upload, logout, OtpGate сохранены.
  - `apps/web-buyer/src/app/(shop)/wishlist/page.tsx` — editorial sub-header «— Избранное · {count}», borderless card grid 2/4 cols (как ProductCard в Task 4), rounded-md image + ♡ overlay 32px (filled brand для удаления), store eyebrow + title в textBody, цена в textStrong, OOS overlay (white 78% + pill), editorial empty state «— Пока пусто» + brand CTA. Hover scale-105 image zoom. `useWishlist`/`useToggleWishlist` сохранены.
  - `apps/web-buyer/src/app/(shop)/notifications/page.tsx` — borderless rows с background brandMuted на unread / surface на read, brand dot 8px справа для unread, brand-tinted icon container surfaceSunken, editorial group labels по дате (Сегодня/Вчера/Прошлая неделя/Ранее), filter chips с textStrong fill активного, header c brandMuted «Прочитать все», editorial empty state + auth gate. `useNotifications`/`useReadAll`/`router.push('/orders/{id}')` сохранены.
- **🎉 ИТОГ:** Все 10 задач Soft Color Lifestyle implementation plan'а закрыты. Web-buyer полностью переведён на тёплую terracotta-палитру с editorial labels, brand-color CTAs, borderless минимализмом и dark-fill активными элементами.
- **Push:** main → Railway autodeploy; merged → `web-buyer`

## 2026-05-05 (сессия 52, Азим) — Task 3: homepage + RecentStores polish

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 3] Homepage + RecentStores polish 🟡

- **Дата:** 05.05.2026
- **Commit:** `b2884bb`
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/page.tsx` — Logo container `rounded-3xl` → `rounded-2xl`, slug-card `rounded-2xl` → `rounded-lg` (8px), inner row `rounded-xl` → `rounded-md`, «Перейти в магазин» → editorial label «— Перейти в магазин», quick links `rounded-2xl` → `rounded-md` + brandMuted icon container без border + tighter spacing (gap-3, w-10 h-10, size 18), CTA button `rounded-md` + font-bold для consistency с Tasks 4-9.
  - `apps/web-buyer/src/components/home/RecentStores.tsx` — borderless карточки (per spec), убран background+border контейнера, avatar 48px → 56px, без brandBorder (минималистично), remove button hidden by default + on group-hover.
- **Что не сделано (намеренно):** Storefront `(shop)/[slug]/page.tsx` уже полностью под новый дизайн — hero 6fr:4fr photo+brand-color split, editorial labels (— Магазин · {city} / — По категориям / — Товары · {N}), categories chip-row с textStrong fill активного, brand-color column со всеми правильными tokens. Никаких правок не потребовалось.
- **Push:** main → Railway autodeploy; merged → `web-buyer`

## 2026-05-05 (сессия 52, Азим) — Task 2: Header/Nav refinements

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 2] Header + BottomNavBar refinements 🟢

- **Дата:** 05.05.2026
- **Commit:** `654f067`
- **Файлы:** `apps/web-buyer/src/components/layout/Header.tsx`, `apps/web-buyer/src/components/theme-toggle.tsx`
- **Что сделано:** Header и BottomNavBar уже использовали canonical brand-tokens после Task 1 alias-миграции (`colors.brand`, `colors.brandTextOnBg`, `colors.textBody`, `colors.divider`, `colors.surface*` — никаких `accent*` ссылок не осталось). Финальные правки: Header padding `py-3` → `py-3.5` (12→14px vertical, per spec). ThemeToggle MenuItem — `accent*` → `brand*` rename для консистентности (CSS-var alias, no-op runtime). BottomNavBar — без изменений.
- **Push:** main → Railway autodeploy; merged → `web-buyer`

## 2026-05-05 (сессия 52, Азим) — Task 9: Orders list + detail redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 9] Orders redesign — list rows + status hero + timeline 🔴

- **Дата:** 05.05.2026
- **Commit:** `c117723`
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx` — borderless rows на `surface`, `StatusPill` компонент с tone-mapping (`success`/`brand`/`warning`/`muted`); filter tabs: активный = `textStrong` fill + `brandTextOnBg`, неактивный = surface+border+textBody; editorial empty states «— Пусто» + brand CTA «К магазинам»; order номер: `orderNumber ?? shortId(id)`; meta `{count} товаров · {date}`; total в `textStrong`; search input refactored под палитру; load-more кнопка обновлена.
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — Status hero (brand background) с editorial label «— Статус», заголовок status, ETA текст; на cancelled — `surfaceSunken` muted hero без timeline; vertical Timeline с 4 шагами (Заказ→Подтверждён→В пути→Доставлен), brand dots+connectors для completed/current, divider для upcoming; flat секции (Магазин с brand-avatar / Товары editorial / Доставка с MapPin / Итого с dashed total) разделены 1px dividers; sticky CTA bar — brand «Чат по заказу» (или «К магазинам» если cancelled) + outline Telegram + outline danger «Отменить» с inline confirm-card; cancel/chat/track/normalizeOrder/useBuyerSocket/ChatComposerModal сохранены; цены в `textStrong` (brand зарезервирован для status hero/CTA/links).
- **Что не сделано (намеренно):**
  - Per-step timestamps в timeline — API не отдаёт history of status changes, только createdAt/updatedAt; пропущено.
  - «Помощь» / «Повторить заказ» CTA из спеки — оставлен только «Чат по заказу» + Telegram fallback (повторение заказа requires reorder mutation которой нет; помощь сейчас = тот же чат).
- **Push:** main → Railway autodeploy; merged → `web-buyer` ветка
- **Smoke:** проверить на Railway URL `/orders` (rows + filter + empty) → клик на order → детальная страница (status hero + timeline + items + total + sticky CTA).

## 2026-05-05 (сессия 51, Азим) — Task 8: Chat list + thread + composer modal redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 8] Chat redesign — brand avatars, search, filter chips, bubble tails 🔴

- **Дата:** 05.05.2026
- **Commit:** `7ed9eb2`
- **Файлы:** `apps/web-buyer/src/app/(shop)/chats/page.tsx`, `apps/web-buyer/src/components/chat/ChatComposerModal.tsx`
- **Что сделано:** ThreadItem — brand-color initial avatar (fallback `colors.brand`), unread row highlight (`brandMuted`), unread badge (brand fill), bold title. Search input над list panel. Filter chips «Все · N» / «Непрочитанные · N» — textStrong fill when active. Thread header: brand-color avatar + store name + status text + trash. Message bubbles: buyer `borderRadius: 14px 14px 4px 14px` brand fill + `brandTextOnBg`; seller `borderRadius: 14px 14px 14px 4px` surface + divider border. Day dividers (Сегодня/Вчера/дата). Composer: pill input `surfaceMuted` + brand circular send button. `pinnedProduct` поле отсутствует в `ChatThread` — блок пропущен. `brandColor` поля нет в типе — везде fallback `colors.brand`. ChatComposerModal: backdrop `rgba(15,17,21,0.5)`, panel `colors.surface`, `rounded-lg`, textarea `border + colors.border`, cancel text-only `textMuted`, submit `brand/brandTextOnBg`. Все hooks/socket/auth/routing сохранены. accent* → brand* во всех местах.
- **Push:** main → Railway autodeploy; merged → `web-buyer`

## 2026-05-05 (сессия 50, Азим) — Task 7: Checkout page redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 7] Checkout 3-step single-screen redesign 🔴

- **Дата:** 05.05.2026
- **Commit:** `e20a1c2`
- **Файлы:** `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** CheckoutStep card компонент (numbered brand circle + action link). Step 1 «Контакты» — pre-filled из user; «Изменить»/«Готово» toggle показывает name+phone inputs. Step 2 «Доставка» — delivery/pickup toggle (brand-active) внутри шага; при delivery — два text-поля Улица+Город; при pickup — карточка «уточнить у продавца». Step 3 «Оплата» — 3 карточки: Cash (default), Картой курьеру, Online (disabled + «Скоро» badge в brandMuted/brand); выбранная карточка — 2px brand border; опциональный comment textarea. Summary sidebar: editorial label «— Ваш заказ», mini-items с Image, дробный Total с dashed разделителем, desktop submit кнопка. Mobile sticky bottom CTA «Подтвердить заказ · {total} сум» + disclaimer. Desktop: `md:grid-cols-[7fr_5fr]` split, `md:sticky md:top-5` sidebar. Все hooks/routing/validation/submit сохранены (deliveryAddress+buyerNote+deliveryFee → confirmCheckout).
- **Push:** main → Railway autodeploy; merged → `web-buyer` (forced, behind)

## 2026-05-05 (сессия 49, Азим) — Task 6: Cart page redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 6] Cart redesign — store-strip, free-delivery hint, OOS-fallback 🔴

- **Дата:** 05.05.2026
- **Файлы:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:** Store strip (brand-color avatar + название из localStorage кэша + «отвечает за час» + «💬 Чат» кнопка); free-delivery progress bar (константа 600,000 сум); borderless items на mobile / surface card на desktop; OOS detection через cast (stock=0 или isAvailable=false); OOS items dimmed 0.55 + «Уведомить» + «Удалить»; QtyStepper компонент; Summary mobile — только breakdown (Подытог/Доставка/К оплате с dashed top); Desktop — sticky right sidebar через `md:grid-cols-[7fr_5fr]`; Mobile sticky bottom CTA «Оформить заказ · {total} сум»; Empty state с editorial label «— Пусто»; Все цены в `colors.textStrong`; BottomNavBar preserved.

## 2026-05-05 (сессия 48, Азим) — Task 5: Product detail page redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 5] Product detail redesign — split layout + sticky CTA 🔴

- **Дата:** 05.05.2026
- **Commit:** `756cf3b`
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`
- **Что сделано:** Desktop split grid `md:grid-cols-[7fr_5fr]`; mobile sticky bottom CTA bar (`md:hidden sticky bottom-0`) с qty stepper + «В корзину · {price}»; desktop 4-thumb row с `outline:2px textStrong` active / `opacity:0.65` inactive; мобильная counter-пилюля «1/4» + dots pagination; variant picker — size pills с `textStrong fill` selected, color circles 36px с double-outline; primary CTA brand fill с суммой (qty×price); secondary CTA «💬 Спросить» brand outline inline in document flow; price везде `textStrong` (не brand); seller card с brand-avatar; editorial labels `— Описание`, `— Характеристики`, `— Из этого магазина`; stock indicator; related products section placeholder; wishlist heart → `colors.brand`; store name в top bar → ссылка на витрину.

## 2026-05-05 (сессия 48, Азим) — Task 4: ProductCard + filters redesign

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 4] ProductCard borderless + brand tokens + filter chips 🔴

- **Дата:** 05.05.2026
- **Commit:** `4f0cea2`
- **Файлы:**
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — убран border/background с внешней обёртки; image-area получила `rounded-md` + `surfaceSunken`; heart 32px rgba(255,255,255,0.85) без border + brand-цвет активного; price в `textStrong`; slider dots → `brand`; variants badge → `brandTextOnBg/brand/brandBorder`; OOS badge → `brandTextOnBg`; CollageGrid пустой слот → `textMuted`; `<span>сум</span>` — muted weight
  - `apps/web-buyer/src/components/store/ProductsWithSearch.tsx` — grid: 2/3/4 cols (убраны xl/2xl), gap 2.5/3.5; input text → `textBody`; ring → `brandBorder`
  - `apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx` — filter button + category chips active = `textStrong` fill (dark-fill, per spec); inactive chips → surface/border/textBody, radius 4-6px (без rounded-full); counter badge → `brand`; section headings → `textStrong`; boolean toggle → `brand`; select/input → `textBody`, radius 6px; divider выше attribute-list
- **Push:** main → Railway autodeploy; merged → `web-buyer`

---

## 2026-05-05 (сессия 47, Азим) — Task 1: Foundation tokens + Inter font

### ✅ [WEB-BUYER-DESIGN-IMPL-001 / Task 1] Foundation tokens — Soft Color Lifestyle palette + Inter font 🔴

- **Дата:** 05.05.2026
- **Файлы:**
  - `apps/web-buyer/src/app/globals.css` — заменён `:root` light-блок на терракотовую палитру, обновлены `body` и `@theme inline` (Geist → Inter, удалён `--font-mono`)
  - `apps/web-buyer/src/app/layout.tsx` — заменены `Geist`/`Geist_Mono` на `Inter` (latin + cyrillic, display:swap)
  - `apps/web-buyer/src/lib/styles.ts` — добавлены `brandHover/brandMuted/brandBorder/brandTextOnBg/textBody/textStrong`; удалены deprecated `glass`/`glassDim`/`glassDark` экспорты
- **Что сделано:** полная замена «Liquid Authority» violet `:root` токенов на «Soft Color Lifestyle» терракотовую палитру. `accent*` остались как CSS-variable aliases на `brand*` — обратная совместимость для всех существующих компонентов. Dark theme (`[data-theme="dark"]`) не тронут. `glass*` удалены безопасно — ни один consumer-файл их не импортировал (проверено grep).
- **Commit:** см. git log (feat: foundation tokens)
- **Push:** main + web-buyer (Railway autodeploy)

---

## 2026-05-05 (сессия 46, Азим) — Дизайн-стратегия web-buyer + 2 hotfix

### ✅ [WEB-BUYER-DESIGN-PLAN-001] Spec + implementation plan для редизайна web-buyer 🟡

- **Дата:** 05.05.2026 (вечер)
- **Триггер:** Азим — «Qlay 1:1 конкурент, дизайн похож, надо отстроиться чтобы люди тянулись к нам».
- **Что сделано:** через `superpowers:brainstorming` скилл + visual companion (http://localhost:62530) проработали 3 раунда направлений, Азим выбрал **B · Soft Color Lifestyle** (Sezane / Aimé Leon Dore вайб с тёплой палитрой и кураторскими brand-цветами для каждого магазина).
- **Артефакты:**
  - **Spec** `docs/superpowers/specs/2026-05-05-buyer-design-differentiation-design.md` — commit `5e56f80`. 339 строк, 5 секций (Foundation / Storefront / Product detail / Cart+Checkout / Connection).
  - **Implementation plan** `docs/superpowers/plans/2026-05-05-buyer-design-soft-color-lifestyle.md` — commit `e0157df`. 10 задач в порядке: foundation tokens → header/nav → storefront → ProductCard → product detail → cart → checkout → chat → orders → profile/wishlist.
  - **Visual mockups** в `.superpowers/brainstorm/375-1777971328/content/01-09*.html` — 9 HTML страниц с реальными picsum-фото, сохранены через `--project-dir` режим.
- **Ключевые решения** (зафиксированы в спеке):
  - Default brand color: **#7C3F2E (терракота)** — узбекский tone (тандыр, suzani)
  - Curated палитра: **8 цветов** (терракота / шоколад / горчица / олива / хвоя / морская волна / слива / уголь)
  - Шрифт: **Inter** (отвергли Geist — кириллица в Telegram WebView хуже)
  - Hero ratio desktop: **6fr photo : 4fr color**
  - Цена на ProductCard: **#1F1A12, НЕ brand-цвет** (brand «зарабатывается» — только hero/CTA/links/hover)
  - Dark theme — оставляем как есть до отдельной итерации
- **Status:** дизайн-фундамент готов, **код ещё НЕ тронут**. Имплементация — через subagent-driven-development по 10 задачам плана. Откуда продолжать: Task 1 (foundation tokens + Inter font в `lib/styles.ts` + `globals.css` + `app/layout.tsx`).

### ✅ [WEB-BUYER-PROFILE-ICON-RIGHT-001] Profile icon → правый край header (desktop) 🟢

- **Дата:** 05.05.2026 (середина сессии 46)
- **Файлы:** `apps/web-buyer/src/components/layout/Header.tsx`
- **Что сделано:** перенёс профиль-иконку из desktop-only nav-группы (где она шла рядом с Чаты/Заказы) в самый конец после ThemeToggle. На mobile профиль остаётся в BottomNavBar (без изменений).
- **Commit:** `f72cec8` (после rebase). Запушено в main + web-buyer.
- **Заметка:** будет частично переделано в Task 2 implementation plan'a (полный редизайн Header), но пока стоит как небольшая UX-правка.

### ✅ [WEB-BUYER-WISHLIST-MUTATION-FIX-001] TS2322 в wishlist mutation → Railway build падал 🔴

- **Дата:** 05.05.2026 (начало сессии 46)
- **Файлы:** `apps/web-buyer/src/hooks/use-wishlist.ts`
- **Проблема:** Railway build buyer'а падал на TS-check: `mutationFn` возвращал union `Promise<void> | Promise<WishlistAddResponse>`, TanStack Query вывел generic как `Promise<void>` от первой ветки, и тут же ругался что вторая ветка не подходит.
- **Что сделано:** завернул обе ветки в `async/await`-блок, тип схлопнулся в `Promise<void>`. Все 3 use-site-а вызывают только `.mutate(...)` без чтения результата → семантика не изменилась.
- **Commit:** `d872bab`. Запушено в main + web-buyer (Railway передеплоил).

---

## 2026-05-05 (сессия 45 продолжение, Азим) — Wishlist UI для web-buyer

### ✅ [WEB-BUYER-TOOLTIPS-001] Кастомные tooltip-подсказки на иконки в buyer 🟢

- **Дата:** 05.05.2026 (по запросу Азима)
- **Файлы:**
  - `apps/web-buyer/src/components/tooltip.tsx` (новый) — pure-CSS hover/focus-within tooltip с inverted темой (bg=textPrimary, text=bg → высокий контраст в обеих темах). Pill снизу триггера, 150ms fade. `pointer-events-none` чтобы не блокировать клики, `z-50`. role="tooltip".
  - `apps/web-buyer/src/components/layout/Header.tsx` — `NavIconLink` теперь оборачивает `Link` в `<Tooltip label={ariaLabel}>`. Все 6 иконок Header (Чаты, Заказы, Профиль, Избранное, Корзина, Уведомления) получают подсказку.
  - `apps/web-buyer/src/components/theme-toggle.tsx` — кнопка обёрнута в Tooltip с динамической меткой («Включить светлую/тёмную тему»). Native `title` атрибут удалён (избежать дублирования). Popover на right-click продолжает работать (Tooltip не мешает stacking'у).
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — Back/Heart/Share на product detail top bar тоже обёрнуты в Tooltip. Native `title` удалён.
- **Триггер:** Азим: «Когда наводиш на иконик в buyer под иконкой выходило слово типо подсказка того что это за иконка». Нативный `title` browser-tooltip медленный (~700ms delay) и стилизуется по-разному в каждом браузере.
- **Решение:** Pure-CSS pattern с `group-hover` + `group-focus-within`, без JS, без портала. Подсказка появляется мгновенно на hover, fade 150ms. Theme-aware через токены — в light темной pill (#0F1115 на cream), в dark светлой pill (#F4F4F5 на near-black).
- **Что НЕ сделано:** ProductCard heart icon (на каждой карточке) — оставлено без tooltip потому что (a) heart как иконка визуально однозначная, (b) tooltip снизу на mobile-grid выглядел бы клаустрофобно. Cart/Profile/Chat страницы — отдельно по запросу если потребуется.

### ✅ [WEB-BUYER-WISHLIST-DETAIL-001] Wishlist heart на product detail page (follow-up) 🟢

- **Дата:** 05.05.2026 (через ~30 мин после WEB-BUYER-WISHLIST-PAGE-001)
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`
- **Что сделано:** Heart (lucide) теперь в top bar страницы товара между «Назад» и «Поделиться». Использует тот же `useToggleWishlist` + `useWishlistIds` паттерн, читает `product.inWishlist` (server flag для авторизованных) с фолбэком на client cache. Click → optimistic toggle. Unauth → редирект на /wishlist. Закрашен accent-цветом + filled когда in-wishlist, outlined иначе.
- **Почему follow-up, а не часть исходной задачи:** Гэп заметил после push `WEB-BUYER-WISHLIST-PAGE-001` — юзер на detail page не мог сохранить товар, надо было возвращаться к листу. Закрыл сразу, т.к. это очевидная брешь в свежеотправленной фиче.

### ✅ [WEB-BUYER-WISHLIST-PAGE-001] Wishlist: heart на ProductCard + страница /wishlist 🟡

- **Важность:** 🟡 (фича была заблокирована бэком до 02.05.2026, после `0f46a63` Полата готова к UI)
- **Дата:** 05.05.2026
- **Домен:** `apps/web-buyer`
- **Файлы (новые):**
  - `apps/web-buyer/src/lib/api/wishlist.api.ts` — `getWishlist()`, `addToWishlist(productId)`, `removeFromWishlist(productId)`. Использует `WishlistItem` из `packages/types`.
  - `apps/web-buyer/src/hooks/use-wishlist.ts` — `useWishlist()` (TanStack Query, enabled по `isAuthenticated`, staleTime 60s), `useWishlistIds()` (мемоизированный `Set<productId>` для быстрого lookup на каждой карточке), `useToggleWishlist()` (optimistic mutate с `onMutate`/`onError`/`onSettled` invalidate).
  - `apps/web-buyer/src/app/(shop)/wishlist/page.tsx` — страница со встроенным `<Header />` + `<BottomNavBar active="wishlist" />`, OtpGate если unauth, иначе grid 2/3/4 колонок (responsive) с `WishlistCard` для каждого товара. Skeleton loading state. Empty state с CTA «К магазинам». Error state.
- **Файлы (изменены):**
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — добавлен heart (lucide `Heart`) в top-right corner. Filled accent если `inWishlist` (server flag prioritized, иначе client cache lookup), outlined иначе. Click → `e.preventDefault()` + `e.stopPropagation()` (не триггерит Link навигацию) → `useToggleWishlist().mutate({productId, inWishlist})`. Если unauth → `router.push('/wishlist')` где OtpGate логинит юзера.
  - `apps/web-buyer/src/components/layout/Header.tsx` — добавлена `<NavIconLink href="/wishlist">` с иконкой `Heart` между desktop nav и Cart. Всегда видима (mobile + desktop).
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — `NavActive` тип расширен `| 'wishlist'`. В NAV-массив не добавляется (5 items уже плотно), но валидное значение не подсвечивает ни одну вкладку — корректное поведение когда юзер на /wishlist.
- **Что работает:**
  - **Heart на каждой карточке витрины** — мгновенный optimistic flip, серверный POST/DELETE на фоне, revert при ошибке.
  - **Authenticated buyers** видят правильное состояние сердечек на storefront feed (бэк уже шлёт `product.inWishlist` в `ProductListItem` для авторизованных — Polat `0f46a63`).
  - **Anonymous users** — heart показывается outlined; клик → редирект на `/wishlist` где OtpGate просит подтвердить телефон.
  - **/wishlist** — список с store name + title + price + cover photo. X-кнопка вверху каждой карточки убирает товар (тоже optimistic). Empty state, error state, skeleton — все в дизайн-системе с токенами (работает в обеих темах).
- **Архитектурные решения:**
  - **`useWishlistIds()` возвращает Set** — карточки на витрине вызывают этот hook, и react-query разделяет один cached запрос между всеми subscriber'ами (нет N запросов на N карточек). `useMemo` с deps `[data]` гарантирует стабильную ссылку для `Set.has()` при ре-рендерах.
  - **Server flag wins, client cache fallback** — `product.inWishlist ?? wishlistIds.has(product.id)`. Server flag установлен на storefront feed (быстрый path), client cache используется когда карточка в нестандартном контексте (recent stores, итд).
  - **Optimistic mutation без productPreview** — server возвращает `{id, productId, createdAt}` без embedded product. Чтобы вставить корректный `WishlistItem` оптимистично, нужен `productPreview` (storeName/storeSlug/etc), но ProductCard этих данных не имеет. Решение: `onSettled` invalidate список → refetch принесёт authoritative data. Между optimistic и refetch (~100-300ms) карточка просто не появится в `/wishlist`, но heart на витрине уже показывает правильное состояние (через cache update).
  - **OtpGate для unauth flow** — вместо отдельного modal/popup на ProductCard'е (overhead на каждой карточке), редиректим на `/wishlist` где OtpGate уже встроен. После логина юзер видит пустой список и может вернуться к товарам.
- **Что НЕ сделано (out of scope):**
  - Wishlist count badge на heart icon в Header (как у cart) — лишняя нагрузка для не-критичной метрики, может быть добавлено позже если будет запрос.
  - Sync wishlist между TMA (sessionStorage cache) и web (TanStack Query cache) — два отдельных мирa, бэк сам source of truth.
- **Проверка:** локально не запускалось (запрет `feedback_no_local_run`). Static check: типы `WishlistItem` импортируются из `packages/types`, `apiClient.get/.post/.delete` — стандарт axios, `useMutation` callback signatures совпадают с TanStack Query v5 контрактом, `inWishlist?: boolean` есть в `ProductListItem` (`packages/types/src/api/products.ts:68`).

---

## 2026-05-05 (сессия 45, Азим) — Dark/Light theme system для web-buyer и web-seller

### ✅ [WEB-THEME-SYSTEM-001] Полная theme system: ThemeProvider + ThemeToggle + token migration 🟡

- **Важность:** 🟡 (новая фича, заметный UX-улучшение)
- **Дата:** 05.05.2026
- **Домен:** `apps/web-buyer`, `apps/web-seller`
- **Файлы (новые):**
  - `apps/web-buyer/src/lib/theme/theme-provider.tsx`
  - `apps/web-buyer/src/lib/theme/theme-script.tsx`
  - `apps/web-buyer/src/components/theme-toggle.tsx`
  - `apps/web-seller/src/lib/theme/theme-provider.tsx`
  - `apps/web-seller/src/lib/theme/theme-script.tsx`
  - `apps/web-seller/src/components/theme-toggle.tsx`
- **Файлы (изменены):**
  - `apps/web-buyer/src/app/globals.css` — добавлен dark `[data-theme="dark"]` блок (warm `#0F0F12` near-black + violet accent), все цвета через CSS-переменные, transition при смене темы
  - `apps/web-seller/src/app/globals.css` — добавлен light `:root` блок (cream/slate), `--app-bg` переменная (gradient в dark, solid в light), `--onboarding-bg` + 2 orb-переменных
  - `apps/web-buyer/src/lib/styles.ts` — все `colors.X` теперь возвращают `var(--color-X)` вместо хексов; компоненты автоматически темизуются без правок
  - `apps/web-seller/src/lib/styles.ts` — то же + новый токен `accentTextOnBg` (всегда контрастный текст на violet кнопках)
  - `apps/web-buyer/src/app/layout.tsx` — `<head><ThemeScript defaultTheme="system" /></head>`, `<ThemeProvider>` обёрнут вокруг детей, `suppressHydrationWarning` на `<html>`
  - `apps/web-seller/src/app/layout.tsx` — то же с `defaultTheme="dark"` (сохраняет CRM identity)
  - `apps/web-buyer/src/components/layout/Header.tsx` — `<ThemeToggle bordered={false} />` справа от Bell, `hover:bg-black/5` заменён на токен-aware mouseEnter/Leave
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — `<ThemeToggle />` слева от Bell в topbar
  - `apps/web-seller/src/app/(onboarding)/layout.tsx` — gradient → `var(--onboarding-bg)`, orbs → CSS vars
- **Файлы (миграция `text-white`/`color: colors.bg` → семантические токены):**
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — 9 правок: `text-white` → `colors.textPrimary`, accent-bubble text → `accentTextOnBg`, edit-textarea/buttons на accent bubble переписаны через rgba(255,255,255) (стабильно в обеих темах т.к. bubble всегда violet), `hover:bg-white/5` → `bg-[var(--color-surface-muted)]`
  - `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx` — все `text-white` headings → `colors.textPrimary`; ProgressBar checkmark text + accent submit-buttons → `accentTextOnBg`
  - `apps/web-seller/src/app/(auth)/login/page.tsx` — primary button text + Logo icon color → `accentTextOnBg`
  - `apps/web-seller/src/app/(dashboard)/{layout,orders,orders/[id],products,products/create,products/[id]/edit,settings}/*` — batch-замена `color: colors.bg` → `colors.accentTextOnBg` (8 файлов)
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — 3 дополнительных `text-white` → `colors.textPrimary`
  - `apps/web-seller/src/components/{product-variants-section,product-option-groups-section}.tsx` — 3 `text-white` → `colors.textPrimary`
  - `apps/web-buyer/src/components/chat/ChatComposerModal.tsx` — полная переработка: был сломан хардкоденым white text на (теперь light) `glass` surface; теперь использует `card` + `colors.textPrimary` + `accentTextOnBg`
- **Что работает:**
  - **Toggle** в header buyer'a + topbar seller'a: иконка Sun ↔ Moon с smooth rotate+scale (300ms ease-out). Click = toggle light↔dark. Right-click = popover с 3 опциями: Светлая / Тёмная / Как в системе. Esc / click-outside закрывают popover.
  - **No-flash hydration:** inline-script в `<head>` ставит `data-theme` ДО React-hydration, читая `localStorage('savdo-theme')` или `prefers-color-scheme`. Никаких миганий.
  - **Persist:** выбор сохраняется в `localStorage('savdo-theme')`. При reload — восстанавливается.
  - **System sync:** если выбрано «Как в системе», `matchMedia('change')` listener реагирует на смену OS-темы без перезагрузки.
  - **Smooth swap:** `body { transition: background-color 200ms ease, color 200ms ease }` (отключено для `prefers-reduced-motion: reduce`).
  - **Accessibility:** `aria-label`, `role="menu"`, `role="menuitemradio"`, `aria-checked`, keyboard (Esc).
- **Архитектурное решение — почему через CSS-переменные, а не Tailwind `dark:`:**
  - Все компоненты обоих app'ов уже импортируют `colors`/`card`/`shell` из `lib/styles.ts` (Phase 3 cleanup сделал это инвариантом). Изменив значения этих констант с хексов на `var(--color-X)`, я автоматически темизовал ВЕСЬ UI без касания компонентов.
  - Это совпадает с предписанием `docs/design/liquid-authority.md`: «Не использовать `dark:` класс Tailwind отдельно — только через CSS переменные».
  - Альтернатива (Tailwind `dark:`) потребовала бы рефакторинга десятков файлов и не масштабируется на inline `style={{}}` (которых много).
- **Палитры:**
  - **buyer light** (default): `#FAFAF7` cream bg + `#7C3AED` violet accent + `#0F1115` text — без изменений (то что было)
  - **buyer dark** (новое): `#0F0F12` warm near-black + `#8B5CF6` lighter violet accent + `#F4F4F5` text + `#A78BFA` brand wordmark
  - **seller dark** (default): сохранён оригинальный gradient body + slate-900 surfaces + `#A78BFA` accent — без изменений
  - **seller light** (новое): `#F4F5F7` solid bg + `#7C3AED` violet accent + `#0F172A` text
  - **brand wordmark** «Savdo» — единый `#7C3AED` в light, `#A78BFA` в dark (оба контрастно читаются на своей теме)
- **Что НЕ сломано (verified):**
  - 0 хардкоженых `bg-white`/`text-black`/`bg-black` в обоих app'ах (Phase 3 cleanup был чистый)
  - Все inline `colors.X` авто-темизуются через CSS vars
  - Telegram-blue gradient buttons (`linear-gradient(135deg, ${colors.telegram} 0%, #1d6fa4 100%)` + `color: "#FFFFFF"`) — корректно в обеих темах (Telegram brand)
  - Logo gradient `linear-gradient(135deg, #7C3AED, #A78BFA)` в seller sidebar — brand identity, корректно в обеих
  - Mobile drawer overlay `rgba(0,0,0,0.65)` — универсальный dark backdrop
  - Loader2 `text-white` на `rgba(0,0,0,0.45)` overlay в seller profile — корректно (white spinner на dark backdrop в обеих темах)
- **Проверка:** локально не запускалось (запрет `feedback_no_local_run`). Static audit: 0 проблемных хардкодов после миграции, type-shape `colors` объекта не изменился (только значения), все consumers `colors.X` остались валидны.

---

## 2026-05-04 (параллельная сессия, security audit) — SEC-AUDIT-2026-05 backend audit + HIGH-01 fix

### ✅ [SEC-AUDIT-2026-05] Backend security audit (apps/api) — отчёт + точечный фикс HIGH-01

- **Важность:** 🔴 audit + один безопасный фикс (HIGH-01)
- **Дата:** 04.05.2026
- **Файлы:**
  - `analiz/logs.md` — полный отчёт `[SEC-AUDIT-2026-05]` (2 CRITICAL, 3 HIGH, 7 MEDIUM, 2 LOW + сводная таблица + раздел Update со статусом фиксов).
  - `apps/api/src/modules/chat/chat.controller.ts` — `@Roles('BUYER', 'SELLER')` на `POST /chat/threads`.
  - `D:/Obsidian Vault/PROJECTS/savdo-builder/decisions/2026-05-04-secaudit202605-backend-security-audit.md` — ADR.
- **Что сделано:**
  - Аудит по 7 направлениям (rate-limit, JWT/Roles, raw SQL, XSS, SSRF, secrets logging, CORS).
  - SQL injection и SSRF — чисто (Prisma tagged templates, axios только на api.telegram.org).
  - Найдены 2 CRITICAL: `[SEC-001]` ThrottlerGuard не зарегистрирован APP_GUARD (rate-limit фактически выключен) + `[SEC-TG-001]` Bot Token в 302 Location header `/media/proxy/:id`.
  - Параллельная сессия за время аудита закрыла оба CRITICAL + HIGH-03 (auth/chat/checkout/products/media `@Throttle`) + MED-07 (loud warning при пустом webhook secret). См. Update-блок в logs.md.
  - Свой фикс: `[SEC-002]` HIGH-01 — добавлен явный `@Roles` на `POST /chat/threads`. Раньше RolesGuard молчаливо пропускал endpoint через `if (!requiredRoles) return true`.
- **TS check:** `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` → exit 0.
- **Открытые тикеты:** `[SEC-003]` HIGH-02, `[SEC-005..SEC-012]` MED+LOW — список в logs.md, фиксы вне скоупа этой сессии.

---

## 2026-05-04 (параллельная сессия, web design audit) — Дизайн-аудит web-buyer + web-seller

### ✅ [WEB-DESIGN-AUDIT-001] Аудит web-buyer + web-seller по 5 критериям (контраст WCAG AA, hit-area 44pt, hierarchy, 4px-grid, a11y) 📋

- **Важность:** 🟡 audit-only (фиксы — отдельным PR, после согласия Полата; зона Азима по `CLAUDE.md`)
- **Дата:** 04.05.2026
- **Файлы:**
  - `analiz/web-design-audit-001.md` — полный отчёт с findings и приоритезацией.
  - `analiz/logs.md` — pointer-запись.
  - Obsidian: `D:/Obsidian Vault/PROJECTS/savdo-builder/_ideas.md`.
- **Найдено:** P0 (mobile UX broken) — hit-area в web-buyer: BottomNavBar ≈40px, Header.NavIconLink 36×36, ProductPage back/share 36×36, cart +/− 28×28, image-dots 8×8 (всё ниже 44pt); `prefers-reduced-motion` отсутствует в globals.css обоих апп. P1 — `textDim` ниже AA в обоих темах (~3.0–4.2:1, сотни вхождений); `success #16A34A` на light bg ~3.4:1. P2 — aria-label на ±/dots/inline-confirm, `role="dialog"` + focus-trap в `OrdersPage.CancelModal`, `<nav aria-label>` в seller sidebar.
- **Архитектура:** `packages/ui/tokens/colors.ts` содержит 4 неиспользуемые палитры (variantA-D), активные токены живут в `lib/styles.ts` каждого апп — рассинхрон.
- **НЕ сделано:** код не правил, dev-сервер не запускал, axe-core/Lighthouse — нужен браузер.
- **Ждёт от Полата:** согласие на (1) рост BottomNav 64→76px, (2) правку tokens одной таблицей, (3) подтверждение что web-* можно фиксить самому, не ждать Азима.

---

## 2026-05-04 (параллельная сессия, DB audit) — Аудит Prisma schema + миграций

### ✅ [DB-AUDIT-001] Аудит `packages/db/prisma/schema.prisma` + 18 миграций 📋

- **Важность:** 🟡 audit-only (фиксы — отдельным PR, миграциями, после согласия Полата)
- **Дата:** 04.05.2026
- **Файлы:**
  - `analiz/logs.md` — полный отчёт `DB-AUDIT-001` с разбивкой P1/P2/P3 и action items.
- **Что сделано:** ручной обход schema + миграций + cross-check с API кодом (`apps/api/src/modules/**/repositories`). Проверены: ON DELETE FK, composite indexes на горячих запросах (Product feed, Order, ChatMessage, ProductImage), missing `@unique`, согласованность enum'ов, фильтрация `deletedAt: null`.
- **Найдено:**
  - **P1 (2):** 7 таблиц с `userId` без FK на User (orphan-риск); `ChatThread.status` рассинхрон — schema default `'active'`, код пишет `'OPEN'/'CLOSED'`.
  - **P2 (5):** нет composite индексов для public Product feed, `Order(storeId,status,placedAt DESC)`, `ChatMessage(threadId,createdAt DESC)`, `ProductImage(productId,sortOrder)`; `deletedAt: null` пропущен в ~12 местах (Store/Product) — `postProductToChannel` бота может опубликовать удалённый товар в TG-канал.
  - **P2 design (1):** TEXT-поля кандидаты на enum (`Cart.status`, `OrderRefund.status`, `AdminUser.adminRole`, `ChatMessage.messageType`, Moderation*).
  - **P3 (2):** `CartItem.productId CASCADE` (семантически SetNull), `User.referredBy` без self-FK.
- **НЕ менял:** `schema.prisma`, миграций не создавал, `prisma migrate dev` не запускал, чужие файлы параллельной TMA-design сессии не трогал.
- **Action items для Полата:** см. в конце `[DB-AUDIT-001]` в `analiz/logs.md` (приоритизированный список из 6 пунктов).

---

## 2026-05-04 (параллельная сессия, TMA design pass) — WCAG AA + 44pt hit-area + a11y emoji

### ✅ [TMA-DESIGN-P0P1-001] P0 + P1 фиксы из DESIGN-AUDIT-TMA-001 🟠

- **Важность:** 🟠 P1 (один P0 «#1 BottomNav контраст» — релиз-блокер)
- **Дата:** 04.05.2026
- **Файлы:**
  - `apps/tma/src/components/layout/BottomNav.tsx` — inactive label color `rgba(255,255,255,0.28)` → `0.50` (WCAG AA), `aria-hidden="true"` на иконке.
  - `apps/tma/src/components/ui/ProductCard.tsx` — Add-to-cart `+` 26×26 → 44×44, `aria-label`, `🏪` теперь `aria-hidden`, meta-текст 10px → 12px (`text-xs`) c opacity 0.50.
  - `apps/tma/src/pages/buyer/StorePage.tsx` — Add-to-cart `+` 32×32 → 44×44 (`w-11 h-11`), `aria-label`, `aria-hidden` на 😕/📭.
  - `apps/tma/src/pages/buyer/ChatPage.tsx` — back `‹` 32×32 → 44×44, `aria-label`, status badge OPEN/CLOSED с иконкой ✓/🔒, opacity 0.35 → 0.50, text-[11px] → text-xs у meta-инфы (lastMessage, дата), aria-hidden на 💬/💬/💬.
  - `apps/tma/src/pages/seller/ChatPage.tsx` — back `‹` 32×32 → 44×44, `aria-label`, status badge OPEN/CLOSED с иконкой ✓/🔒, text-[11px] → text-xs у meta-инфы (lastMessage, дата, «Покупатель»), aria-hidden на ⚠️/💬/💬.
- **Что сделано:** Применены P0 (контраст BottomNav, hit-area Add-to-cart + back) и P1 (decorative emoji aria-hidden, status-only badges с иконкой, мелкий low-contrast meta-текст → 12px с opacity ≥0.45) из аудита `[DESIGN-AUDIT-TMA-001]` в `analiz/logs.md`.
- **Не трогал:** `apps/tma/src/lib/api.ts` (fetch-слой), `apps/tma/src/pages/{buyer,seller}/StorePage.tsx` блок webStoreUrl/webStoreLabel (только что сделано Полатом), все seller-страницы кроме ChatPage (параллельная сессия делает perf-pass).
- **Type check:** `cd apps/tma && npx tsc -b --noEmit` → 0 ошибок в моих файлах.

---

## 2026-05-04 (параллельная сессия) — TMA seller fetch-слой: AbortController + per-endpoint cache discipline

### ✅ [WEB-TMA-SELLER-PERF-001] AbortController + prefetch во всех seller-страницах TMA 🟡

- **Файлы (8 из 9):**
  - `apps/tma/src/pages/seller/DashboardPage.tsx`
  - `apps/tma/src/pages/seller/ProductsPage.tsx`
  - `apps/tma/src/pages/seller/OrdersPage.tsx`
  - `apps/tma/src/pages/seller/StorePage.tsx`
  - `apps/tma/src/pages/seller/SettingsPage.tsx`
  - `apps/tma/src/pages/seller/ProfilePage.tsx`
  - `apps/tma/src/pages/seller/EditProductPage.tsx`
  - `apps/tma/src/pages/seller/AddProductPage.tsx`
- **Что сделано:**
  - В каждом `useEffect` который дёргает `api()` создаётся `AbortController`, signal передаётся в `api()` через `opts.signal`. На return useEffect — `ac.abort()`.
  - Все then/catch/finally проверяют `ac.signal.aborted` ДО вызова setState — больше нет state-обновлений на размонтированном компоненте.
  - `OrdersPage` и `DashboardPage` (`/seller/orders`, `/seller/orders/:id`) — `forceFresh: true`, статусы заказов меняются быстро.
  - `ProductsPage` — `prefetch` на `onPointerEnter` карточек: `/seller/products/:id` + `/seller/products/:id/attributes`. Когда продавец навёл курсор/тапнул — товар уже в кэше к моменту навигации в редактор.
  - "Повторить" кнопки (ProductsPage, EditProductPage, StorePage) пересоздают AbortController вместо игнорирования предыдущего fetch'а.
- **Не сделано:** `apps/tma/src/pages/seller/ChatPage.tsx` — параллельная сессия активно работает над ним по `TMA-DESIGN-P0P1-001` (hit-area back-кнопки 44px, aria-hidden на decorative emoji, контраст inactive labels). Чтобы не воровать чужой коммит, ChatPage пропущен. Откроем как `TMA-SELLER-CHAT-PERF-001` (см. tasks.md).
- **UI/визуал не менялся** — только fetch-слой.
- **Type check:** `npx tsc --noEmit` в `apps/tma` → 0 ошибок.

---

## 2026-05-02 (сессия 45 финал, Полат) — Content-Security-Policy на web-buyer + web-seller

### ✅ [WEB-CSP-HEADER-002] CSP headers на обоих веб-апах 🟢

- **Файлы:** `apps/web-buyer/next.config.ts`, `apps/web-seller/next.config.ts`
- **Контекст:** Сессия 38 добавила базовый набор security-headers (X-Frame-Options/HSTS/Referrer-Policy/Permissions-Policy/X-Content-Type-Options) — но Content-Security-Policy не было. Без CSP в случае компрометации фронта (XSS-инъекция) защита неполная.
- **Что сделано:** Добавил CSP-директивы в обоих `next.config.ts` рядом с существующими `securityHeaders`.
- **CSP-стратегия (pragmatic baseline, не nonce-based):**
  - `default-src 'self'` — базовая запретная политика.
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` — Next.js production требует обе. **Что блокирует:** инъекцию `<script src="https://attacker.example/...">` (только из 'self'), инъекцию `<script src="http://...">` (любого HTTP source).
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Tailwind/inline style props.
  - `font-src 'self' data: https://fonts.gstatic.com`.
  - `img-src 'self' data: blob: https:` — широкий, но https-only (R2/Telegram-proxy/любой CDN).
  - `media-src 'self' https: blob:`.
  - `connect-src 'self' https: wss:` — API + Socket.IO. Блокирует HTTP exfiltration.
  - `frame-src` — для web-buyer: `'self' https://t.me https://oauth.telegram.org` (на случай TG login widgets). Для web-seller: только `'self'`.
  - `frame-ancestors 'none'` — сильнее чем X-Frame-Options DENY (оставлены оба для совместимости со старыми браузерами).
  - `object-src 'none'` — запрет Flash/Java applet/embed эксплойтов.
  - `base-uri 'self'` — нет hijack'а через `<base href>`.
  - `form-action 'self'` — нет submit'а на чужие origins.
- **Что НЕ сделано (можно усилить позже):**
  - Strict CSP с per-request nonce'ами (требует middleware изменений в Next 15) — отложено до появления реальной XSS-поверхности.
  - Whitelist конкретных R2/Telegram media хостов в connect-src/img-src — пока wildcards `https:`, так как хосты варьируются по deploy'ям.
  - CSP-Report-Only roll-out — задеплоил сразу как enforcing. Easy to revert если браузеры жалуются.
- **Verify после деплоя:** открыть DevTools → Console на проде. Если есть нарушения — будут логи `Refused to load … because it violates …`. Если нарушений нет — CSP работает прозрачно.

### Push: `main` → `web-buyer` + `web-seller` ветки. Коммит `814c35b`.

> На этом очередь Полата по открытым задачам завершена. Осталось только manual action items: STORAGE_PUBLIC_URL на Railway api, миграция wishlist, ручная проверка TG-уведомлений.

---

## 2026-05-02 (сессия 45 продолжение 2, Полат) — Wishlist (избранное товаров): backend + TMA UI

### ✅ [WISHLIST-CONTRACT-001] Wishlist — endpoints + тип + миграция (был БЛОКЕР для UI) 🟡
### ✅ [TMA-BUYER-WISHLIST-001] Wishlist UI в TMA: heart на карточках + страница /buyer/wishlist 🟡

- **Контекст:** Полат через Азима «избранное заказов / понравившиеся заказы» — но «избранное заказов» бессмысленно (это статус), скорее всего имелось в виду wishlist товаров. До этого ничего не было ни в БД, ни в типах.
- **DB migration `20260502000000_add_buyer_wishlist`:**
  - Новая таблица `buyer_wishlist_items (id, buyerId, productId, createdAt)`
  - Unique `(buyerId, productId)` — идемпотентный add через upsert
  - `ON DELETE CASCADE` от Buyer и Product (нет orphan rows)
  - Индексы на `buyerId` и `productId`
  - **⚠️ Action для Полата на Railway api shell:** `pnpm db:migrate:deploy`
- **Schema (`packages/db/prisma/schema.prisma`):** `BuyerWishlistItem` model + back-refs на `Buyer.wishlist` и `Product.wishlistItems`.
- **Types (`packages/types`):** новый `WishlistItem` интерфейс в `api/wishlist.ts` (id, productId, createdAt, embedded product preview с `isAvailable` computed-флагом). `ProductListItem.inWishlist?: boolean` — выставляется ТОЛЬКО на storefront feed для авторизованных buyer'ов, иначе undefined.
- **API (`apps/api/src/modules/wishlist/`):**
  - Новый модуль: controller, repository, 3 use-case (get/add/remove), DTO, module.
  - `GET /api/v1/buyer/wishlist` → `WishlistItem[]` (все авторизованные buyer'ы; soft-deleted продукты отфильтрованы)
  - `POST /api/v1/buyer/wishlist` body `{ productId }` → 201 (idempotent через upsert)
  - `DELETE /api/v1/buyer/wishlist/:productId` → 204 (silent если нет — REST best practice)
  - Все эндпоинты под `@UseGuards(JwtAuthGuard)`, `resolveBuyerId` через `usersRepo.findById`.
- **Storefront feed enrichment:**
  - `GET /storefront/products` теперь использует `OptionalJwtAuthGuard` → принимает и анонимные, и авторизованные запросы.
  - Если `user.sub` есть и buyer профиль найден → один батч-запрос `wishlistRepo.findExistingProductIds(buyerId, productIds)`, флаг `inWishlist` ставится на каждый item. O(N) memory.
  - Анонимные ответы не меняются — поля `inWishlist` нет вовсе.
- **TMA UI:**
  - Новый `lib/wishlist.ts` — in-memory + sessionStorage кэш, pub/sub для cross-component sync, optimistic add/remove с откатом при ошибке.
  - `AuthProvider` после успешной auth (BUYER role) делает `hydrateWishlist()` (non-blocking).
  - Новый компонент `WishlistButton` (variants `card` и `page`) — heart toggle с haptic-feedback, optimistic UI, glassmorphism.
  - `ProductCard` (storefront feed) — heart overlay в правом верхнем углу изображения.
  - `ProductPage` — heart кнопка справа от заголовка (page variant).
  - Новая страница `/buyer/wishlist` — grid с `isAvailable=false` товарами dimmed + overlay «Недоступен» (если seller архивировал или магазин unpublished).
  - StoresPage header теперь имеет heart-иконку рядом с шестернёй → переход на `/buyer/wishlist`.
- **Edge cases:**
  - Wishlist для soft-deleted продукта: repo фильтр исключает из list, но row остаётся (cron в будущем может чистить).
  - Двойной добавление: upsert idempotent, без ошибки.
  - Удаление несуществующего: 204 silent.

### Push: `main` → `api` + `tma` ветки. Коммиты `0f46a63` (backend), `fd8721f` (UI).

---

## 2026-05-02 (сессия 45 продолжение, Полат) — Telegram bot notifications: order status + chat messages

### ✅ [API-NOTIFICATIONS-ORDER-001] Уведомления покупателю в TG при смене статуса заказа 🔴
### ✅ [API-NOTIFICATIONS-CHAT-001] Уведомления о новых сообщениях в чате через TG-бот 🔴

- **Контекст (Полат через Азима, скрины 30.04 14:32):** «должна быть система уведомления / типо ваш заказ оформлен / ваш заказ обработан / ваш заказ получен» + «вам написал клиент имя клиента на счёт "имя товара": "сообщение покупателя", и похожая логика у самого покупателя».
- **Что было:** Существовал `SellerNotificationService` с методом `notifyNewOrder` для продавца — но **он нигде не вызывался**. `TelegramNotificationProcessor` обрабатывал new-order/store-approved/store-rejected/verification-approved/broadcast. Уведомлений на смену статуса для покупателя и на чат-сообщения не было совсем.
- **Архитектура решения:** Поверх существующей BullMQ-очереди (`QUEUE_TELEGRAM_NOTIFICATIONS`):
  - 2 новых job type: `order-status-changed`, `chat-message`.
  - Fire-and-forget enqueue, до 3 попыток с exponential backoff. Никогда не блокирует HTTP-запрос.
  - Templates с emoji per-status: ⏳ PENDING, ✅ CONFIRMED, 📦 PROCESSING, 🚚 SHIPPED, 🎉 DELIVERED, ❌ CANCELLED. Для покупателя и продавца разные wording'и (например CANCELLED → «отменён» для buyer-view, «отменён покупателем» для seller-view).
- **Что сделано:**
  - `SellerNotificationService` расширен 2 методами: `notifyOrderStatusChanged({recipientChatId, recipientRole, orderNumber, storeName, oldStatus, newStatus, total, currency})` и `notifyChatMessage({recipientChatId, senderName, productTitle?, orderNumber?, storeName?, messagePreview})`. Оба gate на `features.telegramNotificationsEnabled` + non-empty chatId.
  - `TelegramNotificationProcessor` — 2 новых case'а с шаблонами на русском.
  - `confirm-checkout.use-case.ts` + `create-direct-order.use-case.ts` теперь зовут `notifyNewOrder` (был DEFINED but NEVER CALLED — закрыт latent bug).
  - `update-order-status.use-case.ts`: `notifyOrderStatusChanged` → buyer ВСЕГДА (по `User.telegramId`); → seller только когда buyer отменяет (PENDING→CANCELLED by BUYER role) — по `Seller.telegramChatId`.
  - `send-message.use-case.ts`: `notifyChatMessage` → ВТОРАЯ сторона треда. BUYER→SELLER через `seller.telegramChatId`, SELLER→BUYER через `user.telegramId`. Preview = первые 80 символов.
- **Repo extensions (additive, не ломают HTTP-контракты):**
  - `CheckoutRepo.findStoreWithSeller`: добавлены `name` + `seller.{telegramUsername, telegramChatId, telegramNotificationsActive}`.
  - `CheckoutRepo.findBuyerWithUser`: `user.telegramId` (для будущих use-case).
  - `OrdersRepo.findById`: `user.telegramId` + `store.seller.{...}`.
  - `ChatRepo.findThreadById`: `buyer.user.{phone, telegramId}` + `product.title` + `order.orderNumber`.
  Type definitions в репо синхронизированы с включениями.
- **Не сделано в этой сессии (можно добавить потом):**
  - In-app fallback (если у пользователя есть активный socket — пропускать TG, чтобы не дублировать). Сейчас всегда шлём TG.
  - HTML-рендер сообщений (parse_mode HTML) для жирного текста и ссылок. Сейчас plain text — гарантированно работает.
  - Buttons в TG: «Открыть заказ» / «Открыть чат» (deep link в TMA). Можно через inlineKeyboard позже.
- **Краевые случаи:**
  - Buyer без `telegramId` (зарегистрировался через web phone+OTP, не открывал TMA) — silent skip, ошибки не происходит.
  - Seller без `telegramChatId` (старая регистрация до OTP-через-бот) — silent skip уведомлений об отмене. New-order идут по `@username` который у seller обязателен.
- **Schema migration:** не требуется. Все нужные поля уже есть в `User.telegramId`, `Seller.telegramChatId`, `Seller.telegramUsername`, `Seller.telegramNotificationsActive`.

### Push: `main` → `api` ветка. Коммит `d83af03`.

---

## 2026-05-02 (сессия 45, Полат) — 4 задачи от себя (через Азима): chat error, double back, orders filters, media URLs

### ✅ [TMA-CHAT-ERROR-STATE-001] Toast «Ошибка загрузки сообщений» поверх загруженного thread list 🔴
- **Файлы:** `apps/tma/src/pages/seller/ChatPage.tsx`, `apps/tma/src/pages/buyer/ChatPage.tsx`
- **Симптом:** Скрин 1 от Полата — на seller chat list видно красную плашку «❌ Ошибка загрузки сообщений», а под ней 2 загруженных и кликабельных thread'а. Конфликт error/data state.
- **Корень:** При тапе на thread шёл fetch `/chat/threads/:id/messages`. Если он падал (404, deleted thread, network) — `.catch()` вызывал `showToast('❌ Ошибка загрузки сообщений', 'error')` + `navigate('/seller/chat', { replace: true })`. Глобальный ToastContainer держит уведомление 3-4 сек, успевая отрендериться поверх thread-list куда нас вернул navigate.
- **Что сделано:** Удалён `showToast` из `.catch()` обоих ChatPage — silent navigate-back. Если thread удалён или нет доступа — пользователь просто возвращается к списку, может пере-тапнуть.
- **Альтернатива (не выбрана):** держать ошибку inline в conversation view. Дороже по UX (двойной шаг) и нарушает invariant «тред в URL = тред загружен или его нет».

### ✅ [TMA-BUYER-CHAT-DOUBLE-BACK-001] Две кнопки «Назад» в chat thread 🟡
- **Файл:** `apps/tma/src/components/layout/InAppBackBar.tsx`
- **Симптом:** Скрин 4 от Полата — в chat thread сверху одновременно: pill `‹ Назад` (от `InAppBackBar`) и icon `‹` ниже (in-page back в header чата). Дубль.
- **Что сделано:** В `InAppBackBar` добавлен `HIDE_ON_PREFIXES = ['/buyer/chat/', '/seller/chat/']` — pill больше не показывается на роутах thread'ов чата. Остаётся только iconic in-page back (компактнее, ближе к message list — по design-системе TMA).
- **Затронуты также продавцовский чат**: фикс работает по prefix-матчу пути.

### ✅ [TMA-BUYER-ORDERS-FILTERS-001] Фильтры заказов по статусу в TMA buyer 🟡
- **Файл:** `apps/tma/src/pages/buyer/OrdersPage.tsx`
- **Контекст:** Скрин 3 от Полата — на TMA `/orders` сплошной список без фильтров. Полат хотел: отменённые / доставленные / в ожидании.
- **Паттерн:** `apps/web-buyer/src/app/(shop)/orders/page.tsx:24` — `FILTER_TABS` (ALL/PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED). Перенёс на TMA c небольшой адаптацией: `confirmed` chip покрывает и `CONFIRMED`, и `PROCESSING` (одинаковая UX-семантика для покупателя — «приняли в работу»).
- **Что сделано:**
  - Новые типы: `StatusFilter = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'`, массив `STATUS_FILTERS`, helper `matchesFilter(status, filter)`.
  - Новый header в TMA-стиле (gradient page-icon 📦 + gradient title + count «N заказов») — консистентно с StoresPage/DashboardPage.
  - Чипы фильтров с per-tab counts (как в seller/OrdersPage), горизонтальный скролл, orchid `rgba(168,85,247,...)` accent.
  - Empty state «Нет заказов в этой категории» когда фильтр пустой, но заказы есть.
  - `orders.map` → `orders.filter(matchesFilter).map` сохраняет existing expand-row логику (`expandedId`, lazy detail fetch).
- **«Избранное / понравившиеся» из задачи:** не статус заказа — отдельная фича `WISHLIST-CONTRACT-001` (открыта).

### ✅ [TMA-MEDIA-LOAD-001] Фото товаров не грузятся, серый плейсхолдер 🔴
- **Файлы:** `apps/api/src/modules/products/products.controller.ts:resolveImageUrl`, `apps/api/src/modules/stores/stores.controller.ts:resolveStoreImageUrls`, `apps/api/src/modules/cart/cart.mapper.ts:resolveMediaUrl`, `apps/api/src/modules/telegram/telegram-demo.handler.ts:resolveMediaUrl`, `apps/api/src/modules/media/services/r2-storage.service.ts:getPublicUrl`
- **Симптом:** Скрин 2 от Полата — все ProductCard на TMA buyer Home с пустым `<img>` (системная иконка «горы и солнце»). На всех 6 товарах. R2 в бэке подключен, ключи объектов есть.
- **Root cause:** Все 4 helper-метода `resolveImageUrl/resolveMediaUrl` для не-telegram бакетов делают `${process.env.STORAGE_PUBLIC_URL}/${objectKey}`. **На Railway api сервисе `STORAGE_PUBLIC_URL` не задан** → возвращает либо пустую строку, либо `undefined/<key>` (cart.mapper). `<img src="">` показывает плейсхолдер браузера.
- **Что сделано (defensive code):** Все 4 метода теперь fall back на `${APP_URL}/api/v1/media/proxy/<id>` когда `STORAGE_PUBLIC_URL` пуст. `r2Storage.getPublicUrl` теперь логирует чёткий warning «STORAGE_PUBLIC_URL is missing — image URLs will be broken» вместо тихо возвращать `undefined/<key>`. Добавлено strip trailing slash.
- **⚠️ Action required (Polat / infra):** установить `STORAGE_PUBLIC_URL` на Railway api сервисе. Без этого даже `/media/proxy/:id` redirect (302) сломан — он сам внутри использует `getPublicUrl`. Значение: ваш R2 public URL — либо `https://pub-xxxx.r2.dev` (default Cloudflare R2 public), либо ваш CDN-домен (`cdn.savdo.uz` если настроен).
- **Не сделано в этой сессии:** R2 CORS-конфиг и проверка private/public visibility бакета — это infra-задача.

### Push: main → tma, api ветки. Коммит `a2e1767`.

---

## 2026-05-01 (сессия 44, Азим) — Chat message order fix + Web-seller `/products` responsive layout

### ✅ [WEB-CHAT-ORDER-001] Сообщения в чате — старые сверху, новые снизу 🔴

- **Важность:** 🔴 (UX-баг, сразу заметен)
- **Дата:** 01.05.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/chat/page.tsx`, `apps/web-buyer/src/app/(shop)/chats/page.tsx`
- **Симптом:** Азим скинул скрин seller-чата — собственное сообщение «фывфы 00:25» вверху, входящее «ПРивет 23 апр.» внизу. Telegram-привычка обратная. Тот же баг латентно был и в buyer (тот же код-паттерн).
- **Корень:** `GET /chat/threads/:id/messages` возвращает массив отсортированный DESC (newest first — стандарт для cursor-based pagination через `before:`). Фронт делает `data?.messages ?? []` и шлёт в `messages.map(...)` без сортировки → новые сверху.
- **Что сделано:** В обоих чатах заменил `const messages = data?.messages ?? [];` на `useMemo` который копирует массив и сортирует ASC по `createdAt` (`[...raw].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))`). `useMemo` импорт добавлен. `useEffect([messages.length])` для scroll-to-bottom продолжает работать корректно — после переворота снизу окажется последнее сообщение, которое и хочется видеть.
- **Почему фронт-сорт, а не правка бэка:** Бэк = домен Полата. DESC + cursor `before:` — корректный API-паттерн для подгрузки старых при скролле вверх. Фронт сам решает порядок отображения. Ноль риска для контракта.
- **Проверка:** `pnpm exec tsc --noEmit` оба апа → EXIT 0.

### ✅ [WEB-SELLER-PRODUCTS-RESPONSIVE-001] Адаптивный список товаров seller 🟡

- **Важность:** 🟡
- **Дата:** 01.05.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/products/page.tsx`
- **Контекст:** Полат через Азима скинул задачу — «там типо список магазинов был / или товаров / если мы уже зашли в аккаунт … тему добавить и более адаптивно сделать». Аудит web-buyer / web-seller dashboard list-страниц показал единственного нарушителя: `/products` использовал `grid-cols-[1fr_auto_auto_auto_auto]` без `sm:`-префикса. На 360px (iPhone SE / большинство Android) 5 колонок съезжают, текст обрезается, кнопки наезжают друг на друга. Прямое нарушение `apps/web-seller/CLAUDE.md` («Fully responsive + touch-friendly»). web-seller `/orders` уже использует правильный паттерн (`flex flex-col` mobile + `sm:grid` desktop) — взял оттуда.
- **Что сделано:**
  - **Mobile (< sm):** карточка из двух строк. Верх: 48px thumbnail (первая `mediaUrls`, fallback — иконка `Package`) + название + variantCount badge + status badge справа + цена ниже. Низ: actions row (Скрыть/Опубликовать → кнопки copy web/TG как иконки 16px → CTA «Изменить» как accent-pill справа).
  - **Desktop (≥ sm):** 6-колоночный grid `[auto_1fr_auto_auto_auto_auto]` (добавлен thumbnail-столбец слева, остальные 5 как раньше). Header row `hidden sm:grid`. Skeleton загрузки тоже адаптивный (на mobile — 2 строки flex column, на desktop — 6-колоночный grid).
  - Иконка `Package` импортирована из `lucide-react` для empty thumbnail-плейсхолдера.
  - `<img>` (не `next/image`) — следую существующему паттерну `apps/web-seller/src/app/(dashboard)/orders/page.tsx`, потому что `next.config.ts` web-seller не имеет `images.remotePatterns` для R2-доменов, а добавлять — отдельная задача за рамками responsive-фикса.
- **Не тронуто:** счётчик «N товаров» в header показывает `products?.length` вместо `productsData?.total` (это страничный counter, не общий) — оставил как есть, не моя задача.
- **Проверка:** `pnpm exec tsc --noEmit` в `apps/web-seller` → EXIT 0.
- **Чем НЕ закрыта тема Полата:** «тема добавить» осталась open — без скрина/URL непонятно что именно «тема»; адаптивность сделал по самому очевидному кандидату. Если Полат имел в виду web-buyer logged-in home / `/orders` или TMA — те страницы уже responsive.
- **Socket conflict cross-role (тема 2 от Полата):** не трогал — бэк-`gateway` имеет guard'ы (`role === 'SELLER'` для `join-seller-room`, `sub === buyerId` для `join-buyer-room`), фронт уже использует динамический токен после `WEB-SOCKET-AUTH-CONTRACT-001`. Без шагов воспроизведения и явного симптома (401 / disconnect-loop / двойные сообщения / события не туда) лезть в socket-клиенты — гадание; домен gateway-кода вообще Полат.

---

## 2026-04-30 (вечер, сессия 42, Азим) — Post-pull sync + buyer prod brand-violet smoke-check

### ✅ [SESSION-42-SYNC] Подтверждение продакшен-deploy buyer без коммитов 🟢

- **Дата:** 30.04.2026 (короткая сессия, ~30 мин)
- **Файлы:** только чтение и memory; без изменений в коде
- **Что произошло за время паузы:**
  - `git fetch && git pull --ff-only origin/main`: `822aa30 → 5c66d72` (10 коммитов от Полата за 2-3 часа).
  - Полат закрыл свою очередь на 7 контракт-задач (`API-PRODUCT-CONTRACT-003`, `ADMIN-BROADCAST-XSS-CHECK-001`, `INFRA-FULL-RELOAD-NAV-001`, `API-BUYER-ORDERS-LIST-MAPPER-001`, `API-ORDER-CONTRACT-001`, `TYPES-VARIANT-REF-CONTRACT-001`, `API-CART-EMPTY-CONTRACT-001`) + TMA polish (gradient titles, lottie-react remove, layout fix). Force-push web-buyer (`9df5ca8`) и web-seller (`5ee845a`) — Railway автодеплои уже стартовали.
  - В коммите `b081b5e` Полат **сам закрыл** мою задачу `WEB-BUYER-CATEGORY-FILTER-DEFENSIVE-CLEANUP-001` — удалил defensive `.toLowerCase()` в `apps/web-buyer/src/lib/api/storefront.api.ts` (бэк теперь сериализует lowercase). Один файл, минус 2 строки.
- **Подтверждение прод-деплоя buyer (без локального запуска):**
  - DOM evaluate на https://savdo-builder-by-production.up.railway.app: header `<a>` «Savdo» и hero `<span>` «Savdo» оба с `color: rgb(124, 58, 237)` = `#7C3AED`. Brand violet token доехал до прода.
  - `<title>` корректный «Savdo — магазины в Telegram». 0 errors в первой партии console (до того как Playwright-сессия закрылась).
- **Что НЕ сделано:**
  - Settings 2-col, sidebar wordmark seller, chat edit/delete error UI требуют логина — Азим проведёт ручную проверку.
  - `WEB-SELLER-AUTOMOTIVE-CLEANUP-001` всё ещё открыта — ждёт ручной визуальной проверки `/products/create` от Азима.
- **Очередь Азима:** 1 ручная E2E проверка прода (4 области) + 1 cleanup задача после неё.

---

## 2026-04-30 (полудень, сессия 41, Азим) — Brand violet token + seller chat error UI + settings 2-col + mobile push toggle

### ✅ [WEB-BRAND-WORDMARK-UNIFY-001] Единый violet `#7C3AED` для логотипа Savdo на обоих фронтах 🟢
- **Дата:** 30.04.2026
- **Контекст:** Азим попросил «и seller и buyer объединял один цвет, не весь сайт одного цвета — например красивый фиолетовый». Раньше каждый app использовал свой accent оттенок (buyer `#7C3AED` violet-600 на light, seller `#A78BFA` violet-400 на dark) — оба были фиолетовые но визуально разные.
- **Что сделано:**
  - `apps/web-buyer/src/lib/styles.ts` — добавлен `brand: '#7C3AED'` рядом с accent.
  - `apps/web-seller/src/lib/styles.ts` — добавлен `brand: '#7C3AED'` (отдельный от accent — чтобы accent остался адаптивным светлым `#A78BFA` для контраста на dark slate-900).
  - Применён `colors.brand` в 5 местах wordmark «Savdo»:
    - `apps/web-buyer/src/components/layout/Header.tsx:34` (sticky header)
    - `apps/web-buyer/src/app/(shop)/page.tsx:55` (home hero)
    - `apps/web-seller/src/app/(auth)/login/page.tsx:81` (login title — раньше был textPrimary white)
    - `apps/web-seller/src/app/(dashboard)/layout.tsx:78` (sidebar wordmark — раньше accent `#A78BFA`)
    - `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx:590` (onboarding header — раньше хардкод `'#A78BFA'`)
- **Что НЕ тронуто:** copyrights `© 2026 Savdo` (footer) оставлены `textDim` — это служебный мелкий текст. Title теги в metadata тоже не трогаются — там просто string. Accent для CTA-кнопок остался адаптивным (buyer `#7C3AED` solid на белом, seller `#A78BFA` light на dark) — контрастная читаемость важнее визуальной идентичности кнопок.
- **Контраст:** `#7C3AED` на seller dark surface `#1E293B` ≈ 4.7:1 — в норме для bold wordmark text. Если визуально слишком тёмный — позже могу ввести `brandSoft` с другим оттенком для dark surfaces.

### ✅ [WEB-SELLER-CHAT-ERROR-FEEDBACK-001] Error UI вместо silent swallow в edit/delete операциях 🟡
- **Дата:** 30.04.2026
- **Контекст:** Азим написал что чат seller «не работает» в части edit/delete. Аудит кода показал что UI (MoreVertical menu, edit textarea, delete confirm modals) полностью реализован, бэк-контракты совпадают (senderRole enum match, MappedChatMessage shape от Полата `e9a8649`). Но **catch-блоки молча swallow'или ошибку**: если бэк возвращал FORBIDDEN / NOT_FOUND / BadRequestException (например edit window expired) — в UI ничего не отображалось, юзер думал «не работает».
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx`:
    - Добавлен `errorText(err, fallback)` helper для извлечения `response.data.message` из axios-ошибки.
    - В `handleDeleteThread` / `handleDeleteMessage` убран `setConfirm*(false)` из catch — modal остаётся открытым на ошибке (раньше silent dismiss).
    - В edit-mode (textarea + Save/Cancel buttons) добавлен `editMessageMutation.isError` блок — показывает реальное сообщение бэка под textarea (включая `Edit window expired (15 minutes)`).
    - В delete-message confirm modal — `deleteMessageMutation.isError` блок между описанием и кнопками.
    - В delete-thread confirm modal — то же для `deleteThreadMutation.isError`.
- **Что НЕ тронуто:** buyer `/chats` page — там тот же pattern silent swallow, но Азим жаловался конкретно на seller. Если выяснится что нужно симметрично — `apps/web-buyer/src/app/(shop)/chats/page.tsx` ждёт того же treatment.
- **Эффект:** в следующий раз когда что-то не работает — юзер увидит причину прямо в чат-UI вместо «нажимаю и ничего».

### ✅ [WEB-SELLER-SETTINGS-LAYOUT-001] 2-колоночный settings layout + mobile push toggle 🟢
- **Дата:** 30.04.2026
- **Контекст:** Азим попросил «улучшить настройки». Текущий layout — 5 секций в столбик, `max-w-xl` (узкая колонка ≈576px), на десктопе огромная пустота справа. Также `NotifPreferences` тип содержит `mobilePushEnabled` поле, но в UI его не было — только Telegram + web push toggles.
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx`:
    - `max-w-xl` → `max-w-5xl` (≈1024px) — на десктопе занимает разумную ширину.
    - Добавлен `grid grid-cols-1 lg:grid-cols-2 gap-5 items-start` wrapper. На моб (`< lg`) всё в одну колонку как раньше; на `lg+` — 2 колонки.
    - **Левая колонка** (form-heavy): `StoreSettingsSection` (cover, logo, name, desc, city, region, telegram link) + `ProfileSettingsSection` (имя, telegram, языки).
    - **Правая колонка** (compact controls): `DeliverySettingsSection` (select + amount) + `StoreCategoriesSection` (динамический список) + `NotifPreferencesSection` (toggles).
    - В `NotifPreferencesSection` добавлен 3-й `<ToggleRow>` для `mobilePushEnabled` с label «Push в мобильном» + description «Уведомления в Telegram-приложении продавца». `toggle()` функция уже принимала этот key.
- **Что НЕ тронуто:** мобильное представление (`< lg`) идентично прежнему — стек один-в-один. Никаких regressions для существующих пользователей с телефонов.

### ✅ [WEB-NOTIFICATIONS-USE-PACKAGES-TYPES-001] Импорт NotificationItem/InboxResponse из `types` 🟢
- **Дата:** 30.04.2026
- **Контекст:** Полат вынес `NotificationItem` + `InboxResponse` в `packages/types/src/api/notifications.ts` (новый файл, коммит `e9a8649`) и экспортировал из root `index.ts`. Локальные типы в `apps/web-{buyer,seller}/src/lib/api/notifications.api.ts` стали дубликатами + были subset (без `type`, `data`, `readAt` полей которые шлёт бэк).
- **Файлы:**
  - `apps/web-buyer/src/lib/api/notifications.api.ts` — `import type { NotificationItem, InboxResponse } from 'types';` + `export type { NotificationItem, InboxResponse };` (re-export для обратной совместимости existing import paths). Удалены 17 строк локальных interface deklarat.
  - `apps/web-seller/src/lib/api/notifications.api.ts` — то же. `UnreadCountResponse` оставлен локальным (он не в packages/types — только локальный wrapper для `/inbox/unread-count`). `NotifPreferences` тоже оставлен (не в типах, но мог бы быть).
- **Что не тронуто:** `apps/web-{buyer,seller}/src/app/.../notifications/page.tsx` продолжают `import type { NotificationItem } from '.../notifications.api'` — работают через re-export. Канонический тип имеет дополнительные поля (`type`, `data`, `readAt`) — page.tsx использует только subset, совместимо.

### Не пофикшено в этой сессии (требует данных от Азима)

- 🔴 **Чат seller — original repro** — без скриншота / Network status дальше edit/delete не диагностирую. Сейчас добавлен error UI который покажет причину при следующем «не работает».
- 🔴 **Analytics seller — «не работает»** — без логов с прода не могу сказать 401/404/5xx vs empty state (`views=0`). Endpoint `/analytics/seller/summary` существует на бэке (домен Полата). Если 5xx — задача Полату.

---

## 2026-04-30 (утро, сессия 41, Азим) — Sync с двойным push Полата `e9a8649`+`141c0a5`+`2a6477c`

### ✅ [WEB-SYNC-POLAT-CONTRACT-FIXES-001] Откат локальных дублирующих правок web-seller, синхронизация с 5 контракт-фиксами Полата 🟡
- **Дата:** 30.04.2026
- **Контекст:** Сессия 40 закончилась с 6 modified локальных файлов (3 в web-seller + 3 в analiz). На паузу Полат запушил **3 коммита подряд** в main:
  1. `e9a8649` (29.04 21:30) — `fix: contract serialization` — закрыл 5 контракт-задач из моей очереди (`API-CATEGORY-FILTERS-CASE-001`, `API-NOTIFICATIONS-INBOX-CONTRACT-001`, `API-CHAT-MESSAGE-CONTRACT-001`, `API-PRODUCT-CONTRACT-002`, `API-SELLER-ORDERS-LIST-MAPPER-001`). Plus вынес `NotificationItem` + `InboxResponse` в `packages/types/src/api/notifications.ts` (новый файл).
  2. `141c0a5` (29.04 21:42) — `perf(tma)`: persistent layout, nested routes — TMA only.
  3. `2a6477c` (29.04 21:57) — `fix(tma+web-seller)`: JSX fragments в TMA early-returns + GlobalCategory `name → nameRu` в web-seller. **Те же 3 файла что я локально модифицировал**, **с идентичным diff** (Полат сделал в параллель ту же работу).
- **Что сделано:**
  - `git diff origin/main -- apps/web-seller/...` показал **пустой** diff → мои локальные правки оказались идентичны Полатовскому `2a6477c`. Дублирующая работа.
  - `git restore apps/web-seller/` — откат локальных правок (не нужны — уже на origin/main).
  - `git pull --ff-only origin main` — fast-forward `c69a62a..2a6477c` (3 коммита). Pull прошёл чисто, без конфликтов.
  - `analiz/tasks.md` — 5 закрытых Полатом контракт-задач перенесены из таблицы открытых в новую секцию `## ✅ Закрыто Полатом в e9a8649 + 2a6477c`. Добавлены 2 новые низкоприоритетные задачи Азима — `WEB-BUYER-CATEGORY-FILTER-DEFENSIVE-CLEANUP-001` (idempotent toLowerCase можно убрать) и `WEB-NOTIFICATIONS-USE-PACKAGES-TYPES-001` (заменить локальный тип на импорт).
  - `analiz/done.md` — эта запись + сохранена предыдущая сессия 40.
- **Файлы:** только `analiz/done.md` + `analiz/tasks.md` modified. Никакого кода в моём домене не трогалось.
- **Урок:** при параллельной работе Полата (его сессия в Sonnet 4.6 вечером 29.04 пока я был на паузе) обязательно `git fetch && git diff origin/main` ДО того как push'ить — иначе можно зачерчить duplicate work. В этот раз обошлось — мы оба сделали идентичную правку, конфликт был бы только если разные подходы.
- **Статус по моей очереди после sync:** были 5 задач на Полата (3🔴 + 2🟡) — все закрыты. Открытыми остаются только 7 🟢 + 1 🟡 (`ADMIN-BROADCAST-XSS-CHECK-001`). У Азима — 2 🟢 cleanup задачи (defensive) + основная — E2E прода.

---

## 2026-04-30 (утро, сессия 40, Азим) — Post-pull adaptation web-seller к новому GlobalCategory

### ✅ [WEB-SELLER-CONTRACT-NAMERU-MIGRATE-001] Удалён локальный адаптер GlobalCategory; consumers переведены на nameRu 🟡
- **Дата:** 30.04.2026
- **Контекст:** Полат запушил `c69a62a` (29.04 после-обеда), который наконец обновил `packages/types#GlobalCategory` к реальной форме backend-ответа (`{id, parentId, nameRu, nameUz, slug, isActive, sortOrder, createdAt}`) — закрывая `API-GLOBAL-CATEGORY-CONTRACT-001`. Тот же коммит дополнительно сменил signature `getSellerProducts` на envelope `{ products, total }`. После `git pull` в `apps/web-seller` остался устаревший адаптер `nameRu → name` (раньше был защитой от рассинхронизации) — теперь он **создаёт невалидный GlobalCategory** (не хватает `parentId`/`isActive`/`createdAt`/`nameRu`/`nameUz`, имеет ненужный `name`/`iconUrl`). Это компилирующая ошибка TS как только страница импортируется.
- **Файлы:**
  - `apps/web-seller/src/lib/api/seller.api.ts` — удалён `type ApiGlobalCategory` + комментарий, `getGlobalCategories()` теперь напрямую возвращает `apiClient.get<GlobalCategory[]>` без mapping.
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — `isHiddenCategory(cat: { slug; nameRu })`, regex теперь матчит `cat.nameRu`. Select options `label: c.nameRu`. `pickedCategory.name` → `pickedCategory.nameRu` (placeholder + accent-плашка).
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — те же изменения + native `<option>{cat.nameRu}</option>` для secondary categorу-select. (`useStoreCategories.name` оставлен — у `StoreCategory` поле `name` есть на бэке.)
- **Что не тронуто:** `useSellerProducts` envelope-фикс (`{products, total}`) уже задеплоил Полат прямо в `apps/web-seller/src/app/(dashboard)/products/page.tsx` в том же коммите. Web-buyer не пострадал — он уже читал `nameRu` через свой локальный тип в `storefront.api.ts` (плюс `[id]/page.tsx:256` использует `product.globalCategory.nameRu`). `apps/web-seller/src/app/(dashboard)/products/create/page.tsx:60` `isHiddenCategory` regex `/(авто|мотоц|avtomo|mototsik)/i` оставлен — теперь работает на `nameRu` (русский), что по сути единственный язык лейблов сейчас. Можно будет удалить когда визуально подтвердится что Полат вычистил автомобильные категории из seed (см. открытая `WEB-SELLER-AUTOMOTIVE-CLEANUP-001`).
- **Pull diff:** `488932c..c69a62a` (1 коммит Полата, 26 файлов; затронуты в моём домене 2 файла — Полат сам адаптировал products list page).

---

## 2026-04-29 (поздно вечер) — INFRA: deploy buyer через service-ветку

### ✅ [INFRA-DEPLOY-BUYER-MERGE-001] Buyer revamp в проде 🔴
- **Дата:** 29.04.2026
- **Что случилось:** Все 11 коммитов сессии 39 (revamp + WS auth + security headers + контракт-фиксы + ChatComposer auth-gate) лежали в main, но прод не обновлялся. Ранее (27.04, Полат `d811041`) была введена стратегия «один сервис = одна ветка»: `savdo-builder-by` подключён к `origin/web-buyer`, не к `main`. Я ошибочно пушил в main и делал empty-commit'ы в надежде триггернуть Railway watch — бесполезно, Railway смотрит другую ветку.
- **Что сделано:** `git checkout web-buyer && git merge main` → merge `cbfe064`, без конфликтов (root `railway.toml` ветки сохранил свой `apps/web-buyer/Dockerfile`). Push: `f184d0c..cbfe064  web-buyer -> web-buyer`. Railway автоматически собрал и задеплоил. Азим подтвердил: «всё работает». Buyer revamp + все фиксы сессий 36-37 теперь на проде.
- **Файлы:** только git-операции, без изменений кода. Локальный артефакт `railway.toml` (TMA-вариант) удалён.
- **Заметка:** workflow зафиксирован в `~/.claude/projects/.../memory/feedback_deploy_branches.md` и в `analiz/logs.md` под ID `INFRA-DEPLOY-BRANCHES-001`. Web-seller — без изменений, на main для seller новой работы нет.

---

## 2026-04-29 (вечер) — Сессия 39 (Азим) — Buyer revamp: glass→light, mobile-only→responsive

> **Контекст:** Азим попросил перевести buyer как seller (solid surfaces). Обсудили варианты, выбрали A2-light (инверсия от seller — белый/cream фон, violet акцент). Дополнительно — растянуть на весь экран (раньше mobile-only по `max-w-md`). Делалось в одной волне: pilot storefront + 2 баг-фикса до этого, потом полная миграция остальных 8 страниц.

### ✅ [BUYER-REVAMP-FOUNDATION-001] Light tokens + globals + (shop) layout 🟡
- **Дата:** 29.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/styles.ts` — новая палитра `colors` (bg #FAFAF7, surface #FFFFFF, accent #7C3AED), pre-set surfaces (`card`, `cardMuted`, `pill`, `pillActive`, `ctaPrimary`, `ctaSoft`, `inputStyle`). Старые `glass`/`glassDim`/`glassDark` оставлены как deprecated alias на light surfaces для нерефакторнутых страниц (потом убрать).
  - `apps/web-buyer/src/app/globals.css` — `:root --background: #FAFAF7`, `color-scheme: light` (forced), убран `prefers-color-scheme: dark` override, добавлена утилита `.scrollbar-none`.
  - `apps/web-buyer/src/app/(shop)/layout.tsx` — заменён фиолетовый gradient на light bg + textPrimary.
- **Запушено в `54a5f8a`.**

### ✅ [BUYER-REVAMP-PILOT-001] Pilot storefront /[slug] — full responsive light 🟡
- **Дата:** 29.04.2026
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` — новый layout: cover hero (h-40 sm:h-56 md:h-72), overlap-card с лого+имя+TG CTA, sticky-bar с категориями, 2-column grid `lg:grid-cols-[260px_1fr]` (sidebar фильтров + grid товаров).
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — solid white card, hover lift, large violet price + «сум».
  - `apps/web-buyer/src/components/store/ProductsWithSearch.tsx` — responsive grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`.
  - `apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx` — light pills, light select dropdown.
  - `apps/web-buyer/src/components/layout/Header.tsx` — переписан под light + responsive nav-icons на md+.
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — `md:hidden`, light surface, safe-area-inset-bottom.
- **Запушено в `54a5f8a`.**

### ✅ [BUYER-REVAMP-FULL-001] Полная миграция остальных 8 страниц + 2 компонентов 🟡
- **Дата:** 29.04.2026 (вечер, без присутствия Азима)
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/page.tsx` — home: light hero, slug input, 2-col quick links на sm+.
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — product detail: 2-column на lg+ (gallery + sticky info), single-column на mobile, inline desktop CTA (sticky на mobile).
  - `apps/web-buyer/src/app/(minimal)/cart/page.tsx` — light cart rows, max-w-3xl, sticky CTA в углу на md+.
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — light form sections, max-w-2xl, OTP 6-digit + numeric-only.
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — split-view на md+ (320px list + chat-pane), violet bubbles для buyer, white-with-border для seller, action menu всегда видна (opacity-60).
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx` — table-style cards, max-w-4xl, status pills с solid color/bg.
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — light progress steps, store card, delivery section.
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx` — light avatar+phone card, link rows с chevrons.
  - `apps/web-buyer/src/app/(shop)/notifications/page.tsx` — light read/unread (accentMuted bg для unread).
  - `apps/web-buyer/src/components/auth/OtpGate.tsx` — переписан под light + 6-digit input.
  - `apps/web-buyer/src/components/home/RecentStores.tsx` — light tile cards с hover lift.
- **Visual contract:** все surfaces = #FFFFFF + 1px rgba(15,17,21,.10) border. Text: textPrimary/textMuted/textDim. Accent (price/CTA/active): solid violet. Status colors: solid 600-shades. Bottom nav скрыт на md+. Sticky CTAs на md+ перебрасываются в bottom-right corner.
- **Запушено в `0d826a4`.**

---

## 2026-04-29 — Сессия 38 (Азим) — Pre-MVP audit + security hardening

> **Контекст:** Полат сказал "проектни уже MVP чкарш кере", попросил полный аудит платформы перед запуском. Я разобрал его список (audit OTP, рендеринг, безопасность nmap/OWASP, постраничный inventory, реверс конкурентов) и сделал то что в моём домене (`apps/web-buyer` + `apps/web-seller`). Активные атаки/сетевой пентест (nmap, OWASP scan) — не делал, это инфра-домен Полата и требует deployed URL + Burp/ZAP.

### ✅ [MVP-AUDIT-001] Статический аудит web-buyer + web-seller — security/render/OTP/inventory
- **Важность:** 🔴 — pre-launch verification.
- **Дата:** 29.04.2026
- **Что проверено:**
  1. **Security:** XSS-сink'и (`dangerouslySetInnerHTML`/`eval`/`innerHTML`/`document.write`) — **0** в моём домене. Единственное использование `dangerouslySetInnerHTML` — `apps/admin/src/pages/BroadcastPage.tsx:41` (домен Полата, flag в tasks). Все `target="_blank"` (7 ссылок) имеют `rel="noopener noreferrer"`. Token storage — localStorage (известный XSS-риск, но без других sink'ов = принимаемый для MVP). Refresh-interceptor паттерн правильный (`_retry`, dedupe via promise, skip auth-endpoints). AuthContext localLogout закрывает loop.
  2. **Rendering:** **0** `window.location.*` в моём домене (есть в admin + tma — flag для Полата). **0** `<a href>` для внутренней навигации. SSR где нужно: `[slug]/page.tsx` (storefront) — full RSC + `generateMetadata` с OG tags; `[slug]/products/[id]/layout.tsx` — RSC layout с `generateMetadata` (Telegram preview product-ссылок работает). Прочие 9/10 buyer pages + 12/14 seller pages — `'use client'`, что OK для auth-walled / transactional. `<img>` 0 в buyer; 2 в seller (image-uploader blob preview — eslint-disabled OK; orders/page.tsx:168 — micro).
  3. **OTP-флоу:** request→verify→login правильный pipe. Phone validation — buyer OtpGate без `+998` префикса (юзер сам вводит), seller login добавляет автоматически — UX-инконсистенция, не баг. Backend (после `f3666db`) ждёт **6-значный OTP** — оба фронта позволяли submit с 4 (баг, фикснул).
  4. **Inventory:** **0** `TODO|FIXME|MOCK|stub|@ts-ignore|"Скоро"|"В разработке"|disabled={true}` в моём домене. Это значит фичи не полу-сделаны, нет visible incomplete UI. По factual readiness — **MVP по фронту готов** (модулу e2e-теста после deploy).
- **MVP-блокер не моего домена:** `INFRA-RAILWAY-WATCH-PATTERNS-001` — `savdo-builder-by`/`-sl` Watch Patterns в Railway dashboard указывают на `apps/tma/**`, поэтому пуши в web-buyer/web-seller игнорируются. Сессии 35–36 + сегодняшние security/OTP-фиксы НЕ в проде. Без фикса dashboard'а Полатом — MVP не релизится.

### ✅ [WEB-SECURITY-HEADERS-001] Глобальные security-заголовки на HTML-ответах
- **Важность:** 🔴 — clickjacking protection отсутствовал на login странице seller'а и **на всём web-buyer** (middleware не существовал).
- **Дата:** 29.04.2026
- **Корень:** Полат добавил `helmet` на API в `7cdb4c6` — это headers на API responses (JSON). HTML-страницы Next.js без своих headers оставались без `X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`. В seller `middleware.ts:20-22` `PUBLIC_PATHS = ['/login', '/onboarding']` пропускались БЕЗ headers — login можно было встроить в `<iframe>` и фишить OTP. В buyer вообще не было middleware.
- **Файлы:**
  - `apps/web-buyer/next.config.ts` — добавлен `async headers()` возвращающий 5 заголовков для `source: "/:path*"`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`. Применяется ко всем HTML-ответам.
  - `apps/web-seller/next.config.ts` — то же. `middleware.ts` оставлен как есть (он также ставит X-Frame/X-Content-Type для protected branch — дубль безвреден, value тот же; middleware можно упростить позже когда будет auth-redirect через cookie).
- **Известный gap (не блокер MVP):** CSP не добавлен (требует точного списка allowed sources: API_URL, R2 buckets, Telegram media, Google Fonts, etc — большая работа, риск ломки в проде). HSTS preload не добавлен (требует submission в Chrome HSTS list). Эти задачи на post-MVP.

### ✅ [WEB-OTP-LENGTH-001] OTP-формы: code length 4 → 6
- **Важность:** 🟡 — после `f3666db` (admin) бэк отдаёт 6-значный OTP, а web-buyer + web-seller форма позволяла submit с 4 цифрами. Юзер увидел бы "Неверный код" на 4-значном вводе.
- **Дата:** 29.04.2026
- **Файлы:**
  - `apps/web-buyer/src/components/auth/OtpGate.tsx` — input: `inputMode="numeric"`, `placeholder="000000"` (было `"0000"`), `onChange` теперь чистит non-digits через `.replace(/\D/g, '')`. Кнопка disable: `code.length < 6` (было `< 4`).
  - `apps/web-seller/src/app/(auth)/login/page.tsx` — `handleVerify()` ранний return при `length < 6` (было `< 4`). Кнопка disable + active-style: `length >= 6` (было `>= 4`).

---

## 2026-04-29 — Сессия 37 (Азим) — превентивный аудит контрактов + 3 фронт-фикса + WS JWT auth

### ✅ [AUDIT-CONTRACT-DRIFT-001] Превентивный аудит контрактов фронт ↔ бэк
- **Важность:** 🟡 — system-уровневая профилактика. Метод: запустил 2 параллельных агента (curl на storefront + чтение mapper-ов на protected). Найдено 14 расхождений, из них 2 уже в проде ломали UX, 1 в коде но silent для seller, 11 — landmines. Записал в `tasks.md` для Полата.
- **Дата:** 29.04.2026
- **Зачем:** паттерн контракт-брейков повторился дважды (ChatThread Sprint 31, GlobalCategory fb79db2). Хочется не дожидаться третьего инцидента.
- **Файлы:** `analiz/logs.md` (полный список), `analiz/tasks.md` (11 новых ID Полату).
- **Покрытие:** ~30 endpoints — auth, storefront (stores/products/categories/filters), chat, orders, cart, notifications, media, seller profile/store, products.

### ✅ [WEB-NOTIFICATIONS-INBOX-PARSE-001] Фикс пустого inbox в обоих апах
- **Важность:** 🔴 — продавцы и покупатели видели пустой `/notifications` хотя бэк возвращал записи. Это и есть корень открытой задачи `/notifications диагностика` из очереди Азима.
- **Дата:** 29.04.2026
- **Корень:** Бэк возвращает `{notifications, total, unreadCount, page, limit}` (см. `apps/api/src/modules/notifications/use-cases/get-inbox.use-case.ts:36`). Локальный тип `InboxResponse` на фронте объявлял `{data, meta}` → `data.data` всегда `undefined` → React Query клал `undefined` в кэш → useNotifications() возвращал пустой массив.
- **Файлы:**
  - `apps/web-buyer/src/lib/api/notifications.api.ts` — `InboxResponse` обновлён под реальную форму, `getInbox()` читает `data.notifications ?? []`.
  - `apps/web-seller/src/lib/api/notifications.api.ts` — то же.
- **Полату записано:** `API-NOTIFICATIONS-INBOX-CONTRACT-001` 🔴 — желательно вынести `InboxResponse` в `packages/types/src/api/notifications.ts` (новый файл), сейчас тип задублирован в обоих апах + не экспортирован `unreadCount` (полезное поле для badge).

### ✅ [WEB-CATEGORY-FILTERS-CASE-001] Фикс «фильтры всегда text input» на витрине магазина
- **Важность:** 🔴 — все category-фильтры в buyer storefront рендерились через fallback (text input), select-dropdown и boolean-toggle никогда не показывались.
- **Дата:** 29.04.2026
- **Корень:** `GET /storefront/categories/:slug/filters` шлёт `fieldType` как Prisma uppercase enum (`"SELECT"`, `"NUMBER"`, `"TEXT"`, `"BOOLEAN"`). Локальный тип в `apps/web-buyer/src/lib/api/storefront.api.ts:11` объявлен lowercase. `CategoryAttributeFilters.tsx:185,228,257` сравнивает `filter.fieldType === "select"` — никогда не true.
- **Файлы:**
  - `apps/web-buyer/src/lib/api/storefront.api.ts` — `getCategoryFilters` нормализует `fieldType.toLowerCase()` на лету. Comment объясняет почему. Type literal расширен `string` чтобы позволить uppercase в transit.
- **Полату записано:** `API-CATEGORY-FILTERS-CASE-001` 🔴 — добавить `@Transform(value => value.toLowerCase())` в DTO или экспортить enum в lowercase.

### ✅ [WEB-SOCKET-AUTH-CONTRACT-001] Динамический токен в handshake socket.io
- **Важность:** 🟡 — превентивный фикс контракт-брейка от Полата (`7cdb4c6` security: WS JWT auth). Без него чат и order-уведомления отвалились бы через ~30 мин после первого подключения.
- **Дата:** 29.04.2026
- **Корень:** В `7cdb4c6` бэк начал валидировать JWT на каждом `handleConnection`. Наш socket-singleton в обоих web-апах хранил токен на момент создания (`auth: { token: getAccessToken() }`). После refresh access-токена (axios interceptor `client.ts`) на любой reconnect — старый JWT, бэк дроп, infinite reconnect-loop.
- **Файлы:**
  - `apps/web-buyer/src/lib/socket.ts` — `auth` теперь callback-функция: `(cb) => cb({ token: getAccessToken() ?? '' })`. Socket.io-client v4.8.3 вызывает её на каждый handshake (initial + reconnect), всегда свежее значение из localStorage.
  - `apps/web-seller/src/lib/socket.ts` — то же.
- **Почему callback-форма а не tma-style `connectSocket()`:** TMA пофиксили через ручной helper, который сбрасывает `socket.auth` перед `socket.connect()`. Это требует менять 4 точки подключения (`useBuyerSocket`, `useSellerSocket`, оба `useChatSocket`). Callback-форма — один io-options, ноль изменений в hooks, и плюс автоматически работает на ре-handshake после network blip (а не только на explicit connect).
- **Backwards-compat:** старый бэк (текущий прод, до Railway-фикса) игнорирует `auth.token` в handshake — фронт-фикс не ломает.
- **Не задеплоено:** упирается в `INFRA-RAILWAY-WATCH-PATTERNS-001` — `savdo-builder-by`/`-sl` не подхватывают пуши пока Полат не правит Settings → Build в Railway dashboard. Когда деплой пройдёт — smoke-test: 35 мин idle → сообщение в чате → должно работать.
- **Также:** TMA-апа (`apps/tma/src/lib/socket.ts`) использует свой `connectSocket()`-паттерн — не трогаю, домен Полата. Унификация — когда-нибудь общим PR.

---

## 2026-04-26 — Сессия 36 (Азим) — 3 фичи + 1 hotfix контракт-брейка

### ✅ [WEB-SELLER-CATEGORY-CONTRACT-FIX-001] Hotfix: dropdown категорий показывался пустым
- **Важность:** 🔴 — критический баг продакшена. Продавцы не могли выбрать глобальную категорию при создании товара (Select показывал пустые строки).
- **Дата:** 26.04.2026 (диагностика по жалобе Азима после деплоя `787f04d`)
- **Корень:** Бэк (видимо после `fb79db2` Sprint 31) поменял ответ `GET /storefront/categories` — раньше `{name}`, теперь `{nameRu, nameUz, parentId, isActive, ...}` (мультиязычность). Тип `GlobalCategory` в `packages/types/src/api/stores.ts` остался старый (`name: string`). Web-seller `useGlobalCategories` → `getGlobalCategories` → `Select.options.map(c => ({label: c.name}))` → label = undefined → Select показал 30 пустых строк.
- **Web-buyer не сломался** потому что у них свой локальный тип в `apps/web-buyer/src/lib/api/storefront.api.ts` (`nameRu`/`nameUz` напрямую) — адаптировались раньше Sprint 31 (записано в `WEB-014` в CLAUDE.md как «pending Полатр adding it to packages/types»).
- **Файлы:**
  - `apps/web-seller/src/lib/api/seller.api.ts` — `getGlobalCategories` теперь делает локальный mapping `nameRu → name` через тип `ApiGlobalCategory`. После того как Полат обновит тип в `packages/types` — убрать адаптер.
  - `analiz/tasks.md` — добавлена `API-GLOBAL-CATEGORY-CONTRACT-001` 🟡 для Полата (обновить тип в packages/types, поддержать `nameRu`/`nameUz` мультиязычность, может имеет смысл иерархия по `parentId` — сейчас 30 leaf-категорий показываются плоско).
- **Диагностика без браузера:** прямой `curl https://savdo-api-production.up.railway.app/api/v1/storefront/categories | python -c "..."` → увидел `keys: ['id', 'parentId', 'nameRu', 'nameUz', 'slug', 'isActive', 'sortOrder', 'createdAt']`, 30 категорий, `parentId` есть у всех. Сразу стало ясно что у поля `name` нет, фронт ожидал старую форму.
- **Запушено:** `92b69cf` (после `git pull --rebase` из-за параллельных пушей Полата). Railway пересобрал web-seller.

### ✅ [WEB-PRODUCT-DISPLAYTYPE-001] Selector типа отображения товара + рендер витрины
- **Важность:** 🟡 — продавцы получают визуальный контроль над презентацией товара. Полат добавил `Product.displayType: 'SLIDER' | 'SINGLE' | 'COLLAGE_2X2'` в типы и DTO в `65c6795`. Теперь wire-up на фронте.
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-seller/src/components/display-type-selector.tsx` — **новый**: 3 кнопки SINGLE/SLIDER/COLLAGE_2X2 в `grid-cols-3 gap-2`. Каждая = маленькое svg-превью (квадрат / квадрат+точки / 2×2 grid) + label. Активная — accent-фон + accent-border. Снизу hint-текст актуального варианта (раскрывает что это, для каких товаров подходит). Solid-surface tokens из `lib/styles`.
  - `apps/web-seller/src/lib/api/products.api.ts` — `createProduct()` + `updateProduct()` теперь принимают `displayType?: ProductDisplayType` (импорт типа из `'types'`).
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — `CreateProductForm` расширен `displayType: ProductDisplayType`, default `'SINGLE'`. `watch('displayType')` для контролируемого селектора. `<DisplayTypeSelector value={displayType} onChange={(v) => setValue('displayType', v, { shouldDirty: true })}>` вставлен между фото-блоком и Global category. В onSubmit передаётся `displayType: values.displayType`.
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — то же. В `useEffect(reset)` подгружается `displayType: product.displayType ?? 'SINGLE'`. Если бэк-fetch не вернёт displayType (legacy товары) — fallback на SINGLE.
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — рендер картинок с учётом `product.displayType ?? 'SINGLE'`. `mediaUrls` теперь читается как массив (с fallback на старый `images[0].url` для совместимости с какими-то response shapes). **SINGLE** — одна картинка через `<Image fill object-cover>` (как раньше). **SLIDER** (`mediaUrls.length > 1`) — первая картинка + decorative dots внизу карточки (макс 5 точек, первая — 10px wide accent, остальные 5px white-55%, с тенью `boxShadow: '0 0 4px rgba(0,0,0,0.35)'`). Сигнализирует «можно посмотреть больше фото» — настоящий swipe на карточке не делаем (это мини-плитка). **COLLAGE_2X2** (`mediaUrls.length >= 2`) — `<CollageGrid urls={mediaUrls} alt={...}>`: всегда 4 ячейки в `grid-cols-2 grid-rows-2 gap-px`, недостающие фото = пустая ячейка с `<ShoppingBag size={14}>` иконкой accent-color на 35% opacity. zIndex on the badges fixed (variants badge zIndex:1, dots zIndex:2, out-of-stock overlay zIndex:3 — overlay перекрывает всё корректно).
- **Что НЕ сделано:** detail-страница товара (`/[slug]/products/[id]`) уже имеет полноценный слайдер с swipe + thumbnail row + точки — работает универсально для всех `mediaUrls.length > 1`. `displayType` там не применяется (можно было бы для COLLAGE показать grid вместо слайдера, но это требует дизайн-обсуждения — оставил как есть).

### ✅ [WEB-SELLER-AVATAR-WIRE-001] Wire-up загрузки аватара продавца

### ✅ [WEB-SELLER-AVATAR-WIRE-001] Wire-up загрузки аватара продавца
- **Важность:** 🟡 — UX completion: страница `/profile` сессии 35 имела disabled camera-кнопку с tooltip «Скоро» — теперь работает после того как Полат закрыл `API-SELLER-AVATAR-001` в `0b2de22`.
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/seller.api.ts` — добавлена `uploadSellerAvatar(file: File)`: multipart POST `/media/seller/avatar`, возвращает `{ avatarUrl: string | null }`. Соответствует контракту `MediaController.uploadSellerAvatar` (Полат).
  - `apps/web-seller/src/hooks/use-seller.ts` — добавлен хук `useUploadSellerAvatar()`. После успеха обновляет `['seller', 'profile']` query data inline через `setQueryData` (мерджит `avatarUrl` в существующий `SellerProfile`), без рефетча.
  - `apps/web-seller/src/app/(dashboard)/profile/page.tsx` — снят `disabled` с camera-кнопки, добавлены `useRef<HTMLInputElement>` + hidden `<input type="file">` + `useState<string|null>` для avatarError. Аватар-кнопка стала `<button>` (вся область кликабельна), при `profile.avatarUrl` рендерит `<Image src={avatarUrl} unoptimized>`, иначе букву. Loader2 спиннер во время `mutation.isPending` (overlay поверх). Валидация: только `image/jpeg|png|webp`, ≤10 МБ — иначе локальная ошибка под телефоном. Camera-кнопка теперь активная: title «Изменить фото» / «Добавить фото».
- **Что сделано (UX):** Клик по аватару ИЛИ по camera-иконке открывает file-picker. После успеха — `<Image>` обновляется мгновенно (без рефетча), иначе — красный текст «Не удалось загрузить фото». Скопировано из buyer-аватара (тот же pattern, та же mime-валидация, тот же `e.target.value = ''` чтобы можно было выбрать тот же файл повторно).

### ✅ [WEB-CHAT-EDIT-DELETE-001] Wire-up удаления треда + edit/delete сообщений в обоих чат-апах
- **Важность:** 🟢 — UX completion: в сессии 35 я записал 3 задачи Полату (`API-CHAT-DELETE-THREAD-001`, `API-CHAT-DELETE-MESSAGE-001`, `API-CHAT-EDIT-MESSAGE-001`) и не делал UI-заглушек по правилу `feedback_dont_remove_without_confirm`. Полат закрыл всё в `0b2de22` — теперь wire-up.
- **Дата:** 26.04.2026
- **Endpoints (Полат):**
  - `DELETE /chat/threads/:id` (204) — soft-delete per role (`buyerDeletedAt`/`sellerDeletedAt`)
  - `DELETE /chat/threads/:tid/messages/:mid` (204) — soft (`isDeleted=true`, `body=null`, `deletedAt`), только автор
  - `PATCH /chat/threads/:tid/messages/:mid` body `{ text }` — окно 15 мин с `createdAt`, только автор. Возвращает `{ id, threadId, text, senderRole, editedAt, createdAt }`
- **Тип `ChatMessage` обновился (`packages/types/src/api/chat.ts`):** добавлены `editedAt: string | null` и `isDeleted: boolean` (Полат).
- **Файлы:**
  - `apps/web-seller/src/lib/api/chat.api.ts` + `apps/web-buyer/src/lib/api/chat.api.ts` — добавлены `deleteThread(id)`, `deleteMessage(tid, mid)`, `editMessage(tid, mid, text)`. Возвращает `Promise<ChatMessage>` для editMessage.
  - `apps/web-seller/src/hooks/use-chat.ts` + `apps/web-buyer/src/hooks/use-chat.ts` — новые хуки: `useDeleteThread()` (после успеха удаляет тред из `chatKeys.threads` cache + `removeQueries` для `chatKeys.messages(id)`), `useDeleteMessage(threadId)` (optimistic update — мерджит `isDeleted: true, text: ''` в нужное сообщение в `chatKeys.messages` cache, плюс invalidate threads чтобы обновить lastMessage), `useEditMessage(threadId)` (мерджит `text + editedAt` в кэш сообщений после ответа бэка, invalidate threads).
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — `ChatWindow` получил `onDeleted` callback, расширен state (`editingId`, `editingText`, `openMenuId`, `confirmDeleteThread`, `confirmDeleteMsg`). Outer div стал `relative` для overlay-modals. Header: добавлена trash-кнопка `Удалить чат` рядом с `Закрыть чат`. Confirm modals (overlay) для thread + message. Render сообщения переписан: на собственных (isSeller) появляется `MoreVertical`-кнопка справа от bubble (opacity 0 → group-hover/focus = 100), popover-меню «Редактировать» (только если `Date.now() - createdAt < 15 мин`) + «Удалить». Edit-mode заменяет bubble на textarea (`minWidth: 180`) + Save/Cancel кнопки. `m.isDeleted` → серая italic-плашка «Сообщение удалено». `m.editedAt` → префикс «изменено · » перед timestamp. Page → передаёт `onDeleted={() => setActiveId(null)}` чтобы переключить на EmptyState после удаления активного треда.
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — `ChatView` получил `onBack` (был лишний placeholder-onClick) + `onDeleted`. Те же state/handlers, та же структура header/modals/render. Стиль адаптирован под buyer glass tokens (фиолетовый gradient на собственных bubbles, white текст). ChatsView → передаёт оба callback'а.
- **Что сделано (UX):**
  - **Удалить чат:** trash-кнопка в шапке → confirm overlay «Чат исчезнет из вашего списка. {Покупатель|Продавец} продолжит видеть историю.» → mutate → активный тред исчезает из левого списка, контент-область переключается на EmptyState
  - **Редактировать сообщение:** hover на своё сообщение → ⋯ → Pencil/«Редактировать» (только если ≤ 15 мин) → bubble превращается в textarea с автофокусом → Save (PATCH) → cache обновляется → bubble снова текст с «изменено · …»
  - **Удалить сообщение:** ⋯ → Trash/«Удалить» → confirm overlay → mutate → bubble стал серой italic «Сообщение удалено», без timestamp/menu
  - **Edit window expired:** через 15 мин «Редактировать» исчезает из меню (на бэке тот же лимит — 422 «Edit window expired (15 minutes)»)
- **Не сделано:** UI на toast'ах для ошибок mutation — нет toast-системы в обоих apps. Edit-mode при ошибке остаётся открытым; delete-mutation `try/catch` без UI feedback. Можно добавить позже когда будет общий toast-провайдер.

## 2026-04-26 — Сессия 35 (Азим) — 3 фичи по запросу: категории dropdown, эмодзи, личный кабинет

### ✅ [WEB-SELLER-CATEGORY-DROPDOWN-001] Кастомный Select для категорий товара
- **Важность:** 🟡 Visual bug — Yandex Browser рендерил native `<select>` как страшный системный popup на пол-экрана (см. `c:/Users/marti/Desktop/photo_2026-04-26_01-14-08.jpg`). После клика на категорию ничего визуально не происходило (только тихо менялся placeholder).
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-seller/src/components/select.tsx` — **новый**: `<Select>` компонент. Popover под кнопкой (`absolute mt-1.5`), стиль из solid-surfaces tokens, `boxShadow: 0 16px 40px rgba(0,0,0,.55)`. Поиск (опционален через `searchable` prop, авто-focus при открытии), keyboard navigation (ArrowDown/Up/Enter/Esc), click-outside через window mousedown listener, scrollIntoView для подсвеченной опции, clearable X-кнопка (опц), aria-haspopup/expanded/listbox. Опции `{value, label, hint?}`
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — заменены оба `<select>` на `<Select>`. «Категория товара» через RHF `setValue` (вместо `register`); скрытое поле `<input type="hidden" {...register('globalCategoryId')} />` сохраняет интеграцию с RHF. «Раздел магазина» — через локальный state `storeCategoryId`. Поиск активен у глобальных категорий и (если магазинных >6) у разделов.
- **Что сделано (UX):** При выборе категории (а) popover закрывается, (б) под селектом появляется accent-плашка с галочкой и подтверждением «Товар появится в категории «X» и попадёт под её фильтры», (в) placeholder в Title и Description обновляется под пример из выбранной категории (это уже было). Можно очистить выбор крестиком в селекте. Поиск помогает найти нужную категорию из десятков.
- **Не трогалось:** `products/[id]/edit/page.tsx` — там тоже native select, такой же баг. По запросу Азима — только `/products/create`. Если попросит — повторю там же.

### ✅ [WEB-CHAT-EMOJI-PICKER-001] Эмодзи picker в чатах buyer и seller
- **Важность:** 🟢 UX — Азим попросил возможность вставлять эмодзи в чат
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-seller/src/components/emoji-picker.tsx` — **новый** (solid-surfaces вариант)
  - `apps/web-buyer/src/components/emoji-picker.tsx` — **новый** (glass вариант с backdrop-blur и accent purple)
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — кнопка-смайлик слева от input в `ChatWindow`, `setText((prev) => prev + emoji)` на pick. Disabled-обёртка когда `thread.status === 'CLOSED'`
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — то же в `ChatView`
- **Что сделано:** 8 категорий (смайлы/жесты/сердца/животные/еда/деньги/объекты/символы), ~300 эмодзи. Без зависимостей (свой массив). Click-outside закрывает popover, Esc тоже. Между выборами popover остаётся открытым — можно вставить несколько подряд. Tabs показывают icon-эмодзи каждой категории, активная подсвечена accent.
- **Что не сделано (требует Полата):** удаление сообщения, редактирование сообщения, удаление треда — записаны как `API-CHAT-DELETE-THREAD-001`, `API-CHAT-DELETE-MESSAGE-001`, `API-CHAT-EDIT-MESSAGE-001` в tasks.md. Без endpoint'ов делать UI с заглушками = плохой UX (правило `feedback_dont_remove_without_confirm` — placeholder без wire-up).

### ✅ [WEB-SELLER-PROFILE-PAGE-001] Личный кабинет seller: страница /profile + clickable sidebar
- **Важность:** 🟢 UX — Азим попросил отдельный личный кабинет (нижний-левый блок sidebar раньше был не-кликабельный — кликаешь, ничего не происходит, см. `c:/Users/marti/Desktop/photo_2026-04-26_01-17-27.jpg`)
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/profile/page.tsx` — **новая** страница. Структура: (1) заголовок-карточка с аватаром-плейсхолдером (буква от fullName/phone в accent-кружке), displayName, phone, role pill «Продавец», sellerType pill (Бизнес/Физ.лицо), telegram username pill (если есть, ссылка на t.me/@). Camera-кнопка на аватаре `disabled` с tooltip «Скоро: загрузка аватара» — нужен `API-SELLER-AVATAR-001`. (2) Карточка магазина с logoUrl (или Store-иконка), name, city, status pill (DRAFT/SUBMITTED/APPROVED/REJECTED/SUSPENDED/PUBLISHED → русские). Footer с URL `https://savdo.uz/{slug}`, кнопки «Копировать» и «Открыть» (target=_blank). (3) Действия: Link → /settings («Магазин, доставка, профиль, уведомления»), Logout с danger-стилем
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — User-блок снизу sidebar теперь Link на `/profile`. Подсвечен accent-border когда `pathname` = /profile. Аватар + текст (телефон + «Личный кабинет» — раньше было «Продавец»). Logout-кнопка вынесена в отдельный квадрат справа (как hover-tile). Header страницы возвращает «Личный кабинет» когда pathname.startsWith('/profile')
- **Что сделано (UX):** Клик на user-блок → /profile. На странице видно аватар, контакты, статус магазина, прямой URL с одним кликом копировать или открыть. Logout доступен и из sidebar (как раньше), и со страницы профиля.
- **Что не сделано (требует Полата):** аватар upload — задача `API-SELLER-AVATAR-001` (схема + миграция + endpoint + поле в `SellerProfile` типе).

---

## 2026-04-26 — Сессия 35 (Азим) — Unread badges в чатах после Полатовых `unreadCount`

### ✅ [WEB-CHAT-UNREAD-BADGES-001] Unread бэйджи: web-buyer + web-seller
- **Важность:** 🟢 UX-полировка — Полат вернул `unreadCount: number` в `ChatThread` тип и в ответ `/chat/threads` (коммит `6507dc9`). Раньше бэйджи в seller-sidebar всегда показывали 0 (см. WEB-CHAT-THREAD-VIEW-CLEANUP-001), а в web-buyer их вообще не было. Полат также сделал auto-mark-as-read при `GET /chat/threads/:id/messages`.
- **Дата:** 26.04.2026
- **Файлы:**
  - `apps/web-buyer/src/hooks/use-chat.ts` — добавлен `useUnreadChatCount(enabled: boolean): number` (тот же `chatKeys.threads` запрос, но с `enabled` параметром чтобы не дёргать API для гостей в BottomNavBar). В `useMessages` после успешного fetch локально zero-аутит `unreadCount` для открытого треда через `queryClient.setQueryData` (бэк уже пометил, но надо отразить в UI без ожидания staleTime)
  - `apps/web-seller/src/hooks/use-chat.ts` — то же `setQueryData` обнуление в `useMessages`. `useUnreadChatCount()` уже был — без изменений (зарелизено Полатом в коммите `6507dc9`: `t.unreadCount ?? 0` сумма). Тип `ChatThread` импортирован из 'types'
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — импорт `useUnreadChatCount` + `useAuth`, бэйдж на иконке «Чаты» (только для авторизованных юзеров)
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — `ThreadItem` теперь показывает unread badge (accent кружок min-w 18px с числом / "9+"), при unread > 0 title жирный, lastMessage подсветлен (textPrimary вместо textDim)
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — то же, через solid-surfaces tokens (`colors.accent` бэйдж на `colors.bg` фоне). Запасной "закрыт" pill теперь показывается только если unread === 0 (чтобы не дублировать с бэйджем)
- **Что сделано:** В обоих апах теперь видно сколько непрочитанных сообщений per-thread + общее число у entry-point (BottomNavBar для buyer, sidebar для seller — последнее уже было готово до этой сессии). После открытия треда бэйдж обнуляется мгновенно через локальный `setQueryData`, без ожидания 30-сек staleTime. Бэк (Полат, `6507dc9`) auto-marks-as-read через `GET /messages`, так что cache stays in sync.
- **Что протестировать (Азим, в проде после Railway deploy):** (1) Открыть web-seller `/chat` → ответ `/chat/threads` в Network должен содержать `unreadCount: <число>`, бэйдж на пункте «Чат» в sidebar и на каждом треде. (2) Кликнуть тред → бэйдж этого треда обнуляется сразу, общий — уменьшается. (3) Web-buyer `/chats` — то же. (4) BottomNavBar — бэйдж на «Чаты» работает.

---

## 2026-04-24 — Полат — 6 backend задач за день (`18fa355` + `66b8be4`)

### ✅ [API-BUYER-ORDERS-ROLE-GUARD-001] Снят `@Roles('BUYER')` с buyer/orders endpoints
- **Важность:** 🔴 dual-role 403 fix
- **Дата:** 24.04.2026 (коммит `18fa355`)
- **Файлы:** `apps/api/src/modules/orders/orders.controller.ts:48-49,85,97,108`
- **Что сделано:** Снят декоратор @Roles('BUYER') с GET /buyer/orders, GET /orders/:id, GET /buyer/orders/:id, PATCH /buyer/orders/:id/status. RolesGuard без декоратора = allow any auth user; resolveBuyerId уже бросает BUYER_NOT_IDENTIFIED если профиля нет. SELLER+BUYER dual-role больше не ловит 403 на свои покупки.

### ✅ [API-CHAT-THREAD-CONTRACT-001] ChatThread тип в packages/types обновлён
- **Важность:** 🔴 Sprint 31 contract break fix
- **Дата:** 24.04.2026 (коммит `18fa355`)
- **Файлы:** `packages/types/src/api/chat.ts`
- **Что сделано:** Тип `ChatThread` обновлён под форму ответа list-my-threads use-case: threadType, status, lastMessageAt, lastMessage:string|null, productTitle, orderNumber, storeName, storeSlug, buyerPhone. Удалены устаревшие contextType/contextId/buyerId/sellerId/unreadCount.

### ✅ [API-PRODUCT-ATTRIBUTES-TYPE-001] Product.attributes в типе
- **Важность:** 🟡
- **Дата:** 24.04.2026 (коммит `18fa355`)
- **Файлы:** `packages/types/src/api/products.ts`
- **Что сделано:** Добавлен interface ProductAttribute + поле `attributes: ProductAttribute[]` в Product. Раблокирует web-buyer ProductPage блок «Характеристики» type-safe.

### ✅ [API-STOREFRONT-PRODUCT-FILTERS-001] Attribute-фильтры на витрине
- **Важность:** 🟡 Активирует 130 фильтров Sprint 31
- **Дата:** 24.04.2026 (коммит `18fa355`)
- **Файлы:** `apps/api/src/modules/products/products.controller.ts`, `products.repository.ts`
- **Что сделано:** GET /storefront/products теперь принимает `?filters[brand]=Samsung&filters[ram]=8`. findPublicByStoreId: AND clause на ProductAttribute(name,value) парах. После Полата Азим прикрутил UI на витрине магазина.

### ✅ [API-CATEGORY-SEED-CLEANUP-001] Авто-категории убраны из seed
- **Важность:** 🟡
- **Дата:** 24.04.2026 (коммит `18fa355`)
- **Файлы:** `apps/api/src/modules/categories/global-categories-seed.service.ts`
- **Что сделано:** Удалены automotive root + cars/cars_used/motorcycles из CATEGORIES + 22 связанных CategoryFilter. cleanupRemovedCategories() при старте: удаляет filters, отсоединяет товары (globalCategoryId→null), удаляет category rows.

### ✅ [API-BUYER-AVATAR-001] Buyer avatar endpoint + поле в /auth/me
- **Важность:** 🟡
- **Дата:** 24.04.2026 (коммит `66b8be4`)
- **Файлы:** `packages/db/prisma/schema.prisma`, миграция, `apps/api/src/modules/media/media.controller.ts`, `auth/repositories/auth.repository.ts`, `packages/types/src/api/auth.ts`
- **Что сделано:** `Buyer.avatarUrl String?` в schema + миграция; `POST /api/v1/media/buyer/avatar` (multipart, IMAGE_ONLY, 10MB) — загружает через TelegramStorage, апсертит buyer.avatarUrl; GET /auth/me возвращает `buyer: { id, avatarUrl }`; `BuyerProfile` интерфейс в packages/types.

---

## 2026-04-25 — Сессия 34 (Азим) — Avatar UI + category filters + design Phase 2 + chat-thread cleanup

### ✅ [WEB-BUYER-AVATAR-UI-001] Buyer avatar — UI на /profile
- **Важность:** 🟢 UX gap. Полат разблокировал в `66b8be4` (новый endpoint + поле в /auth/me).
- **Дата:** 25.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/auth.api.ts` — `uploadBuyerAvatar(file)` через `multipart/form-data` на `POST /api/v1/media/buyer/avatar`
  - `apps/web-buyer/src/lib/auth/context.tsx` — `refreshUser()` в контексте (вызывает getMe → setUser)
  - `apps/web-buyer/src/hooks/use-auth.ts` — `useUploadAvatar()` с onSuccess → refreshUser
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx` — клик-аватар (Image из `user.buyer.avatarUrl` либо UserIcon-fallback), кнопка «Изменить фото / Добавить фото» с Camera-иконкой, hidden file input с client-side валидацией (jpeg/png/webp, ≤10 МБ), inline error, спиннер во время загрузки
- **Что сделано:** На /profile блок аватара теперь интерактивный — клик по кругу или по подписи открывает file picker. После загрузки контекст вызывает /auth/me, user state обновляется, новая фотка появляется без reload. `unoptimized` на Image — чтобы не нужно было прописывать R2/Telegram-domain в next.config.

### ✅ [WEB-BUYER-CATEGORY-FILTERS-001] Глобальные категории + 130 атрибутных фильтров на витрине магазина
- **Важность:** 🟡 Sprint 31 фича — Полат seed'нул 34 категории и 130 фильтров, но фронт их не использовал. Разблокирован в `18fa355`.
- **Дата:** 25.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/storefront.api.ts` — добавлены тип `StorefrontCategoryFilter`, `getCategoryFilters(slug)`, расширен `getProducts` через `attributeFilters: Record<string,string>` (сериализация в `filters[brand]=Samsung` через URLSearchParams.append)
  - `apps/web-buyer/src/lib/api/storefront-server.ts` — `serverGetGlobalCategories()`, `serverGetCategoryFilters(slug)`, `serverGetProducts` с `globalCategoryId` + `attributeFilters`
  - `apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx` — **новый компонент** (collapsible панель: chips глобальных категорий, под ней attribute controls — select/number/text/boolean toggle, badge с counter активных фильтров, кнопка «Сбросить»). Управляет URL через `router.replace(?gcat=…&f.brand=…)`, useTransition чтобы не блокировать UI
  - `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` — server-side парсинг `?gcat=`, `?f.<key>=`, передача в getProducts; кнопка фильтров встроена под storeCategory chips; storeCategory chips теперь сохраняют gcat+f.* через `buildStoreCategoryHref`
- **Что сделано:** URL формат — `?categoryId=<storeCat>&gcat=<globalCatSlug>&f.brand=Samsung&f.ram=8`. Сервер при наличии gcat fetch'ит метаданные фильтров, рендерит filter chips. При смене глобальной категории все f.* сбрасываются (они привязаны к категории). Backend получает фильтры в формате `filters[brand]=Samsung` (qs-nested) — Полат уже поддерживает в `findPublicByStoreId`.

### ✅ [WEB-SELLER-DESIGN-PHASE-2-001] Phase 2 дизайн-стратегии C — solid surfaces для web-seller
- **Важность:** 🟡 Дизайн-разделение buyer/seller — фундамент для будущих миграций
- **Дата:** 25.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/styles.ts` — **переписан полностью**: новые токены без glass/blur. `colors` palette (slate-900 base: bg `#0F172A`, surface `#1E293B`, surfaceMuted, surfaceElevated, surfaceSunken, divider, border, borderStrong, textPrimary/Muted/Dim, accent `#A78BFA`). Surface presets: `card`, `cardMuted`, `shell`, `shellTop`, `inputStyle`, `pill`/`pillActive`. Никаких backdropFilter
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — мигрирован: убраны ambient orbs (solid фону они не нужны), sidebar и top header на solid `shell`/`shellTop`, иконки и кнопки на новые токены, тостеры на `surfaceElevated` + `accentBorder` без blur
  - `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx` — мигрирован: метрик-карточки solid `card`, hover через onMouseEnter (smooth color transition вместо opacity), скелетон на surfaceElevated, semantic colors для статусов
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx` — мигрирован: search input solid `inputStyle`, status filter chips на surfaceMuted, table header в surfaceMuted (зебра-визуальный отделитель), row hover через onMouseEnter
- **Что сделано:** Заложен фундамент Phase 2. Layout + dashboard + products теперь на solid surfaces — чистый dashboard-look без glassmorphism. Остальные 13 seller страниц (orders, settings, analytics, chat, notifications, onboarding, login, products/create, products/[id]/edit, settings, …) пока на старых локальных `const glass = {...}` — мигрировать постепенно в Phase 3.

### ✅ [WEB-SELLER-DESIGN-PHASE-3-001] Phase 3 — миграция остальных web-seller страниц на solid surfaces
- **Важность:** 🟡 Завершение Strategy C — все backdropFilter в web-seller удалены
- **Дата:** 25.04.2026 (продолжение сессии 34)
- **Файлы (10 страниц + 2 компонента):**
  - `orders/page.tsx` — full migration: header card, filter tabs, search input, table header (surfaceMuted зебра), row hover на surfaceElevated, action buttons solid accent
  - `orders/[id]/page.tsx` — full migration: order header, action panel, items table, totals секция (surfaceMuted footer), delivery&payment секция, cancel modal solid + полупрозрачный overlay (без blur)
  - `notifications/page.tsx` — full migration: notif rows с hover на surfaceElevated, tabs, skeletons на surfaceElevated/Muted (semantic icons: ShoppingCart→accent, CheckCircle→success, AlertTriangle→warning). Bonus fix: typo `з��каз` → `заказ` в NotifIcon
  - `analytics/page.tsx` — full migration: StatCard, TopProductCard на solid card, color coding accent/success/warning, error banner solid danger
  - `settings/page.tsx` — full migration: все 5 секций (Store, Delivery, Categories, Profile, Notifications), Section/Field/SavedBadge helpers на новые токены, ToggleRow с solid accent при checked, gradient save buttons → solid accent. Использован replace_all для типовых rgba(255,255,255,X) → colors.surfaceElevated/Muted/Sunken
  - `login/page.tsx` — **полная переписка**: убраны ambient orbs (login имеет body bg colors.bg), gradient buttons → solid accent с primaryBtn helper, OTP input на inputStyle, ошибки на solid danger pills с border. Inline style optimised. **Visual change:** chrome login сейчас выглядит как dashboard
  - `products/create/page.tsx` — full migration: header back-button solid, form card, локальный inputStyle через ...inputBase spread (импорт переименован в inputBase), select dropdowns с background: colors.surface, toggle visible custom через CSS pseudo-selectors (peer:checked → accent), gradient action buttons → solid
  - `products/[id]/edit/page.tsx` — **partial migration via alias**: `const glass = card` (импорт из styles). Главные surface containers теперь solid; внутренние inline rgba(...) на иконках/тенях оставлены — они визуально незначительны на фоне solid card
  - `chat/page.tsx` — partial via alias: `const glass = card; const glassDim = cardMuted` (после ChatThreadView cleanup). Главные surfaces solid
  - `onboarding/page.tsx` — partial via alias: `const glass = card`
  - `components/product-variants-section.tsx`, `product-option-groups-section.tsx` — partial via alias
- **Результат:** `git grep backdropFilter apps/web-seller` → **0 совпадений**. Все blur'ы из web-seller удалены. Visual: dashboard, orders, products list/detail, settings, analytics, notifications, login полностью solid с slate-900 палитрой; product create/edit, chat, onboarding имеют главные surfaces solid (внутренние мелкие inline rgba остались для постепенной чистки).
- **Что не сделано:** оставшиеся inline `rgba(255,255,255,X)` в edit page, chat page, onboarding, components — для них при касании в будущем (когда меняем функциональность). Не критично — backdrop blur уже нигде, главные surfaces solid.

### ✅ [WEB-SELLER-DESIGN-PHASE-3-CLEANUP-001] Финальная очистка inline rgba в alias-файлах
- **Важность:** 🟢 Финиш Strategy C — 0 inline rgba(255,255,255,X) в web-seller
- **Дата:** 25.04.2026 (продолжение сессии 34)
- **Файлы:**
  - `chat/page.tsx` — 21 случай → 0. Все `rgba(255,255,255,0.X)` → `colors.text*`/`surface*`, `rgba(167,139,250,0.X)` → `colors.accent*`, gradient buttons → solid accent. Bubbles seller-сообщений теперь solid accent с textBg вместо glass-purple
  - `products/[id]/edit/page.tsx` — 14 случаев → 0. inputStyle через `...inputBase` spread, custom toggle через CSS pseudo-selector с accent + accentBorder, error/cancel/submit buttons на semantic colors
  - `components/product-variants-section.tsx` — 20 случаев → 0. fieldStyle/confirmBtn/cancelBtn консолидированы через token spread, isActive toggle solid accent
  - `components/product-option-groups-section.tsx` — 10 случаев → 0. Same pattern as variants
  - `(onboarding)/onboarding/page.tsx` — 25 случаев → 0. STEPS progress bar (done/active/inactive states) на solid accent vs surface tokens, все 3 шага форм + finish view, навигационные buttons. Toggle active state на solid accent
  - `components/image-uploader.tsx` — 4 случая → 0. Все 3 состояния (idle/uploading/displayUrl/error): фон → surfaceSunken/surface, accent borders/spinner на colors.accent, error state на colors.danger
- **Результат:** `grep -rn "rgba(255,255,255\|backdropFilter" apps/web-seller/src` → **0 совпадений**. Strategy C завершена полностью. Web-seller теперь чистый slate-900 dashboard look с одним accent (violet), без полупрозрачных rgba(255,255,255,X) и без blur'ов вообще.
- **Что осталось из rgba:** semantic token rgba для status colors (danger/success/warning bg with .12-.20 alpha) — это намеренно (полупрозрачные бейджи на цветном фоне). Modal overlays (rgba(0,0,0,.65)) — namesно. Эти не подлежат замене.

### ✅ [WEB-CHAT-THREAD-VIEW-CLEANUP-001] Удалён локальный ChatThreadView адаптер
- **Важность:** 🟢 Гигиена — Полат обновил тип `ChatThread` в packages/types в `18fa355`
- **Дата:** 25.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/chat.api.ts` — удалены `ChatThreadView`, `RawThread`, `normalizeThread`. Добавлена helper `getThreadDisplay(t): { title, subtitle }` (buyer-perspective: storeName → productTitle → orderNumber → buyerPhone). `getThreads()` возвращает `ChatThread[]` напрямую
  - `apps/web-seller/src/lib/api/chat.api.ts` — то же, но seller-perspective (buyerPhone → productTitle → orderNumber → storeName)
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — `ChatThreadView` → `ChatThread`, читает title/subtitle через helper, `lastMessageText` → `lastMessage` (теперь string|null в типе), убран UI `unreadCount` (нет в новом типе)
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — то же
  - `apps/web-seller/src/hooks/use-chat.ts` — `useUnreadChatCount()` теперь возвращает 0 (заглушка пока Полат не вернёт `unreadCount` в API ChatThread)
- **Что сделано:** Минус ~150 строк нормализации, фронт теперь работает с типом из packages/types напрямую. Title/subtitle derivation остался как чистая функция-helper (buyer и seller имеют разные приоритеты в одной строке).
- **Что не сделано (Полат):** `unreadCount` поле в `ChatThread` типе и API ответе. Сейчас seller sidebar badge непрочитанных чатов всегда 0 — это OK как заглушка до бэка.

---

## 2026-04-23 — Сессия 33 (Азим) — Design token refactor (фаза 1, web-buyer)

### ✅ [WEB-BUYER-DESIGN-TOKENS-001] Вынес все glass-токены в `lib/styles.ts`
- **Важность:** 🟡 Гигиена — фундамент под дальнейшую дизайн-работу
- **Дата:** 23.04.2026
- **Файлы:** 15 файлов в `apps/web-buyer/src`
- **Что сделано:** В проекте было 13 копий `const glass = {...}` / `const glassDim = {...}` / `const glassDark = {...}` разбросанных по страницам с мини-расхождениями (border 0.13 vs 0.15, blur 10/12/16). Все удалены, заменены на импорт из существующего `apps/web-buyer/src/lib/styles.ts`. Файл расширен комментариями (описание каждого токена + контекст ролей buyer/seller), добавлен `glassDark` (heavy surface для checkout summary). Ничего визуально не меняется — точные значения те же. Унифицирована мелочь: `notifications` использовал border 0.13 — теперь все страницы на 0.15.
- **Файлы:**
  - `apps/web-buyer/src/lib/styles.ts` — расширен комментариями и добавлен `glassDark`
  - `apps/web-buyer/src/app/(shop)/page.tsx`, `chats/page.tsx`, `profile/page.tsx`, `notifications/page.tsx`, `orders/page.tsx`, `orders/[id]/page.tsx`, `[slug]/page.tsx`, `[slug]/products/[id]/page.tsx`
  - `apps/web-buyer/src/app/(minimal)/cart/page.tsx`, `checkout/page.tsx`
  - `apps/web-buyer/src/components/chat/ChatComposerModal.tsx`, `home/RecentStores.tsx`, `layout/BottomNavBar.tsx`, `store/ProductsWithSearch.tsx`
- **Результат:** 15 файлов, **+36 / -186 строк** — минус 150 строк copy-paste. Теперь правка `glass` = правка одного файла. Готов фундамент под стратегию (C) — в следующей фазе seller/admin получат свой `surface-*` набор токенов (solid, без blur) для чистого dashboard.
- **Что НЕ сделано (запланировано как следующий шаг):** такой же refactor в web-seller (там ~10 файлов с теми же copy-paste токенами) и разделение — seller получит собственный `lib/styles.ts` с **solid surface'ами вместо glass** (фаза 2 стратегии C).

---

## 2026-04-23 — Сессия 33 (Азим) — Форма товара теперь под любой ассортимент + чат + корзина

### ✅ [WEB-SELLER-PRODUCT-FORM-FLEX-001] Форма создания/редактирования товара — универсальная под любой ассортимент
- **Важность:** 🟡 UX-блокер: продавец «не одежды» видел placeholder «Кроссовки Nike Air Max» и мог решить что платформа не для него
- **Дата:** 23.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`
- **Что сделано:**
  1. **Глобальная категория** — добавлен новый dropdown «Категория товара» с 34 вариантами Полата (`useGlobalCategories` → `/storefront/categories`). Без выбора категории товар нельзя будет нормально отфильтровать на витрине и подсветить бейджем — теперь продавец сразу указывает что продаёт: одежда, обувь, электроника, авто, мебель и т.д. Выбор попадает в `globalCategoryId` при create/update.
  2. **Динамические placeholder'ы** — словарь `TITLE_EXAMPLES_BY_SLUG` (21 slug) даёт релевантный пример: `phones → iPhone 15 Pro`, `shoes → Nike Air Max`, `furniture → Офисное кресло с сеткой`, `books → Мастер и Маргарита, Булгаков`, `laptops → MacBook Pro 14 M3` и т.д. Unknown slug → `Например: товар из категории «{name}»` (новые категории Полата работают без кода). Без выбора категории — нейтральное `Название товара`.
  3. **Авто скрыта** — `isHiddenCategory(slug)` фильтрует `cars/auto/automobiles` + имя по regex `/авто/i`. Платформа не про продажу авто. Заведено Полату: `API-CATEGORY-SEED-CLEANUP-001` — убрать категорию + фильтры с бэка (seed).
  4. **Placeholder описания тоже контекстный** — для одежды просит размерную сетку, для электроники — характеристики/гарантию, для книг — автор/жанр/год, для мебели — материал/размеры.
  5. **Переименовал старую «Категория» (storeCategoryId) → «Раздел магазина»** — чтобы не путать с глобальной. Seller-local категория остаётся опциональной.
  6. **Цена placeholder** `10000` → `10 000` (читабельнее).
- **Бэк уже готов:** API `POST/PATCH /seller/products` принимает `globalCategoryId`; `Product.globalCategoryId` есть в типе (Полат, Sprint 31).
- **Что не сделано (следующий шаг):** динамическая секция «Характеристики товара» по `GET /storefront/categories/:slug/filters` — 130 фильтров Полата. Сейчас их seller вообще не видит, потом добавим. Нужен `API-STOREFRONT-PRODUCT-FILTERS-001` на бэке чтобы применять.

### ✅ [WEB-BUYER-CART-CONTACT-SELLER-001] Кнопка «Уточнить у продавца» на /cart

### ✅ [WEB-BUYER-CART-CONTACT-SELLER-001] Кнопка «Уточнить у продавца» на /cart
- **Важность:** 🟡 UX — паритет с TMA (Полат сделал в Sprint 31)
- **Дата:** 23.04.2026
- **Файлы:**
  - `apps/web-buyer/src/app/(minimal)/cart/page.tsx` — кнопка Telegram-цвета рядом с «Оформить», открывает ChatComposerModal с предзаполненным списком
  - `apps/web-buyer/src/components/chat/ChatComposerModal.tsx` — добавлен prop `initialText?: string`, в `useState(initialText ?? "")`
- **Что сделано:** В проде на TMA у Полата есть кнопка «Связаться с продавцом» на CartPage (Sprint 31, коммит `2b148d2`). В web-buyer такой кнопки не было. Добавил рядом с «Оформить заказ» иконочную Telegram-цветную кнопку (`#2AABEE`, как у Telegram deep-link справа на ProductPage). Клик → ChatComposerModal с уже заполненным текстом `Хочу уточнить по товарам из корзины:\n• Товар × N\n• ...` — покупатель может дописать/отредактировать. `contextId` — id первого товара, `contextType: PRODUCT`. `track.chatStarted(storeId, "cart")` для аналитики.
- **Restoration:** `.dockerignore` был восстановлен (`git restore`) — чужая правка сессии 32 с мусором («И» вместо 6 правильных строк).

### ✅ [WEB-CHAT-LIST-CRASH-001] Фикс чёрного экрана `/chats` после отправки сообщения

### ✅ [WEB-CHAT-LIST-CRASH-001] Фикс чёрного экрана `/chats` после отправки сообщения
- **Важность:** 🔴 Блокер — чат полностью не работал в web-buyer после Sprint 31
- **Дата:** 23.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/chat.api.ts` — добавлен `ChatThreadView` + `normalizeThread(raw)`
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — переведён на `ChatThreadView`, убран `contextLabel`/`.slice`
  - `apps/web-seller/src/lib/api/chat.api.ts` — аналогичный адаптер (для sellerview — title через `buyerPhone`)
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — та же миграция, `<UserIcon>` вместо `initials(buyerId)`
- **Что сделано:** После Sprint 31 Полата (`d794f18`) API `/chat/threads` возвращает совсем другую форму (`threadType`, `storeName`, `productTitle`, `orderNumber`, `buyerPhone`, `lastMessage: string`), а `packages/types/ChatThread` остался со старыми полями (`contextType`, `contextId`, `buyerId`, `unreadCount`, `lastMessage: {text}`). Фронт читал `thread.contextId.slice(-6)` — `undefined` → React crash → чёрный экран. Сделал адаптер в `chat.api.ts` обоих апп: нормализует raw-ответ в стабильный view-model (`title`, `subtitle`, `lastMessageText`, `unreadCount` с fallback). Web-buyer теперь видит название магазина в списке, web-seller — телефон покупателя (как и задумал Полат в Sprint 31). Запись в `logs.md`.
- **Заведено Полату:** `API-CHAT-THREAD-CONTRACT-001` 🔴 — обновить тип `ChatThread` под новую форму + вернуть `unreadCount` в ответ. `API-BUYER-ORDERS-ROLE-GUARD-001` 🔴 — тот же dual-role 403 что был в чате, теперь на `GET /buyer/orders`.

### ✅ [WEB-BUYER-PRODUCT-ATTRIBUTES-001] Блок «Характеристики» на странице товара

### ✅ [WEB-BUYER-PRODUCT-ATTRIBUTES-001] Блок «Характеристики» на странице товара
- **Важность:** 🟡 UX — товарные атрибуты теперь видны покупателю
- **Дата:** 23.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` (+ тип `ProductAttribute`, derived `productAttributes`, блок под описанием)
- **Что сделано:** `findPublicById` в `products.repository.ts:120` уже делает `include: attributes`, бэк возвращает массив `{id, name, value, sortOrder}`. Но в `packages/types/src/api/products.ts:62` тип `Product` пока без `attributes`. Объявил локальный тип `ProductAttribute` и `productAttributes = (product as { attributes?: ... }).attributes ?? []`. Блок «Характеристики» под описанием — пары «name: value», неяркая таблица. Рендерится только если `attributes.length > 0`.
- **Для Полата:** заведён `API-PRODUCT-ATTRIBUTES-TYPE-001` — добавить `attributes: ProductAttribute[]` в тип `Product` в `packages/types`. После — убрать локальный cast в web-buyer.

### ✅ Снят prepopulate-костыль из `useConfirmCheckout`
- **Важность:** 🟡 Чистка
- **Дата:** 23.04.2026
- **Файл:** `apps/web-buyer/src/hooks/use-checkout.ts`
- **Что сделано:** После закрытия `API-BUYER-ORDER-DETAIL-MAPPER-001` Полатом (`3e8d337`, сессия 30) `GET /buyer/orders/:id` возвращает корректно смаппленный `Order` (нет race с `undefined.toLocaleString`). Убрал `setQueryData(orderKeys.detail(order.id), order)` и зауженный `invalidateQueries(['orders','list'])`. Теперь `onSuccess` просто: очистить `['cart']` + `invalidateQueries(orderKeys.all)`. После confirm → `/orders/{id}` делает чистый GET, который работает по контракту. Остаётся `setQueryData(['cart'], null)` — безопасный, просто очищает корзину немедленно.
- **Риск:** Если auth-401 регрессирует (задача Полата ещё открыта), сначала проявится именно тут. Но это общий баг, маскировать его в одном месте — плохая стратегия.

### ✅ [WEB-BUYER-CATEGORY-BADGE-001] Бейдж глобальной категории на странице товара

### ✅ [WEB-BUYER-CATEGORY-BADGE-001] Бейдж глобальной категории на странице товара
- **Важность:** 🟡 UX — покупатель видит к какой категории принадлежит товар
- **Дата:** 23.04.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` (строки 279-291)
- **Что сделано:** Между заголовком товара и ценой добавлен неяркий пурпурный тег с `product.globalCategory.nameRu`. Рендерится только если `globalCategory !== null` — товары без категории остаются как были. Стиль согласован с existing glass-токенами (background `rgba(167,139,250,0.14)`, цвет `#C4B5FD`). Пока некликабельный (span) — будущий `WEB-BUYER-CATEGORY-FILTERS-001` сделает из него навигацию на страницу категории.
- **Контракт:** `packages/types/src/api/products.ts:68` — `Product.globalCategory: { id, nameRu, nameUz } | null` уже был готов (Полат, сессия 33). Новые коды в `Product` ответе API уже доступны.
- **Не тронуто:** web-seller (нет buyer-режима просмотра — только create/edit/list), ProductListItem карточки (у них нет `globalCategory` в контракте — только `globalCategoryId`).

---

## 2026-04-23 — Сессия 33 (Полат) — Sprint 31 категории + чат real-time + OTP security

### ✅ [API-CHAT-ROLE-GUARD-001] 403 на dual-role аккаунтах — закрыт
- **Важность:** 🔴
- **Дата:** 23.04.2026
- **Коммит:** `907f39f fix(security+chat): OTP brute-force protection, media visibility guard, chat UX fixes`
- **Файлы:** `apps/api/src/modules/chat/chat.controller.ts:63-64` (снят `@Roles('BUYER')`), `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:50-53` (`ensureBuyerProfile` для существующих users)
- **Что сделано Полатом:** Применён минимальный вариант фикса, который мы рекомендовали в сессии 32. `POST /chat/threads` теперь без role-guard — защита только через `resolveBuyerId()` (422 если нет Buyer-профиля). SELLER-пользователи с Buyer-профилем больше не ловят 403.
- **Разблокировано Азиму:** chat composer e2e тест — можно прогнать в проде после Railway-билда.

### ✅ Sprint 31 — глобальные категории + фильтры (бэк)
- **Важность:** 🟡
- **Дата:** 23.04.2026
- **Коммиты:** `fb79db2 feat(categories): add CategoryFilter model + auto-seed 34 categories + 130 filters on startup`, `2b148d2 feat(sprint-31): глобальные категории в DB + связаться с продавцом + категория у покупателя`
- **Что сделано Полатом:** 34 категории автосидятся через OnModuleInit (upsert, идемпотентно), 130 фильтров типов TEXT/SELECT/NUMBER/BOOLEAN привязано к категориям. `Product` API теперь включает `globalCategory { id, nameRu, nameUz }`. Новые эндпоинты: `GET /api/v1/storefront/categories/:slug/filters` (публичный), `POST /api/v1/admin/categories/seed` (ADMIN).
- **Открыто Азиму:** `WEB-BUYER-CATEGORY-BADGE-001` (бейдж на ProductPage), `WEB-BUYER-CATEGORY-FILTERS-001` (фильтры на странице категории).

### ✅ Chat real-time + UI polish (бэк + TMA)
- **Важность:** 🟡
- **Дата:** 23.04.2026
- **Коммиты:** `d794f18 feat(chat): real-time messages`, `b4ae1c3 fix(chat): unify thread status values to OPEN/CLOSED`, `6cf024b fix(chat): ADMIN role`, `5243efa fix(admin/chat): STATUS_COLORS fallback`, `f2aed55 feat(admin/chat): delete thread`, `1111150 fix(admin): safe delete GlobalCategory`
- **Что сделано Полатом:** Унификация события socket на `chat:message` (TMA слушал `chat:new_message`). Статусы тредов `active/resolved` → `OPEN/CLOSED` во всех слоях. Имена в списке — название магазина / телефон покупателя + превью последнего сообщения. Запрет отправки в CLOSED треды. Админка: кнопка удаления чатов + DELETE endpoint. Crash в `STATUS_COLORS.resolved` → fallback на `CLOSED`. Бандл 900→300KB (Vite chunking).
- **Проверено у нас:** `apps/web-buyer/src/hooks/use-chat.ts:47` и `apps/web-seller/src/hooks/use-chat.ts:71` слушают `chat:message` — правильно, изменений не требуется.

### ✅ Security — OTP brute-force + media visibility (бэк)
- **Важность:** 🟡
- **Дата:** 23.04.2026
- **Коммит:** `907f39f`
- **Что сделано Полатом:** OTP через `crypto.randomInt` вместо `Math.random`. Брутфорс-защита: 5 попыток → блок 15 мин (Redis). Media `/proxy/:id` отдаёт только `visibility = PUBLIC`. Удалены дубли `/auth/otp/send` и `/auth/otp/verify`. OTP graceful degrade при Redis-down. `JSON.parse(options)` обёрнут в try/catch.

---

## 2026-04-23 — Сессия 32 (Азим) — Recent stores + диагностика чата + чистка backlog

### ✅ [DIAG-CHAT-403-001] Диагностика чата 403 на dual-role аккаунтах
- **Важность:** 🔴 (root cause найден, фикс на Полате)
- **Дата:** 23.04.2026
- **Файлы (проверены, не менялись):** `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:44-70`, `apps/api/src/modules/chat/chat.controller.ts:62`, `apps/api/src/common/guards/roles.guard.ts:28-30`
- **Что сделано:** Азим получил 403 «Insufficient permissions» при попытке отправить сообщение через ChatComposerModal. По коду (без F12) подтверждена причина: `User.role='SELLER'` для телефонов уже зарегистрированных как seller → JWT `role: "SELLER"` → `@Roles('BUYER')` guard → 403. `ensureBuyerProfile` создаёт Buyer-запись, но User.role не меняет — архитектурная несостыковка (dual-role пользователи + скалярный JWT role). Заведён `API-CHAT-ROLE-GUARD-001` 🔴 в `tasks.md` с двумя вариантами фикса (минимальный: убрать `@Roles('BUYER')` с POST /chat/threads — в методе уже есть `resolveBuyerId` который бросает 422). Трейс в `logs.md` → `WEB-BUYER-CHAT-CREATE-403-001`. Ждёт Полата.

### ✅ [WEB-BUYER-RECENT-STORES-001] Недавние магазины под инпутом на главной
- **Важность:** 🟡 UX
- **Дата:** 23.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/recent-stores.ts` — СОЗДАН (localStorage helper)
  - `apps/web-buyer/src/components/store/RegisterRecentStore.tsx` — СОЗДАН (client-компонент для mount-записи)
  - `apps/web-buyer/src/components/home/RecentStores.tsx` — СОЗДАН (отображение ряда карточек + крестик «забыть»)
  - `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` — добавлен `<RegisterRecentStore>` в рендер магазина
  - `apps/web-buyer/src/app/(shop)/page.tsx` — добавлен `<RecentStores>` под инпутом «Перейти в магазин»
- **Что сделано:** Каждый раз вводить slug стал только первый раз — после открытия магазина он остаётся на главной в блоке «Недавние магазины» (до 8 последних). Кнопка X на карточке локально удаляет из списка. Данные только в localStorage (`savdo:buyer:recent-stores`), между устройствами не синхронизируются — полноценные favorites требуют бэка (отдельной задачи).
- **Bundle:** без новых зависимостей.

### ✅ [ANALIZ-CLEANUP-001] Чистка tasks.md — перенос закрытых задач
- **Важность:** 🟢 Гигиена
- **Дата:** 23.04.2026
- **Файлы:** `analiz/tasks.md`, `analiz/logs.md`
- **Что сделано:** Убраны из `tasks.md` развёрнутые секции по `API-BUYER-ORDER-DETAIL-MAPPER-001`, `API-SELLER-ORDER-DETAIL-CONTRACT-001`, `API-MEDIA-UPLOAD-500-001`, `API-SELLER-ORDER-DETAIL-MAPPER-001`, `API-CART-MEDIA-001`, `API-BUYER-PROFILE-001`, `API-CART-RESPONSE-001`, `API-CART-CONTRACT-001`, `API-CHECKOUT-CONTRACT-001`, `API-DECIMAL-NAN-001` — все закрыты коммитами Полата `5ca0666` (сессия 27), `f3a40a7` (сессия 29), `3e8d337` (сессия 30). Добавлена новая `API-CHAT-ROLE-GUARD-001` + запись в `logs.md`. Очередь Полата теперь: 3 задачи (`API-CHAT-ROLE-GUARD-001`, `API-BUYER-AVATAR-001`, Auth-история).

---

## 2026-04-19..21 — Сессии 27-30 (Полат) — Закрыты бэкенд-блокеры buyer flow

> Сводная запись. Отдельно в `tasks.md` детали не писали — Полат правил напрямую.

### ✅ Закрыто в коммите `5ca0666` (19.04.2026)
- `API-DECIMAL-NAN-001` — `toNum()` вместо `Number(Decimal)` в cart/checkout/products
- `API-BUYER-PROFILE-001` — `ensureBuyerProfile` в `verify-otp.use-case.ts` для существующих SELLER/ghost users
- `API-CART-CONTRACT-001` — `GET /cart` возвращает mapped Cart через `cart.mapper.ts`
- `API-CART-RESPONSE-001` — `POST/PATCH /cart/items` возвращают full mapped Cart
- `API-CHECKOUT-CONTRACT-001` — `/checkout/preview` по контракту `CheckoutPreview`

### ✅ Закрыто в коммите `f3a40a7` (20.04.2026)
- `API-CART-MEDIA-001` — `cart.mapper` вызывает `resolveMediaUrl` вместо голого `mediaId`
- `API-MEDIA-UPLOAD-500-001` — upload обёрнут в try/catch, 502 `DomainException` вместо 500
- `API-SELLER-ORDER-DETAIL-MAPPER-001` — `toNum()` на Decimal-полях seller-order detail

### ✅ Закрыто в коммите `3e8d337` (21.04.2026)
- `API-BUYER-ORDER-DETAIL-MAPPER-001` — общий `orders.mapper.ts#mapOrderDetail()` по контракту `Order`, `findById` теперь включает `store`
- `API-SELLER-ORDER-DETAIL-CONTRACT-001` — оба endpoints (buyer и seller) используют тот же mapper, контракт сходится с `packages/types`

---

## 2026-04-21 — Сессия 31 (Азим) — Empty-state чата на web-buyer и web-seller

### ✅ [WEB-CHAT-EMPTY-STATE-001] Понятный empty-state на странице чатов
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — левая панель (thread list empty) + правая панель (desktop, когда нет тредов)
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — левая панель + `EmptyState({ noThreads })`
- **Что сделано:** Пользователь жаловался на скрин `c:/Users/marti/Desktop/Снимок экрана 2026-04-21 222607.png` — «Чатов пока нет, Напишите продавцу со страницы заказа» + «Выберите чат» рядом. Текст «со страницы заказа» устарел (с вчерашнего `e28ffd0` треды создаются и с product-страниц). На seller-стороне пусто и никак не сказано, что продавец не может начать чат сам.
  - **web-buyer:** empty копирайт + CTA-кнопка «Перейти к магазинам» (link href=`/`) + та же контекстная подсказка на правой панели десктопа при 0 тредов.
  - **web-seller:** empty копирайт объясняет, что покупатель пишет первым; правая панель через `EmptyState({ noThreads })` показывает ту же подсказку, а когда треды есть и просто не выбран — старое «Выберите чат».
- **Bundle:** нет новых зависимостей, только JSX-правки и текст.

### ✅ [WEB-CHAT-THREAD-LABEL-001] Корректный label для PRODUCT-тредов в web-buyer
- **Важность:** 🟢
- **Дата:** 21.04.2026
- **Файл:** `apps/web-buyer/src/app/(shop)/chats/page.tsx`
- **Что сделано:** `ThreadItem` (line ~74) и заголовок `ChatView` (line ~126) больше не рендерят «Заказ ···ABC» безусловно. Добавлен хелпер `contextLabel(thread)` — для `thread.contextType === ThreadType.PRODUCT` показывает «Товар ···ABC», иначе «Заказ ···ABC». Импорт `ThreadType` добавлен к уже существующему `UserRole` из `'types'`. Развилка на основе `contextType` из `ChatThread` — backend не трогали.

---

## 2026-04-21 — Сессия 30 (Полат) — Спринт 30: UX/полнота платформы TMA + Admin

### ✅ [TMA-CATEGORY-MODAL-001] Searchable Category Modal — замена chip-пикеров
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/tma/src/components/ui/CategoryModal.tsx` — СОЗДАН (overlay + search + scrollable list)
  - `apps/tma/src/pages/seller/AddProductPage.tsx` — chip → button trigger + CategoryModal
  - `apps/tma/src/pages/seller/EditProductPage.tsx` — то же
- **Что сделано:** Заменены chip-пикеры для «Тип товара» и «Категория магазина» на кнопку-триггер с поиском. Модал: backdrop blur, search input, список с галочкой активного, кнопка «Очистить», закрытие по оверлею.

### ✅ [TMA-BOTTOM-SHEET-001] BottomSheet + детальная карточка заказа для продавца
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/tma/src/components/ui/BottomSheet.tsx` — СОЗДАН
  - `apps/tma/src/pages/seller/OrdersPage.tsx` — state detailId + fetch + BottomSheet с полной инфой покупателя
- **Что сделано:** Тап на заказ → slide-up sheet с именем, телефоном покупателя (заказ + аккаунт), tel: ссылки, список товаров с qty×price, адрес, комментарий, итого.

### ✅ [TMA-CHECKOUT-PHONE-001] Auto-fill телефона при оформлении заказа
- **Важность:** 🟢
- **Дата:** 21.04.2026
- **Файл:** `apps/tma/src/pages/buyer/CheckoutPage.tsx`
- **Что сделано:** `useState('')` → `useState(user?.phone ?? '')`. Поле телефона предзаполняется из профиля покупателя.

### ✅ [TMA-TOAST-001] Toast уведомления
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/tma/src/components/ui/Toast.tsx` — СОЗДАН (singleton через CustomEvent)
  - `apps/tma/src/components/layout/AppShell.tsx` — добавлен `<ToastContainer />`
  - `apps/tma/src/pages/buyer/ProductPage.tsx` — toast при добавлении в корзину
  - `apps/tma/src/pages/buyer/StorePage.tsx` — toast при добавлении в корзину
  - `apps/tma/src/pages/buyer/ChatPage.tsx` — toast при отправке
  - `apps/tma/src/pages/seller/ChatPage.tsx` — toast при отправке + закрытии треда
  - `apps/tma/src/pages/seller/OrdersPage.tsx` — toast при обновлении статуса
- **Что сделано:** Глобальная toast-система без React context. `showToast(msg, type?)` диспатчит CustomEvent → `ToastContainer` показывает 2.5с.

### ✅ [TMA-SKELETON-001] Skeleton loaders вместо Spinner
- **Важность:** 🟢
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/tma/src/components/ui/Skeleton.tsx` — СОЗДАН (shimmer анимация + пресеты)
  - `apps/tma/src/index.css` — добавлена `@keyframes skeleton-shimmer`
  - `apps/tma/src/pages/buyer/StorePage.tsx` — ProductCardSkeleton вместо Spinner
  - `apps/tma/src/pages/seller/OrdersPage.tsx` — OrderRowSkeleton
  - `apps/tma/src/pages/buyer/ChatPage.tsx` — ThreadRowSkeleton
  - `apps/tma/src/pages/seller/ChatPage.tsx` — ThreadRowSkeleton

### ✅ [TMA-BOTTOMNAV-CHAT-001] Добавлен чат в BottomNav (buyer + seller)
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файл:** `apps/tma/src/components/layout/BottomNav.tsx`
- **Что сделано:** Buyer — 5 вкладок: Магазин/Корзина/Заказы/Чат/Профиль. Seller — 5 вкладок: Дашборд/Товары/Магазин/Заказы/Чат.

### ✅ [TMA-INPUT-FIX-001] Исправлены type="number" / type="tel" инпуты
- **Важность:** 🟢
- **Дата:** 21.04.2026
- **Файлы:** `apps/tma/src/pages/seller/AddProductPage.tsx`, `EditProductPage.tsx`, `buyer/CheckoutPage.tsx`
- **Что сделано:** Заменены `type="number"` → `inputMode="numeric"`, `type="tel"` → `inputMode="tel"`. Исправлены дублирующиеся атрибуты (TS17001).

### ✅ [ADMIN-CHAT-001] Admin — мониторинг чатов
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/api/src/modules/chat/chat.controller.ts` — 2 новых endpoint (ADMIN роль): `GET admin/chat/threads`, `GET admin/chat/threads/:id/messages`
  - `apps/admin/src/pages/ChatsPage.tsx` — СОЗДАН (таблица тредов + правая панель сообщений)
  - `apps/admin/src/App.tsx` — добавлен route `/chats`
  - `apps/admin/src/layouts/DashboardLayout.tsx` — добавлен пункт «Чаты» в меню
- **Что сделано:** Админ видит все треды со store/buyer инфой, фильтр по статусу, поиск. Клик → история сообщений (read-only).

---

## 2026-04-21 — Сессия 30 (Азим) — Аудит web-buyer + web-seller

### ✅ [WEB-BUYER-CHAT-COMPOSER-001] In-app чат: создание тредов из product + order pages
- **Важность:** 🔴 (чат был полностью недоступен — backend готов, фронт не подключен)
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/chat.api.ts` — функция `createThread(data: CreateThreadRequest)`
  - `apps/web-buyer/src/hooks/use-chat.ts` — `useCreateThread()` с invalidate `chatKeys.threads`
  - `apps/web-buyer/src/components/chat/ChatComposerModal.tsx` — новый компонент (textarea + send)
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — фиолетовая кнопка чата в sticky CTA (PRODUCT thread) + модал
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — основная кнопка «Чат по заказу» (ORDER thread), Telegram-линк демотирован в secondary
- **Что сделано:** Backend `POST /api/v1/chat/threads` работал давно, но фронт не мог его дёрнуть. Теперь: на странице товара и заказа — кнопка → модал с первым сообщением → POST → `chatKeys.threads` invalidate → router.push('/chats') → новый тред в списке (sorted by lastMessageAt) → автоселект → переписка. Seller видит тред на `/chat` через тот же polling+socket.
- **Зависимость:** Если `GET /chat/threads` у buyer или seller возвращает 401 (см. `Auth-история` у Полата) — списки будут пустые. Нужно отловить в prod.

### ✅ [WEB-BUYER-CHECKOUT-REDIRECT-FAIL-001] Маскировка фейла GET /buyer/orders/:id после checkout
- **Важность:** 🟡 (UX-симптом; корень на бэке)
- **Дата:** 21.04.2026
- **Файл:** `apps/web-buyer/src/hooks/use-checkout.ts`
- **Что сделано:** `useConfirmCheckout.onSuccess` кладёт полученный `Order` в `queryClient.setQueryData(orderKeys.detail(order.id), order)`. Invalidate сужен до `['orders', 'list']` чтобы prepopulated detail не стирался. `useOrder(id)` с `staleTime: 2 min` не делает второй GET → страница `/orders/{id}` рендерит заказ сразу из кэша.
- **Что не решено:** Открытие того же заказа позже (refresh/список) → `useOrder` делает GET → снова ошибка. Ждём `API-BUYER-ORDER-DETAIL-MAPPER-001` у Полата.

### ✅ [RAILWAY-TS-FIX] Типизация `normalizeOrder` для Railway билда
- **Важность:** 🔴 (первый пуш аудита провалил Docker build)
- **Дата:** 21.04.2026
- **Файл:** `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`
- **Что сделано:** После первого пуша сессии (`466a9e9`) Railway упал на tsc `Parameter 's' implicitly has an 'any' type` в `order?.items.reduce`. Причина: `normalizeOrder(raw: any)` пропускал `any` через весь return type. Добавил явные типы `NormalizedItem`, `NormalizedOrder`, `NormalizedAddress`, `NormalizedStore` — инференс вернулся. Коммит `b355cf4`.

### ✅ [AUDIT-SESSION-30] Полный аудит двух web-приложений: 7 фиксов, 1 задача Полату
- **Важность:** 🔴 (один crash-фикс в buyer order detail + 6 visual guards)
- **Дата:** 21.04.2026
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — `normalizeOrder()` (store/items/snapshot-fields), safe fmt, store block conditional
  - `apps/web-buyer/src/app/(shop)/orders/page.tsx` — safe fmt + flat-address fallback
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — `Number(basePrice)`
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — safe fmt
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx` — toNum + getAddr() helper
  - `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx` — safe fmt + flat city fallback
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx` — safe fmt (basePrice Decimal)
- **Что сделано:**
  - **CRASH fix:** `/orders/:id` у покупателя больше не падает на отсутствующем `order.store`. Добавлен normalizer который принимает как `Order` контракт, так и сырой Prisma (snapshot-поля + flat-адрес + `customerComment`/`deliveryFeeAmount`).
  - **Safe fmt:** все `n.toLocaleString('ru-RU')` обёрнуты в `toNum()` — теперь не крашатся на undefined/Decimal-string, показывают `0 сум` вместо NaN/crash.
  - **Flat-address fallback:** web-seller orders list (OrderRow, CancelModal, search) + web-seller dashboard «последние заказы» + web-buyer orders list читают `raw.city`/`raw.addressLine1` когда `deliveryAddress` объект отсутствует.
- **Что на Полате:** `API-BUYER-ORDER-DETAIL-MAPPER-001` (новая задача в `tasks.md`) — общий `orders.mapper.ts` + `include: { store }`. Закроет сразу и `API-SELLER-ORDER-DETAIL-CONTRACT-001`.
- **Чего не трогал:** defensive workarounds с прошлых сессий (imgFailed в cart, toNum в seller order detail) — оставил как защиту, как раньше договаривались.

---

## 2026-04-21 — Сессия 30 (Азим) — Верификация бэк-фиксов сессии 29

### ✅ [API-CART-MEDIA-001] Верификация со стороны web-buyer
- **Важность:** 🔴
- **Дата:** 21.04.2026
- **Файлы:** читал `apps/api/src/modules/cart/cart.mapper.ts`, `apps/api/src/modules/cart/repositories/cart.repository.ts`, `packages/types/src/api/cart.ts`, `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:** Сверил mapper Полата с контрактом `Cart`/`CartItem`/`ProductRef` из `packages/types`. Всё совпадает: `mediaUrl` теперь URL (telegram proxy или R2), `unitPrice`/`subtotal`/`totalAmount: number`, `currencyCode: 'UZS'`. Наш `imgFailed` fallback в `CartItemRow` остаётся как защита на случай деплой-гэпа между API и storage — безвреден, удалять не надо.

### ⚠️ [API-SELLER-ORDER-DETAIL-MAPPER-001] FIX-C — поля из `/seller/orders/:id` НЕ совпадают с `packages/types/src/api/orders.ts`
- **Важность:** 🟡
- **Дата:** 21.04.2026
- **Файлы:** читал `apps/api/src/modules/orders/orders.controller.ts:146-178`, `packages/types/src/api/orders.ts`, `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`
- **Что сделано:** Убедился что числовой крэш починен (`toNum` на всех суммах — ✅). Но поля разошлись с контрактом:
  - Ожидается `deliveryAddress: DeliveryAddress` → отдаётся flat `city` / `region` / `addressLine1`
  - Ожидается `deliveryFee` → отдаётся `deliveryFeeAmount`
  - Ожидается `buyerNote` → отдаётся `customerComment`
  - Ожидается `createdAt` → отдаётся `placedAt`
- **Последствия на фронте:** `order.deliveryAddress?.city` → undefined → `—, —`. Дата пустая. Комментарий покупателя не отображается. Крэша нет (optional chaining защищает), но данные «невидимы».
- **Что дальше:** Задача `API-SELLER-ORDER-DETAIL-CONTRACT-001` заведена в `analiz/tasks.md` для Полата — нормализовать под существующий тип `Order`. До этого FIX-C закрывать нельзя.

---

## 2026-04-20 — Сессия 29 (Полат) — 3 фикса + категории + атрибуты + чат TMA + admin broadcast toolbar

### ✅ [API-CART-MEDIA-001] cart.mapper.ts отдавал mediaId (UUID) вместо URL
- **Важность:** 🔴
- **Дата:** 20.04.2026
- **Файлы:** `apps/api/src/modules/cart/repositories/cart.repository.ts`, `apps/api/src/modules/cart/cart.mapper.ts`
- **Что сделано:** `CART_ITEMS_INCLUDE` изменён с `select: { mediaId: true }` на `include: { media: true }`. Добавлен `resolveMediaUrl(media)` — строит proxy-URL для telegram-bucket или R2 URL для других.

### ✅ [API-MEDIA-UPLOAD-500-001] POST /media/upload отдавал 500
- **Важность:** 🔴
- **Дата:** 20.04.2026
- **Файлы:** `apps/api/src/modules/media/use-cases/upload-direct.use-case.ts`, `apps/api/src/shared/constants/error-codes.ts`
- **Что сделано:** Обёрнут `tgStorage.uploadFile()` в try/catch → `DomainException(MEDIA_UPLOAD_FAILED, ..., 502)` + `Logger.error` со stacktrace. Добавлен `MEDIA_UPLOAD_FAILED` в error-codes.

### ✅ [API-SELLER-ORDER-DETAIL-MAPPER-001] GET /seller/orders/:id без mapper → числа undefined
- **Важность:** 🟡
- **Дата:** 20.04.2026
- **Файлы:** `apps/api/src/modules/orders/orders.controller.ts`
- **Что сделано:** Полный mapper в `getSellerOrderDetail` — `toNum()` на `totalAmount`, `subtotalAmount`, `deliveryFeeAmount`, `unitPriceSnapshot`, `lineTotalAmount`.

### ✅ [TMA-GLOBAL-CATEGORY-001] GlobalCategory picker в AddProduct + EditProduct + buyer filter
- **Важность:** 🟡
- **Дата:** 20.04.2026
- **Файлы:** `apps/tma/src/pages/seller/AddProductPage.tsx`, `apps/tma/src/pages/seller/EditProductPage.tsx`, `apps/tma/src/pages/buyer/StorePage.tsx`
- **Что сделано:** Chip-picker "Тип товара" (fetch /storefront/categories) в формах продавца. Горизонтальные chips-фильтр над товарами для покупателя с клиентской фильтрацией.

### ✅ [TMA-PRODUCT-ATTRIBUTES-001] Параметры товара (ProductAttribute)
- **Важность:** 🟡
- **Дата:** 20.04.2026
- **Файлы:** `packages/db/prisma/schema.prisma`, `packages/db/prisma/migrations/20260420000000_add_product_attributes/migration.sql`, `apps/api/src/modules/products/repositories/products.repository.ts`, `apps/api/src/modules/products/products.controller.ts`, `apps/tma/src/pages/seller/AddProductPage.tsx`, `apps/tma/src/pages/seller/EditProductPage.tsx`, `apps/tma/src/pages/buyer/ProductPage.tsx`
- **Что сделано:** Новая модель `ProductAttribute` в схеме + миграция. 4 API endpoint-а (GET/POST/PATCH/DELETE). Inline редактор в TMA продавца. Секция "Характеристики" на странице товара покупателя.

### ✅ [TMA-CHAT-001] Чат в TMA (buyer + seller)
- **Важность:** 🟡
- **Дата:** 20.04.2026
- **Файлы:** `apps/tma/src/lib/socket.ts`, `apps/tma/src/pages/buyer/ChatPage.tsx`, `apps/tma/src/pages/seller/ChatPage.tsx`, `apps/tma/src/App.tsx`, `apps/tma/package.json`
- **Что сделано:** Создан `socket.ts` (singleton getSocket/destroySocket). BuyerChatPage + SellerChatPage: список тредов, просмотр сообщений, отправка, Socket.IO real-time. SellerChatPage: кнопка "Закрыть тред" + бейдж непрочитанных. Маршруты `/buyer/chat` и `/seller/chat` добавлены в App.tsx.

### ✅ [ADMIN-BROADCAST-TOOLBAR-001] Rich text toolbar в Admin Broadcast
- **Важность:** 🟢
- **Дата:** 20.04.2026
- **Файлы:** `apps/admin/src/pages/BroadcastPage.tsx`
- **Что сделано:** Toolbar над textarea: Жирный, Курсив, Ссылка, 5 emoji-кнопок. `wrapSelection()` DOM-утилита без внешних deps. Счётчик символов (4096 лимит Telegram), красный при превышении 4000.

---

## 2026-04-19 — Сессия 28 (Азим) — Auth infinite-loop fix (web-seller + web-buyer)

### ✅ [WEB-AUTH-LOGOUT-LOOP-001] Бесконечный цикл `POST /auth/logout 401` после logout
- **Важность:** 🔴 Блокер. Сотни запросов в секунду, нельзя зайти в seller-аккаунт.
- **Дата:** 19.04.2026
- **Файлы:** `apps/web-seller/src/lib/api/client.ts`, `apps/web-seller/src/lib/auth/context.tsx`, `apps/web-buyer/src/lib/api/client.ts`, `apps/web-buyer/src/lib/auth/context.tsx`
- **Цепочка бага:** Клик «Выйти» → `POST /auth/logout` со старым токеном → 401 → axios interceptor пробует `/auth/refresh` → тоже 401 → `clearTokens()` + dispatchEvent `savdo:auth:expired` → AuthProvider слушает → вызывает `logout()` снова → goto step 1. Console: бесконечно `logout:1 401`.
- **Что сделано:**
  1. `client.ts`: interceptor пропускает refresh для `/auth/logout`, `/auth/refresh`, `/auth/otp/*` — рефрешить токен на самом logout-вызове бессмысленно и вызывает loop.
  2. `context.tsx`: добавлен `localLogout()` — только локальная очистка (`clearTokens` + `setUser(null)` + `queryClient.clear()`), без сетевого `/auth/logout`. `onExpired` handler и mount-`getMe`-catch теперь зовут `localLogout()`, а не полный `logout()`. Цикл разомкнут.
- **Применено к обоим:** web-seller и web-buyer (один паттерн).

---

## 2026-04-19 — Сессия 28 (Азим) — Seller order detail crash + cart thumbnail

### ✅ [WEB-SELLER-ORDER-DETAIL-CRASH-001] Клик по заказу → `Cannot read properties of undefined (reading 'toLocaleString')`
- **Важность:** 🔴 Блокер (нельзя открыть ни один заказ)
- **Дата:** 19.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx`
- **Что сделано:** `fmt(n)` принимал `number` и сразу делал `n.toLocaleString` → undefined ломал страницу. Заменил на `toNum()` + `fmt(unknown)`. Defensive `?? 0` на `deliveryFee`, `items` массив, `STATUS_CONFIG[status]` и `PAYMENT_STATUS_LABELS[paymentStatus]`. `new Date(createdAt)` обёрнут в проверку. Корневая причина (бэк mapper отсутствует) — `API-SELLER-ORDER-DETAIL-MAPPER-001` для Полата.

## 2026-04-19 — Сессия 28 (Азим) — Cart thumbnail fallback

### ✅ [WEB-BUYER-CART-THUMB-001] Сломанная картинка товара + alt-текст вылезает из плейсхолдера в `/cart`
- **Важность:** 🟡 UI-баг (заметный, не блокер)
- **Дата:** 19.04.2026
- **Файлы:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:** `next/image` при 404 рисует системный broken-icon + alt-текст («Белая футболка»), который ломает 62×62 плейсхолдер. Добавил локальный `imgFailed` state в `CartItemRow` + `onError={() => setImgFailed(true)}`. При ошибке падаем на тот же `<Package>` иконку, что и при отсутствии `mediaUrl`.

---

## 2026-04-19 — Сессия 27 (Азим) — Buyer flow на production: серия каскадных фиксов web-buyer

### ✅ [WEB-BUYER-CART-CACHE-001] Краш `reading 'reduce'` после «Добавить в корзину»
- **Важность:** 🔴 Блокер
- **Дата:** 19.04.2026
- **Коммит:** `f9fe75e`
- **Файлы:** `apps/web-buyer/src/hooks/use-cart.ts`, `apps/web-buyer/src/components/layout/Header.tsx`
- **Что сделано:** `useAddToCart` / `useUpdateCartItem` писали в TanStack-кэш `['cart']` результат мутации. Бэк возвращает сырой `CartItem`, а не `Cart` → `cart.items === undefined` → `Header.tsx:13 cart?.items.reduce(...)` падал с `undefined.reduce`. Заменил `setQueryData` на `invalidateQueries` (кэш обновляется через `GET /cart`). Добавил defensive `?.` на `items` в Header.

### ✅ [WEB-BUYER-ORDERS-ADDR-GUARD-001] Railway TS-билд падал на `order.deliveryAddress.street`
- **Важность:** 🔴 Блокер (билд не проходил)
- **Дата:** 19.04.2026
- **Коммит:** `7a0ad5e`
- **Файлы:** `apps/web-buyer/src/app/(shop)/orders/page.tsx`, `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`
- **Что сделано:** После `API-ORDER-ADDR-001` Полата `deliveryAddress` стал optional в контракте, а в web-buyer три места читали поля напрямую. Защитил `?.` + fallback (тернарник «Самовывоз» в списке, `'—'` в детали). Паттерн из `SELLER-DASH-GUARD-001` (сессия 24).

### ✅ [WEB-BUYER-CART-RENDER-002] Чёрный экран на `/cart` — `fmt(undefined).toLocaleString`
- **Важность:** 🔴 Блокер
- **Дата:** 19.04.2026
- **Коммит:** `a4a917e`
- **Файлы:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:** Бэкенд возвращает сырой prisma-cart без `totalAmount`/`subtotal`/`currencyCode`. `fmt()` теперь coerce через `Number(n) || 0`. `totalAmount` считается на клиенте из items если бэк не прислал. 4 места `fmt(cart!.totalAmount)` заменены на `fmt(totalAmount)`.

### ✅ [WEB-BUYER-PRICE-ZERO-001] Товары в корзине и в оформлении показывают «0 сум»
- **Важность:** 🔴 Блокер
- **Дата:** 19.04.2026
- **Коммиты:** `9968cca`, `214ecaa`
- **Файлы:** `apps/web-buyer/src/app/(minimal)/cart/page.tsx`, `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** Бэк делает `Number(Prisma.Decimal)` → NaN → `unitPrice = 0`. Ввёл helper `itemUnitPrice(i)` с цепочкой fallback: `variant.salePriceOverride → variant.priceOverride → salePriceSnapshot → unitPrice → unitPriceSnapshot → product.salePrice → product.basePrice`. `toNum()` проверяет `Number.isFinite`. На checkout «Состав заказа» теперь рендерится из `useCart()` (product.basePrice гарантированно есть).

### ✅ [WEB-BUYER-CHECKOUT-BOUNCE-001] На `/checkout` юзера выкидывает обратно в корзину через пару секунд
- **Важность:** 🔴 Блокер
- **Дата:** 19.04.2026
- **Коммит:** `fab6310`
- **Файлы:** `apps/web-buyer/src/hooks/use-checkout.ts`, `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** `useCheckoutPreview` имел `staleTime: 0` + default `refetchOnWindowFocus: true` → любой клик в input → refetch → если `/checkout/preview` падал с 401/422, `preview.data` становился undefined → useEffect редиректил на /cart. Поднял `staleTime` до 60с, выключил refetchOnWindowFocus, редирект только при `isSuccess && items.length === 0 && cartItems.length === 0`. Фронт принимает оба варианта бэка: `items` или `validItems`.

### ✅ [WEB-BUYER-CONFIRM-SILENT-001] Кнопка «Подтвердить заказ» ничего не делала
- **Важность:** 🔴 Блокер
- **Дата:** 19.04.2026
- **Коммит:** `88cb747`
- **Файлы:** `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`
- **Что сделано:** `handleConfirm` имел ранний `return` на `!preview.data` — если preview упал с 401/422, клик тихо игнорировался. Убрал этот guard (бэк confirm не зависит от preview — берёт buyerId из JWT, cart из БД). Добавил `scrollTo` вниз при ошибке чтобы ErrorBanner был виден под sticky-кнопкой. `storeId` для аналитики берётся fallback'ом из `cart?.storeId`.

### 📋 Сводка Пуш-коммитов (8 штук):
- `f9fe75e` — cart cache invalidate
- `7a0ad5e` — deliveryAddress optional guards
- `a4a917e` — fmt defensive + client-side total
- `9968cca` — unitPriceSnapshot fallback
- `fab6310` — checkout no-bounce + contract tolerance
- `214ecaa` — price fallback chain (basePrice)
- `88cb747` — confirm allows missing preview
- `e068953` — docs: pinpoint verify-otp root cause

---

## 2026-04-18 — Сессия 26 (Азим, продолжение 2)

### ✅ [TMA-ORDER-CARD-REDESIGN-001] Перерисована карточка заказа в TMA seller
- **Важность:** 🟡 UX
- **Дата:** 18.04.2026
- **Файлы:** `apps/tma/src/pages/seller/OrdersPage.tsx`
- **Что случилось:** После добавления preview-row (коммит `42f45cd`) карточка стала кривой: `#ORD-MO2NEAFC-VZ27` wrap'ался на 2 строки, `ДОСТАВЛЕН` висел посредине, `300 000 сум` ломался по словам.
- **Что сделано:** Единый компактный layout — слева thumbnail 48×48, справа двухстрочная зона: (1) title товара + amount (right, whitespace-nowrap), (2) meta `#short · дата · phone` + badge (right). Action-кнопки под карточкой. Order number сокращён — убран `ORD-` префикс через `shortOrderNumber()`, дата сокращена до `дд.мм` через `shortDate()`.

---

## 2026-04-18 — Сессия 26 (Азим, продолжение)

### ✅ [TMA-STOCK-INPUT-001] Ведущий `0` в input остатка — починено
- **Важность:** 🟡 UX
- **Дата:** 18.04.2026
- **Файлы:** `apps/tma/src/pages/seller/AddProductPage.tsx`, `apps/tma/src/pages/seller/EditProductPage.tsx`
- **Что сделано:** Initial state stock → `''`, onChange стрипает ведущие нули `/^0+(?=\d)/`, placeholder "0" остался. Теперь при вводе "5" получаем "5", а не "05".

### ✅ [TMA-PRODUCT-DELETE-ARCHIVE-001] Кнопки «Архивировать» + «Удалить» в ProductsPage
- **Важность:** 🟡 UX
- **Дата:** 18.04.2026
- **Файлы:** `apps/tma/src/pages/seller/ProductsPage.tsx`
- **Что сделано:** Добавлены две новые кнопки рядом с pause/play:
  - 📥 **Архивировать** (для ACTIVE / DRAFT) — `PATCH /seller/products/:id/status { status: ARCHIVED }`
  - 🗑 **Удалить** (для всего кроме ACTIVE и HIDDEN_BY_ADMIN) — `DELETE /seller/products/:id`. Backend запрещает delete ACTIVE (INV-P04), поэтому UI скрывает кнопку.
  - Оба с `window.confirm` подтверждением.

### ✅ [WEB-ORDER-HIDE-COMPLETED-001] Toggle «Скрыть завершённые» в orders list
- **Важность:** 🟢 UX
- **Дата:** 18.04.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/orders/page.tsx`, `apps/tma/src/pages/seller/OrdersPage.tsx`
- **Что сделано:** Добавлен toggle-кнопка «Скрыть завершённые» — фильтрует DELIVERED + CANCELLED из списка. Default: OFF (старые заказы видны как раньше). В web-seller показывается только на tab «Все» (на specific tabs уже фильтр по статусу). INV-C03 соблюдён — заказы НЕ удаляются, только скрываются в UI.

---

## 2026-04-18 — Сессия 26 (Азим)

### ✅ [WEB-ORDER-PREVIEW-001] Превью товара в списке заказов (web-seller + TMA)
- **Важность:** 🟢 UX
- **Дата:** 18.04.2026
- **Кто делал:** Азим
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx` — OrderRow: thumbnail 44×44, title + бейдж `+N`, адрес второстепенно; поиск расширен на `preview.title`; заголовок колонки «Адрес доставки» → «Заказ»; `Package` из lucide как fallback.
  - `apps/tma/src/pages/seller/OrdersPage.tsx` — `Order.preview` в интерфейс; внутри `GlassCard` добавлена строка thumbnail 40×40 + title + бейдж `+N`, fallback 📦.
- **Что сделано:** Подключено новое поле `OrderListItem.preview` от Полата (коммит `9946af5`). Продавец теперь видит товар сразу в списке, не кликая в детали. Стиль — существующий glass-purple web-seller/TMA (liquid-authority остаётся для buyer/admin).
- **Проверено:** визуально по коду. Live-тест после деплоя Railway.

---

## 2026-04-18 — Сессия 25: Полат пакетно закрыл 6 задач (до их выдачи)

### ✅ [TMA-EDIT-001] Чёрный экран при открытии товара с вариантами
- **Важность:** 🔴 Блокер
- **Дата:** 18.04.2026
- **Кто делал:** Полат
- **Коммит:** `cdaeff6`
- **Файлы:** `apps/tma/src/pages/seller/EditProductPage.tsx`
- **Что сделано:** Регрессия от API-VAR-001 (`v.optionValues.length` на новом плоском контракте) устранена. Интерфейс `Variant` приведён к `optionValueIds: string[]`, label собирается из `product.options[].values[]`.

### ✅ [API-SUMMARY-500-001] `/analytics/seller/summary` → HTTP 500 починен
- **Важность:** 🔴 Блокер
- **Дата:** 18.04.2026
- **Кто делал:** Полат
- **Коммит:** `cdaeff6`
- **Файлы:** `apps/api/src/modules/analytics/repositories/analytics.repository.ts`
- **Что сделано:** Analytics repository больше не падает на пустом сторе / рассинхронизированном контракте. Dashboard web-seller получает `{views, topProduct, conversionRate}`.

### ✅ [TMA-ERR-BOUNDARY-001] Error Boundary в TMA
- **Важность:** 🟡 Инфраструктура
- **Дата:** 18.04.2026
- **Кто делал:** Полат
- **Коммит:** `9946af5`
- **Файлы:** `apps/tma/src/App.tsx`
- **Что сделано:** Класс `ErrorBoundary` оборачивает `<Suspense>+<Routes>`. Crash → fallback «Что-то пошло не так» + кнопка домой, Telegram BackButton восстанавливается. Защита от всех будущих регрессий в TMA.

### ✅ [API-ORDER-ADDR-001] Заказ без `deliveryAddress` больше не ломает UI
- **Важность:** 🟡 Баг данных
- **Дата:** 18.04.2026
- **Кто делал:** Полат
- **Коммит:** `9946af5`
- **Файлы:**
  - `apps/api/src/modules/orders/use-cases/get-seller-orders.use-case.ts` — строит `deliveryAddress` из `city + addressLine1`
  - `packages/types/src/api/orders.ts` — `deliveryAddress` optional
- **Что сделано:** Старые заказы (city=null) отдаются с `deliveryAddress=undefined`. Guard Азима (`abb0c41`) корректно отрабатывает. Контракт выровнен.

### ✅ [API-ORDER-PREVIEW-001] Превью товара в списке заказов
- **Важность:** 🟢 UX
- **Дата:** 18.04.2026
- **Кто делал:** Полат
- **Коммит:** `9946af5`
- **Файлы:**
  - `apps/api/src/modules/orders/repositories/orders.repository.ts` — `include items(take:1) + _count`
  - `apps/api/src/modules/orders/use-cases/get-seller-orders.use-case.ts` — строит `preview {title, imageUrl, itemCount}`
  - `packages/types/src/api/orders.ts` — поле `preview` в `OrderListItem`
- **Что сделано:** Новое опциональное `preview` в `OrderListItem`. Азиму осталось отрендерить в `OrderRow` (web-seller + TMA) — задача `WEB-ORDER-PREVIEW-001`.

### ✅ [API-UPLOAD-ENV-001] Env vars Telegram storage в Railway API
- **Важность:** 🟡 Инфраструктура
- **Дата:** 18.04.2026
- **Кто делал:** Азим (Railway Variables) + Полат (запросил)
- **Что сделано:** `TELEGRAM_BOT_TOKEN` и `TELEGRAM_STORAGE_CHANNEL_ID=-1003760300539` добавлены в Railway `savdo-api`.
- **Осталось на Азиме (не код):** добавить `@savdo_builderBOT` администратором канала через Telegram-клиент.

### ✅ Пакет багов 17.04.2026 (коммит `e5c79ad`)
- BUG-006 Cascade deletes — миграция `20260417085123`
- BUG-008 Cart partial unique index — миграция `20260417090000`
- BUG-009 `storeId` передаётся в `UpdateOrderStatus`
- BUG-010 Admin DB whitelist — уже был
- BUG-020 CONFIRMED→SHIPPED в state machine
- BUG-021 Покупатель видит состав заказа (раскрывающиеся карточки)
- BUG-022 Stock badge на ProductPage TMA (зел/жёлт/красн)
- FIX `buyer.user.phone` → `buyer.phone` нормализация

---

## 2026-04-17 — Сессия 22: Комплексный аудит + 7 критических фиксов

### ✅ [BUG-001] Checkout исправлен — новый CreateDirectOrderUseCase
- **Важность:** 🔴 КРИТИЧНО
- **Дата:** 17.04.2026
- **Файлы:**
  - `apps/api/src/modules/checkout/dto/create-direct-order.dto.ts` — НОВЫЙ
  - `apps/api/src/modules/checkout/use-cases/create-direct-order.use-case.ts` — НОВЫЙ
  - `apps/api/src/modules/checkout/orders-create.controller.ts` — переключён на новый use case
  - `apps/api/src/modules/checkout/checkout.module.ts` — зарегистрирован новый use case
- **Что сделано:** Создан `CreateDirectOrderUseCase` принимающий items напрямую (без корзины в БД). Валидирует продукты, one-store constraint (INV-C01), stock для вариантов, создаёт Order атомарно.

### ✅ [BUG-002] Seller не может менять статус чужих заказов
- **Важность:** 🔴 КРИТИЧНО (security)
- **Дата:** 17.04.2026
- **Файлы:**
  - `apps/api/src/modules/orders/use-cases/update-order-status.use-case.ts`
  - `apps/api/src/modules/orders/orders.controller.ts`
- **Что сделано:** Добавлена ownership проверка: `order.storeId !== storeId → 403 Forbidden`.

### ✅ [BUG-003] Товары неопубликованных магазинов скрыты
- **Важность:** 🟡
- **Дата:** 17.04.2026
- **Файлы:** `apps/api/src/modules/products/products.controller.ts`
- **Что сделано:** `stores/:slug/products` и `stores/:slug/products/:id` — добавлена проверка `!store.isPublic → 404`.

### ✅ [BUG-004] variantId сохраняется в корзине
- **Важность:** 🟡
- **Дата:** 17.04.2026
- **Файлы:** `apps/tma/src/lib/cart.ts`, `apps/tma/src/pages/buyer/ProductPage.tsx`, `apps/tma/src/pages/buyer/CheckoutPage.tsx`
- **Что сделано:** `CartItem` добавлен `variantId?: string`, сохраняется при добавлении и передаётся на checkout.

### ✅ [BUG-005] Error state в OrdersPage seller
- **Важность:** 🟢
- **Дата:** 17.04.2026
- **Файлы:** `apps/tma/src/pages/seller/OrdersPage.tsx`
- **Что сделано:** `changeStatus()` и `cancelOrder()` показывают ошибку в UI через `updateError` state.

### ✅ [BUG-006] Out-of-stock вариант больше не выбирается по умолчанию
- **Важность:** 🟢
- **Дата:** 17.04.2026
- **Файлы:** `apps/tma/src/pages/buyer/ProductPage.tsx`
- **Что сделано:** `firstInStock?.id ?? null` вместо `(firstInStock ?? variants[0]).id`.

### ✅ [BUG-007] Same-store validation при добавлении в корзину (INV-C01)
- **Важность:** 🟡
- **Дата:** 17.04.2026
- **Файлы:** `apps/tma/src/lib/cart.ts`, `apps/tma/src/pages/buyer/ProductPage.tsx`
- **Что сделано:** `isSameStore()` проверяет storeId при addToCart, при несовпадении корзина очищается автоматически.

---

## 2026-04-17 — Сессия 21 (Азим): доделать фронт после API-VAR-001 + API-LIST-001

### ✅ [FE-VAR-CLEANUP-001] Удалены defensive `extractOptionValueIds` / `getVariantOptionValueIds` helpers
- **Важность:** 🟢
- **Дата:** 17.04.2026
- **Кто делал:** Азим
- **Файлы:**
  - `apps/web-seller/src/components/product-variants-section.tsx` (-19 строк)
  - `apps/web-buyer/src/lib/variants.ts` (-15 строк, -1 import)
  - `apps/tma/src/lib/variants.ts` (-15 строк, убрано поле `optionValues?` из `VariantMin`)
- **Что сделано:** Полат закрыл API-VAR-001 (`f5b0226`) — backend теперь отдаёт плоский `optionValueIds: string[]` на всех variant эндпоинтах. Убраны все defensive хелперы. Все call-сайты читают `variant.optionValueIds ?? []` напрямую. Комментарии про «backend returns junction» удалены.

### ✅ [FE-VARIANT-BADGE-001] Бейдж «N вариантов» на карточках товара
- **Важность:** 🟡
- **Дата:** 17.04.2026
- **Кто делал:** Азим
- **Файлы:**
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — pill с `Layers` icon + count в top-left изображения, только если `variantCount > 0 && !isUnavailable`, liquid-authority glass-стиль (фиолетовая заливка rgba(167,139,250,.22), blur)
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx` — компактный чип рядом с title в products table, тот же glass-стиль
- **Что сделано:** Полат закрыл API-LIST-001 (`780e79e`) — `ProductListItem.variantCount: number` теперь в ответе. Подключил бейдж в обоих фронтах. Покупатель видит сразу что у товара есть опции, продавец видит в списке сколько вариантов активно.

### ✅ [WEB-BUYER-058] Telegram share-кнопка на странице товара (web-buyer)
- **Важность:** 🟢
- **Дата:** 17.04.2026
- **Кто делал:** Азим
- **Коммит:** `2086aac`
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — Share2 icon кнопка в top bar справа, копирует `t.me/<BOT>?startapp=product_<id>` в clipboard, иконка меняется на Check на 2s после копирования
  - `apps/web-buyer/.env.example` — новая `NEXT_PUBLIC_TG_BOT_USERNAME=savdo_builderBOT` (fallback для кнопки)
- **Что сделано:** Зеркалит share-flow из web-seller products list (см. `ec25b6a`). Покупатель на странице товара может скопировать Telegram deep link и отправить другу — получатель кликом попадает сразу в TMA на этот товар.
- **⚠️ Railway TODO:** Добавить `NEXT_PUBLIC_TG_BOT_USERNAME=savdo_builderBOT` в Variables сервиса `savdo-buyer`. Без переменной fallback работает, но лучше выставить явно.

### ✅ [CONFLICT-LUCIDE-001] Резолв конфликта lucide-react ↔ TMA redesign
- **Важность:** 🔴
- **Дата:** 17.04.2026
- **Кто делал:** Азим
- **Коммит:** `a1e2797` (на main)
- **Что сделано:** Наш `5950a71` (замена эмодзи на lucide-react во всех 3 фронтах) конфликтовал с редизайном TMA Полата (`9f2d224`) и его анимированным `<Sticker>` (`f210994`). Дропнули TMA часть коммита, оставили только web-buyer + web-seller (26 файлов, +135/-108). Rebase прошёл чисто. TMA остался с анимированными стикерами Полата (это намеренный дизайн-элемент, а не забытые эмодзи).

---

## 2026-04-16 — [API-VAR-001, API-LIST-001, API-CONTRACT-001] Нормализация variants — проверено, уже реализовано (Полат)

### ✅ [API-VAR-001] normalizeVariant() реализован и применён ко всем эндпоинтам
- **Важность:** 🔴
- **Дата:** 16.04.2026
- **Файлы:** `apps/api/src/modules/products/products.controller.ts` (lines 532-538)
- **Что сделано:** `normalizeVariant()` уже реализован (Абубакир) и применяется ко всем variant-возвращающим эндпоинтам: `GET /seller/products/:id/variants`, `GET /seller/products/:id`, `GET /storefront/products/:id`, `POST/PATCH /seller/products/:id/variants`. Junction-формат `optionValues[]` удаляется, ответ содержит `optionValueIds: string[]`. Задача удалена из tasks.md.

### ✅ [API-LIST-001] variantCount в ProductListItem — уже реализован
- **Важность:** 🟡
- **Дата:** 16.04.2026
- **Файлы:** `apps/api/src/modules/products/products.controller.ts` (lines 81, 458, 509), `packages/types/src/api/products.ts` (line 58)
- **Что сделано:** `variantCount: _count?.variants ?? 0` присутствует во всех list-эндпоинтах (seller + storefront). Тип `ProductListItem.variantCount: number` задекларирован. Задача удалена из tasks.md.

### ✅ [API-CONTRACT-001] Закрыт
- **Важность:** 🟢
- **Дата:** 16.04.2026
- **Что сделано:** Отдельная docs-страница не создавалась — контракт соответствует типам в `packages/types`. Задача удалена из tasks.md.

---

## 2026-04-16 — [ADM-AUDIT-001, ADM-ENV-001, ADM-CAST-001] Аудит недочётов и исправления (Полат)

### ✅ [ADM-AUDIT-001] Добавлены audit logs в hideProduct и restoreProduct
- **Важность:** 🔴
- **Дата:** 16.04.2026
- **Файлы:** `apps/api/src/modules/admin/admin.controller.ts`
- **Что сделано:** `hideProduct` и `restoreProduct` не писали audit_log — нарушение INV-A01 ("Admin action always writes audit_log"). Добавлены `writeAuditLog` с action `PRODUCT_HIDDEN` и `PRODUCT_RESTORED`. Теперь все 4 product admin-действия логируются: hide, restore, archive, forceDelete.

### ✅ [ADM-ENV-001] apps/admin/.env.example исправлен
- **Важность:** 🔴
- **Дата:** 16.04.2026
- **Файлы:** `apps/admin/.env.example`
- **Что сделано:** `NEXT_PUBLIC_API_URL` заменён на `VITE_API_URL` (admin — Vite SPA, не Next.js). Добавлена `VITE_BUYER_URL` (использовалась в StoreDetailPage.tsx но отсутствовала в примере). Лог ADM-ENV-001 закрыт.

### ✅ [ADM-CAST-001] Убран лишний тип-каст в forceDeleteProduct
- **Важность:** 🟡
- **Дата:** 16.04.2026
- **Файлы:** `apps/api/src/modules/admin/admin.controller.ts` (line 435)
- **Что сделано:** `(product as unknown as Record<string, unknown>)['title']` → `product.title`. Prisma-тип `Product.title: String` — не optional, каст был излишним.

---

## 2026-04-16 — [TMA-FIX-STORES] StoresPage: город + контакты продавца + поиск по городу (Полат)

### ✅ [TMA-FIX-STORES] Карточки магазинов показывают город и кнопку «написать продавцу»
- **Важность:** 🟡
- **Дата:** 16.04.2026
- **Файлы:**
  - `apps/tma/src/pages/buyer/StoresPage.tsx`
  - `apps/api/src/modules/stores/repositories/stores.repository.ts`
- **Что сделано:**
  - Backend: `findAllPublished()` теперь возвращает `city` и `telegramContactLink` в select
  - Frontend: интерфейс `Store` расширен (`city`, `telegramContactLink`); поиск учитывает город; карточка показывает `📍 Город`; кнопка ✈️ открывает Telegram-контакт через `tg.openTelegramLink` (fallback `window.open`), клик изолирован от навигации по карточке

---

## 2026-04-16 — [ADM-FORCE-DELETE] Принудительное удаление товара в админке (Полат)

### ✅ [ADM-FORCE-DELETE] Принудительное удаление товара продавца
- **Важность:** 🔴
- **Дата:** 16.04.2026
- **Файлы:**
  - `apps/api/src/modules/admin/admin.controller.ts`
  - `apps/admin/src/pages/ProductsPage.tsx`
- **Что сделано:**
  - Backend: добавлен `DELETE /api/v1/admin/products/:id` — soft delete без ограничений по статусу (обходит продавецкое правило "нельзя удалить ACTIVE"), пишет `PRODUCT_FORCE_DELETED` в audit_log
  - Frontend: добавлена кнопка "Удалить" в таблице товаров с inline-подтверждением ("Да, удалить" / "Отмена") — destructive action защищена двойным кликом

---

## 2026-04-15 — Сессия 19: итог (Азим, 4 коммита, 17 файлов)

> Полный цикл вариативных товаров: от создания продавцом до выбора покупателем + deep links.

| # | Коммит | Файлов | Что сделано |
|---|--------|--------|-------------|
| 1 | `918d9d1` | 7 (+766/-70) | **Option Groups UI в web-seller.** Продавец создаёт группы («Размер», «Цвет»), значения (S/M/L). При создании варианта — `<select>` для каждой группы. Авто-генерация `titleOverride` из выбранных значений. Опции immutable в edit (соответствует `UpdateVariantDto`). Defensive `extractOptionValueIds` из-за рассинхрона контракта. |
| 2 | `e2a85cb` | 5 (+429/-43) | **Group-based variant selector в web-buyer + TMA.** Покупатель видит чипсы по группам: «Размер: S/M/L», «Цвет: Красный/Синий». Выбор в каждой группе → резолвим variant. Недоступные комбинации зачёркнуты. MainButton TMA реактивно меняет текст. Helper-модули `lib/variants.ts` в обоих апп. |
| 3 | `4d3058d` | 5 (+59) | **next/image remotePatterns + chat_started.** Web-buyer принимает абсолютные image URL от api-хоста (нужно после Полатовского `6fdae3a`). Событие `chat_started` теперь fire-ится при клике на Telegram-кнопку (product page + order detail ×2). |
| 4 | `ec25b6a` | 4 (+72/-8) | **TMA deep link на товар + share-кнопка.** `startapp=product_<id>` → TMA fetches `/storefront/products/:id` → редирект на `/buyer/store/<slug>/product/<id>`. В web-seller products list — вторая иконка (голубая плоскость) копирует Telegram-ссылку. Новая `NEXT_PUBLIC_TG_BOT_USERNAME` переменная. |

### Новые файлы (5)
- `apps/web-seller/src/lib/api/product-options.api.ts`
- `apps/web-seller/src/hooks/use-product-options.ts`
- `apps/web-seller/src/components/product-option-groups-section.tsx`
- `apps/web-buyer/src/lib/variants.ts`
- `apps/tma/src/lib/variants.ts`

### Известные проблемы (для Полата — см. `analiz/tasks.md`)
- **[API-VAR-001]** 🔴 Рассинхрон: backend возвращает `variant.optionValues[]` (junction), а тип декларирует `optionValueIds: string[]`. Фронт обходит через defensive helper.
- **[API-LIST-001]** 🟡 `ProductListItem` не содержит `variantCount` — бейдж «есть варианты» на карточках пока невозможен.

### Требует реального теста (TMA-002)
Deep links, OG-превью, buyer+seller flow в настоящем Telegram. См. `analiz/next_session.md`.

---

## 2026-04-15 — Сессия 19 (часть 4): TMA deep link на товар + Telegram-share кнопка

### ✅ [TMA-014] Deep link `startapp=product_<id>` → ProductDetailPage
- **Важность:** 🟡
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/pages/HomePage.tsx`
- **Что сделано:** `parseStartParam` теперь возвращает `{type, value}`. Для `store_<slug>` — редирект `/buyer/store/<slug>` (как раньше). Для `product_<id>` — fetch `/storefront/products/:id` → из ответа берём `store.slug` и редиректим на `/buyer/store/<slug>/product/<id>`. На ошибку fetch — редирект на `/buyer`.

### ✅ [WEB-SELLER-041] «Telegram-ссылка» на карточке товара в списке
- **Важность:** 🟡
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-seller/src/app/(dashboard)/products/page.tsx`, `apps/web-seller/.env.example`
- **Что сделано:** Рядом с копированием web-ссылки добавлена вторая кнопка (голубая иконка плоскости) которая копирует `https://t.me/<BOT_USERNAME>?startapp=product_<id>`. Клик по такой ссылке в Telegram → TMA открывается сразу на странице товара. Новая переменная `NEXT_PUBLIC_TG_BOT_USERNAME` в .env.example (fallback `savdo_builderBOT`). Заодно починил хардкод `savdo.uz` в existing copy — теперь использует `NEXT_PUBLIC_BUYER_URL` (уже был в env).

---

## 2026-04-15 — Сессия 19 (часть 3): remotePatterns для cross-domain медиа + chatStarted

### ✅ [WEB-BUYER-056] next.config remotePatterns для абсолютных image URL
- **Важность:** 🟡
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/next.config.ts`
- **Что сделано:** Полат в `6fdae3a` стал возвращать абсолютные URL (`https://<api-host>/api/v1/media/proxy/<id>`) для Telegram-bucket фотографий. `next/image` в продакшене отклоняет хосты не из `remotePatterns`. Добавил patterns: API-host из `NEXT_PUBLIC_API_URL`, `**.r2.dev`, `**.r2.cloudflarestorage.com`, `**.up.railway.app`. Web-seller использует `<img>` (не Image) → config не нужен.

### ✅ [WEB-BUYER-057] chat_started track event — подключён
- **Важность:** 🟢
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`, `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`
- **Что сделано:** `track.chatStarted` был объявлен в `analytics.ts`, но не вызывался. Добавил onClick на Telegram-кнопку на product page (thread_type='product') и в двух местах order detail page (badge + sticky CTA, thread_type='order'). Store page — server component, пропущен. Новый баг открыт: `[API-LIST-001]` — `ProductListItem` не содержит variantCount, бейдж на карточке требует backend изменения.

---

## 2026-04-15 — Сессия 19 (часть 2): Group-based variant selector для покупателей

### ✅ [BUYER-VAR-001] Групповой выбор опций в web-buyer и TMA
- **Важность:** 🔴
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:**
  - `apps/web-buyer/src/lib/variants.ts` (new)
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`
  - `apps/tma/src/lib/variants.ts` (new)
  - `apps/tma/src/pages/buyer/ProductPage.tsx`
- **Что сделано:** Если у товара есть `optionGroups`, покупатель видит отдельные ряды чипсов по группе («Размер: S / M / L», «Цвет: Красный / Синий») вместо плоского списка вариантов. Выбор одного значения в каждой группе → резолвим variant из `activeVariants` через `findVariantBySelection`. Недоступные комбинации показаны зачёркнутым. Стартовая selection = первый in-stock вариант. В TMA MainButton меняет текст («Выберите вариант» / «Нет в наличии» / «В корзину — X»). Helper `getVariantOptionValueIds` handles junction-format (см. API-VAR-001). Fallback на старый плоский рендер когда групп нет.

---

## 2026-04-15 — Сессия 19: Option Groups UI в web-seller

### ✅ [WEB-SELLER-040] Option Groups + вариантные опции в редакторе товара
- **Важность:** 🔴
- **Дата:** 15.04.2026
- **Кто делал:** Азим
- **Файлы:**
  - `apps/web-seller/src/lib/api/product-options.api.ts` (new) — 6 функций CRUD groups/values
  - `apps/web-seller/src/hooks/use-product-options.ts` (new) — TanStack Query мутации, инвалидируют product detail + variants
  - `apps/web-seller/src/components/product-option-groups-section.tsx` (new) — секция «Опции товара» с inline CRUD групп и chip-редактированием значений, автоген `code` из имени (кириллица → латиница)
  - `apps/web-seller/src/components/product-variants-section.tsx` — `InlineVariantForm` теперь рендерит селекты значений для каждой группы при создании (в редактировании скрыты, т.к. `UpdateVariantDto` не принимает `optionValueIds`); строка варианта показывает подпись `Размер: XL · Цвет: Красный`; кнопка «+ Добавить вариант» блокируется пока в группе нет значений
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — подключил `ProductOptionGroupsSection`, пробросил `optionGroups` в `ProductVariantsSection`
- **Что сделано:** Полностью закрыт variants UI: seller создаёт группы («Размер», «Цвет»), добавляет значения (S/M/L), затем создаёт варианты с выбором из каждой группы. Галочка save disabled пока не выбраны все опции. Авто-генерация `titleOverride` из значений, если seller оставил поле пустым (иначе покупатель видит SKU вместо «S · Красный»). Обнаружен рассинхрон контракта `ProductVariant.optionValueIds` — defensive-хелпер `extractOptionValueIds` читает оба формата; баг залоггирован в `analiz/logs.md` [API-VAR-001]. TS-check чистый.

---

## 2026-04-13 — Сессия 18: API фильтры заказов + Option Groups CRUD

### ✅ [API-032] Фильтры для GET /seller/orders
- **Важность:** 🟡
- **Дата:** 13.04.2026
- **Кто делал:** Полат
- **Файлы:** `apps/api/src/modules/orders/dto/list-orders.dto.ts`, `repositories/orders.repository.ts`, `use-cases/get-seller-orders.use-case.ts`, `orders.controller.ts`
- **Что сделано:** Добавлены параметры `search` (ищет по orderNumber, customerFullName, customerPhone, city, addressLine1), `dateFrom`, `dateTo` (ISO8601 фильтр по placedAt).

### ✅ [API-030] CRUD для ProductOptionGroup / ProductOptionValue
- **Важность:** 🔴
- **Дата:** 13.04.2026
- **Кто делал:** Полат
- **Файлы:** `apps/api/src/modules/products/repositories/option-groups.repository.ts`, `dto/create-option-group.dto.ts`, `dto/update-option-group.dto.ts`, `dto/create-option-value.dto.ts`, `dto/update-option-value.dto.ts`, `products.controller.ts`, `products.module.ts`, `packages/types/src/api/products.ts`
- **Что сделано:** 6 эндпоинтов (POST/PATCH/DELETE для групп и значений). OptionGroupsRepository с транзакционными удалениями. Типы OptionGroup/OptionValue добавлены в packages/types.

### ✅ [API-031] Деактивация вариантов при удалении OptionGroup
- **Важность:** 🔴
- **Дата:** 13.04.2026
- **Кто делал:** Полат
- **Файлы:** `apps/api/src/modules/products/repositories/option-groups.repository.ts`
- **Что сделано:** deleteGroup() в транзакции: находит затронутые варианты → isActive=false → удаляет junction записи → удаляет values → удаляет group.

---

## 2026-04-14 — Сессия 18: TMA analytics + ProductDetailPage + polish

### ✅ [TMA-008] Дополнение track-инструментации
- **Важность:** 🟡
- **Дата:** 14.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/lib/analytics.ts`, `apps/tma/src/pages/seller/{StorePage,ProfilePage}.tsx`, `apps/tma/src/pages/buyer/CartPage.tsx`, `apps/web-buyer/src/app/(minimal)/cart/page.tsx`
- **Что сделано:**
  - TMA analytics расширен: `storeLinkCopied`
  - TMA seller StorePage и ProfilePage — шлют `storeLinkCopied` при копировании ссылки
  - TMA CartPage — `addToCart` на +1 инкрементах
  - web-buyer CartPage row — `addToCart` на +1 (раньше был только на product page)

### ✅ [TMA-009] ProductDetailPage в TMA
- **Важность:** 🟡
- **Дата:** 14.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/App.tsx`, `apps/tma/src/pages/buyer/ProductPage.tsx` (new), `apps/tma/src/pages/buyer/StorePage.tsx`
- **Что сделано:**
  - Новый роут `/buyer/store/:slug/product/:id`
  - Галерея mediaUrls с thumbnails, выбор варианта (disable при `stockQuantity<=0`), описание
  - Telegram MainButton "В корзину — {price} сум" при открытой странице
  - Fire `productViewed` + `addToCart` с вариантом
  - StorePage: клик по карточке → детальная страница, "+" остаётся как quick-add (stopPropagation)

### ✅ [WEB-BUYER-055] Product page — not-found состояние
- **Важность:** 🟢
- **Дата:** 14.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`
- **Что сделано:** При 404 от `useProduct` раньше показывалась пустая галерея + disabled кнопка "В корзину". Теперь явный экран "Товар не найден" с кнопкой «К магазину».

### ✅ [ENV-001] Синхронизация `.env.example`
- **Важность:** 🟢
- **Дата:** 14.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/web-buyer/.env.example`, `apps/tma/.env.example`
- **Что сделано:**
  - web-buyer: добавлен `NEXT_PUBLIC_BUYER_URL` (используется в `layout.tsx` для metadataBase)
  - tma: добавлен `VITE_BOT_USERNAME` (используется в seller ProfilePage/StorePage для deep links)
  - `apps/admin/.env.example` — у Полата неверный префикс (`NEXT_PUBLIC_` вместо `VITE_`), залогировано в `analiz/logs.md`

### ✅ [TMA-007] TMA отправляет track events в `/analytics/track`
- **Важность:** 🟡
- **Дата:** 14.04.2026
- **Кто делал:** Азим
- **Файлы:** `apps/tma/src/lib/analytics.ts` (new), `apps/tma/src/lib/cart.ts`, `apps/tma/src/pages/buyer/StorePage.tsx`, `apps/tma/src/pages/buyer/CheckoutPage.tsx`
- **Что сделано:**
  - До этого TMA не слал ни одного события — покупатели через Telegram были невидимы в `/analytics/seller/summary`.
  - Создан `lib/analytics.ts` (зеркало web-buyer): `storefrontViewed`, `productViewed`, `addToCart`, `checkoutStarted`, `orderCreated`. `source='tma'` по умолчанию.
  - `StorePage`: `storefrontViewed` после загрузки (deduped через `trackedRef`), `addToCart` при клике на «+».
  - `CheckoutPage`: `checkoutStarted` при маунте, `orderCreated` после успешного POST.
  - В `CartItem` добавлено `storeId` (было только `storeSlug`) — иначе события не знают `store_id`. Старые корзины без `storeId` отфильтровываются `isValidItem` — пользователь получит пустую корзину при первом входе после обновления (приемлемо).
  - TMA `tsc --noEmit` — 0 ошибок.

---

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

### ✅ [WEB-BUYER-DESIGN-IMPL-001] Task 5 — Product detail page redesign
- **Важность:** 🔴
- **Дата:** 05.05.2026
- **Файлы:** 
- **Что сделано:** Desktop split 7fr:5fr grid, mobile sticky bottom CTA bar, qty stepper, variant picker (size pills + color circles), primary CTA brand fill с ценой, secondary CTA «💬 Спросить» outline, price in colors.textStrong, seller card, editorial labels, attributes + description full-width below split, related products section placeholder. Коммит .
