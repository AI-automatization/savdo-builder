import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { getCart, saveCart } from '@/lib/cart';
import { useTelegram } from '@/providers/TelegramProvider';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { ProductImage } from '@/components/ui/ProductImage';
import { showToast } from '@/components/ui/Toast';
import { confirmDialog } from '@/components/ui/ConfirmModal';
import { glass } from '@/lib/styles';
import { clickableA11y } from '@/lib/a11y';
import { webStoreUrl } from '@/lib/webUrl';

interface Product {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  status: string;
  globalCategoryId?: string | null;
  images?: { url: string }[];
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  // MARKETING-VERIFIED-SELLER-001
  isVerified?: boolean;
  avgRating?: number | string | null;
  reviewCount?: number;
}

interface GlobalCategory {
  id: string;
  nameRu: string;
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { tg, viewportWidth } = useTelegram();
  const gridCols =
    viewportWidth >= 1536 ? 'grid-cols-7' :
    viewportWidth >= 1280 ? 'grid-cols-6' :
    viewportWidth >= 1024 ? 'grid-cols-5' :
    viewportWidth >= 768  ? 'grid-cols-4' :
    viewportWidth >= 560  ? 'grid-cols-3' : 'grid-cols-2';
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const trackedRef = useRef<string | null>(null);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    api<GlobalCategory[]>('/storefront/categories', { signal: ac.signal })
      .then(setGlobalCategories)
      .catch(() => {/* best-effort: category filters are supplementary, page works without them */});
    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (!slug) return;
    const ac = new AbortController();
    Promise.allSettled([
      api<Store>(`/storefront/stores/${slug}`, { signal: ac.signal }),
      api<Product[]>(`/stores/${slug}/products`, { signal: ac.signal }),
    ]).then(([storeResult, productsResult]) => {
      if (ac.signal.aborted) return;
      if (storeResult.status === 'fulfilled') {
        setStore(storeResult.value);
        if (trackedRef.current !== storeResult.value.id) {
          trackedRef.current = storeResult.value.id;
          track.storefrontViewed(storeResult.value.id, storeResult.value.slug);
        }
      } else {
        setError(true);
      }
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value ?? []);
      }
    }).finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [slug]);

  const addToCart = async (product: Product) => {
    if (!store) return;
    tg?.HapticFeedback.impactOccurred('light');

    const cart = getCart();

    // INV-C01: корзина = один магазин. Если в корзине товары другого магазина —
    // подтверждение перед очисткой (TMA-CART-DUPLICATE-WARNING-001). Раньше
    // silent reset терял товары без уведомления.
    const hasOtherStore = cart.length > 0 && cart[0].storeId !== store.id;
    if (hasOtherStore) {
      const otherStoreName = cart[0].storeName ?? 'другого магазина';
      const ok = await confirmDialog({
        title: 'Заменить корзину?',
        body: `В корзине сейчас товары из «${otherStoreName}». Чтобы добавить товар из «${store.name}», нужно очистить старую корзину.`,
        confirmText: 'Заменить',
        cancelText: 'Отмена',
        danger: true,
      });
      if (!ok) {
        tg?.HapticFeedback.notificationOccurred('error');
        return;
      }
      saveCart([{
        productId: product.id,
        title: product.title,
        price: Number(product.basePrice),
        qty: 1,
        storeId: store.id,
        storeSlug: slug!,
        storeName: store.name,
      }]);
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('🛒 Корзина обновлена');
      track.addToCart(store.id, product.id, null, 1);
      return;
    }

    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      saveCart(cart.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      saveCart([...cart, {
        productId: product.id,
        title: product.title,
        price: Number(product.basePrice),
        qty: 1,
        storeId: store.id,
        storeSlug: slug!,
        storeName: store.name,
      }]);
    }
    tg?.HapticFeedback.notificationOccurred('success');
    showToast('✅ Добавлено в корзину');
    track.addToCart(store.id, product.id, null, 1);
  };

  if (loading) return (
    
      <div className={`grid ${gridCols} gap-3 pt-2`}>
        {[1,2,3,4,5,6].map((i) => <ProductCardSkeleton key={i} />)}
      </div>
    
  );

  if (error || !store) {
    return (
      
        <div className="flex flex-col items-center gap-3 py-16">
          <span aria-hidden="true" style={{ fontSize: 40 }}>😕</span>
          <p style={{ color: 'var(--tg-text-secondary)', fontSize: 14 }}>Магазин не найден</p>
          <button onClick={() => navigate('/buyer')} style={{ color: 'var(--tg-accent)', fontSize: 14 }}>← Назад</button>
        </div>
      
    );
  }

  const filtered = activeCat ? products.filter((p) => p.globalCategoryId === activeCat) : products;

  return (
    
      <div className="flex flex-col gap-4">
        <div className="p-4" style={{ ...glass }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold uppercase"
              style={{
                background: 'var(--tg-accent-dim)',
                border: '1px solid var(--tg-accent-border)',
                color: 'var(--tg-accent)',
                fontSize: 20,
              }}>
              {store.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>{store.name}</h1>
                {/* MARKETING-VERIFIED-SELLER-001 */}
                {store.isVerified && (
                  <span
                    className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(37,99,235,0.20)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.45)' }}
                    title="Проверенный магазин"
                    aria-label="Проверенный магазин"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); tg?.openLink?.(webStoreUrl(store.slug)); }}
                  className="text-xxs inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                  style={{
                    color: 'var(--tg-accent)',
                    background: 'var(--tg-accent-bg)',
                    border: '1px solid var(--tg-accent-border)',
                    cursor: 'pointer',
                  }}
                  aria-label="Перейти на сайт магазина"
                >
                  ↗ Перейти на сайт
                </button>
                {/* MARKETING-VERIFIED-SELLER-001 */}
                {store.reviewCount && store.reviewCount > 0 && store.avgRating != null && (
                  <span className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
                    ⭐ {Number(store.avgRating).toFixed(1)} <span style={{ color: 'var(--tg-text-dim)' }}>({store.reviewCount})</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          {store.description && (
            <p className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>{store.description}</p>
          )}
        </div>

        {globalCategories.length > 0 && (
          <div className="scroll-fade-x -mx-4">
            <div className="flex gap-2 overflow-x-auto scroll-snap-x pb-1 px-4" style={{ scrollbarWidth: 'none' }}>
              <button
                onClick={() => setActiveCat(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${activeCat === null ? 'chip-active' : ''}`}
                style={activeCat !== null ? {
                  background: 'var(--tg-surface-hover)',
                  border: '1px solid var(--tg-border)',
                  color: 'var(--tg-text-secondary)',
                } : undefined}
              >
                Все
              </button>
              {globalCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${activeCat === c.id ? 'chip-active' : ''}`}
                  style={activeCat !== c.id ? {
                    background: 'var(--tg-surface-hover)',
                    border: '1px solid var(--tg-border)',
                    color: 'var(--tg-text-secondary)',
                  } : undefined}
                >
                  {c.nameRu}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="section-label">
          Товары ({filtered.length}{activeCat && products.length !== filtered.length ? `/${products.length}` : ''})
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span aria-hidden="true" style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'var(--tg-text-muted)', fontSize: 13 }}>
              {activeCat ? 'Нет товаров в этой категории' : 'Товаров пока нет'}
            </p>
          </div>
        )}

        <div className={`grid ${gridCols} gap-3`}>
          {filtered.map((p) => (
            <div
              key={p.id}
              {...clickableA11y(() => navigate(`/buyer/store/${slug}/product/${p.id}`))}
              aria-label={`Открыть товар ${p.title}`}
              className="flex flex-col gap-2 p-3 rounded-2xl cursor-pointer transition-opacity active:opacity-70"
              style={glass}
            >
              <div className="w-full aspect-square rounded-xl overflow-hidden"
                style={{ background: 'var(--tg-surface)' }}>
                <ProductImage src={p.images?.[0]?.url} alt={p.title} emptyVariant="product-empty" />
              </div>
              <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: 'var(--tg-text-primary)' }}>
                {p.title}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs font-bold" style={{ color: 'var(--tg-accent)' }}>
                  {Number(p.basePrice).toLocaleString('ru')} сум
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  aria-label="Добавить в корзину"
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{ background: 'var(--tg-accent-dim)', border: '1px solid var(--tg-accent-border)', color: 'var(--tg-accent)' }}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    
  );
}
