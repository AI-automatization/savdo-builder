import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, prefetch } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThreadRowSkeleton, ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Sticker } from '@/components/ui/Sticker';
import { ProductCard, type FeedProduct } from '@/components/ui/ProductCard';
import { useTranslation } from '@/lib/i18n';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  city: string | null;
  telegramContactLink: string | null;
  // MARKETING-VERIFIED-SELLER-001
  isVerified?: boolean;
  avgRating?: number | string | null;
  reviewCount?: number;
}

interface GlobalCategory {
  id: string;
  nameRu: string;
}

export default function StoresPage() {
  const navigate = useNavigate();
  const { user, tg, viewportWidth } = useTelegram();
  const { t } = useTranslation();

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'stores' | 'products'>('stores');

  // ── Stores tab ─────────────────────────────────────────────────────────────
  const [stores, setStores] = useState<Store[]>([]);
  const [searchedStores, setSearchedStores] = useState<Store[] | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState(false);
  const [storesQuery, setStoresQuery] = useState('');
  const [debouncedStoresQuery, setDebouncedStoresQuery] = useState('');

  const storesAbortRef = useRef<AbortController | null>(null);
  const loadStores = () => {
    storesAbortRef.current?.abort();
    const ac = new AbortController();
    storesAbortRef.current = ac;
    setStoresLoading(true);
    setStoresError(false);
    api<{ data: Store[] }>('/storefront/stores', { signal: ac.signal })
      .then((res) => setStores(res.data ?? []))
      .catch((err) => {
        if (ac.signal.aborted) return;
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) {
          setStores([]);
        } else {
          setStoresError(true);
        }
      })
      .finally(() => { if (!ac.signal.aborted) setStoresLoading(false); });
  };
  useEffect(() => {
    loadStores();
    return () => storesAbortRef.current?.abort();
  }, []);

  // FEAT-001: debounce поискового запроса 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedStoresQuery(storesQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [storesQuery]);

  // FEAT-001-FE: при q >= 2 символов делаем server-side поиск через
  // /storefront/search — он ILIKE по name+description+slug по всей БД,
  // а не только по 50 загруженным магазинам.
  const searchAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (tab !== 'stores') return;
    if (debouncedStoresQuery.length < 2) {
      setSearchedStores(null);
      return;
    }
    searchAbortRef.current?.abort();
    const ac = new AbortController();
    searchAbortRef.current = ac;
    const params = new URLSearchParams({ q: debouncedStoresQuery, limit: '20' });
    api<{ stores: Store[] }>(`/storefront/search?${params}`, { signal: ac.signal })
      .then((res) => { if (!ac.signal.aborted) setSearchedStores(res.stores ?? []); })
      .catch(() => { /* abort/error: оставляем прежний результат */ });
    return () => ac.abort();
  }, [tab, debouncedStoresQuery]);

  const filteredStores = searchedStores !== null ? searchedStores : stores;

  // ── Products tab ───────────────────────────────────────────────────────────
  const [products, setProducts] = useState<FeedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsQuery, setProductsQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<'new' | 'price_asc' | 'price_desc'>('new');
  const [activeCat, setActiveCat] = useState<string | null>(null);
  // FEAT-003-FE: ценовой диапазон. Храним как строку (input-friendly), парсим в submit.
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [debouncedPrice, setDebouncedPrice] = useState({ min: '', max: '' });
  useEffect(() => {
    const t = setTimeout(() => setDebouncedPrice({ min: priceMin.trim(), max: priceMax.trim() }), 400);
    return () => clearTimeout(t);
  }, [priceMin, priceMax]);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const catsLoaded = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(productsQuery), 300);
    return () => clearTimeout(t);
  }, [productsQuery]);

  // TMA-STORES-CATS-RACE-001 (12.05.2026): был race — `catsLoaded.current = true`
  // ставился до fetch, и при network error флаг оставался true → категории
  // никогда не перезагружались. + не было AbortController, setGlobalCategories
  // мог сработать после unmount. Fix: AbortController + сброс флага на error
  // (но не при abort — это намеренная отмена).
  useEffect(() => {
    if (tab !== 'products' || catsLoaded.current) return;
    catsLoaded.current = true;
    const ac = new AbortController();
    api<GlobalCategory[]>('/storefront/categories', { signal: ac.signal })
      .then((data) => {
        if (ac.signal.aborted) return;
        setGlobalCategories(data);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
        // best-effort: category filters are supplementary. Сбрасываем флаг,
        // чтобы следующий tab-switch попробовал ещё раз.
        catsLoaded.current = false;
      });
    return () => ac.abort();
  }, [tab]);

  const productsAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (tab !== 'products') return;
    productsAbortRef.current?.abort();
    const ac = new AbortController();
    productsAbortRef.current = ac;
    setProductsLoading(true);
    const params = new URLSearchParams({ sort });
    if (debouncedQuery.trim()) params.set('q', debouncedQuery.trim());
    if (activeCat) params.set('globalCategoryId', activeCat);
    if (debouncedPrice.min && Number(debouncedPrice.min) > 0) params.set('priceMin', debouncedPrice.min);
    if (debouncedPrice.max && Number(debouncedPrice.max) > 0) params.set('priceMax', debouncedPrice.max);
    api<{ data: FeedProduct[]; meta: { total: number; page: number } }>(`/storefront/products?${params}`, { signal: ac.signal })
      .then((res) => { if (!ac.signal.aborted) setProducts(res.data ?? []); })
      .catch(() => { /* abort/error: оставляем прежний список */ })
      .finally(() => { if (!ac.signal.aborted) setProductsLoading(false); });
    return () => ac.abort();
  }, [tab, debouncedQuery, activeCat, sort, debouncedPrice]);

  const openTgContact = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    const url = link.startsWith('http') ? link : `https://t.me/${link.replace(/^@/, '')}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    
      <div className="flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--tg-accent)', boxShadow: '0 4px 14px var(--tg-accent-glow)' }}
          >
            <Sticker emoji="🛒" size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gradient">Savdo</h1>
            {user && (
              <p className="text-xs font-medium" style={{ color: 'var(--tg-text-secondary)' }}>
                {t('auth.welcomeName', { name: user.first_name })} 👋
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/buyer/wishlist')}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border)', fontSize: 15 }}
            aria-label={t('nav.wishlist')}
          >
            ❤️
          </button>
          <button
            onClick={() => navigate('/buyer/settings')}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border)', color: 'var(--tg-text-secondary)', fontSize: 16 }}
          >
            ⚙️
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-0.5 gap-1"
          style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border-soft)' }}
        >
          {(['stores', 'products'] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
              style={{
                background: tab === tabKey ? 'var(--tg-accent-dim)' : 'transparent',
                color: tab === tabKey ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
                border: `1px solid ${tab === tabKey ? 'var(--tg-accent-border)' : 'transparent'}`,
              }}
            >
              {tabKey === 'stores' ? `🏪 ${t('nav.stores')}` : `📦 ${t('nav.products')}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--tg-text-dim)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={tab === 'stores' ? storesQuery : productsQuery}
            onChange={(e) => tab === 'stores' ? setStoresQuery(e.target.value) : setProductsQuery(e.target.value)}
            placeholder={tab === 'stores' ? t('stores.searchPlaceholder') : t('products.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--tg-surface-hover)',
              border: '1px solid var(--tg-border)',
              color: 'var(--tg-text-primary)',
            }}
          />
        </div>

        {/* Products tab — categories */}
        {tab === 'products' && globalCategories.length > 0 && (
          <div className="scroll-fade-x -mx-4">
            <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-1 px-4" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveCat(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${activeCat === null ? 'chip-active' : ''}`}
                style={activeCat !== null ? {
                  background: 'var(--tg-surface-hover)',
                  color: 'var(--tg-text-secondary)',
                  border: '1px solid var(--tg-border)',
                  whiteSpace: 'nowrap',
                } : { whiteSpace: 'nowrap' }}
              >
                Все
              </button>
              {globalCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(activeCat === cat.id ? null : cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${activeCat === cat.id ? 'chip-active' : ''}`}
                  style={activeCat !== cat.id ? {
                    background: 'var(--tg-surface-hover)',
                    color: 'var(--tg-text-secondary)',
                    border: '1px solid var(--tg-border)',
                    whiteSpace: 'nowrap',
                  } : { whiteSpace: 'nowrap' }}
                >
                  {cat.nameRu}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products tab — sort + price range (FEAT-003-FE) */}
        {tab === 'products' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-wrap">
              {([
                { value: 'new', label: t('products.sortNew') },
                { value: 'price_asc', label: t('products.sortPriceAsc') },
                { value: 'price_desc', label: t('products.sortPriceDesc') },
              ] as const).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${sort === s.value ? 'chip-active-cyan' : ''}`}
                  style={sort !== s.value ? {
                    background: 'var(--tg-surface-hover)',
                    color: 'var(--tg-text-muted)',
                    border: '1px solid var(--tg-border-soft)',
                  } : undefined}
                >
                  {s.label}
                </button>
              ))}
              {(priceMin || priceMax) && (
                <button
                  onClick={() => { setPriceMin(''); setPriceMax(''); }}
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  ✕ Сброс цены
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Цена от"
                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border)', color: 'var(--tg-text-primary)' }}
              />
              <span style={{ color: 'var(--tg-text-dim)', fontSize: 12 }}>—</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="до"
                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--tg-surface-hover)', border: '1px solid var(--tg-border)', color: 'var(--tg-text-primary)' }}
              />
              <span style={{ color: 'var(--tg-text-muted)', fontSize: 11 }}>сум</span>
            </div>
          </div>
        )}

        {/* ── Stores content ─────────────────────────────────────────────────── */}
        {tab === 'stores' && (
          <>
            <div className="section-label">{t('stores.title')}</div>

            {storesLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => <ThreadRowSkeleton key={i} />)}
              </div>
            )}

            {!storesLoading && storesError && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Sticker emoji="⚠️" size={56} />
                <p style={{ color: 'var(--tg-text-secondary)', fontSize: 13 }}>{t('error.network')}</p>
                <button onClick={loadStores} className="text-xs" style={{ color: 'var(--tg-accent)' }}>{t('common.retry')}</button>
              </div>
            )}

            {!storesLoading && !storesError && !filteredStores.length && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Sticker emoji="🏪" size={56} />
                <p style={{ color: 'var(--tg-text-muted)', fontSize: 13 }}>
                  {storesQuery.trim() ? t('stores.notFound') : t('stores.empty')}
                </p>
              </div>
            )}

            <div className={`grid gap-3 ${
              viewportWidth >= 1280 ? 'grid-cols-3' :
              viewportWidth >= 768  ? 'grid-cols-2' : 'grid-cols-1'
            }`}>
            {filteredStores.map((store) => (
              <GlassCard
                key={store.id}
                className="flex items-center gap-3 px-4 py-3.5"
                onClick={() => navigate(`/buyer/store/${store.slug}`)}
                onPointerEnter={() => {
                  prefetch(`/storefront/stores/${store.slug}`);
                  prefetch(`/stores/${store.slug}/products`);
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold uppercase"
                  style={{
                    background: 'var(--tg-accent-dim)',
                    border: '1px solid var(--tg-accent-border)',
                    color: 'var(--tg-accent)',
                    fontSize: 17,
                  }}
                >
                  {store.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--tg-text-primary)' }}>{store.name}</p>
                    {/* MARKETING-VERIFIED-SELLER-001: verified badge */}
                    {store.isVerified && (
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                        style={{ background: 'rgba(37,99,235,0.20)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.45)' }}
                        title={t('stores.verifiedTitle')}
                        aria-label={t('stores.verifiedTitle')}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  {store.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--tg-text-muted)' }}>{store.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {store.city && (
                      <p className="text-xxs" style={{ color: 'var(--tg-accent)' }}>
                        📍 {store.city}
                      </p>
                    )}
                    {/* MARKETING-VERIFIED-SELLER-001: rating + review count */}
                    {store.reviewCount && store.reviewCount > 0 && store.avgRating != null && (
                      <p className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
                        ⭐ {Number(store.avgRating).toFixed(1)} <span style={{ color: 'var(--tg-text-dim)' }}>({store.reviewCount})</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {store.telegramContactLink && (
                    <button
                      onClick={(e) => openTgContact(e, store.telegramContactLink!)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                      style={{ background: 'rgba(37,99,235,0.20)', border: '1px solid rgba(37,99,235,0.35)' }}
                      title="Написать продавцу"
                    >
                      ✈️
                    </button>
                  )}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: 'var(--tg-text-dim)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </GlassCard>
            ))}
            </div>
          </>
        )}

        {/* ── Products content ───────────────────────────────────────────────── */}
        {tab === 'products' && (
          <>
            {productsLoading && (
              <div className={`grid gap-3 ${
                viewportWidth >= 1280 ? 'grid-cols-6' :
                viewportWidth >= 1024 ? 'grid-cols-5' :
                viewportWidth >= 768  ? 'grid-cols-4' :
                viewportWidth >= 560  ? 'grid-cols-3' : 'grid-cols-2'
              }`}>
                {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            )}

            {!productsLoading && products.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Sticker emoji="📦" size={56} />
                <p style={{ color: 'var(--tg-text-muted)', fontSize: 13 }}>
                  {debouncedQuery || activeCat ? t('stores.notFound') : t('products.empty')}
                </p>
              </div>
            )}

            {!productsLoading && products.length > 0 && (
              <div className={`grid gap-3 ${
                viewportWidth >= 1536 ? 'grid-cols-7' :
                viewportWidth >= 1280 ? 'grid-cols-6' :
                viewportWidth >= 1024 ? 'grid-cols-5' :
                viewportWidth >= 768  ? 'grid-cols-4' :
                viewportWidth >= 560  ? 'grid-cols-3' : 'grid-cols-2'
              }`}>
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}

      </div>
    
  );
}
