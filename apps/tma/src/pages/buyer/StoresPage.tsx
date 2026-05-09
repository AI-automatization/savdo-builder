import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, prefetch } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { ThreadRowSkeleton, ProductCardSkeleton } from '@/components/ui/Skeleton';
import { Sticker } from '@/components/ui/Sticker';
import { ProductCard, type FeedProduct } from '@/components/ui/ProductCard';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  city: string | null;
  telegramContactLink: string | null;
}

interface GlobalCategory {
  id: string;
  nameRu: string;
}

export default function StoresPage() {
  const navigate = useNavigate();
  const { user, tg, viewportWidth } = useTelegram();

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

  useEffect(() => {
    if (tab !== 'products' || catsLoaded.current) return;
    catsLoaded.current = true;
    api<GlobalCategory[]>('/storefront/categories').then(setGlobalCategories).catch(() => {/* best-effort: category filters are supplementary */});
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
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 14px rgba(168,85,247,.40)' }}
          >
            <Sticker emoji="🛒" size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gradient">Savdo</h1>
            {user && (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Привет, {user.first_name} 👋
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/buyer/wishlist')}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', fontSize: 15 }}
            aria-label="Избранное"
          >
            ❤️
          </button>
          <button
            onClick={() => navigate('/buyer/settings')}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)', fontSize: 16 }}
          >
            ⚙️
          </button>
        </div>

        {/* Tab switcher */}
        <div
          className="flex rounded-xl p-0.5 gap-1"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {(['stores', 'products'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 rounded-[10px] text-xs font-semibold transition-all"
              style={{
                background: tab === t ? 'rgba(168,85,247,0.25)' : 'transparent',
                color: tab === t ? '#A855F7' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${tab === t ? 'rgba(168,85,247,0.35)' : 'transparent'}`,
              }}
            >
              {t === 'stores' ? '🏪 Магазины' : '📦 Товары'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={tab === 'stores' ? storesQuery : productsQuery}
            onChange={(e) => tab === 'stores' ? setStoresQuery(e.target.value) : setProductsQuery(e.target.value)}
            placeholder={tab === 'stores' ? 'Поиск магазинов...' : 'Поиск товаров...'}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.90)',
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
                  background: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.55)',
                  border: '1px solid rgba(255,255,255,0.10)',
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
                    background: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(255,255,255,0.10)',
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
                { value: 'new', label: 'Новые' },
                { value: 'price_asc', label: '↑ Цена' },
                { value: 'price_desc', label: '↓ Цена' },
              ] as const).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSort(s.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${sort === s.value ? 'chip-active-cyan' : ''}`}
                  style={sort !== s.value ? {
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.45)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12 }}>—</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="до"
                className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.85)' }}
              />
              <span style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>сум</span>
            </div>
          </div>
        )}

        {/* ── Stores content ─────────────────────────────────────────────────── */}
        {tab === 'stores' && (
          <>
            <div className="section-label">Магазины</div>

            {storesLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4].map((i) => <ThreadRowSkeleton key={i} />)}
              </div>
            )}

            {!storesLoading && storesError && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Sticker emoji="⚠️" size={56} />
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить магазины</p>
                <button onClick={loadStores} className="text-xs" style={{ color: '#A855F7' }}>Попробовать снова</button>
              </div>
            )}

            {!storesLoading && !storesError && !filteredStores.length && (
              <div className="flex flex-col items-center gap-2 py-10">
                <Sticker emoji="🏪" size={56} />
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                  {storesQuery.trim() ? 'Ничего не найдено' : 'Магазинов пока нет'}
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
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.30) 0%, rgba(168,85,247,0.20) 100%)',
                    border: '1px solid rgba(168,85,247,0.28)',
                    color: '#A855F7',
                    fontSize: 17,
                  }}
                >
                  {store.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
                  {store.description && (
                    <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{store.description}</p>
                  )}
                  {store.city && (
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(168,85,247,0.65)' }}>
                      📍 {store.city}
                    </p>
                  )}
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
                  {debouncedQuery || activeCat ? 'Ничего не найдено' : 'Товаров пока нет'}
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
