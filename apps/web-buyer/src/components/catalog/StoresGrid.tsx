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
          city={s.city}
          logoUrl={s.logoUrl}
          isVerified={s.isVerified}
          avgRating={s.avgRating}
          reviewCount={s.reviewCount}
        />
      ))}
    </div>
  );
}
