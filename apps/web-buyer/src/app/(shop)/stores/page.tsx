'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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

function StoresCatalogInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<StoresFiltersState>({
    city: searchParams.get('city') ?? 'all',
    verifiedOnly: searchParams.get('verified') === '1',
    sort: parseSort(searchParams.get('sort')),
  });

  const { data, isLoading, isError, refetch } = useStoresCatalog();
  const stores = data ?? [];

  useEffect(() => {
    track.storesCatalogViewed('catalog-page');
  }, []);

  // Sync filters → URL (replace без push, чтобы back не множился)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.city !== 'all') sp.set('city', filters.city);
    if (filters.verifiedOnly) sp.set('verified', '1');
    if (filters.sort !== 'top') sp.set('sort', filters.sort);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [filters, pathname, router]);

  const display = useMemo(() => {
    let out = stores.filter((s) => {
      if (filters.city !== 'all' && s.city !== filters.city) return false;
      if (filters.verifiedOnly && !s.isVerified) return false;
      return true;
    });
    if (filters.sort === 'rating') {
      out = [...out].sort(
        (a, b) =>
          (b.avgRating ?? 0) - (a.avgRating ?? 0) || b.reviewCount - a.reviewCount,
      );
    } else if (filters.sort === 'new') {
      // Backend default order: [isVerified desc, publishedAt desc].
      // Без publishedAt в payload «new» = backend order reversed.
      out = [...out].reverse();
    }
    // 'top' — backend default (verified сверху, потом publishedAt desc).
    return out;
  }, [stores, filters]);

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
          Магазины Узбекистана
        </h1>
        <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
          {isLoading ? 'Загружаем…' : `${display.length} ${pluralStores(display.length)}`}
        </p>

        <StoresFilters stores={stores} value={filters} onChange={setFilters} />

        {isError ? (
          <EmptyState
            title="Не удалось загрузить магазины"
            description="Проверьте соединение и попробуйте снова"
            ctaLabel="Повторить"
            onCta={() => refetch()}
          />
        ) : !isLoading && display.length === 0 ? (
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

function pluralStores(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'магазин';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'магазина';
  return 'магазинов';
}

export default function StoresCatalogPage() {
  return (
    <Suspense fallback={null}>
      <StoresCatalogInner />
    </Suspense>
  );
}
