# Design Audit — Admin / API / TMA (08.05.2026)

> Аудит проведён через `claude-skills`: `ui-design-system`, `ux-researcher-designer`, `apple-hig-expert`, `code-reviewer`, `api-design-reviewer`, `senior-backend`, `pr-review-expert`.
> Источник: `c:\Users\USER\Desktop\debug\savdo-builder\.claude\skills\<skill>\SKILL.md`.

## Executive Summary

| Платформа | Состояние | P0 | P1 | P2 | P3 |
|-----------|-----------|----|----|----|----|
| **admin** (React+Vite) | Хороший фундамент (CSS-vars, dark/light), но a11y и hardcoded цвета | 3 | 5 | 5 | 5 |
| **api** (NestJS) | Архитектура thin controllers + use-cases — солидная. Naming + HTTP semantics требуют hardening | 3 | 4 | 4 | 3 |
| **tma** (Vite+TG SDK) | Liquid Authority tokens базис ОК, но 280 hardcoded text-* классов и hit-area 28px | 5 | 5 | 5 | 4 |

Топ-3 priority fixes (cross-platform):
1. **Hit-area 28→44px** в TMA (мобильный WCAG / Apple HIG violation).
2. **WebSocket events naming** в API — выбрать `chat:join` либо `chatJoin`, применить везде.
3. **A11y modal/dialog** в admin — `role="dialog"` + focus trap.

---

## ADMIN — UI Design Audit

**Стек:** React + Vite + Tailwind. Dark/light themes через CSS-переменные в `index.css`. Liquid Authority стиль.

### P0 — критично

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| A1 | `apps/admin/src/layouts/DashboardLayout.tsx:211-247` | Theme toggle / logout buttons без `aria-label`, `aria-pressed`. Icon-only buttons без screen-reader text | `aria-label="Toggle theme"`, `aria-pressed={isDark}`, `<span class="sr-only">` |
| A2 | `apps/admin/src/pages/ModerationPage.tsx:395-494` | Кастомный modal без `role="dialog"`, `aria-modal`, focus trap. ESC не закрывает | Использовать `Dialog` component из `ui/dialog.tsx` (Radix-based) |
| A3 | `apps/admin/src/pages/ModerationPage.tsx:273-390` | Hardcoded `rgba(239,68,68,0.08)` вместо CSS-переменных — light theme ломается | Ввести `--surface-error/--surface-warning/--surface-success` в `index.css` |

### P1 — высокий

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| A4 | `apps/admin/src/components/ui/button.tsx:6-26` | `bg-indigo-600 text-white` hardcoded — не реагирует на theme | `bg-[var(--primary)]` |
| A5 | `apps/admin/src/components/ui/badge.tsx:9-14` | Hardcoded emerald/amber/red в Tailwind | `bg-[var(--success)]/10 text-[var(--success)]` |
| A6 | `apps/admin/src/pages/SellersPage.tsx:94-107` | Pagination buttons без `disabled={page === 1}` | Добавить disabled + visual state |
| A7 | `apps/admin/src/pages/ModerationPage.tsx:165-195` | Tabs без `role="tablist"/role="tab"`, нет keyboard navigation (стрелки) | Создать Tabs primitive на Radix или добавить arrow handlers |
| A8 | `apps/admin/src/pages/LoginPage.tsx:85-115` | OTP-поля 6× input без `aria-label`, ошибка без `role="alert"` | `<fieldset>` + `aria-live="polite"` для error |

### P2 — medium

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| A9 | `apps/admin/src/components/admin/PageHeader.tsx:20-34` | Back button без `type="button"`, без `aria-label` | Add explicit type + aria |
| A10 | `apps/admin/src/pages/ModerationPage.tsx:40-54` | `getSla()` возвращает hex `'#EF4444'` | Возвращать имя CSS-переменной |
| A11 | `apps/admin/src/layouts/DashboardLayout.tsx:142-200` | NavLink без `:focus-visible`, hover через `onMouseEnter` | `:focus-visible` в className |
| A12 | `apps/admin/src/components/ui/dialog.tsx:30-42` | `bg-zinc-950` hardcoded | `bg-[var(--surface)]` |
| A13 | `apps/admin/src/pages/SellersPage.tsx:128-186` | Clickable `<tr>` без `role="button"`/`tabIndex`/onKeyDown | `role="button" tabIndex={0}` + Enter handler |

### P3 — minor

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| A14 | `apps/admin/src/pages/ModerationPage.tsx:36-64` | Hardcoded SLA hours / locale | Вынести в `lib/constants.ts` |
| A15 | `apps/admin/src/components/admin/StatusBadge.tsx:43-59` | Большой switch — добавление статуса в 3 местах | Generate from enum |
| A16 | `apps/admin/src/pages/ModerationPage.tsx:199-212` | "Загрузка…" одинаков для loading/empty | Spinner vs SkeletonRows |
| A17 | `apps/admin/src/components/admin/EmptyState.tsx:10-11` | `opacity-30` на иконке — невидно в light theme | `color: var(--text-dim)` |
| A18 | `apps/admin/src/lib/hooks.ts:5-32` | `useFetch` без timeout / retry | AbortController + 5s timeout + backoff |

### Что хорошо

- ✅ CSS-переменные для темы (`index.css`), dark/light переключение работает.
- ✅ Структура `ui/` (primitives) + `admin/` (specific) — чистая.
- ✅ Destructive actions через кастомные модалки (не `window.confirm`).
- ✅ Loading/error/empty states покрыты на ModerationPage / SellersPage.
- ✅ Lazy-loading routes (LoginPage eager, остальные lazy).
- ✅ INV-A02 enforced — comment required на rejection (≥10 chars, disabled button).

---

## API — REST Design Audit

**Стек:** NestJS + TypeScript + Prisma + Postgres + Socket.IO. `/api/v1/` global prefix.

### P0 — критично

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| B1 | `apps/api/src/socket/chat.gateway.ts:58,62,70` + `orders.gateway.ts:52,55` | Mixed kebab-case (`join-chat-room`) и colon-namespaced (`chat:typing`) | Один стиль: `chat:join`, `chat:leave`, `chat:typing`, `orders:join` |
| B2 | `apps/api/src/modules/products/products.controller.ts:122-143` | POST `/seller/products` возвращает 200 вместо 201 | `@HttpCode(HttpStatus.CREATED)` на все creator POST endpoints (products, variants, option-groups, images, attributes) |
| B3 | `apps/api/src/modules/orders/orders.controller.ts:91-100` | Дублирующиеся routes: `GET /buyer/orders/:id` и `GET /orders/:id` | Удалить alias `/orders/:id`, оставить `/buyer/orders/:id` |

### P1 — высокий

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| B4 | `apps/api/src/main.ts` | Нет Swagger/OpenAPI documentation — нет автогенерируемого контракта | `npm i @nestjs/swagger`, `SwaggerModule.setup('api/docs', ...)`, `@ApiOperation/@ApiResponse` на ключевых endpoints |
| B5 | `apps/api/src/modules/products/products.controller.ts:1-942` | Жирный контроллер 942 LOC — seller + storefront + stores routes смешаны | Разбить на `ProductsSellerController`, `ProductsStorefrontController`, `ProductsStoresController` |
| B6 | `apps/api/src/modules/admin/admin.controller.ts:349` | `PATCH /admin/orders/:id/status` — должен быть POST для команд (state transition) | `POST /admin/orders/:id/transition` или сохранить PATCH с явным контрактом |
| B7 | Все POST endpoints | Идемпотентность только в комментариях, нет `Idempotency-Key` header | Принимать `Idempotency-Key`, кэшировать в Redis 5 мин (особенно `/checkout/confirm`, `/orders`) |

### P2 — medium

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| B8 | `orders.controller.ts:70-87` vs `products.controller.ts:119,820` | Pagination envelope inconsistent: `{ data, meta }` vs `{ products, total }` vs `{ data, meta:{ total, page } }` без limit/totalPages | Стандарт: `{ data, meta: { total, page, limit, totalPages } }` для всех paginated |
| B9 | `apps/api/src/modules/admin/admin.controller.ts:221,246,512` | Inline `@Body() body: { fullName: string; ... }` без DTO | Создать `AdminCreateSellerDto`, `AdminCreateStoreDto` с `class-validator` |
| B10 | `products.controller.ts:111-174` | Decimal money сериализуется как `Number(basePrice)` — precision loss для больших сумм | Документировать precision contract (2 знака) или сериализовать как `string` |
| B11 | Roles guards | Применяются непоследовательно (controller-level vs method-level) | Стандарт: `@Roles()` на методе для ясности (видно который endpoint кому) |

### P3 — minor

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| B12 | Socket.IO room naming | `user:${id}` vs `seller:${storeId}` — намespacing хорош, но не задокументирован | JSDoc описание room conventions |
| B13 | Error responses | Формат не задокументирован централизованно | ADR + пример в `common/exceptions/` |
| B14 | `@HttpCode(NO_CONTENT)` на DELETE | Применяется на products/cart, нужен audit остальных | Grep all DELETE controllers, добавить везде |

### Что хорошо

- ✅ Thin controllers + use-cases pattern — `orders.controller.ts` образцовый.
- ✅ DTO validation thorough (`class-validator`: `@IsString`, `@IsUUID`, `@Min/@Max`).
- ✅ Global `/api/v1/` prefix.
- ✅ Repository pattern — нет direct prisma calls.
- ✅ Socket.IO security hardened (`API-WS-AUDIT-001`): JWT в `handleConnection`, room ownership.
- ✅ State machine for `OrderStatus` validated в use-cases.
- ✅ Throttle rate limiting на критичных endpoints.
- ✅ Consistent `ErrorCode` enum.

---

## TMA — UI Design Audit

**Стек:** Vite + React + Tailwind + Telegram WebApp SDK. Liquid Authority (orchid purple + cyan accents).

### P0 — критично

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| T1 | `apps/tma/src/pages/buyer/CartPage.tsx:97-121` (qty buttons `w-7 h-7`), OrdersPage, ChatPage | Hit-area 28×28px — WCAG / Apple HIG violation на мобильных | `w-10 h-10` (40px) или `w-11 h-11` (44px) + `text-lg` |
| T2 | `CartPage:75,79,91,92,100,110,127,128`, `OrdersPage:203-285`, `ProductPage:221-468` | 100+ строк inline `style={{ color: 'rgba(255,255,255,X)' }}` — нет foreground tokens | `export const FG = { strong: 'rgba(255,255,255,0.92)', muted: 0.40, ... }` в `styles.ts` |
| T3 | `apps/tma/src/pages/seller/ChatPage.tsx:205`, `buyer/ProductPage.tsx:252-256` (collage) | `<div onClick>` без role/tabIndex/aria-label (helper `clickableA11y` существует но не применён) | Применить `{...clickableA11y(handler)}` из `apps/tma/src/lib/a11y.ts` |
| T4 | Buyer и Seller routes | НЕ дифференцированы визуально — обе роли используют orchid purple. Liquid Authority предписывает cyan #22D3EE для Seller | `data-role="buyer\|seller"` на AppShell + scope CSS-переменных по роли |
| T5 | `OrdersPage:6,347`, `ChatPage:6`, `EditProductPage:6` | `<Spinner>` после миграции на Skeleton — заменено частично | Замена на `OrderRowSkeleton/ProductCardSkeleton/ThreadRowSkeleton` |

### P1 — высокий

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| T6 | По проекту | 280 вхождений `text-[11px]/text-xs/text-sm` — нет типографической шкалы | `enum TextSize` + `--text-caption/-body/-h1/...` CSS-переменные с desktop scale |
| T7 | `OrdersPage:295` (`grid-cols-2` без breakpoint), `ProductPage:248` (galleryAspect случайно) | Нет centralized breakpoints | `useTMABreakpoints()` hook (`mobile/tablet/desktop`) |
| T8 | `CartPage:62-69`, `ProductPage:173-198` | MainButton используется правильно, но если `!tg` — нет visible fallback button | Добавить sticky bottom button если `!tg` (browser dev preview) |
| T9 | `ChatPage` (?) | `window.confirm` мог остаться в 1 месте (требует grep) | grep, заменить на `confirmDialog()` |
| T10 | `CartPage:76-82` | Нет error state | Добавить error UI + retry |

### P2 — medium

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| T11 | `AddProductPage:485-1063` | Свои inline cards вместо GlassCard | grep `<div className="...p-4"`, обернуть в GlassCard |
| T12 | `Button.tsx:15` | Gradient `linear-gradient(135deg, #7C3AED, #A855F7)` hardcoded в style | `.button-primary` class в tailwind |
| T13 | `ProductPage:274` (`emptyVariant="no-photo"`), `DashboardPage:129` (`"thumbnail"`) | Нет `type ImageEmptyVariant` enum | TS-enum |
| T14 | `AddProductPage:73-220` | Cropper готов, но нет drag-to-reorder фото на мобилях | Touch swipe или `react-dnd` |
| T15 | `ProductPage:340` | Hardcoded `text-lg` без desktop scale | `text-lg md:text-xl` |

### P3 — minor

| # | File:line | Проблема | Fix |
|---|-----------|----------|-----|
| T16 | `OrdersPage:418-475` | Review form — свой skeleton inline | Добавить `ReviewModalSkeleton` в `Skeleton.tsx` |
| T17 | `OrdersPage:200`, `StoresPage` | Эмодзи magic strings (`📦`, `🏪`) | `enum PageIcon` |
| T18 | `Badge.tsx` | Только status colors, нет count variant | `variant: 'status' \| 'count'` |
| T19 | `ConfirmModal.tsx:38` | Sidebar offset только при `>= 768px` — tablet 560-768 не учтён | Уточнить логику для tablet |

### Что хорошо

- ✅ Design tokens базис (`styles.ts`) — orchid/cyan/glass переиспользуются.
- ✅ Skeleton система — 8 presets покрывает 90% pages.
- ✅ GlassCard как `<button>` при `onClick` — semantic.
- ✅ Telegram API: BackButton/MainButton/HapticFeedback по всему коду.
- ✅ AbortController cleanup на всех async pages (после AUDIT-NETWORK-LOADING).
- ✅ Status visual hierarchy (Badge, color-coding) консистентна.
- ✅ Responsive viewport detection через `useTelegram().viewportWidth`.
- ✅ `clickableA11y` helper (`lib/a11y.ts`) готов — нужно применять.

---

## Roadmap

### Sprint A — Cross-platform polish (1 спринт)

1. **TMA hit-area 44pt** (T1) — глобальный grep `w-7 h-7` / `w-8 h-8` на интерактивных кнопках.
2. **TMA foreground tokens** (T2) — `FG.strong/muted/dim` в `styles.ts` + миграция CartPage/OrdersPage/ProductPage.
3. **Admin a11y modal/dialog** (A2) — миграция ModerationPage modal на Radix Dialog.
4. **API WebSocket events naming** (B1) — единый стиль `<namespace>:<action>`.
5. **API HTTP 201 на POST creators** (B2) — добавить `@HttpCode` decorators.

### Sprint B — Design system hardening (1 спринт)

6. **Admin theme tokens** (A4, A5, A12) — `--surface-error/-warning/-success`, миграция Button/Badge/Dialog.
7. **TMA buyer/seller визуальная дифференциация** (T4) — `data-role` + scoped CSS-переменные.
8. **TMA typography scale** (T6) — заменить 280 hardcoded text-* на enum.
9. **API Swagger** (B4) — `/api/docs` route + `@ApiOperation` на топ-20 endpoints.
10. **API products.controller split** (B5) — 942 LOC → 3 controllers по 300-350.

### Sprint C — Long tail (1+ спринт)

- A7 (Admin Tabs primitive), A8 (LoginPage OTP a11y), A13 (clickable rows).
- B3 (orders alias removal), B7 (Idempotency-Key), B8 (pagination envelope).
- T7 (`useTMABreakpoints`), T9 (`window.confirm` cleanup), T10 (CartPage error state).

---

**Total findings:** 11 P0 · 14 P1 · 14 P2 · 12 P3 = **51 actionable items**.
