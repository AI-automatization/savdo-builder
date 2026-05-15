# web-buyer · Homepage Discovery + Product Detail Refactor (D+C combo)

**Date:** 2026-05-13  
**Author:** Азим  
**Scope:** apps/web-buyer  
**Backend dependencies:** ✅ закрыты Полатом 12.05 (`GET /storefront/featured` + Store trust signals в БД)

---

## 1. Цель и обоснование

Pre-launch конверсия web-buyer. Сегодня landing — это форма ввода slug магазина, что даёт ~100% bounce для cold-traffic от Google/Instagram/TG. Product page имеет «Спросить у продавца» как outline-secondary CTA и seller-card в конце правой колонки — chat-first поведение узбекского рынка не получает приоритет в иерархии.

Backend готов:
- `GET /api/v1/storefront/featured` → `{topStores[8], featuredProducts[12]}` с trust signals (`isVerified`/`avgRating`/`reviewCount`).
- БД: `Store.isVerified`, `Store.avgRating`, `Store.reviewCount`, `Product.avgRating`, `Product.reviewCount`.

Закрывает P0 marketing блокеры из `analiz/tasks.md`:
- `MARKETING-HOMEPAGE-DISCOVERY-001` (frontend)
- `MARKETING-VERIFIED-SELLER-001` (frontend, для web-buyer — TMA уже сделан).

## 2. Scope первой волны (вариант "c": pre-launch minimum + iterate)

### IN

**D — Homepage Discovery** (полный):
- Полная переработка `apps/web-buyer/src/app/(shop)/page.tsx` (server component с `metadata`).
- Hero «Brand-voice + Categories» (вариант B из preview-3-options).
- Search: используем существующий `HeaderSearch` (inline dropdown в шапке), новой страницы не делаем.
- Категории chip row: root-категории из `GET /storefront/categories/tree`, иконка из `iconEmoji` (fallback lucide-react).
- Top stores 8 шт из `/storefront/featured.topStores`.
- Featured products 12 шт из `/storefront/featured.featuredProducts`, фильтр по выбранной категории через `?cat=` URL param и `useStorefrontProducts({globalCategoryId})`.
- Сохранить `RecentStores` секцию (тёплый возврат) — рендерим если есть localStorage entries.
- Сохранить 2 быстрых ссылки (Заказы / Чаты) — рендерим под featured products, чтобы они не доминировали hero.
- SEO: `export const metadata`, `og:image`, sitemap уже есть (`MARKETING-SEO-INFRA-001` done).

**C — Product Detail Refactor** (минимум):
- Переставить **Seller card НАВЕРХ** правой колонки `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — между title и variant pickers.
- Добавить **VerifiedBadge** в Seller card (если `store.isVerified`).
- Добавить **rating строку** (`★ 4.9 · 230 отзывов` если `reviewCount > 0`).
- Поднять «Спросить у продавца» в **primary CTA вровень с «В корзину»** (filled brand-color, не outline). Desktop CTA row: `[Qty] [В корзину] [Обсудить]`. Mobile sticky: 2 кнопки рядом.

### OUT (отложено)

- Inline-калькулятор доставки на product page → отдельная задача.
- Страницы `/category/[slug]` (фильтрация работает через URL `?cat=...` на homepage, отдельной landing-страницы категории в этой волне нет).
- Полноценная страница `/search` с фильтрами и сортировкой (search работает через inline-dropdown в шапке).
- Mark variant integration (favicon/loading/empty) — это task для направления B.
- Localization (A) и UZ Visual Vocabulary (B) — отдельные направления.
- Hover preview карточки магазина (top stores).
- Real-time online status у seller на product page.

## 3. UX решения

### 3.1 Homepage hero (вариант B — Brand-voice + Categories)

**Header уже существующий** (`apps/web-buyer/src/components/layout/Header.tsx`) с inline `HeaderSearch` dropdown, cart/wishlist/notifications/profile icons и ThemeToggle — рендерится через `(shop)/layout.tsx`. **Не редизайним шапку в этой волне.**

**Структура страницы (mobile-first), под существующим Header:**

```
[Hero — left-aligned, max-width 760px на desktop, full на mobile]
  Stripe: "BOZOR ZAMONAVIY"   ← editorial label, latin uppercase, brand color, 10px letter-spacing 0.18em
  H1: "Магазины Telegram. Без посредников."
  Sub: "Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану."
  CTAs:
    [Смотреть магазины]  ← primary, scroll to TopStores
    [Стать продавцом]    ← ghost, link to TG bot

[Категории chip row — горизонтальный scroll mobile, grid 2x3 на desktop]
  [Все] [👕 Одежда] [📱 Гаджеты] [🍞 Еда] [💄 Красота] [🏠 Дом] [⚽ Спорт]
  ← chips взяты из /storefront/categories/tree (root level, parentId === null, isActive)
  ← клик по chip = applied filter ниже на Featured grid

[Топ магазины — grid 2 cols mobile, 4 cols desktop]
  8 карточек StoreCard (всегда показываем все 8, не фильтруются)

[Новинки — grid 2 cols mobile, 4 cols desktop]
  12 карточек ProductCard. При фильтре по категории —
  заменяем на `useStorefrontProducts({globalCategoryId})`.

[Недавно смотрели]  ← RecentStores (если есть в localStorage)

[Quick links: Заказы / Чаты]

[Footer (© Savdo)]
```

**Behaviors:**
- `RecentStores` рендерим **под** featured, не над. Cold traffic видит featured первым; повторный — увидит свои recent ниже.
- «Стать продавцом» → `https://t.me/savdo_builderBOT?start=become_seller` (паттерн из TMA-BECOME-SELLER-CTA-001).
- **Categories filter chips:** state живёт в HomePage component. Default — все. Клик на chip → re-fetch featured grid через `useStorefrontProducts({globalCategoryId, limit: 12, sort: 'new'})`. Reset chip «Все» возвращает initial `useFeaturedStorefront` data.
- **Categories source:** `GET /storefront/categories/tree` → filter `parentId === null && isActive`, sort by `sortOrder`, take 6 (или 7 если показываем "Все" + 6). Использовать `iconEmoji` из БД, fallback на lucide-react.
- **Search:** inline dropdown в шапке (HeaderSearch) уже работает, дополнительной страницы `/search` в этой волне не делаем.

### 3.2 Product Detail re-order

**Новая структура правой колонки (top → bottom):**

```
1. Editorial label: — Категория  
2. Title (h1)
3. Price + stock
4. ▼ Seller card (NEW — перемещён сюда)
   [Avatar] StoreName ✓verified
            ★ 4.9 · 230 отзывов · Ташкент
            [→ Магазин]
5. Variant pickers (если есть)
6. CTAs row:
   [Qty stepper] [В корзину · 320 000 сум] [💬 Обсудить]
   Mobile sticky: [Qty] [В корзину] [Чат]
7. (description / attributes / reviews — без изменений, ниже)
```

**Иерархия CTA:**
- Desktop: `[QtyStepper] [В корзину · price]primary [💬 Обсудить]filled-accent` в одной flex row.
- Mobile sticky bottom: `[QtyStepper] [В корзину · price]primary [💬]filled-accent-icon-only` — на 375px Qty=36×96, корзина=flex-1, чат=icon-only кнопка 44×44.
- Цвета: «В корзину» — `colors.brand` (текущий primary), «Обсудить» — `colors.brand` с outline → меняем на **filled** с теми же `colors.brand`/`colors.brandTextOnBg`. Различие через размер и порядок: «В корзину» доминирует шириной, «Обсудить» компактна.

**Trust сигналы только когда есть данные:**
- VerifiedBadge только если `store.isVerified === true`.
- Rating строка только если `store.reviewCount > 0`.
- Иначе graceful degradation — просто avatar + name + city.

## 4. Архитектура

### 4.1 Новые компоненты

`(shop)/page.tsx` становится **server component** — для server-side metadata и SEO. Hero/Categories/TopStores/FeaturedFeed — **client components** под ним (используют hooks).

| Компонент | Файл | Тип | Назначение |
|----------|------|-----|-----------|
| `HomePage` | `apps/web-buyer/src/app/(shop)/page.tsx` | server | `export const metadata` + рендер дочерних client components + JSON-LD блок |
| `HomeHero` | `apps/web-buyer/src/components/home/HomeHero.tsx` | server | Brand-voice блок: stripe + h1 + sub + CTAs. Статика, без hooks. |
| `HomeCategoryChips` | `apps/web-buyer/src/components/home/HomeCategoryChips.tsx` | client | Fetch `useGlobalCategoriesTree`, render chips, emit selected `globalCategoryId` через callback или URL param |
| `HomeTopStores` | `apps/web-buyer/src/components/home/HomeTopStores.tsx` | client | Использует `useFeaturedStorefront`, рендерит grid из StoreCard |
| `HomeFeaturedFeed` | `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx` | client | Если `globalCategoryId` selected — `useStorefrontProducts({globalCategoryId})`; иначе `useFeaturedStorefront().featuredProducts`. Рендерит grid из ProductCard. |
| `StoreCard` | `apps/web-buyer/src/components/store/StoreCard.tsx` | server | Логотип/имя/город/VerifiedBadge/StoreRating. Reused в HomeTopStores + product page seller block |
| `VerifiedBadge` | `apps/web-buyer/src/components/store/VerifiedBadge.tsx` | server | Зелёная иконка ✓ с tooltip "Проверенный магазин" |
| `StoreRating` | `apps/web-buyer/src/components/store/StoreRating.tsx` | server | `★ 4.9 · 230 отзывов` форматер (1 десятый знак, плюрализ "отзыв/отзыва/отзывов") |
| `ProductCard` | `apps/web-buyer/src/components/store/ProductCard.tsx` | **существующий** | Reuse. Возможно потребуется adapter если featured response shape отличается от ProductListItem (см. §4.4) |

State между `HomeCategoryChips` и `HomeFeaturedFeed` синхронизируется через URL search param `?cat=<globalCategorySlug>` (или `?categoryId=<id>`) — shareable links, browser back works. Использовать `useSearchParams` / `useRouter`.

### 4.2 Новые hooks

| Hook | Файл | Возвращает |
|------|------|-----------|
| `useFeaturedStorefront` | `apps/web-buyer/src/hooks/use-storefront.ts` (доп. экспорт) | `{topStores, featuredProducts}` от `GET /storefront/featured`. Cache 5 мин, no refetch on focus. |
| `useGlobalCategoriesTree` | `apps/web-buyer/src/hooks/use-storefront.ts` | Все global categories от `GET /storefront/categories/tree`. Cache 1 час (статика). |
| `useStoreBySlug` | `apps/web-buyer/src/hooks/use-storefront.ts` | Расширенный store с `isVerified/avgRating/reviewCount` от `GET /storefront/stores/:slug`. Используется на product page (C). |
| `useStorefrontProducts` | **существующий** (`apps/web-buyer/src/hooks/use-storefront.ts`) | Reuse для filtered featured feed. Передаём `{globalCategoryId, limit: 12, sort: 'new'}`. |

### 4.3 Локальные типы

`packages/types` — read-only для меня. Создаю локальные расширения:

```ts
// apps/web-buyer/src/types/storefront.ts
import type { Store, StoreRef } from 'types';

export interface StoreTrustSignals {
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export type StoreWithTrust = Store & StoreTrustSignals;
export type StoreRefWithTrust = StoreRef & StoreTrustSignals;

export interface FeaturedStorefrontResponse {
  topStores: Array<{
    id: string;
    slug: string;
    name: string;
    city: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    isVerified: boolean;
    avgRating: number | null;
    reviewCount: number;
  }>;
  featuredProducts: Array<{
    id: string;
    title: string;
    basePrice: number;
    salePrice: number | null;
    isSale: boolean;
    discountPercent: number | null;
    currencyCode: string;
    avgRating: number | null;
    reviewCount: number;
    mediaUrl: string | null;
    store: { id: string; slug: string; name: string };
  }>;
}
```

Когда Полат обновит `packages/types` (см. §6 ниже) — локальные типы удаляем, переходим на canonical.

### 4.4 Data flow

**Homepage:**

```
HomePage (server component)
  ├─ export const metadata = { title, description, openGraph } ← SEO
  ├─ <HomeHero />                       ← server, статичный текст
  ├─ <HomeCategoryChips />              ← client, fetch tree, set ?cat= URL param
  ├─ <HomeTopStores />                  ← client, fetch featured.topStores
  ├─ <HomeFeaturedFeed categoryId={?cat-from-URL} />
  │     если categoryId присутствует → useStorefrontProducts(...)
  │     иначе                          → featuredProducts из useFeaturedStorefront()
  ├─ <RecentStores /> (существующий, localStorage)
  ├─ <QuickLinks /> (Заказы + Чаты)
  └─ JSON-LD <script> ItemList — server-rendered, читает featured async
       (если асинхронность мешает — оставляем ItemList пустой и полагаемся
       на client crawl Googlebot; rendering JS Googlebot поддерживает с 2018)
```

**Adapter для ProductCard:** существующий `ProductCard` принимает `ProductListItem`. Featured products из `/storefront/featured` возвращают shape без `description/oldPrice/storeId/status/isVisible/globalCategoryId/storeCategoryId/mediaUrls/images/variantCount/displayType` — только подмножество. Создать `featuredProductToListItem(f)` adapter в `apps/web-buyer/src/lib/storefront-adapters.ts` который мапит featured shape → `ProductListItem`-совместимый объект с разумными defaults (`status: ACTIVE`, `isVisible: true`, `displayType: 'SINGLE'`, `images: [{url: mediaUrl}]` etc).

**Product page (изменения):**

```
ProductPage
  ├─ useProduct(id) → product.store (текущее, без trust signals)
  ├─ useStoreBySlug(storeSlug) → store with trust signals  ← НОВЫЙ запрос
  └─ Render:
       ...
       <SellerCard
         storeName={product.store.name}
         storeCity={product.store.city}
         storeSlug={product.store.slug}
         isVerified={storeFull?.isVerified ?? false}
         avgRating={storeFull?.avgRating ?? null}
         reviewCount={storeFull?.reviewCount ?? 0}
       />
       ...
       <CTAsRow>
         <QtyStepper />
         <PrimaryButton>В корзину</PrimaryButton>
         <SecondaryButton variant="filled-accent" onClick={openChat}>Обсудить</SecondaryButton>
       </CTAsRow>
```

Второй запрос на `/storefront/stores/:slug` — это компромисс пока Полат не расширит `Product.store` (см. §6).

## 5. Дизайн

Следует существующей системе `apps/web-buyer/src/lib/styles.ts` (`colors.*` palette). Никаких новых токенов в первой волне.

- Hero stripe: `colors.brand`, 10px, uppercase, letter-spacing 0.18em.
- H1: `text-2xl md:text-4xl font-bold`, `colors.textStrong`.
- VerifiedBadge: 14px (mobile) / 16px (desktop), filled green (используем `colors.success` если есть, иначе `#2c6b1e`), inline-flex с tooltip "Проверенный магазин".
- StoreCard: `rounded` (через token), border `colors.border`, hover translate-Y -1px, лого 48x48 круглое.
- Иконки категорий: предпочитаем `iconEmoji` поле из `GlobalCategory` (БД), fallback на lucide-react если `iconEmoji` null. Это даёт админу контроль над иконками без релиза.

## 6. Зависимости от Полата (записать в analiz/tasks.md)

Создать одну новую задачу для Полата:

### `API-PRODUCT-STORE-TRUST-SIGNALS-001` (P1)

**Что:** Расширить `Product.store` в ответах `GET /storefront/products/:id` и `GET /stores/:slug/products/:id` тремя полями: `isVerified: boolean`, `avgRating: number | null`, `reviewCount: number`. Параллельно — обновить `StoreRef` interface в `packages/types/src/api/stores.ts`.

**Зачем:** На product page надо показывать verified ✓ + rating рядом с seller name без дополнительного roundtrip. Если Полат добавит — мой `useStoreBySlug` не нужен, удалю.

**Workaround пока не сделано:** второй запрос через `/storefront/stores/:slug` (lightweight).

**Также (опционально):** Полат может обновить `packages/types/src/api/stores.ts` — добавить `isVerified/avgRating/reviewCount` в `Store` и `StorefrontStore`, чтобы я мог удалить локальные расширения из `apps/web-buyer/src/types/storefront.ts`.

## 7. SEO / A11y

**SEO (homepage):**
- `metadata` экспорт в `app/(shop)/page.tsx` (теперь server component):
  ```ts
  export const metadata: Metadata = {
    title: 'Savdo — магазины Telegram Узбекистана',
    description: 'Магазины Telegram. Без посредников. Прямая связь с продавцом. Доставка по Узбекистану.',
    openGraph: {
      title: 'Savdo — магазины Telegram Узбекистана',
      description: '...',
      url: 'https://savdo.uz',
      siteName: 'Savdo',
      images: [{ url: '/og/home.png', width: 1200, height: 630 }],
      locale: 'ru_RU',
      type: 'website',
    },
  };
  ```
- JSON-LD `Organization` уже есть sitewide (см. `MARKETING-SEO-INFRA-001` done). На homepage добавить JSON-LD `ItemList` для top stores (опционально, не блокер).
- Sitemap уже содержит homepage (`apps/web-buyer/src/app/sitemap.ts`).

**A11y:**
- VerifiedBadge: `aria-label="Проверенный магазин"`.
- Все CTA кнопки уже имеют корректные labels.
- StoreCard как `<Link>` с full-card click target.
- Rating: `<span aria-label="Рейтинг 4.9 из 5, 230 отзывов">★ 4.9 · 230 отзывов</span>`.

## 8. Тестирование

**Что критично проверить:**

1. **Homepage cold load** — никакого 401, никакого FOUC, hero виден за < 1s на 3G (LCP < 2.5s по правилу web-buyer/CLAUDE.md).
2. **TopStores с verified+rating** — если у Trendy `isVerified=true, avgRating=4.9, reviewCount=230` — рендерим ✓ + строку.
3. **TopStores без trust** — если `isVerified=false, reviewCount=0` — только name + city, без визуального шума.
4. **Featured products без рейтинга** — если `reviewCount=0` — не рендерим звёзды.
5. **Product page seller card** — VerifiedBadge только при `isVerified=true`; rating только при `reviewCount>0`.
6. **Mobile sticky CTA** — все три (qty/buy/chat) помещаются без переноса на iPhone SE width (375px).
7. **Empty states** — если `/storefront/featured` вернул пустые массивы — graceful fallback (Hero виден, секции скрыты).
8. **Network failures** — если `/storefront/featured` 5xx — Hero + RecentStores + Quick links всё ещё видны.

Локальный run / pnpm dev — **НЕ запускаем** (см. правило feedback). Тестирование в проде через service-ветку `web-buyer`.

## 9. Rollout

**Branching:** ветка `web-buyer` (правило: деплой через service-ветки, main не используется для деплоя).

**Sequence:**
1. **PR-1 (D — Homepage):** все компоненты Home* + StoreCard + VerifiedBadge + StoreRating + локальные типы + useFeaturedStorefront. Замена `(shop)/page.tsx`. Push в `web-buyer` ветку → авто-деплой.
2. Smoke-проверка в проде, ~1 час.
3. **PR-2 (C — Product Detail):** seller card перемещён + VerifiedBadge/StoreRating интегрированы + «Обсудить» в primary row. Push в `web-buyer` ветку → авто-деплой.
4. Smoke-проверка в проде.
5. **PR-3 (записи docs):** task в `analiz/tasks.md` для Полата (`API-PRODUCT-STORE-TRUST-SIGNALS-001`), запись в `analiz/done.md` (D + C).

После merge `web-buyer` → потом раз в неделю / по готовности `main` сборка с web-buyer изменениями (через merge ветки в main).

## 10. Out-of-scope, на потом

Перечисленное здесь — для следующих волн, не входит в этот spec:

- Inline-калькулятор доставки на product page.
- Страницы `/category/[slug]` с фильтрацией по `globalCategoryId`.
- Полноценная страница `/search` с фильтрами.
- Mark variant integration (favicon/loading/empty/корнер b-hero) — это часть направления B (UZ Visual Vocabulary).
- Localization UZ (направление A).
- Brand voice глоссарий (часть направления B).

## 11. Acceptance criteria

Это spec считается выполненным когда:

- [ ] PR-1 merged в `web-buyer` ветку → homepage в проде показывает: hero + 6 категорий + 8 top stores + 12 featured products + recent stores + quick links.
- [ ] Cold-traffic пользователь видит контент без ввода slug (не «введите slug»).
- [ ] PR-2 merged → product page: seller card между title и variants, ✓ verified виден когда `isVerified=true`, rating виден когда `reviewCount>0`, «Обсудить» рядом с «В корзину» в равном весе.
- [ ] Mobile (375px iPhone SE) — все CTA помещаются, ничего не отрезается.
- [ ] `analiz/done.md` обновлён с записями для `MARKETING-HOMEPAGE-DISCOVERY-001 (frontend)` и `MARKETING-VERIFIED-SELLER-001 (web-buyer frontend)`.
- [ ] `analiz/tasks.md` — добавлена задача `API-PRODUCT-STORE-TRUST-SIGNALS-001` для Полата.
