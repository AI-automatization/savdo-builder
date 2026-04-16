import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { getCart, saveCart } from '@/lib/cart';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

interface Product {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  status: string;
  images?: { url: string }[];
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const trackedRef = useRef<string | null>(null);

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
    track.addToCart(store.id, product.id, null, 1);
  };

  if (loading) return <AppShell role="BUYER"><div className="flex justify-center py-10"><Spinner size={32} /></div></AppShell>;

  if (error || !store) {
    return (
      <AppShell role="BUYER">
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 40 }}>😕</span>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14 }}>Магазин не найден</p>
          <button onClick={() => navigate('/buyer')} style={{ color: '#A78BFA', fontSize: 14 }}>← Назад</button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <div className="p-4" style={{ ...glass }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.25)' }}>
              🏪
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

        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Товары ({products.length})
        </h2>

        {!products.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Товаров пока нет</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/buyer/store/${slug}/product/${p.id}`)}
              className="flex flex-col gap-2 p-3 rounded-2xl cursor-pointer transition-opacity active:opacity-70"
              style={glass}
            >
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-3xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {p.images?.[0]?.url
                  ? <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover rounded-xl" />
                  : '📦'}
              </div>
              <p className="text-xs font-semibold leading-tight" style={{ color: 'rgba(255,255,255,0.88)' }}>
                {p.title}
              </p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-xs font-bold" style={{ color: '#A78BFA' }}>
                  {Number(p.basePrice).toLocaleString('ru')} сум
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'rgba(167,139,250,0.25)', border: '1px solid rgba(167,139,250,0.35)' }}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
