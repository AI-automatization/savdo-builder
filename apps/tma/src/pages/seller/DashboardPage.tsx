import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useTelegram } from '@/providers/TelegramProvider';

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number | string;
  createdAt: string;
}

interface Stats {
  productCount: number;
  orderCount: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ data: Order[] }>('/seller/orders?limit=5').then((r) => setOrders(r.data ?? [])),
      api<{ data: Stats }>('/seller/stats').then((r) => setStats(r.data ?? null)),
    ])
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 14px rgba(167,139,250,.40)' }}
          >
            🏪
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#A78BFA' }}>Панель продавца</h1>
            {user && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {user.first_name}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Товары', value: stats?.productCount ?? '—', icon: '📦' },
            { label: 'Заказы', value: stats?.orderCount ?? '—', icon: '🛒' },
            { label: 'Новые', value: pendingCount, icon: '🔔' },
          ].map((s) => (
            <GlassCard key={s.label} className="flex flex-col items-center gap-1 py-3 px-2">
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <span className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{s.value}</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.label}</span>
            </GlassCard>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Последние заказы
          </h2>
          <button onClick={() => navigate('/seller/orders')} className="text-xs" style={{ color: '#A78BFA' }}>
            Все →
          </button>
        </div>

        {loading && <div className="flex justify-center py-6"><Spinner /></div>}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-8">
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить данные</p>
            <button onClick={() => window.location.reload()} className="text-xs" style={{ color: '#A78BFA' }}>Попробовать снова</button>
          </div>
        )}

        {!loading && !error && !orders.length && (
          <div className="flex flex-col items-center gap-2 py-8">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Заказов пока нет</p>
          </div>
        )}

        {orders.map((o) => (
          <GlassCard
            key={o.id}
            className="flex items-center gap-3 px-4 py-3.5"
            onClick={() => navigate('/seller/orders')}
          >
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
            <p className="text-sm font-bold shrink-0" style={{ color: '#A78BFA' }}>
              {Number(o.totalAmount).toLocaleString('ru')} сум
            </p>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
