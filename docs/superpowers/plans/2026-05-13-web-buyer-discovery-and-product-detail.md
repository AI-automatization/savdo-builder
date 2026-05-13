# web-buyer — Homepage Discovery + Product Detail Refactor (D+C)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Заменить slug-форму на homepage discovery page (Brand-voice + top stores + featured products + category chips) и поднять seller-block + «Обсудить» CTA на product page для chat-first conversion.

**Architecture:** Server component `(shop)/page.tsx` с `metadata` экспортом, дочерние client components используют `useFeaturedStorefront` (`/storefront/featured`) и `useGlobalCategoriesTree` (`/storefront/categories/tree`). Product page переставляет seller card между title и variants, добавляет `useStoreBySlug` (расширенный с trust signals), повышает «Обсудить» до filled-accent CTA рядом с «В корзину».

**Tech Stack:** Next.js 16 App Router · TypeScript · Tailwind · TanStack Query · lucide-react · existing storefront API (NestJS).

**Spec:** `docs/superpowers/specs/2026-05-13-web-buyer-discovery-and-product-detail-design.md`

**Constraints:**
- ❌ Локальный run/build НЕ запускаем (ПК Азима зависает на pnpm dev) — verification только через push в `web-buyer` ветку → Railway auto-deploy.
- Frontend tests инфры **нет** (`API-FRONTEND-TESTS-001` open). Tasks используют manual verification вместо unit tests.
- `packages/types` read-only для Азима — расширения локально в `apps/web-buyer/src/types/`.
- Branch `web-buyer` существует (`git branch -a` подтверждает). Все коммиты в этой ветке.

---

## File Structure

**New files:**

```
apps/web-buyer/src/types/storefront.ts                                       (local type extensions)
apps/web-buyer/src/lib/storefront-adapters.ts                                (featured → ProductListItem)
apps/web-buyer/src/components/store/VerifiedBadge.tsx                        (✓ badge with tooltip)
apps/web-buyer/src/components/store/StoreRating.tsx                          (★ X.X · N отзывов)
apps/web-buyer/src/components/store/StoreCard.tsx                            (top stores grid item)
apps/web-buyer/src/components/store/SellerCard.tsx                           (rich seller block for product page)
apps/web-buyer/src/components/home/HomeHero.tsx                              (brand-voice hero)
apps/web-buyer/src/components/home/HomeCategoryChips.tsx                     (filter chips row)
apps/web-buyer/src/components/home/HomeTopStores.tsx                         (top stores grid)
apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx                      (featured products grid)
apps/web-buyer/src/components/home/HomeQuickLinks.tsx                        (Заказы/Чаты cards)
```

**Modified files:**

```
apps/web-buyer/src/lib/api/storefront.api.ts                                 (+3 functions)
apps/web-buyer/src/hooks/use-storefront.ts                                   (+3 hooks)
apps/web-buyer/src/app/(shop)/page.tsx                                       (full rewrite, server component)
apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx                  (re-order + CTA promotion)
```

**Docs updates (на main, отдельно):**

```
analiz/tasks.md                                                              (add API-PRODUCT-STORE-TRUST-SIGNALS-001)
analiz/done.md                                                               (+ две записи)
```

---

## Part 0 — Setup

### Task 0: Switch to web-buyer branch

**Files:** none (git operation)

- [ ] **Step 1: Sync from origin and switch to web-buyer**

```bash
git fetch origin
git checkout web-buyer
git rebase origin/main
```

Expected: clean rebase. Если конфликт — abort, спросить Азима как поступить.

- [ ] **Step 2: Verify branch state**

```bash
git status
git log --oneline -5
```

Expected: `On branch web-buyer`, последние коммиты — те же что в main (после rebase) + возможно специфичные web-buyer коммиты с прошлой работы.

---

## Part 1 — Foundation: types & API

### Task 1: Local types for trust signals + featured response

**Files:**
- Create: `apps/web-buyer/src/types/storefront.ts`

- [ ] **Step 1: Создать файл**

```ts
// apps/web-buyer/src/types/storefront.ts
//
// Локальные расширения типов для web-buyer пока packages/types не догнан.
// Полат может удалить, когда обновит StoreRef / Store / StorefrontStore
// и добавит FeaturedStorefrontResponse / GlobalCategoryTreeItem.
//
// Зависимость: API-PRODUCT-STORE-TRUST-SIGNALS-001 (см. analiz/tasks.md).

import type { StorefrontStore } from 'types';

export interface StoreTrustSignals {
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export type StorefrontStoreWithTrust = StorefrontStore & StoreTrustSignals;

export interface FeaturedTopStore {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export interface FeaturedProduct {
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
}

export interface FeaturedStorefrontResponse {
  topStores: FeaturedTopStore[];
  featuredProducts: FeaturedProduct[];
}

/** GlobalCategory с iconEmoji и tree-полями из /storefront/categories/tree. */
export interface GlobalCategoryTreeItem {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  iconEmoji: string | null;
  sortOrder: number;
}
```

- [ ] **Step 2: Verify file is valid TS by referencing in next task** (tsc check откладываем — нет local run по правилам).

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/types/storefront.ts
git commit -m "feat(web-buyer): D+C — local types для FeaturedStorefront/GlobalCategoryTree/StoreTrustSignals"
```

### Task 2: API functions для featured / categories tree / platform-wide feed

**Files:**
- Modify: `apps/web-buyer/src/lib/api/storefront.api.ts`

- [ ] **Step 1: Добавить imports в самый верх файла**

В существующий import statement (line 1) добавить локальные типы. Заменить:

```ts
import type { GlobalCategory, ProductListItem, Product, StorefrontStore } from 'types';
import { apiClient } from './client';
```

на:

```ts
import type { GlobalCategory, ProductListItem, Product, StorefrontStore } from 'types';
import type {
  FeaturedStorefrontResponse,
  GlobalCategoryTreeItem,
  StorefrontStoreWithTrust,
} from '@/types/storefront';
import { apiClient } from './client';
```

- [ ] **Step 2: Добавить новые экспортируемые функции в конец файла**

```ts
// ── Featured storefront (MARKETING-HOMEPAGE-DISCOVERY-001) ───────────────────

export async function getFeaturedStorefront(): Promise<FeaturedStorefrontResponse> {
  const res = await apiClient.get<FeaturedStorefrontResponse>('/storefront/featured');
  return res.data;
}

// ── Categories tree (с iconEmoji) ────────────────────────────────────────────

export async function getCategoriesTree(): Promise<GlobalCategoryTreeItem[]> {
  const res = await apiClient.get<GlobalCategoryTreeItem[]>('/storefront/categories/tree');
  return res.data;
}

// ── Platform-wide products feed (для category-filtered featured) ─────────────

export interface PlatformFeedParams {
  globalCategoryId?: string;
  q?: string;
  sort?: 'new' | 'price_asc' | 'price_desc';
  limit?: number;
}

export async function getPlatformFeed(
  params: PlatformFeedParams = {},
): Promise<{ data: ProductListItem[]; total: number; page: number }> {
  const search = new URLSearchParams();
  if (params.globalCategoryId) search.set('globalCategoryId', params.globalCategoryId);
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await apiClient.get<{
    data: ProductListItem[];
    meta: { total: number; page: number };
  }>(qs ? `/storefront/products?${qs}` : `/storefront/products`);
  return { data: res.data.data, total: res.data.meta.total, page: res.data.meta.page };
}

// ── Store с trust signals (для product page seller block) ────────────────────

export async function getStorefrontStoreWithTrust(slug: string): Promise<StorefrontStoreWithTrust> {
  const res = await apiClient.get<StorefrontStoreWithTrust>(`/storefront/stores/${slug}`);
  return res.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/lib/api/storefront.api.ts
git commit -m "feat(web-buyer): D+C — api клиенты для /storefront/featured + /categories/tree + platform feed"
```

### Task 3: Hooks обёртки

**Files:**
- Modify: `apps/web-buyer/src/hooks/use-storefront.ts`

- [ ] **Step 1: Заменить import statement (line 4)** на:

```ts
import {
  getStoreBySlug,
  getCategories,
  getProducts,
  getProduct,
  getProductReviews,
  getFeaturedStorefront,
  getCategoriesTree,
  getPlatformFeed,
  getStorefrontStoreWithTrust,
  type PlatformFeedParams,
} from '../lib/api/storefront.api';
```

- [ ] **Step 2: Расширить storefrontKeys (lines 6-12)** добавив новые ключи:

```ts
export const storefrontKeys = {
  store: (slug: string) => ['store', slug] as const,
  storeWithTrust: (slug: string) => ['store-with-trust', slug] as const,
  categories: ['categories'] as const,
  categoriesTree: ['categories-tree'] as const,
  products: (storeId: string, filters?: object) => ['products', storeId, filters] as const,
  product: (id: string) => ['product', id] as const,
  productReviews: (id: string, page: number) => ['product-reviews', id, page] as const,
  featured: ['featured'] as const,
  platformFeed: (filters?: object) => ['platform-feed', filters] as const,
};
```

- [ ] **Step 3: Добавить новые hooks в конец файла**

```ts
// ── Featured (homepage) ──────────────────────────────────────────────────────

export function useFeaturedStorefront() {
  return useQuery({
    queryKey: storefrontKeys.featured,
    queryFn: getFeaturedStorefront,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ── Categories tree (root chips на homepage) ─────────────────────────────────

export function useGlobalCategoriesTree() {
  return useQuery({
    queryKey: storefrontKeys.categoriesTree,
    queryFn: getCategoriesTree,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ── Platform-wide feed (category-filtered featured) ──────────────────────────

export function usePlatformFeed(params: PlatformFeedParams) {
  return useQuery({
    queryKey: storefrontKeys.platformFeed(params),
    queryFn: () => getPlatformFeed(params),
    staleTime: 2 * 60 * 1000,
    enabled: true,
  });
}

// ── Store с trust signals (для product page) ─────────────────────────────────

export function useStoreWithTrust(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.storeWithTrust(slug),
    queryFn: () => getStorefrontStoreWithTrust(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-buyer/src/hooks/use-storefront.ts
git commit -m "feat(web-buyer): D+C — hooks useFeaturedStorefront/useGlobalCategoriesTree/usePlatformFeed/useStoreWithTrust"
```

---

## Part 2 — Shared store components

### Task 4: VerifiedBadge

**Files:**
- Create: `apps/web-buyer/src/components/store/VerifiedBadge.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/store/VerifiedBadge.tsx
import { Check } from 'lucide-react';
import { Tooltip } from '@/components/tooltip';
import { colors } from '@/lib/styles';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 12, md: 14, lg: 16 };

interface Props {
  size?: Size;
  /** Если true — без tooltip wrapper (для использования внутри Link). */
  bare?: boolean;
}

export function VerifiedBadge({ size = 'md', bare = false }: Props) {
  const px = SIZE_PX[size];
  const node = (
    <span
      aria-label="Проверенный магазин"
      className="inline-grid place-items-center rounded-full align-middle"
      style={{
        width: px,
        height: px,
        background: colors.success,
        color: colors.brandTextOnBg,
      }}
    >
      <Check size={Math.max(8, px - 4)} strokeWidth={3} />
    </span>
  );
  if (bare) return node;
  return <Tooltip label="Проверенный магазин">{node}</Tooltip>;
}
```

- [ ] **Step 2: Visual self-check**: tooltip uses `colors.success` (green) и Check icon. `bare={true}` нужен для случаев когда VerifiedBadge внутри `<Link>` — Tooltip может ломать клик.

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/components/store/VerifiedBadge.tsx
git commit -m "feat(web-buyer): D+C — VerifiedBadge component (✓ + tooltip 'Проверенный магазин')"
```

### Task 5: StoreRating

**Files:**
- Create: `apps/web-buyer/src/components/store/StoreRating.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/store/StoreRating.tsx
import { Star } from 'lucide-react';
import { colors } from '@/lib/styles';

interface Props {
  rating: number | null;
  reviewCount: number;
  /** Если 0 reviews — компонент не рендерится. */
  hideWhenEmpty?: boolean;
  size?: 'sm' | 'md';
}

function pluralReviews(n: number): string {
  // 1 отзыв, 2-4 отзыва, 5+ отзывов, 11-14 → отзывов
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'отзывов';
  if (mod10 === 1) return 'отзыв';
  if (mod10 >= 2 && mod10 <= 4) return 'отзыва';
  return 'отзывов';
}

export function StoreRating({ rating, reviewCount, hideWhenEmpty = true, size = 'sm' }: Props) {
  if (hideWhenEmpty && reviewCount === 0) return null;
  if (rating == null) return null;

  const formatted = rating.toFixed(1);
  const px = size === 'sm' ? 11 : 13;
  const iconPx = size === 'sm' ? 12 : 14;

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ color: colors.textMuted, fontSize: px }}
      aria-label={`Рейтинг ${formatted} из 5, ${reviewCount} ${pluralReviews(reviewCount)}`}
    >
      <Star size={iconPx} fill={colors.warning} strokeWidth={0} aria-hidden />
      <span style={{ color: colors.textBody, fontWeight: 600 }}>{formatted}</span>
      <span aria-hidden>·</span>
      <span>{reviewCount} {pluralReviews(reviewCount)}</span>
    </span>
  );
}
```

- [ ] **Step 2: Visual self-check**: rating с 4.9 / 230 reviews → "★ 4.9 · 230 отзывов"; 0 reviews → null; rating=null → null; 1 review → "1 отзыв"; 21 reviews → "21 отзыв"; 11 reviews → "11 отзывов".

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/components/store/StoreRating.tsx
git commit -m "feat(web-buyer): D+C — StoreRating component (★ X.X · N отзывов, плюрализ)"
```

### Task 6: StoreCard

**Files:**
- Create: `apps/web-buyer/src/components/store/StoreCard.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/store/StoreCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Store as StoreIcon } from 'lucide-react';
import { colors } from '@/lib/styles';
import { VerifiedBadge } from './VerifiedBadge';
import { StoreRating } from './StoreRating';

interface Props {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
  /** Compact — для product page seller block. Default — full card для grid. */
  variant?: 'card' | 'compact';
}

export function StoreCard({
  slug,
  name,
  city,
  logoUrl,
  isVerified,
  avgRating,
  reviewCount,
  variant = 'card',
}: Props) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/${slug}`}
        className="flex items-center gap-3 p-3 rounded-md transition-colors hover:opacity-90"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <Logo logoUrl={logoUrl} name={name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: colors.textStrong }}>
              {name}
            </span>
            {isVerified && <VerifiedBadge size="sm" bare />}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <StoreRating rating={avgRating} reviewCount={reviewCount} size="sm" />
            {city && (
              <span className="text-[11px]" style={{ color: colors.textMuted }}>
                {city}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm flex-shrink-0" style={{ color: colors.brand }} aria-hidden>
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/${slug}`}
      className="block group rounded-md transition-all hover:-translate-y-0.5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: 12 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Logo logoUrl={logoUrl} name={name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: colors.textStrong }}>
              {name}
            </span>
            {isVerified && <VerifiedBadge size="sm" bare />}
          </div>
          {city && (
            <span className="text-[11px]" style={{ color: colors.textMuted }}>
              {city}
            </span>
          )}
        </div>
      </div>
      <StoreRating rating={avgRating} reviewCount={reviewCount} size="sm" />
    </Link>
  );
}

function Logo({ logoUrl, name, size }: { logoUrl: string | null; name: string; size: number }) {
  if (logoUrl) {
    return (
      <div className="relative rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size, background: colors.surfaceSunken }}>
        <Image src={logoUrl} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: colors.brand, color: colors.brandTextOnBg }}
    >
      <StoreIcon size={Math.max(14, size - 22)} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/components/store/StoreCard.tsx
git commit -m "feat(web-buyer): D+C — StoreCard component (card+compact variants, reused в HomeTopStores + SellerCard)"
```

---

## Part 3 — Homepage (PR-1)

### Task 7: Adapter featured → ProductListItem

**Files:**
- Create: `apps/web-buyer/src/lib/storefront-adapters.ts`

- [ ] **Step 1: Создать файл**

```ts
// apps/web-buyer/src/lib/storefront-adapters.ts
//
// Мост между shape'ом /storefront/featured (узкий) и тем,
// что принимает существующий ProductCard (ProductListItem из packages/types).

import type { ProductListItem } from 'types';
import { ProductStatus } from 'types';
import type { FeaturedProduct } from '@/types/storefront';

/**
 * Расширить featured product до ProductListItem-совместимого объекта.
 * Defaults подобраны так чтобы ProductCard работал без визуальных дефектов
 * (status=ACTIVE, isVisible=true, displayType=SINGLE и т.п.).
 */
export function featuredProductToListItem(f: FeaturedProduct): ProductListItem {
  const mediaUrls = f.mediaUrl ? [f.mediaUrl] : [];
  return {
    id: f.id,
    storeId: f.store.id,
    title: f.title,
    description: null,
    basePrice: f.basePrice,
    oldPrice: null,
    salePrice: f.salePrice,
    isSale: f.isSale,
    discountPercent: f.discountPercent,
    currencyCode: f.currencyCode,
    status: ProductStatus.ACTIVE,
    isVisible: true,
    globalCategoryId: null,
    storeCategoryId: null,
    mediaUrls,
    images: mediaUrls.map((url) => ({ url })),
    variantCount: 0,
    displayType: 'SINGLE',
    inWishlist: undefined,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/lib/storefront-adapters.ts
git commit -m "feat(web-buyer): D+C — adapter featured → ProductListItem"
```

### Task 8: HomeHero

**Files:**
- Create: `apps/web-buyer/src/components/home/HomeHero.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/home/HomeHero.tsx
//
// Server component. Brand-voice блок: stripe + h1 + sub + 2 CTAs.
// Никаких hooks, никакого state.

import { colors } from '@/lib/styles';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'savdo_builderBOT';

export function HomeHero() {
  const becomeSellerHref = `https://t.me/${BOT_USERNAME}?start=become_seller`;

  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-2 max-w-7xl mx-auto">
      <div className="max-w-2xl">
        <div
          className="text-[10px] font-bold uppercase mb-3"
          style={{ color: colors.brand, letterSpacing: '0.18em' }}
        >
          Bozor zamonaviy
        </div>
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-3"
          style={{ color: colors.textStrong }}
        >
          Магазины Telegram.<br />Без посредников.
        </h1>
        <p
          className="text-sm sm:text-base mb-5 max-w-md"
          style={{ color: colors.textMuted, lineHeight: 1.55 }}
        >
          Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="#top-stores"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            Смотреть магазины
          </a>
          <a
            href={becomeSellerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: 'transparent', color: colors.textStrong, border: `1px solid ${colors.border}` }}
          >
            Стать продавцом
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeHero.tsx
git commit -m "feat(web-buyer): D — HomeHero (brand-voice + 2 CTAs)"
```

### Task 9: HomeCategoryChips

**Files:**
- Create: `apps/web-buyer/src/components/home/HomeCategoryChips.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/home/HomeCategoryChips.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useGlobalCategoriesTree } from '@/hooks/use-storefront';
import { colors, pill, pillActive } from '@/lib/styles';

const MAX_CHIPS = 6;

export function HomeCategoryChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading } = useGlobalCategoriesTree();
  const selectedSlug = searchParams.get('cat');

  const roots = useMemo(() => {
    const all = data ?? [];
    return all
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, MAX_CHIPS);
  }, [data]);

  function setCat(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('cat', slug);
    else params.delete('cat');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (isLoading && roots.length === 0) {
    return (
      <section className="px-4 sm:px-6 mt-6 max-w-7xl mx-auto">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 h-8 w-24 rounded-full animate-pulse"
              style={{ background: colors.skeleton }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (roots.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 mt-6 max-w-7xl mx-auto">
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <Chip active={!selectedSlug} onClick={() => setCat(null)} label="Все" />
        {roots.map((c) => (
          <Chip
            key={c.id}
            active={selectedSlug === c.slug}
            onClick={() => setCat(c.slug)}
            icon={c.iconEmoji}
            label={c.nameRu}
          />
        ))}
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string | null;
  label: string;
}) {
  const style = active ? pillActive : pill;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-sm font-semibold transition-colors"
      style={style}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
```

- [ ] **Step 2: Verify mental model**: URL `?cat=clothing` синхронизирован с активным chip; «Все» = reset; на загрузке — 6 skeleton chips; если API пуст — секция скрыта.

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeCategoryChips.tsx
git commit -m "feat(web-buyer): D — HomeCategoryChips (root categories + URL ?cat= filter)"
```

### Task 10: HomeTopStores

**Files:**
- Create: `apps/web-buyer/src/components/home/HomeTopStores.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/home/HomeTopStores.tsx
'use client';

import { useFeaturedStorefront } from '@/hooks/use-storefront';
import { StoreCard } from '@/components/store/StoreCard';
import { colors } from '@/lib/styles';

export function HomeTopStores() {
  const { data, isLoading, isError } = useFeaturedStorefront();
  const stores = data?.topStores ?? [];

  if (isError || (!isLoading && stores.length === 0)) return null;

  return (
    <section id="top-stores" className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-baseline mb-4">
        <h2
          className="text-[10px] font-bold uppercase"
          style={{ color: colors.textMuted, letterSpacing: '0.18em' }}
        >
          — Топ магазины
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <StoreCardSkeleton key={i} />)
          : stores.map((s) => (
              <StoreCard
                key={s.id}
                slug={s.slug}
                name={s.name}
                city={s.city}
                logoUrl={s.logoUrl}
                isVerified={s.isVerified}
                avgRating={s.avgRating}
                reviewCount={s.reviewCount}
              />
            ))}
      </div>
    </section>
  );
}

function StoreCardSkeleton() {
  return (
    <div
      className="rounded-md h-[110px] animate-pulse"
      style={{ background: colors.skeleton }}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeTopStores.tsx
git commit -m "feat(web-buyer): D — HomeTopStores (8 cards grid, no filter)"
```

### Task 11: HomeFeaturedFeed

**Files:**
- Create: `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx`

- [ ] **Step 1: Создать файл**

```tsx
// apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  useFeaturedStorefront,
  useGlobalCategoriesTree,
  usePlatformFeed,
} from '@/hooks/use-storefront';
import ProductCard from '@/components/store/ProductCard';
import { featuredProductToListItem } from '@/lib/storefront-adapters';
import { colors } from '@/lib/styles';

export function HomeFeaturedFeed() {
  const searchParams = useSearchParams();
  const catSlug = searchParams.get('cat');

  const tree = useGlobalCategoriesTree();
  const categoryId = useMemo(() => {
    if (!catSlug) return undefined;
    return tree.data?.find((c) => c.slug === catSlug)?.id;
  }, [catSlug, tree.data]);

  const featured = useFeaturedStorefront();
  const filtered = usePlatformFeed({
    globalCategoryId: categoryId,
    sort: 'new',
    limit: 12,
  });

  const isFilterMode = !!categoryId;
  const isLoading = isFilterMode ? filtered.isLoading : featured.isLoading;

  const items = useMemo(() => {
    if (isFilterMode) {
      return filtered.data?.data ?? [];
    }
    return (featured.data?.featuredProducts ?? []).map(featuredProductToListItem);
  }, [isFilterMode, filtered.data, featured.data]);

  return (
    <section className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-baseline mb-4">
        <h2
          className="text-[10px] font-bold uppercase"
          style={{ color: colors.textMuted, letterSpacing: '0.18em' }}
        >
          — {isFilterMode ? 'По категории' : 'Новинки'}
        </h2>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="rounded-md aspect-square animate-pulse"
              style={{ background: colors.skeleton }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm py-4" style={{ color: colors.textMuted }}>
          {isFilterMode ? 'В этой категории пока нет товаров' : 'Скоро здесь появятся товары'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} storeSlug="" />
          ))}
        </div>
      )}
    </section>
  );
}
```

Замечание: `storeSlug=""` в ProductCard сейчас даст ссылку `/products/:id` без store slug — это сломает routing. Решение: ProductCard ссылается через `/${storeSlug}/products/${product.id}`. Для **featured products** мы знаем `store.slug` через `featured.featuredProducts[i].store.slug` ИЛИ через `usePlatformFeed.data[i].storeId → нужен store lookup`. Перепишем adapter чтобы пробрасывать `storeSlug` отдельным prop.

- [ ] **Step 2: Расширить ProductListItem усложнением** — НЕТ, лучше передавать `storeSlug` в map'е. Заменить два места рендера `<ProductCard>` так:

В блоке `featured mode`:

```tsx
{(featured.data?.featuredProducts ?? []).map((f) => (
  <ProductCard
    key={f.id}
    product={featuredProductToListItem(f)}
    storeSlug={f.store.slug}
  />
))}
```

В блоке `filter mode` нужно знать store slug каждого product. Платформенный feed `getPlatformFeed` возвращает `ProductListItem` без `store.slug`. Нужно либо запросить отдельно, либо backend должен это вернуть. Backend `findAllPublic` возвращает products с `store`-relation? Проверить spec не нужно — на старте plan-execution посмотри `apps/api/src/modules/products/use-cases/find-all-public-products.use-case.ts` или похожее.

**Workaround на implementation time:** если `ProductListItem` from platform feed не содержит `store.slug` — добавляем второй query для resolve. Но **проще** — изменить `featuredProductToListItem`-style adapter для platform feed (мапить через локальный hook на `useStoreById`). Или: при выборе категории показывать товары без store-link, а ссылка из ProductCard ведёт через `/products/${id}` (broken). **Лучший variant:** запросить **backend** добавить `store: {slug}` в `/storefront/products`. Это **новая задача для Полата** (см. §6 spec, можно добавить).

**Decision на implementation:** проверить в момент. Если store.slug нет — записать `API-STOREFRONT-PRODUCTS-STORE-SLUG-001` в analiz/tasks.md и временно использовать non-filtered featured как fallback (отключить category chips для MVP).

Замена структуры в файле:

```tsx
      {isLoading ? (
        <Skeletons />
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {isFilterMode
            ? (filtered.data?.data ?? []).map((p) => {
                // ВАЖНО: storeSlug нужно резолвить. Проверь backend response shape
                // на implementation time — если store.slug отсутствует, открой
                // фолбэк "category chips отключены" + создай task для Полата.
                const storeSlug = (p as unknown as { store?: { slug?: string } }).store?.slug ?? '';
                return <ProductCard key={p.id} product={p} storeSlug={storeSlug} />;
              })
            : (featured.data?.featuredProducts ?? []).map((f) => (
                <ProductCard
                  key={f.id}
                  product={featuredProductToListItem(f)}
                  storeSlug={f.store.slug}
                />
              ))}
        </div>
      )}
```

- [ ] **Step 3: Полная версия файла** — собрать с учётом изменений выше. Если в момент implementation выяснится что `store.slug` нет в platform feed — добавить fallback (отключить chips) + создать backend task.

- [ ] **Step 4: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx
git commit -m "feat(web-buyer): D — HomeFeaturedFeed (featured + category-filtered grid)"
```

### Task 12: HomeQuickLinks

**Files:**
- Create: `apps/web-buyer/src/components/home/HomeQuickLinks.tsx`

- [ ] **Step 1: Создать файл** (взято из текущего page.tsx, инкапсулировано)

```tsx
// apps/web-buyer/src/components/home/HomeQuickLinks.tsx
'use client';

import Link from 'next/link';
import { Package, MessageSquare, ChevronRight } from 'lucide-react';
import { colors } from '@/lib/styles';

export function HomeQuickLinks() {
  return (
    <section className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink
          href="/orders"
          icon={<Package size={18} style={{ color: colors.brand }} />}
          title="Мои заказы"
          subtitle="Статус доставки и история"
        />
        <QuickLink
          href="/chats"
          icon={<MessageSquare size={18} style={{ color: colors.brand }} />}
          title="Чаты с продавцами"
          subtitle="Вопросы по заказу или товару"
        />
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 rounded-md transition-all hover:-translate-y-0.5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: colors.brandMuted }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: colors.textStrong }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight size={14} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
    </Link>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/components/home/HomeQuickLinks.tsx
git commit -m "feat(web-buyer): D — HomeQuickLinks (Orders/Chats cards extracted from old page)"
```

### Task 13: Rewrite (shop)/page.tsx as server component

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/page.tsx`

- [ ] **Step 1: Полная замена содержимого файла**

```tsx
// apps/web-buyer/src/app/(shop)/page.tsx
//
// Server component с metadata для SEO. Hero — server, остальные блоки
// (chips/top stores/featured) — client с TanStack Query.

import type { Metadata } from 'next';
import { RecentStores } from '@/components/home/RecentStores';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCategoryChips } from '@/components/home/HomeCategoryChips';
import { HomeTopStores } from '@/components/home/HomeTopStores';
import { HomeFeaturedFeed } from '@/components/home/HomeFeaturedFeed';
import { HomeQuickLinks } from '@/components/home/HomeQuickLinks';
import { colors } from '@/lib/styles';

export const metadata: Metadata = {
  title: 'Savdo — магазины Telegram Узбекистана',
  description:
    'Магазины Telegram. Без посредников. Прямая связь с продавцом. Доставка по Узбекистану.',
  openGraph: {
    title: 'Savdo — магазины Telegram Узбекистана',
    description: 'Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану.',
    siteName: 'Savdo',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeHero />
      <HomeCategoryChips />
      <HomeTopStores />
      <HomeFeaturedFeed />
      <div className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto w-full">
        <RecentStores />
      </div>
      <HomeQuickLinks />
      <p
        className="text-[11px] text-center mt-10 pb-6"
        style={{ color: colors.textMuted }}
      >
        © 2026 Savdo
      </p>
      <BottomNavBar active="store" />
    </div>
  );
}
```

- [ ] **Step 2: Verify RecentStores tolerates being shown when empty**

Open `apps/web-buyer/src/components/home/RecentStores.tsx`. Проверь: если в localStorage 0 stores — компонент должен render `null` или skip. Если нет — добавить `if (stores.length === 0) return null` в начале компонента. (Этот шаг можно опустить если RecentStores уже корректно скрывается.)

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/app/\(shop\)/page.tsx
git commit -m "feat(web-buyer): D — homepage discovery (hero + chips + top stores + featured + recent + quick links)

MARKETING-HOMEPAGE-DISCOVERY-001 (frontend). Заменяет slug-форму на
discovery page, использует /storefront/featured backend от 12.05."
```

### Task 14: PR-1 deploy и smoke

- [ ] **Step 1: Push web-buyer ветку**

```bash
git push origin web-buyer
```

Expected: Railway автодеплоит сервис web-buyer. Подождать ~3-4 минуты.

- [ ] **Step 2: Smoke в проде (Азим открывает в браузере)**

Открыть production URL web-buyer (например `https://savdo-buyer.up.railway.app`). Visual check:

  - [ ] Hero виден сразу, без формы slug
  - [ ] Категории chip row под hero рендерятся (или skeleton пока loading)
  - [ ] "Топ магазины" — карточки с verified ✓ (если есть verified в БД) + rating (если reviewCount>0)
  - [ ] "Новинки" — 12 cards в grid
  - [ ] Клик по chip "Одежда" — featured grid меняется, URL получает `?cat=clothing`
  - [ ] Клик по "Все" — reset
  - [ ] RecentStores отображается ПОД featured (если есть в localStorage)
  - [ ] Quick links (Заказы/Чаты) — внизу
  - [ ] DevTools Console: 0 errors
  - [ ] Network tab: `/storefront/featured` 200, `/storefront/categories/tree` 200

Если smoke failed — diagnose + fix перед PR-2.

- [ ] **Step 3:** PR-1 considered done.

---

## Part 4 — Product Detail (PR-2)

### Task 15: SellerCard component

**Files:**
- Create: `apps/web-buyer/src/components/store/SellerCard.tsx`

- [ ] **Step 1: Создать файл**

Это reused компонент для product page (variant `compact` уже сделан в StoreCard). На самом деле нам нужен **тот же** `StoreCard variant="compact"` из Task 6. Создаём отдельный SellerCard как тонкая обёртка чтобы:
- На product page контекст ясен ("Это продавец")
- Скрыть `→` если уже на этом store (избежим cycle UX)

```tsx
// apps/web-buyer/src/components/store/SellerCard.tsx
'use client';

import { StoreCard } from './StoreCard';

interface Props {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export function SellerCard(props: Props) {
  return <StoreCard {...props} variant="compact" />;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/components/store/SellerCard.tsx
git commit -m "feat(web-buyer): C — SellerCard thin wrapper над StoreCard variant=compact"
```

### Task 16: Wire useStoreWithTrust в product page

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`

- [ ] **Step 1: Добавить import**

В верх файла (после `useProduct` импорта):

```tsx
import { useProduct, useStoreWithTrust } from "@/hooks/use-storefront";
```

(Заменить существующий `import { useProduct } from "@/hooks/use-storefront";`)

- [ ] **Step 2: Добавить hook call в ProductPage function**

Сразу после `const { data: product, isLoading, isError } = useProduct(id);`:

```tsx
const storeFull = useStoreWithTrust(slug);
```

`slug` уже доступен из `useParams()` выше.

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/app/\(shop\)/\[slug\]/products/\[id\]/page.tsx
git commit -m "feat(web-buyer): C — wire useStoreWithTrust в product page"
```

### Task 17: Re-order — SellerCard между title и variants

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`

- [ ] **Step 1: Удалить старую seller-card в конце правой колонки**

Найти block, который начинается с `{/* ── Seller card ─────────────────────────────────────────── */}` (около line 657). Удалить **весь** этот block (включая `<div className="p-4 rounded-md flex items-center gap-3" ... </div>` и его обёртку с условием `!isLoading && product`).

- [ ] **Step 2: Добавить SellerCard между title-block и variant pickers**

Найти конец title-block (где закрывается `<div>` после stock display — около line 457). Сразу после этого `</div>` добавить:

```tsx
              {/* ── Seller card (NEW position, выше variants) ─────────────── */}
              {!isLoading && product && (
                <SellerCard
                  slug={product.store.slug}
                  name={product.store.name}
                  city={product.store.city ?? null}
                  logoUrl={storeFull.data?.logoUrl ?? null}
                  isVerified={storeFull.data?.isVerified ?? false}
                  avgRating={storeFull.data?.avgRating ?? null}
                  reviewCount={storeFull.data?.reviewCount ?? 0}
                />
              )}
```

- [ ] **Step 3: Добавить import SellerCard в верх файла**

```tsx
import { SellerCard } from "@/components/store/SellerCard";
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-buyer/src/app/\(shop\)/\[slug\]/products/\[id\]/page.tsx
git commit -m "feat(web-buyer): C — seller card перемещён выше variant pickers + trust signals"
```

### Task 18: Promote «Обсудить» в primary CTA row — desktop

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`

- [ ] **Step 1: Удалить текущую secondary CTA**

Найти block `{/* ── Secondary CTA: Спросить у продавца ─────────────────── */}` (около line 608) — это весь `<button>` который мы сейчас удаляем (он переедет в CTA row).

- [ ] **Step 2: Обновить desktop CTA row**

Найти block `{/* ── Desktop CTAs (qty + В корзину) ─────────────────────── */}`. Заменить внутренний `<div className="flex gap-2.5 items-center">` следующим:

```tsx
              <div className="hidden md:flex flex-col gap-3">
                <div className="flex gap-2 items-center">
                  <QtyStepper
                    qty={qty}
                    onDec={() => setQty(q => Math.max(1, q - 1))}
                    onInc={() => setQty(q => q + 1)}
                  />
                  <button
                    onClick={handleAddToCart}
                    disabled={isCtaDisabled}
                    className="flex-1 text-sm font-bold transition-all active:scale-[0.98]"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 6,
                      background: isCtaDisabled ? colors.surfaceMuted : colors.brand,
                      color: isCtaDisabled ? colors.textDim : colors.brandTextOnBg,
                      border: isCtaDisabled ? `1px solid ${colors.border}` : 'none',
                      cursor: isCtaDisabled ? 'not-allowed' : 'pointer',
                      opacity: isCtaDisabled && !isLoading ? 0.5 : 1,
                    }}
                  >
                    {ctaLabel()}
                  </button>
                  <button
                    onClick={() => {
                      if (!product) return;
                      track.chatStarted(product.storeId, "product");
                      setChatOpen(true);
                    }}
                    aria-label="Обсудить с продавцом"
                    className="text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.98]"
                    style={{
                      padding: '12px 16px',
                      borderRadius: 6,
                      background: colors.accent,
                      color: colors.accentTextOnBg,
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={16} />
                    Обсудить
                  </button>
                </div>
              </div>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-buyer/src/app/\(shop\)/\[slug\]/products/\[id\]/page.tsx
git commit -m "feat(web-buyer): C — desktop CTA row: Qty / В корзину / Обсудить (filled accent)"
```

### Task 19: Promote «Обсудить» в mobile sticky CTA

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`

- [ ] **Step 1: Обновить mobile sticky block**

Найти block `{/* ── Mobile sticky bottom CTA ──────────────────────────────────────── */}` (около line 768). Заменить внутреннее содержимое:

```tsx
          {!notFound && !isLoading && (
            <div
              className="md:hidden sticky bottom-0 z-30 flex gap-2 p-3 border-t"
              style={{ background: colors.surfaceMuted, borderColor: colors.divider }}
            >
              <QtyStepper
                qty={qty}
                onDec={() => setQty(q => Math.max(1, q - 1))}
                onInc={() => setQty(q => q + 1)}
              />
              <button
                onClick={handleAddToCart}
                disabled={isCtaDisabled}
                className="flex-1 text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  padding: '12px 14px',
                  borderRadius: 6,
                  background: isCtaDisabled ? colors.surfaceMuted : colors.brand,
                  color: isCtaDisabled ? colors.textDim : colors.brandTextOnBg,
                  border: isCtaDisabled ? `1px solid ${colors.border}` : 'none',
                  cursor: isCtaDisabled ? 'not-allowed' : 'pointer',
                  opacity: isCtaDisabled ? 0.5 : 1,
                }}
              >
                {ctaLabel()}
              </button>
              <button
                onClick={() => {
                  if (!product) return;
                  track.chatStarted(product.storeId, "product");
                  setChatOpen(true);
                }}
                aria-label="Обсудить с продавцом"
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center transition-opacity hover:opacity-90 active:scale-[0.92]"
                style={{
                  background: colors.accent,
                  color: colors.accentTextOnBg,
                  borderRadius: 6,
                }}
              >
                <MessageSquare size={20} />
              </button>
            </div>
          )}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-buyer/src/app/\(shop\)/\[slug\]/products/\[id\]/page.tsx
git commit -m "feat(web-buyer): C — mobile sticky: Qty / В корзину / Обсудить (icon-only)"
```

### Task 20: PR-2 deploy и smoke

- [ ] **Step 1: Push**

```bash
git push origin web-buyer
```

Подождать ~3-4 минуты на автодеплой.

- [ ] **Step 2: Smoke в проде**

Открыть product page любого магазина с verified + reviews (например `<bot>/<slug>/products/<id>`):

  - [ ] Seller card расположен между title и variant pickers
  - [ ] Avatar (или логотип) + имя магазина + verified ✓ (если `isVerified=true`)
  - [ ] Rating ★ 4.X · N отзывов (если `reviewCount > 0`)
  - [ ] Город справа от rating
  - [ ] Клик на card ведёт на `/<storeSlug>`
  - [ ] Desktop CTA row: `[Qty][В корзину flex-1][Обсудить compact]` все одной высоты
  - [ ] Клик «Обсудить» открывает ChatComposerModal (тот же что раньше "Спросить у продавца")
  - [ ] На iPhone SE width (375px) — mobile sticky bottom: Qty + В корзину + 💬 — без переноса
  - [ ] Если у магазина `isVerified=false` — badge не показывается
  - [ ] Если `reviewCount=0` — rating-строка не показывается
  - [ ] DevTools Console: 0 errors
  - [ ] Network: `/storefront/stores/<slug>` 200

Если что-то не работает — diagnose + fix.

---

## Part 5 — Docs

### Task 21: Update analiz/tasks.md — добавить backend task для Полата

**Files:**
- Modify: `analiz/tasks.md`

- [ ] **Step 1: Найти секцию `🟠 P1 — Critical для launch (Полат)`** и добавить в конец одну новую задачу:

```markdown
- [ ] **`API-PRODUCT-STORE-TRUST-SIGNALS-001`** 🟡 — расширить `Product.store` в `GET /storefront/products/:id` и `GET /stores/:slug/products/:id` тремя полями: `isVerified: boolean`, `avgRating: number | null`, `reviewCount: number`. Также обновить `StoreRef` в `packages/types/src/api/stores.ts`. Зачем: web-buyer product page показывает verified + rating рядом с seller name, сейчас делает второй request на `/storefront/stores/:slug`. После backend extension — Азим удалит `useStoreWithTrust` hook и `apps/web-buyer/src/types/storefront.ts` local расширения.
```

- [ ] **Step 2: Commit**

```bash
git add analiz/tasks.md
git commit -m "docs(tasks): API-PRODUCT-STORE-TRUST-SIGNALS-001 для Полата (унификация Product.store + StoreRef)"
```

### Task 22: Update analiz/done.md — записать D и C

**Files:**
- Modify: `analiz/done.md`

- [ ] **Step 1: Найти секцию с самыми свежими записями и добавить:**

```markdown
### ✅ MARKETING-HOMEPAGE-DISCOVERY-001 (frontend)
- **Важность:** 🔴
- **Дата:** 13.05.2026
- **Файлы:**
  - `apps/web-buyer/src/app/(shop)/page.tsx` (rewrite → server component)
  - `apps/web-buyer/src/components/home/HomeHero.tsx`
  - `apps/web-buyer/src/components/home/HomeCategoryChips.tsx`
  - `apps/web-buyer/src/components/home/HomeTopStores.tsx`
  - `apps/web-buyer/src/components/home/HomeFeaturedFeed.tsx`
  - `apps/web-buyer/src/components/home/HomeQuickLinks.tsx`
  - `apps/web-buyer/src/components/store/StoreCard.tsx`
  - `apps/web-buyer/src/lib/storefront-adapters.ts`
  - `apps/web-buyer/src/types/storefront.ts`
  - `apps/web-buyer/src/lib/api/storefront.api.ts` (+3 functions)
  - `apps/web-buyer/src/hooks/use-storefront.ts` (+4 hooks)
- **Что сделано:** Slug-форма заменена на discovery page. Hero "Магазины Telegram. Без посредников." + 6 категорий chip row (с URL `?cat=` filter) + 8 top stores + 12 featured products + recent stores + quick links. Использует `/storefront/featured` + `/storefront/categories/tree` (готовые backend от Полата 12.05). SEO: `metadata` exported на server component.

### ✅ MARKETING-VERIFIED-SELLER-001 (web-buyer frontend)
- **Важность:** 🟠
- **Дата:** 13.05.2026
- **Файлы:**
  - `apps/web-buyer/src/components/store/VerifiedBadge.tsx`
  - `apps/web-buyer/src/components/store/StoreRating.tsx`
  - `apps/web-buyer/src/components/store/SellerCard.tsx`
  - `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` (re-order + CTA promotion)
- **Что сделано:** На product page seller card перемещён выше variant pickers (между title и variants). Добавлен VerifiedBadge (зелёный ✓ с tooltip) и StoreRating (★ X.X · N отзывов с плюрализом) — оба показываются только когда данные есть. «Обсудить» поднят в primary CTA row рядом с «В корзину» (filled accent), на mobile — sticky icon-only кнопка. Trust signals читаются через `useStoreWithTrust` (`/storefront/stores/:slug`) — workaround пока Полат не extend `Product.store` (см. API-PRODUCT-STORE-TRUST-SIGNALS-001).
```

- [ ] **Step 2: Commit**

```bash
git add analiz/done.md
git commit -m "docs(done): D+C — homepage discovery + product detail refactor (13.05.2026)"
```

### Task 23: Final push

- [ ] **Step 1: Push docs changes**

```bash
git push origin web-buyer
```

- [ ] **Step 2: Сообщить Азиму** что все три части (PR-1 D, PR-2 C, docs) задеплоены в `web-buyer` ветке. Спросить — хочет ли он сразу merge в `main`, или подождать.

---

## Self-Review

**1. Spec coverage** — каждый раздел spec'а реализован хотя бы одной задачей:

- §2 IN list (D): hero ✓ (Task 8), categories chips ✓ (Task 9), top stores ✓ (Task 10), featured products ✓ (Task 11), recent stores ✓ (Task 13), quick links ✓ (Task 12), SEO metadata ✓ (Task 13).
- §2 IN list (C): seller card up ✓ (Task 17), VerifiedBadge ✓ (Tasks 4 + 17), rating ✓ (Tasks 5 + 17), «Обсудить» primary ✓ (Tasks 18 + 19).
- §3.1 categories source `/storefront/categories/tree` с iconEmoji — Task 9 reads `c.iconEmoji`.
- §3.1 URL `?cat=` syncing — Task 9.
- §3.2 trust signals conditional — Tasks 4, 5, 17 (StoreRating с `hideWhenEmpty`, VerifiedBadge only when isVerified).
- §3.2 CTA equal weight — Tasks 18, 19.
- §4.1 server/client split — Task 13 (server) + 8-12 (client).
- §4.4 adapter — Task 7.
- §6 Полат task — Task 21.
- §7 SEO metadata — Task 13.
- §9 Rollout sequence (web-buyer ветка, deploy via push) — Task 0 + Task 14 + Task 20.

**2. Placeholder scan** — в Task 11 есть условный fallback "если store.slug нет в platform feed". Это **сознательная** ambiguity — `findAllPublic` use-case backend не проверен в момент написания плана; решение зависит от runtime обнаружения. Альтернатива — заранее проверить use-case и зафиксировать (но это удлиняет setup). Помечено как "проверь в момент implementation" с конкретным fallback. **OK для плана.**

**3. Type consistency** — `useStoreWithTrust` в Task 3 → используется в Task 16 (тот же `slug` параметр) → propагируется в Task 17 (`storeFull.data?.isVerified` etc). `featuredProductToListItem` в Task 7 → используется в Task 11 (один call site). `StoreCard variant="compact"` в Task 6 → reused через `SellerCard` Task 15. ✓

**4. Spec gaps?** — нет, всё покрыто.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-13-web-buyer-discovery-and-product-detail.md`.

Два варианта execution:

**1. Subagent-Driven (recommended)** — диспатчу fresh subagent per task, review между задачами, fast iteration. Хорошо для длинных планов (23 task'а) — каждый таск изолирован.

**2. Inline Execution** — выполняю tasks в текущей сессии через executing-plans, batch с checkpoints для review.

Какой подход? (Если не уточнишь — иду subagent-driven).
