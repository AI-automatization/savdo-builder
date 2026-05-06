import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/Toast';
import { useTelegram } from '@/providers/TelegramProvider';

interface OrderItem {
  id: string;
  productTitleSnapshot: string;
  quantity: number;
  lineTotalAmount: number | string;
  variantTitleSnapshot?: string | null;
}

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number | string;
  createdAt: string;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

interface PagedResponse {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Все' },
  { value: 'pending',   label: 'Ожидают' },
  { value: 'confirmed', label: 'Подтвержд.' },
  { value: 'shipped',   label: 'В пути' },
  { value: 'delivered', label: 'Доставлены' },
  { value: 'cancelled', label: 'Отменены' },
];

function matchesFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending')   return status === 'PENDING';
  if (filter === 'confirmed') return status === 'CONFIRMED' || status === 'PROCESSING';
  if (filter === 'shipped')   return status === 'SHIPPED';
  if (filter === 'delivered') return status === 'DELIVERED';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return true;
}

// Важные сверху: PENDING/CONFIRMED/SHIPPED → DELIVERED → CANCELLED.
// Внутри одной группы — свежие первыми.
const STATUS_PRIORITY: Record<string, number> = {
  PENDING:    0,
  CONFIRMED:  1,
  PROCESSING: 1,
  SHIPPED:    2,
  DELIVERED:  3,
  CANCELLED:  4,
};
function compareOrders(a: Order, b: Order): number {
  const pa = STATUS_PRIORITY[a.status] ?? 5;
  const pb = STATUS_PRIORITY[b.status] ?? 5;
  if (pa !== pb) return pa - pb;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export default function OrdersPage() {
  const { authenticated } = useAuth();
  const { viewportWidth } = useTelegram();
  const isWide = (viewportWidth ?? 0) >= 1024;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, OrderDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchFirst = (signal?: AbortSignal) => {
    setError(false);
    api<PagedResponse>('/buyer/orders?limit=10&page=1', { signal, forceFresh: true })
      .then((res) => {
        if (signal?.aborted) return;
        setOrders(res.data ?? []);
        setPage(1);
        setHasMore((res.meta?.page ?? 1) < (res.meta?.totalPages ?? 1));
      })
      .catch(() => { if (!signal?.aborted) setError(true); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  };

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true);
    fetchFirst(ac.signal);
    return () => ac.abort();
  }, [authenticated]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    api<PagedResponse>(`/buyer/orders?limit=10&page=${nextPage}`)
      .then((res) => {
        setOrders((prev) => [...prev, ...(res.data ?? [])]);
        setPage(nextPage);
        setHasMore(nextPage < (res.meta?.totalPages ?? 1));
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast('Не удалось подгрузить заказы', 'error');
      })
      .finally(() => setLoadingMore(false));
  };

  const toggleExpand = (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    if (!details[orderId]) {
      setDetailLoading(orderId);
      api<OrderDetail>(`/buyer/orders/${orderId}`)
        .then((res) => setDetails((prev) => ({ ...prev, [orderId]: res })))
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') return;
          showToast('Не удалось загрузить детали заказа', 'error');
        })
        .finally(() => setDetailLoading(null));
    }
  };

  return (
    
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="page-icon">📦</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gradient">Мои заказы</h1>
            {!loading && orders.length > 0 && (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
              </p>
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        {authenticated && !loading && orders.length > 0 && (
          <div className="scroll-fade-x -mx-4">
            <div className="flex gap-1.5 overflow-x-auto scroll-snap-x pb-0.5 px-4" style={{ scrollbarWidth: 'none' }}>
              {STATUS_FILTERS.map((f) => {
                const count = f.value === 'all' ? orders.length : orders.filter((o) => matchesFilter(o.status, f.value)).length;
                const active = statusFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all ${active ? 'chip-active' : ''}`}
                    style={!active ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.45)',
                    } : undefined}
                  >
                    {f.label}
                    {count > 0 && (
                      <span
                        className="px-1.5 py-0 rounded-full text-[10px] font-bold"
                        style={{
                          background: active ? 'rgba(168,85,247,0.32)' : 'rgba(255,255,255,0.08)',
                          color: active ? '#F3E8FF' : 'rgba(255,255,255,0.35)',
                          minWidth: 18,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        {authenticated && !loading && error && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить заказы</p>
            <button
              onClick={() => { setLoading(true); fetchFirst(); }}
              className="text-xs"
              style={{ color: '#A855F7' }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {authenticated && !loading && !error && !orders.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>📭</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Заказов пока нет</p>
          </div>
        )}

        {authenticated && !loading && !error && orders.length > 0 && [...orders].filter((o) => matchesFilter(o.status, statusFilter)).length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>🔍</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Нет заказов в этой категории</p>
          </div>
        )}

        <div className={isWide ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
        {[...orders].sort(compareOrders).filter((o) => matchesFilter(o.status, statusFilter)).map((o) => {
          const isExpanded = expandedId === o.id;
          const detail = details[o.id];
          const isLoadingDetail = detailLoading === o.id;

          return (
            <GlassCard key={o.id} className="flex flex-col gap-0 overflow-hidden">
              <button
                className="flex items-center gap-3 px-4 py-3.5 w-full text-left"
                onClick={() => toggleExpand(o.id)}
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
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-bold" style={{ color: '#A855F7' }}>
                    {Number(o.totalAmount).toLocaleString('ru')} сум
                  </p>
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: 'rgba(255,255,255,0.30)',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div
                  className="px-4 pb-4 flex flex-col gap-2 border-t"
                  style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  {isLoadingDetail ? (
                    <div className="flex justify-center py-3"><Spinner size={16} /></div>
                  ) : detail?.items?.length ? (
                    detail.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-2 pt-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                            {item.productTitleSnapshot}
                          </p>
                          {item.variantTitleSnapshot && (
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
                              {item.variantTitleSnapshot}
                            </p>
                          )}
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            × {item.quantity}
                          </p>
                        </div>
                        <p className="text-xs font-semibold shrink-0" style={{ color: 'rgba(255,255,255,0.70)' }}>
                          {Number(item.lineTotalAmount).toLocaleString('ru')} сум
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs pt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      Нет данных о товарах
                    </p>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
        </div>

        {hasMore && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: 'rgba(168,85,247,0.12)', color: '#A855F7', border: '1px solid rgba(168,85,247,0.20)' }}
          >
            {loadingMore ? <Spinner size={16} /> : 'Загрузить ещё'}
          </button>
        )}
      </div>
    
  );
}
