import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Sticker } from '@/components/ui/Sticker';
import { useTelegram } from '@/providers/TelegramProvider';

interface OrderPreview {
  title: string;
  imageUrl: string | null;
  itemCount: number;
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  preview?: OrderPreview | null;
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

  const pendingCount = orderCount != null
    ? orders.filter((o) => o.status === 'PENDING').length
    : 0;

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        {/* Заголовок */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 14px rgba(168,85,247,.40)' }}
          >
            <Sticker emoji="🏪" size={26} />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#A855F7' }}>Панель продавца</h1>
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
              { label: 'Товары', value: productCount ?? '—', icon: '📦', path: '/seller/products', urgent: false },
              { label: 'Заказы', value: orderCount   ?? '—', icon: '🛒', path: '/seller/orders',   urgent: false },
              { label: 'Новые',  value: pendingCount,         icon: '🔔', path: '/seller/orders',   urgent: pendingCount > 0 },
            ].map((s) => (
              <GlassCard
                key={s.label}
                className="flex flex-col items-center gap-1 py-3 px-2"
                onClick={() => navigate(s.path)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <Sticker emoji={s.icon} size={28} />
                  {s.urgent && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#EF4444',
                      boxShadow: '0 0 0 2px rgba(239,68,68,0.30)',
                      animation: 'pulse 1.5s infinite',
                    }} />
                  )}
                </div>
                <span
                  className="text-lg font-bold"
                  style={{ color: s.urgent ? '#EF4444' : 'rgba(255,255,255,0.90)' }}
                >
                  {s.value}
                </span>
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
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}
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
          <button onClick={() => navigate('/seller/orders')} className="text-xs" style={{ color: '#A855F7' }}>
            Все →
          </button>
        </div>

        {!loading && orders.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Sticker emoji="📭" size={56} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Заказов пока нет</p>
          </div>
        )}

        {orders.map((o) => (
          <GlassCard
            key={o.id}
            className="flex items-center gap-3 px-3 py-3"
            onClick={() => navigate('/seller/orders')}
          >
            {/* Thumbnail */}
            <div
              className="shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.18)' }}
            >
              {o.preview?.imageUrl ? (
                <img src={o.preview.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span style={{ fontSize: 18 }}>📦</span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {o.preview?.title ?? `#${o.orderNumber ?? o.id.slice(-6)}`}
                  {o.preview && o.preview.itemCount > 1 && (
                    <span className="ml-1.5 text-[10px] font-semibold" style={{ color: 'rgba(167,139,250,0.90)' }}>
                      +{o.preview.itemCount - 1}
                    </span>
                  )}
                </p>
                <Badge status={o.status} />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {new Date(o.createdAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                </p>
                <p className="text-xs font-bold" style={{ color: '#A855F7' }}>
                  {Number(o.totalAmount).toLocaleString('ru')} сум
                </p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
