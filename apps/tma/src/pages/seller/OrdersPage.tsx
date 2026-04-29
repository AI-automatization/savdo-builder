import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';

interface Order {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  buyer?: { phone?: string; firstName?: string } | null;
  preview?: {
    title: string;
    imageUrl: string | null;
    itemCount: number;
  } | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  createdAt?: string;
  currencyCode?: string;
  customerFullName?: string | null;
  customerPhone?: string | null;
  buyerNote?: string | null;
  deliveryFee?: number;
  deliveryAddress?: { street?: string | null; city?: string | null; region?: string | null } | null;
  buyer?: { phone?: string | null } | null;
  items?: Array<{
    id: string;
    title: string;
    variantTitle?: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

const NEXT_STATUS: Record<string, { label: string; status: string } | null> = {
  PENDING:    { label: '✅ Подтвердить', status: 'CONFIRMED' },
  CONFIRMED:  { label: '🚚 Отправить',   status: 'SHIPPED' },
  PROCESSING: { label: '🚚 Отправить',   status: 'SHIPPED' },
  SHIPPED:    { label: '📦 Доставлен',   status: 'DELIVERED' },
  DELIVERED:  null,
  CANCELLED:  null,
};

function shortOrderNumber(o: { orderNumber: string | null; id: string }): string {
  if (o.orderNumber) return o.orderNumber.replace(/^ORD-/, '');
  return o.id.slice(-6).toUpperCase();
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
  const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

type StatusFilter = 'all' | 'pending' | 'active' | 'delivered' | 'cancelled';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all',       label: 'Все' },
  { value: 'pending',   label: 'Новые' },
  { value: 'active',    label: 'В работе' },
  { value: 'delivered', label: 'Доставлены' },
  { value: 'cancelled', label: 'Отменены' },
];

function matchesFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'pending')   return status === 'PENDING';
  if (filter === 'active')    return status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPED';
  if (filter === 'delivered') return status === 'DELIVERED';
  if (filter === 'cancelled') return status === 'CANCELLED';
  return true;
}

export default function SellerOrdersPage() {
  const { tg } = useTelegram();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = () => {
    setError(false);
    api<{ data: Order[] }>('/seller/orders')
      .then((r) => setOrders(r.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const openDetail = (orderId: string) => {
    setDetailId(orderId);
    setDetail(null);
    setDetailLoading(true);
    api<OrderDetail>(`/seller/orders/${orderId}`)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  };

  const changeStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    setUpdateError(null);
    try {
      await api(`/seller/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Статус обновлён');
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Не удалось изменить статус', 'error');
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
    
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Заказы</h1>

        {/* Status filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {STATUS_FILTERS.map((f) => {
            const count = f.value === 'all' ? orders.length : orders.filter((o) => matchesFilter(o.status, f.value)).length;
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: active ? 'rgba(168,85,247,0.22)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${active ? 'rgba(168,85,247,0.40)' : 'rgba(255,255,255,0.10)'}`,
                  color: active ? '#A855F7' : 'rgba(255,255,255,0.45)',
                }}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className="px-1.5 py-0 rounded-full text-[10px] font-bold"
                    style={{
                      background: active ? 'rgba(168,85,247,0.30)' : 'rgba(255,255,255,0.08)',
                      color: active ? '#A855F7' : 'rgba(255,255,255,0.35)',
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

        {loading && [1,2,3].map((i) => <OrderRowSkeleton key={i} />)}

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
        {!loading && !error && orders.length > 0 && orders.filter((o) => matchesFilter(o.status, statusFilter)).length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>🔍</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Нет заказов в этой категории</p>
          </div>
        )}

        {orders.filter((o) => matchesFilter(o.status, statusFilter)).map((o) => {
          const next = NEXT_STATUS[o.status];
          const isUpdating = updating === o.id;
          return (
            <GlassCard key={o.id} className="flex flex-col gap-3 p-4" style={{ cursor: 'pointer' }} onClick={() => openDetail(o.id)}>
              {/* Main row: thumbnail + title/meta + amount/badge */}
              <div className="flex items-start gap-3 min-w-0">
                {/* Thumbnail */}
                <div
                  className="shrink-0 w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.18)' }}
                >
                  {o.preview?.imageUrl ? (
                    <img src={o.preview.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ fontSize: 20 }}>📦</span>
                  )}
                </div>

                {/* Middle: title + meta line with right-side amount + badge */}
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  {/* Row 1: title · amount */}
                  <div className="flex items-baseline justify-between gap-2 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
                      {o.preview?.title ?? 'Без товаров'}
                      {o.preview && o.preview.itemCount > 1 && (
                        <span className="ml-1.5 text-[10px] font-semibold" style={{ color: 'rgba(167,139,250,0.95)' }}>
                          +{o.preview.itemCount - 1}
                        </span>
                      )}
                    </p>
                    <p className="shrink-0 text-sm font-bold whitespace-nowrap" style={{ color: '#A855F7' }}>
                      {Number(o.totalAmount).toLocaleString('ru')} сум
                    </p>
                  </div>
                  {/* Row 2: meta · badge */}
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <p className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      #{shortOrderNumber(o)} · {shortDate(o.createdAt)}
                      {o.buyer?.phone ? ` · ${o.buyer.phone}` : ''}
                    </p>
                    <div className="shrink-0">
                      <Badge status={o.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(next || o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {next && (
                    <button
                      onClick={(e) => { e.stopPropagation(); changeStatus(o.id, next.status); }}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                      style={{ background: 'rgba(167,139,250,0.20)', color: '#A855F7', border: '1px solid rgba(167,139,250,0.30)' }}
                    >
                      {isUpdating ? '...' : next.label}
                    </button>
                  )}
                  {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelOrder(o.id); }}
                      disabled={isUpdating}
                      className="py-2 px-3 rounded-xl text-xs font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                      style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.80)', border: '1px solid rgba(239,68,68,0.20)' }}
                    >
                      ✕ Отменить
                    </button>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {detailId && (
        <BottomSheet
          title={`Заказ #${detail ? (detail.orderNumber?.replace(/^ORD-/, '') ?? detail.id.slice(-6).toUpperCase()) : '...'}`}
          onClose={() => { setDetailId(null); setDetail(null); }}
        >
          {detailLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(167,139,250,0.3)', borderTopColor: '#A855F7' }} />
            </div>
          )}
          {!detailLoading && detail && (
            <div className="px-5 py-4 flex flex-col gap-5 pb-8">
              {/* Дата и время */}
              {detail.createdAt && (
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  🕐 {new Date(detail.createdAt).toLocaleString('ru', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}

              {/* Покупатель */}
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  👤 Покупатель
                </p>
                {detail.customerFullName && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{detail.customerFullName}</p>
                )}
                {detail.customerPhone && (
                  <a href={`tel:${detail.customerPhone}`} className="text-sm flex items-center gap-1.5" style={{ color: '#22D3EE' }}>
                    📞 {detail.customerPhone} <span style={{ fontSize: 10, opacity: 0.6 }}>при заказе</span>
                  </a>
                )}
                {detail.buyer?.phone && detail.buyer.phone !== detail.customerPhone && (
                  <a href={`tel:${detail.buyer.phone}`} className="text-sm flex items-center gap-1.5" style={{ color: '#A78BFA' }}>
                    📱 {detail.buyer.phone} <span style={{ fontSize: 10, opacity: 0.6 }}>аккаунт</span>
                  </a>
                )}
              </div>

              {/* Товары */}
              {(detail.items ?? []).length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    📦 Товары
                  </p>
                  {(detail.items ?? []).map((item) => (
                    <div key={item.id} className="flex items-baseline justify-between gap-2">
                      <span className="text-sm flex-1 truncate" style={{ color: 'rgba(255,255,255,0.80)' }}>
                        {item.title}{item.variantTitle ? ` · ${item.variantTitle}` : ''} × {item.quantity}
                      </span>
                      <span className="text-sm font-semibold shrink-0" style={{ color: '#A855F7' }}>
                        {Number(item.subtotal).toLocaleString('ru')} сум
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Адрес */}
              {(detail.deliveryAddress?.city || detail.deliveryAddress?.street) && (
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>📍 Адрес</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                    {[detail.deliveryAddress.city, detail.deliveryAddress.region, detail.deliveryAddress.street].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}

              {/* Комментарий */}
              {detail.buyerNote && (
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>💬 Комментарий</p>
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>{detail.buyerNote}</p>
                </div>
              )}

              {/* Итого */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Итого</span>
                <span className="text-base font-bold" style={{ color: '#A855F7' }}>
                  {Number(detail.totalAmount).toLocaleString('ru')} сум
                </span>
              </div>
            </div>
          )}
        </BottomSheet>
      )}
    
  );
}
