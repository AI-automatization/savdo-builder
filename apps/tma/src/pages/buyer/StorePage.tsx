import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { getCart, saveCart } from '@/lib/cart';
import { useTelegram } from '@/providers/TelegramProvider';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { glass } from '@/lib/styles';

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
    viewportWidth >= 960 ? 'grid-cols-5' :
    viewportWidth >= 768 ? 'grid-cols-4' :
    viewportWidth >= 560 ? 'grid-cols-3' : 'grid-cols-2';
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const trackedRef = useRef<string | null>(null);
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    api<GlobalCategory[]>('/storefront/categories').then(setGlobalCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    Promise.allSettled([
      api<Store>(`/storefront/stores/${slug}`),
      api<Product[]>(`/stores/${slug}/products`),
    ]).then(([storeResult, productsResult]) => {
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
    }).finally(() => setLoading(false));
  }, [slug]);

  const addToCart = (product: Product) => {
    if (!store) return;
    tg?.HapticFeedback.impactOccurred('light');

    const cart = getCart();

    // INV-C01: корзина = один магазин. Если в корзине товары другого магазина — сбрасываем.
    const hasOtherStore = cart.length > 0 && cart[0].storeId !== store.id;
    if (hasOtherStore) {
      saveCart([{
        productId: product.id,
        title: product.title,
        price: Number(product.basePrice),
        qty: 1,
        storeId: store.id,
        storeSlug: slug!,
        storeName: store.name,
      }]);
      tg?.HapticFeedback.notificationOccurred('warning');
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
          <span style={{ fontSize: 40 }}>😕</span>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14 }}>Магазин не найден</p>
          <button onClick={() => navigate('/buyer')} style={{ color: '#A855F7', fontSize: 14 }}>← Назад</button>
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
                background: 'linear-gradient(135deg, rgba(124,58,237,0.30) 0%, rgba(168,85,247,0.20) 100%)',
                border: '1px solid rgba(168,85,247,0.28)',
                color: '#A855F7',
                fontSize: 20,
              }}>
              {store.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>{store.name}</h1>
              <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.80)' }}>savdo.uz/{store.slug}</p>
            </div>
          </div>
          {store.description && (
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>{store.description}</p>
          )}
        </div>

        {globalCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            <button
              onClick={() => setActiveCat(null)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: activeCat === null ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${activeCat === null ? 'rgba(167,139,250,0.50)' : 'rgba(255,255,255,0.12)'}`,
                color: activeCat === null ? '#A855F7' : 'rgba(255,255,255,0.55)',
              }}
            >
              Все
            </button>
            {globalCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(activeCat === c.id ? null : c.id)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: activeCat === c.id ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${activeCat === c.id ? 'rgba(167,139,250,0.50)' : 'rgba(255,255,255,0.12)'}`,
                  color: activeCat === c.id ? '#A855F7' : 'rgba(255,255,255,0.55)',
                }}
              >
                {c.nameRu}
              </button>
            ))}
          </div>
        )}

        <div className="section-label">
          Товары ({filtered.length}{activeCat && products.length !== filtered.length ? `/${products.length}` : ''})
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              {activeCat ? 'Нет товаров в этой категории' : 'Товаров пока нет'}
            </p>
          </div>
        )}

        <div className={`grid ${gridCols} gap-3`}>
          {filtered.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/buyer/store/${slug}/product/${p.id}`)}
              className="flex flex-col gap-2 p-3 rounded-2xl cursor-pointer transition-opacity active:opacity-70"
              style={glass}
            >
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-3xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                  : '📦'}
              </div>
              <p className="text-xs font-semibold leading-tight line-clamp-2" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {p.title}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs font-bold" style={{ color: '#A855F7' }}>
                  {Number(p.basePrice).toLocaleString('ru')} сум
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
                  style={{ background: 'rgba(167,139,250,0.25)', border: '1px solid rgba(167,139,250,0.35)', color: '#A855F7' }}
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
