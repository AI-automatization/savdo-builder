import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  buyer?: { phone?: string; firstName?: string };
}

const NEXT_STATUS: Record<string, { label: string; status: string } | null> = {
  PENDING:    { label: '✅ Подтвердить', status: 'CONFIRMED' },
  CONFIRMED:  { label: '🚚 Отправить',   status: 'SHIPPED' },
  PROCESSING: { label: '🚚 Отправить',   status: 'SHIPPED' },
  SHIPPED:    { label: '📦 Доставлен',   status: 'DELIVERED' },
  DELIVERED:  null,
  CANCELLED:  null,
};

export default function SellerOrdersPage() {
  const { tg } = useTelegram();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchOrders = () => {
    setError(false);
    api<{ data: Order[] }>('/seller/orders')
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const changeStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    setUpdateError(null);
    try {
      await api(`/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      setUpdateError(err instanceof Error ? err.message : 'Не удалось изменить статус');
    } finally {
      setUpdating(null);
    }
  };

  const cancelOrder = async (orderId: string) => {
    setUpdating(orderId);
    setUpdateError(null);
    try {
      await api(`/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      setUpdateError(err instanceof Error ? err.message : 'Не удалось отменить заказ');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Заказы</h1>

        {loading && <div className="flex justify-center py-8"><Spinner /></div>}

        {updateError && (
          <div
            className="px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-3"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.90)' }}
          >
            <span>⚠️ {updateError}</span>
            <button onClick={() => setUpdateError(null)} style={{ color: 'rgba(239,68,68,0.60)', fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить заказы</p>
            <button onClick={() => { setLoading(true); fetchOrders(); }} className="text-xs" style={{ color: '#A855F7' }}>Попробовать снова</button>
          </div>
        )}

        {!loading && !error && !orders.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Заказов пока нет</p>
          </div>
        )}

        {orders.map((o) => {
          const next = NEXT_STATUS[o.status];
          const isUpdating = updating === o.id;
          return (
            <GlassCard key={o.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                    #{o.orderNumber ?? o.id.slice(-6)}
                  </p>
                  <Badge status={o.status} />
                </div>
                <p className="text-sm font-bold" style={{ color: '#A855F7' }}>
                  {Number(o.totalAmount).toLocaleString('ru')} сум
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                <span>{new Date(o.createdAt).toLocaleDateString('ru')}</span>
                {o.buyer?.phone && <span>{o.buyer.phone}</span>}
              </div>

              {(next || o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                <div className="flex gap-2 mt-1">
                  {next && (
                    <button
                      onClick={() => changeStatus(o.id, next.status)}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                      style={{ background: 'rgba(167,139,250,0.20)', color: '#A855F7', border: '1px solid rgba(167,139,250,0.30)' }}
                    >
                      {isUpdating ? '...' : next.label}
                    </button>
                  )}
                  {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                    <button
                      onClick={() => cancelOrder(o.id)}
                      disabled={isUpdating}
                      className="py-2 px-3 rounded-xl text-xs font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                      style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.80)', border: '1px solid rgba(239,68,68,0.20)' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>
    </AppShell>
  );
}
