# Buyer Catalog & Seller Onboarding Fix — Design

**Date:** 2026-05-13
**Domain:** `apps/web-buyer`, `apps/web-seller`
**Owner:** Азим
**Drives:** Полат feedback (screenshots 2026-05-12 и 2026-05-13).

---

## 1. Problem

### 1.1 Web-buyer — нет полного каталога

Yesterday's `MARKETING-HOMEPAGE-DISCOVERY-001` заменил slug-форму на discovery-страницу
(HomeHero + chips + 8 top stores + 12 featured products + recent + quick links).
Это решило главную жалобу «покупателю некуда зайти», но у покупателя по-прежнему **нет способа**:

- посмотреть **все опубликованные магазины** (показывается только топ-8),
- посмотреть **все товары платформы** (показывается только 12 новинок),
- отфильтровать магазины по городу или проверенности,
- отфильтровать товары по категории на отдельной странице (только chip-фильтр на homepage).

TMA имеет отдельные tabs «Магазины» и «Товары» с полным каталогом. Web-buyer должен иметь паритет.

### 1.2 Web-seller — buyer попадает в `/onboarding` без объяснения

Текущий flow в `apps/web-seller/src/app/(auth)/login/page.tsx`:

```
phone → OTP → verifyOtp.onSuccess →
  if role === 'SELLER': /dashboard
  else                : /onboarding   ← молча, без объяснения
```

Покупатель, открывший seller-кабинет случайно (через ссылку, например), сразу попадает на
форму «Создайте магазин». Это создаёт ощущение бага. Полат хочет промежуточный
explainer экран.

Параллельно консоль засорена 401-ms: `useStore`, `useChatThreads`, `useInboxUnreadCount`,
`useSellerApplyStatus` фаерятся для не-SELLER пользователя. Часть этих хуков уже имеют
`enabled: user?.role === 'SELLER'`, часть — нет.

### 1.3 Onboarding содержит создание товара

`(onboarding)/onboarding/page.tsx` Step 3 — мини-форма создания товара
(только `title` + `basePrice`, без фото/описания/категории/вариантов). Результат:
- selller создаёт огрызочный продукт, потом всё равно его редактирует в дашборде,
- frictional шаг, который часто скипают,
- две разные ментальные модели смешаны (регистрация магазина vs наполнение каталога).

Должно быть: онбординг = только регистрация магазина. Первый товар = первая CTA в дашборде.

---

## 2. Goals & Non-Goals

### Goals

1. Дать покупателю полный каталог магазинов и товаров с базовой фильтрацией.
2. Сделать вход покупателя в seller-кабинет понятным (intercept-экран).
3. Убрать создание товара из онбординга, перенести в empty-state дашборда.
4. Подчистить 401-spam в seller-консоли.

### Non-Goals

- **Не редизайн.** Дизайн-токены, шрифты, цвета, существующие компоненты остаются.
- **Не TMA-parity 1:1.** Не делаем search-bar внутри каталога (есть глобальный в хедере),
  не делаем price-range фильтр (на 342 товарах не нужен), не делаем grid/list toggle.
- **Не меняем BottomNav.** Текущие 5 табов остаются; доступ к `/stores`+`/products`
  через homepage links + desktop header.
- **Не трогаем backend.** `/storefront/stores` и `/storefront/products` уже поддерживают
  всё нужное.

---

## 3. Design

### 3.1 Architecture overview

```
web-buyer:
  app/(shop)/
    page.tsx                  ← edit: добавить «Все →» links
    stores/
      page.tsx                ← NEW: каталог магазинов
    products/
      page.tsx                ← NEW: каталог товаров
  components/
    layout/Header.tsx         ← edit: +2 desktop nav links
    home/HomeTopStores.tsx    ← edit: +«Все магазины →»
    home/HomeFeaturedFeed.tsx ← edit: +«Все товары →»
    catalog/                  ← NEW dir
      StoresFilters.tsx       ← NEW: city + verified + sort
      ProductsFilters.tsx     ← NEW: category chips + sort
      LoadMoreButton.tsx      ← NEW: shared
  hooks/use-storefront.ts     ← edit: +useStoresCatalog, +useProductsCatalog
  lib/api/storefront.api.ts   ← edit: +getStoresCatalog, +getProductsCatalog

web-seller:
  app/
    (auth)/login/page.tsx           ← edit: redirect target
    (onboarding)/
      become-seller/page.tsx        ← NEW: intercept
      onboarding/page.tsx           ← edit: убрать Step3 (товар)
    (dashboard)/dashboard/page.tsx  ← edit: empty-state «Добавьте первый товар»
  hooks/use-seller.ts               ← edit: enabled guards для не-SELLER
```

### 3.2 `/stores` — каталог магазинов

**Layout:**

```
Header (sticky)
├── ← На главную (breadcrumb-like)
├── h1 "Магазины Узбекистана"
├── subtitle "N магазинов"
├── StoresFilters
│   ├── City select   [Все города ▾]
│   ├── Verified toggle [✓ Только проверенные]
│   └── Sort select   [Сортировка ▾]  (популярные/новые/рейтинг)
├── Grid 2/3/4 col → StoreCard[]
│   (skeleton 8 шт. на loading)
└── Empty state (если фильтры не вернули ничего)
```

**Data flow:**

- `useStoresCatalog()` → `GET /storefront/stores` → returns ALL published (50 max).
- Filter / sort выполняется **client-side** (на 50 stores нет смысла гонять server).
- Город список вычисляется из ответа: `Set(stores.map(s => s.city)).filter(Boolean).sort()`.
- URL state: `?city=tashkent&verified=1&sort=top` — для шеринга/back-нав.

**Empty state:**
> «По вашим фильтрам ничего не нашлось. Сбросьте фильтры или вернитесь на главную.»

### 3.3 `/products` — каталог товаров

**Layout:**

```
Header
├── ← На главную
├── h1 "Товары"
├── subtitle "N товаров"
├── ProductsFilters
│   ├── CategoryChipRow (root global categories, переиспользует логику HomeCategoryChips)
│   └── Sort select (новые/дешевле/дороже)
├── Grid 2/3/4 col → ProductCard[]
└── [Загрузить ещё] (если есть hasMore)
```

**Data flow:**

- `useProductsCatalog({ categoryId, sort, page })` → `GET /storefront/products?globalCategoryId=&sort=&page=&limit=24`.
- Server-side pagination (бэк уже умеет), client-state хранит accumulated `data`.
- URL state: `?cat=moda&sort=new`.

**Empty state (после фильтра):** «В этой категории пока нет товаров.»

### 3.4 Homepage edits (минимальные)

`HomeTopStores.tsx` — справа от `<h2>—Топ магазины</h2>` добавить:

```tsx
<Link href="/stores" className="text-xs ..." style={{ color: colors.brand }}>
  Все магазины →
</Link>
```

То же для `HomeFeaturedFeed.tsx` → `/products`.

`Header.tsx` — добавить на desktop (`hidden md:flex`) **до** хедер-иконок:

```tsx
<Link href="/stores">Магазины</Link>
<Link href="/products">Товары</Link>
```

Стиль — text-link, без bg, с hover-underline. **BottomNav mobile — не трогаем.** Mobile
пользователи попадают в каталог через homepage links.

### 3.5 `/become-seller` — intercept экран

**Trigger:** в `login/page.tsx` после verifyOtp.onSuccess, если `data.user.role !== 'SELLER'`
**и** у пользователя нет store. Сейчас: `router.replace('/onboarding')`.
Станет: `router.replace('/become-seller')`.

**Layout (single column, max-w-md, центрированный, тот же `OnboardingLayout`):**

```
┌─────────────────────────────────────┐
│  [Savdo logo]                       │
│                                     │
│  🚀 (icon, w-12 h-12 rounded-2xl)   │
│                                     │
│  У вас ещё нет магазина             │
│                                     │
│  Откройте свой магазин в Savdo —    │
│  принимайте заказы прямо в Telegram │
│  без сайта и без посредников.       │
│                                     │
│  [   Открыть магазин   ]            │  → /onboarding
│  [  Перейти к покупкам  ]            │  → savdo.uz (NEXT_PUBLIC_BUYER_URL)
│                                     │
│  Не сейчас?                         │
│  [Выйти из аккаунта]                │  → logout + /login
└─────────────────────────────────────┘
```

**Если seller случайно попал** (у него уже есть store) — `useEffect` редиректит на `/dashboard`.

**Если buyer уже имеет store** (повторный логин) — `useEffect` редиректит на `/dashboard`.

### 3.6 Onboarding — 3 шага вместо 4

**Текущий STEPS:**
```ts
[{ label: "Магазин" }, { label: "Контакты" }, { label: "Товар" }, { label: "Готово" }]
```

**Новый STEPS:**
```ts
[{ label: "Магазин" }, { label: "Контакты" }, { label: "Готово" }]
```

**Удаляется:**
- Компонент `Step3` (`page.tsx:309-399`)
- `handleStep3` (`page.tsx:548-562`)
- Импорт `useCreateProduct`
- Импорт `Step3Data` interface
- Условный рендер `{step === 2 && <Step3 ... />}`
- Условный рендер сдвигается: `{step === 2 && <Step4 ... />}` (бывший Step4)

**Step 4 (теперь Step 3 — submit):** без изменений в UX. Логика та же:
`submitStore.mutateAsync()` → `track.storeSubmittedForReview()` → `router.push('/dashboard')`.

### 3.7 Dashboard empty-state «Добавьте первый товар»

В `(dashboard)/dashboard/page.tsx` — если `productsCount === 0` (через `useSellerProducts`
или существующий dashboard stats hook), показать card блок **выше** обычной dashboard сетки:

```
┌─────────────────────────────────────────────────┐
│  🎉                                              │
│  Магазин на проверке                            │
│                                                 │
│  Пока ждём одобрения — добавьте свой первый    │
│  товар. После одобрения магазина он сразу       │
│  будет доступен покупателям.                    │
│                                                 │
│  [  + Добавить товар  ]   → /products/new       │
└─────────────────────────────────────────────────┘
```

Условие точно: показывается **если** у seller'а 0 товаров (independent от статуса
store — даже approved store без товаров выглядит мёртво).

После добавления первого — этот блок исчезает, дашборд работает обычно.

### 3.8 401-spam cleanup

Пройти все хуки в `apps/web-seller/src/hooks/`:
- `use-seller.ts` — `useStore`, `useSellerApplyStatus`, `useSellerOrders`
- `use-chat.ts` — `useChatThreads`, `useUnreadChatCount`
- `use-products.ts` — `useSellerProducts`
- `use-notifications.ts` — `useInboxUnreadCount`

Каждый должен иметь `enabled: !!user && user.role === 'SELLER'`. Это закрывает 401-ms в консоли
для intercept-экрана и онбординга.

`/seller/apply` 409 (дубликат submit) — фикс через `applySeller.isPending` guard в Step2.

---

## 4. Routing & Auth Map

```
web-buyer (public):
  /              → discovery (как сейчас)
  /stores        → каталог магазинов          NEW
  /products      → каталог товаров            NEW
  /[slug]        → магазин                    (как сейчас)
  /cart, /chats, /orders, /profile, /wishlist  (auth — как сейчас)

web-seller:
  /login                → phone+OTP
  on verifyOtp:
    role=SELLER + store     → /dashboard
    role=SELLER + no store  → /onboarding   (incomplete reg)
    role=BUYER (anything)   → /become-seller  NEW
    role=other (impossible) → /login
  /become-seller        → intercept              NEW
  /onboarding           → 3 шага (-1 шаг)        CHANGED
  /dashboard            → с empty-state          CHANGED
  /products/new         → существующая страница
```

---

## 5. Component Inventory

### New files

| Path | LOC | Purpose |
|------|-----|---------|
| `web-buyer/src/app/(shop)/stores/page.tsx` | ~70 | Каталог магазинов |
| `web-buyer/src/app/(shop)/products/page.tsx` | ~80 | Каталог товаров |
| `web-buyer/src/components/catalog/StoresFilters.tsx` | ~80 | City + verified + sort |
| `web-buyer/src/components/catalog/ProductsFilters.tsx` | ~70 | Category chips + sort |
| `web-buyer/src/components/catalog/StoresGrid.tsx` | ~40 | Reusable grid + skeleton |
| `web-buyer/src/components/catalog/ProductsGrid.tsx` | ~40 | Reusable grid + skeleton |
| `web-buyer/src/components/catalog/LoadMoreButton.tsx` | ~25 | Shared button |
| `web-buyer/src/components/catalog/EmptyState.tsx` | ~20 | Shared empty state |
| `web-seller/src/app/(onboarding)/become-seller/page.tsx` | ~80 | Intercept page |

### Edited files

| Path | Change |
|------|--------|
| `web-buyer/src/components/layout/Header.tsx` | +2 desktop nav links |
| `web-buyer/src/components/home/HomeTopStores.tsx` | +«Все →» link |
| `web-buyer/src/components/home/HomeFeaturedFeed.tsx` | +«Все →» link |
| `web-buyer/src/lib/api/storefront.api.ts` | +`getStoresCatalog`, +`getProductsCatalog` |
| `web-buyer/src/hooks/use-storefront.ts` | +`useStoresCatalog`, +`useProductsCatalog` |
| `web-seller/src/app/(auth)/login/page.tsx` | redirect target → `/become-seller` для не-SELLER |
| `web-seller/src/app/(onboarding)/onboarding/page.tsx` | -100 LOC (удалить Step3) |
| `web-seller/src/app/(dashboard)/dashboard/page.tsx` | +empty-state блок |
| `web-seller/src/hooks/use-seller.ts` | +enabled guards |
| `web-seller/src/hooks/use-chat.ts` | +enabled guards |
| `web-seller/src/hooks/use-products.ts` | +enabled guard |
| `web-seller/src/hooks/use-notifications.ts` | +enabled guard |

---

## 6. State, URL & Hooks

### 6.1 `useStoresCatalog()`

```ts
export function useStoresCatalog() {
  return useQuery({
    queryKey: ['storefront', 'stores', 'all'],
    queryFn:  getStoresCatalog,
    staleTime: 5 * 60_000,  // 5 min
  });
}
```

Возвращает массив всех опубликованных магазинов (одним вызовом, до 50). Filter / sort
делаются в компоненте через `useMemo`. URL-state управляется `useSearchParams` + `useRouter.replace`.

### 6.2 `useProductsCatalog({ categoryId, sort })`

```ts
const PRODUCTS_PAGE_SIZE = 24;

export function useProductsCatalog(params: {
  categoryId?: string;
  sort?: 'new' | 'price_asc' | 'price_desc';
}) {
  return useInfiniteQuery({
    queryKey: ['storefront', 'products-catalog', params],
    queryFn: ({ pageParam = 1 }) => getProductsCatalog({
      globalCategoryId: params.categoryId,
      sort: params.sort,
      page: pageParam,
      limit: PRODUCTS_PAGE_SIZE,
    }),
    getNextPageParam: (last, all) =>
      last.data.length === PRODUCTS_PAGE_SIZE ? all.length + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60_000,
  });
}
```

«Загрузить ещё» → `fetchNextPage()`. URL state: `?cat=&sort=`.

---

## 7. Tracking

Новые analytics events (через `track`):

| Event | Trigger |
|-------|---------|
| `stores_catalog_viewed` | `/stores` mount |
| `products_catalog_viewed` | `/products` mount |
| `become_seller_intercept_shown` | `/become-seller` mount |
| `become_seller_intercept_accepted` | click «Открыть магазин» |
| `become_seller_intercept_dismissed` | click «Перейти к покупкам» |

Существующие `storefront_viewed`, `product_viewed`, `add_to_cart` — без изменений.

---

## 8. Edge cases & Validation

| Case | Behaviour |
|------|-----------|
| `/stores` — 0 опубликованных магазинов | Empty state «Магазинов пока нет», CTA «Стать продавцом» |
| `/products` — 0 товаров | Empty state «Товаров пока нет», CTA «На главную» |
| `/products?cat=invalid-slug` | Backend вернёт пустой набор. Empty state «В категории пусто, [Все категории]» |
| `/become-seller` — пользователь не залогинен | redirect `/login` (useEffect guard) |
| `/become-seller` — у пользователя уже есть store | redirect `/dashboard` |
| Dashboard empty-state — store ещё не approved | блок виден; «после одобрения он будет доступен» |
| Dashboard empty-state — store approved, 0 товаров | блок виден без оговорки «на проверке» |
| Onboarding: BUYER в Step2 нажал submit дважды | `isPending` guard (есть) + 409 → toast «Уже подано» |

---

## 9. Risks

1. **Backend pagination для /storefront/stores отсутствует.** Сейчас `take: 50` хардкод.
   На 37 stores — OK; если платформа вырастет до 500+ магазинов, потребуется server-side
   pagination от Полата. Записать в `analiz/tasks.md` как `API-STORES-PAGINATION-001` P2.
2. **`STEPS` константа в onboarding** используется в `ProgressBar` — после удаления Step3
   нужно проверить что прогресс рендерится корректно для 3 шагов.
3. **Telemetry events** должны быть добавлены в `lib/analytics.ts` `track.*` API первыми,
   иначе TS-build упадёт.
4. **Mobile homepage** — после добавления «Все →» links справа от h2 убедиться что на
   mobile они не вылезают за viewport.

---

## 10. Out of Scope (future work)

- `/stores/[city]` SEO-pages.
- Глобальный price-range filter на `/products`.
- Grid/list toggle на каталоге.
- Server-side pagination для `/storefront/stores`.
- Search bar внутри `/stores` и `/products` (есть глобальный в хедере).
