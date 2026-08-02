import { useNavigate } from 'react-router-dom';
import { prefetch } from '@/lib/api';
import { getCart, saveCart } from '@/lib/cart';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { ProductImage } from '@/components/ui/ProductImage';
import { clickableA11y } from '@/lib/a11y';
import { useTranslation } from '@/lib/i18n';

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
  const { t } = useTranslation();
  const imageUrl = product.images?.[0]?.url ?? null;
  // TMA-PRODUCT-EMPTY-001 (08.06.2026): hardening против stripped product DTO.
  // Если бэкенд вернул товар без title/basePrice/images — карточка раньше выглядела пустой
  // (только badge + heart). Теперь fallback: '—' для названия, скелетон для цены.
  const safeTitle = product.title?.trim() || '—';
  const basePriceNum = Number(product.basePrice);
  const hasPrice = Number.isFinite(basePriceNum);
  const price = hasPrice
    ? `${basePriceNum.toLocaleString('ru')} ${product.currencyCode === 'UZS' ? 'сум' : (product.currencyCode || '')}`.trim()
    : '— сум';

  const addToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    tg?.HapticFeedback.impactOccurred('light');

    const cart = getCart();
    const { id: storeId, slug: storeSlug, name: storeName } = product.store;
    const hasOtherStore = cart.length > 0 && cart[0].storeId !== storeId;

    const stockMax = product.totalStock;

    if (hasOtherStore) {
      saveCart([{ productId: product.id, title: product.title, price: Number(product.basePrice), qty: 1, storeId, storeSlug, storeName, stockMax }]);
      tg?.HapticFeedback.notificationOccurred('warning');
      showToast('🛒 Корзина очищена');
      return;
    }

    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      if (stockMax !== undefined && existing.qty >= stockMax) {
        tg?.HapticFeedback.notificationOccurred('error');
        showToast(t('cart.stockMaxReached', { count: stockMax }), 'error');
        return;
      }
      saveCart(cart.map((i) => i.productId === product.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      saveCart([...cart, { productId: product.id, title: product.title, price: Number(product.basePrice), qty: 1, storeId, storeSlug, storeName, stockMax }]);
    }
    tg?.HapticFeedback.notificationOccurred('success');
    showToast('✅ Добавлено в корзину');
  };

  const openProduct = () => navigate(`/buyer/store/${product.store.slug}/product/${product.id}`);
  return (
    <div
      {...clickableA11y(openProduct)}
      aria-label={`Открыть товар ${safeTitle}`}
      onPointerEnter={() => prefetch(`/stores/${product.store.slug}/products/${product.id}`)}
      onTouchStart={() => prefetch(`/stores/${product.store.slug}/products/${product.id}`)}
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        background: 'var(--tg-surface)',
        border: '1px solid var(--tg-border-soft)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        // TMA-MOBILE-OVERFLOW-001 (08.06.2026): min-width:0 нужен, чтобы grid-cell
        // могла сжаться меньше intrinsic content width на узких экранах (320px).
        // Без этого длинные слова в title или price могли раздвинуть карточку и
        // увести соседнюю карточку за viewport.
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <div style={{
        aspectRatio: '1/1',
        overflow: 'hidden',
        // TMA-PRODUCT-EMPTY-001: явный neutral-фон для empty-state, чтобы карточка
        // без изображения не сливалась с фоном страницы.
        background: imageUrl ? 'var(--tg-surface-hover)' : 'var(--tg-surface-elevated, var(--tg-surface-hover))',
        position: 'relative',
      }}>
        <ProductImage src={imageUrl} alt={safeTitle} emptyVariant="product-empty" />
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

      <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--tg-text-primary)',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          wordBreak: 'break-word',
        }}>
          {safeTitle}
        </p>

        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: hasPrice ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{price}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, gap: 6, minWidth: 0 }}>
          <p style={{
            fontSize: 12,
            color: 'var(--tg-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
            flex: 1,
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
              background: 'var(--tg-accent-dim)',
              border: '1px solid var(--tg-accent-border)',
              color: 'var(--tg-accent)',
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
