import { useNavigate } from 'react-router-dom';
import { getCart, saveCart } from '@/lib/cart';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';

export interface FeedProduct {
  id: string;
  title: string;
  basePrice: number;
  currencyCode: string;
  images: { url: string }[];
  store: { id: string; name: string; slug: string };
}

export function ProductCard({ product }: { product: FeedProduct }) {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const imageUrl = product.images[0]?.url ?? null;
  const price = `${Number(product.basePrice).toLocaleString('ru')} ${product.currencyCode === 'UZS' ? 'сум' : product.currencyCode}`;

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    tg?.HapticFeedback.impactOccurred('light');

    const cart = getCart();
    const { id: storeId, slug: storeSlug, name: storeName } = product.store;
    const hasOtherStore = cart.length > 0 && cart[0].storeId !== storeId;

    if (hasOtherStore) {
      saveCart([{ productId: product.id, title: product.title, price: Number(product.basePrice), qty: 1, storeId, storeSlug, storeName }]);
      tg?.HapticFeedback.notificationOccurred('warning');
      showToast('🛒 Корзина очищена');
      return;
    }

    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      saveCart(cart.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      saveCart([...cart, { productId: product.id, title: product.title, price: Number(product.basePrice), qty: 1, storeId, storeSlug, storeName }]);
    }
    tg?.HapticFeedback.notificationOccurred('success');
    showToast('✅ Добавлено в корзину');
  };

  return (
    <div
      onClick={() => navigate(`/buyer/product/${product.id}`)}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'rgba(255,255,255,0.06)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            📦
          </div>
        )}
      </div>

      <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.88)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.title}
        </p>

        <p style={{ fontSize: 13, fontWeight: 700, color: '#A855F7' }}>{price}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <p style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.35)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100% - 34px)',
          }}>
            🏪 {product.store.name}
          </p>
          <button
            onClick={addToCart}
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: 'rgba(168,85,247,0.25)',
              border: '1px solid rgba(168,85,247,0.40)',
              color: '#A855F7',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
