'use client';

import { Suspense, useEffect, useMemo } from 'react';
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

function pluralProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара';
  return 'товаров';
}

function ProductsCatalogInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categorySlug = searchParams.get('cat');
  const sort = parseSort(searchParams.get('sort'));

  const tree = useGlobalCategoriesTree();
  const categoryId = useMemo(() => {
    if (!categorySlug) return undefined;
    return tree.data?.find((c) => c.slug === categorySlug)?.id;
  }, [categorySlug, tree.data]);

  const {
    data,
    isLoading,
    isError,
    refetch,
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
    if (nextCat) sp.set('cat', nextCat);
    if (nextSort !== 'new') sp.set('sort', nextSort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full mt-6 mb-10 pb-20 md:pb-10">
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
          {isLoading ? 'Загружаем…' : `${total} ${pluralProducts(total)}`}
        </p>

        <ProductsFilters
          categorySlug={categorySlug}
          sort={sort}
          onChangeCategory={(s) => updateUrl(s, sort)}
          onChangeSort={(s) => updateUrl(categorySlug, s)}
        />

        {isError ? (
          <EmptyState
            title="Не удалось загрузить товары"
            description="Проверьте соединение и попробуйте снова"
            ctaLabel="Повторить"
            onCta={() => refetch()}
          />
        ) : !isLoading && products.length === 0 ? (
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

export default function ProductsCatalogPage() {
  return (
    <Suspense fallback={null}>
      <ProductsCatalogInner />
    </Suspense>
  );
}
