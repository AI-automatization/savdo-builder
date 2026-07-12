// apps/web-buyer/src/components/home/HomeTopStores.tsx
'use client';

import Link from 'next/link';
import type { FeaturedStorefrontResponse } from 'types';
import { useFeaturedStorefront } from '@/hooks/use-storefront';
import { StoreCard } from '@/components/store/StoreCard';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

export function HomeTopStores({ initialData }: { initialData?: FeaturedStorefrontResponse }) {
  const { data, isLoading, isError } = useFeaturedStorefront(initialData);
  const stores = data?.topStores ?? [];
  const { t } = useTranslation();

  if (isError || (!isLoading && stores.length === 0)) return null;

  return (
    <section id="top-stores" className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-baseline mb-4">
        <h2
          className="text-[10px] font-bold uppercase"
          style={{ color: colors.textMuted, letterSpacing: '0.18em' }}
        >
          {t('home.topStores.title')}
        </h2>
        <Link
          href="/stores"
          className="text-xs font-semibold transition-opacity hover:opacity-80"
          style={{ color: colors.brand }}
        >
          {t('home.topStores.allStores')}
        </Link>
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
