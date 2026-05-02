import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { track } from '@/lib/analytics';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { type CartItem, getCart, saveCart } from '@/lib/cart';

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>(getCart);
  const [contacting, setContacting] = useState(false);
  const navigate = useNavigate();
  const { tg } = useTelegram();

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
          firstMessage: `Хочу уточнить по товарам из корзины:\n${itemList}`,
        },
      });
      navigate('/buyer/chat');
    } catch {
      showToast('❌ Не удалось открыть чат', 'error');
    } finally {
      setContacting(false);
    }
  }, [items, contacting, navigate]);

  useEffect(() => {
    if (!tg || !items.length) { tg?.MainButton.hide(); return; }
    tg.MainButton.setText(`Оформить — ${total.toLocaleString('ru')} сум`);
    tg.MainButton.show();
    const handler = () => navigate('/buyer/checkout');
    tg.MainButton.onClick(handler);
    return () => { tg.MainButton.offClick(handler); tg.MainButton.hide(); };
  }, [tg, items, total, navigate]);

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Корзина</h1>

        {!items.length && (
          <div className="flex flex-col items-center gap-3 py-16">
            <span style={{ fontSize: 48 }}>🛒</span>
            <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>Корзина пуста</p>
            <Button variant="ghost" onClick={() => navigate('/buyer')}>Перейти к магазинам</Button>
          </div>
        )}

        {items.map((item) => (
          <GlassCard key={item.productId} className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.88)' }}>{item.title}</p>
              <p className="text-xs" style={{ color: 'rgba(167,139,250,0.80)' }}>{item.storeName}</p>
              <p className="text-xs font-bold mt-0.5" style={{ color: '#A855F7' }}>
                {(item.price * item.qty).toLocaleString('ru')} сум
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.productId, -1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.60)' }}
              >
                −
              </button>
              <span className="text-sm font-bold w-5 text-center" style={{ color: 'rgba(255,255,255,0.80)' }}>
                {item.qty}
              </span>
              <button
                onClick={() => updateQty(item.productId, 1)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'rgba(167,139,250,0.25)', color: '#A855F7' }}
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.productId)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm ml-1"
                style={{ color: 'rgba(239,68,68,0.70)' }}
              >
                ✕
              </button>
            </div>
          </GlassCard>
        ))}

        {items.length > 0 && (
          <div className="flex items-center justify-between px-2 py-3">
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>Итого:</span>
            <span className="text-base font-bold" style={{ color: '#A855F7' }}>
              {total.toLocaleString('ru')} сум
            </span>
          </div>
        )}

        {items.length > 0 && (
          <button
            onClick={handleContactSeller}
            disabled={contacting}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}
          >
            💬 {contacting ? 'Открываем чат...' : 'Уточнить у продавца'}
          </button>
        )}

        {items.length > 0 && (
          <Button className="w-full" onClick={() => navigate('/buyer/checkout')}>
            Оформить заказ
          </Button>
        )}
      </div>
    
  );
}
