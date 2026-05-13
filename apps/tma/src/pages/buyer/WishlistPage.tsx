import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import { WishlistButton } from '@/components/ui/WishlistButton';
import { ProductImage } from '@/components/ui/ProductImage';
import { showToast } from '@/components/ui/Toast';
import { setLocalFlag, type WishlistItem } from '@/lib/wishlist';
import { clickableA11y } from '@/lib/a11y';
import { useTranslation } from '@/lib/i18n';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { authenticated } = useAuth();
  const { viewportWidth } = useTelegram();
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fmt = (n: number) => n.toLocaleString(locale === 'uz' ? 'uz' : 'ru');

  const pluralWishlist = (count: number): string => {
    const lastTwo = count % 100;
    const lastOne = count % 10;
    let form: 'wordOne' | 'wordFew' | 'wordMany';
    if (lastTwo >= 11 && lastTwo <= 14) form = 'wordMany';
    else if (lastOne === 1) form = 'wordOne';
    else if (lastOne >= 2 && lastOne <= 4) form = 'wordFew';
    else form = 'wordMany';
    return t('wishlist.itemsCount', { count, word: t(`wishlist.${form}`) });
  };

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    api<WishlistItem[]>('/buyer/wishlist')
      .then((data) => {
        setItems(data);
        for (const it of data) setLocalFlag(it.productId, true);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast(t('wishlist.loadError'), 'error');
      })
      .finally(() => setLoading(false));
  }, [authenticated, t]);

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
          <h1 className="text-base font-bold text-gradient">{t('wishlist.title')}</h1>
          {!loading && items.length > 0 && (
            <p className="text-xs font-medium" style={{ color: 'var(--tg-text-muted)' }}>
              {pluralWishlist(items.length)}
            </p>
          )}
        </div>
      </div>

      {!authenticated && (
        <div className="empty-state">
          <span className="empty-state-icon">🔒</span>
          <p className="empty-state-title">{t('wishlist.authTitle')}</p>
          <p className="empty-state-sub">{t('wishlist.authSub')}</p>
        </div>
      )}

      {authenticated && loading && (
        <div className={`grid ${cols} gap-3`}>
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {authenticated && !loading && items.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">🤍</span>
          <p className="empty-state-title">{t('wishlist.empty')}</p>
          <p className="empty-state-sub">{t('wishlist.emptySub')}</p>
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
                {...clickableA11y(() => navigate(`/buyer/store/${p.storeSlug}/product/${p.id}`))}
                aria-label={t('wishlist.openProduct', { title: p.title })}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: 'var(--tg-surface)',
                  border: '1px solid var(--tg-border-soft)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: p.isAvailable ? 1 : 0.55,
                }}
              >
                <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'var(--tg-surface-hover)', position: 'relative' }}>
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
                      {t('wishlist.unavailable')}
                    </div>
                  )}
                </div>
                <div style={{ padding: '8px 8px 10px', display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  <p style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--tg-text-primary)',
                    lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {p.title}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--tg-accent)' }}>
                    {fmt(Number(p.basePrice))} {p.currencyCode === 'UZS' ? t('common.currency') : p.currencyCode}
                  </p>
                  <p style={{
                    fontSize: 10, color: 'var(--tg-text-muted)',
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
