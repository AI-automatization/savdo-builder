import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
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
}

export default function OrdersPage() {
  const { authenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    api<{ orders: Order[] }>('/buyer/orders')
      .then((res) => setOrders(res.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authenticated]);

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Мои заказы</h1>

        {!authenticated && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>🔒</span>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Откройте через Telegram для просмотра заказов
            </p>
          </div>
        )}

        {authenticated && loading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}

        {authenticated && !loading && !orders.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Заказов пока нет</p>
          </div>
        )}

        {orders.map((o) => (
          <GlassCard key={o.id} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>
                  #{o.orderNumber ?? o.id.slice(-6)}
                </p>
                <Badge status={o.status} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {new Date(o.createdAt).toLocaleDateString('ru')}
              </p>
            </div>
            <p className="text-sm font-bold shrink-0" style={{ color: '#A855F7' }}>
              {Number(o.totalAmount).toLocaleString('ru')} сум
            </p>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
