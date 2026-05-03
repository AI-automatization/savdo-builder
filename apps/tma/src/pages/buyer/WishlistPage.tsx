import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { Spinner } from '@/components/ui/Spinner';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { ProductImage } from '@/components/ui/ProductImage';
import { setLocalFlag, type WishlistItem } from '@/lib/wishlist';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { viewportWidth } = useTelegram();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    api<WishlistItem[]>('/buyer/wishlist')
      .then((data) => {
        setItems(data);
        for (const it of data) setLocalFlag(it.productId, true);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authenticated]);

  // Keep page in sync with optimistic toggles
  useEffect(() => {
    if (!authenticated || loading) return;
    // No real-time refetch needed; WishlistButton optimistic-removes from server.
    // We just remove from local list when an item's flag flips to false.
    // Listening directly via subscribe() since our local state doesn't auto-refresh.
    return undefined;
  }, [authenticated, loading]);

  const cols =
    viewportWidth >= 1536 ? 'grid-cols-7' :
    viewportWidth >= 1280 ? 'grid-cols-6' :
    viewportWidth >= 1024 ? 'grid-cols-5' :
    viewportWidth >= 768  ? 'grid-cols-4' :
    viewportWidth >= 560  ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="page-icon">❤️</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gradient">Избранное</h1>
          {!loading && items.length > 0 && (
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {items.length} {items.length === 1 ? 'товар' : items.length < 5 ? 'товара' : 'товаров'}
            </p>
          )}
        </div>
      </div>

      {!authenticated && (
        <div className="empty-state">
          <span className="empty-state-icon">🔒</span>
          <p className="empty-state-title">Войдите чтобы видеть избранное</p>
          <p className="empty-state-sub">Откройте приложение через Telegram</p>
        </div>
      )}

      {authenticated && loading && (
        <div className="flex justify-center py-10"><Spinner /></div>
      )}

      {authenticated && !loading && items.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🤍</span>
          <p className="empty-state-title">Избранного пока нет</p>
          <p className="empty-state-sub">Добавляйте товары в избранное чтобы вернуться к ним позже</p>
        </div>
      )}

      {authenticated && !loading && items.length > 0 && (
        <div className={`grid ${cols} gap-3`}>
          {items.map((it) => {
            const p = it.product;
            const url = p.mediaUrls[0] ?? '';
            return (
              <div
                key={it.id}
                onClick={() => navigate(`/buyer/store/${p.storeSlug}/product/${p.id}`)}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: p.isAvailable ? 1 : 0.55,
                }}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', position: 'relative' }}>
                  <ProductImage src={url} alt={p.title} emptyVariant="product-empty" />
                  <div style={{ position: 'absolute', top: 6, right: 6 }}>
                    <WishlistButton productId={p.id} variant="card" />
                  </div>
                  {!p.isAvailable && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.45)',
                      color: '#FB7185', fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
                    }}>
                      Недоступен
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.88)',
                    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {p.title}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#A855F7' }}>
                    {Number(p.basePrice).toLocaleString('ru')} {p.currencyCode === 'UZS' ? 'сум' : p.currencyCode}
                  </p>
                  <p style={{
                    fontSize: 10, color: 'rgba(255,255,255,0.35)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    🏪 {p.storeName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
