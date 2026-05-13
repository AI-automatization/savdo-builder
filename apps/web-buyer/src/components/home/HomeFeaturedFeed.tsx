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
      ) : (
        <>
          {isFilterMode ? (
            (filtered.data?.data ?? []).length === 0 ? (
              <p className="text-sm py-4" style={{ color: colors.textMuted }}>
                В этой категории пока нет товаров
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(filtered.data?.data ?? []).map((p) => {
                  // Backend allPublicProductInclude добавляет store: {id, name, slug}
                  // (products.repository.ts:61), runtime значение есть.
                  // ProductListItem из packages/types не декларирует store — type cast OK.
                  const storeSlug = (p as unknown as { store?: { slug?: string } }).store?.slug ?? '';
                  return <ProductCard key={p.id} product={p} storeSlug={storeSlug} />;
                })}
              </div>
            )
          ) : (
            (featured.data?.featuredProducts ?? []).length === 0 ? (
              <p className="text-sm py-4" style={{ color: colors.textMuted }}>
                Скоро здесь появятся товары
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(featured.data?.featuredProducts ?? []).map((f) => (
                  <ProductCard
                    key={f.id}
                    product={featuredProductToListItem(f)}
                    storeSlug={f.store.slug}
                  />
                ))}
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}
