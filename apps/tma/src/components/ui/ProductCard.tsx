import { useNavigate } from 'react-router-dom';
import { prefetch } from '@/lib/api';
import { getCart, saveCart } from '@/lib/cart';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { ProductImage } from '@/components/ui/ProductImage';

export interface FeedProduct {
  id: string;
  title: string;
  basePrice: number;
  currencyCode: string;
  images: { url: string }[];
  store: { id: string; name: string; slug: string };
  totalStock?: number;
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

  const openProduct = () => navigate(`/buyer/store/${product.store.slug}/product/${product.id}`);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Открыть товар ${product.title}`}
      onClick={openProduct}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(); } }}
      onPointerEnter={() => prefetch(`/stores/${product.store.slug}/products/${product.id}`)}
      onTouchStart={() => prefetch(`/stores/${product.store.slug}/products/${product.id}`)}
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
      <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
        <ProductImage src={imageUrl} alt={product.title} emptyVariant="product-empty" />
        <div style={{ position: 'absolute', top: 6, right: 6 }}>
          <WishlistButton productId={product.id} variant="card" />
        </div>
        {typeof product.totalStock === 'number' && product.totalStock <= 0 && (
          <div style={{
            position: 'absolute', left: 6, top: 6,
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            background: 'rgba(239,68,68,0.92)', color: '#fff',
            letterSpacing: 0.3,
          }}>
            НЕТ В НАЛИЧИИ
          </div>
        )}
        {typeof product.totalStock === 'number' && product.totalStock > 0 && product.totalStock <= 5 && (
          <div style={{
            position: 'absolute', left: 6, top: 6,
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
            background: 'rgba(251,191,36,0.92)', color: '#1a1208',
            letterSpacing: 0.3,
          }}>
            ОСТАЛОСЬ {product.totalStock}
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
            fontSize: 12,
            color: 'rgba(255,255,255,0.50)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 'calc(100% - 52px)',
          }}>
            <span aria-hidden="true">🏪</span> {product.store.name}
          </p>
          <button
            onClick={addToCart}
            aria-label="Добавить в корзину"
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(168,85,247,0.25)',
              border: '1px solid rgba(168,85,247,0.40)',
              color: '#A855F7',
              fontSize: 22,
              fontWeight: 600,
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
