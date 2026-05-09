# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 🆕 Web-buyer Design Audit (09.05.2026) — Soft Color Lifestyle

> Полный отчёт: `analiz/audit-web-buyer-design-2026-05-09.md` (25 findings: 3 P1 / 14 P2 / 8 P3, health 7.5/10).

## WB-DESIGN-FIX-WAVES (Азим)

- [ ] **`WB-DESIGN-WAVE-1`** (P1) — emoji-picker полностью на чужой dark/violet/glassmorphism теме → перекрасить на токены, убрать `backdrop-blur`. Файл: `apps/web-buyer/src/components/emoji-picker.tsx:84-133`. Closes P1-001.
- [ ] **`WB-DESIGN-WAVE-2`** (P1) — chat edit-bubble white-on-white в light: 4 rgba/hex → tokens (brandTextOnBg-совместимые). Файл: `apps/web-buyer/src/app/(shop)/chats/page.tsx:384-403`. Closes P1-002.
- [ ] **`WB-DESIGN-WAVE-3`** (P2) — page headings `text-lg` (18px) → `text-2xl` (24px) на 4 страницах: orders/profile/notifications/chats. Closes P2-001.
- [ ] **`WB-DESIGN-WAVE-4`** (P2) — Stats row числа в `colors.brand` (profile) + timeline current dot `animate-pulse` (orders/[id]). Closes P2-002 + P2-003.
- [ ] **`WB-DESIGN-WAVE-5`** (P2) — radius cleanup: checkout OTP `rounded-2xl` → `rounded`, OtpGate `rounded-xl/2xl` → 4/8px, CategoryAttributeFilters panel + chats outer `rounded-2xl` → `rounded-lg`. Closes P2-005, P2-006, P2-007, P2-008.
- [ ] **`WB-DESIGN-WAVE-6`** (P1, отдельной сессией) — pinned product context strip в chat thread: `rgba(brand,0.06)` полоса с 40px thumb + название + цена + «Открыть →» когда `thread.contextType === 'PRODUCT'`. Файл: `chats/page.tsx ChatView`. Closes P1-003.
- [ ] **`WB-DESIGN-WAVE-7`** (P2 + P3 backlog) — оставшиеся: HeaderSearch dropdown shadow → shadow-hover, CategoryAttributeFilters toggle `bg-white` → token, ProductsWithSearch md breakpoint 3→4 col, hardcoded `#FFFFFF` в danger buttons → `colors.brandTextOnBg` (4 места), profile spinner `text-white` → token, storefront sections «Все NN →» link + dividers, ThemeToggle/homepage/chats shadows excess, OtpGate icon container радиус, ProductsWithSearch search input `rounded-xl` → `rounded-md`, chat unread badge `text-white` → token, buyer message timestamp rgba → token, chats message context-menu shadow. Closes P2-004, P2-009..014, P3-001..003, P3-005..008.

**Skipped / requires API work:**
- P3-004 (sale chip) — нужен `isSale` flag в категориях API.
- P2-014 (Повторить заказ button) — нужен batch add-to-cart endpoint от Полата.

---

# 🆕 Design Audit (08.05.2026) — Admin / API / TMA

> Полный отчёт: `analiz/design-audit-2026-05-08.md` (51 findings: 11 P0, 14 P1, 14 P2, 12 P3).
> Использованы claude-skills: ui-design-system, apple-hig-expert, api-design-reviewer, senior-backend.

## Sprint A — cross-platform polish (P0 only) — 10 тикетов (3 закрыто)

- [ ] **`TMA-DESIGN-HIT-AREA-001`** (P0, T1) — qty buttons `w-7 h-7` (28px) → `w-10 h-10` (40px). Файлы: CartPage:97-121, OrdersPage, ChatPage qty.
- [ ] **`TMA-DESIGN-FG-TOKENS-001`** (P0, T2) — 100+ inline `rgba(255,255,255,X)` → `FG.strong/muted/dim` в `styles.ts`. Миграция CartPage / OrdersPage / ProductPage.
- [x] **`TMA-DESIGN-A11Y-LEFTOVERS-001`** ✅ 08.05.2026 — verified: упомянутые в аудите места (seller/ChatPage:205) — modal backdrop с stopPropagation + ESC, acceptable per ADR. buyer/ProductPage:252-256 уже закрыто `3400ecc`. Реальных нарушений не осталось.
- [ ] **`TMA-DESIGN-ROLE-DIFF-001`** (P0, T4) — buyer (orchid) vs seller (cyan) визуальная дифференциация через `data-role` + scoped CSS-переменные.
- [x] **`TMA-DESIGN-SPINNER-CLEANUP-001`** ✅ 08.05.2026 — заменены 3 initial-load `<Spinner>` → Skeleton: buyer/ChatPage:442 (4× message Skeleton), seller/ChatPage:506 (то же), seller/EditProductPage:597 (`ProductDetailSkeleton`). Inline Spinner на send-button и loadMore оставлены — они приемлемы.
- [ ] **`ADMIN-A11Y-MODAL-001`** (P0, A1+A2) — DashboardLayout aria-* + ModerationPage modal на Radix Dialog.
- [ ] **`ADMIN-DESIGN-TOKENS-SURFACE-001`** (P0, A3) — `--surface-error/-warning/-success` CSS-переменные + миграция hardcoded `rgba(239,68,68,...)`.
- [ ] **`API-WS-EVENTS-NAMING-001`** (P0, B1) — единый стиль `<namespace>:<action>` для всех Socket.IO events. **⚠️ требует sync с frontend (TMA, web-buyer, web-seller) — не делать в отдельной сессии.**
- [x] **`API-HTTP-201-CREATED-001`** ✅ 08.05.2026 — `@HttpCode(HttpStatus.CREATED)` добавлен на 6 POST endpoints в `products.controller.ts`: seller/products, /variants, /option-groups, /option-groups/:gid/values, /images, /attributes. NestJS уже отдавал 201 неявно для @Post — теперь explicit для consistency с cart/checkout.
- [ ] **`API-ORDERS-ALIAS-REMOVE-001`** (P0, B3) — удалить `GET /orders/:id` alias. **⚠️ потенциально breaking для web-buyer — проверить вызовы перед удалением.**

## Sprint B — design system hardening (P1) — 8 тикетов

- [ ] **`ADMIN-THEME-VARS-MIGRATE-001`** (P1, A4+A5+A12) — Button/Badge/Dialog → CSS-переменные.
- [ ] **`TMA-TYPOGRAPHY-SCALE-001`** (P1, T6) — 280 hardcoded `text-[11px]/xs/sm` → enum + CSS-vars с desktop scale.
- [ ] **`API-SWAGGER-001`** (P1, B4) — `@nestjs/swagger` + `/api/docs` + `@ApiOperation` на топ-20.
- [ ] **`API-PRODUCTS-CTRL-SPLIT-001`** (P1, B5) — products.controller.ts (942 LOC) → 3 controllers.
- [ ] **`ADMIN-A11Y-TABS-OTP-001`** (P1, A7+A8) — Tabs primitive + LoginPage OTP `<fieldset>`.
- [ ] **`ADMIN-PAGINATION-DISABLED-001`** (P1, A6) — `disabled={page === 1}` на pagination buttons.
- [ ] **`API-IDEMPOTENCY-KEY-001`** (P1, B7) — `Idempotency-Key` header на /checkout/confirm + /orders.
- [ ] **`API-PAGINATION-ENVELOPE-001`** (P1, B8) — единый `{ data, meta: { total, page, limit, totalPages } }`.

## Sprint C — long tail (P2/P3) — 26 тикетов

См. `analiz/design-audit-2026-05-08.md` секции P2/P3.

---

# 🆕 Web-buyer аудит 05.05 — закрыты 7 critical 08.05 (Азим)

✅ **BUG-WB-AUDIT-001..007 + 009-FE** — 7 critical из `analiz/logs.md WEB-BUYER-AUDIT-2026-05-05` закрыты в одном проходе:
- 001 (`useCart` enabled) · 002 (`useBuyerSocket` leave-room + destroySocket в logout) · 003 (`useChatSocket` leave-room) · 004 (`useOrders` enabled) · 005 (`chats handleSend` try/catch) · 006 (orders/[id] z-index 51) · 007 (product detail useEffect reset on id) · 009-FE (checkout `customerFullName`/`customerPhone` шлёт + расширил `CheckoutConfirmRequest` в `packages/types`).

Подробности и список изменённых файлов — `analiz/done.md`.

**Major-волна закрыта 08.05** (BUG-008, 010, 011, 012, 013, 014, 017, 019). Skipped с обоснованием в `analiz/done.md`: 015 (chat menu — нет реального race), 016 (OTP purpose — единственный безопасный default), 018 (defensive cast пока Полат не выровнял `ProductListItem` shape).

**Minor-волна закрыта 08.05** (BUG-020..025). 026 принят как negligible.

**Весь аудит 05.05 (BUG-WB-AUDIT-001..026) закрыт в одну сессию.** Подробности в `analiz/done.md`.

**Контракт-задачи Полата (закрыты 08.05.2026):**
- [x] `API-PRODUCT-LIST-IMAGES-CONTRACT-001` ✅ — `ProductListItem` теперь декларирует ОБА поля: `mediaUrls: string[]` (convenience) + `images: { url }[]` (canonical). API заполняет оба на storefront/products list (platform-wide + store-specific). Backward compat сохранён.
- [x] `API-STOREFRONT-SEARCH-CONTRACT-001` ✅ — создан `packages/types/src/api/search.ts` с `SearchStoreHit/SearchProductHit/StorefrontSearchResponse`. Экспортирован из `packages/types/src/index.ts`. Азим может удалить локальный тип из `web-buyer/src/lib/api/search.api.ts` и импортировать из `@savdo-builder/types`.

---

# 🆕 Спринт TMA Quality + Platform Hardening (04-09.05.2026)

> Полный план: `analiz/sprint-tma-quality-04-05-2026.md`. Здесь — короткая чек-лист.

## 🔴 P0 — Полат

- [x] **`AUDIT-NETWORK-LOADING-P0-FIXES`** ✅ 08.05.2026 — закрыты P0 из `analiz/audit-network-loading-2026-05-07.md`: (1) `lib/api.ts` уже имеет auto-bust cache на не-GET (parallel session) + добавил `timeout?: number` в ApiOptions interface (был implicit, TS would complain on opts.timeout). (2) Race condition fix в `buyer/OrdersPage.tsx`: AbortController на loadMore + toggleExpand detail + loadingMore guard от double-tap.
- [x] **`TMA-CHAT-403-READ-001`** — 403 на `/chat/threads/:id/messages` для dual-role. ✅ Коммит `2b2bca7`.
- [x] **`TMA-CHAT-403-WRITE-001`** ✅ 06.05.2026 — `sendMessage`/`editMessage`/`deleteMessage`/`markAsRead`/`deleteThread`/`reportMessage` в `chat.controller.ts` уже используют `resolveBothProfileIds` + `isBuyer || isSeller` паттерн (как `getMessages` после 2b2bca7). Параллельная сессия закрыла, тикет был stale в tasks.md. Use-case `send-message` валидирует `senderUserId` через `thread.buyerId === senderUserId || thread.sellerId === senderUserId` — корректно, контроллер передаёт правильный profile-id.
- [x] **`TMA-PHOTO-UPLOAD-DIAG-001`** ✅ 08.05.2026 — root cause найден через code review (без логов): `buyer/ChatPage.sendPhoto` + `seller/ChatPage.sendPhoto` использовали `api()` с `body: FormData`, но `api()` делал `JSON.stringify(opts.body)` → формдата сериализовалась в `"{}"`, файл терялся целиком. Дополнительно: destructure `uploadRes.id` — API возвращает `mediaFileId`. Чинено через `apiUpload()` (XHR multipart) + preventive guard в `lib/api.ts:doFetch` бросает error «Use apiUpload() for FormData» если кто-то снова попробует. Подробности в `analiz/done.md`.

## 🟠 P1 — Полат

- [x] **`TMA-SELECT-CUSTOM-001`** ✅ 06.05.2026 — `Select.tsx` уже в TMA (порт от web-seller с TMA-стайлами + inline SVG icons). Native `<select>` удалён из TMA — AddProductPage использует Select. EditProductPage/SettingsPage не имеют selects (используют кнопки/toggle-группы).
- [x] **`TMA-CROPPER-UX-001`** ✅ 06.05.2026 — `ImageCropper` имеет zIndex 9999, видимый красный «✕ Отменить» 44pt в header слева, заголовок «Кадрировать фото» по центру. AddProductPage показывает «➕ Добавить ещё фото» когда `photoPreviews.length > 0`, EditProductPage — кнопка «+ Добавить» в шапке секции «Фото товара» всегда видна.
- [x] **`TMA-DYNAMIC-VARIANT-FILTERS-001`** ✅ 08.05.2026 — `AddProductPage.tsx`: динамическая загрузка `CategoryFilter` по slug категории через `GET /storefront/categories/:slug/filters` с AbortController; рендерит select/boolean/number/multi_select. `multi_select` с >1 значением → авто-создаёт `ProductOptionGroup` + `ProductVariant` matrix.
- [x] **`TMA-DESIGN-P0P1-001`** — P0+P1 из `[DESIGN-AUDIT-TMA-001]` ✅ закрыто 04.05.2026 (контраст BottomNav, hit-area Add-to-cart/back 44pt, aria-hidden на decorative emoji, OPEN/CLOSED с иконкой, text-[11px] meta → text-xs). См. `analiz/done.md`. Остаток `role/tabIndex/onKeyDown` на `<div>` — отдельным тиком если потребуется.
- [x] **`TMA-RESPONSIVE-DESKTOP-001`** ✅ 06.05.2026 — все 4 fixed-position модалки теперь учитывают sidebar 220px на desktop ≥768px: `BottomSheet`, `ConfirmModal`, `ImageCropper` (уже имели), `CategoryModal` (добавил `left: SIDEBAR_WIDTH`). Sidebar остаётся видимым во время modal'ов.

## 🟡 P2 — Полат + параллельная сессия

- [x] **`API-SQL-INJECTION-AUDIT-001`** ✅ 06.05.2026 — чисто. Все `$queryRaw` через tagged templates (Prisma параметризует). 0 unsafe. См. `analiz/logs.md AUDIT-API-SQL-INJECTION`.
- [x] **`API-WS-AUDIT-001`** ✅ 06.05.2026 — найдена дыра в `OrdersGateway.handleJoinSellerRoom` (SELLER без storeId в JWT мог join'нуться в чужие room) → закрыто DB-lookup'ом владения. Валидация типов входных параметров. Chat gateway уже OK. См. `analiz/logs.md AUDIT-API-WS`.
- [x] **`API-RATE-LIMIT-AUDIT-001`** ✅ 06.05.2026 — глобальный 120 req/min baseline + локальные `@Throttle` добавлены на cart (POST/PATCH /items 60/min) и wishlist (POST/DELETE 60/min). См. `analiz/logs.md AUDIT-API-RATE-LIMIT`.
- [x] **`TMA-SELLER-PERF-PASS-001`** — AbortController + prefetch на seller-страницах TMA. ✅ Закрыто в `WEB-TMA-SELLER-PERF-001` (8 из 9 файлов; ChatPage пропущен из-за конфликта с `TMA-DESIGN-P0P1-001`). См. `analiz/done.md` 2026-05-04.
- [x] **`TMA-SELLER-CHAT-PERF-001`** ✅ 06.05.2026 — добавлены AbortController в loadThreads (threadsAbortRef) + load messages useEffect (messagesAbortRef) в `seller/ChatPage.tsx`. Cleanup на unmount + при смене threadId. AbortError игнорируется в catch.

## 🟢 P3 — после спринта

- [x] **`NOTIF-IN-APP-001`** ✅ 06.05.2026 — реализовано: `InAppNotification` модель в схеме, `InAppNotificationProcessor` создаёт записи + `chatGateway.emitNotificationNew()` WS push. Frontend `notifications.ts` слушает event + badge через `subscribeToUnread()`. Toast — через showToast при event'е (UI work осталось).
- [x] **`WEB-DESIGN-AUDIT-001`** ✅ 08.05.2026 (web-seller часть) — полный отчёт: `analiz/audit-web-seller-design-2026-05-08.md`. Найдено 7 P1 (light-theme contrast killers + `confirm()` native dialogs + sidebar logo glow), 14 P2 (хардкоженный hex для order status, SMS-copy в login OTP, page heading typography sub-spec, native `<select>` regression в edit-product), 9 P3. Health 6.5/10. См. ниже секцию `WS-DESIGN-FIX-WAVES` для backlog'а исправлений.
- [x] **`DB-AUDIT-001`** ✅ 06.05.2026 — найден и закрыт schema drift: AdminUser MFA-поля + OrderRefund модель существовали в DB (migration 20260503020000) но НЕ в schema.prisma → код использовал `(prisma as any)`. Добавлены индексы `media_files.bucket` + `chat_threads.status`. Migration `20260506200000_db_audit_indexes`. См. `analiz/logs.md AUDIT-DB`.

## 🆕 Аудит платформы продолжение (06.05.2026)

### 🔴 P0 — Полат / параллельная сессия
- [x] **`API-MFA-NOT-ENFORCED-001`** ✅ 06.05.2026 — введён `mfaPending` claim в JWT (выставляется при login если `AdminUser.mfaEnabled=true`), `MfaEnforcedGuard` блокирует все admin endpoints кроме помеченных `@SkipMfaCheck()`. POST `/admin/auth/mfa/login` обменивает mfaPending JWT → полноценный после TOTP. См. `analiz/done.md API-MFA-NOT-ENFORCED-001`.

### 🟠 P1 — Полат
- [x] **`API-RBAC-MICRO-PERMISSIONS-001`** ✅ 06.05.2026 — `@AdminPermission(perm)` decorator + `AdminPermissionGuard` + `JwtPayload.adminRole` claim. Permissions matrix вынесена в `common/constants/admin-permissions.ts` с wildcard-логикой (`*`, `user:*`, `*:read`). Применено на 23 destructive endpoints в admin/super-admin controller'ах (suspend, approve, reject, archive, refund, impersonate, db CRUD, broadcast, migrate). См. `analiz/done.md API-RBAC-MICRO-PERMISSIONS-001`.

### 🟠 P1 — Азим
- [x] **`WEB-SELLER-HARDCODED-DOMAIN-001`** ✅ 08.05.2026 — введён helper `apps/web-seller/src/lib/buyer-url.ts` (`buyerOrigin`/`buyerStoreUrl`/`buyerStoreDisplay`). 3 места хардкода заменены: layout.tsx (sidebar label + clipboard) и profile/page.tsx (storeUrl). Подробности в `analiz/done.md`.

---

## 🆕 Аудит API security (06.05.2026)

### 🟠 P1 — для Полата
- [x] **`API-WEBHOOK-SECRET-OPTIONAL-001`** ✅ 06.05.2026 — `telegram-webhook.controller.ts:50-52` fail-closed в production: если `NODE_ENV='production'` и `TELEGRAM_WEBHOOK_SECRET` пуст → возвращает `{ ok:true }` без обработки + лог error.
- [x] **`API-MISSING-THROTTLE-001`** ✅ 06.05.2026 — `@Throttle` добавлен на: `POST /orders` (10/мин, `orders-create.controller.ts:22`), `POST /media/upload-url` (20/мин, `media.controller.ts:54`), `POST /seller/products` (30/мин, `products.controller.ts:121`).

### 🟢 P3 — для будущей сессии
- [x] **`API-RBAC-AUDIT-001`** ✅ 06.05.2026 — найдены и закрыты дыры: 23 `/seller/products/*` endpoints без @Roles('SELLER'), 4 `/seller/categories/*` без @Roles('SELLER'), 4 `/buyer/orders/*` без @Roles('BUYER'). admin/chat/moderation/reviews — чисто. См. `analiz/logs.md AUDIT-API-RBAC`.

---

## 🆕 Аудит TMA (06.05.2026) — UI/UX + functional

### 🔴 P0 (исправлено)
- [x] **`TMA-PROFILE-LINK-PRETTIFY-001`** ✅ — seller/ProfilePage хардкод `savdo.uz/{slug}` → кнопка «↗ Перейти на сайт».

### 🟠 P1 — для Полата
- [x] **`TMA-NATIVE-CONFIRM-001`** ✅ 06.05.2026 — `components/ui/ConfirmModal.tsx` (`confirmDialog()` Promise<boolean> + ESC/Enter, danger flag). Все 5 мест заменены: `seller/ProductsPage.tsx` (3× confirm/alert), `seller/StorePage.tsx` (1× confirm). Контейнер замонтирован в `AppShell.tsx`.
- [x] **`TMA-LOADING-SKELETONS-001`** ✅ 08.05.2026 — добавлены skeletons на OrdersPage buyer (initial list, 4 OrderRowSkeleton) и seller/ProfilePage (skeleton-блок магазина пока store === null). Остальные страницы списка skip'нуты обоснованно: CartPage/CheckoutPage синхронны (localStorage), buyer/ProfilePage из useAuth, AddProductPage не имеет блокирующего initial fetch'а, StoresPage уже имел оба skeleton'а, DashboardPage — параллельная сессия. Подробности в `analiz/done.md`.

### 🟡 P2 — a11y
- [x] **`TMA-A11Y-ROLE-TABINDEX-001`** ✅ 08.05.2026 — создан `lib/a11y.ts` с `clickableA11y(handler)` helper'ом (role+tabIndex+onClick+onKeyDown). Применён к: `buyer/ChatPage` + `seller/ChatPage` thread rows, `buyer/StorePage` product grid, `ProductCard`, `buyer/WishlistPage` row, `buyer/ProductPage` collage gallery. Остальные клики на `<button>`/`<a>`/`GlassCard` (рендерится `<button>`) или modal-backdrop (intentional — клик-outside, не keyboard).
- [x] **`TMA-SILENT-ERROR-CATCHES-001`** ✅ 06.05.2026 (частично) — добавлен `showToast` на 5 user-facing data-load fails: `buyer/WishlistPage`, `buyer/OrdersPage` (loadMore + detail), `seller/ProfilePage`, `seller/SettingsPage`. AbortError фильтруется. Остальные `.catch(() => {})` (clipboard, prefetch, attribute side-effects) намеренно тихие — best-effort fire-and-forget.

---

## 🆕 Аудит платформы (06.05.2026, Полат) — найденные проблемы

### 🔴 P0 — для Полата (apps/api + миграция данных)

- [x] **`API-MEDIA-MIGRATION-TG-TO-R2-001`** ✅ 06.05.2026 — admin endpoint `POST /admin/media/migrate-tg-to-r2?limit=50` + use-case + audit log. См. `analiz/done.md`.

- [x] **`API-SEC-TG-001-REGRESS`** ✅ 06.05.2026 — `streamToResponse` восстановлен в `TelegramStorageService`, `media.controller.ts` снова стримит вместо redirect. Коммит `32ce2fa`.

### 🟠 P1 — для Азима (apps/web-buyer)

- [x] **`WEB-BUYER-IMAGE-FALLBACK-001`** ✅ 08.05.2026 — `ProductCard.tsx`: пустые/null `images[].url` фильтруются, placeholder при `mediaUrls.length === 0` теперь иконка + текст «Без фото» (вместо одинокого silhouette на тёмном surfaceSunken).

- [x] **`WEB-BUYER-LINK-PRETTIFY-001`** ✅ 08.05.2026 — no-op после проверки. Длинных railway URL в web-buyer UI нет, `app/layout.tsx:16` уже на env-helper. Подробности в `analiz/done.md`.

### 🟡 P2 — для Полата (technical debt)

- [x] **`API-WS-PUSH-NOTIFICATIONS-001`** ✅ 06.05.2026 — реализовано параллельной сессией: `chat.gateway.ts handleConnection` авто-join `user:${userId}`, `emitNotificationNew()` в `InAppNotificationProcessor` после create. Frontend `notifications.ts` слушает `notification:new`, fallback poll 5 мин на разрыв WS.
- [x] **`API-MFA-COVERAGE-EXTRA-001`** ✅ 06.05.2026 — `MfaEnforcedGuard` + `AdminPermissionGuard` + `@AdminPermission` добавлены на admin endpoints в categories (5 endpoints), analytics (1), media (1). Permissions matrix дополнена `category:read/moderate`, `media:read` для moderator/support/finance ролей.

- [x] **`API-OTPLIB-V13-UPGRADE-001`** ✅ 08.05.2026 — bump `otplib` `^12.0.1 → ^13.4.0`. `admin-auth.use-case.ts` переписан под v13 functional API (`generateSecret`, `generateURI`, `verifySync`). Опции TOTP вынесены в `TOTP_VERIFY_OPTIONS` (digits=6, period=30, epochTolerance=30 = эквивалент v12 window:1 ±30s). Spec обновлён под новый API. 14/14 тестов passed, `npx tsc --noEmit` чист. Подробности в `analiz/done.md`.

- [x] **`TMA-MEDIA-USE-API-URL-001`** ✅ 06.05.2026 (полностью закрыто) — API теперь кладёт resolved URL прямо в `image.url` для 3 product detail endpoints (seller getMyProduct, products list seller endpoint, storefront product detail). EditProductPage использует `img.url` с fallback на getImageUrl для backward-compat. ProductsPage уже на mediaUrls[0]. Frontend больше не зависит от `VITE_R2_PUBLIC_URL`.

- [x] **`API-BUCKET-NAME-CONSISTENCY-001`** ✅ 06.05.2026 — добавлен явный handling `telegram-expired` (выставляется миграцией TG→Supabase когда file_id мёртв) в 3 mappers: `media.controller proxy/private` (404 NotFoundException), `cart.mapper.resolveMediaUrl` (returns null), `products.controller.resolveImageUrl` (returns ''). Раньше эти файлы попадали в S3 redirect → broken images.

### 🟢 P3 — для Полата (cleanup)

- [x] **`API-CHAT-CONTROLLER-TS-ERROR-001`** ✅ 06.05.2026 — уже исправлено параллельной сессией: `user.role as 'BUYER' | 'SELLER'` cast в chat.controller.ts:64. Typecheck чист.

- [ ] **`API-DELETE-OLD-STASHES-001`** — в `git stash list` несколько старых safety-stash от прошлых сессий. После подтверждения что параллельная закончила — `git stash drop`.

---

# 🆕 Очередь от Полата (через Азима, 30.04.2026 поздно вечер)

> ✅ 4 TMA задачи закрыты Полатом 02.05.2026, коммит `a2e1767`. См. `analiz/done.md`.

---

> ✅ `API-NOTIFICATIONS-ORDER-001` + `API-NOTIFICATIONS-CHAT-001` закрыты Полатом 02.05.2026, коммит `d83af03`. См. `analiz/done.md`.

---

> ✅ `WISHLIST-CONTRACT-001` + `TMA-BUYER-WISHLIST-001` закрыты Полатом 02.05.2026, коммиты `0f46a63` (backend) + `fd8721f` (UI). См. `analiz/done.md`.

> ✅ `WEB-BUYER-WISHLIST-PAGE-001` закрыт Азимом 05.05.2026 (сессия 45 — после theme system). Подробности в `analiz/done.md`.

---

# ✅ Закрыто Азимом в сессии 45 (05.05.2026) — Dark/Light theme system + Wishlist UI

- `WEB-THEME-SYSTEM-001` 🟡 — полная theme system для web-buyer и web-seller: ThemeProvider + no-flash inline script + ThemeToggle (Sun/Moon с rotate-анимацией + 3-state popover Light/Dark/System). Реализована через CSS-переменные в globals.css с `[data-theme]` overrides, `lib/styles.ts` отрефакторен — все `colors.X` теперь возвращают `var(--color-X)`. Все компоненты, которые уже использовали `colors`/`card`/`shell` из styles.ts, авто-темизуются. Plus migration `text-white` / `color: colors.bg` → `colors.textPrimary` / `accentTextOnBg` в 14 файлах seller (chat/onboarding/login/products/settings/orders + 2 components). Buyer ChatComposerModal полностью переписан с tokens. Onboarding background и orbs — через CSS-переменные. Подробности в `analiz/done.md`. Дефолт buyer — system preference, дефолт seller — dark (сохраняет CRM identity). Локально не запускалось.
- `WEB-BUYER-WISHLIST-PAGE-001` 🟡 — страница `/wishlist` + сердечко на ProductCard (top-right corner) + ссылка в Header (между nav и Cart). Использует серверный флаг `product.inWishlist` (приоритет) с фолбэком на клиентский кэш `useWishlistIds()`. Optimistic toggle через TanStack Query. Unauth-юзеры по клику на heart редиректятся на `/wishlist` где кикает OtpGate. Файлы: `apps/web-buyer/src/lib/api/wishlist.api.ts`, `apps/web-buyer/src/hooks/use-wishlist.ts`, `apps/web-buyer/src/components/store/ProductCard.tsx` (+heart), `apps/web-buyer/src/app/(shop)/wishlist/page.tsx` (новая), `apps/web-buyer/src/components/layout/Header.tsx` (+heart link), `apps/web-buyer/src/components/layout/BottomNavBar.tsx` (NavActive расширен 'wishlist'). Подробности в `analiz/done.md`.

# ✅ Закрыто Азимом в сессии 44 (01.05.2026, прямо сейчас, перед отбоем Азима)

- `WEB-CHAT-ORDER-001` 🔴 — сообщения в обоих чат-апах теперь ASC по `createdAt` через `useMemo`. Бэк отдаёт DESC под cursor pagination, фронт перевернул для display.
- `WEB-SELLER-PRODUCTS-RESPONSIVE-001` 🟡 — `/products` теперь полностью responsive: на mobile flex-column карточка с thumbnail + actions row, на desktop grid 6 колонок. Skeleton тоже адаптивный. (Реакция на тему 1 Полата «список + адаптивно».)
- `WEB-BUYER-ORDERS-CANCELLED-FILTER-001` 🟢 — добавлен таб «Отменённые» в FILTER_TABS web-buyer `/orders` (был пропущен, хотя `CANCELLED` уже есть в STATUS_CONFIG).

> Все три не закоммичены — ждут согласия Азима на push (через service-ветки `web-seller` и `web-buyer`, не через main).

---

# 📋 Снимок состояния (на 29.04.2026, сессия 38)

## ✅ Закрыто Азимом в сессии 38 (29.04.2026) — Pre-MVP audit + security hardening

- `MVP-AUDIT-001` 🔴 — статический аудит web-buyer + web-seller. Security/render/OTP/inventory — детали в `done.md`. Главное: **0** TODO/mock/stub в моём домене → фичи MVP по фронту готовы (модулу e2e после деплоя). XSS-сink'ов нет, `target=_blank` закрыты `rel`'ами, refresh-interceptor правильный, SSR на storefront + product preview работает (Telegram OG-tags ОК).
- `WEB-SECURITY-HEADERS-001` 🔴 — глобальные security-headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS) теперь на всех HTML-ответах web-buyer + web-seller через `next.config.ts headers()`. Закрыта дыра clickjacking на seller `/login` (middleware пропускал public_paths без headers) и полное отсутствие headers в web-buyer.
- `WEB-OTP-LENGTH-001` 🟡 — buyer OtpGate + seller login теперь требуют 6-значный OTP (бэк после `f3666db` 6-digit). Раньше форма позволяла submit с 4 → юзер ловил «Неверный код».

---

## ✅ Закрыто Полатом в `0b2de22` + `65c6795` (26.04.2026, между сессиями 35 и 36)

- `API-CHAT-DELETE-THREAD-001` 🟡 — `DELETE /chat/threads/:id` готов, soft per-role (`buyerDeletedAt`/`sellerDeletedAt`). Коммит `0b2de22`.
- `API-CHAT-DELETE-MESSAGE-001` 🟡 — `DELETE /chat/threads/:tid/messages/:mid` готов, soft (`isDeleted=true`, `body=null`, `deletedAt`). Только автор. Коммит `0b2de22`.
- `API-CHAT-EDIT-MESSAGE-001` 🟡 — `PATCH /chat/threads/:tid/messages/:mid` body `{ text }`, окно 15 мин, только автор. `ChatMessage.editedAt: string | null`, `isDeleted: boolean` теперь в типе. Коммит `0b2de22`.
- `API-SELLER-AVATAR-001` 🟡 — `POST /api/v1/media/seller/avatar` (multipart, file). `SellerProfile.avatarUrl: string | null` в типе. Коммит `0b2de22`.
- (бонусом, за пределами наших задач) `65c6795` — `Product.displayType: 'SLIDER' | 'SINGLE' | 'COLLAGE_2X2'` (миграция `add_product_display_type`), TG media group posts, storefront products feed.

## ✅ Закрыто Полатом в `0b916a2` (25.04.2026, перед сессией 35)

- `API-CHAT-UNREAD-COUNT-001` 🟡 — `unreadCount: number` теперь в `ChatThread` типе и в ответе `/chat/threads`. Auto-mark-as-read при `GET /chat/threads/:id/messages`. Bonus endpoint `PATCH /api/v1/chat/threads/:id/read` (204) для явной отметки. Миграция `add_chat_thread_read_at` (buyerLastReadAt/sellerLastReadAt в ChatThread). Коммит `6507dc9`.
- **Auth-история** 🟡 — `JwtStrategy.validate()` теперь делает session DB check: stale tokens отклоняются после logout. `LogoutSessionUseCase` пишет `sessionId` + outcome в Railway-логи для диагностики. Коммит `6507dc9`.
- (бонусом, не наш домен) `552e027` chat URL routing + optimistic UI + message reporting (миграция `add_chat_message_reported_at`), `5a2c8b1` admin ReportsPage, `eb9cc88` + `8580b7a` TMA fullscreen + chat reliability.

## ✅ Закрыто Полатом в `18fa355`, `66b8be4` (24.04.2026)

- `API-BUYER-ORDERS-ROLE-GUARD-001` 🔴 — снят `@Roles('BUYER')` с buyer/orders endpoints
- `API-CHAT-THREAD-CONTRACT-001` 🔴 — `ChatThread` тип в packages/types обновлён (threadType/storeName/storeSlug/productTitle/orderNumber/buyerPhone, lastMessage: string|null)
- `API-PRODUCT-ATTRIBUTES-TYPE-001` 🟡 — `Product.attributes: ProductAttribute[]` в типе
- `API-STOREFRONT-PRODUCT-FILTERS-001` 🟡 — `/storefront/products?filters[brand]=Samsung` теперь работает
- `API-CATEGORY-SEED-CLEANUP-001` 🟡 — авто-категории убраны из seed + cleanupRemovedCategories на старте
- `API-BUYER-AVATAR-001` 🟡 — `POST /api/v1/media/buyer/avatar` (multipart, IMAGE_ONLY, 10MB), `BuyerProfile.avatarUrl` в /auth/me

## ✅ Закрыто Азимом в сессии 36 (26.04.2026)

- `WEB-SELLER-CATEGORY-CONTRACT-FIX-001` 🔴 — **hotfix продакшен-бага**: dropdown категорий в `/products/create` показывался пустым. Корень — бэк поменял `/storefront/categories` с `{name}` на `{nameRu, nameUz, parentId}`, тип `GlobalCategory` в `packages/types` остался старый. Локальный адаптер `nameRu → name` в `getGlobalCategories`. Полату записано `API-GLOBAL-CATEGORY-CONTRACT-001`. Запушено в `92b69cf`.
- `WEB-SELLER-AVATAR-WIRE-001` 🟡 — wire-up seller avatar upload на `/profile`. Снят `disabled` с camera-кнопки, добавлен hidden file input + валидация (jpeg/png/webp, 10 МБ). Новые: `uploadSellerAvatar` в `seller.api.ts`, `useUploadSellerAvatar` в `use-seller.ts` (после успеха обновляет `['seller', 'profile']` cache, чтобы `<Image>` показал новый аватар без рефетча). Если `profile.avatarUrl` есть — рендерится `<Image>`, иначе — буква имени. Loader2 спиннер во время upload. Ошибки (тип/размер/network) показываются маленьким красным текстом под телефоном.
- `WEB-CHAT-EDIT-DELETE-001` 🟢 — wire-up edit/delete сообщений и удаление треда в обоих чат-апах. (a) Новые API-функции `deleteThread`, `deleteMessage`, `editMessage` в `chat.api.ts` обоих apps. (b) Новые хуки `useDeleteThread`, `useDeleteMessage(threadId)`, `useEditMessage(threadId)` с optimistic cache updates. (c) Кнопка trash в шапке треда → confirm modal (overlay) → mutate → `setActiveId(null)` если активный тред удалён. (d) Иконка `MoreVertical` справа от собственного сообщения (показывается на hover/focus), popover-меню с «Редактировать» (только если ≤ 15 мин с createdAt) и «Удалить» (confirm modal). (e) Edit-mode: bubble превращается в textarea + Save/Cancel; PATCH возвращает обновлённое сообщение, кэш мерджит `text` + `editedAt`. (f) Render `m.isDeleted` — серая italic-плашка «Сообщение удалено» без timestamp/edit. (g) Render `m.editedAt` — префикс «изменено · » перед timestamp. (h) `EDIT_WINDOW_MS = 15 * 60 * 1000` константа на фронте — окно edit-кнопки совпадает с бэк-проверкой.
- `WEB-PRODUCT-DISPLAYTYPE-001` 🟡 — selector + buyer storefront рендер. (a) Новый компонент `apps/web-seller/src/components/display-type-selector.tsx` — 3 кнопки (SINGLE / SLIDER / COLLAGE_2X2) с мини-превью (квадрат / квадрат+точки / 2×2 grid) + hint-текстом снизу. (b) `products.api.ts` (web-seller) `createProduct` + `updateProduct` теперь принимают `displayType?: ProductDisplayType`. (c) `/products/create/page.tsx` — `CreateProductForm` расширен `displayType`, default `'SINGLE'`, селектор вставлен между фото-блоком и категорией, передаётся в mutateAsync. (d) `/products/[id]/edit/page.tsx` — то же; в `useEffect(reset)` подгружается `product.displayType ?? 'SINGLE'`. (e) Web-buyer `components/store/ProductCard.tsx` — рендер картинок с учётом `product.displayType`. SINGLE = одна картинка (как раньше). SLIDER (если `mediaUrls.length > 1`) = первая картинка + decorative dots внизу карточки (макс 5 точек). COLLAGE_2X2 (если `mediaUrls.length >= 2`) = `<CollageGrid>` 2×2: всегда 4 ячейки, недостающие фото = пустая ячейка с маленьким `<ShoppingBag>` иконкой.

## ✅ Закрыто Азимом в сессии 35 (26.04.2026)

- `WEB-CHAT-UNREAD-BADGES-001` 🟢 — unread бэйджи в обоих чат-апах. (a) Web-buyer `BottomNavBar`: badge на иконке «Чаты» (общее число непрочитанных, через новый `useUnreadChatCount(enabled=isAuthenticated)`). (b) Web-buyer `/chats` `ThreadItem`: круглый accent-бэйдж с числом непрочитанных + жирность title + подсветка lastMessage. (c) Web-seller `/chat` `ThreadItem`: то же на solid surfaces tokens. (d) В обоих хуках `useMessages` теперь локально zero-аутит `unreadCount` в кэше threads после успешной загрузки сообщений (бэк всё равно auto-marks-as-read, но без этого UI бы тормозил до 30 сек staleTime).
- `WEB-SELLER-CATEGORY-DROPDOWN-001` 🟡 — заменён native `<select>` (Yandex рендерил как страшный системный popup на пол-экрана) на кастомный `Select` (`apps/web-seller/src/components/select.tsx`): popover под кнопкой, поиск, keyboard navigation (стрелки/Enter/Esc), click-outside, clearable. Применён к «Категория товара» и «Раздел магазина» в `/products/create`. После выбора категории показывается accent-плашка с подтверждением «Товар появится в категории «X»».
- `WEB-CHAT-EMOJI-PICKER-001` 🟢 — эмодзи picker в обоих чатах (`apps/web-seller/src/components/emoji-picker.tsx` + `apps/web-buyer/src/components/emoji-picker.tsx`). 8 категорий (смайлы/жесты/сердца/животные/еда/деньги/объекты/символы), ~300 эмодзи, без зависимостей. Click-outside, Esc-close, popover остаётся открытым между выборами (можно вставить несколько подряд). Кнопка-смайлик слева от input в обоих чатах.
- `WEB-SELLER-PROFILE-PAGE-001` 🟢 — добавлена страница `/profile` для seller (`apps/web-seller/src/app/(dashboard)/profile/page.tsx`): аватар-плейсхолдер с буквой, fullName/phone, type pill (бизнес/физ.лицо), telegram-username (если есть), карточка магазина с logo/name/city/status + копирование URL и «Открыть», карточка действий «Настройки» → /settings и «Выйти». User-блок в sidebar (`layout.tsx`) теперь clickable Link → /profile (с подсветкой когда активен), кнопка выхода вынесена в отдельный квадрат справа. Header страницы показывает «Личный кабинет». **Аватар upload disabled с tooltip «Скоро» — нужен `API-SELLER-AVATAR-001` от Полата.**

## ✅ Закрыто Азимом в сессии 34 (25.04.2026)

- `WEB-BUYER-AVATAR-UI-001` 🟢 — клик-аватар на /profile, file picker с валидацией, refreshUser после загрузки
- `WEB-BUYER-CATEGORY-FILTERS-001` 🟡 — глобальные категории + 130 атрибут-фильтров на витрине магазина (`/[slug]?gcat=…&f.brand=…`)
- `WEB-SELLER-DESIGN-PHASE-2-001` 🟡 — solid surfaces tokens + миграция layout/dashboard/products
- `WEB-SELLER-DESIGN-PHASE-3-001` 🟡 — миграция остальных 10 страниц + 2 компонентов: orders list/detail, settings, analytics, notifications, login (full); products/create (full), products/edit + chat + onboarding + variants/option-groups (via alias). `grep backdropFilter` → 0 совпадений в web-seller
- `WEB-SELLER-DESIGN-PHASE-3-CLEANUP-001` 🟢 — финальная очистка alias-файлов: chat/edit/variants/option-groups/onboarding/image-uploader. **Все inline rgba(255,255,255,X) удалены из web-seller — `grep -rn` показывает 0 совпадений**
- `WEB-CHAT-THREAD-VIEW-CLEANUP-001` 🟢 — удалены локальные адаптеры, фронт работает с ChatThread из packages/types напрямую

## ✅ Закрыто Полатом в `c69a62a` (29.04.2026 после-обеда) — 4 контракт-задачи + WS auth + admin search

- `API-SELLER-PRODUCT-MEDIA-URLS-001` 🔴 — `/seller/products[/:id]` теперь маппит `mediaUrls` из `images.media`. Списки товаров на seller dashboard и edit-страница теперь видят миниатюры.
- `API-SELLER-STORE-LOGO-URL-001` 🟡 — `/seller/store` resolve `logoUrl`/`coverUrl` через `mediaFile` lookup. Превью лого/обложки в `/settings` и `/profile` теперь работают.
- `API-STORE-CONTRACT-001` 🟡 — storefront stores list включает `logoMediaId`/`coverMediaId` в select; `/storefront/stores/:slug` теперь шлёт `logoUrl`/`coverUrl`.
- `API-GLOBAL-CATEGORY-CONTRACT-001` 🟡 — тип `GlobalCategory` в `packages/types/src/api/stores.ts` обновлён к `{id, parentId, nameRu, nameUz, slug, isActive, sortOrder, createdAt}`. Локальный адаптер `nameRu→name` в `apps/web-seller/src/lib/api/seller.api.ts` удалён, consumers переведены на `c.nameRu` (см. `done.md` запись от 29.04 пост-pull).
- (бонус) Bizn fix `getSellerProducts` шлёт `{ products, total }` envelope; список товаров на dashboard переведён.
- (бонус) WS gateways теперь верифицируют `storeId` в JWT для роли SELLER при `join-seller-room` — security hardening поверх 28.04 commit.
- (бонус) Admin search (sellers/users) серверный с `?search=` ILIKE; BroadcastPage XSS-фикс anchor href.

## ✅ Закрыто Полатом в `e9a8649` + `2a6477c` (29.04.2026 поздно вечер) — 5 контракт-задач + JSX fragments + GlobalCategory part 2

- `API-CATEGORY-FILTERS-CASE-001` 🔴 — `categories.controller` теперь возвращает `fieldType.toLowerCase()` для storefront-фильтров. Контракт совпадает с фронт-типом `'select' | 'number' | 'text' | 'boolean'`. Дублирующая защита `fieldType.toLowerCase()` в `apps/web-buyer/src/lib/api/storefront.api.ts` (сделана 29.04 фронтом) теперь idempotent — можно удалить позже как `WEB-BUYER-CATEGORY-FILTER-DEFENSIVE-CLEANUP`.
- `API-NOTIFICATIONS-INBOX-CONTRACT-001` 🔴 — `NotificationItem` + `InboxResponse` теперь в `packages/types/src/api/notifications.ts` (новый файл) и экспортированы из root index. Тип централизован, локальные дубли в обоих фронт-апах можно убрать.
- `API-CHAT-MESSAGE-CONTRACT-001` 🟡 — `send-message.use-case` возвращает `MappedChatMessage` (`text`/`senderRole`/`editedAt`/`isDeleted`). `chat.controller.editMessage` тоже возвращает консистентный shape с `isDeleted: false`. Latent bug в `useEditMessage` mеrge закрыт.
- `API-PRODUCT-CONTRACT-002` 🟡 — `products.controller` теперь конвертирует `basePrice`/`oldPrice`/`salePrice` в `Number()` во всех 6 mappers; `normalizeVariant` конвертит `priceOverride`/`oldPriceOverride`/`salePriceOverride`. Decimal больше не string. `apps/web-buyer/.../[id]/page.tsx:92` `??`-fallback теперь безопасен.
- `API-SELLER-ORDERS-LIST-MAPPER-001` 🟡 — `get-seller-orders` extract Decimal amounts из `...rest`, конвертит `Number()`; `deliveryFeeAmount` → `deliveryFee` rename для соответствия `OrderListItem` контракту.
- (бонус, `2a6477c`) TMA: JSX fragment wrapper в buyer/ChatPage, seller/ChatPage, seller/OrdersPage — после удаления AppShell early-returns ломали build (TS1005). Также Полат сам докрутил GlobalCategory `name → nameRu` в `web-seller/products/[id]/edit/page.tsx`, `create/page.tsx`, `seller.api.ts` — параллельно с моей локальной адаптацией; мои локальные правки оказались идентичны и были откатаны через `git restore` перед `git pull`.
- (бонус, `141c0a5`) TMA persistent layout: nested routes + outlet, BottomNav и AppShell больше не remount при навигации; навигация instant. Не наш домен (TMA).

## ✅ Закрыто в текущей сессии (30.04.2026)

- `TMA-STICKER-CRASH-001` 🔴 — **React error #130** в TMA на StoresPage + DashboardPage. Root cause: `lottie-react` CJS/ESM interop в Vite prod bundle → `Lottie` = module object вместо компонента. Нотоэмоджи CDN: 404 на `1f3ea`. Fix: убран `lottie-react`, `Sticker` → статичный emoji `<span>`. `1004e33`
- `TMA-PRODUCT-CARD-ROUTE-001` 🔴 — `ProductCard` навигировал на `/buyer/product/:id` (несуществующий маршрут). Fix: `/buyer/store/:slug/product/:id`. `1004e33`

---

## 🚧 Открыто — Полат (TMA / `apps/api` / `packages/db` / `packages/types`)

| ID | Важность | Кратко |
|----|----------|--------|
| ~~`API-BUYER-ORDERS-LIST-MAPPER-001`~~ | ✅ | Полный OrderListItem shape: storeId, deliveryFee, preview (items take:1), customerPhone/FullName. `db72038` |
| ~~`API-PRODUCT-CONTRACT-003`~~ | ✅ | Унифицирован — оба режима возвращают `{data,meta}`, web-buyer потребители обновлены. `6290737` |
| ~~`API-ORDER-CONTRACT-001`~~ | ✅ | `orderNumber` добавлен в `OrderListItem` type. `paymentStatus: PaymentStatus | null`. `db72038` |
| ~~`TYPES-VARIANT-REF-CONTRACT-001`~~ | ✅ | `VariantRef` → `{id, sku, title}`. Web-buyer cart/checkout: `titleOverride` → `title`. `db72038` |
| ~~`API-CART-EMPTY-CONTRACT-001`~~ | ✅ | `Cart.id/storeId: string | null`. Web-buyer: `cart!.storeId ?? ''`. `db72038` |
| ~~`ADMIN-BROADCAST-XSS-CHECK-001`~~ | ✅ | Проверено: html — preview из user-input через pipeline HTML-escaping. Фикс: regex `(.*?)` → `[^"]*` в href capture — предотвращает attribute injection. Самостоятельный XSS невозможен. `6290737` |
| ~~`INFRA-FULL-RELOAD-NAV-001`~~ | ✅ | TMA: AppShell лифтнут в nested routes → persistent layout (141c0a5). Admin: `window.location.href='/login'` → `CustomEvent auth:logout` + `AuthLogoutListener` в App.tsx. `6290737` |
| ~~`WEB-CSP-HEADER-002`~~ | ✅ | CSP-директивы добавлены в оба `next.config.ts`. `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Next.js требует), но блокирует HTTP, чужие iframe, object/embed, base hijack. `814c35b` |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

### 🆕 [WS-DESIGN-FIX-WAVES] Backlog по аудиту web-seller (08.05.2026)

> Полный отчёт: `analiz/audit-web-seller-design-2026-05-08.md` (7 P1 / 14 P2 / 9 P3).
> Грубо упорядочено по value/effort. Каждая волна — отдельный коммит, безопасно
> мерджить в `web-seller` ветку независимо.

- [x] **`WS-DESIGN-WAVE-1` 🔴** ✅ 08.05.2026 — закрыты 5 P1 из 6 (P1-002, P1-003, P1-005, P1-006, P1-007). Коммит `1ad0e69`. P1-004 (avatar spinner text-white) пропущен — overlay rgba(0,0,0,0.45) тёмный в обеих темах, white spinner читается. Подробности в `analiz/done.md`.
- [x] **`WS-DESIGN-WAVE-2` 🔴** ✅ 08.05.2026 — все 4 native `confirm()` заменены на reusable `ConfirmModal` (новый компонент `apps/web-seller/src/components/confirm-modal.tsx`). Покрыто: edit-product handleDelete, option-groups ValueRow (Удалить значение), option-groups GroupRow (Удалить группу), variants section handleDelete. ESC/Enter keyboard support, danger flag, click-outside для close. P1-001.
- [x] **`WS-DESIGN-WAVE-3` 🟡** ✅ 08.05.2026 — page heading typography (P2-014). 5 `<h1>` page titles `text-xl` (20px) → `text-2xl` (24px, нижняя граница Headline range). Файлы: analytics, orders, products, notifications, settings. Все 6 dashboard-страниц теперь консистентны.
- [x] **`WS-DESIGN-WAVE-4` 🟡** ✅ 08.05.2026 — login OTP copy исправлен (P2-010). Коммит `a818720`. Подробности в `analiz/done.md`.
- [x] **`WS-DESIGN-WAVE-5` 🟡** ✅ 08.05.2026 — добавлен semantic `colors.info` token в styles.ts + globals.css (light `#2563EB`, dark `#60A5FA`). Заменены 9 хардкоженных мест: CONFIRMED + SHIPPED status (×4 в dashboard/orders×2/orders-detail), TG-link icons в products list (×2), analytics block, profile TG chip (3 hex). SHIPPED унифицирован с CONFIRMED через `colors.info` (оба = «in-flight», PROCESSING остался на `accent`). Audit IDs: P2-002, P2-003, P2-013.
- [x] **`WS-DESIGN-WAVE-6` 🟡** ✅ 08.05.2026 — products edit dragons закрыты: (a) radius выровнен create↔edit на `rounded-xl` (12px per spec) — раньше `rounded-lg` (8px) в create vs `rounded-2xl` (16px) ×4 в edit. (b) native `<select>` ×2 в edit заменены на custom `<Select>` с поиском/keyboard nav/clearable — устранено хардкоженное `background: '#1a1d2e'` на `<option>` (сломан в light theme). (c) `TITLE_EXAMPLES_BY_SLUG` + `DESCRIPTION_EXAMPLES_BY_SLUG` + 2 placeholder helper функции вынесены в новый `apps/web-seller/src/lib/product-examples.ts`. Audit IDs: P2-001, P2-004, P2-005.
- [x] **`WS-DESIGN-WAVE-7-BACKLOG` 🟢** ✅ 08.05.2026 (частично) — закрыто 8 из 14 nit'ов: shadow > 8px ×3 (layout toast / select dropdown / emoji-picker popover) → soft 4-6px depth; onboarding 3 хардкоженных hex (#A78BFA + 2× #fff) → tokens; notifications hover-leave inverted semantics → unread bg color-mix(accent 22%) при hover; notification badge fontSize 9 → 10 (хорошо читается без потери компактности); theme-toggle redundant shadow-lg + soft inline; emoji-picker hover:bg-white/5 → row-hoverable; onboarding progress connector surfaceElevated → border (видно в light); analytics ASCII «— » divider → реальный `<hr>`. Audit IDs: P2-006, P2-009, P2-012, P3-001, P3-003, P3-004, P3-005, P3-007.
- [ ] **`WS-DESIGN-WAVE-7-DEFERRED` 🟢** — оставшиеся 6 nit'ов отложены: P2-007 (sidebar 14%→15% accentMuted, в пределах rounding), P2-008 (onboarding `rounded-3xl` — sanctioned scene), P2-011+P3-009 (chat off-grid + non-responsive — нужен mobile-first рефактор chat layout, отдельным заходом), P3-002 (chat thread skeletons beyond 3), P3-006 (settings native `<select>` Firefox chevron — нужен custom Select для всех селектов в settings), P3-008 (analytics text-3xl — в пределах spec).

---

### ✅ [WEB-BUYER-DESIGN-IMPL-001] Имплементация «Soft Color Lifestyle» — ВСЕ 10 ЗАДАЧ ЗАКРЫТЫ (05.05.2026)

**Spec:** `docs/superpowers/specs/2026-05-05-buyer-design-differentiation-design.md`
**Plan:** `docs/superpowers/plans/2026-05-05-buyer-design-soft-color-lifestyle.md`
**Откуда стартовать:** **Task 1 — Foundation tokens + Inter font**. Через `superpowers:subagent-driven-development` (рекомендовано) или `executing-plans`.

10 задач (все только в `apps/web-buyer`, бэкенд / hooks / types не трогаются):

- [x] **Task 1** — Foundation: переписать `lib/styles.ts` + `app/globals.css` :root tokens + заменить Geist→Inter в `app/layout.tsx` ✅ 05.05.2026
- [x] **Task 2** — `components/layout/Header.tsx` + `BottomNavBar.tsx` под новую палитру ✅ 05.05.2026 коммит `654f067` (минорно — оба уже мигрированы через alias после Task 1)
- [x] **Task 3** — Storefront: `(shop)/page.tsx` + `(shop)/[slug]/page.tsx` + `components/home/RecentStores.tsx` (hero 6fr:4fr photo:color, sections с editorial labels, categories chip-row) ✅ 05.05.2026 коммит `b2884bb` (storefront уже сделан ранее, polish для homepage+RecentStores)
- [x] **Task 4** — `components/store/ProductCard.tsx` + `ProductsWithSearch.tsx` + `CategoryAttributeFilters.tsx` (borderless карточка, ♡ overlay 32px, цена тёмная) ✅ 05.05.2026
- [x] **Task 5** — `(shop)/[slug]/products/[id]/page.tsx` (gallery+info split desktop, sticky bottom CTA mobile, variant picker) ✅ 05.05.2026 коммит `756cf3b`
- [x] **Task 6** — `(minimal)/cart/page.tsx` (store-strip, free-delivery progress, OOS-fallback) ✅ 05.05.2026
- [x] **Task 7** — `(minimal)/checkout/page.tsx` (3-step single-screen, address-cards, payment с «Online · Скоро») ✅ 05.05.2026 коммит `e20a1c2`
- [x] **Task 8** — `(shop)/chats/page.tsx` + `components/chat/ChatComposerModal.tsx` (brand-color avatars, pinned product context, bubbles) ✅ 05.05.2026 коммит `7ed9eb2`
- [x] **Task 9** — `(shop)/orders/page.tsx` + `(shop)/orders/[id]/page.tsx` (status hero + timeline) ✅ 05.05.2026 коммит `c117723`
- [x] **Task 10** — `(shop)/profile/page.tsx` + `wishlist/page.tsx` + `notifications/page.tsx` (stats row, editorial labels, menu sections) ✅ 05.05.2026 коммит `0ba9561`

**Verification:** `pnpm build` локально ЗАПРЕЩЁН (ПК зависает). Каждая задача завершается push'ем в `web-buyer` ветку → проверка на Railway URL.

**Известные ограничения:**
- Free-delivery threshold захардкожен константой в Task 6 — реальное значение позже
- `Store.brandColor` поля может ещё не быть в backend → Task 8 фолбэчит на терракоту через `?? colors.brand`
- Эмодзи как иконки сейчас, замена на Lucide — postMVP

---

### Старое (до Session 46)

| ID | Важность | Кратко |
|----|----------|--------|
| Тест end-to-end в проде (Railway пофикшен 28-29.04, фичи сессии 36+37 раскатываются) | 🟡 | **Сессия 36 фронт (3 фичи):** (1) Seller `/profile` → загрузить аватар. (2) Чат seller — trash в шапке. (3) Чат seller — ⋯ → Редактировать → «изменено · …». (4) Чат seller — ⋯ → Удалить → «Сообщение удалено». (5) Через 15 мин «Редактировать» исчезает. (6) Те же 4 проверки в web-buyer `/chats`. (7) Edit от seller → buyer видит «изменено». (8) **DisplayType:** SLIDER → точки. COLLAGE_2X2 → 2×2 grid. **Сессия 37 (новое):** (9) Чат — отправить, подождать 35 мин (срок refresh), отправить ещё → должно работать (WS auth dynamic token). (10) `/notifications` (seller) — список отображается с записями (был пустой из-за contract-mismatch). (11) Витрина магазина с категорий-фильтром → выбрать SELECT-фильтр (например бренд) → dropdown с опциями появился (раньше показывался text input). |
| `WEB-SELLER-AUTOMOTIVE-CLEANUP-001` | 🟢 | После того как Азим визуально подтвердит что Railway задеплоил `18fa355` и в `/products/create` dropdown категорий нет авто-пунктов — удалить `isHiddenCategory(slug)` regex-фильтр из `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` и `[id]/edit/page.tsx`. **ОПАСНО удалять до проверки** — если cleanup не отработал на проде, продавцы снова увидят авто. |
| ~~`WEB-BUYER-CATEGORY-FILTER-DEFENSIVE-CLEANUP-001`~~ | ✅ | Удалён defensive `.toLowerCase()` в `storefront.api.ts`. |

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
>
> **Текущая модель (06.05.2026, решение Полата):** платежей нет, продавец
> связывается с админом → админ вручную через admin-панель открывает доступ
> к общему рынку.
>
> ✅ **Закрыто 06.05.2026:** `API-MANUAL-SELLER-ACTIVATION-001` — добавлен
> один endpoint в super-admin, объединяющий 3 шага:
> - `POST /admin/users/:id/activate-seller-on-market`
>   body: `{ fullName, sellerType, telegramUsername, storeName, storeCity, telegramContactLink, description?, region?, slug? }`
>   → создаёт seller-профиль → создаёт магазин → approve → audit log `seller.activated_on_market`.
>
> Старые отдельные endpoints тоже работают (для случаев когда нужны шаги по отдельности):
> - `POST /admin/users/:id/make-seller`
> - `POST /admin/sellers/:id/create-store`
> - `POST /admin/stores/:id/approve` / `/suspend` / `/unapprove`
>
> Когда придёт время монетизации — добавить subscription модель поверх
> существующего flow. Все PAY-NNN тикеты ниже остаются как roadmap.
>
> **TODO для admin frontend:** добавить кнопку «Активировать продавца на рынке»
> в `apps/admin/src/pages/UserDetailPage.tsx` (или где сейчас make-seller) —
> модалка со всеми полями → один POST. Тикет: `ADMIN-MANUAL-ACTIVATION-UI-001`.

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

