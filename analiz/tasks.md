# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 🚨 PLATFORM AUDIT 10.05.2026 — Pre-launch findings (5 perspectives + endpoint inventory)

> Полные отчёты от 5 параллельных аудит-агентов сохранены в conversation 10.05.2026.
> Score: 6.4/10 общий (TMA 7, web-buyer 7, web-seller 8, admin 4→9 после P0 fix, API 8.5).

## ✅ Закрыто 10.05.2026 (Полат, после аудита)

- [x] **`API-CHAT-THREAD-PRODUCT-PREVIEW-001`** — pinned product context
- [x] **`API-IDEMPOTENCY-KEY-001`** — Stripe-style idempotency
- [x] **`API-ORDERS-ALIAS-REMOVE-001`** — dead alias removed
- [x] **`API-SWAGGER-001`** + **`API-PRODUCTS-CTRL-SPLIT-001`** — verified done
- [x] **`API-DELETE-OLD-STASHES-001`** — stale stashes dropped
- [x] **`ADMIN-API-204-HANDLE-001`** ✅ 10.05.2026 — request<T> бросал SyntaxError на 204. Коммит `7b6a149`.
- [x] **`ADMIN-REFUND-TYPO-001`** ✅ 10.05.2026 — returnToWallet→returnedToWallet, возвраты теперь попадают на wallet. Коммит `7b6a149`.
- [x] **`ADMIN-MFA-STATUS-ENDPOINT-001`** ✅ 10.05.2026 — заменён на GET /admin/auth/me. Коммит `7b6a149`.
- [x] **`ADMIN-USERS-CONTRACT-001`** ✅ 10.05.2026 — 3 mismatch: GET shape, POST/PATCH field names, currentRole через /me. Коммит `7b6a149`.
- [x] **`ADMIN-LOGIN-MFA-CHALLENGE-001`** ✅ 10.05.2026 — step 3 TOTP input + POST /admin/auth/mfa/login. Без этого админы с MFA не могли войти. Коммит `7b6a149`.
- [x] **`TMA-EDIT-PRODUCT-CONFIRM-001`** ✅ 10.05.2026 — window.confirm() → confirmDialog (popup блокировался в TG mobile). Коммит `7b6a149`.
- [x] **`TMA-EDIT-PRODUCT-FETCH-001`** ✅ 10.05.2026 — ручной fetch DELETE → api() (refresh + cache-bust). Коммит `7b6a149`.

## 🔴 P0 — БЛОКЕРЫ ДЛЯ PRODUCTION (Полат)

### QA findings — критичные баги первого дня prod

- [x] **`API-STOCK-RACE-OVERSELL-001`** ✅ 10.05.2026 — atomic UPDATE с WHERE stockQuantity >= qty через $executeRaw. 0 rows affected → CHECKOUT_STOCK_INSUFFICIENT. Коммит `385246a`.
  - **Fix**: migration `ALTER TABLE product_variants ADD CONSTRAINT stock_non_negative CHECK (stockQuantity >= 0)`. В коде — `UPDATE ... WHERE stockQuantity >= ${qty} RETURNING` через `$queryRaw`. Если 0 rows affected → CHECKOUT_STOCK_INSUFFICIENT.
- [x] **`API-INV-O04-STOCK-RELEASE-001`** ✅ 10.05.2026 — orders.repository.updateStatus возвращает stock + InventoryMovement.ORDER_RELEASED при PENDING/CONFIRMED/PROCESSING → CANCELLED. refund-order full refund тоже. Tests +3. Коммит `385246a`.
  - **Fix**: на PENDING→CANCELLED, CONFIRMED→CANCELLED, PROCESSING→CANCELLED делать increment + InventoryMovement.ORDER_RELEASED запись. Тесты обязательны (race + concurrent).
- [x] **`API-ROLES-GUARD-ADMIN-BYPASS-001`** ✅ 10.05.2026 — bypass требует явный `@AllowAdminBypass()` декоратор. Admin endpoints через `@Roles('ADMIN')` — ничего не сломалось. Impersonation идёт через `/admin/auth/impersonate/:userId` (выдаёт BUYER/SELLER JWT). Коммит `045f1d7`.
  - **Fix**: убрать bypass. Где admin реально нужен — добавить опциональный декоратор `@AllowAdminRoleBypass()`.
- [x] **`API-DIRECT-ORDER-DOS-001`** ✅ 10.05.2026 — `@ArrayMinSize(1)` + `@ArrayMaxSize(50)` + `@Max(999)` quantity. Коммит `045f1d7`.
  - **Fix**: `@ArrayMaxSize(50)` + `@Min(0.01)` на `priceOverride` (variant=0 даёт бесплатные заказы).
- [x] **`API-VARIANT-PRICE-ZERO-001`** ✅ 10.05.2026 — verified `@Min(1)` уже есть в create-variant.dto и update-variant.dto. priceOverride < 1 заблокирован.
  - **Fix**: `@Min(0.01)` в DTO + `if (variant.priceOverride <= 0) throw VALIDATION_ERROR` в add-to-cart use-case.

## 🟠 P1 — Critical для launch (Полат)

- [x] **`API-N1-CHECKOUT-001`** ✅ 10.05.2026 — новые `findManyByIds(ids)` в ProductsRepo + VariantsRepo (Map<id,entity>). 2N → 2 SELECT IN. Tests +1. Коммит `7f10caf`. (ValidateCartItems можно оптимизировать отдельно — там тот же паттерн.)
  - **Fix**: `findMany({ where: { id: { in: ids } } })` один раз.
- [x] **`API-IDEMPOTENCY-FAIL-OPEN-001`** ✅ 12.05.2026 — `acquireLock` возвращает discriminated union ('acquired'/'busy'/'redis-down'). Interceptor → 503 SERVICE_UNAVAILABLE при Redis-down (fail-closed). Spec +1 case. Коммит `0829fb2`.
- [x] **`API-DELIVERY-FEE-CLIENT-CONTROLLED-001`** ✅ 10.05.2026 — backend computes из `store.deliverySettings`. fixed → fixedDeliveryFee, manual/none → 0. input.deliveryFee игнорируется. Tests +4. Коммит `7f10caf`.
  - **Fix**: backend сам считает deliveryFee от store.deliverySettings.
- [x] **`API-JWT-REVOCATION-001`** ✅ 10.05.2026 — verified already done. `JwtStrategy.validate` (`jwt.strategy.ts:52`) делает session DB lookup. После `deleteSession` в logout-session.use-case JWT с этим sessionId не пройдёт.
  - **Fix**: Redis blacklist `revoked:{jti}` до accessExpiresIn.
- [x] **`API-MULTER-LIMITS-001`** ✅ 10.05.2026 — `limits: { fileSize: 10*1024*1024 }` на 3 FileInterceptor в media.controller. Коммит `385246a`.
- [x] **`API-SWAGGER-PROD-CLOSE-001`** ✅ 10.05.2026 — Swagger выключен если `NODE_ENV='production'` (override через `SWAGGER_ENABLED=true`). Коммит `385246a`.
- [x] **`API-BULL-BOARD-DATA-LEAK-001`** ✅ 12.05.2026 — OTP code больше не в job.data. Ref-pattern: `codeRef = UUID` в job, реальный code в Redis по `otp:job:{ref}` TTL 10мин, processor резолвит+удаляет ref. Backward-compat для legacy jobs. Spec +1 case. Коммит `293efda`.
- [x] **`API-RBAC-CART-CROSS-SESSION-001`** ✅ 12.05.2026 — server-side UUID v4 validation для `x-session-token` (122 бита entropy, не подбирается). Невалидный → 400. Дополнительно: после merge guest cart status=MERGED, findBySessionKey filters by ACTIVE — украденный токен не работает. Коммит `0bf1681`.

## 🔴 P0 — Marketing blockers для launch (Полат + Азим, согласовать)

- [x] **`MARKETING-HOMEPAGE-DISCOVERY-001`** ✅ 13.05.2026 — Backend (Полат) + Frontend (Азим) закрыты. Slug-форма заменена на discovery page (HomeHero + chips + top stores + featured + recent + quick links). См. `analiz/done.md` 2026-05-13.
- [x] **`WEB-BUYER-CATALOG-001`** ✅ 13.05.2026 — /stores и /products catalog pages + homepage «Все →» links + desktop header nav `Магазины`/`Товары`. См. `analiz/done.md`.
- [x] **`WEB-SELLER-ONBOARDING-INTERCEPT-001`** ✅ 13.05.2026 — /become-seller explainer + onboarding 4→3 шага (-Step3 товар) + dashboard empty-state «Добавьте товар» + auth guards в seller-хуках (401-spam fix). См. `analiz/done.md`.
- [ ] **`API-STORES-PAGINATION-001`** 🟢 P3 (Полат) — `/storefront/stores` сейчас `take: 50` hardcoded в `findAllPublished` (`stores.repository.ts:59`). На 37 stores OK; при росте до 500+ — нужна server-side pagination (`page`/`limit`/`cursor`). Frontend в `/stores` каталоге уже готов потреблять paginated ответ.
- [x] **`WEB-SELLER-PRODUCT-PARITY-001`** ✅ 13.05.2026 — функциональный паритет с TMA (multi-photo + attributes + filters + variants matrix + stock editor). 3 фазы. См. `analiz/done.md`.
- [ ] **`API-PRODUCT-IMAGES-PATCH-001`** 🟢 P3 (Полат) — `PATCH /seller/products/:id/images/:imageId` для reorder/primary toggle. Сейчас отсутствует → web-seller edit reorder не сохраняется (только delete+recreate fallback). После добавления — web-seller подключит. Сейчас в `apps/api/src/modules/products/products.controller.ts:466-513` есть только POST (line 468) и DELETE (line 501).
- [ ] **`API-PRODUCT-IMAGES-BROKEN-SUPABASE-URLS-001`** 🟠 P1 (Полат) — На проде `/storefront/featured` возвращает мёртвые URLs вида `https://upjrcpxbewwceqthlzyd.supabase.co/storage/v1/object/public/savdo-public/product_image/2026/{uuid}.jpg` → 404. Подтверждено через Playwright: 3 из 5 продуктов на homepage web-buyer имеют `naturalWidth=0`. Миграция Supabase → R2/TG proxy не покрыла существующие записи `product_images`. Frontend defensive (web-buyer 14.05.2026, commit `0f1618e`): `<Image onError>` → fallback на «Без фото» placeholder. Backend нужен: либо bulk-rewrite старых URLs в R2/TG, либо deprecate этих записей (mediaUrls=[]) чтобы frontend сразу показывал placeholder без 404. Виден всем посетителям главной — подтянуть до больших маркетинговых пушей.
- [x] **`WEB-SELLER-STORE-CATEGORIES-CRUD-001`** ✅ 14.05.2026 (Азим) — отдельная страница `/store/categories` (list + inline edit + add form + delete confirm + move-up/down arrows). В Settings StoreCategoriesSection заменён на компактную ссылку. Backend `/seller/categories` уже был. Подробности в `analiz/done.md`.
- [x] **`MARKETING-SEO-INFRA-001`** ✅ 11.05.2026 — `<html lang>` → ru. `sitemap.ts` (home + 4 legal). `robots.ts` (allow / disallow privates). `manifest.ts` (Savdo PWA). JSON-LD Organization sitewide + Product schema на product layout (UZS pricing, schema.org/Offer). Зона Азима.
- [~] **`MARKETING-LOCALIZATION-UZ-001`** 🔴 — **Инфра ✅ 12.05.2026 (Полат, TMA):** `apps/tma/src/lib/i18n/` zero-deps React Context — `ru.ts` (default) + `uz.ts` (Latin, обратный апостроф `ʻ` U+02BB). `useTranslation()` hook возвращает `{ t, locale, setLocale }` с `{name}` интерполяцией. Auto-detect через `tg.initDataUnsafe.user.language_code` (`ru`→ru, `uz`→uz, иначе ru-fallback). Сохранение в `localStorage['savdo_locale']`. `<html lang>` обновляется. SettingsPage: переключатель `Русский` / `Oʻzbek` с haptic. StoresPage (главная): заголовок, табы, плейсхолдер поиска, sort labels, verified badge — все через `t()`. **Skill записан:** `.claude/skills/uzbek-translator/SKILL.md` (правила алфавита, грамматика, e-commerce глоссарий 60+ терминов, чек-лист). **Осталось:** мигрировать остальные TMA страницы (Cart, Checkout, Orders, Product, Profile, Wishlist), admin локализацию, web-buyer/web-seller (Азим), API Accept-Language для уведомлений.
- [x] **`MARKETING-PUBLIC-OFFER-PAGES-001`** ✅ 11.05.2026 — 4 страницы (/terms, /privacy, /offer, /refund) с прозой на русском, shared `LegalPage` компонент. Checkout footer теперь линкует на /offer и /privacy underlined. Реквизиты юр.лица в /offer — placeholder, нужны после регистрации.
- [ ] **`MARKETING-PAYMENT-CLICK-PAYME-001`** 🔴 — Online payment `disabled: true` в checkout. 75% UZ e-com через Click/Payme. **Cash-only = провал conversion**. (Backend реализация после открытия бизнес-счёта.)

## 🟠 P1 — Marketing should-have

- [x] **`MARKETING-REVIEWS-SHOW-001`** ✅ 11.05.2026 — `ProductReviews` компонент (`components/store/ProductReviews.tsx`) рендерит секцию между Characteristics и «Из этого магазина». `useProductReviews` hook. Average rating + count + плюрализ + Stars + author + date + comment. API уже был, фронт его не использовал.
- [x] **`MARKETING-VERIFIED-SELLER-001`** ✅ 12.05.2026 — Store schema fields (`isVerified` / `avgRating` / `reviewCount`) уже добавлены параллельной сессией с индексом `[isVerified, avgRating desc]`. **Сейчас добавил:** admin `POST /admin/stores/:id/verify|/unverify` (+ INV-A02 reason при unverify, INV-A01 audit, идемпотентность), сортировка `findAllPublished` / `searchPublic` в `stores.repository.ts` теперь `[isVerified desc, publishedAt desc]`, `reviews.repository.refreshStoreAggregate` (weighted-by-reviewCount). UI: TMA `StoresPage` карточки + `StorePage` шапка показывают ✓ badge + ⭐ rating (reviewCount), admin `StoresPage` имеет toggle Verify/Unverify в actions + galочку рядом с именем магазина в таблице.
- [x] **`MARKETING-CART-ABANDONMENT-001`** ✅ 12.05.2026 — cron `@EVERY_HOUR` в `CartAbandonmentService` сканирует `ACTIVE` корзины с `updatedAt < now-4h`, `items > 0`, `buyer.user.telegramId != null` (не ghost), `nudgeCount < 1`. Idempotency: помечаем `nudgeSentAt`+`nudgeCount` в БД ДО `queue.add` (через `updateMany WHERE nudgeCount < MAX` — защита от race между инстансами). Job `TELEGRAM_JOB_CART_ABANDONED` шлёт TG nudge с deep-link `?startapp=cart_<slug>`. Schema: `Cart.nudgeSentAt`, `Cart.nudgeCount` + композитный индекс `[status, nudgeSentAt, updatedAt]`. Migration `20260512180000_cart_abandonment_tracking`. Env-flag `CART_ABANDONMENT_ENABLED=false` для отключения. Все 57 cart-тестов passed.
- [x] **`MARKETING-WISHLIST-NOTIFY-001`** ✅ 13.05.2026 — Schema: `BuyerWishlistItem.priceSnapshot`/`inStockSnapshot`/`notifiedAt`/`notifiedReason` + индекс `notifiedAt`. Migration `20260513150000_wishlist_notify_tracking`. `AddToWishlistUseCase` сохраняет snapshot из product (basePrice/salePrice + status/isVisible + variants stock). `WishlistNotifyService` cron `@EVERY_4_HOURS` сканирует кандидатов с заполненным snapshot, детектит PRICE_DROP (≥10%) и BACK_IN_STOCK (was OOS → now ACTIVE+stock), idempotency через updateMany WHERE notifiedAt expired, cooldown 7 дней, обновляет snapshot после nudge. Jobs `TELEGRAM_JOB_WISHLIST_PRICE_DROP` / `TELEGRAM_JOB_WISHLIST_BACK_IN_STOCK` в processor с HTML-template + deep-link `?startapp=product_<slug>_<id>`. Env-flag `WISHLIST_NOTIFY_ENABLED=false` отключает. Spec +5 cases, все 17 wishlist-тестов passed.
- [x] **`MARKETING-FAKE-RESPONSE-TIME-001`** ✅ 11.05.2026 — убраны 3 false claims: product page «отвечает за час» → conditional city, order detail PENDING eta «в течение часа» → «скоро рассмотрит», cart sticky strip «отвечает за час» → «написать продавцу».

## 🟠 P1 — UX fixes (моя зона apps/api + apps/admin + apps/tma)

### TMA seller (продавец теряет заказы)

- [x] **`TMA-SELLER-WS-NOTIFY-001`** ✅ 10.05.2026 — `apps/tma/src/lib/sellerNotifications.ts` + интеграция в SellerLayout. join-seller-room + listen + showToast + HapticFeedback. Re-join on reconnect. Коммит `23ddc7f`.
- [~] **`TMA-SELLER-MAIN-BUTTON-001`** — формы (AddProduct, EditProduct, Settings) не используют `tg.MainButton`. CTA теряется в скролле. **Прогресс 12.05.2026:** создан reusable hook `apps/tma/src/lib/useMainButton.ts` (text/onClick/visible/enabled/loading). Применён в `seller/SettingsPage.tsx` — MainButton показывается только при profileDirty, in-form кнопка скрыта когда `tg` доступен (fallback для dev в браузере). **Осталось:**
  - [x] **`TMA-SELLER-MAIN-BUTTON-002`** ✅ 13.05.2026 — AddProductPage MainButton текст по стадии валидации: «Выберите категорию» → «Добавьте фото» → «Введите название» → «Укажите цену» → «Заполните: {filter-label}» → «Добавьте размер» → «Опубликовать товар». Пользователь видит чего не хватает, не упирается в disabled.
  - [x] **`TMA-SELLER-MAIN-BUTTON-003`** ✅ 13.05.2026 — EditProductPage MainButton по тому же паттерну: «Выберите категорию» → «Введите название» → «Укажите цену» → «Сохранить изменения».
- [x] **`TMA-CART-DUPLICATE-WARNING-001`** ✅ 10.05.2026 — `confirmDialog` в StorePage перед reset cross-store cart. Коммит `5e486a3`.
- [x] **`TMA-CART-API-SYNC-001`** ✅ 12.05.2026 — Wave 8. Endpoint `POST /api/v1/cart/bulk-merge` + `BulkMergeCartUseCase` (JWT + Throttle 5/min, INV-C01, dedup, qty max 100, batch fetch без N+1, 12 spec тестов). TMA `lib/cartSync.ts` идемпотентно синхронизирует localStorage в backend через `savdo_cart_synced` flag после login, `resetCartSync()` в logout. Web-buyer теперь видит те же товары через `/cart` API. Подробности в `analiz/done.md` Wave 8.
- [x] **`TMA-CHECKOUT-GUEST-SILENT-401-001`** ✅ 10.05.2026 — submit disabled пока !authenticated, warning-блок «⚠️ Нужна авторизация», label «Войдите через Telegram». Коммит `5e486a3`.

### TMA buyer

- [x] **`TMA-PHONE-MASK-001`** ✅ 12.05.2026 — `apps/tma/src/lib/phone.ts` (formatUzPhone/stripPhone/isValidUzPhone). Маска `+998 XX XXX XX XX` в CheckoutPage onChange. Backend получает E.164 через stripPhone. Коммит `abfb7a7`.
- [x] **`TMA-CHECKOUT-SUCCESS-PAGE-001`** ✅ 10.05.2026 — ✓ icon + orderNumber + total + 2 CTA (Мои заказы / К магазинам). Коммит `5e486a3`.
- [x] **`TMA-BECOME-SELLER-CTA-001`** ✅ 12.05.2026 — реализовано раньше коммитами `91a96b7` (feat tma+api) + `5b30642` (CodeTour `.tours/become-seller-cta.tour`). Полный flow: CTA в `buyer/SettingsPage.tsx` → `tg.openTelegramLink(?start=become_seller)` → webhook парсит startParam (hard cap 64) → handleStart с strict whitelist + `!seller` → setTmp phone+firstName из user → startSellerRegistration. finishSellerRegistration обрабатывает buyer→seller upgrade через 3 ветки (existing.seller / existing / new) — больше не падает на unique(phone).
- [x] **`TMA-ADDRESS-AUTOCOMPLETE-001`** ✅ 13.05.2026 — `apps/tma/src/components/ui/AddressAutocomplete.tsx` через Yandex Suggest API v1 (REST, без полной Maps JS). Bbox ограничивает результаты Узбекистаном `55.99,37.18~73.16,45.59`. Debounce 300ms + AbortController на каждый запрос. Локаль `ru_RU`/`uz_UZ` авто (из i18n locale). Графильно деградирует на обычный input если `VITE_YANDEX_MAPS_API_KEY` не задан. Подключено в `buyer/CheckoutPage`.
- [~] **`TMA-LIGHT-THEME-MIGRATION-001`** ~~470 + 92 = ~562 точек закрыто~~ — параллельная FG-TOKENS сессия + 14.05.2026 (Полат) мигрировал text-цвета во всех 4 крупных seller-формах (AddProductPage / EditProductPage / ChannelSettingsPage / SettingsPage). Остаётся ~40 точек surface/border (0.04-0.18 диапазон) — тонкие glass/backdrop эффекты, требуют визуального теста light theme. Делать по мере касания файлов.

### Admin

- [x] **`ADMIN-NATIVE-CONFIRM-001`** ✅ 10.05.2026 — новый `ConfirmDialog` imperative API + `<ConfirmContainer/>` в App.tsx. ChatsPage + ReportsPage используют `confirmDialog()`. Коммит `5e486a3`.
- [x] **`ADMIN-MODAL-A11Y-001`** ✅ 10.05.2026 — 4 modal'а на DialogShell: Orders Cancel + Refund, Moderation Reject, Broadcast Confirm. role=dialog, aria-modal, focus-trap, Esc close. Коммиты `5e486a3`, `f2dc9f9`.

## 🎨 P1 — Design quick wins (Полат + Азим)

- [x] **`DESIGN-PHONE-INPUT-PACKAGE-001`** ✅ 14.05.2026 — **web-* (Азим) + packages/ui (Полат).** Web-*: `PhoneInput` в `apps/web-buyer/components/` + `apps/web-seller/components/` (дубль). **Полат 14.05.2026:** перенёс в `packages/ui/components/PhoneInput.tsx` + утилиты (formatUzPhone/stripUzPhone/isValidUzPhone), экспорт из `@savdo/ui`. `peerDependencies.react ^18||^19`. `packages/ui/README.md` с migration plan для Азима (подключить `"@savdo/ui": "workspace:*"` в web-buyer/web-seller package.json + `pnpm install` → удалить дубли + заменить импорты). TMA имеет свой `lib/phone.ts` (Wave 7), admin не нуждается. Дубли в web-* пока остаются — Азим уберёт после `pnpm install`.
- [x] **`DESIGN-SEMANTIC-COLORS-001`** ✅ 14.05.2026 — **Web-* ✅ (Азим, hot-path)** + **Admin ✅ (Полат)**. Web-* теперь использует theme-aware `dangerTint(o)/warningTint(o)/successTint(o)` helpers (`rgb(var(--color-X-rgb)/o)` CSS color level 4). RGB-channels добавлены в `:root` и `[data-theme="dark"]` обоих апсов. **Admin (`apps/admin/src/lib/styles.ts`):** mirror helpers через `color-mix(in srgb, var(--error) X%, transparent)` (Chrome 111+/Safari 16.4+/FF 113+ — admin desktop-only). + готовые `errorBanner()`/`successBanner()`/`warningBanner()` CSSProperties stylesheets. **packages/design-tokens unified пакет НЕ делаем** — Soft Color Lifestyle (buyer) / Liquid Authority (seller+admin) by design разные.
- [x] **`DESIGN-SEMANTIC-COLORS-RGBA-002`** ✅ 14.05.2026 (Азим) — все 15 точек hardcoded rgba заменены на `dangerTint(X)`: web-seller (14) в image-uploader, analytics, products list/create/edit, orders list+detail, notifications, chat (×3); web-buyer (1) в chats `⋮`-кнопке `rgba(220,38,38)` → `dangerTint()` (теперь подстраивается под Soft Color Lifestyle палитру buyer'а). Type-check `tsc --noEmit` чистый в обоих апах. Остатки `rgba(248,113,113)` в репо — только TMA + admin (зона Полата).
- [x] **`DESIGN-TMA-BRAND-DIFF-001`** ✅ verified 14.05.2026 — реализовано параллельной FG-TOKENS сессией (TMA-DESIGN-ROLE-DIFF-001, Wave 7-12). `index.css` имеет `[data-role="SELLER"]` override на `--tg-accent` (cyan вместо orchid). `AppShell.tsx:21` ставит `data-role={role}` на root, `BottomNav.tsx:53` дублирует для bottom nav. Light + dark theme overrides оба покрыты. Buyer = orchid violet `#A855F7`, Seller = cyan `#22D3EE` — визуально различимы.
- [x] **`DESIGN-A11Y-ARIA-LABELS-001`** ✅ 14.05.2026 — **web-* (Азим) + admin (Полат).** В web-buyer: shared `icons.tsx` (10 SVG `aria-hidden`+`focusable=false`), BottomNavBar (`aria-current=page` + `aria-label` с badge count), thumbnail кнопки. В web-seller: image-uploader X, variants/option-groups cancel — все `aria-label`. **Admin (Полат):** AdminUsersPage delete button, CategoriesPage `ActionBtn` (aria-label = title + aria-hidden на иконке), ChatsPage delete thread, DatabasePage delete/close (2 места + error banner close), StoreDetailPage delete product. Все hardcoded `rgba(239,68,68,...)` заменены на `var(--surface-error)`/`var(--border-error-soft)`/`var(--error)` (semantic vars из ADMIN-DESIGN-TOKENS-SURFACE-001).

## 🟢 P2-P3 — Tech debt после launch

- [x] **`API-N1-PRODUCTS-LIST-001`** ✅ 14.05.2026 — `GET /stores/:slug/products` поддерживает opt-in pagination через query `?page=N&limit=N`. Если переданы — envelope `{ data, meta: { total, page, limit } }` через `findPublicByStoreIdPaginated`. Если нет — legacy raw array (backward-compat take=200). Без breaking change для существующих consumers. Полный envelope-wide migration отложен в `API-PAGINATION-ENVELOPE-001`.
- [x] **`API-STOREFRONT-SEARCH-PERF-001`** ✅ 12.05.2026 — миграция `20260512170000_search_pg_trgm_indexes` (параллельная сессия) создаёт `pg_trgm` extension + 5 GIN индексов: `products_title_trgm_idx`, `products_description_trgm_idx` (partial WHERE NOT NULL), `stores_name_trgm_idx`, `stores_description_trgm_idx` (partial), `stores_slug_trgm_idx`. ILIKE из `searchPublic` теперь использует индекс (100-1000× быстрее).
- [x] **`API-SENTRY-001`** ✅ 14.05.2026 — lightweight error reporter без зависимости от Sentry SDK. `apps/api/src/shared/error-reporter.ts` — auto-capture `uncaughtException`/`unhandledRejection`, manual `captureException(err, context)` + `captureMessage(msg, level, context)`. JSON output в stderr (Railway log aggregation), PII-скраббинг для context keys (password/secret/token/authorization → `[REDACTED]`). Tags: `release` (`RAILWAY_GIT_COMMIT_SHA[:7]`) + `environment` (`NODE_ENV`). Env-flag `ERROR_REPORTER_ENABLED=false`. **Init в `main.ts` перед bootstrap** — ловит ошибки на этапе загрузки модулей. Когда нужен полный Sentry — добавить `@sentry/node` и заменить `ErrorReporter.captureException` на `Sentry.captureException` (API совместимый). 60% Sentry-функций без install.
- [x] **`API-PINO-LOGGING-001`** ✅ 14.05.2026 — без новых зависимостей. `apps/api/src/shared/structured-logger.ts` — custom `ConsoleLogger` extension: в `NODE_ENV=production` emit single-line JSON `{ts, level, context, msg, trace}` (stdout/stderr split для Railway log aggregation), в dev — fallback на цветной ConsoleLogger. Подключено в `main.ts` через `NestFactory.create({ logger: new StructuredLogger() })`. Override `isLevelEnabled` для конфигурации через `LOG_LEVEL` env. Все существующие `Logger.log/warn/error` работают автоматически. Pino не подключаем — нужен `pnpm install` (4 пакета: nestjs-pino + pino + pino-http + pino-pretty), wrapper даёт 80% value (JSON-логи) без новых deps.
- [x] **`API-PII-MASKING-001`** ✅ verified done 12.05.2026 — `apps/api/src/shared/pii.ts` (`maskPhone`: `+998901234567` → `+998 *** ** 67`, ghost `tg_*` → `tg_***`). Использован во ВСЕХ logger.* с phone: otp.processor, otp.service, telegram-auth.use-case, admin-auth.use-case (impersonation), telegram-demo.handler (linked/registered logs), ghost-cleanup.service. Также есть unit-тесты `pii.spec.ts`. Verified grep — 0 plain-text phone в logger calls.
- [ ] **`API-FRONTEND-TESTS-001`** — 0 frontend tests для admin / web-buyer / web-seller / TMA. Хотя бы smoke.
- [⏸️] **`API-PAGINATION-ENVELOPE-001`** — см. отложено в разделе ниже (Sprint B).

---

# 🆕 Web-buyer Design Audit (09.05.2026) — Soft Color Lifestyle

> Полный отчёт: `analiz/audit-web-buyer-design-2026-05-09.md` (25 findings: 3 P1 / 14 P2 / 8 P3, health 7.5/10).

## WB-DESIGN-FIX-WAVES (Азим)

- [x] **`WB-DESIGN-WAVE-1`** ✅ 09.05.2026 — emoji-picker на токенах. Commit `9a16999`.
- [x] **`WB-DESIGN-WAVE-2`** ✅ 09.05.2026 — chat edit-bubble token cleanup. Commit `c5b6163`.
- [x] **`WB-DESIGN-WAVE-3`** ✅ 09.05.2026 — page headings text-2xl tracking-tight ×4. Commit `c5b6163`.
- [x] **`WB-DESIGN-WAVE-4`** ✅ 09.05.2026 — Stats brand + timeline pulse. Commit `c5b6163`.
- [x] **`WB-DESIGN-WAVE-5`** ✅ 09.05.2026 — radius cleanup (5 файлов). Commit `c5b6163`.
- [x] **`WB-DESIGN-WAVE-6`** ✅ 11.05.2026 — pinned product strip в `chats/page.tsx` ChatView, использует `productId/Title/ImageUrl/Price` от `API-CHAT-THREAD-PRODUCT-PREVIEW-001`. Линк на `/{storeSlug}/products/{productId}`. Closes P1-003.

### 🔵 Контракт-задача для Полата (web-buyer Wave 6 unblock)

- [x] **`API-CHAT-THREAD-PRODUCT-PREVIEW-001`** ✅ 10.05.2026 — `ChatThread` теперь содержит `productId/productTitle/productImageUrl/productPrice` (effective: `salePrice ?? basePrice`). Symmetric mapping для buyer и seller через `resolveProductImageUrl` (учитывает telegram-expired bucket → null + Telegram proxy + STORAGE_PUBLIC_URL CDN). Тесты +4: salePrice priority, STORAGE_PUBLIC_URL build, telegram-expired → null, ORDER-thread имеет product*=null. Коммит `f4ad95d`. **Азим может раскрывать Wave 6 (P1-003 pinned product strip).**
- [x] **`WB-DESIGN-WAVE-7`** ✅ 09.05.2026 — backlog cleanup (12 P2/P3). Commit `7ad5063`. **Skipped** P2-004 (sections «Все NN →» — нужно решение о множественных секциях; одиночная «Товары» сейчас не требует pattern), P2-014 (нужен batch add-to-cart API), P3-004 (нужен `isSale` flag в API).

**Skipped / requires API work:**
- P3-004 (sale chip) — нужен `isSale` flag в категориях API.
- P2-014 (Повторить заказ button) — нужен batch add-to-cart endpoint от Полата.

---

# 🆕 Design Audit (08.05.2026) — Admin / API / TMA

> Полный отчёт: `analiz/design-audit-2026-05-08.md` (51 findings: 11 P0, 14 P1, 14 P2, 12 P3).
> Использованы claude-skills: ui-design-system, apple-hig-expert, api-design-reviewer, senior-backend.

## Sprint A — cross-platform polish (P0 only) — 10 тикетов (3 закрыто)

- [x] **`TMA-DESIGN-HIT-AREA-001`** ✅ 12.05.2026 — qty buttons в `buyer/CartPage.tsx`: 3 кнопки (−/+/✕) с `w-7 h-7` (28px) → `w-10 h-10` (40px). Добавлены aria-label на каждую. text-sm → text-base для символа. ChatPage `w-6 h-6` — secondary ✕ в reply/edit banner, не qty (вне scope). OrdersPage qty не нашёл — `× {item.quantity}` рендерится как текст, кнопок нет.
- [x] **`TMA-DESIGN-FG-TOKENS-001`** (P0, T2) ✅ 13.05.2026 — ВСЕ buyer pages (237) + ВСЕ seller pages в моей зоне (119) + ВСЕ shared components (115) = **~470 точек** мигрированы на `--tg-text-*` / `--tg-surface*` / `--tg-border*`. Light theme работает автоматически на всей TMA. **Не мигрированы (заняты параллельной сессией):** AddProductPage, EditProductPage, seller/SettingsPage — отдельная подзадача `TMA-DESIGN-FG-TOKENS-002` после их разблокировки. **Урок:** параллельная сессия (web-buyer/web-seller checkout) откатывает unstaged → коммитить сразу после каждого edit. 16 коммитов в волне.
- [x] **`TMA-DESIGN-A11Y-LEFTOVERS-001`** ✅ 08.05.2026 — verified: упомянутые в аудите места (seller/ChatPage:205) — modal backdrop с stopPropagation + ESC, acceptable per ADR. buyer/ProductPage:252-256 уже закрыто `3400ecc`. Реальных нарушений не осталось.
- [x] **`TMA-DESIGN-ROLE-DIFF-001`** ✅ 12.05.2026 (5 коммитов) — полная инфраструктура + миграция всех seller-страниц в моей зоне:
  - `index.css`: `--tg-accent` / `--tg-accent-dim` / `--tg-accent-glow` / `--tg-accent-bg` / `--tg-accent-border` / `--tg-accent-text` vars, scoped через `[data-role="SELLER"]` (cyan) + `:root[data-theme="light"] [data-role="SELLER"]`
  - `AppShell`: `data-role={role}` на корневом div → CSS-vars наследуются всем дочерним
  - `BottomNav`: badge / active label / indicator → vars
  - `Sidebar` (desktop nav): brand icon/title, nav item active states, chat badge, settings button, user avatar (SELLER variant) — все 7 точек через vars
  - seller pages: DashboardPage (5), ProductsPage (2), ProfilePage (6), StorePage (8), OrdersPage (9 из 10, SHIPPED status — семантика), ChatPage (12 из 13, avatar palette — семантика). **Итого 49 точек.**
  - **Не мигрировано (в работе параллельной сессии):** AddProductPage, EditProductPage, seller/SettingsPage. После их разблокировки — отдельная подзадача `TMA-DESIGN-ROLE-DIFF-002`.
- [x] **`TMA-DESIGN-SPINNER-CLEANUP-001`** ✅ 08.05.2026 — заменены 3 initial-load `<Spinner>` → Skeleton: buyer/ChatPage:442 (4× message Skeleton), seller/ChatPage:506 (то же), seller/EditProductPage:597 (`ProductDetailSkeleton`). Inline Spinner на send-button и loadMore оставлены — они приемлемы.
- [x] **`ADMIN-A11Y-MODAL-001`** ✅ 13.05.2026 — DashboardLayout: `<aside aria-label="Главная навигация">`, `<nav aria-label="Разделы">`, `<main id="main" aria-label="Содержимое">`. Theme toggle: `aria-label` + `aria-pressed`. Logout button: `aria-label`. Иконки в footer-кнопках помечены `aria-hidden`. ModerationPage reject modal — уже на DialogShell (role=dialog/aria-modal/Esc/focus-trap), задеплоено ранее.
- [x] **`ADMIN-DESIGN-TOKENS-SURFACE-001`** ✅ 13.05.2026 — `apps/admin/src/index.css` теперь содержит 12 semantic surface tokens × 2 темы: `--surface-error/-warning/-success` (faint/soft/strong) + `--border-error/-warning/-success` (regular/soft). Light theme переопределяет с меньшей непрозрачностью (~0.06-0.18 vs 0.08-0.20 в dark) чтобы не «забивать» белый фон. Миграция 6 hardcoded error-banner'ов в AdminUsersPage, AuditLogsPage, AnalyticsEventsPage, BroadcastPage, ModerationPage. Остальные ~50 hardcoded rgba можно мигрировать по мере касания файлов.
- [⏸️] **`API-WS-EVENTS-NAMING-001`** ⏸️ ОТЛОЖЕНО 13.05.2026 — breaking-change для всех 4 фронтов одновременно. Полат не может сделать без координации с Азимом (web-buyer / web-seller на ts-client'ах) — атомарный rollout невозможен без feature-flag (например `WS_NAMESPACE_V2_ENABLED`). Решение: оставить старые event names, новые добавлять как `<namespace>:<action>` параллельно (dual-emit), миграция фронтов раздельно в течение спринта. План в отдельной задаче `API-WS-EVENTS-DUAL-EMIT-001` когда будет время.
- [x] **`API-HTTP-201-CREATED-001`** ✅ 08.05.2026 — `@HttpCode(HttpStatus.CREATED)` добавлен на 6 POST endpoints в `products.controller.ts`: seller/products, /variants, /option-groups, /option-groups/:gid/values, /images, /attributes. NestJS уже отдавал 201 неявно для @Post — теперь explicit для consistency с cart/checkout.
- [x] **`API-ORDERS-ALIAS-REMOVE-001`** ✅ 10.05.2026 — alias `GET /orders/:id` удалён. Grep по TMA/admin/web-buyer/web-seller подтвердил что bare endpoint не вызывается (все на `/buyer/orders/:id`, `/seller/orders/:id`, `/admin/orders/:id`). Next.js routes `/orders/:id` в web-* — это страничные пути, не API. Коммит `c445d20`.

## Sprint B — design system hardening (P1) — 8 тикетов

- [x] **`ADMIN-THEME-VARS-MIGRATE-001`** ✅ 13.05.2026 — `components/ui/button.tsx` + `badge.tsx` переведены с Tailwind `bg-zinc-800/text-red-400/etc.` на CSS-vars через 11 утилитных классов в `@layer components` (.btn-primary/-secondary/-ghost/-danger/-outline + .badge-default/-success/-warning/-danger/-info/-muted). Light theme работает автоматически. Dialog (DialogShell) уже был на `var(--surface)`/`var(--border)`.
- [x] **`TMA-TYPOGRAPHY-SCALE-001`** ✅ 14.05.2026 — инфра (Tailwind `theme.extend.fontSize` через CSS-vars `--t-*`, desktop 1.05× override, custom `text-xxs` для 11px) ✅ Wave 14. **Mass migrate 14.05.2026:** `text-[10px]` / `text-[11px]` → `text-xxs`, `text-[12px]` → `text-xs` во всех 20+ файлах через sed (0 хардкодов осталось). Остаются ~50 редких `text-[Npx]` для специфичных значений (15-17px и т.п.) — не блокер, делать по мере касания.
- [x] **`API-SWAGGER-001`** ✅ — `@nestjs/swagger` + DocumentBuilder с 7 tags + BearerAuth уже в `main.ts`. Все ключевые endpoints помечены `@ApiTags` / `@ApiHeader` / `@ApiBearerAuth`.
- [x] **`API-PRODUCTS-CTRL-SPLIT-001`** ✅ — products.controller (590 LOC) + storefront.controller (318 LOC, 8 storefront routes отдельно) + ProductPresenterService для маппинга. С 942 LOC до разделения.
- [x] **`ADMIN-A11Y-TABS-OTP-001`** ✅ 13.05.2026 — `components/ui/tabs.tsx` новый primitive с `role=tablist/tab/tabpanel` + `aria-selected` + `aria-controls` + roving-tabindex (стрелки ←/→ переключают). Применён в `ModerationPage` (4 таба: Все / Продавцы / Магазины / Закрыты). LoginPage OTP уже был в `<fieldset>` с `<legend>` + `inputMode="numeric"` + `autoComplete="one-time-code"` — verified.
- [x] **`ADMIN-PAGINATION-DISABLED-001`** ✅ 12.05.2026 — disabled уже был на всех 8 admin pagination. Заодно унифицировал: OrdersPage / StoresPage / SellersPage переведены с inline `<Button>` на reusable `<PaginationBar>` (тот же что в Users/Database/AuditLogs/AnalyticsEvents) — `aria-label`, lucide chevron icons, корректный opacity/cursor через единый стиль.
- [x] **`API-IDEMPOTENCY-KEY-001`** ✅ 10.05.2026 — Stripe-style `Idempotency-Key` header защита от двойных заказов. Применено на `POST /checkout/confirm` + `POST /orders`. Архитектура `common/idempotency/`: SHA256(key + userId + route) → Redis cache 24h, NX-lock через read-then-set для concurrent retry, fail-open при Redis down (defence-in-depth через DB unique constraints), success-only caching (errors не кэшируются — клиент может ретраить с тем же ключом). Header опционален (legacy compat), валидация формата 8-128 chars `[A-Za-z0-9_:.-]`. Тесты +19. Коммит `60d47ba`.
- [⏸️] **`API-PAGINATION-ENVELOPE-001`** ⏸️ ОТЛОЖЕНО 13.05.2026 — breaking-change для всех list endpoints (storefront/products, /search, /buyer/orders, admin/*, etc.). Без feature-flag поломает фронты. Стратегия (когда возьмёмся): эмитить ОБА — `{ data, meta }` envelope + legacy `data: T[]` через `Accept-API-Version` header или query param `?envelope=v2`. Миграция фронтов раздельно: TMA → web-buyer → web-seller → admin. Без согласования с Азимом не делать.

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
- [x] **`WEB-SELLER-HARDCODED-DOMAIN-001`** ✅ 11.05.2026 — full closure. Helper расширен (`buyerHostDisplay` + `buyerProductUrl`). Закрыты оставшиеся хардкоды: `dashboard/page.tsx:74` (handleCopyLink), `products/page.tsx:58` (copyProductLink), `(onboarding)/onboarding/page.tsx:162/179` (live slug preview), `layout.tsx:128` placeholder. Все live места теперь через env. Подробности в `analiz/done.md`.

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

- [x] **`WEB-BUYER-REMOVE-USESTOREWITHTRUST-001`** ✅ 14.05.2026 (Азим) — закрыто на ветке `web-buyer` (commit `10f3bd0`). Удалены `useStoreWithTrust` хук + `getStorefrontStoreWithTrust` API + `StoreTrustSignals/StorefrontStoreWithTrust` локальные типы. SellerCard теперь читает trust signals напрямую из `product.store.{isVerified,avgRating,reviewCount}` (новый mandatory shape после Полатовского `b1aa682`). Эффект: −1 HTTP request на каждое product detail visit, −1 React Query cache entry. Подробности в `analiz/done.md`.

---

### 🔴 P0 — для Азима: pre-launch sync audit (от Полата 14.05.2026)

- [x] **`WEB-AUDIT-SYNC-IDEOLOGY-001`** ✅ 14.05.2026 (Азим, parallel agents) — полный отчёт в `analiz/audits/web-sync-2026-05-14.md`. **6 pillars × 4 параллельных read-only агента.** Verdict: web-* архитектурно соответствует проекту (media / API hygiene / type safety — clean). **Pre-launch блокеры — функциональные пробелы, не архитектурные баги:** 5 SEV-1 + 8 SEV-2/3. Все ticket'ы выписаны ниже (см. секции «P0 — pre-launch fixes от audit» и «P1 — pre-launch tech-debt от audit»).

### 🔴 P0 — pre-launch fixes от audit 14.05.2026

**Для Азима (web-buyer):**
- [x] **`WEB-BUYER-STORE-PAGE-TRUST-SIGNALS-001`** ✅ 14.05.2026 (Азим) — закрыто на ветке `web-buyer` (commit `707f1d4`). Inline trust row в hero brand-color column между title и description: ✓ pill «Проверенный» (если `store.isVerified`) + ⭐ rating «X.X · N отзывов» (если `reviewCount > 0 && avgRating != null`). Conditional render — на текущем проде оба stores не verified, активируется когда Полат verify или появятся reviews. Light-on-dark inline стилизация (готовые `VerifiedBadge`/`StoreRating` рассчитаны на light surface — не подходят для тёмно-коричневого hero). Подробности в `analiz/done.md`.
- [x] **`WEB-BUYER-BECOME-SELLER-CTA-001`** ✅ 14.05.2026 (Азим) — закрыто на ветке `web-buyer` (commit `55c524b`). Brand-tinted promo card в `/profile` с deep-link `https://t.me/${BOT_USERNAME}?start=become_seller` для `user.role === 'BUYER'` (SELLER уже имеет store). **Note:** на homepage `HomeHero.tsx` уже был CTA «Стать продавцом» (line 42-50) — Pillar 6 агент пропустил это (грепал на main, новый homepage только на ветке web-buyer). Дополнительно закрыт terminal point в /profile где logged-in BUYER не имел visible пути upgrade. Подробности в `analiz/done.md`.
- [x] **`WEB-BUYER-CARD-PAYMENT-DISABLE-001`** ✅ 14.05.2026 (Азим, quick fix) — закрыто на ветке `web-buyer` (commit `2d59047`). `card` option в `paymentMethods[]` теперь `disabled: true` + `badge: "Скоро"` (как у `online`/Payme/Click). UI уже корректно отрабатывал disabled: button disabled + dashed border + opacity 0.55. Default `paymentMethod = 'cash'` остаётся (line 324). Полный fix — после Полатовского `API-CHECKOUT-PAYMENT-METHOD-001`: backend расширяет `CheckoutConfirmRequest` с `paymentMethod`, frontend передаёт selected value, analytics использует selected (не hardcoded `"COD"`). Подробности в `analiz/done.md`.

**Для Полата (TMA / API):**
- [ ] **`TMA-CART-API-SYNC-001` (re-open)** 🔴 SEV-1 — TMA `apps/tma/src/lib/cart.ts` чисто localStorage. `apps/tma/src/pages/buyer/CartPage.tsx` не зовёт `POST /cart/bulk-merge` после login. **Cross-channel cart broken** (TMA → web-buyer = пустая корзина). Listed как Wave 8 в done но НЕ в коде. Implementation в `AuthProvider` mount или `CartPage` effect.
- [ ] **`API-CHECKOUT-PAYMENT-METHOD-001`** 🔴 SEV-1 — расширить `CheckoutConfirmRequest` в `packages/types/src/api/cart.ts` с `paymentMethod: 'cash' | 'card' | 'online'`. Backend сохраняет на `Order`. Web-seller orders отображает. Web-buyer передаёт правильное значение из selector'а. Без этого web-buyer card-кнопка остаётся «misleading UI».

**Для всей команды (decision required):**
- [ ] **`ADR-CHAT-MESSAGE-EDIT-DELETE-001`** 🔴 SEV-1 — `INV-CH02` («Удаление и редактирование сообщений не поддерживаются в MVP») нарушен: chat edit/delete shipped end-to-end (web-buyer + web-seller + backend). Реализовано в session 36 (26.04.2026), но **ADR в `docs/adr/` отсутствует**. Создать `docs/adr/00XX-chat-message-edit-delete-relaxation.md` с описанием: почему relaxed, soft-delete контракт (`is_deleted`?), окно времени для edit, audit-log. Без ADR это выглядит как scope creep.

### 🟡 P1 — pre-launch tech-debt от audit 14.05.2026

**Status labels divergence (для всех):**
- [ ] **`STATUS-LABEL-CANONICAL-SHIPPED-001`** 🟡 SEV-2 — `SHIPPED` имеет 4 разных перевода: web-* + TMA Badge: «В пути», TMA `ru.ts`: «Доставляется», admin: «Отправлен», bot: «🚚 отправлен». **Решение:** договориться на единый label (рекомендация — «В пути», buyer-facing). Полат правит admin / bot / TMA `ru.ts` после согласования.
- [ ] **`ADMIN-STATUS-LABEL-PENDING-001`** 🟡 SEV-2 — Полату — `apps/admin/src/pages/OrdersPage.tsx:28` `PENDING: { label: 'Ожидание' }`. Везде `'Ожидает'`. Изменить.

**Для Азима:**
- [ ] **`WEB-BUYER-OTP-PURPOSE-FIX-001`** 🟢 SEV-3 — `apps/web-buyer/src/components/auth/OtpGate.tsx:28` хардкодит `purpose: 'checkout'` независимо от вызывающего контекста (включая `/orders`, `/profile`, `/wishlist`). Если backend rate-limit'ит per-purpose — неправильный счёт. Принимать `purpose` через props.

**Для Полата (packages/types):**
- [ ] **`API-TYPES-PROMOTE-FEATURED-STOREFRONT-001`** 🟢 SEV-3 — поднять `FeaturedStorefrontResponse`, `GlobalCategoryTreeItem`, `FeaturedTopStore`, `FeaturedProduct` из `apps/web-buyer/src/types/storefront.ts` в `packages/types/src/api/storefront.ts`. Азим обновит импорты после.
- [ ] **`API-PRODUCT-IMAGES-FULL-SHAPE-001`** 🟢 SEV-3 — расширить `ProductListItem.images` (и `Product.images`) в packages/types: `{ url: string }[]` → `{ id: string, mediaId: string, url: string, sortOrder?: number }[]`. После — Азим уберёт `as unknown as { images?: RawImage[] }` cast в `web-seller edit page:248`.
- [ ] **`API-STORE-DELIVERY-SETTINGS-TYPE-001`** 🟢 SEV-3 — добавить `deliverySettings` field в Store type. Web-seller settings уберёт UI-specific extension `StoreWithDelivery`.

### 🟡 P2 — для Полата (technical debt)

- [x] **`API-WS-PUSH-NOTIFICATIONS-001`** ✅ 06.05.2026 — реализовано параллельной сессией: `chat.gateway.ts handleConnection` авто-join `user:${userId}`, `emitNotificationNew()` в `InAppNotificationProcessor` после create. Frontend `notifications.ts` слушает `notification:new`, fallback poll 5 мин на разрыв WS.
- [x] **`API-MFA-COVERAGE-EXTRA-001`** ✅ 06.05.2026 — `MfaEnforcedGuard` + `AdminPermissionGuard` + `@AdminPermission` добавлены на admin endpoints в categories (5 endpoints), analytics (1), media (1). Permissions matrix дополнена `category:read/moderate`, `media:read` для moderator/support/finance ролей.

- [x] **`API-OTPLIB-V13-UPGRADE-001`** ✅ 08.05.2026 — bump `otplib` `^12.0.1 → ^13.4.0`. `admin-auth.use-case.ts` переписан под v13 functional API (`generateSecret`, `generateURI`, `verifySync`). Опции TOTP вынесены в `TOTP_VERIFY_OPTIONS` (digits=6, period=30, epochTolerance=30 = эквивалент v12 window:1 ±30s). Spec обновлён под новый API. 14/14 тестов passed, `npx tsc --noEmit` чист. Подробности в `analiz/done.md`.

- [x] **`TMA-MEDIA-USE-API-URL-001`** ✅ 06.05.2026 (полностью закрыто) — API теперь кладёт resolved URL прямо в `image.url` для 3 product detail endpoints (seller getMyProduct, products list seller endpoint, storefront product detail). EditProductPage использует `img.url` с fallback на getImageUrl для backward-compat. ProductsPage уже на mediaUrls[0]. Frontend больше не зависит от `VITE_R2_PUBLIC_URL`.

- [x] **`API-BUCKET-NAME-CONSISTENCY-001`** ✅ 06.05.2026 — добавлен явный handling `telegram-expired` (выставляется миграцией TG→Supabase когда file_id мёртв) в 3 mappers: `media.controller proxy/private` (404 NotFoundException), `cart.mapper.resolveMediaUrl` (returns null), `products.controller.resolveImageUrl` (returns ''). Раньше эти файлы попадали в S3 redirect → broken images.

### 🟢 P3 — для Полата (cleanup)

- [x] **`API-CHAT-CONTROLLER-TS-ERROR-001`** ✅ 06.05.2026 — уже исправлено параллельной сессией: `user.role as 'BUYER' | 'SELLER'` cast в chat.controller.ts:64. Typecheck чист.

- [x] **`API-DELETE-OLD-STASHES-001`** ✅ 10.05.2026 — оба stash (stash-3 + tma-api-perf-deploy-stash) дропнуты после проверки. Все полезные изменения уже в main в более качественной форме (OrderRefund с RefundStatus enum, AdminUser MFA-поля, impersonation, admin.module split на 8 sub-controllers).

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
- [ ] **`WS-DESIGN-WAVE-7-DEFERRED` 🟢** — оставшиеся 5 nit'ов отложены: P2-007 (sidebar 14%→15% accentMuted, в пределах rounding), P2-008 (onboarding `rounded-3xl` — sanctioned scene), P3-002 (chat thread skeletons beyond 3), P3-008 (analytics text-3xl — в пределах spec), P2-011+P3-009 ✅ закрыто 09.05 (WS-CHAT-RESPONSIVE-001). **P3-006 ✅ 11.05.2026** — 2 native `<select>` в settings (deliveryFeeType + languageCode) мигрированы на custom `<Select>` через `Controller` из react-hook-form. Firefox chevron, dark/light theme consistency, keyboard nav.

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

