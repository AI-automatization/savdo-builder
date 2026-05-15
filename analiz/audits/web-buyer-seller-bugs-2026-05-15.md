# Аудит web-buyer + web-seller — баги и недочёты (15.05.2026)

> Pre-launch QA-аудит. 6 параллельных read-only агентов: 3 по web-buyer
> (shopping flow / cart-checkout-account / chat-cross-cutting), 3 по web-seller
> (auth-onboarding / products / orders-chat-cross-cutting).
> Аудит только frontend-кода сервис-веток `web-buyer` / `web-seller`.

## Вердикт

**К запуску в текущем виде — НЕ готово.** Найдено **~20 реальных багов** (🔴) и
**~30 недочётов** (🟡) в двух апах. Часть — money/data-уровня (доставка не
считается, дубли вариантов/атрибутов, потеря фото). Перед запуском нужно
закрыть как минимум 🔴-блок (см. триаж внизу).

Хорошие новости: `params` везде корректно `await`/`use()`-ятся (Next.js 16 OK),
архитектура чистая — это точечные баги, не структурные.

---

# WEB-BUYER

## 🔴 Баги

### WB-B01 — Доставка никогда не считается и не списывается
`app/(minimal)/checkout/page.tsx:340` — `deliveryFee` читается с поля, которого
нет в типе `CheckoutPreview` (cart.ts:62-69 — только `subtotal/items/...`).
Через loose-cast `PreviewWithFee` → `previewData?.deliveryFee` всегда `undefined`
→ `storeDeliveryFee` всегда `0`. Итог: заказ с доставкой создаётся с
`deliveryFee: 0`, в саммари всегда «Бесплатно». Если продавец задал fixed-плату —
покупатель её не платит.
**Fix:** уточнить реальное имя поля в backend-контракте preview, добавить в
`CheckoutPreview`; убрать loose-cast.

### WB-B02 — Нельзя удалить in-stock товар из корзины
`app/(minimal)/cart/page.tsx:104-113` — `QtyStepper` minus-кнопка
`onChange(Math.max(1, value-1))` и `disabled` при `value<=1` → 0 недостижим.
Ветка `if (next <= 0) remove.mutate(...)` — мёртвый код. Кнопки «Удалить» у
обычной (не-OOS) строки нет. Покупатель не может убрать товар из корзины.
**Fix:** добавить кнопку «Удалить» в строку in-stock товара.

### WB-B03 — `paymentMethod` собирается, но не отправляется
`checkout/page.tsx:382-410` — выбранный `paymentMethod` (line 329) не передаётся
в `confirm.mutateAsync` (хотя `CheckoutConfirmRequest.paymentMethod` уже есть в
типах). Сейчас безвредно (включён только `cash`, backend дефолтит), но поле
мёртвое.
**Fix:** прокинуть `paymentMethod` в payload confirm.

### WB-B04 — Нет error-UI на checkout при сбое preview
`checkout/page.tsx:351-360` — `preview.isError` нигде не рендерится. При 500 от
`/checkout/preview` покупатель видит форму с `subtotal: 0` и кнопку «Подтвердить
заказ · 0 сум» без объяснения. Empty-cart редирект завязан на `preview.isSuccess`
— при ошибке не срабатывает.
**Fix:** баннер `preview.isError` с retry / возвратом в корзину.

### WB-B05 — Протухший токен запирает на форме checkout
`checkout/page.tsx:298,302-305` — `pageStep` инициализируется из наличия
`localStorage` токена. Если токен есть, но протух — юзер заполняет всю форму,
`confirm` падает 401. Хэндлер `savdo:auth:expired` чистит токен, но `pageStep`
не сбрасывает. `isAuthed` (line 298) объявлен и не используется.
**Fix:** гейтить по верифицированному `user`; реагировать на auth-expired
сбросом `pageStep`; убрать мёртвый `isAuthed`.

### WB-B06 — Удаление открытого чат-треда перекидывает в чужой чат
`app/(shop)/chats/page.tsx:585-588` — `useEffect` авто-выбирает `threads[0]`
когда `activeId` пуст. После `onDeleted()` → `activeId=null` → эффект сразу
выбирает `threads[0]`. Удаление текущего треда молча открывает другой чат
вместо пустой панели.
**Fix:** ref-флаг «авто-выбор только при первой загрузке», не на каждый
`threads`.

### WB-B07 — Галерея товара рассинхронена с карточкой
`app/(shop)/[slug]/products/[id]/page.tsx:144` — детальная страница берёт
`product?.mediaUrls ?? []`, а `ProductCard` использует `product.images` с
фоллбэком на `mediaUrls`. Если backend отдаст detail с заполненным `images`,
но пустым `mediaUrls` — на детальной «нет фото», на карточке фото есть.
**Fix:** `images = product.images?.length ? product.images.map(i=>i.url) : product.mediaUrls ?? []`.

### WB-B08 — Нет onError на главном изображении галереи
`[id]/products/[id]/page.tsx:325-333` — `<Image>` без `onError`. `ProductCard`
специально ловит протухшие Supabase-URL (→ 404). На детальной такой URL даст
битую картинку без placeholder.
**Fix:** state `imageErrored` + `onError`, как в `ProductCard`.

### WB-B09 — Аккумулятор заказов: гонка на быстрой смене фильтра
`app/(shop)/orders/page.tsx:114-126` — два эффекта (`[data?.data]` и
`[activeFilter]`) при смене фильтра. На быстром переключении page-1 данные
старого фильтра могут попасть в `accOrders` нового. `handleFilterChange` тоже
сбрасывает то же состояние — дублирование + race-surface.
**Fix:** выводить аккумулятор из `data`+`page` без отдельного эффекта.

### WB-B10 — Мутация общего кэшированного объекта (`.sort()` in-place)
`app/(shop)/[slug]/page.tsx:264` — `store.categories.sort(...)` сортирует на
месте. `store` из `cache()`-обёрнутого `serverGetStoreBySlug` — общий объект
для `generateMetadata` и `StorePage`. В текущем рендере безвредно, но хрупко.
**Fix:** `[...store.categories].sort(...)`.

### WB-B11 — Read-mark при получении сообщения независимо от фокуса
`hooks/use-chat.ts:70-78` — `chat:message` хэндлер на любое событие делает
`setQueryData(threads, unreadCount: 0)` для треда — включая входящие, когда
вкладка свёрнута / юзер проскроллил вверх. Может терять реальный unread.
**Fix:** гейтить сброс `unreadCount` по `document.visibilityState` / фокусу.

### WB-B12 — Авто-readAll на странице уведомлений: визуальный flicker
`app/(shop)/notifications/page.tsx:168-175` — `readAll.mutate()` на mount,
`inbox` со `staleTime:0` рефетчится → строки на 1 кадр рисуются как unread,
потом как read. Чип «Непрочитанные · N» мигает.
**Fix:** оптимистично выставлять `isRead:true` в `useReadAll.onMutate`.

### WB-B13 — Мёртвый клик-аффорданс на не-order уведомлениях
`notifications/page.tsx:59-62` — вся строка `cursor-pointer`+hover, но
`handleClick` навигирует только при regex-совпадении order-UUID **в тексте
body**. Не-order уведомления = клик в никуда. Навигация через scraping UUID из
текста — хрупко (правка текста на backend ломает молча).
**Fix:** `cursor-pointer` только при наличии цели; structured `orderId`/`link`.

## 🟡 Недочёты (web-buyer)

- **Ошибки API маскируются под пустые состояния.** `HomeTopStores`/
  `HomeFeaturedFeed`/`HomeCategoryChips` при `isError` делают `return null` или
  рисуют «Скоро здесь появятся товары». Каталоги `/stores` и `/products`
  игнорируют `isError` → при сбое сети показывают `EmptyState` «пусто».
  Покупатель не видит, что это ошибка. → добавить error-state + retry.
- **`ProductCard` не рисует скидку.** `ProductListItem` несёт `isSale`,
  `salePrice`, `oldPrice`, `discountPercent` (типы прямо говорят «UI рисует
  SALE-бейдж / -30%»). `ProductCard` показывает только `basePrice`. Товар на
  распродаже выглядит по полной цене.
- **Рейтинг отзывов считается по странице.** `ProductReviews.tsx:36` усредняет
  `data.items` (первые 20), хотя заголовок показывает `data.total`. При 21+
  отзывах средний рейтинг неверен. Пагинации нет — видны только первые 20.
- **Якорь `#top-stores` ломается** когда `HomeTopStores` вернул `null` (CTA в
  `HomeHero` ведёт в никуда).
- **Desktop-галерея товара обрезана до 4 фото** (`images.slice(0,4)`,
  `grid-cols-4`) — 5-е фото на desktop недоступно (mobile-точки показывают все).
- **Пустой placeholder-раздел «Из этого магазина»** виден на product page
  (заголовок + «Все →», тело пустое) — выглядит как баг вёрстки.
- **Модалки без Esc / focus-trap:** `ChatComposerModal` (нет Esc, фокус не
  заперт, нет `role="dialog"`); оба confirm-overlay в `chats/page.tsx`
  (удалить сообщение / удалить чат).
- **`ChatView` без error-state** — упавший `useMessages` рисуется как «Нет
  сообщений», composer остаётся активным.
- **Чат-мутации глотают ошибки** (`saveEdit`/`handleSend`/delete — `catch {}`):
  юзер не знает почему не сохранилось / не отправилось; confirm-модалка
  закрывается при ошибке удаления как при успехе.
- **Бейдж уведомлений не live + висит не на той вкладке.** `inbox` без
  `refetchInterval`, `useBuyerSocket` не инвалидирует `NOTIF_KEYS`; на
  `/notifications` сокет вообще не смонтирован. В `BottomNavBar` бейдж
  уведомлений висит на вкладке «Профиль» (вкладки уведомлений нет).
- **`HeaderSearch`** — `input type="text"` (не `search`), дропдаун без
  combobox-ARIA, нет навигации стрелками.
- **`last_store_slug` vs `recent-stores`** — два параллельных источника «последний
  магазин» (`TrackView` пишет первый, `cart` читает первый, `BottomNavBar`
  перешёл на второй) — могут расходиться.
- **Free-delivery прогресс — мёртвое обещание.** `cart/page.tsx:218`
  `delivery = subtotal >= MIN ? 0 : 0` (обе ветки 0). Блок «До бесплатной
  доставки X сум» рисуется, но `total` не меняется.
- **`Number(product.basePrice)` без NaN-guard** в `wishlist/page.tsx:175` →
  `NaN сум` при null.
- **Отмена заказа без error-handling** (`orders/[id]/page.tsx:494`).
- **`normalizeOrder(raw: any)`** в order detail — поля угадываются (`unitPrice ??
  unitPriceSnapshot` и т.п.), при дрейфе backend молча показывает `0`/`—`.

---

# WEB-SELLER

## 🔴 Баги

### WS-B01 — Refresh-interceptor не распознаёт OTP-эндпоинты
`lib/api/client.ts:38-41` — скип token-refresh проверяет `url.includes('/auth/otp/')`,
но реальные пути — `/auth/request-otp` и `/auth/verify-otp`. 401 от неверного
OTP-кода → `_retry` → попытка `/auth/refresh` → на свежем логине (нет refresh
токена) летит `savdo:auth:expired`. Каждый неверный код = странное поведение.
**Fix:** `url.includes('/auth/request-otp') || url.includes('/auth/verify-otp')`.

### WS-B02 — Онбординг: `Promise.all` создаёт partial-failure ловушку
`app/(onboarding)/onboarding/page.tsx:436-444` — `handleStep2` параллельно шлёт
`createStore` + `updateProfile`. Если `updateProfile` упал, а `createStore`
прошёл — магазин создан, но показана ошибка «Не удалось создать магазин».
Повторный сабмит → `createStore` падает дублем (one seller = one store) →
продавец заперт на шаге 2.
**Fix:** сначала `createStore`, потом `updateProfile` последовательно; либо
сделать ретрай идемпотентным (детект существующего магазина).

### WS-B03 — Multi-image upload: гонка теряет фото
`components/multi-image-uploader.tsx:50-85` — `handleFiles` читает `value` один
раз, грузит файлы, потом `onChange([...value, ...uploaded])`. Два быстрых выбора
файлов → второй `handleFiles` работает со старым `value` → перетирает первую
партию. В edit-режиме их `imageIdMapRef` остаётся осиротевшим.
**Fix:** функциональный апдейтер против актуального `value`, либо блокировать
пикер до ре-рендера родителя.

### WS-B04 — Edit page: рассинхрон при ошибке add/remove фото
`app/(dashboard)/products/[id]/edit/page.tsx:171-211` — `setImages(next)`
оптимистично; при падении `addProductImage` ошибка только в `console.error` —
фото остаётся в UI как загруженное, без записи в `imageIdMapRef`. При падении
`deleteProductImage` фото уже убрано из UI, но осталось на сервере.
**Fix:** при ошибке откатывать `setImages`; показывать тост.

### WS-B05 — Edit page: реордер фото молча теряется
`[id]/edit/page.tsx:171-211` — `handleImagesChange` диффит по множеству
`mediaId`. Чистый реордер даёт одинаковые множества → `added`/`removed` пусты →
на сервер ничего не уходит. Drag-to-reorder в UI («Перетащи чтобы поменять
порядок») в edit-режиме не работает, порядок теряется на перезагрузке.
Fallback delete+recreate не реализован.
**Fix:** детектить смену порядка → delete+recreate в новом порядке, либо убрать
drag в edit-режиме.

### WS-B06 — Variant matrix: split лейбла ломается на значениях с `" / "`
`products/create/page.tsx:203-216` + `variants-matrix-builder.tsx:53` — ячейки
вариантов строятся `tuple.join(' / ')`, потом `label.split(' / ')`. Значение
опции с `" / "` внутри (размер `"S / M"`, цвет `"чёрный / белый"`) → split даёт
неверное число частей → варианты создаются с неверными комбинациями или молча
пропускаются. **Data-corruption.**
**Fix:** ключевать ячейки массивом/tuple, не string join/split.

### WS-B07 — `InlineStockEditor`: возможно двойное применение delta
`components/product-variants-section.tsx:519-532` — `draft` инициализируется из
`current` один раз, после успешного `adjustStock` не ре-синхронизируется (нет
`key`-remount, нет эффекта). `delta = num - current`; пока инвалидированный
запрос не рефетчнулся — повторный сабмит применяет delta дважды.
**Fix:** `key={v.id+'-'+v.stockQuantity}` для remount, либо синк `draft` после
успеха.

### WS-B08 — Дубли вариантов не предотвращаются
`product-variants-section.tsx:303-331` — `handleAdd` не проверяет, что вариант с
такой комбинацией опций уже есть. Продавец создаёт два варианта «S / Красный».
`InlineVariantForm` на edit-странице без guard'а.
**Fix:** перед сабмитом проверять существующие `variants` на совпадение
`optionValueIds`.

### WS-B09 — Атрибуты: POST на каждый keystroke + созданные не получают `id`
`[id]/edit/page.tsx:213-241` — `ProductAttributesSection` зовёт `onChange` на
каждый символ; `handleAttributesChange` диффит и `createProductAttribute` POST
ит при полном `name+value`. Возвращённый `id` отбрасывается → следующий keystroke
снова видит «added» → дубли. Удалить созданные нельзя (delete только по `id`).
**Fix:** дебаунс / дифф на blur; писать возвращённый `id` обратно в state.

### WS-B10 — Create product: partial-failure → молчаливый «успех»
`products/create/page.tsx:108-232` — после `create.mutateAsync` все
image/attribute/option/variant вызовы глотают ошибки (`.catch(()=>null)`).
Если все фото и варианты упали — `router.push('/products')` как при полном
успехе. Продавец получает товар без фото/вариантов и не знает.
**Fix:** собирать ошибки → не-блокирующее предупреждение «Товар создан, но N
фото не загрузились».

### WS-B11 — `/become-seller` нет в middleware whitelist
`middleware.ts:5` — `PUBLIC_PATHS = ['/login','/onboarding']`. Логин роутит
BUYER на `/become-seller` (не в whitelist). Сейчас middleware только ставит
заголовки (не редиректит) — не ломает. Но при будущем хардненинге BUYER'ов
залочит. Противоречит `web-seller/CLAUDE.md` [WEB-012] (там BUYER-путь —
`/onboarding`).
**Fix:** добавить `/become-seller` в `PUBLIC_PATHS`.

### WS-B12 — Категории магазина: гонка moveUp/moveDown + порча sortOrder
`app/(dashboard)/store/categories/page.tsx:55-73` — swap шлёт два
`updateMut.mutateAsync` в `Promise.all`, каждый `onSuccess` инвалидирует список
→ два рефетча гонятся. При равных `sortOrder` (возможно из-за `sortOrder:
sorted.length` + дыр от удалений) swap — no-op, стрелки «ничего не делают».
**Fix:** один батч-реордер-запрос; нормализация `sortOrder` на сервере.

### WS-B13 — WS-реконнект: утечка `connect`-листенеров
`hooks/use-seller-socket.ts:45` — `socket.on('connect', joinRoom)`; `joinRoom`
замыкает `storeId`. Каждый ре-ран эффекта (рефетч стора) добавляет новый
листенер. Сокет — module-singleton, не сбрасывается.
**Fix:** регистрировать хэндлеры один раз, гейтить по `storeId` через ref;
либо `removeAllListeners('connect')` перед ре-добавлением.

### WS-B14 — Событие `notification:new` не слушается
`hooks/use-notifications.ts:23` + `use-seller-socket.ts` — backend (`chat.gateway`)
эмитит `notification:new`, и комментарий в gateway говорит «фронт больше не
поллит, слушает `notification:new`». Но web-seller нигде его не слушает,
`useUnreadCount` всё ещё `refetchInterval: 30s`, страница уведомлений не
live-обновляется.
**Fix:** листенер `notification:new` → инвалидация `NOTIF_KEYS.inbox`+`unreadCount`.

### WS-B15 — Чат не покидает предыдущую комнату
`hooks/use-chat.ts:128-151` — при смене треда cleanup делает только
`socket.off('chat:message')`, эмитит `join-chat-room` для нового, но не
`leave-chat-room` для старого (хэндлер на backend есть). Сокет остаётся
подписан на все открытые за сессию треды.
**Fix:** `socket.emit('leave-chat-room', { threadId })` в cleanup.

### WS-B16 — Аккумулятор заказов дублирует строки при рефетче
`app/(dashboard)/orders/page.tsx:274-278` — эффект-аккумулятор зависит только от
`[data?.data]`. Фоновый рефетч page-1 (staleTime 30s / инвалидация от
`useUpdateOrderStatus`) при `page=3` → эффект делает `[...prev, ...data.data]` →
строки page-1 дублируются поверх (+ React key-варнинги). Любая смена статуса на
page>1 триггерит это.
**Fix:** ключевать аккумулятор по `page`, либо хранить страницы в map.

### WS-B17 — Дашборд «Ожидают обработки» врёт при >5 заказов
`app/(dashboard)/dashboard/page.tsx:87,169` — `pendingCount` считается по 5
загруженным строкам (`limit:5`). У продавца с >5 pending — KPI занижен.
**Fix:** отдельный запрос `status: PENDING` count, либо summary-эндпоинт.

## 🟡 Недочёты (web-seller)

- **Cancel-модалки без Esc / focus-trap / backdrop-click** (`orders/page.tsx`,
  `orders/[id]/page.tsx`) — хотя есть готовый a11y-`ConfirmModal`, который не
  используется.
- **Чат: `setText('')` до `await`** (`chat/page.tsx:123`) — при падении отправки
  текст потерян, ошибка не показана.
- **Onboarding теряет введённые данные при «Назад»** — каждый шаг — свежий
  `useForm`, `defaultValues` не прокидываются.
- **Settings: нельзя удалить логотип/обложку** — `logoMediaId ?? undefined`,
  явного «убрать» нет.
- **Settings: `setTimeout` бейджа «Сохранено» не чистится** на unmount (4 секции)
  → React-варн при быстрой навигации.
- **`(dashboard)/layout.tsx:159` — аватар в сайдбаре всегда буква «А»**
  захардкожена.
- **`category-filters-section.tsx:66` + `variants-matrix-builder` — `0`
  неотличим от пустого** в number-инпутах (`Number(x) || 0`); реальный `0` не
  ввести, `stockQuantity` «abc» молча сохраняется как 0.
- **Required category-фильтры не валидируются на сабмите** (рисуется `*`, но
  `onSubmit` не проверяет).
- **`OrderRow` показывает `shortId(order.id)` вместо `orderNumber`** — продавец
  видит другой «#», чем покупатель / уведомления / Telegram. `OrderListItem`
  имеет поле `orderNumber`.
- **`theme-toggle` — меню темы только по правому клику** (нет видимого триггера,
  нет клавиатуры; System-режим не найти).
- **Create page: лейбл кнопки «Создание…» сбрасывается** на «Создать товар»
  пока ещё идёт `Promise.all` фото/вариантов (кнопка disabled, но выглядит
  сломанной).
- **`MultiImageUploader` без прогресса загрузки** (одиночный `ImageUploader` —
  с прогрессом), object-URL превью не ревокаются (утечка blob).
- **Multi-file upload: один битый файл обрывает остальные** (`catch` выходит из
  цикла), показывается только последняя ошибка.
- **Delete-variant `ConfirmModal` без имени варианта** («Удалить вариант?»).
- **`confirm-modal.tsx:32` — Enter подтверждает глобально** пока модалка открыта
  (рискованно для danger-модалок).
- **`analytics conversionRate`** рендерится сырым с `%` — без округления, формат
  значения (доля/процент) неоднозначен.
- **Save-кнопка edit-страницы disabled** если правились только фото/атрибуты/
  варианты (они сохраняются своими хэндлерами) — продавец думает, что не
  сохранилось; нет saved-индикаторов на этих секциях.
- **Category-дропдаун скрыт целиком** пока `globalCategories` пуст/грузится —
  нет скелетона.

---

# Cross-cutting (системное, оба апа)

- **`as unknown as` / `as any` касты** поверх рассинхрона типов с реальными
  ответами API — web-buyer ~9 точек (`store.slug`, `itemCount`, `name`,
  `stock`), web-seller (`OrderListItem` адрес `city`/`addressLine1` не на типе).
  Признак, что `packages/types` DTO разошлись с API. → тикет Полату на
  ревизию response-типов вместо кастов на каждом callsite.
- **Дублирование констант web-seller:** `STATUS_CONFIG`/`STATUS_LABELS`/
  `NEXT_TRANSITION` (3 копии с разными лейблами «Подтверждён»/«Подтвержд.»),
  `toNum`/`fmt` money-хелперы (4 копии, 2 поведения). → вынести в `lib/`.
- **WS edit/delete сообщений не live в web-*:** `use-chat.ts` (оба апа) слушает
  `chat:message`, но игнорирует `chat:message:edited` / `chat:message:deleted`
  (backend их эмитит, TMA — потребляет). Правка/удаление сообщения собеседником
  не обновляет открытый чат realtime.
- **Бейдж уведомлений poll-only в обоих апах** (см. WB / WS-B14) — 30s задержка.
- **`BASE_URL` фоллбэк `http://localhost:3000` продублирован** в `client.ts` и
  `socket.ts` обоих апов.

---

# Триаж к запуску

## 🔴 Блокеры — закрыть ДО запуска

**Волна 1 ✅ закрыта 15.05.2026 (Азим)** — `123b70a` (web-buyer), `73ff29f` (web-seller):
- ✅ `WB-B02` нельзя удалить товар из корзины
- ✅ `WB-B04` нет error-UI на checkout
- ✅ `WS-B01` неверный OTP ломает логин продавца
- ✅ `WS-B02` онбординг-ловушка для новых продавцов
- ✅ `WS-B04` рассинхрон UI/сервера при сбое фото (edit)
- ✅ `WS-B05` drag-реордер фото молча терялся (edit) — affordance скрыт
- ✅ `WS-B06` data-corruption вариантов на `" / "` — введён `VARIANT_LABEL_SEP`
- ✅ `WS-B09` дубли атрибутов (POST-per-keystroke) — дебаунс + lock + id-writeback
- ✅ `WS-B10` create product — молчаливый partial-success — экран-предупреждение
- 〜 `WS-B03` гонка одновременных загрузок — покрыто `disabled={uploading}`.

**Осталось из 🔴:**
- ⏳ `WB-B01` доставка не считается (money) — ждёт контракт `/checkout/preview`
  от Полата (`API-CHECKOUT-PREVIEW-DELIVERY-FEE-001`).

## 🟡 Сильно желательно до запуска
- `WB-B05/B06` чат: чужой тред / read-mark; `WB-B12/B13` уведомления
- `WS-B07/B08` стоки/дубли вариантов; `WS-B16` дубли заказов; `WS-B17` KPI;
  `WS-B19` orderNumber
- Error-UI вместо «пусто» (homepage / каталоги web-buyer)
- Модалки без Esc/focus в обоих апах

## 🟢 После запуска
- Скидки в `ProductCard`, пагинация отзывов, desktop-галерея 4 фото
- Cross-cutting рефактор (дубли констант, касты типов)
- a11y-полировка, theme-toggle UX

## Зона Полата (вынести в tasks.md)
- Ревизия response-типов в `packages/types` (адрес заказа, поля preview) —
  чтобы убрать `as any`-касты во фронте.
- Подтвердить контракт `/checkout/preview` (есть ли `deliveryFee` и под каким
  именем) — нужно для `WB-B01`.
