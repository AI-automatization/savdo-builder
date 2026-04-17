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

interface PagedResponse {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function OrdersPage() {
  const { authenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!authenticated) { setLoading(false); return; }
    setLoading(true);
    setError(false);
    api<PagedResponse>('/buyer/orders?limit=10&page=1')
      .then((res) => {
        const data = res.data ?? [];
        setOrders(data);
        setPage(1);
        setHasMore((res.meta?.page ?? 1) < (res.meta?.totalPages ?? 1));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
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
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

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

        {authenticated && !loading && error && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>⚠️</span>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить заказы</p>
            <button
              onClick={() => {
                setError(false);
                setLoading(true);
                api<PagedResponse>('/buyer/orders?limit=10&page=1')
                  .then((res) => {
                    setOrders(res.data ?? []);
                    setPage(1);
                    setHasMore((res.meta?.page ?? 1) < (res.meta?.totalPages ?? 1));
                  })
                  .catch(() => setError(true))
                  .finally(() => setLoading(false));
              }}
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
    </AppShell>
  );
}
