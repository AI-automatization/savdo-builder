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
