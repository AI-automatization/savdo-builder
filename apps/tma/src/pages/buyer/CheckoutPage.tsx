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
import { formatUzPhone, stripPhone, isValidUzPhone } from '@/lib/phone';

interface SuccessOrder {
  id: string;
  orderNumber?: string;
  totalAmount: number;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { authenticated, user } = useAuth();
  const [items] = useState<CartItem[]>(getCart);
  const [name, setName] = useState('');
  // TMA-PHONE-MASK-001: маска `+998 XX XXX XX XX`. State хранит уже
  // отформатированную строку, для backend stripPhone() возвращает E.164.
  const [phone, setPhone] = useState(() => formatUzPhone(user?.phone ?? ''));
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // TMA-CHECKOUT-SUCCESS-PAGE-001: вместо моментального navigate показываем
  // success screen с orderNumber + кнопкой «Мои заказы». UX consistency с
  // web-buyer (router.replace на /orders/:id).
  const [successOrder, setSuccessOrder] = useState<SuccessOrder | null>(null);

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
    // TMA-PHONE-MASK-001: validation через helper. Backend ждёт +998XXXXXXXXX
    // (E.164), маска `+998 XX XXX XX XX` визуальная — stripPhone снимает пробелы.
    if (!isValidUzPhone(phone)) {
      setError('Введите 9 цифр после +998 (например, +998 90 123 45 67)');
      return;
    }
    const cleanPhone = stripPhone(phone);

    setSubmitting(true);
    setError('');
    tg?.MainButton.showProgress();

    try {
      const order = await api<{ id: string; orderNumber?: string; totalAmount: number }>('/orders', {
        method: 'POST',
        body: {
          items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.qty })),
          buyerName: name.trim(),
          buyerPhone: cleanPhone,
          deliveryAddress: address.trim() || undefined,
        },
      });

      if (storeId) {
        track.orderCreated(storeId, order.id, Number(order.totalAmount ?? total), 'COD');
      }
      clearCart();
      tg?.HapticFeedback.notificationOccurred('success');
      tg?.MainButton.hide();
      // Success screen с orderNumber вместо моментального navigate.
      setSuccessOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: Number(order.totalAmount ?? total),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка оформления');
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSubmitting(false);
      tg?.MainButton.hideProgress();
    }
  };

  // TMA-CHECKOUT-SUCCESS-PAGE-001: success-экран после order created.
  if (successOrder) {
    return (
      <div className="flex flex-col items-center gap-5 py-12 px-4 max-w-md mx-auto text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(34,197,94,0.15)',
            border: '2px solid rgba(34,197,94,0.40)',
          }}
        >
          <span style={{ fontSize: 40 }}>✓</span>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Заказ оформлен!
          </h1>
          {successOrder.orderNumber && (
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.50)' }}>
              № {successOrder.orderNumber}
            </p>
          )}
        </div>
        <GlassCard className="w-full p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>К оплате при получении</span>
            <span className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
              {successOrder.totalAmount.toLocaleString('ru')} сум
            </span>
          </div>
          <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Продавец свяжется с вами для подтверждения. Уведомления о смене статуса
            придут в Telegram.
          </p>
        </GlassCard>
        <div className="flex flex-col gap-2 w-full">
          <Button
            className="w-full"
            onClick={() => navigate('/buyer/orders', { replace: true })}
          >
            📦 Мои заказы
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/buyer', { replace: true })}
          >
            К магазинам
          </Button>
        </div>
      </div>
    );
  }

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
            <span className="text-sm font-bold" style={{ color: 'var(--tg-accent)' }}>{total.toLocaleString('ru')} сум</span>
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
            onChange={(e) => setPhone(formatUzPhone(e.target.value))}
            placeholder="+998 90 123 45 67"
            inputMode="tel"
            autoComplete="tel"
            maxLength={17}
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
          <div
            className="px-3 py-3 rounded-xl flex flex-col gap-1"
            style={{
              background: 'rgba(251,191,36,0.10)',
              border: '1px solid rgba(251,191,36,0.30)',
            }}
          >
            <p className="text-xs font-semibold" style={{ color: 'rgba(251,191,36,0.95)' }}>
              ⚠️ Нужна авторизация
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(251,191,36,0.70)' }}>
              Откройте магазин через Telegram-бот @savdo_builderBOT — авторизация
              произойдёт автоматически.
            </p>
          </div>
        )}

        {/* TMA-CHECKOUT-GUEST-401-001: блокируем submit для гостя.
            Раньше POST /orders падал 401 → user видел generic ошибку. */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={submitting || !authenticated}
        >
          {submitting
            ? 'Оформляем...'
            : !authenticated
              ? 'Войдите через Telegram'
              : `Подтвердить — ${total.toLocaleString('ru')} сум`}
        </Button>
      </div>
    
  );
}
