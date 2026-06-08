import { getFeaturedStores } from '@/lib/api';
import type { FeaturedStore } from '@/types/store';
import { Store } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type FeaturedStoresDict = {
  title: string;
  subtitle?: string;
  empty: string;
  productsLabel: (count: number) => string;
  openLabel: string;
};

type FeaturedStoresProps = {
  locale: Locale;
  dict: FeaturedStoresDict;
};

/**
 * Server Component — fetches at build/ISR time via `revalidate: 3600`.
 * Shows up to 6 stores. If list is empty, the whole section renders nothing
 * to avoid an awkward "empty state" for first-time visitors.
 */
export default async function FeaturedStores({ dict }: FeaturedStoresProps) {
  const stores = await getFeaturedStores();
  if (stores.length === 0) return null;

  const top = stores.slice(0, 6);

  return (
    <section
      id="stores"
      className="border-t border-brand-border bg-brand-bg py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((store) => (
            <StoreCard key={store.id} store={store} dict={dict} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function StoreCard({
  store,
  dict,
}: {
  store: FeaturedStore;
  dict: FeaturedStoresDict;
}) {
  const href = `https://maxsavdo.uz/${store.slug}`;

  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full items-center gap-4 rounded-2xl border border-brand-border bg-brand-surface p-5 transition-colors hover:border-brand-accent/60"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-brand-border bg-brand-bg">
          {store.logoUrl ? (
            // Using <img> intentionally: external CDN, no Next/Image optimizer wiring here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={store.logoUrl}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <Store size={22} className="text-brand-muted" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-brand-text">
            {store.name}
          </div>
          <div className="mt-1 text-xs text-brand-muted">
            {dict.productsLabel(store.productsCount)}
          </div>
        </div>

        <span className="hidden text-xs font-medium text-brand-accent group-hover:inline">
          {dict.openLabel} →
        </span>
      </a>
    </li>
  );
}
