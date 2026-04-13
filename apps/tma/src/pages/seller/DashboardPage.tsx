import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
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

interface PagedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const { authVersion } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Promise.allSettled — не падает если один из запросов вернул ошибку
    Promise.allSettled([
      api<PagedResponse<Order>>('/seller/orders?limit=5'),
      api<unknown[]>('/seller/products'),
    ]).then(([ordersResult, productsResult]) => {
      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.data ?? []);
        setOrderCount(ordersResult.value.meta?.total ?? 0);
      }
      if (productsResult.status === 'fulfilled') {
        const val = productsResult.value;
        setProductCount(Array.isArray(val) ? val.length : 0);
      }
    }).finally(() => setLoading(false));
  }, [authVersion]);

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        {/* Заголовок */}
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

        {/* Счётчики */}
        {loading ? (
          <div className="flex justify-center py-4"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Товары',  value: productCount ?? '—', icon: '📦' },
              { label: 'Заказы',  value: orderCount   ?? '—', icon: '🛒' },
              { label: 'Новые',   value: pendingCount,         icon: '🔔' },
            ].map((s) => (
              <GlassCard key={s.label} className="flex flex-col items-center gap-1 py-3 px-2">
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <span className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{s.value}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.label}</span>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Быстрые действия */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/seller/products')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.25)' }}
          >
            <span>📦</span> Мои товары
          </button>
          <button
            onClick={() => navigate('/seller/products/add')}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)' }}
          >
            <span>➕</span> Добавить
          </button>
        </div>

        {/* Последние заказы */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Последние заказы
          </h2>
          <button onClick={() => navigate('/seller/orders')} className="text-xs" style={{ color: '#A78BFA' }}>
            Все →
          </button>
        </div>

        {!loading && orders.length === 0 && (
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
