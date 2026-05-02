import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { glass } from '@/lib/styles';
import { type CartItem, getCart, clearCart } from '@/lib/cart';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { authenticated, user } = useAuth();
  const [items] = useState<CartItem[]>(getCart);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const storeId = items[0]?.storeId;

  useEffect(() => {
    if (storeId && items.length) {
      track.checkoutStarted(storeId, items.length, total);
    }
    // Fire once on mount for this cart snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError('Заполните имя и телефон');
      return;
    }
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!/^\+998\d{9}$/.test(cleanPhone)) {
      setError('Введите номер в формате +998XXXXXXXXX');
      return;
    }

    setSubmitting(true);
    setError('');
    tg?.MainButton.showProgress();

    try {
      const order = await api<{ id: string; totalAmount: number }>('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
          buyerName: name.trim(),
          buyerPhone: phone.replace(/[\s\-()]/g, ''),
          deliveryAddress: address.trim() || undefined,
        },
      });

      if (storeId) {
        track.orderCreated(storeId, order.id, Number(order.totalAmount ?? total), 'COD');
      }
      clearCart();
      tg?.HapticFeedback.notificationOccurred('success');
      tg?.MainButton.hide();
      navigate('/buyer/orders', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка оформления');
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSubmitting(false);
      tg?.MainButton.hideProgress();
    }
  };

  if (!items.length) {
    return (
      
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 48 }}>🛒</span>
          <p style={{ color: 'rgba(255,255,255,0.40)' }}>Корзина пуста</p>
          <Button variant="ghost" onClick={() => navigate('/buyer')}>К магазинам</Button>
        </div>
      
    );
  }

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Оформление заказа</h1>

        <GlassCard className="p-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.50)' }}>
            {items[0].storeName} — {items.length} товар(ов)
          </p>
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between text-xs py-1" style={{ color: 'rgba(255,255,255,0.70)' }}>
              <span>{i.title} × {i.qty}</span>
              <span>{(i.price * i.qty).toLocaleString('ru')} сум</span>
            </div>
          ))}
          <div className="flex justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.80)' }}>Итого</span>
            <span className="text-sm font-bold" style={{ color: '#A855F7' }}>{total.toLocaleString('ru')} сум</span>
          </div>
        </GlassCard>

        <div className="flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон (+998...)"
            inputMode="tel"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Адрес доставки (необязательно)"
            className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
            style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
          />
        </div>

        {error && <p className="text-xs text-red-400 px-1">{error}</p>}

        {!authenticated && (
          <p className="text-xs px-1" style={{ color: 'rgba(251,191,36,0.70)' }}>
            Откройте через Telegram для автоматической авторизации
          </p>
        )}

        <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Оформляем...' : `Подтвердить — ${total.toLocaleString('ru')} сум`}
        </Button>
      </div>
    
  );
}
