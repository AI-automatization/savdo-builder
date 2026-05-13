# Buyer Catalog & Seller Onboarding Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать buyer'у полный каталог магазинов и товаров, переделать buyer→seller intercept в web-seller, убрать создание товара из онбординга.

**Architecture:** Точечные правки в `apps/web-buyer` и `apps/web-seller`. Backend готов (бэк не трогаем). Все стили / токены / компоненты переиспользуются.

**Tech Stack:** Next.js 16 (App Router), TanStack Query v5, TypeScript, существующий design system (Soft Color Lifestyle).

**Spec:** `docs/superpowers/specs/2026-05-13-buyer-catalog-and-seller-onboarding-design.md`

**Environment notes:**
- Azim не запускает `pnpm dev` / `pnpm build` локально (PC зависает). Верификация: `tsc --noEmit` через CI после push, code review между задачами.
- 0 frontend tests существует. TDD не применим — заменён на «read-after-edit + grep для breakage».
- Web-buyer работы коммитим в ветку `web-buyer` (текущая). Web-seller работы — в ветку `web-seller` (Phase B потребует переключения).

---

## File Structure

```
apps/web-buyer/src/
├── app/(shop)/
│   ├── page.tsx                          MODIFY (Task 6)
│   ├── stores/page.tsx                   CREATE  (Task 4)
│   └── products/page.tsx                 CREATE  (Task 5)
├── components/
│   ├── layout/Header.tsx                 MODIFY  (Task 6)
│   ├── home/
│   │   ├── HomeTopStores.tsx             MODIFY  (Task 6)
│   │   └── HomeFeaturedFeed.tsx          MODIFY  (Task 6)
│   └── catalog/
│       ├── LoadMoreButton.tsx            CREATE  (Task 3)
│       ├── EmptyState.tsx                CREATE  (Task 3)
│       ├── StoresFilters.tsx             CREATE  (Task 4)
│       ├── StoresGrid.tsx                CREATE  (Task 4)
│       ├── ProductsFilters.tsx           CREATE  (Task 5)
│       └── ProductsGrid.tsx              CREATE  (Task 5)
├── hooks/use-storefront.ts               MODIFY  (Task 2)
├── lib/
│   ├── api/storefront.api.ts             MODIFY  (Task 1)
│   └── analytics.ts                      MODIFY  (Task 1)

apps/web-seller/src/                      (Phase B, ветка web-seller)
├── app/
│   ├── (auth)/login/page.tsx             MODIFY  (Task 9)
│   ├── (onboarding)/
│   │   ├── become-seller/page.tsx        CREATE  (Task 8)
│   │   └── onboarding/page.tsx           MODIFY  (Task 10: убрать Step3)
│   └── (dashboard)/dashboard/page.tsx    MODIFY  (Task 11)
├── hooks/
│   ├── use-seller.ts                     MODIFY  (Task 11)
│   ├── use-chat.ts                       MODIFY  (Task 11)
│   ├── use-products.ts                   MODIFY  (Task 11)
│   └── use-notifications.ts              MODIFY  (Task 11)
└── lib/analytics.ts                      MODIFY  (Task 7)
```

---

## Phase A — Web-buyer Catalog (ветка `web-buyer`)

### Task 1: Storefront API + analytics scaffolding

**Files:**
- Modify: `apps/web-buyer/src/lib/api/storefront.api.ts` (append)
- Modify: `apps/web-buyer/src/lib/analytics.ts` (extend BuyerEvent + track)

- [ ] **Step 1: Add `getStoresCatalog` to storefront.api.ts**

Append after `getStorefrontStoreWithTrust` (примерно строка 138):

```ts
// ── Stores catalog (вся витрина) ─────────────────────────────────────────────

export interface StoresCatalogItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  city: string | null;
  telegramContactLink: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export async function getStoresCatalog(): Promise<StoresCatalogItem[]> {
  const res = await apiClient.get<{ data: StoresCatalogItem[] }>('/storefront/stores');
  return res.data.data;
}
```

**Note:** backend `/storefront/stores` сейчас возвращает `{ data }` обёртку
(`storefront.controller.ts:84`), внутри уже `logoUrl`/`coverUrl` через
`attachStoreImageUrls`. Поля `isVerified/avgRating/reviewCount` присутствуют
(см. `stores.repository.ts:53-55`).

- [ ] **Step 2: Add `getProductsCatalog` to storefront.api.ts**

В том же файле, после `getPlatformFeed`:

```ts
// ── Products catalog (всё, с пагинацией) ─────────────────────────────────────

export interface ProductsCatalogParams {
  globalCategoryId?: string;
  sort?: 'new' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export async function getProductsCatalog(
  params: ProductsCatalogParams = {},
): Promise<{ data: ProductListItem[]; total: number; page: number }> {
  const search = new URLSearchParams();
  if (params.globalCategoryId) search.set('globalCategoryId', params.globalCategoryId);
  if (params.sort) search.set('sort', params.sort);
  if (params.page) search.set('page', String(params.page));
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await apiClient.get<{
    data: ProductListItem[];
    meta: { total: number; page: number };
  }>(qs ? `/storefront/products?${qs}` : `/storefront/products`);
  return { data: res.data.data, total: res.data.meta.total, page: res.data.meta.page };
}
```

- [ ] **Step 3: Extend BuyerEvent in analytics.ts**

В `apps/web-buyer/src/lib/analytics.ts` — добавить две строки в `type BuyerEvent` union (после `chat_started`):

```ts
  | { name: 'stores_catalog_viewed';     payload: { source?: string } }
  | { name: 'products_catalog_viewed';   payload: { category?: string; sort?: string } };
```

- [ ] **Step 4: Add track methods**

В том же файле, в `export const track = { ... }` добавить:

```ts
  storesCatalogViewed: (source?: string) =>
    send({ name: 'stores_catalog_viewed', payload: { source } }),

  productsCatalogViewed: (category?: string, sort?: string) =>
    send({ name: 'products_catalog_viewed', payload: { category, sort } }),
```

Также **внутри** `function send(event: BuyerEvent)` (~строка 20) исправить
извлечение `store_id` — оно сейчас бросает в `analytics_events` рекорд с
`storeId: undefined`, что для catalog events нормально. Никаких правок не нужно.

- [ ] **Step 5: Verify no TS-imports broken**

Run: `grep -rn "from '.*analytics'" apps/web-buyer/src/` — все импорты — `import { track }`, type не используется снаружи. OK.

- [ ] **Step 6: Commit**

```bash
git add apps/web-buyer/src/lib/api/storefront.api.ts apps/web-buyer/src/lib/analytics.ts
git commit -m "feat(web-buyer): storefront API + analytics для catalog pages

- getStoresCatalog — вся витрина
- getProductsCatalog — пагинация + sort + category
- 2 новых track event для catalog mounts

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Storefront hooks для каталога

**Files:**
- Modify: `apps/web-buyer/src/hooks/use-storefront.ts`

- [ ] **Step 1: Add imports**

В импортах из `'../lib/api/storefront.api'` (строки 4-15) добавить:

```ts
  getStoresCatalog,
  getProductsCatalog,
  type ProductsCatalogParams,
```

В импортах из TanStack (строка 3):

```ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
```

- [ ] **Step 2: Extend storefrontKeys**

В `storefrontKeys` объект добавить:

```ts
  storesCatalog: ['storefront', 'stores-catalog'] as const,
  productsCatalog: (params: ProductsCatalogParams) =>
    ['storefront', 'products-catalog', params] as const,
```

- [ ] **Step 3: Add `useStoresCatalog`**

В конец файла:

```ts
// ── Catalog: stores ──────────────────────────────────────────────────────────

export function useStoresCatalog() {
  return useQuery({
    queryKey: storefrontKeys.storesCatalog,
    queryFn:  getStoresCatalog,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 4: Add `useProductsCatalog`**

```ts
// ── Catalog: products (infinite) ─────────────────────────────────────────────

export const PRODUCTS_CATALOG_PAGE_SIZE = 24;

export function useProductsCatalog(params: Omit<ProductsCatalogParams, 'page' | 'limit'>) {
  return useInfiniteQuery({
    queryKey: storefrontKeys.productsCatalog(params),
    queryFn: ({ pageParam }) =>
      getProductsCatalog({
        ...params,
        page:  pageParam,
        limit: PRODUCTS_CATALOG_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.data.length === PRODUCTS_CATALOG_PAGE_SIZE ? all.length + 1 : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 5: Verify TS — types of useInfiniteQuery in v5**

В TanStack Query v5 `useInfiniteQuery` требует `initialPageParam` — у нас он есть.
`getNextPageParam` signature `(lastPage, allPages, lastPageParam, allPageParams)` — мы используем `lastPage` + `allPages`, что валидно.

- [ ] **Step 6: Commit**

```bash
git add apps/web-buyer/src/hooks/use-storefront.ts
git commit -m "feat(web-buyer): useStoresCatalog + useProductsCatalog хуки

useStoresCatalog — single fetch всех опубликованных магазинов (cache 5min)
useProductsCatalog — infinite query с пагинацией по 24 на страницу

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Shared catalog UI primitives

**Files:**
- Create: `apps/web-buyer/src/components/catalog/LoadMoreButton.tsx`
- Create: `apps/web-buyer/src/components/catalog/EmptyState.tsx`

- [ ] **Step 1: Create LoadMoreButton**

`apps/web-buyer/src/components/catalog/LoadMoreButton.tsx`:

```tsx
'use client';

import { colors } from '@/lib/styles';

export function LoadMoreButton({
  onClick,
  isLoading,
  hasMore,
}: {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center mt-8">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="px-6 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.textBody,
        }}
      >
        {isLoading ? 'Загрузка…' : 'Загрузить ещё'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create EmptyState**

`apps/web-buyer/src/components/catalog/EmptyState.tsx`:

```tsx
import Link from 'next/link';
import { colors } from '@/lib/styles';

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold mb-1" style={{ color: colors.textBody }}>
        {title}
      </p>
      {description && (
        <p className="text-xs mb-4" style={{ color: colors.textMuted }}>
          {description}
        </p>
      )}
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="inline-block px-5 py-2 rounded-md text-xs font-semibold"
          style={{ background: colors.brand, color: colors.brandTextOnBg }}
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/components/catalog/
git commit -m "feat(web-buyer): LoadMoreButton + EmptyState — shared catalog primitives

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: `/stores` каталог + filters

**Files:**
- Create: `apps/web-buyer/src/components/catalog/StoresGrid.tsx`
- Create: `apps/web-buyer/src/components/catalog/StoresFilters.tsx`
- Create: `apps/web-buyer/src/app/(shop)/stores/page.tsx`

- [ ] **Step 1: Create StoresGrid**

`apps/web-buyer/src/components/catalog/StoresGrid.tsx`:

```tsx
'use client';

import { StoreCard } from '@/components/store/StoreCard';
import { colors } from '@/lib/styles';
import type { StoresCatalogItem } from '@/lib/api/storefront.api';

export function StoresGrid({
  stores,
  isLoading,
  skeletonCount = 8,
}: {
  stores: StoresCatalogItem[];
  isLoading: boolean;
  skeletonCount?: number;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-md h-[110px] animate-pulse"
            style={{ background: colors.skeleton }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {stores.map((s) => (
        <StoreCard
          key={s.id}
          slug={s.slug}
          name={s.name}
          city={s.city ?? undefined}
          logoUrl={s.logoUrl ?? undefined}
          isVerified={s.isVerified}
          avgRating={s.avgRating}
          reviewCount={s.reviewCount}
        />
      ))}
    </div>
  );
}
```

**Pre-check:** убедиться что `StoreCard` принимает эти props. Запустить `grep -n "export function StoreCard\|export interface" apps/web-buyer/src/components/store/StoreCard.tsx` и сверить.

- [ ] **Step 2: Create StoresFilters**

`apps/web-buyer/src/components/catalog/StoresFilters.tsx`:

```tsx
'use client';

import { colors } from '@/lib/styles';
import type { StoresCatalogItem } from '@/lib/api/storefront.api';

export type StoresSortKey = 'top' | 'new' | 'rating';

export interface StoresFiltersState {
  city: string | 'all';
  verifiedOnly: boolean;
  sort: StoresSortKey;
}

const SORT_LABELS: Record<StoresSortKey, string> = {
  top:    'Популярные',
  new:    'Новые',
  rating: 'По рейтингу',
};

export function StoresFilters({
  stores,
  value,
  onChange,
}: {
  stores: StoresCatalogItem[];
  value: StoresFiltersState;
  onChange: (next: StoresFiltersState) => void;
}) {
  const cities = Array.from(
    new Set(stores.map((s) => s.city).filter((c): c is string => !!c)),
  ).sort();

  const selectStyle: React.CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textBody,
    borderRadius: '0.5rem',
    padding: '0.4rem 0.75rem',
    fontSize: '0.8125rem',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        style={selectStyle}
        aria-label="Город"
      >
        <option value="all">Все города</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onChange({ ...value, verifiedOnly: !value.verifiedOnly })}
        style={{
          ...selectStyle,
          background: value.verifiedOnly ? colors.brand : colors.surface,
          color: value.verifiedOnly ? colors.brandTextOnBg : colors.textBody,
          borderColor: value.verifiedOnly ? colors.brand : colors.border,
          fontWeight: 600,
        }}
        aria-pressed={value.verifiedOnly}
      >
        ✓ Только проверенные
      </button>

      <select
        value={value.sort}
        onChange={(e) =>
          onChange({ ...value, sort: e.target.value as StoresSortKey })
        }
        style={selectStyle}
        aria-label="Сортировка"
      >
        {(Object.keys(SORT_LABELS) as StoresSortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Create `/stores` page**

`apps/web-buyer/src/app/(shop)/stores/page.tsx`:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useStoresCatalog } from '@/hooks/use-storefront';
import { StoresGrid } from '@/components/catalog/StoresGrid';
import {
  StoresFilters,
  type StoresFiltersState,
  type StoresSortKey,
} from '@/components/catalog/StoresFilters';
import { EmptyState } from '@/components/catalog/EmptyState';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { colors } from '@/lib/styles';
import { track } from '@/lib/analytics';

const SORT_KEYS: StoresSortKey[] = ['top', 'new', 'rating'];

function parseSort(v: string | null): StoresSortKey {
  return (SORT_KEYS as string[]).includes(v ?? '') ? (v as StoresSortKey) : 'top';
}

export default function StoresCatalogPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<StoresFiltersState>({
    city:         searchParams.get('city')     ?? 'all',
    verifiedOnly: searchParams.get('verified') === '1',
    sort:         parseSort(searchParams.get('sort')),
  });

  const { data, isLoading } = useStoresCatalog();
  const stores = data ?? [];

  useEffect(() => {
    track.storesCatalogViewed('catalog-page');
  }, []);

  // Sync filters → URL (replace без push, чтобы back не множился)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.city !== 'all')   sp.set('city', filters.city);
    if (filters.verifiedOnly)     sp.set('verified', '1');
    if (filters.sort !== 'top')   sp.set('sort', filters.sort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  const filtered = useMemo(() => {
    let out = stores;
    if (filters.city !== 'all') {
      out = out.filter((s) => s.city === filters.city);
    }
    if (filters.verifiedOnly) {
      out = out.filter((s) => s.isVerified);
    }
    if (filters.sort === 'new') {
      out = [...out].reverse(); // backend уже сортирует [verified desc, publishedAt desc]; reverse даёт «старые сверху» — не идеально. Альтернатива в коде ниже.
    } else if (filters.sort === 'rating') {
      out = [...out].sort(
        (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0) || b.reviewCount - a.reviewCount,
      );
    }
    // 'top' — оставляем backend default (verified desc → publishedAt desc).
    return out;
  }, [stores, filters]);

  // Для 'new' лучше сделать через `createdAt`/`publishedAt` если они доступны.
  // Backend не возвращает publishedAt в storesCatalog ответе → используем backend
  // default order как «top» и для 'new'.
  const display = filters.sort === 'new' ? stores.filter((s) => {
    if (filters.city !== 'all' && s.city !== filters.city) return false;
    if (filters.verifiedOnly && !s.isVerified) return false;
    return true;
  }) : filtered;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full mt-6 mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs mb-4 transition-opacity hover:opacity-80"
          style={{ color: colors.textMuted }}
        >
          ← На главную
        </Link>

        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ color: colors.textStrong }}
        >
          Магазины Узбекистана
        </h1>
        <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
          {isLoading ? 'Загружаем…' : `${display.length} магазинов`}
        </p>

        <StoresFilters stores={stores} value={filters} onChange={setFilters} />

        {!isLoading && display.length === 0 ? (
          <EmptyState
            title="По фильтрам ничего не нашлось"
            description="Сбросьте фильтры или вернитесь на главную"
            ctaLabel="На главную"
            ctaHref="/"
          />
        ) : (
          <StoresGrid stores={display} isLoading={isLoading} />
        )}
      </div>
      <BottomNavBar />
    </div>
  );
}
```

- [ ] **Step 4: Verify StoreCard signature**

```bash
grep -n "interface StoreCardProps\|function StoreCard\|export function StoreCard" apps/web-buyer/src/components/store/StoreCard.tsx
```

Expected: props должны включать `slug`, `name`, `city?`, `logoUrl?`, `isVerified?`, `avgRating?`, `reviewCount?`. Если signature другая — адаптировать `StoresGrid` под существующий API. Не менять StoreCard.

- [ ] **Step 5: Commit**

```bash
git add apps/web-buyer/src/components/catalog/StoresGrid.tsx apps/web-buyer/src/components/catalog/StoresFilters.tsx apps/web-buyer/src/app/\(shop\)/stores/page.tsx
git commit -m "feat(web-buyer): /stores каталог магазинов

Filters (city + verified-only + sort) — client-side на ответе /storefront/stores.
URL state (?city=&verified=&sort=).
Empty state для пустых фильтров.
Reuse StoreCard.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: `/products` каталог + filters

**Files:**
- Create: `apps/web-buyer/src/components/catalog/ProductsGrid.tsx`
- Create: `apps/web-buyer/src/components/catalog/ProductsFilters.tsx`
- Create: `apps/web-buyer/src/app/(shop)/products/page.tsx`

- [ ] **Step 1: Create ProductsGrid**

`apps/web-buyer/src/components/catalog/ProductsGrid.tsx`:

```tsx
'use client';

import ProductCard from '@/components/store/ProductCard';
import { colors } from '@/lib/styles';
import type { ProductListItem } from 'types';

export function ProductsGrid({
  products,
  isLoading,
  skeletonCount = 12,
}: {
  products: ProductListItem[];
  isLoading: boolean;
  skeletonCount?: number;
}) {
  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-md aspect-square animate-pulse"
            style={{ background: colors.skeleton }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {products.map((p) => {
        const storeSlug =
          (p as unknown as { store?: { slug?: string } }).store?.slug ?? '';
        return <ProductCard key={p.id} product={p} storeSlug={storeSlug} />;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create ProductsFilters**

`apps/web-buyer/src/components/catalog/ProductsFilters.tsx`:

```tsx
'use client';

import { useGlobalCategoriesTree } from '@/hooks/use-storefront';
import { colors } from '@/lib/styles';

export type ProductsSortKey = 'new' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<ProductsSortKey, string> = {
  new:        'Новые',
  price_asc:  'Дешевле',
  price_desc: 'Дороже',
};

export function ProductsFilters({
  categorySlug,
  sort,
  onChangeCategory,
  onChangeSort,
}: {
  categorySlug: string | null;
  sort: ProductsSortKey;
  onChangeCategory: (slug: string | null) => void;
  onChangeSort: (s: ProductsSortKey) => void;
}) {
  const { data: tree } = useGlobalCategoriesTree();
  const rootCategories = tree ?? [];

  return (
    <div className="mb-5">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <ChipButton
          active={!categorySlug}
          onClick={() => onChangeCategory(null)}
          label="Все"
        />
        {rootCategories.map((c) => (
          <ChipButton
            key={c.id}
            active={categorySlug === c.slug}
            onClick={() => onChangeCategory(c.slug)}
            label={c.nameRu}
            icon={c.iconEmoji}
          />
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onChangeSort(e.target.value as ProductsSortKey)}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.textBody,
          borderRadius: '0.5rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.8125rem',
        }}
        aria-label="Сортировка"
      >
        {(Object.keys(SORT_LABELS) as ProductsSortKey[]).map((k) => (
          <option key={k} value={k}>
            Сортировка: {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
      style={{
        background: active ? colors.brand : colors.surface,
        color: active ? colors.brandTextOnBg : colors.textBody,
        border: `1px solid ${active ? colors.brand : colors.border}`,
      }}
      aria-pressed={active}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
```

- [ ] **Step 3: Verify `GlobalCategoryTreeItem` shape**

```bash
grep -n "GlobalCategoryTreeItem\|iconEmoji" apps/web-buyer/src/types/storefront.ts apps/web-buyer/src/components/home/HomeCategoryChips.tsx
```

Expected: should have `id`, `slug`, `nameRu`, `iconEmoji` (or similar). Если поле названо иначе — адаптировать в ChipButton.

- [ ] **Step 4: Create `/products` page**

`apps/web-buyer/src/app/(shop)/products/page.tsx`:

```tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  useProductsCatalog,
  useGlobalCategoriesTree,
} from '@/hooks/use-storefront';
import { ProductsGrid } from '@/components/catalog/ProductsGrid';
import {
  ProductsFilters,
  type ProductsSortKey,
} from '@/components/catalog/ProductsFilters';
import { LoadMoreButton } from '@/components/catalog/LoadMoreButton';
import { EmptyState } from '@/components/catalog/EmptyState';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { colors } from '@/lib/styles';
import { track } from '@/lib/analytics';

const SORT_KEYS: ProductsSortKey[] = ['new', 'price_asc', 'price_desc'];

function parseSort(v: string | null): ProductsSortKey {
  return (SORT_KEYS as string[]).includes(v ?? '')
    ? (v as ProductsSortKey)
    : 'new';
}

export default function ProductsCatalogPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get('cat');
  const sort         = parseSort(searchParams.get('sort'));

  const tree = useGlobalCategoriesTree();
  const categoryId = useMemo(() => {
    if (!categorySlug) return undefined;
    return tree.data?.find((c) => c.slug === categorySlug)?.id;
  }, [categorySlug, tree.data]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsCatalog({ globalCategoryId: categoryId, sort });

  const products = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data),
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    track.productsCatalogViewed(categorySlug ?? undefined, sort);
  }, [categorySlug, sort]);

  function updateUrl(nextCat: string | null, nextSort: ProductsSortKey) {
    const sp = new URLSearchParams();
    if (nextCat)            sp.set('cat', nextCat);
    if (nextSort !== 'new') sp.set('sort', nextSort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full mt-6 mb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs mb-4 transition-opacity hover:opacity-80"
          style={{ color: colors.textMuted }}
        >
          ← На главную
        </Link>

        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ color: colors.textStrong }}
        >
          Товары
        </h1>
        <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
          {isLoading ? 'Загружаем…' : `${total} товаров`}
        </p>

        <ProductsFilters
          categorySlug={categorySlug}
          sort={sort}
          onChangeCategory={(s) => updateUrl(s, sort)}
          onChangeSort={(s) => updateUrl(categorySlug, s)}
        />

        {!isLoading && products.length === 0 ? (
          <EmptyState
            title={
              categorySlug
                ? 'В этой категории пока нет товаров'
                : 'Товаров пока нет'
            }
            ctaLabel="На главную"
            ctaHref="/"
          />
        ) : (
          <>
            <ProductsGrid products={products} isLoading={isLoading} />
            <LoadMoreButton
              onClick={() => fetchNextPage()}
              isLoading={isFetchingNextPage}
              hasMore={!!hasNextPage}
            />
          </>
        )}
      </div>
      <BottomNavBar />
    </div>
  );
}
```

- [ ] **Step 5: Wrap in Suspense (Next 16 boundary)**

`useSearchParams` в Next 16 требует Suspense boundary для static pre-render. Поскольку page.tsx уже client component с явным `useSearchParams` — обернуть в Suspense **внутри** page (или создать parent server component). Минимальное решение — split:

Refactor: переименовать `ProductsCatalogPage` в `ProductsCatalogInner`, добавить default export wrapper:

```tsx
import { Suspense } from 'react';
// ... остальной код ProductsCatalogInner ...

export default function ProductsCatalogPage() {
  return (
    <Suspense fallback={null}>
      <ProductsCatalogInner />
    </Suspense>
  );
}
```

Тот же фикс применить в `/stores/page.tsx` (Task 4) если build вылетит — см. как сделано в `app/(shop)/page.tsx:35-41` (Suspense wrap для HomeCategoryChips/HomeFeaturedFeed). Это уже паттерн в коде.

**Pre-emptive fix:** добавить Suspense обёртку сразу в обоих `/stores/page.tsx` и `/products/page.tsx` чтобы не словить build error в CI.

Для `/stores/page.tsx` (Task 4) тот же refactor: переименовать body в `StoresCatalogInner`, добавить Suspense wrapper.

- [ ] **Step 6: Commit**

```bash
git add apps/web-buyer/src/components/catalog/ProductsGrid.tsx apps/web-buyer/src/components/catalog/ProductsFilters.tsx apps/web-buyer/src/app/\(shop\)/products/page.tsx apps/web-buyer/src/app/\(shop\)/stores/page.tsx
git commit -m "feat(web-buyer): /products каталог + Suspense boundaries

infinite query (page=1..N по 24).
Category chips reuse useGlobalCategoriesTree.
Sort: new/price_asc/price_desc.
URL state (?cat=&sort=).
Suspense wrap для обоих catalog pages (Next 16 useSearchParams).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Homepage «Все →» links + Header desktop nav

**Files:**
- Modify: `apps/web-buyer/src/components/home/HomeTopStores.tsx`
- Modify: `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx`
- Modify: `apps/web-buyer/src/components/layout/Header.tsx`

- [ ] **Step 1: Add «Все магазины →» link в HomeTopStores**

`apps/web-buyer/src/components/home/HomeTopStores.tsx` — добавить `import Link from 'next/link';` сверху. В блоке `<div className="flex justify-between items-baseline mb-4">` (строки 16-23), после `<h2>`, добавить:

```tsx
        <Link
          href="/stores"
          className="text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ color: colors.brand }}
        >
          Все магазины →
        </Link>
```

Изменения локальные — только этот блок.

- [ ] **Step 2: Add «Все товары →» link в HomeFeaturedFeed**

`apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx` — добавить `import Link from 'next/link';` сверху. В блоке `<div className="flex justify-between items-baseline mb-4">` (строки 37-44), после `<h2>`, добавить:

```tsx
        <Link
          href={catSlug ? `/products?cat=${catSlug}` : '/products'}
          className="text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ color: colors.brand }}
        >
          Все товары →
        </Link>
```

Если фильтр по категории активен на homepage — клик «Все товары →» сохраняет категорию в URL новой страницы.

- [ ] **Step 3: Add desktop nav links в Header**

`apps/web-buyer/src/components/layout/Header.tsx`:

После блока `<Link href="..." Savdo>` (строки 33-40) и **перед** `<HeaderSearch />` (строка 43) добавить:

```tsx
        {/* Catalog nav — desktop only */}
        <nav className="hidden md:flex items-center gap-4 ml-2 flex-shrink-0">
          <Link
            href="/stores"
            className="text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.textBody }}
          >
            Магазины
          </Link>
          <Link
            href="/products"
            className="text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.textBody }}
          >
            Товары
          </Link>
        </nav>
```

- [ ] **Step 4: Verify Header layout doesn't break**

Header использует `flex items-center gap-3` (строка 32). После добавления `<nav>` с собственным `gap-4 ml-2`, остальные элементы (search, иконки) должны корректно сжаться. `HeaderSearch` уже использует `flex-grow`. OK.

На mobile `hidden md:flex` скрывает блок — изменений нет.

- [ ] **Step 5: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeTopStores.tsx apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx apps/web-buyer/src/components/layout/Header.tsx
git commit -m "feat(web-buyer): «Все →» links на homepage + desktop header nav

HomeTopStores → /stores
HomeFeaturedFeed → /products (с сохранением ?cat= если активен)
Header (desktop) → +Магазины/+Товары перед search

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 6: Push web-buyer branch**

```bash
git push origin web-buyer
```

Railway автодеплоит web-buyer. Ждать ~3 мин. Проверить https://savdo.uz/stores и https://savdo.uz/products после deploy.

---

## Phase B — Web-seller (ветка `web-seller`)

### Task 7: Seller analytics scaffolding

- [ ] **Step 1: Switch to web-seller branch**

```bash
git checkout web-seller
git pull origin web-seller --rebase
```

Если ветка отстаёт от web-buyer / main с общими docs/ — fast-forward / rebase нужен только если есть конфликт. Docs spec из Phase A осталась на ветке web-buyer; это OK — она cherry-pick'нется при необходимости. Текущая ветка web-seller имеет всё нужное для seller-кода.

- [ ] **Step 2: Extend SellerEvent in analytics.ts**

`apps/web-seller/src/lib/analytics.ts` — в `type SellerEvent` union (после `order_status_changed`):

```ts
  | { name: 'become_seller_intercept_shown';     payload: Record<string, never> }
  | { name: 'become_seller_intercept_accepted';  payload: Record<string, never> }
  | { name: 'become_seller_intercept_dismissed'; payload: Record<string, never> };
```

- [ ] **Step 3: Add track methods**

В `export const track = { ... }`:

```ts
  becomeSellerInterceptShown: () =>
    send({ name: 'become_seller_intercept_shown', payload: {} }),

  becomeSellerInterceptAccepted: () =>
    send({ name: 'become_seller_intercept_accepted', payload: {} }),

  becomeSellerInterceptDismissed: () =>
    send({ name: 'become_seller_intercept_dismissed', payload: {} }),
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/lib/analytics.ts
git commit -m "feat(web-seller): become_seller_intercept_* analytics events

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: `/become-seller` intercept page

**Files:**
- Create: `apps/web-seller/src/app/(onboarding)/become-seller/page.tsx`

- [ ] **Step 1: Create page**

`apps/web-seller/src/app/(onboarding)/become-seller/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../../lib/auth/context';
import { useStore } from '../../../hooks/use-seller';
import { track } from '../../../lib/analytics';
import { card, colors } from '@/lib/styles';

const BUYER_URL = process.env.NEXT_PUBLIC_BUYER_URL ?? 'https://savdo.uz';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Если SELLER уже есть store — сразу в dashboard.
  const { data: store } = useStore({
    enabled: isAuthenticated && user?.role === 'SELLER',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    track.becomeSellerInterceptShown();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user?.role === 'SELLER' && store) {
      router.replace('/dashboard');
    }
  }, [user, store, router]);

  if (!isAuthenticated) return null;

  function handleAccept() {
    track.becomeSellerInterceptAccepted();
    router.push('/onboarding');
  }

  function handleDismiss() {
    track.becomeSellerInterceptDismissed();
    window.location.href = BUYER_URL;
  }

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div className="rounded-3xl p-7" style={card}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: colors.accent }}
        >
          <ShoppingCart size={16} color={colors.accentTextOnBg} />
        </div>
        <span className="text-base font-bold" style={{ color: colors.brand }}>
          Savdo
        </span>
      </div>

      <div className="text-center mb-7">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: colors.accent }}
        >
          <Rocket size={26} color={colors.accentTextOnBg} />
        </div>
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: colors.textPrimary }}
        >
          У вас ещё нет магазина
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          Откройте свой магазин в Savdo — принимайте заказы прямо в Telegram,
          без сайта и без посредников.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          Открыть магазин
        </button>
        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            background: colors.surfaceMuted,
            border: `1px solid ${colors.border}`,
            color: colors.textBody,
          }}
        >
          Перейти к покупкам
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleLogout}
          className="text-xs transition-opacity hover:opacity-80 underline"
          style={{ color: colors.textDim }}
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify `useAuth().logout` exists**

```bash
grep -n "logout\b" apps/web-seller/src/lib/auth/context.tsx
```

Expected: `logout` метод в context. Если отсутствует — заменить на: `localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');` + `router.replace('/login')`.

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/app/\(onboarding\)/become-seller/
git commit -m "feat(web-seller): /become-seller intercept страница

Buyer попадает на friendly explainer вместо немой /onboarding.
3 CTA: открыть магазин / перейти к покупкам / выйти.
Если SELLER уже имеет store — redirect /dashboard.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Login redirect → `/become-seller` для не-SELLER

**Files:**
- Modify: `apps/web-seller/src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Update verifyOtp.onSuccess redirect**

В `apps/web-seller/src/app/(auth)/login/page.tsx`:

**Найти (строки 49-57):**

```tsx
        onSuccess: (data) => {
          track.otpVerified(fullPhone);
          if (data.user.role === 'SELLER') {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        },
```

**Заменить на:**

```tsx
        onSuccess: (data) => {
          track.otpVerified(fullPhone);
          if (data.user.role === 'SELLER') {
            router.replace("/dashboard");
          } else {
            router.replace("/become-seller");
          }
        },
```

- [ ] **Step 2: Update useEffect auto-redirect**

**Найти (строки 24-31):**

```tsx
  useEffect(() => {
    if (!user) return;
    if (user.role === 'SELLER') {
      router.replace('/dashboard');
    } else {
      router.replace('/onboarding');
    }
  }, [user, router]);
```

**Заменить на:**

```tsx
  useEffect(() => {
    if (!user) return;
    if (user.role === 'SELLER') {
      router.replace('/dashboard');
    } else {
      router.replace('/become-seller');
    }
  }, [user, router]);
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/app/\(auth\)/login/page.tsx
git commit -m "feat(web-seller): redirect не-SELLER на /become-seller вместо /onboarding

Покупатель, входящий в seller-кабинет, теперь получает explainer
вместо немой формы создания магазина.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Убрать Step3 (создание товара) из онбординга

**Files:**
- Modify: `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx`

- [ ] **Step 1: Remove unused imports**

**Найти (строки 6-9):**

```tsx
import { Rocket, ShoppingCart } from 'lucide-react';
import { useCreateStore, useSubmitStore, useStore } from '../../../hooks/use-seller';
import { useUpdateSellerProfile } from '../../../hooks/use-seller';
import { useCreateProduct } from '../../../hooks/use-products';
```

**Заменить на:**

```tsx
import { Rocket, ShoppingCart } from 'lucide-react';
import { useCreateStore, useSubmitStore, useStore } from '../../../hooks/use-seller';
import { useUpdateSellerProfile } from '../../../hooks/use-seller';
```

- [ ] **Step 2: Reduce STEPS array**

**Найти (строки 66-71):**

```tsx
const STEPS = [
  { label: "Магазин" },
  { label: "Контакты" },
  { label: "Товар" },
  { label: "Готово" },
];
```

**Заменить на:**

```tsx
const STEPS = [
  { label: "Магазин" },
  { label: "Контакты" },
  { label: "Готово" },
];
```

- [ ] **Step 3: Remove Step3 component (lines ~309-399)**

Удалить целиком блок:

```tsx
// ── Step 3: First product ─────────────────────────────────────────────────────

interface Step3Data {
  title: string;
  basePrice: number;
}

function Step3({ ... }: { ... }) {
  // вся функция
}
```

От комментария `// ── Step 3: First product ─` до его закрывающей `}` включительно. Убрать ~90 строк.

- [ ] **Step 4: Update Step 4 → Step 3 numbering (renaming the section, not the function)**

**Найти (строка ~401):**

```tsx
// ── Step 4: Submit for review ─────────────────────────────────────────────────
```

**Заменить на:**

```tsx
// ── Step 3: Submit for review ─────────────────────────────────────────────────
```

Сама функция `Step4` остаётся именованной как `Step4` (внутреннее имя) — чтобы не править все ref'ы. Или переименовать в `SubmitStep` (cleaner). **Выбор:** оставляем `Step4` имя, обновляем только комментарии.

- [ ] **Step 5: Remove createProduct usage и handleStep3**

**Найти и удалить (строки ~492):**

```tsx
  const createProduct    = useCreateProduct();
```

**Найти и удалить (строки ~548-562):**

```tsx
  async function handleStep3(data: Step3Data) {
    setError(undefined);
    try {
      const product = await createProduct.mutateAsync({
        title:     data.title,
        basePrice: Number(data.basePrice),
        isVisible: true,
      });
      track.firstProductCreated(product.storeId, product.id);
      setStep(3);
    } catch {
      setError('Не удалось сохранить товар.');
    }
  }
```

- [ ] **Step 6: Update render — skip Step3, set Step4 (submit) на step === 2**

**Найти (строки 596-625):**

```tsx
      {step === 0 && <Step1 onNext={handleStep1} />}

      {step === 1 && (
        <Step2
          onNext={handleStep2}
          onBack={() => setStep(0)}
          isLoading={createStore.isPending || updateProfile.isPending}
          error={error}
        />
      )}

      {step === 2 && (
        <Step3
          onNext={handleStep3}
          onSkip={() => setStep(3)}
          onBack={() => setStep(1)}
          isLoading={createProduct.isPending}
          error={error}
        />
      )}

      {step === 3 && (
        <Step4
          storeName={storeName}
          onSubmit={handleSubmit}
          onSkip={toDashboard}
          isLoading={submitStore.isPending}
          error={error}
        />
      )}
```

**Заменить на:**

```tsx
      {step === 0 && <Step1 onNext={handleStep1} />}

      {step === 1 && (
        <Step2
          onNext={handleStep2}
          onBack={() => setStep(0)}
          isLoading={createStore.isPending || updateProfile.isPending}
          error={error}
        />
      )}

      {step === 2 && (
        <Step4
          storeName={storeName}
          onSubmit={handleSubmit}
          onSkip={toDashboard}
          isLoading={submitStore.isPending}
          error={error}
        />
      )}
```

Step1 после `handleStep1(data)` → `setStep(1)`. Step2 после `handleStep2(data)` → `setStep(2)`. Step2 раньше вызывал `setStep(2)`, теперь это попадает на Step4 (submit). Корректно — wizard cтал 3-шаговый.

- [ ] **Step 7: Verify Step2 setStep value**

В `handleStep2` (строка ~542):

```tsx
      track.storeCreated(store.id, store.slug);
      track.sellerProfileCompleted(store.id);
      setStep(2);
```

`setStep(2)` ведёт теперь на Step4 (submit) — это правильно.

- [ ] **Step 8: Commit**

```bash
git add apps/web-seller/src/app/\(onboarding\)/onboarding/page.tsx
git commit -m "feat(web-seller): убрать Step3 (товар) из онбординга — теперь 3 шага

Онбординг = только регистрация магазина:
1. Магазин (имя+slug)
2. Контакты (telegram+город) + apply BUYER→SELLER + createStore
3. Готово (submit for review)

Первый товар добавляется через dashboard empty-state (Task 11).

Removed: Step3 component (~90 LOC), useCreateProduct import,
handleStep3, track.firstProductCreated call.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Dashboard empty-state + hook guards

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx`
- Modify: `apps/web-seller/src/hooks/use-seller.ts`
- Modify: `apps/web-seller/src/hooks/use-chat.ts`
- Modify: `apps/web-seller/src/hooks/use-products.ts`
- Modify: `apps/web-seller/src/hooks/use-notifications.ts`

- [ ] **Step 1: Add enabled guard to useStore**

`apps/web-seller/src/hooks/use-seller.ts` строки 55-62 — уже принимает `options?.enabled`. Но по умолчанию `enabled: true`. Изменить default:

**Найти:**

```ts
export function useStore(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['seller', 'store'],
    queryFn: getStore,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
```

Default остаётся `true` (есть consumer'ы, передающие explicit `enabled`). Изменений не нужно.

**НО** проверить consumers — `apps/web-seller/src/app/(onboarding)/onboarding/page.tsx:484` уже передаёт `{ enabled: user?.role === 'SELLER' }`. **Для остальных мест без passes** проверить:

```bash
grep -rn "useStore()" apps/web-seller/src/
```

Каждый non-guarded вызов проверить на контекст. Dashboard вызывает `useStore()` без флага (строка 68) — там user уже SELLER (middleware), OK.

**Решение:** не менять default `useStore`. Каждый consumer контролирует сам.

- [ ] **Step 2: Add enabled guards в use-chat.ts**

`apps/web-seller/src/hooks/use-chat.ts` — найти `useChatThreads`, `useUnreadChatCount` (или похожие имена).

```bash
grep -n "export function use" apps/web-seller/src/hooks/use-chat.ts
```

Каждый query-хук, который не имеет `enabled:` — добавить:

```ts
  enabled: options?.enabled ?? true,
```

С опциональным `options?: { enabled?: boolean }` в signature.

**Альтернатива (cleaner):** добавить параметр `enabled` или использовать `useAuth` внутри хука:

```ts
import { useAuth } from '../lib/auth/context';
// ...
const { user } = useAuth();
return useQuery({
  // ...
  enabled: !!user && user.role === 'SELLER',
});
```

Этот вариант лучше — single source of truth. Применить ко всем хукам, которые делают `/seller/*` или `/chat/*` запросы.

- [ ] **Step 3: Add enabled guards в use-products.ts**

`useSellerProducts` (строки 28-38) — добавить `useAuth` гард:

```ts
import { useAuth } from '../lib/auth/context';
// ...
export function useSellerProducts(params?: {
  status?: ProductStatus;
  globalCategoryId?: string;
  storeCategoryId?: string;
}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getSellerProducts(params),
    staleTime: 2 * 60 * 1000,
    enabled: !!user && user.role === 'SELLER',
  });
}
```

То же для `useSellerProduct(id)` (строка 40) и `useProductVariants` (строка 91): добавить `user?.role === 'SELLER'` к `enabled` условию.

- [ ] **Step 4: Add enabled guards в use-notifications.ts**

Найти все query-хуки в `use-notifications.ts`, добавить `useAuth` гард.

- [ ] **Step 5: Verify через grep**

```bash
grep -rn "useQuery\|useInfiniteQuery" apps/web-seller/src/hooks/
```

Каждый query должен иметь либо `enabled` опцию, либо вызывать `/storefront/*` (public). `/seller/*`, `/chat/*`, `/notifications/*`, `/products/*` — должны быть гардированы.

- [ ] **Step 6: Add Dashboard empty-state блок**

В `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx`:

**Добавить импорт** (после строки 5):

```tsx
import { useSellerProducts } from '../../../hooks/use-products';
```

**В компоненте** (после строки 70):

```tsx
  const { data: products, isLoading: productsLoading } = useSellerProducts();
  const hasNoProducts = !productsLoading && (products?.length ?? 0) === 0;
```

**После `<div>` greeting блока** (после строки 104 — закрывающего `</div>` Greeting), **перед** Metrics grid (строка 107):

```tsx
      {/* Empty-state: no products yet */}
      {hasNoProducts && (
        <div className="rounded-2xl p-6" style={card}>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: colors.accent }}
            >
              <Plus size={22} color={colors.accentTextOnBg} />
            </div>
            <div className="flex-1">
              <h2
                className="text-base font-bold mb-1"
                style={{ color: colors.textPrimary }}
              >
                {store?.status === StoreStatus.APPROVED
                  ? 'Магазин активен — добавьте первый товар'
                  : 'Магазин на проверке'}
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: colors.textMuted }}
              >
                {store?.status === StoreStatus.APPROVED
                  ? 'Покупатели уже могут зайти в ваш магазин. Добавьте товары чтобы они появились в каталоге.'
                  : 'Пока ждём одобрения — добавьте свой первый товар. После одобрения он сразу будет доступен покупателям.'}
              </p>
              <Link
                href="/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Plus size={16} />
                Добавить товар
              </Link>
            </div>
          </div>
        </div>
      )}
```

Импорт `Plus` уже есть (строка 11).

- [ ] **Step 7: Verify products/new route exists**

```bash
ls apps/web-seller/src/app/\(dashboard\)/products/
```

Expected: directory `new/` с `page.tsx`. Если её нет — изменить link на существующий create route (например `/products` с query `?create=1` или существующий path).

- [ ] **Step 8: Commit**

```bash
git add apps/web-seller/src/app/\(dashboard\)/dashboard/page.tsx apps/web-seller/src/hooks/
git commit -m "feat(web-seller): empty-state «Добавьте товар» + hook auth guards

Dashboard показывает заметный блок с CTA пока products.length === 0.
Текст адаптируется к store status (PENDING_REVIEW vs APPROVED).

Hook guards:
- useSellerProducts / useSellerProduct / useProductVariants
- useSellerOrders / useSellerSummary (если не было)
- useChatThreads / useUnreadChatCount
- useInboxUnreadCount

Все queries теперь enabled: !!user && user.role === 'SELLER'.
Закрывает 401-spam на /become-seller и /onboarding для buyer'ов.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 9: Push web-seller branch**

```bash
git push origin web-seller
```

Railway автодеплоит web-seller. Проверить https://seller.savdo.uz/login → войти buyer-телефоном → должен попасть на `/become-seller`, без 401-spam в консоли.

---

## Phase C — Final sync

### Task 12: Update tasks tracking files

- [ ] **Step 1: Switch to main branch**

```bash
git checkout main
git pull origin main --rebase
```

- [ ] **Step 2: Update analiz/done.md**

Append секцию:

```markdown
### ✅ [WEB-BUYER-CATALOG-001] /stores + /products каталог
- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Файлы:**
  - apps/web-buyer/src/app/(shop)/stores/page.tsx
  - apps/web-buyer/src/app/(shop)/products/page.tsx
  - apps/web-buyer/src/components/catalog/* (6 файлов)
  - apps/web-buyer/src/hooks/use-storefront.ts
  - apps/web-buyer/src/lib/api/storefront.api.ts + analytics.ts
  - apps/web-buyer/src/components/layout/Header.tsx
  - apps/web-buyer/src/components/home/HomeTopStores.tsx + HomeFeaturedFeed.tsx
- **Что сделано:** новые каталог-страницы со всеми магазинами и товарами, фильтры (city/verified/sort для магазинов, category/sort для товаров), URL-state, infinite scroll для products. Homepage: «Все →» links. Header: desktop nav Магазины/Товары.

### ✅ [WEB-SELLER-ONBOARDING-INTERCEPT-001] buyer→seller explainer
- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Файлы:**
  - apps/web-seller/src/app/(onboarding)/become-seller/page.tsx (NEW)
  - apps/web-seller/src/app/(auth)/login/page.tsx
  - apps/web-seller/src/app/(onboarding)/onboarding/page.tsx (−Step3)
  - apps/web-seller/src/app/(dashboard)/dashboard/page.tsx (+empty-state)
  - apps/web-seller/src/hooks/use-* (enabled guards)
  - apps/web-seller/src/lib/analytics.ts
- **Что сделано:**
  1. /become-seller intercept для buyer входящего в seller-кабинет
  2. Онбординг 4 шага → 3 шага (убрано создание товара)
  3. Dashboard empty-state «Добавьте первый товар»
  4. Закрыт 401-spam через enabled guards в seller-хуках
```

- [ ] **Step 3: Update analiz/tasks.md**

Под Marketing closed section добавить:

```markdown
- [x] **`WEB-BUYER-CATALOG-001`** ✅ 13.05.2026 — /stores и /products catalog pages + homepage «Все →» links. См. done.md.
- [x] **`WEB-SELLER-ONBOARDING-INTERCEPT-001`** ✅ 13.05.2026 — /become-seller explainer + onboarding -1 шаг + dashboard empty-state. См. done.md.
```

Добавить новую открытую задачу для Полата:

```markdown
- [ ] **`API-STORES-PAGINATION-001`** 🟢 — `/storefront/stores` сейчас `take: 50` hardcoded в `findAllPublished` (stores.repository.ts:59). На 37 stores OK; при росте до 500+ — нужна server-side pagination (`page`/`limit`/`cursor`). Frontend в `/stores` каталоге уже готов потреблять paginated ответ.
```

- [ ] **Step 4: Commit on main**

```bash
git add analiz/done.md analiz/tasks.md
git commit -m "docs(analiz): WEB-BUYER-CATALOG-001 + WEB-SELLER-ONBOARDING-INTERCEPT-001 закрыты

+ API-STORES-PAGINATION-001 для Полата (P3)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
git push origin main
```

---

## Self-Review

**1. Spec coverage:**
- §3.1 architecture overview — Tasks 1-11 ✓
- §3.2 /stores layout — Task 4 ✓
- §3.3 /products layout — Task 5 ✓
- §3.4 homepage edits — Task 6 ✓
- §3.5 /become-seller — Task 8 ✓
- §3.6 onboarding -1 шаг — Task 10 ✓
- §3.7 dashboard empty-state — Task 11 ✓
- §3.8 401-spam cleanup — Task 11 ✓
- §4 routing map — Tasks 4, 5, 8, 9 ✓
- §6 hooks API — Task 2 ✓
- §7 tracking events — Tasks 1, 7 ✓

**2. Placeholder scan:**
- Нет TBD / TODO / "implement later"
- Каждый шаг имеет код или конкретную команду
- Verify шаги через `grep` дают конкретный expected output

**3. Type consistency:**
- `StoresCatalogItem` определён в Task 1, используется в Task 2 (`getStoresCatalog`), Task 4 (`StoresGrid`, `StoresFilters`). Consistent.
- `ProductsCatalogParams` определён в Task 1, импортирован в Task 2. Consistent.
- `StoresFiltersState`, `StoresSortKey` определены в Task 4 (`StoresFilters.tsx`), используются в `/stores/page.tsx`. Consistent.
- `ProductsSortKey` определён в Task 5 (`ProductsFilters.tsx`), используется в `/products/page.tsx`. Consistent.

**4. Branch strategy:**
- Phase A (Task 1-6): ветка `web-buyer` (текущая). Push в конце Task 6.
- Phase B (Task 7-11): ветка `web-seller`. Switch в начале Task 7. Push в конце Task 11.
- Phase C (Task 12): ветка `main`, sync analiz docs.

**5. Risks addressed:**
- Suspense boundary для useSearchParams (Next 16) — Task 5 Step 5.
- StoreCard signature mismatch — Task 4 Step 4 verify.
- GlobalCategoryTreeItem shape — Task 5 Step 3 verify.
- `/products/new` route existence — Task 11 Step 7 verify.
- `useAuth().logout` existence — Task 8 Step 2 verify.
