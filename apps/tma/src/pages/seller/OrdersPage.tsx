import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { OrderRowSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { ProductImage } from '@/components/ui/ProductImage';

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

// Продавцу важнее всего PENDING (новые), затем CONFIRMED/PROCESSING/SHIPPED (в работе),
// потом DELIVERED, и в самом низу CANCELLED. Внутри группы — свежие первыми.
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

// Цветовая обводка карточки по важности статуса для продавца
function cardAccent(status: string): { border: string; glow: string; opacity: number } {
  if (status === 'PENDING')    return { border: 'rgba(251,146,60,0.55)', glow: '0 0 24px rgba(251,146,60,0.20)', opacity: 1 };
  if (status === 'CONFIRMED' || status === 'PROCESSING') return { border: 'rgba(34,211,238,0.40)', glow: '0 0 18px rgba(34,211,238,0.14)', opacity: 1 };
  if (status === 'SHIPPED')    return { border: 'rgba(168,85,247,0.40)', glow: '0 0 16px rgba(168,85,247,0.14)', opacity: 1 };
  if (status === 'DELIVERED')  return { border: 'rgba(52,211,153,0.30)', glow: 'none', opacity: 1 };
  return { border: 'rgba(255,255,255,0.06)', glow: 'none', opacity: 0.55 };
}

export default function SellerOrdersPage() {
  const { tg, viewportWidth } = useTelegram();
  const navigate = useNavigate();
  const isWide = (viewportWidth ?? 0) >= 1024;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  // FEAT-004-FE: «Написать покупателю» modal
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const startChatWithBuyer = async () => {
    if (!chatOrderId || !chatMessage.trim() || chatSending) return;
    setChatSending(true);
    try {
      const thread = await api<{ id: string }>('/seller/chat/threads', {
        method: 'POST',
        body: { orderId: chatOrderId, firstMessage: chatMessage.trim() },
      });
      setChatOrderId(null);
      setChatMessage('');
      setDetailId(null);
      setDetail(null);
      showToast('✅ Сообщение отправлено');
      navigate(`/seller/chat/${thread.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось начать чат';
      showToast(`❌ ${msg}`, 'error');
    } finally {
      setChatSending(false);
    }
  };

  const ordersAbortRef = useRef<AbortController | null>(null);
  const detailAbortRef = useRef<AbortController | null>(null);

  const fetchOrders = () => {
    ordersAbortRef.current?.abort();
    const ac = new AbortController();
    ordersAbortRef.current = ac;
    setError(false);
    // forceFresh: заказы быстро меняются — статусы, новые поступления.
    api<{ data: Order[] }>('/seller/orders', { signal: ac.signal, forceFresh: true })
      .then((r) => { if (!ac.signal.aborted) setOrders(r.data ?? []); })
      .catch(() => { if (!ac.signal.aborted) setError(true); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
  };

  useEffect(() => {
    fetchOrders();
    return () => ordersAbortRef.current?.abort();
  }, []);

  // Auto-open detail if navigated with ?openId=:id (из DashboardPage «Последние заказы»)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const openId = searchParams.get('openId');
    if (openId && detailId !== openId) {
      openDetail(openId);
      // убираем query param чтобы при back-button не открывался заново
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openDetail = (orderId: string) => {
    detailAbortRef.current?.abort();
    const ac = new AbortController();
    detailAbortRef.current = ac;
    setDetailId(orderId);
    setDetail(null);
    setDetailLoading(true);
    api<OrderDetail>(`/seller/orders/${orderId}`, { signal: ac.signal, forceFresh: true })
      .then((d) => { if (!ac.signal.aborted) setDetail(d); })
      .catch((err) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Не удалось загрузить заказ';
        showToast(`❌ ${msg}`, 'error');
        setDetailId(null);
      })
      .finally(() => { if (!ac.signal.aborted) setDetailLoading(false); });
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
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Заказы</h1>

        {/* Status filter tabs */}
        <div className="scroll-fade-x">
          <div className="flex gap-1.5 overflow-x-auto scroll-snap-x pb-0.5" style={{ scrollbarWidth: 'none' }}>
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
                        background: active ? 'var(--tg-accent-bg)' : 'rgba(255,255,255,0.08)',
                        color: active ? 'var(--tg-accent-text)' : 'rgba(255,255,255,0.35)',
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
            <button onClick={() => { setLoading(true); fetchOrders(); }} className="text-xs" style={{ color: 'var(--tg-accent)' }}>Попробовать снова</button>
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

        {(() => {
          const filtered = [...orders].sort(compareOrders).filter((o) => matchesFilter(o.status, statusFilter));
          // Когда фильтр Все — отменённые прячем под кнопку "Показать N отменённых"
          const hideCancelled = statusFilter === 'all' && !showCancelled;
          const visible = hideCancelled ? filtered.filter((o) => o.status !== 'CANCELLED') : filtered;
          const cancelledHidden = hideCancelled ? filtered.filter((o) => o.status === 'CANCELLED').length : 0;

          const renderCard = (o: Order) => {
            const next = NEXT_STATUS[o.status];
            const isUpdating = updating === o.id;
            const accent = cardAccent(o.status);
            return (
              <GlassCard
                key={o.id}
                className="flex flex-col gap-3 p-4 transition-all"
                style={{
                  cursor: 'pointer',
                  border: `1px solid ${accent.border}`,
                  boxShadow: accent.glow,
                  opacity: accent.opacity,
                }}
                onClick={() => openDetail(o.id)}
              >
                {/* Main row: thumbnail + title/meta + amount/badge */}
                <div className="flex items-start gap-3 min-w-0">
                  {/* Thumbnail (preview.imageUrl на свежих заказах) */}
                  <div
                    className="shrink-0 w-14 h-14 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.18)' }}
                  >
                    <ProductImage src={o.preview?.imageUrl} emptyVariant="thumbnail" hideLabel />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-2 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
                        {o.preview?.title ?? 'Без товаров'}
                        {o.preview && o.preview.itemCount > 1 && (
                          <span className="ml-1.5 text-[10px] font-semibold" style={{ color: 'rgba(167,139,250,0.95)' }}>
                            +{o.preview.itemCount - 1}
                          </span>
                        )}
                      </p>
                      <p className="shrink-0 text-sm font-bold whitespace-nowrap" style={{ color: 'var(--tg-accent)' }}>
                        {Number(o.totalAmount).toLocaleString('ru')} сум
                      </p>
                    </div>
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

                {(next || o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    {next && (
                      <button
                        onClick={(e) => { e.stopPropagation(); changeStatus(o.id, next.status); }}
                        disabled={isUpdating}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-opacity active:opacity-70 disabled:opacity-40"
                        style={{ background: 'var(--tg-accent-dim)', color: 'var(--tg-accent)', border: '1px solid var(--tg-accent-border)' }}
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
          };

          return (
            <>
              <div className={isWide ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                {visible.map(renderCard)}
              </div>

              {cancelledHidden > 0 && (
                <button
                  onClick={() => setShowCancelled(true)}
                  className="self-start text-xs font-semibold py-2 px-4 rounded-full transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}
                >
                  ↓ Показать {cancelledHidden} {cancelledHidden === 1 ? 'отменённый' : 'отменённых'}
                </button>
              )}
            </>
          );
        })()}
      </div>

      {detailId && (
        <BottomSheet
          title={`Заказ #${detail ? (detail.orderNumber?.replace(/^ORD-/, '') ?? detail.id.slice(-6).toUpperCase()) : '...'}`}
          onClose={() => { setDetailId(null); setDetail(null); }}
        >
          {detailLoading && (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--tg-accent-border)', borderTopColor: 'var(--tg-accent)' }} />
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
                      <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--tg-accent)' }}>
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
                <span className="text-base font-bold" style={{ color: 'var(--tg-accent)' }}>
                  {Number(detail.totalAmount).toLocaleString('ru')} сум
                </span>
              </div>

              {/* FEAT-004-FE: написать покупателю — только если у заказа есть buyer (не guest) */}
              {detail.buyer && (
                <button
                  onClick={() => { setChatOrderId(detail.id); setChatMessage(''); }}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: 'rgba(34,211,238,0.14)', border: '1px solid rgba(34,211,238,0.35)', color: '#22D3EE' }}
                >
                  ✉ Написать покупателю
                </button>
              )}
            </div>
          )}
        </BottomSheet>
      )}

      {/* FEAT-004-FE chat-init modal */}
      {chatOrderId && (
        <BottomSheet
          title="Сообщение покупателю"
          onClose={() => { setChatOrderId(null); setChatMessage(''); }}
        >
          <div className="px-5 py-4 flex flex-col gap-3 pb-6">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Покупатель получит уведомление в Telegram и сможет ответить из своей вкладки «Чаты».
            </p>
            <textarea
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Например: Здравствуйте! Уточните, пожалуйста, удобное время доставки."
              rows={4}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.90)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setChatOrderId(null); setChatMessage(''); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)' }}
              >
                Отмена
              </button>
              <button
                onClick={startChatWithBuyer}
                disabled={!chatMessage.trim() || chatSending}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{
                  background: 'var(--tg-accent)',
                  border: '1px solid var(--tg-accent-border)',
                  color: '#fff',
                  opacity: (chatMessage.trim() && !chatSending) ? 1 : 0.4,
                }}
              >
                {chatSending ? '...' : '➤ Отправить'}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
