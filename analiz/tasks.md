# Tasks

> Раздел сверху — что делать **Полату** (бэк), ниже — что делать **Азиму** (фронт).
> Закрытые задачи переносятся в `analiz/done.md`.

---

# 🆕 Очередь от Полата (через Азима, 30.04.2026 поздно вечер)

> ✅ 4 TMA задачи закрыты Полатом 02.05.2026, коммит `a2e1767`. См. `analiz/done.md`.

---

> ✅ `API-NOTIFICATIONS-ORDER-001` + `API-NOTIFICATIONS-CHAT-001` закрыты Полатом 02.05.2026, коммит `d83af03`. См. `analiz/done.md`.

---

> ✅ `WISHLIST-CONTRACT-001` + `TMA-BUYER-WISHLIST-001` закрыты Полатом 02.05.2026, коммиты `0f46a63` (backend) + `fd8721f` (UI). См. `analiz/done.md`.

> ⏳ Открыто для Азима: `WEB-BUYER-WISHLIST-PAGE-001` 🟡 — страница `/wishlist` в web-buyer + heart на ProductCard. Бэкенд готов: `GET/POST /buyer/wishlist`, `DELETE /buyer/wishlist/:productId`, `WishlistItem` тип в `packages/types`, флаг `inWishlist?: boolean` на storefront feed для авторизованных buyer'ов. Подсмотрите паттерн в `apps/tma/src/lib/wishlist.ts` (optimistic toggle с локальным кэшем).

---

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
| `WEB-CSP-HEADER-002` | 🟢 | Сессия 38 добавила базовый набор security-headers, но **CSP не включён** (требует точного списка allowed sources: API_URL, R2, Telegram media, Google Fonts, …). На post-MVP — без CSP защита от XSS-инъекции в случае компрометации фронта неполная. |

## 🚧 Открыто — Азим (фронт, `apps/web-buyer` / `apps/web-seller`)

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

