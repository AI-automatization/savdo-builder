import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/analytics';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ImagePlaceholder } from '@/components/ui/ImagePlaceholder';
import { type CartItem, getCart, saveCart } from '@/lib/cart';
import { useTranslation } from '@/lib/i18n';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(getCart);
  const [contacting, setContacting] = useState(false);
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { t, locale } = useTranslation();

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const updateQty = (productId: string, delta: number) => {
    tg?.HapticFeedback.selectionChanged();
    const updated = items
      .map((i) => i.productId === productId ? { ...i, qty: i.qty + delta } : i)
      .filter((i) => i.qty > 0);
    setItems(updated);
    saveCart(updated);
    if (delta > 0) {
      const item = items.find((i) => i.productId === productId);
      if (item) track.addToCart(item.storeId, productId, null, delta);
    }
  };

  const removeItem = (productId: string) => {
    tg?.HapticFeedback.impactOccurred('medium');
    const updated = items.filter((i) => i.productId !== productId);
    setItems(updated);
    saveCart(updated);
  };

  const handleContactSeller = useCallback(async () => {
    if (!items.length || contacting) return;
    setContacting(true);
    try {
      const firstItem = items[0];
      const itemList = items.map((i) => `• ${i.title} × ${i.qty}`).join('\n');
      await api('/chat/threads', {
        method: 'POST',
        body: {
          contextType: 'PRODUCT',
          contextId: firstItem.productId,
          firstMessage: `${t('cart.chatPrefill')}\n${itemList}`,
        },
      });
      navigate('/buyer/chat');
    } catch {
      showToast(t('cart.chatOpenFailed'), 'error');
    } finally {
      setContacting(false);
    }
  }, [items, contacting, navigate, t]);

  // Локализованное число + валюта. Узбекский тоже использует пробел как
  // тысячный разделитель — `toLocaleString('uz')` это даёт.
  const formatTotal = (n: number) => n.toLocaleString(locale === 'uz' ? 'uz' : 'ru');

  useEffect(() => {
    if (!tg || !items.length) { tg?.MainButton.hide(); return; }
    tg.MainButton.setText(
      t('cart.mainButtonCheckout', { total: formatTotal(total), currency: t('common.currency') }),
    );
    tg.MainButton.show();
    const handler = () => navigate('/buyer/checkout');
    tg.MainButton.onClick(handler);
    return () => { tg.MainButton.offClick(handler); tg.MainButton.hide(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, items, total, navigate, locale]);

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-base font-bold" style={{ color: 'var(--tg-text-primary)' }}>{t('cart.title')}</h1>

        {!items.length && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span style={{ fontSize: 48 }}>🛒</span>
            <p style={{ color: 'var(--tg-text-muted)', fontSize: 14 }}>{t('cart.empty')}</p>
            <Button variant="ghost" onClick={() => navigate('/buyer')}>{t('cart.goToStores')}</Button>
          </div>
        )}

        {items.map((item) => (
          <GlassCard key={item.productId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden">
              <ImagePlaceholder variant="thumbnail" hideLabel iconSize={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--tg-text-primary)' }}>{item.title}</p>
              <p className="text-xs" style={{ color: 'rgba(167,139,250,0.80)' }}>{item.storeName}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--tg-accent)' }}>
                {formatTotal(item.price * item.qty)} {t('common.currency')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.productId, -1)}
                aria-label={t('cart.decreaseQty')}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'var(--tg-surface-hover)', color: 'var(--tg-text-secondary)' }}
              >
                −
              </button>
              <span className="text-sm font-bold w-6 text-center" style={{ color: 'var(--tg-text-primary)' }}>
                {item.qty}
              </span>
              <button
                onClick={() => updateQty(item.productId, 1)}
                aria-label={t('cart.increaseQty')}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-base"
                style={{ background: 'var(--tg-accent-dim)', color: 'var(--tg-accent)' }}
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.productId)}
                aria-label={t('cart.removeItem')}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-base ml-1"
                style={{ color: 'rgba(239,68,68,0.70)' }}
              >
                ✕
              </button>
            </div>
          </GlassCard>
        ))}

        {items.length > 0 && (
          <div className="flex items-center justify-between px-2 py-3">
            <span className="text-sm" style={{ color: 'var(--tg-text-secondary)' }}>{t('cart.total')}:</span>
            <span className="text-base font-bold" style={{ color: 'var(--tg-accent)' }}>
              {formatTotal(total)} {t('common.currency')}
            </span>
          </div>
        )}

        {items.length > 0 && (
          <button
            onClick={handleContactSeller}
            disabled={contacting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border)', color: 'var(--tg-text-secondary)' }}
          >
            💬 {contacting ? t('cart.openingChat') : t('cart.contactSeller')}
          </button>
        )}

        {items.length > 0 && (
          <Button className="w-full" onClick={() => navigate('/buyer/checkout')}>
            {t('cart.checkout')}
          </Button>
        )}
      </div>

  );
}
