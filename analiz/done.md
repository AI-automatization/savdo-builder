# Done — Азим + Полат

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
