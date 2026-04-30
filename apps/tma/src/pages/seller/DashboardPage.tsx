import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Sticker } from '@/components/ui/Sticker';
import { useTelegram } from '@/providers/TelegramProvider';

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

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
  const { user, viewportWidth } = useTelegram();
  const { authVersion } = useAuth();
  const isDesktop = (viewportWidth ?? 0) >= 768;

  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    // Promise.allSettled — не падает если один из запросов вернул ошибку
    Promise.allSettled([
      api<PagedResponse<Order>>('/seller/orders?limit=5'),
      api<{ products: unknown[]; total: number }>('/seller/products?limit=1'),
    ]).then(([ordersResult, productsResult]) => {
      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.data ?? []);
        setOrderCount(ordersResult.value.meta?.total ?? 0);
      }
      if (productsResult.status === 'fulfilled') {
        setProductCount(productsResult.value.total ?? 0);
      }
    }).finally(() => setLoading(false));
  }, [authVersion]);

  const pendingCount = orderCount != null
    ? orders.filter((o) => o.status === 'PENDING').length
    : 0;

  const statsCards = [
    { label: 'Товары', value: productCount ?? '—', icon: '📦', path: '/seller/products', urgent: false },
    { label: 'Заказы', value: orderCount   ?? '—', icon: '🛒', path: '/seller/orders',   urgent: false },
    { label: 'Новые',  value: pendingCount,         icon: '🔔', path: '/seller/orders',   urgent: pendingCount > 0 },
  ];

  const ordersList = (
    <>
      <div className="flex items-center justify-between">
        <div className="section-label">Последние заказы</div>
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

      <div className="flex flex-col gap-2">
        {orders.map((o) => (
          <GlassCard
            key={o.id}
            className="flex items-center gap-3 px-3 py-3"
            onClick={() => navigate('/seller/orders')}
            style={{ cursor: 'pointer' }}
          >
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
    </>
  );

  return (
    
      <div className="flex flex-col gap-4">
        {/* Заголовок */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 14px rgba(168,85,247,.40)' }}
          >
            <Sticker emoji="🏪" size={26} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gradient">Панель продавца</h1>
            {user && (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Привет, {user.first_name} 👋
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/seller/settings')}
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }}
          >
            <GearIcon />
          </button>
        </div>

        {isDesktop ? (
          /* ── Desktop: two-column layout ── */
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left column */}
            <div className="flex flex-col gap-4">
              {/* Stats */}
              {loading ? (
                <div className="flex justify-center py-4"><Spinner /></div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {statsCards.map((s) => (
                    <GlassCard
                      key={s.label}
                      className="flex flex-col items-center gap-2 py-4 px-2"
                      onClick={() => navigate(s.path)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <Sticker emoji={s.icon} size={32} />
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
                      <span className="text-2xl font-bold" style={{ color: s.urgent ? '#EF4444' : 'rgba(255,255,255,0.90)' }}>
                        {s.value}
                      </span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.label}</span>
                    </GlassCard>
                  ))}
                </div>
              )}

              {/* Quick actions — bigger on desktop */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/seller/products')}
                  className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}
                >
                  <span style={{ fontSize: 28 }}>📦</span> Мои товары
                </button>
                <button
                  onClick={() => navigate('/seller/products/add')}
                  className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.22)' }}
                >
                  <span style={{ fontSize: 28 }}>➕</span> Добавить товар
                </button>
                <button
                  onClick={() => navigate('/seller/orders')}
                  className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.20)' }}
                >
                  <span style={{ fontSize: 28 }}>📋</span> Все заказы
                </button>
                <button
                  onClick={() => navigate('/seller/store')}
                  className="flex flex-col items-center gap-2 px-4 py-5 rounded-2xl text-sm font-semibold text-white"
                  style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)' }}
                >
                  <span style={{ fontSize: 28 }}>🏪</span> Мой магазин
                </button>
              </div>
            </div>

            {/* Right column — recent orders */}
            <div className="flex flex-col gap-3">
              {ordersList}
            </div>
          </div>
        ) : (
          /* ── Mobile: single column ── */
          <>
            {loading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {statsCards.map((s) => (
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
                    <span className="text-lg font-bold" style={{ color: s.urgent ? '#EF4444' : 'rgba(255,255,255,0.90)' }}>
                      {s.value}
                    </span>
                    <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{s.label}</span>
                  </GlassCard>
                ))}
              </div>
            )}

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
              <button
                onClick={() => navigate('/seller/orders')}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(34,211,238,0.10)', border: '1px solid rgba(34,211,238,0.20)' }}
              >
                <span>📋</span> Все заказы
              </button>
              <button
                onClick={() => navigate('/seller/store')}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)' }}
              >
                <span>🏪</span> Мой магазин
              </button>
            </div>

            {ordersList}
          </>
        )}
      </div>
    
  );
}
