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
  preview?: {
    title: string;
    imageUrl: string | null;
    itemCount: number;
  } | null;
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
  const [hideCompleted, setHideCompleted] = useState(false);

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
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Заказы</h1>
          {orders.length > 0 && (
            <button
              onClick={() => setHideCompleted((v) => !v)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
              style={
                hideCompleted
                  ? { background: 'rgba(52,211,153,0.18)', color: 'rgba(52,211,153,0.95)', border: '1px solid rgba(52,211,153,0.30)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.10)' }
              }
            >
              {hideCompleted ? '✓ ' : ''}Скрыть завершённые
            </button>
          )}
        </div>

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

        {(hideCompleted ? orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED') : orders).map((o) => {
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

              {o.preview && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {o.preview.imageUrl ? (
                      <img src={o.preview.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span style={{ fontSize: 18 }}>📦</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-1.5">
                    <p className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.78)' }}>
                      {o.preview.title}
                    </p>
                    {o.preview.itemCount > 1 && (
                      <span
                        className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(167,139,250,0.18)', color: 'rgba(167,139,250,0.95)' }}
                      >
                        +{o.preview.itemCount - 1}
                      </span>
                    )}
                  </div>
                </div>
              )}

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
