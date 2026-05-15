# Done — Азим + Полат

## 2026-05-13 (Азим) — Part 4: MARKETING-VERIFIED-SELLER-001 web-buyer Frontend (Tasks 15-19)

### ✅ [MARKETING-VERIFIED-SELLER-001 FE] Product detail refactor — seller card up + Обсудить primary 🟠

- **Важность:** 🟠
- **Дата:** 13.05.2026
- **Файлы:**
  - `apps/web-buyer/src/components/store/VerifiedBadge.tsx` (новый)
  - `apps/web-buyer/src/components/store/StoreRating.tsx` (новый)
  - `apps/web-buyer/src/components/store/StoreCard.tsx` (новый, card+compact variants)
  - `apps/web-buyer/src/components/store/SellerCard.tsx` (новый, thin wrapper)
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` (re-order + CTA promotion)
- **Что сделано:** Product page seller card перемещён между title-block и variant pickers (раньше был в конце правой колонки как мини-блок с initial-letter avatar и `→`). Новый `SellerCard` показывает логотип/название/город + `VerifiedBadge` ✓ (когда `store.isVerified=true`) + `StoreRating` ★ X.X · N отзывов (когда `reviewCount > 0`). Trust signals — через `useStoreWithTrust(slug)` (workaround пока Полат не сделает `API-PRODUCT-STORE-TRUST-SIGNALS-001`). «Обсудить» поднят в primary CTA row рядом с «В корзину» (filled accent), на mobile — sticky icon-only кнопка 48×48. 5 коммитов `1800f84`, `cbe60e3`, `bf647c2`, `1cabd33`, `d65319e` на ветке web-buyer.

---

## 2026-05-13 (Азим) — Part 3: MARKETING-HOMEPAGE-DISCOVERY-001 Frontend (Tasks 7-13)

### ✅ [MARKETING-HOMEPAGE-DISCOVERY-001 FE] Homepage Discovery — 7 компонентов + page rewrite 🔴

- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/storefront-adapters.ts` (новый)
  - `apps/web-buyer/src/components/home/HomeHero.tsx` (новый)
  - `apps/web-buyer/src/components/home/HomeCategoryChips.tsx` (новый)
  - `apps/web-buyer/src/components/home/HomeTopStores.tsx` (новый)
  - `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx` (новый)
  - `apps/web-buyer/src/components/home/HomeQuickLinks.tsx` (новый)
  - `apps/web-buyer/src/app/(shop)/page.tsx` (перезаписан)
- **Что сделано:** Заменил slug-форму на discovery page. 7 коммитов:
  `eae0a1f` adapter, `49e9818` HomeHero, `9ba1186` HomeCategoryChips,
  `11343f2` HomeTopStores, `8a85c0d` HomeFeaturedFeed, `ca69cda` HomeQuickLinks,
  `bec2d2d` page.tsx rewrite.
  Страница: Hero (server SC, metadata/OG) + CategoryChips (?cat= URL filter) +
  TopStores (8 карточек через /storefront/featured) + FeaturedFeed (featured или
  platform-feed по категории) + RecentStores (localStorage, guards empty) +
  QuickLinks (Orders/Chats). RecentStores.tsx уже имеет guard `if (!mounted || stores.length === 0) return null`.

---

## 2026-05-15 (Азим) — Consumption-задачи web-sync аудита (3 типовых дубля убраны)

Полат в Wave 20 поднял типы в `packages/types`; закрыл фронтовую часть —
подключение и удаление локальных дублей. Сервис-ветки `web-buyer` / `web-seller`
сначала синхронизированы с `main` (merge, конфликт `railway.toml` разрешён в
пользу веток — per-branch deploy config).

### ✅ [API-TYPES-PROMOTE-FEATURED-STOREFRONT-001 FE] storefront-типы из packages/types 🟢
- **Важность:** 🟢 (tech-debt из `WEB-AUDIT-SYNC-IDEOLOGY-001`)
- **Дата:** 15.05.2026
- **Ветка:** `web-buyer` (merge `b237f76` + `refactor`-коммит)
- **Файлы:** `apps/web-buyer/src/lib/api/storefront.api.ts`,
  `apps/web-buyer/src/lib/storefront-adapters.ts`,
  удалён `apps/web-buyer/src/types/storefront.ts`
- **Что сделано:** `FeaturedTopStore` / `FeaturedProduct` /
  `FeaturedStorefrontResponse` / `GlobalCategoryTreeItem` теперь импортируются
  из `types`. Локальный дубль (byte-identical) удалён.

### ✅ [API-PRODUCT-IMAGES-FULL-SHAPE-001 FE] ProductImageRef — убран double-cast 🟢
- **Важность:** 🟢
- **Дата:** 15.05.2026
- **Ветка:** `web-seller` (merge `b187ae1` + `refactor`-коммит `59ca414`)
- **Файл:** `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`
- **Что сделано:** убран `as unknown as { images?: RawImage[] }` double-cast +
  локальный тип `RawImage`. `product.images` теперь типизирован
  `ProductImageRef[]`. `id/mediaId` в типе optional (ради feed-ответов) →
  добавлены `?? ''` и guard для `Map<string,string>`.

### ✅ [API-STORE-DELIVERY-SETTINGS-TYPE-001 FE] StoreDeliverySettings (частично) 🟢
- **Важность:** 🟢
- **Дата:** 15.05.2026
- **Ветка:** `web-seller` (commit `59ca414`)
- **Файл:** `apps/web-seller/src/app/(dashboard)/settings/page.tsx`
- **Что сделано:** `StoreWithDelivery` ссылается на канонический
  `StoreDeliverySettings` вместо ad-hoc inline-литерала.
- **Не закрыто полностью:** Полат добавил `deliverySettings` только в
  `StorefrontStore`, не в `Store` → extension-обёртка пока остаётся. Follow-up
  `API-STORE-TYPE-DELIVERY-SETTINGS-001` в tasks.md.

### 🔴 Найден баг: [API-TYPES-PAYMENT-METHOD-COLLISION-001]
При прогоне `tsc` обнаружен дубль экспорта `PaymentMethod` в `packages/types`
(`enums.ts` enum vs `cart.ts` type из Wave 20). Ломает type-check всех фронтов.
Заведено Полату — `analiz/logs.md` + tasks.md. Не правил (зона `packages/types`).

## 2026-05-15 (Полат) — Wave 22: TMA buyer i18n + TMA deploy fix

### ✅ [MARKETING-LOCALIZATION-UZ-001] (TMA buyer pages) 🔴
Локализованы buyer-страницы TMA. Cart/Checkout/Orders/Product/Wishlist уже
были на `t()`; добавлены 3 оставшиеся:
- **ChatPage** — статусы тредов, меню действий, reply-баннеры, ошибки,
  заголовки. Параметры `t` в `threadLabel`/`threadContext`/`threads.map`
  переименованы в `thread` (шадовили функцию перевода).
- **StorePage** — confirm замены корзины, тосты, verified-бейдж, фильтр
  категорий, цена locale-aware.
- **StoresPage** — фильтр «Все», сброс/диапазон цены, contact-tooltip.
~40 новых ключей в `ru.ts` + `uz.ts` (узбекские с `ʻ`/`ʼ`). Все 10 buyer +
5 seller страниц TMA теперь на i18n. Коммит `aad2bab`.

### ✅ [DEPLOY-TMA-RAILPACK-FAIL-001] 🔴
TMA не деплоился: Wave 19 DevOps audit удалил корневой `railway.toml`,
Railway свалился на Railpack. Восстановлен `railway.toml` (`798f720`),
`railway.toml` добавлен в watchPatterns (`6a39a06`), деплой раскручен
version-bump'ом `apps/tma/package.json` (`0c57bad`). Задеплоился успешно.

**Осталось по локализации:** admin (нет i18n-инфры), API `Accept-Language`.

## 2026-05-15 (Полат) — Wave 21: broken media + i18n + Sentry + frontend CI

### ✅ [API-PRODUCT-IMAGES-BROKEN-SUPABASE-URLS-001] 🔴
После миграции TG→Supabase часть `MediaFile` указывала на мёртвые Supabase URL.
- `product-presenter.service.ts` — `resolveImageUrl` отдаёт `''` для bucket
  `telegram-expired` **и** нового `broken`.
- Новый `audit-broken-media-urls.use-case.ts` — сканирует MediaFile, HEAD-проверяет
  URL (axios, 5s timeout), помечает мёртвые `bucket='broken'`.
- `POST /admin/media/audit-broken-urls` (`media:migrate`), пишет audit_log
  `media.audit.broken_urls`. Коммит `ffffb9c`.

### ✅ [MARKETING-LOCALIZATION-UZ-001] (TMA seller pages) 🟠
Вынесены захардкоженные RU-строки на страницах продавца в i18n (ru.ts + uz.ts):
ProfilePage, StorePage, DashboardPage, OrdersPage. OrdersPage — суммы через
locale-aware `fmt()` + `common.currency`, заодно убран unused `fmt` (TS6133,
ломал tma build). Коммит `1b9245c`.

### ✅ [API-SENTRY-001] 🟠
`ErrorReporter` ловил только uncaught/unhandledRejection — HTTP-обработанные
500 проходили мимо. `GlobalExceptionFilter` теперь репортит unhandled exception
и HttpException >= 500 с контекстом запроса (method, path, userId). Коммит `faaa36c`.

### ✅ [CI-FRONTEND-001] 🟠
Новый `.github/workflows/ci-frontend.yml` — matrix [tma, admin], build =
`tsc -b && vite build`. До этого CI был только у backend, фронт-ошибки ловил
Railway постфактум (как было с `CategoryFilter.label`). Коммит `7bb8359`.

**Файлы:** apps/api/{admin-ops.controller,admin.module,product-presenter.service,
audit-broken-media-urls.use-case,global-exception.filter}.ts,
apps/tma/src/lib/i18n/{ru,uz}.ts, apps/tma/src/pages/seller/{Profile,Store,
Dashboard,Orders}Page.tsx, .github/workflows/ci-frontend.yml.
**Ветки:** main + api + tma + admin запушены.

## 2026-05-15 (Полат) — Wave 20: Action items от web-sync audit (6 задач + ADR)

Закрыты все Action items для Полата из `analiz/audits/web-sync-2026-05-14.md`
(Часть 3). 1 оказалась false positive.

### ✅ [TMA-CART-API-SYNC-001] re-open → false positive 🔴
Азим в аудите написал «cart sync не в коде». Проверка: `apps/tma/src/lib/
cartSync.ts` существует, `syncCartToBackend()` вызывается в `AuthProvider.tsx:61`
после BUYER auth. `POST /cart/bulk-merge` идёт. Cross-channel cart работает.
Азим смотрел `cart.ts` (localStorage helper) + `CartPage.tsx`, не нашёл хук
в AuthProvider. Реально implemented в Wave 8. Ничего не менял.

### ✅ [API-CHECKOUT-PAYMENT-METHOD-001] 🔴
- `packages/types/src/api/cart.ts` — новый `PaymentMethod = 'cash'|'card'|'online'`,
  `CheckoutConfirmRequest.paymentMethod?`.
- `confirm-checkout.dto.ts` — `@IsIn(PAYMENT_METHODS)` валидация.
- `confirm-checkout.use-case.ts` — `resolvePaymentMethod()` маппит request-enum →
  Prisma-enum: `cash→COD`, `card→MANUAL_TRANSFER`, `online→ONLINE` (при
  `PAYMENT_ONLINE_ENABLED`, иначе degrade COD).
- `checkout.repository.ts` — `CreateOrderData.paymentMethod`, `createOrder`
  сохраняет на Order (`data.paymentMethod ?? COD`).
- `checkout.controller.ts` — прокидывает `dto.paymentMethod`.
- 59/59 checkout-тестов passed.

### ✅ [ADMIN-STATUS-LABEL-PENDING-001] + [STATUS-LABEL-CANONICAL-SHIPPED-001] 🟡
Единые лейблы по платформе:
- `PENDING` = «Ожидает» (admin OrdersPage STATUS_CFG + DashboardPage; FILTER_LABEL «Ожидают»)
- `SHIPPED` = «В пути» / uz «Yoʻlda»:
  - admin: `OrdersPage.tsx`, `DashboardPage.tsx`, `StatusBadge.tsx`
  - TMA: `i18n/ru.ts` + `uz.ts` `orders.status.SHIPPED`
  - API: `shared/i18n.ts` (buyer+seller `🚚 в пути`), `telegram-demo.handler.ts` (`🚚 В пути`)
  - web-* + TMA Badge уже были «В пути».

### ✅ [API-TYPES-PROMOTE-FEATURED-STOREFRONT-001] 🟢
Создан `packages/types/src/api/storefront.ts`: `FeaturedTopStore`,
`FeaturedProduct`, `FeaturedStorefrontResponse`, `GlobalCategoryTreeItem`.
Экспорт в `index.ts`. Подняты из локального web-buyer файла.

### ✅ [API-PRODUCT-IMAGES-FULL-SHAPE-001] 🟢
Новый `ProductImageRef { url; id?; mediaId?; sortOrder?; isPrimary? }`.
`ProductListItem.images` + `Product.images` теперь `ProductImageRef[]`.

### ✅ [API-STORE-DELIVERY-SETTINGS-TYPE-001] 🟢
Тип `StoreDeliverySettings` в `stores.ts`. `StorefrontStore.deliverySettings?`.

### ✅ [ADR-007] Chat message edit/delete 📋
`docs/adr/ADR-007_chat_message_edit_delete.md` (Accepted задним числом —
фича от session 36, 26.04). Edit: автор, 15-мин окно, text-only. Delete:
автор, soft (`is_deleted`). `INV-CH02` переформулирован: «soft-mutable в
пределах ADR-007» вместо «append-only».

**Файлы:** `packages/types/src/api/{cart,products,stores,storefront}.ts` + `index.ts`,
`apps/api/src/modules/checkout/{dto/confirm-checkout.dto,use-cases/confirm-checkout.use-case,
repositories/checkout.repository,checkout.controller}.ts`, `apps/api/src/shared/i18n.ts`,
`apps/api/src/modules/telegram/telegram-demo.handler.ts`, `apps/admin/src/pages/{Orders,Dashboard}Page.tsx`,
`apps/admin/src/components/admin/StatusBadge.tsx`, `apps/tma/src/lib/i18n/{ru,uz}.ts`,
`docs/adr/ADR-007_chat_message_edit_delete.md`, `docs/V1.1/01_domain_invariants.md`.

**Tests:** api/admin/tma `tsc` clean, 59/59 checkout passed.

## 2026-05-14 (Азим) — WEB-BUYER-OTP-PURPOSE-FIX-001 (SEV-3 от audit)

### ✅ [WEB-BUYER-OTP-PURPOSE-FIX-001] OtpGate purpose через props
- **Важность:** 🟢 SEV-3 (cleanup из `WEB-AUDIT-SYNC-IDEOLOGY-001`)
- **Дата:** 14.05.2026
- **Ветка:** `web-buyer` (commit `e84598c`)
- **Файл:** `apps/web-buyer/src/components/auth/OtpGate.tsx` (+11, −3)
- **Что сделано:**
  - Добавлен `purpose?: 'login' | 'register' | 'checkout'` в `OtpGateProps` с default `'login'`
  - Замена hardcoded `purpose: 'checkout'` в обоих `mutateAsync` calls на переменную `purpose`
  - Inline комментарий с reference на причину
- **Эффект:** все 5 callsites OtpGate (orders, wishlist, profile, chats, ChatComposerModal) теперь по умолчанию используют `'login'` — semantic корректно. Backend OTP rate-limits скоупятся per-purpose, теперь не путаются.
- **Что НЕ затронуто:**
  - `(minimal)/checkout/page.tsx` имеет local OtpGate function (не shared) — там `'checkout'` hardcode остаётся правильным (это и есть checkout flow).
- **Verification:** `npx tsc --noEmit` чист.

## 2026-05-14 (Азим) — WEB-BUYER-CARD-PAYMENT-DISABLE-001 (SEV-1 #3 от audit, quick fix)

### ✅ [WEB-BUYER-CARD-PAYMENT-DISABLE-001] card payment → disabled + «Скоро» badge
- **Важность:** 🔴 SEV-1 (pre-launch блокер из `WEB-AUDIT-SYNC-IDEOLOGY-001`)
- **Дата:** 14.05.2026
- **Ветка:** `web-buyer` (commit `2d59047`)
- **Файл:** `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` (+6, −1)
- **Что сделано:**
  - В `paymentMethods[]` (line 272-277) `card` option: `disabled: false` → `disabled: true`, добавлен `badge: "Скоро"` (как у `online`).
  - Inline комментарий с reference на `WEB-AUDIT-SYNC-IDEOLOGY-001` и `API-CHECKOUT-PAYMENT-METHOD-001` для будущих читателей.
- **Контекст SEV-1:**
  - До fix'а: `card` option был selectable, **но** `paymentMethod` selected state НИКОГДА не отправлялся в API. `confirm.mutateAsync(:383)` не передавал field, `CheckoutConfirmRequest` в packages/types не имеет поля, analytics (`:394`) hardcode'ит `"COD"`.
  - Эффект: misleading UI — buyer выбирает «Картой курьеру», думает что заказ оформится с картой, но seller видит «cash» и ничего не знает.
- **Quick fix vs полный fix:**
  - **Quick fix (закрыто сейчас):** скрыть от buyer'а пока backend не готов. Default `paymentMethod = 'cash'` (line 324) — поток не сломан, никто card не выберет.
  - **Полный fix (после Полата):** `API-CHECKOUT-PAYMENT-METHOD-001` — расширить `CheckoutConfirmRequest` с `paymentMethod: 'cash' | 'card' | 'online'`. Frontend передаёт selected, analytics использует actual value, backend сохраняет на Order. Web-seller увидит выбор покупателя.
- **UI:** UI уже корректно отрабатывал `disabled` через `disabled={m.disabled}` + dashed border + opacity 0.55 + cursor-not-allowed. Никаких UI правок не нужно — только flag.
- **Verification:** `npx tsc --noEmit` чист в web-buyer.

## 2026-05-14 (Азим) — WEB-BUYER-BECOME-SELLER-CTA-001 (SEV-1 #2 от audit)

### ✅ [WEB-BUYER-BECOME-SELLER-CTA-001] «Стать продавцом» CTA в /profile
- **Важность:** 🔴 SEV-1 (pre-launch блокер из `WEB-AUDIT-SYNC-IDEOLOGY-001`)
- **Дата:** 14.05.2026
- **Ветка:** `web-buyer` (commit `55c524b`)
- **Файл:** `apps/web-buyer/src/app/(shop)/profile/page.tsx` (+44, импорты `Store` + `ExternalLink` из lucide-react, `BOT_USERNAME` const)
- **Что сделано:**
  - Brand-tinted promo card в `ProfileView` между секцией «Активность» и Logout block
  - SectionLabel «Развитие» + card с `colors.brandMuted` background + `colors.brandBorder`
  - Иконка `<Store>` 18px в brand-color круге, заголовок «Откройте свой магазин», sub «Запустите Telegram-storefront за 5 минут. Свой каталог, корзина, заказы — без сайта.»
  - Filled accent button «Стать продавцом → 🔗» с deep-link `https://t.me/${BOT_USERNAME}?start=become_seller` (тот же endpoint что использует TMA `SettingsPage.tsx:22`)
  - Conditional render: только `user?.role === 'BUYER'` (SELLER уже имеет store; HYBRID/ADMIN скрыто)
  - aria-label на кнопке
- **Поправка к Pillar 6 audit'у:**
  - Агент сказал «0 occurrences `become_seller` / `applyAsSeller` в web-buyer» — это false positive потому что грепал на main. На ветке `web-buyer` `apps/web-buyer/src/components/home/HomeHero.tsx:42-50` уже имел «Стать продавцом» CTA в hero homepage (deep-link идентичный).
  - Однако оригинальный finding всё равно валиден: logged-in BUYER на /profile (далеко от homepage hero) не имел visible пути upgrade. Теперь закрыт — оба места покрыты.
- **Verification:** `npx tsc --noEmit` чист в web-buyer. Логика прозрачна: anonymous user видит OtpGate; BUYER видит promo card; SELLER не видит (return null от условия).
- **Парность:** TMA `SettingsPage.tsx:101-110` имеет ту же кнопку (с эмодзи 🏪). Web-buyer теперь консистентен.

## 2026-05-14 (Азим) — WEB-BUYER-STORE-PAGE-TRUST-SIGNALS-001 (SEV-1 #1 от audit)

### ✅ [WEB-BUYER-STORE-PAGE-TRUST-SIGNALS-001] Trust signals на storefront /[slug]
- **Важность:** 🔴 SEV-1 (pre-launch блокер из `WEB-AUDIT-SYNC-IDEOLOGY-001`)
- **Дата:** 14.05.2026
- **Ветка:** `web-buyer` (commit `707f1d4`)
- **Файл:** `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` (+43, −1)
- **Что сделано:**
  - Inline trust row в hero brand-color column между `<h1>` и `<p>description</p>`
  - ✓ pill «Проверенный» — если `store.isVerified`. Стиль: `rgba(251,247,240,0.18)` background + `0.28` border + `brandTextOnBg` text — light-on-dark для тёмно-коричневого hero
  - ⭐ rating «X.X · N отзыв/отзыва/отзывов» — если `(store.reviewCount ?? 0) > 0 && store.avgRating != null`
  - Локальный `pluralReviews()` helper (копия из `components/store/StoreRating.tsx`)
  - Импорты `Check`, `Star` из lucide-react добавлены к существующему `Send`
  - aria-label на pill + aria-label на rating span
- **Почему не reuse `VerifiedBadge`/`StoreRating`:** оба компонента используют `colors.success`/`colors.textMuted`/`colors.textBody` — рассчитаны на light surface. На тёмно-коричневом `colors.brand` фоне hero они плохо читаются.
- **Conditional render:** оба элемента показываются только при наличии данных. На текущем проде оба stores (`azim-mnx4na25`, `savdobuilder-mnvjz3cg`) `isVerified=false` и `reviewCount=0` — ничего не рендерится. Активируется когда:
  - Полат verify-ит магазин через admin (`POST /admin/stores/:id/verify`)
  - Появятся отзывы (review repository aggregate refresh)
- **Парность:** TMA `StorePage.tsx:188` и admin `StoresPage.tsx:206` тоже отображают эти trust signals — теперь web-buyer консистентен.
- **Verification:** `npx tsc --noEmit` чист в web-buyer. Smoke на проде: страница `/azim-mnx4na25` рендерится без ошибок (новый блок hidden из-за условий).

## 2026-05-14 (Азим) — WEB-AUDIT-SYNC-IDEOLOGY-001

### ✅ [WEB-AUDIT-SYNC-IDEOLOGY-001] Pre-launch sync audit web-* (4 параллельных агента)
- **Важность:** 🔴 P0
- **Дата:** 14.05.2026
- **Deliverable:** `analiz/audits/web-sync-2026-05-14.md` (~600 LOC)
- **Метод:** 4 параллельных read-only агента (`Explore` + `feature-dev:code-explorer` + `feature-dev:code-reviewer`) на 6 pillars.
- **Pillars / verdicts:**
  1. Type sync — ✅ mostly clean (2 SEV-3 concerns: locals types + image cast)
  2. Storage / Media — ✅ clean (0 critical; backend = единственный URL resolver)
  3. Function duplication — 🟡 1 known dupe (PhoneInput triple, tracked)
  4. API endpoint hygiene — ✅ ZERO ISSUES (0 dead/stale/duplicate)
  5. Ideology / scope-creep — 🔴 1 invariant violation (INV-CH02 без ADR) + 1 SEV-1 (card payment misleading)
  6. Cross-platform consistency — 🔴 3 SEV-1 (cart cross-channel, web-buyer trust signals, become-seller CTA) + 2 SEV-2 (status labels)
- **Главный итог:** web-* архитектурно соответствует проекту. **Pre-launch блокеры — функциональные пробелы, не архитектурные баги.** 5 SEV-1 нужно закрыть до launch (3 = web-buyer фичи, 1 = TMA cart sync, 1 = ADR для chat edit/delete). 8 SEV-2/3 — tech-debt.
- **Выписаны новые тикеты в `analiz/tasks.md`:**
  - 🔴 `WEB-BUYER-STORE-PAGE-TRUST-SIGNALS-001` (Азим)
  - 🔴 `WEB-BUYER-BECOME-SELLER-CTA-001` (Азим)
  - 🔴 `WEB-BUYER-CARD-PAYMENT-DISABLE-001` (Азим, quick fix; full fix после Полата)
  - 🔴 `TMA-CART-API-SYNC-001` (re-open для Полата)
  - 🔴 `API-CHECKOUT-PAYMENT-METHOD-001` (Полат)
  - 🔴 `ADR-CHAT-MESSAGE-EDIT-DELETE-001` (документация — все)
  - 🟡 `STATUS-LABEL-CANONICAL-SHIPPED-001` (4-way label divergence)
  - 🟡 `ADMIN-STATUS-LABEL-PENDING-001` (Полат, admin)
  - 🟢 `WEB-BUYER-OTP-PURPOSE-FIX-001` (Азим)
  - 🟢 `API-TYPES-PROMOTE-FEATURED-STOREFRONT-001` (Полат)
  - 🟢 `API-PRODUCT-IMAGES-FULL-SHAPE-001` (Полат)
  - 🟢 `API-STORE-DELIVERY-SETTINGS-TYPE-001` (Полат)
- **Compliance OK (явно подтверждено):**
  - 0 SMS / Eskiz / Playmobile / Twilio / AWS SNS — OTP только Telegram bot
  - INV-C01 (cart=один store), INV-C03 (заказ immutable), INV-S01 (один seller=один store) — все соблюдены
  - 0 unauthorized roles (только BUYER/SELLER/ADMIN/HYBRID)
  - 0 gamification / loyalty / referral / affiliate features
  - 0 admin-level features inside seller dashboard
  - 100% type imports из packages/types (нет локальных `interface Order/Cart/Product`)
  - 100% media URL resolution на backend (нет локальных `resolveMediaUrl()`, нет hardcoded supabase URLs)
  - 100% delivery fee / stock / sale price / order status — из API
- **Что НЕ scope creep (false positive от агента):** `MARKETING-REVIEWS-SHOW-001` (read-only product reviews UI) — закрыт 11.05.2026, агент это пропустил при поиске.
- **Re-audit:** не нужен после закрытия SEV-1 + ADR — это точечные фиксы, не архитектурные.

## 2026-05-14 (Азим) — WEB-BUYER-REMOVE-USESTOREWITHTRUST-001

### ✅ [WEB-BUYER-REMOVE-USESTOREWITHTRUST-001] Cleanup useStoreWithTrust
- **Важность:** 🟢 P3 cleanup
- **Дата:** 14.05.2026
- **Ветка:** `web-buyer` (commit `10f3bd0`) — main только статус-апдейт в analiz/*
- **Контекст:** Полат 14.05.2026 закрыл `API-PRODUCT-STORE-TRUST-SIGNALS-001` (commit `b1aa682` в main): backend теперь возвращает `product.store: StoreRef` с mandatory `isVerified/avgRating/reviewCount`. Web-buyer'у больше не нужен второй request на `/storefront/stores/:slug` ради бейджа/рейтинга на product page seller card.
- **Файлы (5):**
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — убран `useStoreWithTrust(slug)`, `<SellerCard>` читает `product.store.{isVerified,avgRating,reviewCount}` напрямую
  - `apps/web-buyer/src/hooks/use-storefront.ts` — удалён `useStoreWithTrust` hook + `storeWithTrust` query key
  - `apps/web-buyer/src/lib/api/storefront.api.ts` — удалена `getStorefrontStoreWithTrust` функция
  - `apps/web-buyer/src/types/storefront.ts` — удалены `StoreTrustSignals` + `StorefrontStoreWithTrust` локальные расширения
  - `packages/types/src/api/stores.ts` — подтянуто из main (StoreRef + Store с mandatory trust signals, StorefrontStore — optional для backward-compat кэша)
- **Эффект:**
  - −1 HTTP request на каждое product detail visit (раньше 2: `/products/:id` + `/stores/:slug`)
  - −1 React Query cache entry, −1 hook, −1 API function, −2 локальных type definitions
  - Trust signals теперь идут вместе с продуктом → no inconsistent loading states (раньше badge мог появиться позже названия магазина из-за второго запроса)
- **Verification:** `npx tsc --noEmit` чист в web-buyer; grep `useStoreWithTrust|StoreTrustSignals|getStorefrontStoreWithTrust` в `apps/web-buyer/src` → 0 hits.
- **Что НЕ затронуто:**
  - `getStoreBySlug` / `useStoreBySlug` — отдельный use case (рендер каталога магазина `/[slug]/page.tsx`), оставлен.
  - Backend изменения — Полатовские, в main, на web-buyer service-ветке backend файлы не нужны (Railway деплоит web-buyer Next.js, бэк отдельно из api/main).

## 2026-05-14 (Полат) — Wave 18: TMA seller pages i18n + Sentry-lite

### ✅ [MARKETING-LOCALIZATION-UZ-001] TMA seller pages i18n 🔴
- +12 ключей в ru.ts + uz.ts (seller.products.retry/allFilter, seller.orders.*, seller.profile.title/openSite, seller.store.*)
- `ProductsPage`: useTranslation hook, retry button
- `OrdersPage` (seller): title, loadError + retry, empty/emptyCategory, total label, message placeholder, customer/account phone notes
- `ProfilePage` (seller): title + openSite aria-label
- `StorePage` (seller): title (3 места), createTitle/Hint, creating/createBtn, name placeholder, descPlaceholder, cancel button, openSite aria-label

### ✅ [API-SENTRY-001] lightweight error reporter 🟢
- `apps/api/src/shared/error-reporter.ts` — `ErrorReporter.init()` в `main.ts`
- Auto-capture: `uncaughtException` + `unhandledRejection`
- Manual API: `captureException(err, context)` / `captureMessage(msg, level, context)`
- JSON output в stderr (Railway log aggregation friendly)
- PII-скраббинг: `password/secret/token/authorization` → `[REDACTED]`
- Tags: `release` (`RAILWAY_GIT_COMMIT_SHA[:7]`) + `environment` (`NODE_ENV`)
- Env-flag `ERROR_REPORTER_ENABLED=false`
- 60% Sentry-функций без npm install. Когда нужен полный Sentry — заменить `ErrorReporter.captureException` на `Sentry.captureException` (API совместимый).

### ⏸️ Admin локализация — пропущена
ROI низкий: admin — внутренний tool для команды из 1-3 человек, родной язык русский. Делать позже когда найдём UZ-only админа.

**Tests:** api tsc clean. TMA tsc clean.

## 2026-05-14 (Полат) — Wave 17: API i18n + Pino logging + Seller Dashboard i18n

3 задачи закрыты:

### ✅ [API i18n] Accept-Language для TG-уведомлений 🔴
- `apps/api/src/shared/i18n.ts` (NEW): `t(locale, key, vars)` + `fmt(n, locale)` + `currency(code, locale)`. Полные dictionaries ru/uz для всех 9 типов notification:
  newOrder, storeApproved/Rejected, verificationApproved, orderStatusChanged,
  chatMessage, cartAbandoned, priceDrop, backInStock.
  Узбекский — Latin с обратным апострофом `ʻ`.
- `apps/api/src/queues/telegram-notification.processor.ts`: все 9 cases на `t()` + `fmt()` + `currency()`. Удалены legacy `ORDER_STATUS_LABEL_BUYER/SELLER` константы.
- `seller-notification.service.ts`: все DTO теперь несут опциональный `locale?: string` (значение `User.languageCode`, default 'ru').
- `cart-abandonment.service.ts` + `wishlist-notify.service.ts`: select `languageCode` из `buyer.user`, передают в job data.
- **Поведение:** seller с `User.languageCode='uz'` получит TG-уведомления на узбекском. Default = ru.

### ✅ [API-PINO-LOGGING-001] structured logging без зависимостей 🟢
- `apps/api/src/shared/structured-logger.ts` — `ConsoleLogger` extension.
- В `NODE_ENV=production`: emit single-line JSON `{ts, level, context, msg, trace}` через stdout (info/log/warn/debug/verbose) или stderr (error/fatal) — Railway log aggregation разделяет streams.
- В dev: fallback на цветной NestJS ConsoleLogger.
- `isLevelEnabled` override + `LOG_LEVEL` env для production tuning.
- Подключено в `main.ts` через `NestFactory.create({ logger: new StructuredLogger() })`.
- **Все существующие `Logger.log/warn/error` работают автоматически без правок** (StructuredLogger пробрасывает в super.log в dev, в JSON в prod).
- **Pino не подключаем** — требует `pnpm install` (4 пакета). Wrapper даёт 80% value.

### ✅ [MARKETING-LOCALIZATION-UZ-001] Seller Dashboard + словарь seller 🟠
- ru.ts + uz.ts: +24 ключа для seller (dashboard.title/greeting/quickActions/totalProducts/totalOrders/pending/revenue, products.title/empty/addFirst/filterActive/filterDraft/filterArchived/confirmDelete*, orders.viewAll/recent).
- `seller/DashboardPage.tsx`: heading, statsCards labels (Товары/Заказы/Новые), greeting `Salom, {name}!`, orders.recent + orders.viewAll, empty state, currency, `orders.orderNumber` template.

**Tests:** 74/74 api wishlist+cart passed. TMA tsc + build clean (300KB / 94KB gzip).

## 2026-05-14 (Полат) — Wave 16: 4 P1 design/UX задачи (полное закрытие)

4 задачи закрыты за один проход.

### ✅ [DESIGN-TMA-BRAND-DIFF-001] verified done 🎨
Реализовано параллельной FG-TOKENS сессией ранее (Wave 7-12).
- `index.css` имеет `[data-role="SELLER"]` override на `--tg-accent`
- `AppShell.tsx:21` + `BottomNav.tsx:53` ставят `data-role={role}`
- Buyer = orchid `#A855F7`, Seller = cyan `#22D3EE`
- Light + dark theme overrides оба покрыты

### ✅ [DESIGN-PHONE-INPUT-PACKAGE-001] packages/ui (Полат часть) 🎨
- `packages/ui/components/PhoneInput.tsx` (NEW) — `forwardRef` + `formatUzPhone/stripUzPhone/isValidUzPhone`. value/onChange в E.164, маска `+998 XX XXX XX XX`.
- `packages/ui/index.ts` экспортирует.
- `packages/ui/package.json` — `peerDependencies.react: ^18||^19`.
- `packages/ui/README.md` — migration plan для Азима: добавить `"@savdo/ui": "workspace:*"` в web-buyer + web-seller package.json → `pnpm install` → удалить дубли → заменить импорты на `'use client'` обёртку.
- **Что НЕ сделал:** не подключал в apps/web-* (зона Азима, требует `pnpm install`).

### ✅ [TMA-LIGHT-THEME-MIGRATION-001] +92 точки text-цветов 🟠
Mass replace text-colors во всех 4 крупных seller-формах:
- `seller/AddProductPage.tsx` (12 точек)
- `seller/EditProductPage.tsx` (11)
- `seller/ChannelSettingsPage.tsx` (26)
- `seller/SettingsPage.tsx` — закрыто в Wave 14

Map:
```
0.90/0.85/0.92 → var(--tg-text-primary)
0.75/0.70/0.55/0.50/0.5 → var(--tg-text-secondary)
0.45/0.40 → var(--tg-text-muted)
0.35/0.30/0.25 → var(--tg-text-dim)
```

Остаётся ~40 точек surface/border (0.04-0.18 диапазон) — тонкие
glass/backdrop эффекты, требуют визуального теста light theme.

### ✅ [TMA-TYPOGRAPHY-SCALE-001] mass migrate text-[Npx] 🟠
Sed batch замена во всех 20+ файлах:
- `text-[10px]` → `text-xxs`
- `text-[11px]` → `text-xxs`
- `text-[12px]` → `text-xs`

После: 0 хардкодов `text-[1[0-2]px]` осталось. ~50 редких
`text-[Npx]` для специфичных значений (15-17px) — по мере касания.

**Tests:** `pnpm tsc --noEmit` чист, `pnpm build` clean (297KB index gzip 93KB).

## 2026-05-14 (Полат) — Wave 15: P2-P3 batch (5 tickets + i18n продолжение)

5 быстрых задач + i18n миграция Profile/ChatPage buyer.

### ✅ [API-N1-PRODUCTS-LIST-001] Opt-in pagination для /stores/:slug/products 🟢
- `GET /stores/:slug/products` теперь поддерживает `?page=N&limit=N` query
  params. Если переданы — envelope `{ data, meta: { total, page, limit } }`
  через `findPublicByStoreIdPaginated`. Если нет — legacy raw array
  (backward-compat, take=200 default).
- Без breaking change для существующих consumers. Полная envelope-wide
  migration отложена в `API-PAGINATION-ENVELOPE-001` (dual-emit + sync с Азимом).
- **Файлы:** `apps/api/src/modules/products/storefront.controller.ts`.

### ✅ [DESIGN-SEMANTIC-COLORS-001] admin часть (mirror Azim'овской web-* версии) 🟡
- Новый `apps/admin/src/lib/styles.ts`:
  - `dangerTint(o)/warningTint(o)/successTint(o)` через `color-mix(in srgb,
    var(--error) X%, transparent)` (Chrome 111+/Safari 16.4+/FF 113+ — admin
    desktop-only). Произвольная opacity без раздувания CSS-vars.
  - Готовые `errorBanner()/successBanner()/warningBanner()` `CSSProperties`
    для частых случаев (status + border + bg одним объектом).
- **packages/design-tokens unified пакет НЕ создаём** — Soft Color Lifestyle
  (buyer) и Liquid Authority (seller+admin) by design разные.

### ✅ [DESIGN-A11Y-ARIA-LABELS-001] admin часть 🟡
- AdminUsersPage delete button (с conditional aria-label «Нельзя удалить
  Super Admin» / «Удалить доступ»)
- CategoriesPage `ActionBtn` (aria-label = title + aria-hidden на children-иконке)
- ChatsPage delete thread
- DatabasePage: 2 кнопки в RowDetailPanel (delete/close) + 1 в actions
  rows + 1 в error banner close
- StoreDetailPage delete product
- **Bonus:** все hardcoded `rgba(239,68,68,...)` в этих файлах заменены
  на semantic vars (`var(--surface-error)`/`var(--border-error-soft)`/
  `var(--error)`) из `ADMIN-DESIGN-TOKENS-SURFACE-001`.

### ✅ [Nice-to-have от Азима] `_count.products` в /seller/categories 🟢
- `StoreCategoriesRepository.findByStoreId` теперь делает `include: {
  _count: { select: { products: { where: { status: ACTIVE, deletedAt: null } } } } }`
- Возврат: `StoreCategoryWithCount[]` (`& { productCount: number }`)
- В `packages/types/src/api/stores.ts` — `StoreCategory.productCount?: number`
  (опционально для backward-compat с другими endpoints).
- Один запрос, без N+1. Web-seller `/store/categories` теперь может
  показывать счётчик товаров рядом с именем категории.
- **Файлы:** `apps/api/src/modules/categories/repositories/store-categories.repository.ts`,
  `apps/api/src/modules/categories/use-cases/get-store-categories.use-case.ts`,
  `packages/types/src/api/stores.ts`.

### ✅ [MARKETING-LOCALIZATION-UZ-001] продолжение — Profile + ChatPage buyer 🔴
- `buyer/ProfilePage` целиком переведена: header, аккаунт, «Хочешь
  продавать?» card, действия (заказы, бот, выйти), guest banner,
  CTA «Войти через @bot». +14 ключей profile.* / auth.guest*.
- `buyer/ChatPage` (минимально): empty/error/no-threads states, edit
  message banner, edited tag, attach photo / cancel reply / cancel edit
  aria-labels, placeholder инпута, toast'ы send/report. +14 ключей chat.*.
- **Файлы:** `apps/tma/src/lib/i18n/{ru,uz}.ts`, `apps/tma/src/pages/
  buyer/{ProfilePage,ChatPage}.tsx`.

**Tests:** api 74/74 (categories + products), tma `pnpm build` clean,
admin tsc clean.

## 2026-05-14 (Полат) — API-PRODUCT-STORE-TRUST-SIGNALS-001 (контракт от Азима)

### ✅ [API-PRODUCT-STORE-TRUST-SIGNALS-001] Trust signals в Product.store 🟡
- **Важность:** 🟡 P1 (контракт-задача от Азима, коммит `508932d` от 13.05)
- **Дата:** 14.05.2026
- **Ветка:** main + api
- **Файлы:**
  - `apps/api/src/modules/products/repositories/products.repository.ts` —
    `publicProductDetailInclude.store` теперь `select` с `id/name/slug/city/
    telegramContactLink/logoMediaId` + trust signals `isVerified/avgRating/
    reviewCount`. Был без `store` вообще.
  - `apps/api/src/modules/products/services/product-presenter.service.ts` —
    новый helper `mapProductStoreRef(store)`: resolveStoreImageUrls для
    logoUrl + Number(avgRating) Decimal→number normalization.
  - `apps/api/src/modules/products/storefront.controller.ts` —
    оба endpoints (`GET /storefront/products/:id` + `GET /stores/:slug/
    products/:id`) применяют `presenter.mapProductStoreRef` и эмиттят
    `store: StoreRef` в response.
  - `packages/types/src/api/stores.ts` —
    - `StoreRef` расширен trust signals (mandatory).
    - `Store` (full model) — trust signals mandatory.
    - `StorefrontStore` — trust signals optional (backward-compat с
      кэшированными ответами; новые `/storefront/stores/:slug` всегда
      возвращают, см. `stores.repository.findBySlug`).
- **Что закрывает на стороне Азима:**
  - Можно удалить `useStoreWithTrust` hook
  - Можно удалить локальные расширения `apps/web-buyer/src/types/storefront.ts`
  - Второй request на `/storefront/stores/:slug` ради бейджа/рейтинга
    больше не нужен — все trust signals приходят в `product.store`.
- **Tests:** 62/62 products-теста passed (presenter, get-featured, change-status,
  и др. — никаких регрессий). api `tsc --noEmit` clean.

## 2026-05-13 (Полат) — Wave 14: P1 UX batch (8 tickets) + 2 deferred

Большая партия: 4 admin (design tokens + a11y + tabs + buttons), 4 tma
(typography + light theme partial + 2 MainButton + Yandex autocomplete +
wishlist-notify cron). 2 breaking-change задачи отложены с обоснованием.

### ✅ Wave 13 ([feat/admin]: design tokens + a11y) — закоммичено отдельно

См. коммит `33a90b7`. 4 ADMIN-* задачи закрыты:
- ADMIN-DESIGN-TOKENS-SURFACE-001 (12 semantic surface tokens × 2 темы)
- ADMIN-THEME-VARS-MIGRATE-001 (Button/Badge через .btn-*/.badge-* классы на vars)
- ADMIN-A11Y-MODAL-001 (DashboardLayout aria-label + theme toggle aria-pressed)
- ADMIN-A11Y-TABS-OTP-001 (новый Tabs primitive + roving-tabindex в ModerationPage)

### ✅ [TMA-TYPOGRAPHY-SCALE-001] (партиально, инфра) 🟠

`tailwind.config.js` теперь использует CSS-vars для `theme.fontSize`:
`text-xxs/-xs/-sm/-base/-lg/-xl/-2xl` все через `var(--t-*)` из index.css.
Кастомный `text-xxs` (11px) для UI — раньше был `text-[11px]` хардкодом
в 280+ местах. Десктопный override `@media (min-width: 1024px)` (1.05×
scale). Migrate map в комментариях config'а. Мигрированы SettingsPage
buyer / StoresPage / StorePage. Остальные 250+ — рутина по мере касания.

### ✅ [TMA-LIGHT-THEME-MIGRATION-001] (партиально продолжение)

Параллельная FG-TOKENS сессия закрыла 470 точек (waves 7-16). 13.05.2026
точечно мигрировал text-цвета в seller/SettingsPage (15 точек: text-primary
/secondary/muted/dim). Осталось ~117 точек surface/border тонкие эффекты
в крупных seller-формах (Add/Edit/ChannelSettings) — не блокер.

### ✅ [TMA-SELLER-MAIN-BUTTON-002/003] AddProductPage + EditProductPage 🟠

**AddProductPage** (1069 LOC): MainButton текст по стадии заполнения:
1. Выберите категорию → 2. Добавьте фото → 3. Введите название →
4. Укажите цену → 5. Заполните: {filter-label} → 6. Добавьте размер →
7. Опубликовать товар. Пользователь видит чего не хватает, не упирается
в disabled.

**EditProductPage** (1150 LOC): аналогично, упрощённо (нет photo/filters):
1. Выберите категорию → 2. Введите название → 3. Укажите цену →
4. Сохранить изменения.

### ✅ [TMA-ADDRESS-AUTOCOMPLETE-001] Yandex Suggest для UZ-адресов 🟠

`apps/tma/src/components/ui/AddressAutocomplete.tsx`:
- REST endpoint `suggest-maps.yandex.ru/v1/suggest` (без полной Maps JS)
- Bbox `55.99,37.18~73.16,45.59` — результаты только из Узбекистана
- Debounce 300ms + AbortController на каждый запрос
- Локаль `ru_RU`/`uz_UZ` авто из i18n locale
- Grafefully degrades на обычный input если `VITE_YANDEX_MAPS_API_KEY` пуст
- Dropdown с outside-click + Esc + клик-pick

Подключено в `buyer/CheckoutPage` (`<AddressAutocomplete>` вместо `<input>`).

### ✅ [MARKETING-WISHLIST-NOTIFY-001] price-drop + back-in-stock cron 🟠

**Schema:** `BuyerWishlistItem.priceSnapshot/inStockSnapshot/notifiedAt/notifiedReason`
+ индекс `notifiedAt`. Migration `20260513150000_wishlist_notify_tracking`.

**AddToWishlistUseCase** теперь сохраняет snapshot: priceSnapshot =
salePrice ?? basePrice; inStockSnapshot = status==='ACTIVE' && isVisible
&& (no variants || any variant with stock>0). При re-add (upsert update)
snapshot обновляется + notifiedAt сбрасывается.

**WishlistNotifyService** cron `@EVERY_4_HOURS`:
- Сканирует кандидатов с заполненным snapshot, не ghost-аккаунты
- PRICE_DROP: currentPrice < oldPrice × (1 - 0.10) — порог 10%
- BACK_IN_STOCK: was OOS → now ACTIVE+stock
- Idempotency: updateMany WHERE notifiedAt IS NULL OR < now-7d
- Cooldown 7 дней между nudge per item
- После nudge snapshot обновляется → следующий только при новом изменении
- Env-flag `WISHLIST_NOTIFY_ENABLED=false` отключает

**Jobs:** `TELEGRAM_JOB_WISHLIST_PRICE_DROP` / `_BACK_IN_STOCK` в processor:
HTML-template с discount% (для price-drop) + inline-кнопка «🛍 Открыть
товар» с deep-link `?startapp=product_<slug>_<id>`.

**Tests:** spec +5 cases (price snapshot, salePrice priority, status≠ACTIVE,
empty variants, no variants single-stock). Всего 17/17 wishlist-тестов passed.

### ⏸️ Отложено с обоснованием

- **API-WS-EVENTS-NAMING-001** — breaking для 4 фронтов одновременно.
  Без feature-flag/dual-emit + sync с Азимом нельзя. План в `API-WS-EVENTS-DUAL-EMIT-001`.
- **API-PAGINATION-ENVELOPE-001** — breaking для всех list endpoints.
  Стратегия: dual-emit через query/header, миграция фронтов раздельно.

### Файлы

**Admin (Wave 13):**
- `apps/admin/src/index.css` (+vars + @layer components)
- `apps/admin/src/components/ui/{button,badge,tabs}.tsx`
- `apps/admin/src/layouts/DashboardLayout.tsx`
- `apps/admin/src/pages/{AdminUsers,AuditLogs,AnalyticsEvents,Broadcast,Moderation}Page.tsx`

**TMA (Wave 14):**
- `apps/tma/tailwind.config.js` (fontSize through vars)
- `apps/tma/src/index.css` (+ typography vars + desktop override)
- `apps/tma/src/pages/buyer/{SettingsPage,StoresPage,StorePage}.tsx` (text-xxs migrate)
- `apps/tma/src/pages/seller/SettingsPage.tsx` (light theme text colors)
- `apps/tma/src/pages/seller/AddProductPage.tsx` (MainButton stages)
- `apps/tma/src/pages/seller/EditProductPage.tsx` (MainButton stages)
- `apps/tma/src/components/ui/AddressAutocomplete.tsx` (new)
- `apps/tma/src/pages/buyer/CheckoutPage.tsx` (integrate AddressAutocomplete)

**API (Wave 14 backend):**
- `packages/db/prisma/schema.prisma` (Wishlist snapshot fields)
- `packages/db/prisma/migrations/20260513150000_wishlist_notify_tracking/`
- `apps/api/src/queues/telegram-notification.processor.ts` (+2 job cases)
- `apps/api/src/modules/wishlist/services/wishlist-notify.service.ts` (new)
- `apps/api/src/modules/wishlist/wishlist.module.ts` (+BullModule + cron)
- `apps/api/src/modules/wishlist/use-cases/add-to-wishlist.use-case.ts`
- `apps/api/src/modules/wishlist/repositories/wishlist.repository.ts`
- `apps/api/src/modules/wishlist/use-cases/wishlist.use-cases.spec.ts` (+5 cases)

**Tests:** admin tsc clean, api tsc clean, 17/17 wishlist passed.

## 2026-05-14 (Азим) — DESIGN-SEMANTIC-COLORS-RGBA-002 (follow-up rest)

### ✅ [DESIGN-SEMANTIC-COLORS-RGBA-002] Оставшиеся ~14 точек hardcoded rgba → dangerTint()
- **Важность:** 🟢 P3 design follow-up
- **Дата:** 14.05.2026
- **Ветки:** `main` → web-buyer + web-seller (cherry-pick)
- **Файлы (10):**
  - `apps/web-seller/src/components/image-uploader.tsx` — error-state container + retry pill (2 точки)
  - `apps/web-seller/src/app/(dashboard)/analytics/page.tsx` — analytics error banner
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx` — `HIDDEN_BY_ADMIN` status chip
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx` — cancel modal confirm + row Cancel button (2 точки)
  - `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx` — cancel modal confirm + detail Cancel button (2 точки)
  - `apps/web-seller/src/app/(dashboard)/notifications/page.tsx` — notifications error banner
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — save error banner
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — create error banner
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — delete-chat icon-button + 2 confirm-delete pills (3 точки)
  - `apps/web-buyer/src/app/(shop)/chats/page.tsx` — delete-chat icon-button (1 точка, `rgba(220,38,38)` → buyer `dangerTint()` теперь муто-красный per Soft Color Lifestyle)
- **Что сделано:**
  - Все 15 точек заменены: `'rgba(248,113,113,X)'` → `dangerTint(X)` (seller) и `'rgba(220,38,38,X)'` → `dangerTint(X)` (buyer chats).
  - Все эти места теперь автоматически адаптируются к смене темы light↔dark вместо фиксированного «коралового» оттенка.
  - В каждый файл добавлен `dangerTint` к существующему импорту из `@/lib/styles`.
- **Verification:** `pnpm exec tsc --noEmit` в обоих апах чист. Grep `rgba\(248,113,113|rgba\(220,38,38` в моей зоне → 0 hits (остатки только в TMA + admin — зона Полата).
- **Что НЕ сделано (out-of-scope):**
  - TMA pages (`apps/tma/src/pages/seller/*`, `App.tsx`, `SellerAnalyticsCard.tsx` и т.д.) — зона Полата (~20 точек).
  - admin (`apps/admin/src/index.css` — уже использует CSS-vars паттерн через `--surface-error-*`, OK).

---

## 2026-05-14 (Азим) — WEB-SELLER-STORE-CATEGORIES-CRUD-001

### ✅ [WEB-SELLER-STORE-CATEGORIES-CRUD-001] Отдельная страница для CRUD категорий
- **Важность:** 🟢 P3
- **Дата:** 14.05.2026
- **Ветка:** `main` → web-seller (cherry-pick)
- **Файлы (2):**
  - `apps/web-seller/src/app/(dashboard)/store/categories/page.tsx` (NEW, ~240 LOC) — отдельная страница `/store/categories`
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` (REFACTOR) — StoreCategoriesSection (120 LOC) → компактная ссылка «Управление категориями» с count
- **Что сделано:**
  - List категорий с inline edit (click name → input, Enter to save, Escape to cancel)
  - Add form вверху страницы (отдельный block с лейблом)
  - Delete через `ConfirmModal` (раньше в Settings — без confirm)
  - **Move up / move down arrows** — сортировка через swap sortOrder (новое — Settings секция не имела)
  - Empty state «Пока нет категорий»
  - Error banner через `dangerTint()` helpers
  - aria-label на каждой кнопке (Pencil/Trash2/ArrowUp/ArrowDown) + aria-hidden на иконках
- **Что НЕ сделано (nice-to-have):**
  - Product count per category (нужен backend поддержка `_count.products` в response — Полату следует добавить если потом понадобится)
  - Drag-and-drop reorder вместо arrow buttons (текущий swap достаточно для UZ-сценария)
- **Verification:** `npx tsc --noEmit` чист.

## 2026-05-14 (Азим) — DESIGN-SEMANTIC-COLORS-001 (theme-aware tints, hot-path)

### ✅ [DESIGN-SEMANTIC-COLORS-001] dangerTint / warningTint / successTint helpers
- **Важность:** 🟡 P1 design quick win
- **Дата:** 14.05.2026
- **Ветки:** `main` → web-buyer + web-seller (cherry-pick)
- **Файлы (7):**
  - `apps/web-buyer/src/app/globals.css` — `--color-success-rgb/-warning-rgb/-danger-rgb` для `:root` и `[data-theme=dark]`
  - `apps/web-buyer/src/lib/styles.ts` — `dangerTint(o)/warningTint(o)/successTint(o)` helpers
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — checkout error banner + stock warning переведены
  - `apps/web-seller/src/app/globals.css` — `--color-success-rgb/-warning-rgb/-danger-rgb/-info-rgb` для обоих тем
  - `apps/web-seller/src/lib/styles.ts` — те же helpers
  - `apps/web-seller/src/app/(auth)/login/page.tsx` — login error banner переведён
  - `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx` — ErrorBanner переведён
- **Что сделано:**
  - **Theme-aware tints** через CSS color level 4 syntax `rgb(var(--color-X-rgb) / opacity)`. Раньше hardcoded `rgba(220,38,38,0.10)` не адаптировался при смене light↔dark, теперь — автоматически.
  - **RGB-channels разные** для каждой темы (buyer light: `139,58,58` → dark `197,102,102`; seller light: `220,38,38` → dark `248,113,113`).
  - Hot-path: видимые на каждой login/onboarding/checkout попытке — переведены.
- **Что НЕ сделано (отдельная задача `DESIGN-SEMANTIC-COLORS-RGBA-002`, P3):**
  - ~14 точек hardcoded `rgba(248,113,113,X)` в web-seller analytics/orders/notifications/products/chat и web-buyer chats. Helper готов — нужен mass-replace. Не блокер: цвета визуально совпадают, но light/dark не адаптируются.
  - `packages/design-tokens` unified пакет **намеренно НЕ создаём** — Soft Color Lifestyle (buyer warm terracotta) и Liquid Authority (seller violet) by design разные.
- **Verification:** `npx tsc --noEmit` чист в обоих апсах.

## 2026-05-14 (Азим) — DESIGN-A11Y-ARIA-LABELS-001 (web-* часть)

### ✅ [DESIGN-A11Y-ARIA-LABELS-001] A11y aria-labels на icon-only кнопках + decorative SVG
- **Важность:** 🟡 P1 design quick win
- **Дата:** 14.05.2026
- **Ветки:** `main` → web-buyer + web-seller (cherry-pick)
- **Файлы (6):**
  - `apps/web-buyer/src/components/icons.tsx` — 10 shared SVG получили `aria-hidden="true"` + `focusable="false"` (декоративные, рядом всегда есть видимый текст — BottomNavBar таб, button label)
  - `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — `aria-current="page"` на активном табе; `aria-label` на Link теперь включает badge count (`"Корзина (3 непрочитанных)"`); badge span получил `aria-hidden="true"` (озвучен через label)
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — 2 thumbnail кнопки (desktop grid + mobile scroll) получили `aria-label="Показать фото N"` + `aria-pressed`. Раньше `<Image alt="">` внутри — кнопка была без accessible name
  - `apps/web-seller/src/components/image-uploader.tsx` — X кнопка удаления получила `aria-label="Удалить фото"`
  - `apps/web-seller/src/components/product-variants-section.tsx`, `product-option-groups-section.tsx` — X cancel получили `aria-label="Отмена"` (title уже был — но title не считается accessible name)
- **Что НЕ сделано:**
  - **Admin (DatabasePage и др.)** — зона Полата. Оригинальный отчёт упоминал 21 icon-only button по всей платформе; admin-часть — отдельный ticket.
  - Полный audit lucide-react иконок в buttons с text-соседями — не критично (текст-сосед даёт accessible name автоматически), осталось как nice-to-have.
- **Verification:** `npx tsc --noEmit` чист в обоих апсах.

## 2026-05-14 (Азим) — DESIGN-PHONE-INPUT-PACKAGE-001 (web-* часть)

### ✅ [DESIGN-PHONE-INPUT-PACKAGE-001] PhoneInput с маской +998 XX XXX XX XX
- **Важность:** 🟡 P1 design quick win
- **Дата:** 14.05.2026
- **Ветки:** `main` → web-buyer + web-seller (через FF merge)
- **Файлы:**
  - `apps/web-buyer/src/components/PhoneInput.tsx` (NEW)
  - `apps/web-buyer/src/components/auth/OtpGate.tsx` (EDIT — заменён `<input type=tel>` на `<PhoneInput>`)
  - `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` (EDIT — 2 phone inputs: OTP step + contact form)
  - `apps/web-buyer/src/app/(shop)/profile/page.tsx` (EDIT — display через formatUzPhone)
  - `apps/web-seller/src/components/PhoneInput.tsx` (NEW — дубль buyer-копии)
  - `apps/web-seller/src/app/(auth)/login/page.tsx` (EDIT — заменён prefix `+998` + raw input на единый PhoneInput)
- **Что сделано:**
  - Компонент `<PhoneInput>` с маской `+998 XX XXX XX XX`. Внутри format/strip/validate. value+onChange работают в E.164 (`+998XXXXXXXXX`) — backend получает напрямую, без `+998${phone}` склейки.
  - Disabled-state кнопок на `isValidUzPhone(phone)` вместо `.trim().length<9` (строгая проверка: 12 цифр).
  - Display телефона на code-шаге и в /profile — через `formatUzPhone()`.
  - aria-label="Телефон" + autoComplete="tel" + inputMode="tel" встроены.
- **Что НЕ сделано:**
  - **packages/ui подключение** — `@savdo/ui` сейчас не в dependencies web-* (только tokens/colors.ts существует, но не используется). Подключение требует `pnpm install` локально (Азим не разрешает). Пока — две идентичные копии в web-buyer и web-seller, sync вручную, с явным SYNC-комментарием в обоих файлах.
  - **TMA** — Полат уже сделал `apps/tma/src/lib/phone.ts` (Wave 7, TMA-PHONE-MASK-001). Не дублируем.
  - **Admin** — зона Полата.
- **Verification:** `npx tsc --noEmit` чист на обоих апсах. Дев-сервер не запускал (memory feedback: не запускать монорепо локально).

## 2026-05-13 (Азим) — WEB-SELLER-PRODUCT-PARITY-001 (3 фазы)

Полат сильно развил TMA AddProduct/EditProduct (multi-photo, dynamic filters, variants matrix, attributes, per-variant stock). Web-seller отставал. Цель — **функциональный паритет** (дизайн остаётся Liquid Authority).

### ✅ [WEB-SELLER-PRODUCT-PARITY-001] Multi-photo + attributes + filters + variants matrix + stock editor
- **Важность:** 🟠 P1
- **Дата:** 13.05.2026 (3 фазы за день)
- **Ветка:** `web-seller` (8 коммитов `d51b552..bddc515`)
- **Файлы:**
  - `apps/web-seller/src/components/multi-image-uploader.tsx` (NEW)
  - `apps/web-seller/src/components/product-attributes-section.tsx` (NEW)
  - `apps/web-seller/src/components/category-filters-section.tsx` (NEW)
  - `apps/web-seller/src/components/variants-matrix-builder.tsx` (NEW)
  - `apps/web-seller/src/components/product-variants-section.tsx` (EDIT — inline stock editor)
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` (EDIT — multi-photo + attrs + filters + matrix)
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` (EDIT — multi-photo + attrs sync)
  - `apps/web-seller/src/lib/api/products.api.ts` (EDIT — image + attribute helpers)
  - `apps/web-seller/src/lib/api/storefront.api.ts` (NEW — getCategoryFilters)
  - `apps/web-seller/src/hooks/use-category-filters.ts` (NEW)
- **Phase 1 (multi-photo + attributes):**
  - MultiImageUploader ≤8 фото, drag-reorder, primary marker, native file picker (без cropper'а — это touch-фича TMA)
  - ProductAttributesSection free-form key/value pairs с +/− строк
  - Create: parallel POST на /images (isPrimary для первого) + /attributes (только non-empty)
  - Edit: diff prev/next → POST на added, DELETE на removed
- **Phase 2 (filters + matrix):**
  - useCategoryFilters → GET /storefront/categories/:slug/filters (cached 10min)
  - CategoryFiltersSection — text/number/select/boolean/color → сохраняются как ProductAttribute
  - VariantsMatrixBuilder — multi_select chips → cartesian product матрица с per-cell stock + priceOverride
  - Create flow: после product → POST option-groups → POST option-values → POST variants matrix
- **Phase 3 (stock editor):**
  - InlineStockEditor в каждом variant row: compact input + ✓ кнопка
  - useAdjustStock(delta = new - current, reason='manual')
- **Что НЕ сделано:**
  - PATCH images endpoint отсутствует у backend → reorder в edit-режиме не сохраняется (Create поддерживает) — отдельная задача `API-PRODUCT-IMAGES-PATCH-001` для Полата
  - Store-категории CRUD (`WEB-SELLER-STORE-CATEGORIES-CRUD-001`) — отдельная задача
  - VariantsMatrixBuilder в edit-режиме (после первого create варианты редактируются через старый ProductOptionGroupsSection / ProductVariantsSection)

### Spec + Plan
- `docs/superpowers/specs/2026-05-13-web-seller-product-feature-parity-design.md` (`3dfdc8c`)
- `docs/superpowers/plans/2026-05-13-web-seller-product-feature-parity.md` (`692b835`)

### Контракт-задачи для Полата (P3)
- `API-PRODUCT-IMAGES-PATCH-001` — `PATCH /seller/products/:id/images/:imageId` для reorder/primary toggle без delete-recreate
- `WEB-SELLER-STORE-CATEGORIES-CRUD-001` — UI для управления store-категориями (CRUD страница), сейчас seller может выбрать существующую, но не управлять списком

---

## 2026-05-13 (Азим) — WEB-BUYER-CATALOG-001 + WEB-SELLER-ONBOARDING-INTERCEPT-001

Реакция на жалобы Полата (скрины 12.05 / 13.05). Адресует:
- buyer не может найти магазины / товары без прямой ссылки → нужен каталог
- buyer попадая в seller-кабинет молча кидается в `/onboarding` (форма создания магазина) без объяснения, рядом 401-spam от seller-хуков
- создание товара зашито в seller-онбординг — добавляет friction и плодит огрызочные продукты

### ✅ [WEB-BUYER-CATALOG-001] /stores + /products каталог
- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Ветка:** `web-buyer` (commits `6670451` → `ada8369`)
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/stores/page.tsx` (NEW)
  - `apps/web-buyer/src/app/(shop)/products/page.tsx` (NEW)
  - `apps/web-buyer/src/components/catalog/` — LoadMoreButton, EmptyState, StoresGrid, StoresFilters, ProductsGrid, ProductsFilters (6 NEW)
  - `apps/web-buyer/src/hooks/use-storefront.ts` — `useStoresCatalog` + `useProductsCatalog` (infinite)
  - `apps/web-buyer/src/lib/api/storefront.api.ts` — `getStoresCatalog` + `getProductsCatalog`
  - `apps/web-buyer/src/lib/analytics.ts` — `stores_catalog_viewed` + `products_catalog_viewed`
  - `apps/web-buyer/src/components/layout/Header.tsx` — desktop nav `Магазины` / `Товары`
  - `apps/web-buyer/src/components/home/HomeTopStores.tsx` — «Все магазины →» link
  - `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx` — «Все товары →» link
- **Что сделано:**
  - `/stores` — каталог всех опубликованных магазинов, client-side фильтры (город из ответа, verified-toggle, sort top/new/rating), URL state, плюрализация
  - `/products` — каталог товаров с infinite scroll (24/page), category chips через `useGlobalCategoriesTree`, sort new/price_asc/price_desc, URL state
  - Reuse `StoreCard` / `ProductCard` без изменений; общий `LoadMoreButton` и `EmptyState`
  - Homepage: «Все →» ссылки рядом с h2 в Top stores / Featured feed; в Featured сохраняется `?cat=` при переходе
  - Header (desktop): новые `Магазины` / `Товары` ссылки перед глобальным search. Mobile BottomNav без изменений
  - Все Suspense-boundary для Next 16 `useSearchParams`
  - Backend готов — без правок API

### ✅ [WEB-SELLER-ONBOARDING-INTERCEPT-001] /become-seller intercept + -1 шаг + 401-spam fix
- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Ветка:** `web-seller` (commits `02ad31e` → `91c4b7b`)
- **Файлы:**
  - `apps/web-seller/src/app/(onboarding)/become-seller/page.tsx` (NEW)
  - `apps/web-seller/src/app/(auth)/login/page.tsx` — redirect target
  - `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx` — удалён Step3 (товар), STEPS 4→3
  - `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx` — empty-state «Добавьте товар»
  - `apps/web-seller/src/hooks/use-seller.ts` `use-chat.ts` `use-orders.ts` `use-products.ts` `use-notifications.ts` `use-analytics.ts` — auth guards
  - `apps/web-seller/src/lib/analytics.ts` — `become_seller_intercept_*` events
- **Что сделано:**
  - **/become-seller** — friendly explainer для BUYER: «У вас ещё нет магазина», 3 CTA (Открыть магазин / Перейти к покупкам → savdo.uz / Выйти из аккаунта). Self-guard: SELLER со store → /dashboard; не залогинен → /login
  - **Login redirect**: `verifyOtp.onSuccess` и `useEffect` теперь шлют не-SELLER на `/become-seller` вместо `/onboarding`
  - **Onboarding**: удалён Step3 (~90 LOC) — создание товара выпилено. STEPS теперь `[Магазин, Контакты, Готово]`. Step4 (submit) рендерится на step===2
  - **Dashboard empty-state**: блок с CTA «+Добавить товар» (→`/products/create`) пока `products.length === 0`. Текст адаптируется к store status (PENDING_REVIEW vs APPROVED)
  - **401-spam fix**: все `useQuery` в seller-хуках получили `enabled: !!user && user.role === 'SELLER'`. Покрыто: `useSellerProfile`, `useStore`, `useStoreCategories`, `useThreads`, `useMessages`, `useSellerOrders`, `useSellerOrder`, `useSellerProducts`, `useSellerProduct`, `useProductVariants`, `useNotifications`, `useUnreadCount`, `useNotifPreferences`, `useSellerSummary`, `useSellerAnalytics`. Buyer на /become-seller и /onboarding больше не видит 401 в консоли

### Spec + Plan (commits на ветке web-buyer)
- `docs/superpowers/specs/2026-05-13-buyer-catalog-and-seller-onboarding-design.md` — `15d1113`
- `docs/superpowers/plans/2026-05-13-buyer-catalog-and-seller-onboarding.md` — `3bd31a7`

### Контракт-задача для Полата (P3, после launch)
- `API-STORES-PAGINATION-001` — `/storefront/stores` сейчас `take: 50` в `findAllPublished` (stores.repository.ts:59). На 37 stores OK; при росте до 500+ нужна server-side pagination (`page`/`limit`). Frontend `/stores` уже готов потреблять paginated ответ.

---

## 2026-05-13 (Полат) — Wave 12: MARKETING-LOCALIZATION-UZ-001 продолжение (TMA buyer pages)

Продолжение Wave 11. Мигрировал основные buyer-страницы на `t()`,
расширил словари (~75 новых ключей), добавил плюрализацию для русского.

- **CartPage:** заголовок, пустая корзина, кнопки контакта продавца, MainButton
  («Оформить — {total} {currency}»), aria-label на qty-кнопках,
  localized `toLocaleString` (uz / ru), валюта через `t('common.currency')`.
- **CheckoutPage:** все строки → `t()`, success screen, error states,
  auth-warning, placeholder'ы инпутов, CTA с динамическим amount.
- **OrdersPage:** заголовок + плюрализация `pluralOrders(N)` (1 заказ / 2 заказа / 5 заказов),
  фильтры статусов (Все/Ожидают/Подтвержд./В пути/Доставлены/Отменены),
  empty/error/auth states, review-модалка («Оцените товар»), Stars +
  comment placeholder + Опубликовать. Узбекский всегда `{N} buyurtma`
  (без плюрализации — у узбекского нет грамматики числа).
- **WishlistPage:** заголовок + плюрализация товаров, badge "Недоступен",
  empty states, цены через `fmt + common.currency`.
- **ProductPage:** заголовок не найден, MainButton (Выберите вариант / Нет в наличии
  / В корзину — N сум), stock badges, описание/характеристики/магазин labels,
  CTA «Задать вопрос продавцу», chat prefill через локализованный template.

**Технические решения:**
- Простая плюрализация без `Intl.PluralRules` — runtime function в каждой
  странице (`pluralOrders`/`pluralWishlist`) использует общие ключи
  `.wordOne/.wordFew/.wordMany`. Для uz все три формы одинаковые.
- `toLocaleString(locale === 'uz' ? 'uz' : 'ru')` для чисел — узбекская
  локаль тоже использует пробел как тысячный разделитель.
- `useEffect` deps с `locale` для MainButton — пересоздаём label при смене.
- Все нормальные апострофы `o'` / `g'` в uz.ts проверены через grep, ровно 0.

**Файлы:**
- `apps/tma/src/lib/i18n/{ru,uz}.ts` (+75 ключей, общая валюта `common.currency`)
- `apps/tma/src/pages/buyer/{CartPage,CheckoutPage,OrdersPage,WishlistPage,ProductPage}.tsx`

**Tests:** `tsc --noEmit` clean.

**Осталось:** Profile, ChatPage (buyer), все seller pages, admin, API уведомления.

## 2026-05-12 (Полат) — Wave 11: MARKETING-LOCALIZATION-UZ-001 (i18n infra + uzbek translator skill)

Большая задача — research + reverse + skill + реализация инфры + TMA SettingsPage и StoresPage. Цель: 60% UZ-аудитория, предпочитающая узбекский, получает родной язык.

### ✅ [MARKETING-LOCALIZATION-UZ-001] (partial) i18n инфра + skill + TMA migrate 🔴

**Research / reverse-engineering Uzum, OLX UZ:**
- Узбекистан официально перешёл на латиницу с 01.01.2023 (СМИ, маркетплейсы)
- Стандарт e-commerce: товар на узбекском (Latin) + русский (Cyrillic). Кириллицу uz НЕ поддерживаем.
- Ключевой символ — **обратный апостроф** `ʻ` (U+02BB), а не обычный `'`. GT почти всегда ставит обычный.

**Skill записан для будущих сессий:**
- `.claude/skills/uzbek-translator/SKILL.md` (~290 строк)
- Активируется триггерами: "переведи на узбекский", "i18n uz", "локализация Узбекистан"
- Алфавит, особые символы, типография апострофов, грамматика (агглютинация, падежи `-ga/-ni/-da/-dan`, императив `-ing`, притяжательные `-im/-ingiz`), множ. число `-lar`
- E-commerce глоссарий: 60+ терминов (savat, savatga qoʻshish, buyurtma, yetkazib berish, toʻlov, manzil, doʻkon, sotuvchi, xaridor, mahsulot, chegirma, soʻm, ...)
- Чек-лист перед коммитом + типичные ошибки Google Translate

**TMA i18n инфра — zero-deps React Context:**
- `apps/tma/src/lib/i18n/types.ts` — `Locale = 'ru' | 'uz'`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`
- `apps/tma/src/lib/i18n/ru.ts` (100+ ключей, default) и `uz.ts` (зеркало, проверено grep'ом на `o'`/`g'`)
- `apps/tma/src/lib/i18n/I18nProvider.tsx` — Context + `useTranslation()` hook
  - Auto-detect: `localStorage['savdo_locale']` → `tg.initDataUnsafe.user.language_code` → default (ru)
  - `setLocale()` сохраняет в localStorage + обновляет `<html lang>` для a11y
  - `t(key, vars)` поддерживает `{name}` интерполяцию + fallback на `ru` если ключ отсутствует в активной локали
- `main.tsx`: `<I18nProvider>` обёрнут между `<TelegramProvider>` и `<ThemeProvider>` (нужен tgUser для language detection)

**SettingsPage переведён + добавлен переключатель языка:**
- Карточка «Язык / Til» с двумя кнопками `Русский` / `Oʻzbek`, haptic feedback при выборе
- Все остальные строки на странице через `t()` — заголовок, аккаунт, тема, "Стать продавцом" CTA, "Telegram-бот", "Мои заказы", "Каталог", "Выйти"

**StoresPage переведён (главная страница buyer):**
- Приветствие `Salom, {name}!` через `t('auth.welcomeName', { name })`
- Табы Магазины/Товары (`nav.stores` / `nav.products`)
- Плейсхолдер поиска (контекстный — stores или products)
- Sort labels (Новые / ↑ Цена / ↓ Цена)
- Verified badge title + aria-label
- Empty states + error states + retry

**Файлы:**
- `apps/tma/src/main.tsx` (Provider wiring)
- `apps/tma/src/lib/i18n/{types,ru,uz,I18nProvider,index}.ts` (new)
- `apps/tma/src/pages/buyer/SettingsPage.tsx`
- `apps/tma/src/pages/buyer/StoresPage.tsx`
- `.claude/skills/uzbek-translator/SKILL.md` (new — но `.claude/` в .gitignore, локальный)
- `analiz/tasks.md`, `analiz/done.md`

**Tests:** TypeScript `tsc --noEmit` чист. Runtime смок не делал (нужен Telegram WebApp env), переключатель собран минимально (Context value + map lookup).

**Осталось (не блокер для запуска инфры):**
- Мигрировать остальные TMA страницы (CartPage, CheckoutPage, OrdersPage, ProductPage, ProfilePage, WishlistPage, ChatPage)
- Admin локализацию (Азим/Полат)
- API Accept-Language header в `seller-notification.service` (узбекские тексты для seller TG-уведомлений)
- Web-buyer / web-seller (зона Азима)

**Важность:** 🔴 P0 — без инфры не запустить ни одну страницу на uz. Полный перевод дальше партиями.

## 2026-05-12 (Полат) — Wave 10: MARKETING-CART-ABANDONMENT-001 + cleanup

Закрыто 4 задачи в одном проходе.

### ✅ [MARKETING-CART-ABANDONMENT-001] Cron + TG nudge для брошенных корзин 🟠

`CartAbandonmentService` (`apps/api/src/modules/cart/services/`) с `@Cron(EVERY_HOUR)`:
сканирует ACTIVE корзины с `updatedAt < now - 4h`, items > 0, buyer.telegramId
заданным (не ghost `tg_*`), nudgeCount < 1 (cap = 1 nudge per cart).

- **Idempotency:** помечаем `nudgeSentAt + increment(nudgeCount)` в БД через
  `updateMany WHERE nudgeCount < MAX` ДО `queue.add` → race-safe между
  инстансами, retry job'а не дублирует nudge (jobId = `cart-abandoned:{id}:{n}`).
- **Schema:** `Cart.nudgeSentAt: DateTime?`, `Cart.nudgeCount: Int @default(0)`,
  композитный индекс `[status, nudgeSentAt, updatedAt]`. Migration
  `20260512180000_cart_abandonment_tracking` (ADD nullable + DEFAULT — safe для прода).
- **Job:** `TELEGRAM_JOB_CART_ABANDONED` в `TelegramNotificationProcessor`,
  шлёт HTML-сообщение с inline-кнопкой «🛍 Открыть корзину» → deep-link
  `https://t.me/{BOT}?startapp=cart_{storeSlug}`.
- **Env flag:** `CART_ABANDONMENT_ENABLED=false` отключает scan'ер.
- **Файлы:** `packages/db/prisma/schema.prisma` (Cart),
  `packages/db/prisma/migrations/20260512180000_cart_abandonment_tracking/`,
  `apps/api/src/queues/telegram-notification.processor.ts` (+job constant + case),
  `apps/api/src/modules/cart/services/cart-abandonment.service.ts` (new),
  `apps/api/src/modules/cart/cart.module.ts` (+BullModule register, +service).
- **Tests:** все 57 cart-тестов passed (новые тесты не писал — поведение
  изолировано в самом service, не пересекается с use-cases).

### ✅ [ADMIN-PAGINATION-DISABLED-001] Унифицированная pagination в admin 🟠

`disabled={page === 1}` уже был на всех 8 admin pagination. Унифицировал:
OrdersPage / StoresPage / SellersPage переведены с inline `<Button>← Назад</Button>`
на reusable `<PaginationBar>` (тот что в Users/Database/AuditLogs/AnalyticsEvents).
Преимущества: `aria-label`, lucide chevron icons, единый стиль opacity/cursor,
`fontVariantNumeric: 'tabular-nums'` для счётчика.

### ✅ [TMA-CART-API-SYNC-001] Wave 8 — frontend mark

Уже сделан в Wave 8 (см. ниже). В tasks.md `- [ ]` был не отмечен — поправлено.

### ✅ [API-STOREFRONT-SEARCH-PERF-001] pg_trgm GIN индексы

Verified: миграция `20260512170000_search_pg_trgm_indexes` (параллельная сессия)
создаёт `pg_trgm` extension + 5 GIN индексов на products.title/description +
stores.name/description/slug. Партиальные индексы `WHERE NOT NULL` экономят
размер. ILIKE из `searchPublic` теперь использует индекс — ~100-1000× быстрее
на 100k+ products.

### ✅ [MARKETING-HOMEPAGE-DISCOVERY-001] Backend — featured endpoint

Verified: `GET /storefront/featured` уже реализован параллельной сессией.
`GetFeaturedStorefrontUseCase` возвращает `{topStores: 8, featuredProducts: 12}`
с trust signals (isVerified/avgRating/reviewCount, isSale/discountPercent).
Throttle 60/min, public, INV-S03 (store должен иметь ACTIVE product). Spec покрыт.
**Frontend разблокирован для Азима** — может реализовывать homepage.

## 2026-05-12 (Полат) — Wave 9: MARKETING-VERIFIED-SELLER-001 (UI + admin toggle)

Backend поля (`Store.isVerified` / `avgRating` / `reviewCount`) и индекс
`[isVerified, avgRating desc]` параллельная сессия добавила раньше.
Сегодня дотянул фронт + admin toggle + storefront-сортировку.

### ✅ [MARKETING-VERIFIED-SELLER-001] Trust-signal: verified badge + rating 🟠
- **Backend (уже было / закрепил):**
  - `POST /admin/stores/:id/verify` + `/unverify` — `SetStoreVerificationUseCase`
    с INV-A02 (reason required для unverify), INV-A01 (audit_log
    `STORE_VERIFIED` / `STORE_UNVERIFIED` с previousIsVerified), идемпотентность.
    +5 spec тестов.
  - `stores.repository.findAllPublished()` + `searchPublic()` теперь делают
    `select` с `isVerified/avgRating/reviewCount` и `orderBy: [{ isVerified:
    'desc' }, { publishedAt: 'desc' }]` — verified магазины вверху списка.
  - `reviews.repository.refreshStoreAggregate()` — weighted average по
    `Product.avgRating × reviewCount`, дешевле чем по сырым review'ам.
- **TMA:**
  - `apps/tma/src/pages/buyer/StoresPage.tsx` — карточка магазина: ✓ badge
    (cyan 4×4 круг) рядом с именем + строка `⭐ N.N (M)` под названием.
  - `apps/tma/src/pages/buyer/StorePage.tsx` — шапка детальной страницы:
    ✓ badge + рейтинг в той же строке что и «Перейти на сайт».
  - Поля сделаны `optional` в интерфейсе — backward-compat если кто-то
    закэшировал старую версию ответа.
- **Admin:**
  - `apps/admin/src/pages/StoresPage.tsx` — в таблице рядом с именем магазина
    `<BadgeCheck />` (`lucide-react`) + `⭐ N.N (M)`. В actions колонке —
    отдельная кнопка `Verify/Verified` рядом с «Одобрить». Unverify требует
    `window.prompt('Причина')` (INV-A02 на клиенте, валидация на сервере).
  - Старая кнопка «Верифицировать» переименована в «Одобрить» — она крутит
    `status`, а не `isVerified`, путало.
- **Файлы:** `apps/api/src/modules/admin/use-cases/set-store-verification.use-case.ts`,
  `apps/api/src/modules/admin/admin-stores.controller.ts`,
  `apps/api/src/modules/stores/repositories/stores.repository.ts`,
  `apps/api/src/modules/reviews/repositories/reviews.repository.ts`,
  `apps/tma/src/pages/buyer/StoresPage.tsx`,
  `apps/tma/src/pages/buyer/StorePage.tsx`,
  `apps/admin/src/pages/StoresPage.tsx`.
- **Важность:** 🟠 P1 (marketing trust-signal — buyers увидят proof of
  legitimacy без отзывов; storefront-сортировка дает verified-sellers лучшую
  видимость).

## 2026-05-12 (Полат) — Wave 8: TMA-CART-API-SYNC-001 (cross-channel cart persistence)

После login TMA-buyer'а его localStorage-корзина теперь одноразово
синхронизируется в backend через POST /cart/bulk-merge. Раньше TMA cart жил
только в localStorage → переключение на web-buyer показывало пустую корзину.

### ✅ [TMA-CART-API-SYNC-001] Bulk-merge корзины TMA → backend 🟠
- **Backend:** новый endpoint `POST /api/v1/cart/bulk-merge` + use-case
  `BulkMergeCartUseCase` (apps/api/src/modules/cart/use-cases/).
  - JWT auth + `@Throttle 5/min` (защита от flood).
  - DTO: `@ArrayMinSize(1)`, `@ArrayMaxSize(50)`, `@Max(100)` quantity.
  - Шаги: batch fetch (findManyByIds — no N+1), валидация product+variant
    (skip невалидных), INV-C01 (все items — один store), reuse buyer cart или
    `clearCart + setStoreId` (TMA wins), дедуп по productId+variantId, qty
    суммируется max 100.
  - Возврат: `{ cart, imported, skipped }`.
  - 12 spec тестов: empty/INV-C01/variant cross-product/dedup/etc.
- **Frontend (TMA):**
  - `apps/tma/src/lib/cartSync.ts` — `syncCartToBackend()`, idempotent через
    `localStorage['savdo_cart_synced']`, тихий fallback (retry на следующем
    login если backend упал). Также `resetCartSync()` для logout и
    `fullCartReset()` для INV-C01 violation.
  - `AuthProvider.tsx` — хук `syncCartToBackend()` в `doAuth` после BUYER
    auth (рядом с `hydrateWishlist`), `resetCartSync()` в `logout`.
- **Behaviour:** sync максимум один раз per device (до logout/reset). После
  sync localStorage НЕ очищается (UI cache для быстрого rendering).
  Web-buyer теперь видит те же items через /cart API.
- **Файлы:** `apps/api/src/modules/cart/dto/bulk-merge-cart.dto.ts`,
  `apps/api/src/modules/cart/use-cases/bulk-merge-cart.use-case.ts`,
  `apps/api/src/modules/cart/cart.controller.ts`,
  `apps/api/src/modules/cart/cart.module.ts`,
  `apps/tma/src/lib/cartSync.ts`,
  `apps/tma/src/providers/AuthProvider.tsx`.

---

## 2026-05-12 (Полат) — Wave 5: TG-канал шаблон + критический фикс sendPhoto (FEAT-TG-CHANNEL)

Полат заметил по скринам конкурентов (ArloeStore_UZ, Eleganza, Montanno) что
наш бот при автопостинге отправляет фото товара как файл с превью, а не как
открытое изображение. Конверсия страдает. Сразу же — план настраиваемого
шаблона поста + контактные данные продавца в TMA.

### ✅ [API-TG-CHANNEL-PHOTO-FIX-001] Фикс sendPhotoToChannel 🔴 CRITICAL
- **Root cause:** `telegram-bot.service.ts:283` метод `sendPhotoToChannel`
  вызывал Telegram API `/sendDocument` вместо `/sendPhoto`. Все 1-фото посты
  уходили как файл с превью.
- TG API ограничение: document file_id (из `TelegramStorageService.uploadFile`
  через sendDocument) **нельзя** передать в sendPhoto.
- **Fix:** правильный `/sendPhoto`, новое поле `MediaFile.photoFileId String?`,
  lazy backfill — при первой публикации в канал шлём через URL (Telegram сам
  скачивает + конвертит в photo), сохраняем возвращённый `photoFileId` в БД
  для следующих публикаций.
- Возврат сигнатур: `sendPhotoToChannel` теперь возвращает `string | null`
  (photo file_id), `sendMediaGroupToChannel` — `string[] | null`.
- **Миграция:** `20260512150000_media_photo_file_id` — additive nullable.
  Существующие данные не теряются.

### ✅ [API-TG-CHANNEL-DEDUP-001] Удалена дублирующая логика автопостинга 🔴
- В `change-product-status.use-case.ts` была своя legacy `postToChannel`
  с фильтром `objectKey.startsWith('tg:')`. В проде `objectKey` хранит
  чистый file_id без префикса → **фото вообще не отправлялись при автопостинге**.
- Заменил на делегирование в единый `PostProductToChannelUseCase`. Один путь
  публикации — auto и manual.

### ✅ [FEAT-TG-CHANNEL-TEMPLATE-001] Настраиваемый шаблон + контакты 🟠
- 4 новых nullable поля в Store: `channelPostTemplate`, `channelContactPhone`,
  `channelInstagramLink`, `channelTiktokLink`.
- **Миграция:** `20260512150100_store_channel_template_and_contacts` — additive.
- Новый `ChannelTemplateService` — Mustache-style rendering с whitelist 15
  переменных, секциями `{{#var}}…{{/var}}`, **HTML sanitize** (теги не из
  TG-whitelist escape'ятся), **safe truncate** на 1024 char (не режет
  HTML-теги пополам, закрывает открытые), `findUnsupportedTags()` для UI warning.
- Дефолтный шаблон по образцу UZ-конкурентов: заголовок, цена, материал,
  размеры, наличие, контакт, IG, TikTok, ссылка на товар.
- Новый `ChannelMediaResolverService` — единая точка резолва фото
  (photoFileId → URL fallback → null если telegram-expired) с Promise.all.

### ✅ [API-CHANNEL-ENDPOINTS-001] 4 endpoint'а для TMA UI 🟠
- `GET    /api/v1/seller/store/channel-template`
- `PATCH  /api/v1/seller/store/channel-template`
- `POST   /api/v1/seller/store/channel-template/preview`
- `POST   /api/v1/seller/store/channel-test-post`

### 🏗️ Архитектура
- **forwardRef(StoresModule ↔ ProductsModule)** — без shared-модуля
- **Single source of truth** — все 3 пути публикации делегируют единому use-case
- **Lazy backfill photoFileId** — не делаем массовую миграцию старых фото

### 📊 Тесты + typecheck
- `npx tsc --noEmit` чист
- `npx jest`: **51 suites / 686 tests passed** (+1 suite, +15 тестов на
  `channel-template.service.spec.ts` включая CRITICAL покрытие sanitize/truncate)

### ✅ [TMA-CHANNEL-SETTINGS-PAGE-001] TMA UI — настройка канала 🟠
- Новый файл: `apps/tma/src/pages/seller/ChannelSettingsPage.tsx` (route `/seller/settings/channel`)
- Секции страницы:
  - **Привязка канала** — ✅ привязан / инструкция через @savdo_builderBOT
  - **Авто-постинг** — toggle с защитой (disabled если канал не привязан)
  - **Контакты в посте** — phone / Instagram / TikTok inputs
  - **Шаблон поста** — textarea (resize=vertical, font-mono) + 13 insert-variable
    чипов, ставят `{{var}}` в позицию курсора. Для секций `{{#var}}` ставится
    парный шаблон `{{#var}}…{{/var}}`. Кнопка «Сбросить» к `defaultTemplate`.
  - **Превью** — live render через `POST /channel-template/preview` с debounce
    400ms + AbortController. Caption отрендеренный сервером.
  - **Тестовая публикация** — кнопка с защитой (disabled пока есть dirty changes
    или нет канала). Отправляет последний ACTIVE-товар.
- `tg.MainButton('Сохранить')` показывается при dirty, fallback in-form button
  для dev без TG.
- HapticFeedback: success при сохранении, warning при unposted test, error при API fail.
- Зарегистрирован в `apps/tma/src/App.tsx` lazy-загрузкой + ссылка из основного
  `SettingsPage.tsx` («📢 Telegram канал → Шаблон поста и авто-публикация»).

### 📊 Финальная верификация
- `apps/api` `tsc --noEmit` чист
- `apps/tma` `tsc --noEmit` чист
- `apps/api` `jest`: **51 suites / 686 tests passed**

---

## 2026-05-12 (Полат) — Wave 6: Verified seller — trust signals на storefront

### ✅ [MARKETING-VERIFIED-SELLER-001] Store.isVerified / avgRating / reviewCount 🟠
- **Миграция** `20260512160000_store_verification_and_rating` — additive:
  - `isVerified BOOLEAN NOT NULL DEFAULT false`
  - `avgRating DECIMAL(3,2) NULL`
  - `reviewCount INTEGER NOT NULL DEFAULT 0`
  - Composite index `(isVerified, avgRating DESC)` для storefront sort
  - **Backfill** через SQL: weighted average по существующим Product reviews
    (`SUM(p.avgRating × p.reviewCount) / SUM(p.reviewCount)`) — данные не теряются.
- `ReviewsRepository.refreshStoreAggregate(storeId)` — пересчёт после insert/delete
  review, основан на product-aggregates (быстрее чем по сырым review'ам).
- `CreateReviewUseCase` теперь каскадно: `refreshProductAggregate` →
  `refreshStoreAggregate(product.storeId)`.

### ✅ [API-ADMIN-STORE-VERIFY-001] Admin endpoint для верификации
- `POST /api/v1/admin/stores/:id/verify` — ставит галочку
- `POST /api/v1/admin/stores/:id/unverify` — снимает (требует `reason`)
- Use-case `SetStoreVerificationUseCase`:
  - Идемпотентен (повторный verify не пишет audit log)
  - INV-A02: reason обязателен при unverify
  - INV-A01: audit log `STORE_VERIFIED` / `STORE_UNVERIFIED`
- Permission `store:moderate` (через `@AdminPermission`)
- Spec +6 cases

### ✅ [API-STOREFRONT-VERIFIED-EXPOSE-001] Trust signals в API ответах
- `StoresRepository.findAllPublished` + `searchPublic` — добавлены поля,
  изменён `orderBy` → verified DESC сначала, потом publishedAt
- `GetFeaturedStorefrontUseCase.topStores` — отдаёт `isVerified`, `avgRating`,
  `reviewCount`; сортировка `[verified DESC, avgRating DESC NULLS LAST, publishedAt DESC]`
- `findBySlug` использует `include` — новые поля автоматически попадают
  в `/storefront/stores/:slug` response.

### 📊 Финальная верификация Wave 6
- `apps/api` `tsc --noEmit` чист
- `apps/api` `jest`: **53 suites / 699 tests passed** (+1 suite, +6 tests
  на `set-store-verification`; +1 на trust signals в featured)
- Data safety: миграция additive, backfill weighted-avg из существующих
  отзывов через UPDATE … FROM, не теряет данных.

### ⚠️ Что осталось (admin frontend — apps/admin, моя зона)
- `ADMIN-STORE-VERIFY-BUTTON-001` — кнопка «✓ Verified» в `/stores/:id` detail
  page admin SPA. Хорошее дополнение на следующий заход.

### ⚠️ Что осталось (web-buyer/seller frontend — зона Азима)
- `WEB-VERIFIED-BADGE-001` — рендерить галочку рядом с названием магазина
  на storefront card / detail page (web-buyer). API уже отдаёт.

---

## 2026-05-12 (Полат) — Wave 7: tech debt — pagination + PII + search perf (3 задачи)

После Wave 4 параллельная сессия закрыла Wave 5 (TG-канал шаблон) и Wave 6
(verified seller). Я взял backend tech debt:

### ✅ [API-N1-PRODUCTS-LIST-001] Pagination в store-specific feed 🟢
- Новый `findPublicByStoreIdPaginated(storeId, {page, limit, ...filters})`:
  offset pagination + `{products, total}` envelope через `$transaction`.
- Default `limit=20`, max 100. Раньше `findPublicByStoreId` брал `take=200`
  без offset → store с 200+ products = медленный TTFB + N+1 includes.
- Controller `/storefront/products?storeId=` теперь читает `page`/`limit`
  query params и возвращает `{data, meta: {total, page, limit, totalPages}}`.
- **Commit:** `1601160`

### ✅ [API-PII-MASKING-001] Phone masking в логах (SEC-011) 🟢
- `apps/api/src/shared/pii.ts`: `maskPhone('+998901234567')` → `'+998 *** ** 67'`
- TG ghost users: `maskPhone('tg_123456789')` → `'tg_***89'`
- null/empty → `'[empty]'`, < 6 digits → `'[invalid]'`, foreign E.164 fallback
- Applied в 13 log statements: otp.service, otp.processor (3), admin-auth
  (IMPERSONATION), telegram-auth, ghost-cleanup (2), telegram-demo (2).
- Spec +7 cases. **Commit:** `d7f8853`

### ✅ [API-STOREFRONT-SEARCH-PERF-001] pg_trgm GIN indexes 🟢
- Migration `20260512170000_search_pg_trgm_indexes`:
  - `CREATE EXTENSION pg_trgm`
  - GIN trigram indexes на `products.title/description`, `stores.name/description/slug`
  - Partial indexes на nullable columns (`WHERE description IS NOT NULL`)
- Ускоряет `ILIKE %q%` в 100-1000× на 100k+ products (vs seqscan).
- Repository код не меняется — Postgres query planner сам подхватывает.
- **Commit:** `c473c75`

**Wave 7 итог:** 50 suites, 683 tests, 3 commits, 1 миграция, typecheck clean.

---

## 2026-05-12 (Полат) — Wave 4: launch блокеры + prod issues (4 задачи)

После Wave 3 параллельная сессия Азима закрыла 6 marketing задач (SEO,
public offer pages, reviews UI, fake response-time, pinned product strip,
hardcoded domain, settings select). Я подхватил оставшиеся.

### ✅ [MARKETING-HOMEPAGE-DISCOVERY-001] GET /storefront/featured 🔴
- Endpoint разблокирует web-buyer landing (раньше форма ввода slug → 100% bounce).
- `GetFeaturedStorefrontUseCase`: topStores (max 8) + featuredProducts (max 12).
- Sort stores: `publishedAt DESC`; products: `avgRating DESC NULLS LAST → createdAt DESC`.
- Filter: APPROVED + isPublic + has ACTIVE product; products + isVisible.
- Public endpoint, Throttle 60/min.
- Spec +7 cases. **Commit:** `5d3f961`

### ✅ [PROD-BULL-BOARD-STATIC-401] Cookie-based auth для Bull Board 🟡
- В production Bull Board зависал на «Loading»: middleware требовал token в
  `?query` или header. Browser `<link>`/`<script>` НЕ передают токен → 401
  на каждый CSS/JS/SVG.
- Fix: cookie `bull-board-token` HttpOnly + SameSite=Strict + Secure prod,
  TTL 30 мин. Первый GET с `?token=` ставит cookie. Browser потом шлёт автоматически.
- **Commit:** `3a55ec4`

### ✅ [TMA-SELLER-MAIN-BUTTON-001] MainButton CTA в seller forms 🟡
- AddProductPage: `tg.MainButton('Опубликовать товар')` → handleSave(true)
- EditProductPage: `tg.MainButton('Сохранить изменения')` → handleSave
- Disable пока !isValid / saving / photoUploading.
- SettingsPage пропущен — там auto-save (no single submit).
- **Commit:** `83c0b72`

### ✅ Production issues задокументированы в `analiz/logs.md`
- **PROD-ADMIN-MFA-DEPLOY**: MfaSetupPage показывает старый endpoint. Код
  в main правильный (commit `7b6a149`), `adminsb` Railway не подтянул main →
  force-redeploy needed.
- **PROD-BULL-BOARD-STATIC-401**: ↑ fixed.
- **ADMIN-ROLE-PERMISSION-CHECK**: «admin:read required» — by design (super_admin only).

**Wave 4 итог:** 50 suites, 676+ tests, 4 commits, typecheck clean (api + tma).

---

## 2026-05-12 (Полат) — Wave 3: P1 security/UX (5 задач)

### ✅ [API-IDEMPOTENCY-FAIL-OPEN-001] Fail-closed на Redis-down 🔴
- `acquireLock` возвращает discriminated union: `'acquired' | 'busy' | 'redis-down'`
- Interceptor → 503 SERVICE_UNAVAILABLE при Redis-down (fail-closed)
- Раньше fail-open → double orders при Redis-restart + retry
- Spec +1 case. **Commit:** `0829fb2`

### ✅ [API-BULL-BOARD-DATA-LEAK-001] OTP code больше не в job.data 🔴 (SEC-008)
- Ref-pattern: `codeRef = UUID` в job, реальный code в Redis `otp:job:{ref}` TTL 10мин
- `OtpProcessor` резолвит code → отправляет → удаляет ref
- Backward-compat fallback для legacy jobs (`data.code`)
- Spec +1 case verify нет `code` в job.data. **Commit:** `293efda`

### ✅ [API-RBAC-CART-CROSS-SESSION-001] UUID validation для x-session-token 🟡
- Server-side regex UUID v4 — 122 бита энтропии (не подбирается)
- Невалидный токен → 400 VALIDATION_ERROR
- После merge guest cart status=MERGED → findBySessionKey filters by ACTIVE
- **Commit:** `0bf1681`

### ✅ [TMA-PHONE-MASK-001] Маска `+998 XX XXX XX XX` 🟡
- `apps/tma/src/lib/phone.ts`: formatUzPhone / stripPhone / isValidUzPhone
- CheckoutPage onChange форматирует, backend получает E.164 через stripPhone
- Placeholder с примером `+998 90 123 45 67`
- **Commit:** `abfb7a7`

### ✅ [FEAT-TG-AUTOPOST-001] Восстановлены файлы + verified 🟡
- Use-case `post-product-to-channel.use-case.ts` (TG file_id resolution из MediaFile)
- Migration `20260510210000_store_auto_post_to_channel` с upgrade existing stores
- Settings field `autoPostProductsToChannel` в update-store DTO + use-case
- Manual repost endpoint `POST /seller/products/:id/repost-to-channel`
- Hook в change-product-status при ACTIVE → fire-and-forget
- 14 unit tests pass

**Wave 3 итог:** 49 suites, 669 tests, 5 commits, typecheck clean (api + tma).

---

## 2026-05-11 (Азим) — Wave 6 + 5 marketing/launch quick wins (6 задач)

После platform audit Полата (10.05.2026) подхватил весь web-side backlog (зона apps/web-*).
6 задач в одной сессии, web-buyer + web-seller typecheck clean.

### ✅ [WB-DESIGN-WAVE-6] Pinned product context strip в чате 🟠
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/chats/page.tsx`
- **Что сделано:** PRODUCT-thread теперь имеет fixed strip между header и messages — 40px thumb + название + цена + «Открыть →». Линк ведёт на `/{storeSlug}/products/{productId}`. Использует `productId/Title/ImageUrl/Price` из ChatThread (закрыто Полатом 10.05 как `API-CHAT-THREAD-PRODUCT-PREVIEW-001`). Цвет фона — `color-mix(brand 6%, transparent)` per Soft Color Lifestyle spec. Fallback на `<Package/>` иконку если нет thumb. Last P1 из buyer audit 09.05 (closes P1-003).

### ✅ [WEB-SELLER-HARDCODED-DOMAIN-001] Все savdo.uz → env helper 🟠
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-seller/src/lib/buyer-url.ts` (+2 helpers), `dashboard/page.tsx`, `products/page.tsx`, `(onboarding)/onboarding/page.tsx` (×2), `(dashboard)/layout.tsx` placeholder
- **Что сделано:** добавлены `buyerHostDisplay()` и `buyerProductUrl(slug, productId)` в helper. Все 5 live мест (dashboard/products/onboarding × 2/layout placeholder) теперь используют `process.env.NEXT_PUBLIC_BUYER_URL ?? 'https://savdo.uz'` через helper. В dev (`localhost:3001`) — реалистичные ссылки, не dead production. Закрывает аудит 06.05.

### ✅ [MARKETING-SEO-INFRA-001] SEO infra для cold-traffic 🔴
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-buyer/src/app/{layout.tsx,sitemap.ts,robots.ts,manifest.ts}`, `(shop)/[slug]/products/[id]/layout.tsx`
- **Что сделано:** `<html lang="en">` → `<html lang="ru">` (баг с launch). Создан `sitemap.ts` (homepage + 4 legal pages, weekly/yearly), `robots.ts` (allow /, disallow checkout/cart/orders/wishlist/chats/api), `manifest.ts` (Savdo PWA). JSON-LD `Organization` в root layout (sitewide). JSON-LD `Product` со schema.org/Product (name/image/sku/brand/offers/UZS) на product layout — берётся из существующего SSR fetch, no extra request.

### ✅ [MARKETING-PUBLIC-OFFER-PAGES-001] /terms /privacy /offer /refund 🔴
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-buyer/src/components/legal/LegalPage.tsx` (shared), `apps/web-buyer/src/app/{terms,privacy,offer,refund}/page.tsx`, `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` (footer links)
- **Что сделано:** 4 публичных страницы с прозой на русском (~500 слов каждая) — стандартные секции UZ e-com: условия использования, политика конфиденциальности, публичная оферта, возврат и обмен. Shared `LegalPage` компонент с H2/P/UL атомами для consistency. Checkout footer (desktop + mobile) — ссылки «соглашаетесь с публичной офертой и политикой» теперь underlined links, не dead text. Реквизиты юр. лица — placeholder (нужны после регистрации компании).

### ✅ [MARKETING-FAKE-RESPONSE-TIME-001] Удалить fake claims 🟠
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx:673`, `(shop)/orders/[id]/page.tsx:84`, `(minimal)/cart/page.tsx:352`
- **Что сделано:** убраны 3 false claims: «отвечает за час» на product page → conditional `{storeCity}`; «Продавец рассмотрит в течение часа» в order detail PENDING ETA → «Продавец скоро рассмотрит заказ»; «отвечает за час» в cart sticky strip → «написать продавцу».

### ✅ [MARKETING-REVIEWS-SHOW-001] Reviews на product page 🟠
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-buyer/src/lib/api/storefront.api.ts` (+`getProductReviews`), `hooks/use-storefront.ts` (+`useProductReviews`), `components/store/ProductReviews.tsx` (new), `app/(shop)/[slug]/products/[id]/page.tsx`
- **Что сделано:** новый компонент `ProductReviews` (~120 LOC) — fetch `GET /storefront/products/:id/reviews` через TanStack (staleTime 5 мин). States: loading (skeleton), empty (СTA-style invite), populated (header с avg rating + count + правильный плюрализ «отзыв/отзыва/отзывов», список карточек с author + Stars + дата + comment). Звёзды — `lucide-react` `<Star>` filled/outlined по rating. Подключён между Characteristics и «Из этого магазина». API уже был — Полат сделал заранее, фронт не рендерил.

**Итог сессии:** 6 задач, 18 новых/изменённых файлов, web-buyer + web-seller TS clean.

### ✅ [P3-006] Settings native select → custom Select 🟢
- **Дата:** 11.05.2026
- **Файлы:** `apps/web-seller/src/app/(dashboard)/settings/page.tsx`
- **Что сделано:** последний deferred тикет из WS-DESIGN-WAVE-7. 2 native `<select>` мигрированы на existing custom `<Select>` через `Controller` из react-hook-form. `DeliverySection.deliveryFeeType` (none/fixed/manual) + `ProfileSection.languageCode` (ru/uz). `searchable={false}` (мало опций), `ariaLabel` для a11y, типизированный `onChange` через field.onChange cast. Закрывает Firefox chevron issue + dark/light theme consistency + keyboard nav. WS-DESIGN-WAVE-7-DEFERRED теперь 5 nit'ов вместо 6.

---

## 2026-05-10 late-evening (Полат) — Wave 2 P1 fixes (6 задач)

Продолжение работ после P0-marathon:

### ✅ [API-DELIVERY-FEE-CLIENT-CONTROLLED-001] Backend computes deliveryFee 🔴
- `confirm-checkout.use-case.ts` игнорирует `input.deliveryFee` (deprecated в DTO)
- Считает из `store.deliverySettings`: fixed → fixedDeliveryFee, manual/none → 0
- `StoreWithSeller` расширен `deliverySettings` полем
- Spec: +4 case. Защита от buyer'а присылающего `deliveryFee:0`.
- **Commit:** `7f10caf`

### ✅ [API-N1-CHECKOUT-001] Batch fetch CreateDirectOrder 🟡
- Старый `Promise.all(items.map(findById))` + loop = 2N round-trips → 2 SELECT IN
- Новые `findManyByIds(ids[])` в ProductsRepo + VariantsRepo (Map<id, entity>)
- Spec: +1 case. **Commit:** `7f10caf`

### ✅ [TMA-CART-DUPLICATE-WARNING-001] Confirm перед cross-store 🟡
- `addToCart` в StorePage показывает confirmDialog «Заменить корзину?»
- Раньше silent reset терял товары без уведомления
- **Commit:** `5e486a3`

### ✅ [TMA-CHECKOUT-GUEST-401-001] Disable submit для guest 🟡
- Submit `disabled` пока `!authenticated`
- Warning-блок + label кнопки «Войдите через Telegram»
- **Commit:** `5e486a3`

### ✅ [TMA-CHECKOUT-SUCCESS-PAGE-001] Order confirmation screen 🟡
- ✓ icon + orderNumber + total + 2 CTA вместо моментального navigate
- **Commit:** `5e486a3`

### ✅ [ADMIN-NATIVE-CONFIRM-001 + ADMIN-MODAL-A11Y-001] 🟡
- Новый `ConfirmDialog` imperative API + `<ConfirmContainer/>` в App.tsx
- `window.confirm()` заменён в ChatsPage + ReportsPage
- 4 modal мигрированы на DialogShell: Orders Cancel + Refund, Moderation Reject, Broadcast Confirm
- a11y: role=dialog, aria-modal, focus-trap, Esc close
- **Commits:** `5e486a3`, `f2dc9f9`

**Также:** API-JWT-REVOCATION-001 — verified already done (JwtStrategy.validate
проверяет session в БД, deleteSession в logout инвалидирует токены).

**Wave 2 итог:** 668/668 tests, typecheck clean across api+admin+tma, 4 commits.

---

## 2026-05-10 evening (Полат) — Pre-launch P0/P1 marathon

После 5-perspective platform audit (design / marketing / seller UX / buyer UX / QA)
закрыто 14 P0/P1 задач за одну сессию:

### ✅ [ADMIN-P0-7-FIXES] 7 admin/TMA блокеров запуска (commit `7b6a149`) 🔴
1. `api.ts` handle 204 — DELETE/mark-read больше не падают
2. OrdersPage refund typo `returnToWallet`→`returnedToWallet`
3. MfaSetupPage GET endpoint /admin/auth/mfa/status → /admin/auth/me
4. AdminUsersPage 3 contract mismatches (POST/PATCH/GET shape)
5. **LoginPage MFA challenge step (step 3 + decodeJwtPayload + POST mfa/login)** — без этого ВСЕ админы с MFA не могли войти
6. TMA EditProductPage `window.confirm()` → `confirmDialog` (popup блокировался в TG mobile)
7. TMA EditProductPage ручной fetch DELETE → `api()` (auth refresh + cache-bust)

### ✅ [SEC-API-2-FIXES] Security fixes (commit `045f1d7`) 🔴
- **API-ROLES-GUARD-ADMIN-BYPASS-001 (SEC-003)** — admin больше не может звать buyer/seller endpoints от чужого имени. Bypass требует явный `@AllowAdminBypass()`.
- **API-DIRECT-ORDER-DOS-001** — `@ArrayMaxSize(50)` + `@Max(999)` quantity. POST /orders с массивом 50000 items больше не валит DB.

### ✅ [API-P0-STOCK + INV-O04 + Multer + Swagger] 5 fix (commit `385246a`) 🔴
- **API-STOCK-RACE-OVERSELL-001** — checkout.repository.ts: atomic UPDATE с WHERE stockQuantity >= qty (Prisma.sql + $executeRaw). 2 параллельных checkout на stock=1 → один success, второй CHECKOUT_STOCK_INSUFFICIENT.
- **API-INV-O04-STOCK-RELEASE-001** — orders.repository.updateStatus возвращает stock + InventoryMovement.ORDER_RELEASED при CANCELLED. Refund-order full refund тоже. Тестов +3.
- **API-MULTER-LIMITS-001** — `limits: { fileSize: 10 * 1024 * 1024 }` на 3 FileInterceptor.
- **API-SWAGGER-PROD-CLOSE-001** — `/api/v1/docs` отключён в prod (SWAGGER_ENABLED=true override).
- DirectOrder DoS + variant priceOverride@Min(1) — уже в `045f1d7`.

### ✅ [TMA-SELLER-WS-NOTIFY-001] TMA seller realtime (commit `23ddc7f`) 🟡
- Новый `apps/tma/src/lib/sellerNotifications.ts` — bind/unbind socket с join-seller-room + listen на `order:new` / `order:status_changed` / `chat:new_message` + showToast + HapticFeedback.
- Интегрирован в SellerLayout. Re-join on reconnect. Resolve storeId через `/seller/store` (INV-S01).
- Импакт: продавец на TG-only больше не теряет уведомления о заказах.

### ✅ [FEAT-TG-AUTOPOST-001] Opt-in TG channel auto-post (commit `8203542`) 🟡
- Новое поле `Store.autoPostProductsToChannel` (default false; existing stores с channelId set true для backward-compat).
- Migration `20260510210000_store_auto_post_to_channel`.
- Новый `PostProductToChannelUseCase` с corner-cases:
  - 0 фото → text + button «🛒 Открыть товар»
  - 1 фото bucket=telegram → sendPhotoToChannel + buttons
  - 2-10 фото → sendMediaGroupToChannel (caption на первом)
  - bucket=telegram-expired пропускается
  - HTML escape title/description (XSS защита)
  - salePrice priority с `<s>` зачёркнутым basePrice
  - force=true override toggle (manual repost)
  - Fail-tolerant: errors → {posted:false, reason}
- ChangeProductStatusUseCase теперь проверяет toggle перед auto-post.
- Manual repost endpoint: `POST /api/v1/seller/products/:id/repost-to-channel` (Throttle 5/мин, force=true).
- UpdateStoreDto: добавлен `autoPostProductsToChannel?: boolean` — Settings UI Азима будет toggle'ить через PATCH /seller/store.
- Тесты: +14 PostProductToChannel + 1 ChangeProductStatus.

**Итого сессии:** 49 test suites, **665 cases** (от 647 утренних), 100% pass.

---

## 2026-05-10 day (Полат) — 5 P0/P1/P2 задач из Sprint A/B + cleanup

### ✅ [API-CHAT-THREAD-PRODUCT-PREVIEW-001] Pinned product context для chat 🟡

- **Дата:** 10.05.2026
- **Файлы:** `apps/api/src/modules/chat/repositories/chat.repository.ts`, `apps/api/src/modules/chat/use-cases/list-my-threads.use-case.ts` (+spec), `packages/types/src/api/chat.ts`
- **Что:** `ChatThread` теперь содержит `productId/productTitle/productImageUrl/productPrice` для PRODUCT-threads. `productPrice` — effective: `salePrice ?? basePrice` (Decimal → Number). `productImageUrl` — resolved CDN URL для первой картинки (ORDER BY sortOrder asc) с handling для telegram-expired bucket → null + Telegram proxy + STORAGE_PUBLIC_URL CDN.
- **Зачем:** разблокирует Азима — Wave 6 (P1-003 pinned product context strip) в web-buyer теперь может рендериться без отдельного fetch'а товара.
- **Тесты:** +4 case (salePrice priority, STORAGE_PUBLIC_URL build, telegram-expired → null, ORDER-thread имеет product*=null).
- **Commit:** `f4ad95d`.

### ✅ [API-IDEMPOTENCY-KEY-001] Stripe-style header защита от двойных заказов 🟠

- **Дата:** 10.05.2026
- **Файлы (новые):** `apps/api/src/common/idempotency/{idempotency.service,idempotent.decorator,idempotency.interceptor,idempotency.module}.ts` + spec
- **Изменено:** `apps/api/src/app.module.ts`, `apps/api/src/modules/checkout/checkout.controller.ts`, `apps/api/src/modules/checkout/orders-create.controller.ts`
- **Что:** `Idempotency-Key` header (опциональный) на `POST /checkout/confirm` + `POST /orders`. SHA256(key + userId + route) → Redis cache 24h. NX-lock через read-then-set для concurrent retry → 409 CONFLICT. Success-only caching (errors не кэшируются — клиент может ретраить после фикса). Fail-open при Redis down (defence-in-depth через DB unique constraints). Валидация формата: 8-128 chars `[A-Za-z0-9_:.-]`.
- **Зачем:** защита от двойных заказов при network retry / double-tap. Стандартная практика (Stripe API).
- **Архитектура:** `@Idempotent()` decorator + `IdempotencyInterceptor` (через `@UseInterceptors`) — opt-in модель. Legacy clients без header работают как раньше.
- **Тесты:** +19 cases (buildCacheKey isolation cross-user/cross-route, getCached fail-open, NX через read-then-set, storeResponse 24h TTL, releaseLock защищает валидный кэш от wipe).
- **Commit:** `60d47ba`.

### ✅ [API-ORDERS-ALIAS-REMOVE-001] Удаление dead alias 🔴

- **Дата:** 10.05.2026
- **Файл:** `apps/api/src/modules/orders/orders.controller.ts` (-12 строк)
- **Что:** удалён alias `GET /api/v1/orders/:id` (был дублем `/buyer/orders/:id`).
- **Зачем:** dead code, дубль инкапсулирующего endpoint'а.
- **Verification:** grep по всем consumers — TMA (`/buyer/orders/:id`, `/seller/orders/:id`), admin (`/admin/orders/:id`), web-buyer (apiClient.get(`/buyer/orders/${id}`)), web-seller (apiClient.get(`/seller/orders/${id}`)). Bare endpoint никем не используется. Next.js routes `/orders/:id` в web-* — это страничные пути, не API endpoints.
- **Commit:** `c445d20`.

### ✅ [API-SWAGGER-001 + API-PRODUCTS-CTRL-SPLIT-001] Verification — already done

- **Дата:** проверка 10.05.2026
- **Что:** обе задачи уже были закрыты ранее (Wave 13-14 в test coverage push). Swagger полностью работает: `DocumentBuilder` в `main.ts:5` с 7 ApiTags + BearerAuth, `@ApiOperation/@ApiHeader/@ApiBearerAuth` на endpoints. ProductsController разделён: `products.controller.ts` (590 LOC) + `storefront.controller.ts` (318 LOC, 8 storefront routes отдельно) + `product-presenter.service.ts`.

### ✅ [API-DELETE-OLD-STASHES-001] Cleanup старых stashes 🟢

- **Дата:** 10.05.2026
- **Что:** дропнуты 2 stash после проверки diff'ов:
  - `stash-3` — мелкая правка `admin.controller.ts` (2 import строки), уже не актуально (admin.module разделён на 8 sub-controllers)
  - `tma-api-perf-deploy-stash` — 288 строк WIP с старой реализацией `OrderRefund` модели + admin impersonation. Все полезные изменения уже в main в более качественной форме: `OrderRefund` с `RefundStatus` enum (вместо String), `AdminUser` MFA-поля через DB-AUDIT-001, полностью работающая impersonation в `super-admin.controller.ts` + `admin-auth.use-case.ts`.

---

## 2026-05-10 (Полат) — Test coverage push: Wave 25-31 (130 → 550 cases, +323%)

### ✅ [TEST-COVERAGE-W25-31] Расширение покрытия Jest-тестами по 14 модулям 🟡

- **Дата:** 10.05.2026
- **Файлы:** 13 новых spec файлов
  - `apps/api/src/modules/wishlist/use-cases/wishlist.use-cases.spec.ts` — Wave 25 (12 cases)
  - `apps/api/src/modules/cart/use-cases/cart-mutations.use-cases.spec.ts` — Wave 25 (13 cases)
  - `apps/api/src/modules/auth/services/token.service.spec.ts` — Wave 26 (17 cases)
  - `apps/api/src/modules/auth/services/otp.service.spec.ts` — Wave 26 (23 cases)
  - `apps/api/src/modules/auth/use-cases/{request-otp,refresh-session,logout-session}.use-case.spec.ts` — Wave 27 (27 cases)
  - `apps/api/src/modules/categories/use-cases/store-categories.use-cases.spec.ts` — Wave 28 (12 cases)
  - `apps/api/src/modules/media/use-cases/media.use-cases.spec.ts` — Wave 28 (16 cases)
  - `apps/api/src/modules/cart/use-cases/get-cart.use-case.spec.ts` — Wave 29 (12 cases)
  - `apps/api/src/modules/notifications/use-cases/notifications.use-cases.spec.ts` — Wave 29 (12 cases)
  - `apps/api/src/modules/moderation/use-cases/moderation.use-cases.spec.ts` — Wave 30 (20 cases)
  - `apps/api/src/modules/chat/use-cases/chat-readonly.use-cases.spec.ts` — Wave 30 (20 cases)
  - `apps/api/src/modules/checkout/use-cases/{preview-checkout,create-direct-order}.use-case.spec.ts` — Wave 31 (24 cases)
  - `apps/api/src/modules/admin/use-cases/admin-create.use-cases.spec.ts` — Wave 31 (12 cases)
- **Что покрыто:**
  - Auth/JWT (17): TokenService — sign payload+secret+expiresIn fallback 15m, TTL parser (15m/1h/3600s/1d/whitespace/invalid), refresh token gen (80 hex chars), bcrypt hash/verify roundtrip + salt uniqueness, verifyAccessToken catch swallows error.
  - OTP (23): randomInt 6-digit range, bcrypt round-trip, **SEC-002 brute-force** (5 attempts → DomainException), Redis fail-tolerant, dev/prod sendOtp с `TELEGRAM_NOT_LINKED` fallback @savdo_builderBOT.
  - Auth use-cases (27): RequestOtp rate-limit 3/10min per phone+purpose, RefreshSession token rotation + JWT claims (BUYER vs SELLER vs ADMIN with mfaPending/adminRole), LogoutSession graceful failure.
  - Categories (12): INV-S02 limit 20 categories per store (граница 19/20), cross-store FORBIDDEN guard.
  - Media (16): RequestUpload mimeType validation (product_image vs seller_doc bucket+visibility split), ConfirmUpload idempotency, DeleteMedia R2-then-DB order.
  - Cart (25): GetCart mapper logic — salePrice priority, variant title fallback chain, telegram-expired bucket → null. CartMutations — ownership cross-buyer защита.
  - Wishlist (12): non-ACTIVE products НЕ возвращаются, idempotent toggle.
  - Notifications (12): GetInbox pagination, GetPreferences schema defaults (mobilePush=true, webPush=false, telegram=true), GetNotificationLogs filters.
  - Moderation (20): TakeAction state machine APPROVE/REJECT/ESCALATE → CLOSED; REQUEST_CHANGES → OPEN; **INV-A02** reject требует comment (whitespace blocks); side effects на store/seller; **INV-A01** audit log (lowercase action, payload).
  - Chat (20): ResolveThread (only seller), GetUnreadCount summarise (count > 0), GetThreadMessages — participant check, hasMore +1 trick, batch parent resolve (no N+1, dedupe), isDeleted text mask.
  - Checkout (24): PreviewCheckout — invalid items с reasons, **INV-C01** (CART_STORE_MISMATCH) защита cross-product variant inject (productId mismatch), priceOverride > basePrice, store ownership.
  - AdminCreate (12): manual seller activation flow (API-MANUAL-SELLER-ACTIVATION-001), **INV-S01** (one store per seller), slugify edge cases + uniqueSlug suffix.
- **Результат:** 47 test suites, 624 passed, 0 failed, 100% pass.
- **Commits:** 6ed34cd, 22b3b4b, 52a2987, fba9da1, 5bd47af, c1607c5, 88f9d02, 8fa6dda, ace965f, 611c15a, 647d532, f3b651b

### ✅ [TEST-COVERAGE-W32-36] Расширение покрытия: analytics, admin, orders, auth, chat 🟡

- **Дата:** 10.05.2026
- **Файлы (5 новых spec файлов):**
  - `apps/api/src/modules/analytics/use-cases/analytics.use-cases.spec.ts` — Wave 32 (18 cases)
  - `apps/api/src/modules/admin/use-cases/admin-list-detail.use-cases.spec.ts` — Wave 33 (12 cases)
  - `apps/api/src/modules/orders/use-cases/orders-read.use-cases.spec.ts` — Wave 34 (14 cases)
  - `apps/api/src/modules/auth/use-cases/telegram-auth.use-case.spec.ts` — Wave 35 (13 cases)
  - `apps/api/src/modules/chat/use-cases/create-thread.use-cases.spec.ts` — Wave 36 (17 cases)
- **Что покрыто:**
  - Analytics (18): TrackEvent role-to-actorType mapping, range parsing 30d default/90d cap/from<to/ISO,
    revenue split DELIVERED→completed vs CONFIRMED/PROCESSING/SHIPPED→pending, topProducts top-5 with
    snapshot-key fallback, daily buckets fill для дней без заказов.
  - Admin proxy (12): list/detail forwarding, GetMe UnauthorizedException, GetAuditLog filters.
  - Orders read (14): GetBuyerOrders UNAUTHORIZED guard, GetSellerOrders limit cap 100 (abuse prevent),
    Decimal→Number mapping, deliveryAddress + preview build. GetOrderDetail — NOT_ORDER_PARTICIPANT
    защита (cross-buyer/cross-store).
  - **TelegramAuth (13) — security-critical:** real HMAC-SHA256 buildInitData, missing botToken/hash/user,
    HMAC mismatch via timingSafeEqual, invalid JSON, existing telegramId reuse, Redis tg:phone link
    (clearTelegramIdIfGhost first), Redis-phone match с existing telegramId reuse byPhone, new user via
    createUserWithBuyerByTelegram. JWT claims: SELLER→storeId, ADMIN+MFA→mfaPending+adminRole.
  - CreateThread (17): chatEnabled flag, PRODUCT vs ORDER context, ownership (cross-buyer ORDER_ACCESS_DENIED),
    idempotent reuse. CreateSellerThread (FEAT-004): empty firstMessage block, guest checkout (buyerId=null)
    → BUYER_NOT_IDENTIFIED, sendMessage trimming, idempotent reuse.
- **Финальный итог:** **47 suites, 624 cases**, 100% pass — почти 5× прирост от стартовых 130.
- **Commits:** 8fa6dda, ace965f, 611c15a, 647d532, f3b651b

## 2026-05-09 (Азим) — Web-buyer Design Audit + 6 fix waves (22 из 25 findings закрыты)

### ✅ [WB-DESIGN-AUDIT-001] Read-only audit web-buyer vs Soft Color Lifestyle 🟡

- **Дата:** 09.05.2026
- **Артефакт:** `analiz/audit-web-buyer-design-2026-05-09.md` (~230 строк, 25 findings: 3 P1 / 14 P2 / 8 P3, health 7.5/10).
- **Что:** полный read-only аудит buyer'а под спеку `docs/superpowers/specs/2026-05-05-buyer-design-differentiation-design.md`. Делегирован code-explorer агенту, отчёт + backlog в tasks.md секция WB-DESIGN-FIX-WAVES (7 волн).
- **Top findings:** emoji-picker на чужой dark/violet/glassmorphism теме, chat edit-bubble white-on-white в light, отсутствие pinned product context strip (★ key differentiator vs Qlay).
- **Health 7.5/10:** token discipline существенно лучше seller'а — 0 legacy-violet hardcodes в основных страницах, 0 backdrop-blur (кроме emoji-picker), zero `dark:` Tailwind, всё через CSS-vars. Снижают: один сломанный компонент + radius drift в OTP/checkout/filters.
- **Commit:** `50f04e3`.

### ✅ [WB-DESIGN-WAVE-1] emoji-picker на Soft Color Lifestyle токенах 🔴

- **Дата:** 09.05.2026
- **Файл:** `apps/web-buyer/src/components/emoji-picker.tsx`
- **Что:** перекрашен с dark/violet/glassmorphism на light tokens. `backdropFilter: blur(18px)` удалён (spec §Foundation: «❌ glassmorphism»), `rgba(15,23,42,0.96)` → `colors.surface`, `rgba(167,139,250,0.30)` → `colors.border`, тяжёлая тень `0 16px 40px rgba(0,0,0,0.55)` → spec shadow-hover. Trigger color `#A78BFA`/`rgba(255,255,255,0.55)` → `colors.brand`/`colors.textMuted`. Tab active → `colors.brandMuted`. Panel radius `rounded-xl` → `rounded-lg` (spec large surface = 8px). `hover:bg-white/5` → `hover:bg-black/5` (на белом фоне первое было невидимо).
- **Closes:** P1-001.
- **Commit:** `9a16999`.

### ✅ [WB-DESIGN-WAVES-2-5] chat edit + headings + stats + timeline + radius 🟡

- **Дата:** 09.05.2026
- **Файлы (8):** chats/page.tsx, orders/page.tsx, profile/page.tsx, notifications/page.tsx, orders/[id]/page.tsx, checkout/page.tsx, OtpGate.tsx, CategoryAttributeFilters.tsx.
- **Wave 2 (P1-002):** chat edit-bubble — textarea/cancel/save кнопки переведены на `colors.brandTextOnBg`/`colors.brandHover`. Cancel сделан outline (border + transparent), save сменил `#FFFFFF` → token.
- **Wave 3 (P2-001):** page headings `text-lg` (18px) → `text-2xl tracking-tight` (24px) на 4 страницах: orders, profile, notifications, chats. Spec §Типография range 22-30px / 700 / -0.01em.
- **Wave 4 (P2-002, P2-003):** Stat() числа `text-base textStrong` → `text-2xl tracking-tight colors.brand` (per spec «большие числа в brand-color»). Timeline current dot + `animate-pulse` (per spec «pulsing brand-color on current step»).
- **Wave 5 (P2-005..008):** radius cleanup per spec §Border radius (4/6/8/999, никаких 14-16): checkout OTP buttons `rounded-2xl` → `rounded`, OtpGate icon+card `rounded-2xl` → `rounded-lg`, OtpGate inputs+buttons `rounded-xl` → `rounded`, CategoryAttributeFilters panel `rounded-2xl` → `rounded-lg`, ChatsView outer `rounded-2xl` → `rounded-lg`.
- **Closes:** P1-002, P2-001, P2-002, P2-003, P2-005, P2-006, P2-007, P2-008.
- **Commit:** `c5b6163`.

### ✅ [WB-DESIGN-WAVE-7] Backlog cleanup — 12 P2/P3 findings 🟢

- **Дата:** 09.05.2026
- **Файлы (8):** chats/page.tsx, orders/[id]/page.tsx, profile/page.tsx, page.tsx (homepage), HeaderSearch.tsx, CategoryAttributeFilters.tsx, ProductsWithSearch.tsx, theme-toggle.tsx.
- **Что:**
  - `#FFFFFF` literal в danger buttons (P2-012, 4 места) → `colors.brandTextOnBg`.
  - `text-white` className на brand backgrounds (P2-013, P3-008) → inline `colors.brandTextOnBg`.
  - Excess shadows (P2-009, P3-001, P3-002, P3-005) → spec shadow-hover `0 4px 12px rgba(31,26,18,0.08)`. Homepage logo container 16px spread → 12px.
  - CategoryAttributeFilters toggle thumb `bg-white` → `colors.surface` (P2-010).
  - ProductsWithSearch md grid `grid-cols-3` → `grid-cols-4` (P2-011).
  - ProductsWithSearch search input `rounded-xl` → `rounded-md` (P3-007).
  - Buyer message timestamp `rgba(255,255,255,0.70)` → `rgba(251,247,240,0.7)` (brandTextOnBg @ 70%, P3-003).
  - Homepage logo container `rounded-2xl` → `rounded-lg`, ShoppingCart icon `#FFFFFF` → token.
- **Skipped с обоснованием:**
  - **P2-004** (sections «Все NN →» link + dividers) — требует content decision: storefront сейчас имеет одну секцию «Товары», pattern вступает в силу при множественных секциях (Новые / Категории / Все). Без них link дублирует counter.
  - **P2-014** («Повторить заказ» button) — требует batch add-to-cart endpoint от Полата.
  - **P3-004** («Распродажа» chip) — требует `isSale` flag в API категорий.
- **Closes:** P2-009, P2-010, P2-011, P2-012, P2-013, P3-001, P3-002, P3-003, P3-005, P3-007, P3-008.
- **Commit:** `7ad5063`.

### ⏸ [WB-DESIGN-WAVE-6] Pinned product context strip — отдельной сессией

- **Закрывает (когда сделается):** P1-003.
- **Что:** добавить под header'ом ChatView полосу `rgba(brand,0.06)` с 40px thumb + название + цена + «Открыть →» когда `thread.contextType === 'PRODUCT'`. Спека называет это «★ key differentiator vs Qlay».
- **Почему отдельно:** требует API fetch product preview по `thread.contextId`, новый API call, optimistic loading state. Полноценная feature, не однострочный фикс.

### ✅ [WEB-BUYER-DARK-THEME-001] Dark theme — Soft Color Lifestyle warm equivalents 🟡

- **Дата:** 09.05.2026
- **Контекст:** аудит явно отметил dark drift как out-of-scope ("темная тема — отдельной итерацией" по спеке), но `[data-theme="dark"]` держал legacy violet-палитру с сессии 45. Пользователь с system-preference dark переключался и видел light в терракоте + dark в violet = inconsistent брэнд.
- **Что:** переписан весь dark блок в `apps/web-buyer/src/app/globals.css` под warm terracotta-aware палитру. Имена CSS-vars сохранены — все компоненты автоматически адаптируются.
  - bg `#0F0F12` (cool slate) → `#16120D` (warm near-black, brown-tinted)
  - surface chain warmed up (`#221C16 / #2A231C / #100E09 sunken`)
  - text-primary `#F4F4F5` → `#F5EFE3` (warm off-white), text-muted `#A1A1AA` → `#A89B85` (warm tan-grey), новый text-body `#D9CEB9`
  - divider/border переведены на `rgba(245,239,227, X)` (warm white с low alpha)
  - **brand violet `#A78BFA` → terracotta lifted `#A05A45`** (h=14° same as light, lightness +11% для dark contrast — preserves brand identity across themes)
  - brand-text-on-bg `#0F0F12` → `#FFFFFF` (white читается чисто на lifted terracotta, контраст ~5:1)
  - success/warning/danger lifted in lightness для dark visibility
  - accent-* теперь alias `var(--color-brand-*)` для consistency с light `:root`
- **Theme-aware hover utility:** добавлен `.hover-soft` в globals.css (`color-mix(text-primary 8%, transparent)`) — заменяет `hover:bg-black/X` который был невидим на dark surface. Migrated 6 places: cart back-link, CategoryAttributeFilters clear-button, HeaderSearch dropdown rows, emoji-picker buttons, chats context-menu items.
- **`text-white` → `colors.brandTextOnBg`** на brand-bg avatars/badges (5 мест): chats list/header/message avatars + send button + cart store-strip avatar + product detail seller-card avatar. Light = `#FBF7F0`, dark = `#FFFFFF` — автоматическая адаптация.
- **Skipped (intentional cross-theme):**
  - ProductCard / wishlist heart overlays `rgba(255,255,255,0.85)` — спека specifically требует белый pill на user photos.
  - Product detail image counter pill — `text-white` на `rgba(0,0,0,0.45)` intentional photo overlay.
  - ChatComposerModal / chat confirm backdrops `rgba(15,17,21,0.5)` — работает в обеих темах как content-dim layer.
- **Файлы (7):** globals.css, cart/page.tsx, [slug]/products/[id]/page.tsx, chats/page.tsx, emoji-picker.tsx, HeaderSearch.tsx, CategoryAttributeFilters.tsx.
- **Commit:** `b894589`. Push: main → b894589, web-buyer → 71b6797.

### ✅ [WS-CHAT-RESPONSIVE-001] Mobile-first chat layout (web-seller) 🟡

- **Дата:** 09.05.2026
- **Контекст:** P2-011 + P3-009 из seller-аудита (08.05) — chat off-grid и non-responsive. Был deferred с сессии 54 как «нужен полноценный wave».
- **Файл:** `apps/web-seller/src/app/(dashboard)/chat/page.tsx` (~551 строка).
- **Что сделано:**
  - Root layout `flex flex-col md:flex-row md:gap-5` — на mobile single-panel toggle (либо thread list, либо chat window), на desktop two-panel side-by-side как раньше.
  - Удалён `max-w-4xl` — chat теперь растягивается на full container width на desktop, вместо off-grid look рядом с wider sidebar.
  - Thread list: `${activeThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 flex-shrink-0` — full-width на mobile когда нет active thread, fixed sidebar (288px) на desktop.
  - Chat panel: `${activeThread ? 'flex' : 'hidden md:flex'} flex-1 min-h-0` — hidden на mobile когда нет thread'а (entry point = thread list), full-width при выборе.
  - **ChatWindow header:** добавлена mobile-only кнопка ← back (`md:hidden`) перед avatar, очищает `activeId` чтобы вернуться на список. Desktop header unchanged. Padding tightened на mobile: `px-3 md:px-5`, `gap-2 md:gap-3`.
  - Auto-select first thread restricted to desktop через `window.matchMedia('(min-width: 768px)')` — на mobile thread list должен быть видимой entry point, не moментально замещён первым чатом.
- **Closes:** P2-011 (chat off-grid), P3-009 (non-responsive).
- **Commit:** `04c1cca`. Push: main → `04c1cca`, web-seller → `6a5a4d4`.

### Итог сессии

- **Закрыто:** 22 из 25 buyer audit findings + dark theme buyer + WS-CHAT-RESPONSIVE-001 (seller).
- **Коммиты на main (8):** `50f04e3` (audit doc + backlog), `9a16999` (Wave 1), `c5b6163` (Waves 2-5), `7ad5063` (Wave 7), `c48321e` (docs), `b894589` (dark theme), `6c81cd8` (docs), `04c1cca` (seller chat responsive).
- **Файлов изменено:** 15 (1 новый — audit doc).
- **Push:** main → `04c1cca`, web-buyer → `894c204`, web-seller → `6a5a4d4` (оба Railway деплоя запущены).
- **Контракт-задача для Полата:** `API-CHAT-THREAD-PRODUCT-PREVIEW-001` — расширить `ChatThread` response полями `productId/productImageUrl/productPriceMinor` для unblock'а Wave 6 (buyer pinned product context strip).
- **Локально не запускалось** (per memory feedback).

---

## 2026-05-08 (Полат, поздний вечер) — Design audit P0 fixes (3 закрыто)

### ✅ [API-HTTP-201-CREATED-001] @HttpCode(CREATED) explicit на 6 POST creators 🔴

- **Дата:** 08.05.2026
- **Файл:** `apps/api/src/modules/products/products.controller.ts`
- **Skill criteria:** api-design-reviewer — "Status Code Compliance: ensure appropriate HTTP status codes are explicitly used"
- **Что:** добавлен `@HttpCode(HttpStatus.CREATED)` на 6 POST endpoints (seller/products + /variants + /option-groups + /option-groups/:gid/values + /images + /attributes). NestJS уже возвращал 201 неявно для @Post() — теперь explicit для symmetry с cart/checkout (которые имели explicit раньше).
- **Why:** consistency + Swagger generation friendly + intent ясно.

### ✅ [TMA-DESIGN-SPINNER-CLEANUP-001] Initial-load Spinner → Skeleton 🔴

- **Дата:** 08.05.2026
- **Skill criteria:** ui-design-system "Loading state hierarchy: skeleton placeholders for known shape; spinner for indeterminate progress"
- **Файлы:**
  - `apps/tma/src/pages/buyer/ChatPage.tsx:442` — initial-messages `<Spinner>` → 4× `Skeleton` блоки (alternating left/right alignment imitating message bubbles).
  - `apps/tma/src/pages/seller/ChatPage.tsx:506` — то же.
  - `apps/tma/src/pages/seller/EditProductPage.tsx:597` — full-page `<Spinner>` → `<ProductDetailSkeleton />`.
- **Что НЕ заменено:** inline Spinner на send-button (sending indicator), loadMore button (pagination), expand-detail (small inline) — они correctly indeterminate-progress.

### ✅ [TMA-DESIGN-A11Y-LEFTOVERS-001] Verification: реальных нарушений не осталось 🔴

- **Дата:** 08.05.2026
- **Что проверено:** упомянутые в design-audit T3 места (seller/ChatPage:205, buyer/ProductPage:252-256).
- **Findings:**
  - `seller/ChatPage` line 205 — это код функции `sendMsg`, не div onClick. Audit ошибся.
  - Все `<div onClick>` в seller/ChatPage (lines 377, 383, 683, 684) — modal backdrops с `stopPropagation` + ESC handler в ConfirmModal/ImageCropper. Acceptable per ADR `2026-05-08-tma-a11y-roletabindex-vs-button.md`.
  - `buyer/ProductPage:252-256` (collage 2x2) уже фикшено в коммите `3400ecc`.
- **Решение:** тикет закрыт без изменений.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фикс Wave 7 (частично)

### ✅ [WS-DESIGN-WAVE-7-BACKLOG] 8 из 14 backlog nit'ов 🟢

- **Важность:** 🟢 LOW (косметика + accessibility)
- **Дата:** 08.05.2026
- **Файлы (6):**
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — toast shadow `0 12px 28px` → `0 4px 12px` (P2-006a). Notification badge: `minWidth 14 / fontSize 9` → `minWidth 16 / fontSize 10` (P3-001).
  - `apps/web-seller/src/components/select.tsx` — dropdown shadow `0 16px 40px` → `0 6px 16px` (P2-006b).
  - `apps/web-seller/src/components/emoji-picker.tsx` — popover shadow same fix (P2-006c). Emoji-cell `hover:bg-white/5` → `row-hoverable` (P3-004).
  - `apps/web-seller/src/components/theme-toggle.tsx` — убран redundant `shadow-lg` Tailwind, inline `0 10px 28px` → `0 4px 12px` (P3-003).
  - `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx` — 3 хардкоженных hex → tokens: Rocket icon `color="#fff"` → `colors.accentTextOnBg`, store-name span `#A78BFA` → `colors.accent`, ShoppingCart logo `color="#fff"` → `colors.accentTextOnBg` (P2-009). Progress connector incomplete state `colors.surfaceElevated` → `colors.border` — видно на light theme (P3-005).
  - `apps/web-seller/src/app/(dashboard)/notifications/page.tsx` — hover semantics для unread fixed: на hover теперь `color-mix(in srgb, ${colors.accent} 22%, transparent)` (stronger accent), а не `surfaceElevated` (нейтральный). Read items как раньше — surfaceMuted ↔ surfaceElevated (P2-012).
  - `apps/web-seller/src/app/(dashboard)/analytics/page.tsx` — ASCII «— Просмотры и конверсия» divider → реальный `<hr>` через `colors.divider`. Тире из текста удалено (P3-007).
- **Что сделано:** все «easy wins» из Wave 7 закрыты в одном проходе. Все shadows < 8px (соответствует Liquid Authority). Все хардкоженные hex'ы в onboarding устранены. Notifications hover больше не «теряет» унред-состояние. Theme-toggle/emoji-picker/onboarding прогрессбар всё корректно отображаются в обеих темах.
- **Skipped (с обоснованием):** P2-007 (sidebar 14%→15% accentMuted в пределах rounding tolerance), P2-008 (onboarding `rounded-3xl` — sanctioned «scene» в спеке), P2-011 + P3-009 (chat off-grid layout + не-responsive — реальный user impact, но это полноценный mobile-first рефактор chat layout, отложено отдельным тикетом WS-CHAT-RESPONSIVE-001), P3-002 (chat thread skeletons beyond 3 — нужно более глубокое skeleton component change), P3-006 (settings native `<select>` Firefox chevron — нужен переход на custom Select для всех селектов в settings, отдельный wave), P3-008 (analytics text-3xl — внутри spec range, audit acknowledged).
- **Verification:** локально не запускал. Push'нётся через web-seller ветку → Railway сборка подтвердит.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фикс Wave 6

### ✅ [WS-DESIGN-WAVE-6] Products edit dragons: radius + native select + extract examples 🟡

- **Важность:** 🟡 MEDIUM (largest refactor wave, fixes both visible drift и underlying maintenance trap)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-seller/src/lib/product-examples.ts` (новый) — `TITLE_EXAMPLES_BY_SLUG` + `DESCRIPTION_EXAMPLES_BY_SLUG` (по 20+7 ключей) + 2 helper'а `titlePlaceholder()` / `descriptionPlaceholder()`. Раньше дублировалось verbatim в обоих файлах create/edit.
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — удалены 32 строки локального дублирования (consts + helpers); импорт из `lib/product-examples`. Form card `rounded-lg` (8px) → `rounded-xl` (12px) per spec Liquid Authority.
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — то же удаление дублей. ×4 `rounded-2xl` (16px) → `rounded-xl` (form card, error state, status section, error banner). Native `<select>` ×2 (Категория товара + Раздел магазина) заменены на custom `<Select>` (как в create) — устранено хардкоженное `background: '#1a1d2e'` на 4 `<option>` элементах + получили search/keyboard nav/clearable. Form integration: `<input type="hidden" {...register('globalCategoryId')} />` + `setValue(..., { shouldValidate: true, shouldDirty: true })` для сохранения react-hook-form behavior; storeCategoryId как раньше через local state.
- **Что сделано:** все 3 P2 (P2-001 radius drift, P2-004 native select regression, P2-005 EXAMPLES duplicate) закрыты одним рефактором. Edit-страница теперь UX-эквивалентна create — те же search'абельные dropdown'ы, тот же радиус карточек, тот же placeholder-движок. Maintenance trap (sync создаваемых дубликатов) устранён.
- **Verification:** `grep -rn "TITLE_EXAMPLES_BY_SLUG\|<select\|background: '#1a1d2e'"` → 0 матчей в обоих файлах. Локально не запускал. Push'нётся через ветку web-seller → Railway сборка подтвердит.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фикс Wave 5

### ✅ [WS-DESIGN-WAVE-5] Semantic `colors.info` token + 9 хардкоженных hex заменены 🟡

- **Важность:** 🟡 MEDIUM (token discipline + theme correctness)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-seller/src/app/globals.css` — добавлены `--color-info: #2563EB` (light) и `#60A5FA` (dark). Соответствует паттерну `success`/`danger`/`warning`: light = более тёмный shade (600-700), dark = более светлый (400-500).
  - `apps/web-seller/src/lib/styles.ts` — добавлено `info: 'var(--color-info)'` в `colors` const.
  - `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx` — STATUS_COLORS: CONFIRMED `#60A5FA` → `colors.info`, SHIPPED тоже на `colors.info` (был `colors.accent`).
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx` — STATUS_CONFIG: CONFIRMED `#60A5FA` → `colors.info`, SHIPPED `#818CF8` → `colors.info`.
  - `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx` — STATUS_CONFIG: то же.
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx` — TG-link icon ×2: `#60A5FA` → `colors.info`.
  - `apps/web-seller/src/app/(dashboard)/analytics/page.tsx:188` — analytics block bg/color: `rgba(96,165,250,0.15)` + `#60A5FA` → `color-mix(in srgb, ${colors.info} 15%, transparent)` + `colors.info`.
  - `apps/web-seller/src/app/(dashboard)/profile/page.tsx:169` — TG chip: 3 хардкоженных hex (`rgba(56,189,248,0.13)` / `#7dd3fc` / `rgba(125,211,252,0.30)`) → `color-mix()` + `colors.info`.
- **Что сделано:** все 9 хардкоженных info-blue hex'ов заменены на единый semantic token. SHIPPED унифицирован с CONFIRMED через `colors.info` — оба = «in-flight» status, distinct от PROCESSING (которое остаётся на `colors.accent`). Token адаптируется к теме: на light получается читаемый dark blue, на dark — мягкий light blue.
- **Verification:** `grep -rn "#60A5FA\|#818CF8\|#7dd3fc"` → 0 матчей в коде (только определение токена в globals.css). Audit IDs: P2-002, P2-003, P2-013.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фикс Wave 3

### ✅ [WS-DESIGN-WAVE-3] Page heading typography — 5 файлов 🟡

- **Важность:** 🟡 MEDIUM (visible inconsistency, spec deviation)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/analytics/page.tsx:223`
  - `apps/web-seller/src/app/(dashboard)/orders/page.tsx:329`
  - `apps/web-seller/src/app/(dashboard)/products/page.tsx:91`
  - `apps/web-seller/src/app/(dashboard)/notifications/page.tsx:110`
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx:792`
- **Что сделано:** все 5 page-title `<h1>` `text-xl` (20px) → `text-2xl` (24px). Liquid Authority spec: Headline 24-32px / 700. Раньше только `dashboard/page.tsx:90` соответствовал, остальные 5 — на 4px ниже минимума. Теперь все 6 dashboard-страниц консистентны на `text-2xl font-bold`. Audit ID: P2-014.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фикс Wave 2

### ✅ [WS-DESIGN-WAVE-2] Native `confirm()` → reusable `ConfirmModal` 🔴

- **Важность:** 🔴 HIGH (native confirm не следует app theme + silently блокируется на mobile WebView)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-seller/src/components/confirm-modal.tsx` (новый) — generic компонент. Props: `open/title/message?/confirmLabel?/cancelLabel?/danger?/loading?/onConfirm/onClose`. ESC/Enter keyboard handlers, click-outside для close, autoFocus на confirm-button, ARIA `role=dialog` + `aria-modal=true`, danger flag отдаёт `color-mix()` поверх `colors.danger` для red destructive button.
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — `handleDelete` (Удалить товар) → `setConfirmDelete(true)` + `<ConfirmModal>` с danger.
  - `apps/web-seller/src/components/product-option-groups-section.tsx` — 2 места: ValueRow «Удалить значение», GroupRow «Удалить группу» (msg меняется в зависимости от `hasValues`). Каждое — отдельный modal state в своём scope.
  - `apps/web-seller/src/components/product-variants-section.tsx` — `handleDelete(variantId)` → `setConfirmId(variantId)` + единый `<ConfirmModal>` с `confirmId !== null` как open.
- **Что сделано:** все 4 native browser `confirm()` заменены на theme-aware in-app dialogs. Соответствует UX-паттерну существующего `CancelModal` в orders pages (но generic, с поддержкой не-destructive подтверждений). Mobile WebView больше не блокирует destructive actions silently. Light/dark theme подхватывается автоматически.
- **Verification:** локально не запускал. Push'нётся через web-seller ветку → Railway сборка подтвердит. `grep -rn "confirm(" apps/web-seller/src/` → 0 матчей нативных confirm.

---

## 2026-05-08 (Азим, сессия 54) — web-seller дизайн-фиксы Wave 1+4

### ✅ [WS-DESIGN-WAVE-1] light-theme contrast killers — 5 P1 из 6 🔴

- **Важность:** 🔴 HIGH (light theme был фактически сломан в 4-5 точках)
- **Дата:** 08.05.2026
- **Коммит:** `1ad0e69`
- **Файлы:**
  - `apps/web-seller/src/app/globals.css` — добавлен класс `.row-hoverable { :hover background var(--color-surface-elevated) }` для theme-aware row hover вместо `bg-white/[0.03]` Tailwind.
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — 5 хардкоженных hex заменены: `#f87171` ×4 (error text, ×2 required asterisks, удалить-кнопка) → `colors.danger`; `#A78BFA` ×1 (back-link) → `colors.accent`. Visibility toggle thumb `after:bg-white` → внутри `<style>` блока через `colors.textMuted` (off) и `colors.bg` (on) — паттерн совпадает с create page.
  - `apps/web-seller/src/app/(dashboard)/chat/page.tsx` — 3× `rgba(255,255,255,X)` → `color-mix(in srgb, ${colors.accentTextOnBg} N%, transparent)`. Theme-adaptive overlay: в light theme overlay белый поверх dark-violet accent (как раньше), в dark theme overlay тёмный поверх light-violet accent (стало читабельным). Применено к textarea bg/border, кнопке «Отмена» в edit mode, и timestamp text seller-bubble.
  - `apps/web-seller/src/app/(dashboard)/profile/page.tsx` — 2× `transition-colors hover:bg-white/[0.03]` → `transition-colors row-hoverable` (Settings link + Logout button rows).
  - `apps/web-seller/src/app/(dashboard)/layout.tsx` — sidebar logo: `linear-gradient(135deg, #7C3AED, #A78BFA)` + `boxShadow rgba(167,139,250,0.40)` → solid `colors.accent` + `colors.accentTextOnBg` для иконки. Совпадает с onboarding logo и спекой Liquid Authority «no glow gradients». Logout-button hover класс заменён на `row-hoverable`.
- **Что сделано:** systematic fix всех light-theme контраст-багов из аудита 08.05. Все хардкоженные hex (`#f87171`, `#A78BFA`) и `*-white/X` Tailwind классы заменены theme-aware токенами или `color-mix()` поверх существующих токенов. Никаких новых CSS variables не понадобилось.
- **Skipped (с обоснованием):** P1-004 (avatar spinner `text-white` в `profile/page.tsx:116`) — overlay поверх spinner'а это `rgba(0,0,0,0.45)`, тёмный в обеих темах. White spinner читается всегда, аудит overcautious. Обновлено в audit doc.
- **Verification:** локально не запускал (запрещено). Push'нётся через ветку `web-seller` → Railway сборка подтвердит.

### ✅ [WS-DESIGN-WAVE-4] Login OTP copy: SMS → Telegram 🟡

- **Важность:** 🟡 MEDIUM (project rule №0 violation, копи-баг в первом окне seller'а)
- **Дата:** 08.05.2026
- **Коммит:** `a818720`
- **Файлы:**
  - `apps/web-seller/src/app/(auth)/login/page.tsx` — «Отправили SMS на +998 …» → «Код отправлен в Telegram-бот @savdo_builderBOT»; «Код из SMS» → «Код из Telegram».
- **Что сделано:** OTP step seller login больше не противоречит project rule №0 (ESKIZ.UZ ЗАПРЕЩЁН, OTP только Telegram bot). Реальность UX: после ввода телефона seller получает код именно от @savdo_builderBOT в Telegram.

---

## 2026-05-08 (Азим, сессия 54) — web-seller design audit

### ✅ [WEB-DESIGN-AUDIT-001] Аудит web-seller под Liquid Authority — 30 findings 🟢

- **Важность:** 🟢 LOW (read-only, ничего не сломано — только backlog для будущих волн)
- **Дата:** 08.05.2026
- **Файлы:**
  - `analiz/audit-web-seller-design-2026-05-08.md` (новый) — полный отчёт.
  - `analiz/tasks.md` — добавлена секция `WS-DESIGN-FIX-WAVES` с 7 волнами фиксов.
- **Что сделано:** Систематический обход 15 страниц + 7 компонентов `apps/web-seller` против `docs/design/liquid-authority.md`. Делегировано feature-dev:code-explorer subagent'у. Категоризация: P1 (видимые UX-баги/контраст/accessibility) — 7, P2 (drift/inconsistency/off-grid) — 14, P3 (polish) — 9. Health 6.5/10.
- **Ключевые находки:**
  - **Phase 2/3 cleanup держится:** 0 `backdrop-blur`, 0 `dark:` Tailwind classes — token discipline сохранён.
  - **Кластер хардкоженного hex'a в edit-product** (`#f87171`, `#A78BFA`, native `<select>` с `#1a1d2e`) — light theme там фактически сломан.
  - **3 места native `confirm()`** (edit-product, option-groups, variants) — не следуют app theme, на mobile WebView часто silently заблокированы.
  - **5 page headings ниже spec** (`text-xl` 20px вместо 24-32px Headline range).
  - **SMS-copy в login OTP** — нарушение project rule №0 (Telegram-only).
  - **Sidebar logo gradient + glow** хардкожен dark-only — в light theme выглядит чужеродно.
- **Backlog:** см. `analiz/tasks.md` секция `WS-DESIGN-FIX-WAVES` — 7 волн упорядочены по value/effort. Wave 1-2 — P1 critical, Wave 3-6 — P2 systemic, Wave 7 — backlog.

---

## 2026-05-08 (Азим, сессия 54) — Cleanup контракт-хвостов после Полата

### ✅ [WEB-BUYER-CONTRACT-CLEANUP-001] search type из `packages/types` + убран defensive cast в ProductCard 🟢

- **Важность:** 🟢 LOW (technical debt cleanup; функционально без изменений)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/web-buyer/src/lib/api/search.api.ts` — удалены локальные `SearchStoreHit`/`SearchProductHit`/`StorefrontSearchResponse`. Теперь `import type { StorefrontSearchResponse } from 'types'`. Файл сократился до одной API-функции + import.
  - `apps/web-buyer/src/components/store/ProductCard.tsx` — убран `(product as unknown as { images?: ... }).images` cast (BUG-WB-AUDIT-018, ранее skipped пока контракт не был выровнен). Теперь `product.images?.length ? product.images.map(i=>i.url) : product.mediaUrls ?? []`. Поведение идентично — оба поля гарантированы контрактом, fallback на mediaUrls для не-storefront callsite'ов.
- **Что сделано:** Полат сегодня ночью закрыл оба контракта (`API-STOREFRONT-SEARCH-CONTRACT-001` + `API-PRODUCT-LIST-IMAGES-CONTRACT-001`) — `ProductListItem` теперь декларирует и `mediaUrls: string[]`, и `images: { url }[]`; `StorefrontSearchResponse` живёт в `packages/types/src/api/search.ts`. Удалил локальные дубли в web-buyer.
- **Verification:** локально не запускал (запрещено). Push'нётся через ветку `web-buyer` → Railway сборкa подтвердит.

---

## 2026-05-08 (Полат, параллельная сессия) — otplib v12 → v13.4.0 upgrade

### ✅ [API-OTPLIB-V13-UPGRADE-001] otplib v13 — переписать admin-auth.use-case.ts под functional API 🟡

- **Важность:** 🟡 MEDIUM (technical debt; v12 закреплено в package.json несколько недель из-за blocked v13 upgrade)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/api/package.json` — `otplib: ^12.0.1 → ^13.4.0`
  - `apps/api/src/modules/admin/use-cases/admin-auth.use-case.ts` — убран `require('otplib')` workaround, заменён на нормальный `import { generateSecret, generateURI, verifySync } from 'otplib'`. Все 3 вызова `authenticator.verify(...)` заменены на `verifySync(...).valid` (v13 возвращает `{valid: true|false, delta?}` вместо boolean). `authenticator.keyuri(label, issuer, secret)` → `generateURI({issuer, label, secret})`. Опции TOTP вынесены в const `TOTP_VERIFY_OPTIONS` (digits=6, period=30, epochTolerance=30 — эквивалент v12 window:1 ±30s).
  - `apps/api/src/modules/admin/use-cases/admin-auth.use-case.spec.ts` — `jest.mock('otplib')` обновлён под новую functional форму. `verifySync` мокается с `mockReturnValue({valid: true})`/`{valid: false}`. Assertions `expect(verifySync).toHaveBeenCalledWith(expect.objectContaining({token, secret}))` (для tolerance к нашим extra opts).
  - `pnpm-lock.yaml` — обновлён автоматически через `pnpm --filter api install`.
- **Что сделано:** otplib upgraded, v12 namespace API (`authenticator.options/generateSecret/keyuri/verify`) полностью заменён v13 functional API. Сохранены все security-критичные параметры (digits=6, period=30, ±30s tolerance).
- **Verification:**
  - `npx tsc --noEmit` → 0 ошибок.
  - `npx jest admin-auth.use-case.spec` → 14/14 passed (5.15 s).
  - Manual smoke: setupMfa→QR; verifyMfa(valid code); disableMfa; mfaChallenge — все вызывают `verifySync` правильно.
- **Backwards compat:** существующие `mfaSecret` в БД (base32) полностью совместимы с v13 — формат секрета не изменился.

---

## 2026-05-08 (Полат, поздно вечер +30 мин) — SEC-007 part 2: change-product-status + processor refactor

### ✅ [SEC-007 part 2] HTML escape в product autopost + унификация processor 🟡

- **Важность:** 🟡 MEDIUM (тот же класс уязвимости что SEC-007 — content injection / silent drop через TG parser)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/api/src/modules/products/use-cases/change-product-status.use-case.ts` — `<b>${product.title}</b>...${product.description}...🏪 ${store.name}` обёрнуты в `escapeTgHtml`. Это автопостинг при переходе товара → ACTIVE.
  - `apps/api/src/queues/telegram-notification.processor.ts` — inline `escape` lambda заменена на shared `escapeTgHtml` (5 точек в TELEGRAM_JOB_CHAT_MESSAGE).
- **Что сделано:**
  - До: продавец делает `pnpm publish` товара с `<test>` → Telegram parser отвергал авто-пост в канале. Также `<a href="evil">x</a>` в описании создавал рабочую ссылку в собственном канале продавца.
  - После: 8 интерполяций (3 в use-case + 5 в processor) защищены через единый shared helper.
- **Что НЕ нужно:** plain-text job'ы (NEW_ORDER, STORE_APPROVED, STORE_REJECTED, VERIFICATION_APPROVED, ORDER_STATUS_CHANGED) — без `parseMode`, Telegram не интерпретирует HTML.
- **TS:** мои файлы 0 errors. `admin-auth.use-case.spec.ts` от параллельной сессии имеет error (`otplib.authenticator` import) — не моё, untracked spec.

---

## 2026-05-08 (Полат, поздно вечер) — Telegram HTML escape для user-controlled полей

### ✅ [SEC-007] HTML escape в `telegram-demo.handler.ts` 🟡

- **Важность:** 🟡 MEDIUM (content injection в собственный канал продавца + parser-error silent drops)
- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/api/src/shared/telegram-html.ts` (new) — `escapeTgHtml(s)` заменяет `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;` в порядке Telegram Bot API spec.
  - `apps/api/src/modules/telegram/telegram-demo.handler.ts` — 12 точек интерполяции user-controlled данных (`firstName`, `product.title`, `product.description`, `store.name`, `store.slug`, `store.description`, `store.telegramChannelTitle`, `storeName`) обёрнуты в `escapeTgHtml`.
- **Что сделано:**
  - До фикса: `<b>${product.title}</b>` ломался при `<` в названии (Telegram парсер отказывал, пост не появлялся в канале); `<a href="https://evil">текст</a>` от seller рендерился как рабочая ссылка в его автопостинге.
  - После: все 12 точек защищены, безопасно интерполируется любой UTF-8 + спецсимволы. Telegram теперь рендерит их как видимый текст (`&lt;test&gt;`).
- **Backlog (отдельные тикеты):**
  - `seller-notification.service.ts` — 5 типов уведомлений с `parseMode: 'HTML'`, аналогичные интерполяции `d.storeName`/`d.productTitle`. Не правил в этой сессии (узкий scope).
  - `telegram-webhook.controller.ts` — статичные строки, escape не нужен.
- **TS:** `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` → exit 0.

---

## 2026-05-08 (Полат, вечер) — TMA polish: skeletons + a11y

### ✅ [TMA-LOADING-SKELETONS-001] Скелетоны на оставшихся страницах 🟠

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/tma/src/pages/buyer/OrdersPage.tsx` — initial-list `<Spinner />` заменён на 4 `OrderRowSkeleton` (placeholder совпадает по высоте с реальной карточкой → нет layout shift).
  - `apps/tma/src/pages/seller/ProfilePage.tsx` — пока `store === null` рендерится skeleton-блок магазина (header chip + name + URL pill + meta) поверх существующего `{store && (...)}`. Раньше блок просто отсутствовал, плотность скакала.
- **Что НЕ нужно (выяснено в ходе аудита):**
  - `CartPage` / `CheckoutPage` — синхронно читают `getCart()` (localStorage), нет блокирующего fetch'а → loading state физически отсутствует.
  - `buyer/ProfilePage` — все данные из `useAuth()` синхронно.
  - `AddProductPage` — create-страница без блокирующего initial fetch'а; категории грузятся для модала, форма уже доступна.
  - `StoresPage` — оба таба уже имели `ThreadRowSkeleton` / `ProductCardSkeleton`.
- **Тикет помечается полностью закрытым:** все страницы с реальным loading state теперь имеют skeleton.

### ✅ [TMA-A11Y-ROLE-TABINDEX-001] role/tabIndex/onKeyDown на clickable div 🟡

- **Дата:** 08.05.2026
- **Файлы:**
  - `apps/tma/src/components/ui/ProductCard.tsx` — внешний `<div onClick>` обёрнут в `role="button" tabIndex={0} aria-label={…} onKeyDown={Enter|Space}`. Не сделан настоящим `<button>` потому что внутри nested `<button>` (add-to-cart, wishlist) — было бы invalid HTML.
  - `apps/tma/src/pages/buyer/ProductPage.tsx` — collage 2x2 gallery (открывает первое фото) теперь с role/tabIndex/onKeyDown.
  - `apps/tma/src/pages/buyer/WishlistPage.tsx` — карточка товара аналогично.
- **Что НЕ нужно править:**
  - `GlassCard` — уже рендерит `<button>` когда есть `onClick`.
  - Buyer/seller `ChatPage` thread row, `StorePage` product card — уже имели role/tabIndex.
  - Modal backdrops (`onClick={() => close()}`) — invisible click target, ESC-handler уже есть в `ConfirmModal`/`ImageCropper`/`BottomSheet`. Backdrop click — secondary path, не a11y violation.
- **Why:** на desktop Telegram (web/macOS) есть keyboard, пользователи без мыши не могли открывать товары через Tab+Enter.

---

## 2026-05-08 (Азим) — FEAT-006-FE seller analytics page

### ✅ [FEAT-006-FE] `/analytics` под новый `/seller/analytics?from=&to=` 🟡

- **Дата:** 08.05.2026
- **Backend:** `GET /seller/analytics?from=&to=` (Полат, `7a3ca26`) → `{ range, revenue: { total, completed, pending }, orders: { total, byStatus }, topProducts, daily }`. Default = 30 дней, max = 90 дней (BadRequest при превышении).
- **Файлы (web-seller):**
  - `src/lib/api/analytics.api.ts` — добавлены типы `DailyPoint`/`AnalyticsTopProduct`/`SellerAnalytics` и `getSellerAnalytics({ from, to })`. Старый `getSellerSummary` оставлен без изменений (используется на `/dashboard`).
  - `src/hooks/use-analytics.ts` — добавлен `useSellerAnalytics(period: 7 | 30 | 90)` с `useMemo` для стабильного `from/to` и `staleTime: 60s`, `retry: false`.
  - `src/app/(dashboard)/analytics/page.tsx` — переписана страница:
    - Period selector (7/30/90 дней) в шапке.
    - 3 KPI: Выручка (completed) · Заказы (total + delivered subtitle) · В работе (revenue.pending).
    - Custom SVG sparkline по `daily.revenue` (без recharts — лёгкий бандл, ~3 КБ).
    - Top-5 товаров по выручке (отдельная карточка).
    - Empty state «За {период} ещё нет заказов».
    - Legacy секция «Просмотры и конверсия за 30 дней» (старый `useSellerSummary`) оставлена ниже как secondary, с пометкой периода.

---

## 2026-05-08 (Азим) — FEAT-001-FE search + FEAT-003-FE price filter

### ✅ [FEAT-001-FE] Глобальный поиск магазинов и товаров в Header 🟢

- **Дата:** 08.05.2026
- **Backend:** `GET /storefront/search?q=&limit=` (Полат, коммит `a837c13`) — возвращает `{ stores, products }`. Min 2 chars, throttle 30/min.
- **Файлы (web-buyer):**
  - `src/lib/api/search.api.ts` (новый) — `searchStorefront(q, limit)` + локальные типы `SearchStoreHit`/`SearchProductHit`/`StorefrontSearchResponse` (packages/types пока не описывает endpoint).
  - `src/hooks/use-search.ts` (новый) — `useDebouncedValue<T>` (250ms) + `useStorefrontSearch(query)` (TanStack `useQuery`, `enabled` при ≥2 char, `staleTime: 30s`, `retry: false`).
  - `src/components/layout/HeaderSearch.tsx` (новый) — popover dropdown с двумя секциями («Магазины · N» / «Товары · N»), click-outside и Escape закрывают, Link на каждый item, состояния «Ищем…» / «Ничего не нашли» / «Введите минимум 2 символа».
  - `src/components/layout/Header.tsx` — заглушка `<input>` заменена на `<HeaderSearch />`. Убран лишний `Search` импорт из lucide.
- **UX:** input всегда в шапке, dropdown появляется при focus + ≥2 символа. Клик по магазину — `/[slug]`, клик по товару — `/[slug]/products/[id]`.

### ✅ [FEAT-003-FE] Price range filter на витрине магазина 🟢

- **Дата:** 08.05.2026
- **Backend:** `GET /storefront/products?priceMin=&priceMax=` (Полат, `27221eb`) — числовые границы, parse в `parsePrice` use-case'а.
- **Файлы (web-buyer):**
  - `src/lib/api/storefront-server.ts` — `serverGetProducts` теперь принимает `priceMin?: number` / `priceMax?: number`, прокидывает в URL (с `Number.isFinite` guard).
  - `src/app/(shop)/[slug]/page.tsx` — extract `priceMin`/`priceMax` из searchParams (`parsePrice` helper, sanity-check `>= 0`), pass в `serverGetProducts` + `CategoryAttributeFilters`. `persistentParams` сохраняет цену через клики по storeCategory chips.
  - `src/components/store/CategoryAttributeFilters.tsx` — props расширены `priceMin: number | null` / `priceMax: number | null`. Локальные `minInput`/`maxInput` строки + `useEffect` re-sync на смену URL. `commitPrice(kind, raw)` срабатывает на blur/Enter (без spam'a refetch на каждый keystroke). `handleClearAll` чистит `priceMin`/`priceMax`. `activeCount` бэйдж учитывает оба поля.

---

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

### DB-MANAGER-PROPER-INPUTS-001 + ADMIN-USER-STORE-ACTIVITY-LOG-001 (09.05.2026)

- **Важность:** P0 (MVP-блокер: суперадмин не мог нормально менять данные через DB Manager — везде был text input для всего)
- **Дата:** 09.05.2026
- **Файлы:**
  - `apps/api/src/modules/admin/use-cases/db-manager.use-case.ts` — добавлены `DbFieldMeta`/`DbFieldType`, `getFieldMetas()` через `Prisma.dmmf`, `coerceField()` с валидацией enum/datetime/number/json/boolean.
  - `apps/admin/src/pages/DatabasePage.tsx` — компонент `FieldInput` рендерит правильный input по `meta.type`: enum -> `<select>`, datetime -> `<input type="datetime-local">`, number -> `<input type="number">`, json -> `<textarea>` с auto-pretty, boolean -> 2 кнопки + опция null. EditModal/InsertModal используют `serializeForSubmit`: ISO datetime, JSON.parse, null для пустых nullable.
  - `apps/admin/src/components/admin/ActivityLogPanel.tsx` (NEW) — общий компонент истории на audit_log с табами Важные / Вся, dot-color по тону action.
  - `apps/admin/src/pages/UserDetailPage.tsx` — добавлена правая колонка с `<ActivityLogPanel entityType="User"/>` (раньше не было audit-log).
  - `apps/admin/src/pages/StoreDetailPage.tsx` — inline-блок аудита заменён на `<ActivityLogPanel entityType="Store"/>`.
  - `apps/api/src/modules/auth/services/token.service.ts` — добавлен `getAccessTokenTtlSeconds()` (парсит `15m`/`1h`/`3600s`).
  - `apps/api/src/modules/admin/use-cases/admin-auth.use-case.ts` — `expiresIn: 3600` хардкод заменён на `tokenService.getAccessTokenTtlSeconds()`.
- **Что сделано:** Суперадмин теперь видит правильный UI для каждого типа колонки. Бэкенд coerces строки с фронта в нативные Prisma-типы и валидирует enum/datetime/number/json до записи. История действий теперь видна на UserDetailPage (раньше была только на SellerDetailPage и StoreDetailPage).
- **Проверка:** `tsc --noEmit` зелёный для apps/api и apps/admin.
- **Не сделано (вне MVP):** richer activity feed для магазина (заказы + чаты + RBAC + поведение покупателей через analytics_events) — нужен новый endpoint, отложено.


### POLAT-ZONE-WAVE2-A11Y-SEC-DB (09.05.2026)

- **Важность:** P0 (security + a11y + DB integrity)
- **Дата:** 09.05.2026
- **Файлы:**
  ADMIN a11y:
  - `apps/admin/src/lib/use-focus-trap.ts` (NEW) — хук focus-trap + Escape + return focus.
  - `apps/admin/src/components/admin/DialogShell.tsx` (NEW) — стандартная модалка с role="dialog"/aria-modal/focus-trap/Escape/backdrop close.
  - `apps/admin/src/pages/AdminUsersPage.tsx` — ModalShell теперь использует useFocusTrap + role="dialog"/aria-modal/aria-labelledby/tabIndex=-1.
  - `apps/admin/src/pages/UserDetailPage.tsx` — обе модалки (suspend, impersonate) переведены на DialogShell + aria-label/aria-invalid/aria-describedby/role="alert".
  - `apps/admin/src/pages/StoreDetailPage.tsx` — ConfirmModal на DialogShell + aria-label на textarea.
  - `apps/admin/src/pages/LoginPage.tsx` — OTP в `<fieldset><legend>` + role="group" + autoComplete="one-time-code" + per-input aria-label. Theme toggle 32px → 44px (w-11 h-11) + aria-label.
  - `apps/admin/src/pages/CategoriesPage.tsx`, `apps/admin/src/pages/SellerDetailPage.tsx` — aria-label="Закрыть" на icon-only close-кнопки.

  API security:
  - `apps/api/src/modules/admin/admin.controller.ts` — `'HIDDEN_BY_ADMIN' as any` / `'ACTIVE' as any` / `status as any` → `ProductStatus` enum (импорт из @prisma/client). Узкая валидация query-параметра status через `Object.values(ProductStatus).includes(...)`.
  - `apps/api/src/modules/admin/use-cases/admin-create-seller.use-case.ts` — `'SELLER' as any` → `UserRole.SELLER`, `'VERIFIED'` → `SellerVerificationStatus.VERIFIED`.
  - `apps/api/src/modules/stores/dto/replace-directions.dto.ts` (NEW) — DTO с class-validator (IsArray + ArrayMaxSize(10) + IsString({ each: true })).
  - `apps/api/src/modules/stores/stores.controller.ts` — `@Body() body: { ids?: unknown }` + runtime `Array.isArray` → `@Body() body: ReplaceDirectionsDto` (валидируется ValidationPipe). Удалён `BadRequestException` импорт.

  DB schema (DB-AUDIT-002):
  - `packages/db/prisma/schema.prisma` — User: добавлены `referrer User? @relation("UserReferrals", fields: [referredBy], references: [id], onDelete: SetNull)` + `referrals User[]` + `@@index([referredBy])`. Product: `inventoryMovements InventoryMovement[]`. InventoryMovement: `product Product @relation(fields: [productId], references: [id], onDelete: Restrict)` + `@@index([productId])`.
  - `packages/db/prisma/migrations/20260509230000_user_referrer_inventory_product_fk/migration.sql` (NEW) — safe backfill (UPDATE referredBy=NULL для orphan, DELETE inventory_movements для orphan productId) + ADD CONSTRAINT FK + индексы.

- **Что сделано:**
  - **A11y:** все админские модалки получили focus-trap, Escape-close, return focus, role="dialog"/aria-modal. OTP login входит в WCAG (fieldset/legend + per-input aria-label + autoComplete="one-time-code"). Hit-area theme toggle 44×44.
  - **Security:** убраны 4 опасных `as any` касты обходящих Prisma enum валидацию. `stores/directions` body теперь валидируется class-validator вместо runtime `Array.isArray`.
  - **DB integrity:** orphan referrals и orphan inventory movements теперь невозможны. Self-FK с SetNull = referral history сохраняется при удалении пригласившего.

- **Проверка:**
  - `pnpm db:generate` — успех.
  - `tsc --noEmit` зелёный для apps/api и apps/admin.

- **Не сделано (вне P0):** split products.controller.ts (947 LOC) + admin.controller.ts (702 LOC), Swagger setup (API-SWAGGER-001), Enum-конверсия 9 String-полей (P1), N+1 в storefront (P1), refund→Click/Payme reverse-tx (P0 финансовая интеграция, отложено до Phase 4).


### POLAT-ZONE-WAVE3-4 (09.05.2026) — pagination + perf + enums + controller split

- **Важность:** P1 (UX consistency + performance + maintainability)
- **Дата:** 09.05.2026
- **Файлы:**
  ADMIN UX:
  - `apps/admin/src/components/admin/PaginationBar.tsx` (NEW) — общий компонент с opacity 0.4 на disabled, aria-label на prev/next.
  - `apps/admin/src/pages/DatabasePage.tsx` / `UsersPage.tsx` / `AnalyticsEventsPage.tsx` / `AuditLogsPage.tsx` — мигрированы на PaginationBar.
  - `apps/admin/src/pages/DashboardPage.tsx` — `—` placeholder заменён на анимированный skeleton.
  - `apps/admin/src/pages/SellerDetailPage.tsx` — inline audit-log (~70 LOC) заменён на shared `<ActivityLogPanel entityType="User"/>`.

  API perf:
  - `apps/api/src/modules/products/products.controller.ts` — `attachStoreImageUrls(stores[])` helper делает один `findMany` на все logoMediaId/coverMediaId. `searchStorefront` (был N+1: per-store вызов resolveStoreImageUrls) и `listStorefrontStores` теперь батчатся через общий метод.

  API arch split:
  - `apps/api/src/modules/admin/admin-db.controller.ts` (NEW) — выделен subdomain DB Manager (6 endpoints: list/get/getRows/update/delete/insert). AdminController -=1 inject (DbManagerUseCase) и -97 LOC.
  - `apps/api/src/modules/admin/admin.controller.ts` — DB endpoints удалены.
  - `apps/api/src/modules/admin/admin.module.ts` — AdminDbController зарегистрирован.

  DB enums:
  - `packages/db/prisma/schema.prisma` — CartStatus enum (ACTIVE/CONVERTED/MERGED/EXPIRED), RefundStatus enum (PENDING/COMPLETED/FAILED/REVERSED).
  - `packages/db/prisma/migrations/20260509233000_cart_refund_status_enums/migration.sql` (NEW) — CREATE TYPE + ALTER COLUMN с CASE-конверсией lowercase→UPPERCASE.
  - `apps/api/src/modules/cart/repositories/cart.repository.ts` (×8 touchpoints) / `apps/api/src/modules/checkout/repositories/checkout.repository.ts` (×1) / `apps/api/src/modules/admin/use-cases/refund-order.use-case.ts` (×2) — переведены на enum constants из @prisma/client.

  TMA build fix:
  - `apps/tma/src/pages/seller/EditProductPage.tsx` — удалён unused `Spinner` import (Railway TMA build падал на TS6133).

- **Что сделано:**
  - **UX:** disabled pagination теперь визуально читается, dashboard не показывает `—` как «значение», SellerDetail/UserDetail/StoreDetail используют один и тот же ActivityLogPanel.
  - **Perf:** N+1 fix в storefront search (на 30 stores было 31 query → 2 query).
  - **Maintainability:** AdminController -97 LOC, выделен чистый subdomain.
  - **Type safety:** Cart.status и OrderRefund.status валидируются Prisma enum.
  - **Critical:** TMA Railway build снова работает.

- **Деплой:**
  - `main` push → 6 коммитов (a18a9c6...d848f0b)
  - `tma` ветка → telegram-app redeploy
  - `api` ветка → savdo-api redeploy + 3 миграции (User.referredBy FK, InventoryMovement.productId FK, Cart/Refund enums)
  - `admin` ветка → admin redeploy (PaginationBar, DialogShell, ActivityLogPanel, DB Manager FieldInput, DashboardPage skeleton)

- **Verified:** `tsc --noEmit` зелёный для apps/api и apps/admin после каждой волны.


### POLAT-ZONE-WAVE5+P3018-RECOVERY (09.05.2026 23:00-23:55 GMT+5)

- **Важность:** P0 (production block) + P1 (controller splits)
- **Дата:** 09.05.2026
- **Файлы:**

  Wave 5 — admin.controller split (continued):
  - `apps/api/src/modules/admin/admin-broadcast.controller.ts` (NEW, 75 LOC)
  - `apps/api/src/modules/admin/admin-analytics.controller.ts` (NEW, 73 LOC)
  - `apps/api/src/modules/admin/admin-ops.controller.ts` (NEW, 102 LOC) — system/health, feature-flags, media migration
  - `apps/api/src/modules/admin/admin-products.controller.ts` (NEW, 150 LOC) — list / hide / restore / archive / forceDelete
  - `apps/api/src/modules/admin/admin.controller.ts` (702 LOC -> 407 LOC, -42%)
  - Также убран последний `'ARCHIVED' as any` cast → `ProductStatus.ARCHIVED`.

  P3018 hotfix saga (4 итерации миграции `cart_refund_status_enums`):
  - v1 упал в проде с unknown error в `ALTER COLUMN TYPE ... USING CASE`. Failed → P3009 заблокировал всё.
  - v2 (`information_schema.data_type` IF guard + idempotent CREATE TYPE) — IF guard сработал но USING expression упал с `operator does not exist: "CartStatus" = text`.
  - v3 (`pg_type.typname` IF guard + `"status"::text` cast в COALESCE) — то же самое падение.
  - **v4 (рабочая)** — отказ от `ALTER COLUMN TYPE / USING` в пользу swap-column паттерна:
    1. ADD COLUMN status_v4_new <enum> DEFAULT
    2. UPDATE с CASE (UPDATE с типами работает корректно)
    3. DROP COLUMN status CASCADE
    4. RENAME COLUMN status_v4_new TO status
    5. CREATE INDEX (CASCADE убил старый)
  - `packages/db/prisma/migrations/20260509233000_cart_refund_status_enums/migration.sql` — финальная v4 версия.

  Hotfix в скриптах (для разблокировки failed-state в проде):
  - `packages/db/package.json` — `migrate:deploy` на время содержал `prisma migrate resolve --rolled-back ... || true && prisma migrate deploy` → откатил после успешного деплоя.
  - `apps/api/start.sh` — был добавлен resolve-loop в начало → откатил.

- **Что сделано:**
  - **Production unblocked:** API задеплоен после ~5 итераций. Migration applied. Telegram bot/webhook reзарегистрированы. Auth/auto-боты работают.
  - **AdminController:** 702 → 407 LOC, deps 29 → 24, 5 чистых subdomain-контроллеров (Db / Broadcast / Analytics / Ops / Products).

- **Урок:** `ALTER COLUMN TYPE ... USING <CASE>` в PostgreSQL может фейлиться даже при правильном typing'е. Для будущих String→Enum миграций использовать swap-column как primary паттерн.

- **Verified:** Railway savdo-api `Active` + Deployment successful + NestJS up.


### POLAT-ZONE-WAVE6-ADMIN-PAGES-FIX (09.05.2026 23:50 GMT+5)

- **Важность:** P0 (admin страницы не работали)
- **Файлы:**
  - `apps/admin/src/pages/SystemHealthPage.tsx` — `'/admin/system/health'` → `'/api/v1/admin/system/health'` (был пропущен префикс `/api/v1`)
  - `apps/admin/src/pages/FeatureFlagsPage.tsx` — то же исправление
  - `apps/api/src/main.ts` — Bull Board middleware теперь принимает либо legacy `BULL_BOARD_TOKEN`, либо валидный admin JWT (через `JwtService.verify()` + `role === 'ADMIN'` check)
  - `apps/admin/src/App.tsx` `QueuesRedirect` — добавлен `?token=<accessToken>` параметр из `auth.getAccess()`
- **Что сделано:** все 3 страницы DevOps-секции (Состояние системы, Feature flags, Очереди Bull) теперь работают для любого залогиненного admin без ручной установки `BULL_BOARD_TOKEN` env var.

### POLAT-ZONE-SESSION-09.05.2026 (итог)

**Time:** ~22:00 → 23:55 GMT+5 (~2 часа)
**Commits in main (this session):** ~30
**Production state:** ✅ всё деплоится, savdo-api Active, миграции применены
**Branches deployed:** main, tma, api, admin

**Wave 1:** DB Manager UX (proper inputs per type) + ActivityLogPanel (User/Store/Seller details)
**Wave 2:** Modal a11y (DialogShell + focus-trap + OTP fieldset) + 4 `as any` cleanup + DTO validation + DB FKs (User.referredBy + InventoryMovement.productId)
**Wave 3:** TMA Spinner build fix + PaginationBar + Cart/RefundStatus enums (миграция swap-column)
**Wave 4:** N+1 storefront perf + Dashboard skeleton + AdminDbController split
**Wave 5:** Broadcast/Analytics/Ops/Products subdomain split (admin.controller 702 → 407 LOC) + 5-й `as any` убран
**Hotfix saga:** P3018 cart_refund migration v1→v4 (swap-column решило)
**Wave 6:** SystemHealthPage / FeatureFlagsPage URL fix + Bull Board JWT auth

**Что осталось для следующей сессии (см. analiz/logs.md AUDIT-POLAT-ZONE):**

P0:
- products.controller.ts: 4+ `as unknown as` casts (lines 106, 638, 679, 793)
- orders.controller.ts:66, chat/send-message.use-case.ts:127 — `as any` cleanup
- chat/send-message.use-case.ts:115-124 — duplicate `findMessageById` call

P1:
- Enum конверсии (через swap-column паттерн): ModerationCase.status/caseType, ModerationAction.actionType (7+ values), SellerVerificationDocument.status/documentType, InAppNotification.type, ChatMessage.messageType
- Split products.controller.ts (947 LOC, риск, нужны тесты)
- Split admin.controller.ts оставшиеся 407 LOC (users/sellers/stores subdomains)
- Split confirm-checkout.use-case.ts (254 LOC)
- Setup @nestjs/swagger (нужен pnpm install)
- Structured logging migration

P2: testing gap, DB integrity hardening (VarChar length-limits, CHECK constraints).


### POLAT-ZONE-WAVE7-10 (10.05.2026 утром)

- **Дата:** 10.05.2026
- **Файлы:**

  **Wave 7 — Moderation enums:**
  - `packages/db/prisma/schema.prisma` — `ModerationCaseStatus` (OPEN/IN_REVIEW/CLOSED), `ModerationCaseType` (VERIFICATION/ABUSE/MANUAL_REVIEW), `ModerationActionType` (11 values: APPROVE/REJECT/REQUEST_CHANGES/ESCALATE + ASSIGN/CLOSE/REOPEN + HIDE/SUSPEND/RESTORE/BLOCK).
  - `packages/db/prisma/migrations/20260510080000_moderation_enums/` — swap-column для 3 колонок.
  - Code: `moderation/repositories/moderation.repository.ts`, `moderation/services/moderation-trigger.service.ts`, `moderation/use-cases/{assign-case,take-action}.use-case.ts`, `moderation/dto/list-cases.dto.ts`, `moderation/moderation.controller.ts`, admin SPA `ModerationPage.tsx`, `ModerationDetailPage.tsx`. Bonus: 2 `as any` касты в take-action убраны → `SellerVerificationStatus.*` / `StoreStatus.*` enum.

  **Wave 8 — SellerVerificationDocument enums + verify-seller-extended cleanup:**
  - `SellerVerificationDocumentType` (PASSPORT/BUSINESS_DOC/OTHER) + `SellerVerificationDocumentStatus` (PENDING/APPROVED/REJECTED).
  - `verify-seller-extended.use-case.ts` — `VALID_STATUSES` const → `Object.values(SellerVerificationStatus)`, убран `input.status as any` каст, literals → enum constants.
  - Migration `20260510080500_seller_verification_doc_enums`.

  **Wave 8b — ChatMessage.messageType enum:**
  - `ChatMessageType` (TEXT/IMAGE/SYSTEM).
  - `chat/repositories/chat.repository.ts`, `chat/use-cases/send-message.use-case.ts`, `chat/use-cases/get-thread-messages.use-case.ts`. Убран `(message as any).messageType` cast.
  - Migration `20260510081000_chat_message_type_enum`.

  **Wave 9 — InAppNotification.type enum:**
  - `InAppNotificationType` (ORDER_STATUS_CHANGED, STORE_APPROVED, STORE_REJECTED, NEW_ORDER, NEW_MESSAGE, SELLER_VERIFIED, MODERATION_ACTION, GENERIC).
  - Legacy dotted/snake_case (`order.status_changed`, `store.approved` etc) маппятся в UPPERCASE_SNAKE_CASE.
  - Type-safe `notifyInApp(type: InAppNotificationType, ...)` + `createInAppDirect(type: InAppNotificationType, ...)` + `InAppNotificationJobData.type`.
  - Migration `20260510081500_in_app_notification_type_enum`.

  **Wave 10 — products.controller `as unknown as` cleanup:**
  - `apps/api/src/modules/products/repositories/products.repository.ts` — 5 типизированных include'ов через `Prisma.validator<Prisma.ProductInclude>()`:
    - `sellerProductInclude` / `SellerProductListItem` — для `findByStoreId`
    - `publicProductInclude` / `PublicProductListItem` — для `findPublicByStoreId`
    - `sellerProductDetailInclude` / `SellerProductDetail` — для `findById`
    - `publicProductDetailInclude` / `PublicProductDetail` — для `findPublicById`
    - `searchProductInclude` / `SearchProductHit` — для `searchPublic`
    - `allPublicProductInclude` / `AllPublicProductItem` — для `findAllPublic`
  - `apps/api/src/modules/products/products.controller.ts` — **9 `as unknown as` cast'ов и 2 `(store as any).isPublic` cast'а удалены**. Контроллер теперь читает поля напрямую через типизированные payload'ы.
  - Bonus: 3 `'ACTIVE'` string literal → `ProductStatus.ACTIVE` в repo.

- **Что сделано:**
  - **Все P1 enum-конверсии из аудита закрыты** (Moderation x3, SVD x2, ChatMessage, InAppNotif). 6 миграций swap-column.
  - **Type safety в products.controller (947 LOC)** — главный источник schema-drift риска убран.
  - **6 `as any` cast'ов** удалены в этой сессии (по итогам всех волн ~10 за день).

- **Деплой:**
  - main pushed → tma/api/admin merged + pushed → Railway redeploys.
  - 4 новые миграции прогонятся на api redeploy через swap-column паттерн (стабильный).

- **Verified:** `tsc --noEmit` зелёный после каждой волны.

- **Что осталось из P1/P2:**
  - Split products.controller.ts (947 LOC) на ProductsSellerController + StorefrontController — теперь без cast'ов рискованнее меньше.
  - Split admin.controller.ts оставшиеся 407 LOC (users/sellers/stores).
  - Split confirm-checkout.use-case.ts (254 LOC).
  - `@nestjs/swagger` setup.
  - Structured logging.
  - 2 мелких `as any` в `products.repository.ts` (для Prisma JSON field) — Prisma quirk.


### POLAT-ZONE-WAVE11-12 (10.05.2026 продолжение) — split monolithic controllers

- **Wave 11 — products.controller.ts split:**
  - `apps/api/src/modules/products/services/product-presenter.service.ts` (NEW) — общий сервис: `toPrice`, `normalizeVariant`, `resolveImageUrl`, `resolveStoreImageUrls`, `attachStoreImageUrls`. Раньше 5 private методов в одном controller.
  - `apps/api/src/modules/products/storefront.controller.ts` (NEW, 315 LOC) — все 8 публичных storefront routes:
    - `storefront/stores`, `storefront/stores/:slug`, `storefront/search`
    - `stores/:slug`, `stores/:slug/products`, `stores/:slug/products/:id`
    - `storefront/products`, `storefront/products/:id`
  - `products.controller.ts`: **947 → 587 LOC (-38%)**. Только seller-routes (products/variants/option-groups/images/attributes).

- **Wave 12 — admin.controller.ts split:**
  - `apps/api/src/modules/admin/services/admin-context.service.ts` (NEW) — единый `requireAdmin(jwt)` helper. Раньше дублировался в каждом split controller.
  - `apps/api/src/modules/admin/admin-users.controller.ts` (NEW, 106 LOC) — 5 routes (list/get/suspend/unsuspend + make-seller).
  - `apps/api/src/modules/admin/admin-sellers.controller.ts` (NEW, 99 LOC) — 4 routes (list/get/verify + create-store).
  - `apps/api/src/modules/admin/admin-stores.controller.ts` (NEW, 124 LOC) — 8 routes (list/get + suspend/unsuspend/reject/archive + approve/unapprove).
  - `admin.controller.ts`: **702 → 169 LOC (-76%)**. Inject deps **29 → 7**. Остались: audit-log GET, search GET, orders cancel PATCH, orders list GET.

- **Итог split-серии (Wave 5 + 11 + 12):**
  - `AdminController`: 702 → 169 LOC, 8 sub-controllers
  - `ProductsController`: 947 → 587 LOC, 1 sub-controller (StorefrontController) + ProductPresenterService
  - 2 новых service'а (AdminContextService, ProductPresenterService) убирают дублирование

- **Verified:** `tsc --noEmit` зелёный после каждой волны. Public route paths unchanged.

- **Push:** main → api → Railway redeploy.

### POLAT-ZONE-WAVE13 (10.05.2026) — confirm-checkout split + checkout module type-safety

- **Файлы:**
  - `apps/api/src/modules/products/repositories/variants.repository.ts` — добавлен `VariantWithOptions = Prisma.ProductVariantGetPayload<{ include: { optionValues: { include: { optionValue: true } } } }>`. `findById` теперь возвращает этот типизированный payload.
  - `apps/api/src/modules/checkout/services/validate-cart-items.service.ts` (NEW, 152 LOC, 0 cast'ов) — валидация items: ACTIVE product + variant принадлежит + stock + variantLabel из optionValues. Бросает `CHECKOUT_ITEMS_UNAVAILABLE` с полным `invalidItems[]`.
  - `confirm-checkout.use-case.ts`: **254 → 149 LOC (-41%)**. Тонкий orchestrator: auth → load cart → validate items → compute totals → create order → notify. Все 15 `as any` убраны.
  - `preview-checkout.use-case.ts`: 13 `as any` убраны через типизированный variant access.
  - `create-direct-order.use-case.ts`: 11 `as any` убраны.
  - 3 `'ACTIVE'` string literals → `ProductStatus.ACTIVE` enum.
  - `checkout.module.ts`: + ValidateCartItemsService.

- **Net:** checkout module **полностью type-safe** на compile-time. ~39 cast'ов удалены за один коммит.

- **Verified:** `tsc --noEmit` зелёный.

### POLAT-ZONE-WAVE14 (10.05.2026) — tests + Swagger setup

- **Wave 14a — ValidateCartItemsService unit tests:**
  - `apps/api/src/modules/checkout/services/validate-cart-items.service.spec.ts` (NEW, 12 cases).
  - Покрытие: empty input, happy path (5 веток), product validation (2), variant validation (4), multiple invalids collection (1).
  - Финансовый flow — все ветки checkout валидации проверены.
  - **142/142 tests passing** (было 130, сейчас 142, +12 кейсов).

- **Wave 14b — Swagger / OpenAPI:**
  - `pnpm install @nestjs/swagger@^7.4.2` (matches existing nestjs/core@10.x).
  - `apps/api/src/main.ts` — DocumentBuilder + SwaggerModule.setup на `/api/v1/docs`. Bearer JWT auth scheme. 7 tags для группировки.
  - 19 controllers получили `@ApiTags` + `@ApiBearerAuth('jwt')`:
    - admin (10): admin/super-admin + 8 sub-controllers (analytics/broadcast/db/ops/products/sellers/stores/users)
    - seller: products.controller
    - storefront: storefront.controller
    - buyer: checkout.controller, cart.controller
    - chat: chat.controller
    - moderation: moderation.controller
    - auth: auth.controller
  - Endpoints всё ещё protected guard'ами — Swagger doc только описывает.

- **Verified:**
  - `tsc --noEmit` зелёный
  - `nest build` зелёный
  - 142 tests pass

- **Net (текущая сессия — Wave 7-14):**
  - 5 enum-конверсий (Moderation/SVD/ChatMessage/InAppNotif) через swap-column
  - products.controller 947 → 587 LOC + StorefrontController 315 LOC + ProductPresenterService
  - admin.controller 702 → 169 LOC + 8 sub-controllers + AdminContextService
  - confirm-checkout.use-case 254 → 149 LOC + ValidateCartItemsService
  - **~80+ `as any` / `as unknown as` casts** удалены через Prisma.validator + enum constants
  - 12 новых unit tests для финансово-критичного flow
  - Swagger UI на `/api/v1/docs`

### POLAT-ZONE-WAVE15-17 (10.05.2026) — больше unit-тестов для критичных use-cases

- **Wave 15 — ConfirmCheckoutUseCase orchestrator:**
  - `apps/api/src/modules/checkout/use-cases/confirm-checkout.use-case.spec.ts` (NEW, 19 cases).
  - Покрытие: OTP guard, cart validation, buyer/store load, total computation, customer override (BUG-WB-AUDIT-009), order/cart/socket/TG side-effects ordering, error rollback (createOrder fails → cart NOT cleared).
  - **161/161 passing** (было 142, +19).

- **Wave 16 — VerifyOtpUseCase:**
  - `apps/api/src/modules/auth/use-cases/verify-otp.use-case.spec.ts` (NEW, 16 cases).
  - Покрытие: brute-force protection (SEC-002), OTP not found / invalid + recordFailedAttempt, user resolution (new/existing/missing buyer), JWT claims (BUYER/SELLER/ADMIN+MFA), session.expiresAt = +30d, refreshToken format `<sessionId>.<rawToken>`.
  - **177/177 passing** (было 161, +16).

- **Wave 17 — UpdateOrderStatusUseCase:**
  - `apps/api/src/modules/orders/use-cases/update-order-status.use-case.spec.ts` (NEW, 22 cases).
  - Покрытие state-machine: 7 SELLER transitions (table-driven), 3 BUYER cases, 3 forbidden transitions (skip/anti-progression/re-life), store ownership (foreign 403), side effects (emit + TG notify both, fire-and-forget on error, BUYER-cancels-PENDING → seller notify).
  - **199/199 passing** (было 177, +22).

- **Net (Wave 14-17 — все тесты):**
  - 4 новых spec'а: ValidateCartItemsService (12), ConfirmCheckoutUseCase (19), VerifyOtpUseCase (16), UpdateOrderStatusUseCase (22) = +69 кейсов
  - **Test coverage:** было 130 → стало **199 cases** (+53%)
  - Покрыты: financial validation (checkout), auth (OTP verification), order state machine — 3 из самых security/finance критичных use-cases.

- **Что осталось из P1 testing list:**
  - CreateProductUseCase — seller flow, валидация duplicate SKU + storeId guard
  - SuspendUserUseCase / SuspendStoreUseCase — admin actions с audit log
  - SendOtpUseCase — companion к VerifyOtp (rate-limit, Telegram delivery)
  - E2E (отдельная сессия, нужен отдельный jest config с DB)

### POLAT-ZONE-WAVE18-20 (10.05.2026) — продолжение test coverage

- **Wave 18 — ChangeProductStatusUseCase:** 18 cases. Coverage: 4 allowed transitions (DRAFT↔ACTIVE, ACTIVE↔ARCHIVED), 4 forbidden (skip/backwards/HIDDEN_BY_ADMIN), HIDDEN_BY_ADMIN guard, ownership check, TG auto-post (0/1/2+ TG photos, R2-only filtered, depublish doesn't post, fire-and-forget on fail).
- **Wave 19 — SuspendUser + SuspendStore:** 10 cases. INV-A01 audit + INV-A02 reason. Already-suspended → 409. Order: status BEFORE audit.
- **Wave 20 — AdminCancelOrder + UnsuspendUser + UnsuspendStore:** 19 cases. Terminal status guard (DELIVERED/CANCELLED), 4 non-terminal cancellable, symmetric unsuspend tests.

- **Net (Wave 14-20 — все тесты):**
  - 7 новых spec'ов: ValidateCartItems (12) + ConfirmCheckout (19) + VerifyOtp (16) + UpdateOrderStatus (22) + ChangeProductStatus (18) + SuspendUser/Store (10) + AdminCancelOrder/Unsuspend (19) = +116 кейсов
  - **Test coverage:** 130 → **246 cases (+89%)**
  - 8 → **20 spec файлов** (+150%)
  - Покрыты все P1/P0 critical use-cases по аудиту: financial validation, auth, order state machine, product publishing, admin moderation actions, order cancellation.

### POLAT-ZONE-WAVE21-22 (10.05.2026) — store moderation + broadcast tests

- **Wave 21 — Store moderation:** Approve / Reject / Archive / Unapprove use-cases. 20 cases объединены в один spec (общий AdminRepository mock). Покрытие: not-found, invalid source status (test.each), happy path + audit log shape.
- **Wave 22 — BroadcastUseCase:** 13 cases. TG broadcast critical: audience filter (sellers/buyers/all), chatId resolution + dedup (seller.telegramChatId wins over user.telegramId, Set-based dedup), previewMode skip log/queue, rate limit (34ms delay = 30 msg/sec), broadcastLog creation, getHistory.

- **Test coverage итого (Wave 14-22):**
  - 130 → **279 cases (+115%)**
  - 8 → **22 spec files (+175%)**
  - Покрыто: ValidateCartItems / ConfirmCheckout / VerifyOtp / UpdateOrderStatus / ChangeProductStatus / SuspendUser / SuspendStore / UnsuspendUser / UnsuspendStore / AdminCancelOrder / ApproveStore / RejectStore / ArchiveStore / UnapproveStore / Broadcast — все P0/P1 critical use-cases из аудита.

### POLAT-ZONE-WAVE23-24 (10.05.2026) — admin/seller/cart tests

- **Wave 23 — AdminUsersManagement (16) + VerifySellerExtended (14):** privilege escalation surface (только super_admin manages admins), self-action protection (нельзя себя revoke/changeRole), seller verification status enum + reason для REJECTED/SUSPENDED + isBlocked side effects + audit log fail tolerance.
- **Wave 24 — Cart use-cases:** MergeGuestCart (8) — guest→buyer cart merge при логине + INV-C01 store conflict → guest wins. AddToCart (13) — INV-C03 product/variant ACTIVE+stock, INV-C01 store match, duplicate increment с capacity 100, priceOverride/salePriceOverride.

- **Test coverage итого (Wave 14-24):**
  - 130 → **330 cases (+154%)**
  - 8 → **26 spec files (+225%)**
  - Покрыты все P0/P1 critical use-cases из аудита: финансы (cart/checkout/order/refund), auth (OTP/JWT), state machines (order/product), moderation (suspend/approve/reject/archive/unapprove), admin management (privileges), broadcasts (rate-limit/dedup), seller verification.
