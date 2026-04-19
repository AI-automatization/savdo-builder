# Logs — локальные тесты и баги

Формат записи:
```
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

---

## 2026-04-19 [WEB-BUYER-PROFILE-AVATAR-MISSING-001] В `/profile` нет возможности поставить фото

- **Статус:** 🟡 Фича отсутствует — задача переведена на Полата (`API-BUYER-AVATAR-001` в tasks.md).
- **Что случилось:** На странице профиля рендерится дефолтная иконка `<UserIcon>` в круге. Никакого аватара, никакой кнопки «изменить фото».
- **Корневая причина:** В схеме `Buyer` (`packages/db/prisma/schema.prisma:166`) нет `avatarUrl`. В типе `BuyerProfile` (`packages/types`) нет такого поля. На бэке нет `POST /buyer/me/avatar`.
- **Что сделано:** Заведена задача `API-BUYER-AVATAR-001` (Полат): схема + миграция + multipart upload в R2 + поле в `auth/me`. Веб-часть (UI с `<input type=file>`, инвалидация кэша `['auth','me']`) — Азим, после готовности backend.

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
