# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 📋 Снимок состояния (на 20.04.2026, конец сессии 29)

## ✅ Закрыто в сессии 29 — Полат
- `API-CART-MEDIA-001` → resolveMediaUrl + include media
- `API-MEDIA-UPLOAD-500-001` → try/catch + DomainException 502
- `API-SELLER-ORDER-DETAIL-MAPPER-001` → полный mapper с toNum()
- `TMA-GLOBAL-CATEGORY-001` → GlobalCategory chip-picker в TMA
- `TMA-PRODUCT-ATTRIBUTES-001` → ProductAttribute модель + API + TMA UI
- `TMA-CHAT-001` → BuyerChatPage + SellerChatPage + socket.ts + App.tsx routes
- `ADMIN-BROADCAST-TOOLBAR-001` → Rich text toolbar + char counter

## 🚧 Открыто — Полат (бэк, `apps/api` / `packages/db` / `packages/types`)

| ID | Важность | Кратко |
|----|----------|--------|
| `API-BUYER-AVATAR-001` | 🟡 | Нет поля `Buyer.avatarUrl` + endpoint загрузки + поле в `auth/me`. После — Азим прикрутит UI. |
| `API-SELLER-ORDER-DETAIL-CONTRACT-001` | 🟡 | `GET /seller/orders/:id` отдаёт `city`/`region`/`addressLine1`/`deliveryFeeAmount`/`customerComment`/`placedAt` — но `packages/types/src/api/orders.ts` определяет `deliveryAddress`/`deliveryFee`/`buyerNote`/`createdAt`. Фронт web-seller показывает `—, —` вместо адреса. |
| `API-BUYER-ORDER-DETAIL-MAPPER-001` | 🔴 | `GET /buyer/orders/:id` отдаёт сырой Prisma `Order` без mapper и без `store` include. Фронт web-buyer крэшился на `order.store.name.charAt(0)`. Азим защитил 21.04 фолбэками, но без бэк-фикса продавца в карточке заказа не видно. |
| **Auth-история** | 🟡 | Почему `/auth/logout` отдаёт 401 при первом же выходе? И серия 401 на `/auth/me`, `/seller/store`, `/seller/summary`, `/chat/threads`, `/notifications/inbox` — глянуть JWT-валидацию / session-id из refresh-token. Не блокер пока, но мутный auth. |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

| ID | Важность | Кратко |
|----|----------|--------|
| `WEB-BUYER-AVATAR-UI-001` | 🟢 | Когда Полат закроет `API-BUYER-AVATAR-001` — на `/profile` повесить `<Image>` + `<input type=file>`, инвалидировать `['auth','me']`. |
| Тест auth-loop фикса | 🟡 | Завтра проверить: после `00a5b80` (logout-loop break) — выход/вход чистый, без петли. Если всё ещё кидает на `/onboarding` — снять Network на `/auth/otp/verify` и `/seller/store`. |
| Подтвердить причину `/notifications` ошибки | 🟢 | Открыть Network, глянуть статус `/notifications/inbox`. 401 = часть auth-серии (Полат), 404/500 = отдельная задача. |

---

## 🔴 [API-BUYER-ORDER-DETAIL-MAPPER-001] `GET /buyer/orders/:id` отдаёт сырой Prisma `Order` без mapper и без `store`
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Покупатель не видит ни названия магазина, ни кнопки «Написать продавцу», ни комментария к заказу. Без фронтового фолбэка — crash.
- **Файлы:** `apps/api/src/modules/orders/use-cases/get-order-detail.use-case.ts`, `apps/api/src/modules/orders/repositories/orders.repository.ts` (`findById`), `apps/api/src/modules/orders/orders.controller.ts` (`getBuyerOrderDetail`, `getOrderById`).
- **Что ломается:** `findById` делает `include: { items, history, buyer }` — но НЕ `store`. Для buyer-роутов controller возвращает `order` как есть (без inline-mapper, в отличие от seller-роута после сессии 29). Фронт `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` читал по контракту `packages/types/src/api/orders.ts#Order`: `order.store.name.charAt(0)`, `order.items[].title`, `order.items[].subtotal`, `order.deliveryFee`, `order.buyerNote`, `order.deliveryAddress.street` — у raw Prisma таких полей нет вообще (вместо них `productTitleSnapshot`, `lineTotalAmount`, `deliveryFeeAmount`, `customerComment`, `addressLine1`). Крэш был на `store.name.charAt`.
- **Что сделано на фронте (Азим, 21.04.2026):** Добавил `normalizeOrder()` который читает оба варианта (store guard, items fallback на snapshot-поля, toNum, flat address в `deliveryAddress`). `items.reduce` защищён. Это маскирует баг, но покупатель всё равно не видит карточку магазина — её просто нет в ответе.
- **Что нужно:**
  1. `findById` → добавить `include: { store: { select: { id: true, name: true, slug: true, telegramContactLink: true, logoUrl: true } } }`.
  2. Сделать общий mapper по контракту `Order`:
     ```ts
     {
       id, orderNumber, status, storeId, buyerId,
       createdAt, updatedAt,
       totalAmount: toNum, currencyCode: 'UZS', deliveryFee: toNum(deliveryFeeAmount),
       deliveryType, paymentMethod, paymentStatus,
       deliveryAddress: city || addressLine1 ? { street: addressLine1, city, region } : undefined,
       buyerNote: customerComment, customerPhone,
       buyer: { phone: buyer?.user?.phone ?? null },
       store: { name, telegramContactLink },
       items: items.map(i => ({
         id, productId, variantId,
         title: productTitleSnapshot, variantTitle: variantLabelSnapshot,
         quantity, unitPrice: toNum(unitPriceSnapshot), subtotal: toNum(lineTotalAmount),
       })),
     }
     ```
  3. Использовать тот же mapper и для seller-роута вместо inline (решит `API-SELLER-ORDER-DETAIL-CONTRACT-001` заодно) — вынести в `orders.mapper.ts` по образцу `cart.mapper.ts`.

---

## 🟡 [API-SELLER-ORDER-DETAIL-CONTRACT-001] `GET /seller/orders/:id` разошёлся с контрактом `Order` в `packages/types`
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🟡 Не крэш (фронт закрыт optional chaining'ом от сессии 24), но данные пропадают из UI: адрес / дата / комментарий покупателя не видны продавцу.
- **Файлы:** `apps/api/src/modules/orders/orders.controller.ts:146-178`, `packages/types/src/api/orders.ts`
- **Что ломается:** После сессии 29 inline-mapper в `getSellerOrderDetail` отдаёт:
  ```json
  { "placedAt": ..., "deliveryFeeAmount": ..., "customerComment": ..., "city": ..., "region": ..., "addressLine1": ... }
  ```
  Фронт `apps/web-seller/src/app/(dashboard)/orders/[id]/page.tsx` читает (по типу `Order` из `packages/types`):
  ```ts
  order.createdAt
  order.deliveryFee
  order.buyerNote
  order.deliveryAddress?.city / street / region
  ```
  → все четыре становятся `undefined` → рендерится `—, —`, «Бесплатно», дата пустая, блок комментария скрыт.
- **Что нужно:** Привести ответ к контракту `packages/types/src/api/orders.ts#Order`:
  ```ts
  {
    id, storeId, status, totalAmount, currencyCode,
    createdAt: string,          // из placedAt
    updatedAt: string,
    deliveryFee: number,         // из deliveryFeeAmount
    deliveryAddress: {           // собрать из flat полей
      street: addressLine1,
      city, region,
    } | undefined,
    buyerNote: string | null,    // из customerComment
    customerPhone, buyer, items, paymentMethod, paymentStatus, deliveryType,
    store: { name, telegramContactLink },
  }
  ```
  Поля которые бэк уже отдаёт правильно: `totalAmount`, `currencyCode`, `items[].unitPrice`, `items[].subtotal`, `buyer.phone`.
- **Альтернатива (если хочется flat):** поменять контракт в `packages/types/src/api/orders.ts` + прогнать фронт web-buyer и web-seller под него — но это дороже и ломает уже рабочие места (`/buyer/orders/:id`).

---

## 🔴 [API-MEDIA-UPLOAD-500-001] `POST /media/upload` отдаёт 500 — нельзя загрузить картинку товара / лого магазина
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Блокер — продавцы не могут добавить товар с фото / поставить лого магазина / баннер.
- **Файлы:** `apps/api/src/modules/media/use-cases/upload-direct.use-case.ts`, `apps/api/src/modules/media/services/telegram-storage.service.ts`, `apps/api/src/modules/media/repositories/media.repository.ts`, `apps/api/src/modules/media/media.controller.ts:56`
- **Симптом:** Азим (19.04.2026) репортнул в console: `POST .../api/v1/media/upload 500`, axios `Request failed with status code 500`. Triggered из `<ImageUploader>` (web-seller — products/create, products/[id]/edit, settings/store-logo, settings/store-banner). Фронт шлёт корректный multipart (`file` + `purpose`).
- **Что нужно (Полат):**
  1. Открыть Railway logs `savdo-api-production`, найти трейс stack для этого запроса (по таймстампу или endpoint `/media/upload`).
  2. Самые вероятные причины:
     - `tgStorage.uploadFile()` бросает — Telegram bot token протух / rate limit / file > 10 МБ для Telegram photo endpoint / api.telegram.org недоступен.
     - `mediaRepo.create()` бросает — Prisma constraint на `bucket`/`objectKey`, проблема с `BigInt(file.size)` при сериализации.
     - `multer` middleware на роуте `/media/upload` не сконфигурен → `file` undefined → `file.buffer` бросает.
  3. Если виновник Telegram — обернуть в try/catch и бросить `DomainException(MEDIA_UPLOAD_FAILED, ..., 502)` чтобы не было 500.
  4. Добавить логирование `console.error` или NestJS `Logger.error` с stacktrace перед тем как NestJS превратит исключение в 500-respond.

---

## 🟡 [API-SELLER-ORDER-DETAIL-MAPPER-001] `GET /seller/orders/:id` отдаёт сырой prisma — числа undefined → frontend крашится
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🟡 Азим уже защитил фронт (19.04.2026), но корень — отсутствие mapper'а как у `/cart`.
- **Файлы:** искать по `apps/api/src/modules/orders/` — use-case/controller для `findOne` (seller view).
- **Симптом:** `web-seller /orders/:id` падал с `Cannot read properties of undefined (reading 'toLocaleString')` на полях `totalAmount`, `items[].subtotal`, `items[].unitPrice`. Те же поля что в `cart`, та же проблема — либо undefined, либо Prisma Decimal без `.toString()`.
- **Что нужно:** mapper аналогичный `cart.mapper.ts` (можно вынести `toNum` в общий util), который даёт фронту: `{ id, status, createdAt, totalAmount: number, deliveryFee: number, items: [{ id, title, variantTitle?, quantity, unitPrice: number, subtotal: number }], deliveryAddress, paymentMethod, paymentStatus, buyer, customerPhone, buyerNote }`. Все числа — number, не Decimal; createdAt — ISO string.
- **Аналогично проверить:** `GET /seller/orders` (список) — на скрине у Азима там 300000 рендерится корректно, но если поле приходит как Decimal, в edge-cases может тоже сломаться.

---

## 🔴 [API-CART-MEDIA-001] `cart.mapper.ts` отдаёт сырой `mediaId` в поле `mediaUrl` — все картинки в корзине 404
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Видимая регрессия. После твоего коммита `5ca0666` (новый `cart.mapper.ts`) в корзине у всех товаров вместо фото — placeholder-иконка. Раньше фотки рендерились.
- **Файлы:** `apps/api/src/modules/cart/cart.mapper.ts:57`, `apps/api/src/modules/cart/repositories/cart.repository.ts`
- **Root cause:** `cart.mapper.ts:57` пишет `mediaUrl: product?.images?.[0]?.mediaId ?? null`. `mediaId` — это UUID FK на `MediaFile` (см. `packages/db/prisma/schema.prisma:407-420`), а не URL. Браузер шлёт GET на строку UUID → 404 → фронт показывает fallback-иконку.
- **Как должно быть:** использовать тот же helper что в `products.controller.ts:540` `resolveImageUrl(media)`:
  ```ts
  // для telegram bucket
  return `${APP_URL}/api/v1/media/proxy/${m.id}`;
  // для r2
  return `${STORAGE_PUBLIC_URL}/${m.objectKey}`;
  ```
- **Что нужно:**
  1. В `cart.repository.ts` (метод что грузит cart) добавить `include: { product: { include: { images: { include: { media: true }, orderBy: { sortOrder: 'asc' }, take: 1 } } } }`.
  2. В `cart.mapper.ts:57` собрать URL из `product.images[0].media` (logic выделить в shared `resolveMediaUrl(media)` чтобы не дублировать с `products.controller`).
  3. Проверить в DevTools Network → `GET /cart` → response → `items[].product.mediaUrl` должно быть `https://...up.railway.app/api/v1/media/proxy/<uuid>` или R2-ссылкой, а не голым UUID.

---

## 🟡 [API-BUYER-AVATAR-001] Buyer profile avatar — нет схемы / endpoint / поля в `auth/me`
- **Домен:** `apps/api`, `packages/db`, `packages/types`
- **Кто взял:** Полат
- **Важность:** 🟡 UX gap. Азим (19.04.2026) репортнул что в `web-buyer /profile` нельзя поставить своё фото, висит дефолтная иконка `<UserIcon>`. Фронт реализовать не может — нет ни поля, ни endpoint.
- **Что нужно:**
  1. **Schema (`packages/db/prisma/schema.prisma:166-182`):** добавить `avatarUrl String?` в `model Buyer`. Migration `add_buyer_avatar_url`.
  2. **Upload endpoint:** `POST /buyer/me/avatar` — multipart (`multipart/form-data`, поле `file`), валидация: image/jpeg|png|webp, ≤2 MB. Грузит в R2 (тот же бакет что и product media), записывает публичный URL в `Buyer.avatarUrl`. Возвращает обновлённый `BuyerProfile`.
  3. **Delete endpoint (опц.):** `DELETE /buyer/me/avatar` — обнуляет поле, удаляет из R2.
  4. **`GET /auth/me`:** поле `avatarUrl` в `User.buyer` ответе.
  5. **`packages/types`:** добавить `avatarUrl?: string | null` в `BuyerProfile` (см. `packages/types/src/api/auth.ts` где определён `User`).
- **Когда готово — Азим (web-buyer):** на `/profile` рядом с `<UserIcon>` рендерит круглую `<Image>` с `avatarUrl`, под ней кнопка «Изменить фото» — открывает `<input type="file" accept="image/*">`, шлёт в новый endpoint, инвалидирует `['auth','me']`.

---

## 🔴 КРИТИЧЕСКОЕ — Buyer flow на production сломан (19.04.2026)

> Азим в сессии 27 закрыл 6 blocker'ов на фронте (web-buyer). Бэкенд требует 5 задач — без них заказы оформить нельзя.

## 🔴 [API-BUYER-PROFILE-001] `Buyer profile not found` блокирует оформление заказов
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 MVP блокер. Без этого никто не может оформить заказ.
- **Root cause:** `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts:41-44`. Buyer создаётся только если User не существовал. Если телефон уже зарегистрирован (как SELLER или как Telegram-ghost) — JWT валидный, но `fullUser.buyer === null` → 401 на `/cart/merge`, `/checkout/preview`, `/checkout/confirm`.
- **Файлы:** `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts`, `apps/api/src/modules/auth/repositories/auth.repository.ts`, `apps/api/src/modules/cart/cart.controller.ts:161`, `apps/api/src/modules/checkout/checkout.controller.ts:49`
- **Что нужно:**
  1. `verify-otp.use-case.ts:41-44` — после `findUserByPhone`, если `user && !user.buyer`, вызвать `authRepo.ensureBuyerProfile(user.id)` (новый метод через `prisma.buyer.upsert({ where: { userId }, create: { userId }, update: {} })`).
  2. Альтернативно (дополнительно) — `cart.controller.ts` и `checkout.controller.ts` вместо 401 вызывать auto-ensure через `buyerRepo.ensureForUser(user.sub)`.
  3. Ручной backfill для заблокированных текущих аккаунтов: SQL `INSERT INTO "buyer" (id, "userId") SELECT gen_random_uuid(), u.id FROM "user" u WHERE u.role = 'BUYER' AND NOT EXISTS (SELECT 1 FROM "buyer" b WHERE b."userId" = u.id);`

## 🔴 [API-CART-RESPONSE-001] `POST /cart/items` и `PATCH /cart/items/:id` возвращают `CartItem` вместо `Cart`
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🟡 (Азим закрыл временный костыль через invalidateQueries)
- **Файлы:** `apps/api/src/modules/cart/use-cases/add-to-cart.use-case.ts:27`, `apps/api/src/modules/cart/use-cases/update-cart-item.use-case.ts:19`
- **Что нужно:** вернуть полный `Cart` (с items + totalAmount + currencyCode) как обещает `packages/types/src/api/cart.ts:22`. Сейчас возвращается одиночный `prisma.CartItem` и это ломало TanStack-кэш на фронте.

## 🔴 [API-CART-CONTRACT-001] `GET /cart` отдаёт prisma-сырец вместо обещанного `Cart`
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Данные кривые. Из-за этого фронт был вынужден делать fallback на product.basePrice.
- **Файлы:** `apps/api/src/modules/cart/use-cases/get-cart.use-case.ts`, `apps/api/src/modules/cart/repositories/cart.repository.ts`
- **Что нужно:** добавить mapper который:
  1. `unitPrice = Number(item.salePriceSnapshot ?? item.unitPriceSnapshot)` и `subtotal = unitPrice * quantity`
  2. `totalAmount = sum(items.subtotal)`, `currencyCode = 'UZS'`
  3. `product.mediaUrl` — полный URL через storage (сейчас `images[0].mediaId`)
- **Контракт:** `packages/types/src/api/cart.ts`

## 🔴 [API-CHECKOUT-CONTRACT-001] `/checkout/preview` возвращает `validItems`/`currency` вместо `items`/`currencyCode`
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🟡 (фронт принимает оба варианта)
- **Файлы:** `apps/api/src/modules/checkout/use-cases/preview-checkout.use-case.ts:153-163`
- **Что нужно:** привести к контракту `packages/types/src/api/cart.ts#CheckoutPreview`: `items` (не `validItems`), `currencyCode` (не `currency`), `stockWarnings: string[]` (собрать из `invalidItems`). Подумать про `items` с полями `title, variantTitle, unitPrice, subtotal` вместо `productTitleSnapshot, variantLabelSnapshot, unitPrice, lineTotal`.

## 🔴 [API-DECIMAL-NAN-001] `Number(Prisma.Decimal)` возвращает NaN → цены теряются
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Важность:** 🔴 Root cause бага «0 сум». Цепной эффект на cart + checkout + возможно orders.
- **Файлы:** `apps/api/src/modules/cart/use-cases/add-to-cart.use-case.ts:45,66,72`, `apps/api/src/modules/checkout/use-cases/preview-checkout.use-case.ts:86,120`, и везде где `Number((x as any).basePrice)` или `Number(Decimal)`.
- **Что нужно:** использовать `.toNumber()` вместо `Number()` на Prisma Decimal. Прогнать grep по всему apps/api на паттерн `Number((.*) as any)` и `Number(.*\.(?:basePrice|priceOverride|.*Snapshot))` — поправить.

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

