'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OrderStatus } from 'types';
import { X, Package } from 'lucide-react';
import type { OrderListItem } from 'types';
import { useSellerOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { track } from '@/lib/analytics';
import { card, colors, dangerTint, inputStyle } from '@/lib/styles';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: 'Ожидает',      color: colors.warning },
  [OrderStatus.CONFIRMED]:  { label: 'Подтверждён',  color: colors.info },
  [OrderStatus.PROCESSING]: { label: 'Обработка',    color: colors.accent },
  [OrderStatus.SHIPPED]:    { label: 'В пути',        color: colors.info },
  [OrderStatus.DELIVERED]:  { label: 'Доставлен',    color: colors.success },
  [OrderStatus.CANCELLED]:  { label: 'Отменён',      color: colors.danger },
};

// Seller-allowed forward transitions per state
const NEXT_TRANSITION: Record<string, { status: OrderStatus; label: string }> = {
  [OrderStatus.PENDING]:    { status: OrderStatus.CONFIRMED,  label: 'Подтвердить' },
  [OrderStatus.CONFIRMED]:  { status: OrderStatus.PROCESSING, label: 'В обработку' },
  [OrderStatus.PROCESSING]: { status: OrderStatus.SHIPPED,    label: 'Отправить' },
  [OrderStatus.SHIPPED]:    { status: OrderStatus.DELIVERED,  label: 'Доставлено' },
};

const CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

const FILTER_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL',                    label: 'Все' },
  { key: OrderStatus.PENDING,      label: 'Ожидают' },
  { key: OrderStatus.CONFIRMED,    label: 'Подтвержд.' },
  { key: OrderStatus.PROCESSING,   label: 'Обработка' },
  { key: OrderStatus.SHIPPED,      label: 'В пути' },
  { key: OrderStatus.DELIVERED,    label: 'Доставлены' },
];

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
}

function fmt(amount: unknown) {
  return toNum(amount).toLocaleString('ru-RU') + ' сум';
}

function getAddr(o: OrderListItem) {
  const raw = o as unknown as { city?: string | null; addressLine1?: string | null };
  return {
    city: o.deliveryAddress?.city ?? raw.city ?? null,
    street: o.deliveryAddress?.street ?? raw.addressLine1 ?? null,
  };
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-6).toUpperCase() : id;
}

// ── Cancel Modal ────────────────────────────────────────────────────────────────

function CancelModal({
  order,
  onClose,
  onConfirm,
  loading,
}: {
  order: OrderListItem;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4 shadow-2xl" style={card}>
        <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Отменить заказ #{shortId(order.id)}</h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {(() => { const a = getAddr(order); return `${a.city ?? '—'}, ${a.street ?? '—'}`; })()}
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: colors.textMuted }}>
            Причина отмены <span style={{ color: colors.danger }}>*</span>
          </label>
          <textarea
            className="w-full rounded-lg px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2"
            style={{
              ...inputStyle,
              minHeight: 80,
              '--tw-ring-color': colors.accentBorder,
            } as React.CSSProperties}
            placeholder="Нет в наличии, покупатель не отвечает..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
          >
            Назад
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: dangerTint(0.22), color: colors.danger, border: `1px solid ${dangerTint(0.35)}` }}
          >
            {loading ? 'Отмена...' : 'Отменить заказ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Row ────────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  onAction,
  onCancel,
  pendingId,
}: {
  order: OrderListItem;
  onAction: (order: OrderListItem, toStatus: OrderStatus) => void;
  onCancel: (order: OrderListItem) => void;
  pendingId: string | null;
}) {
  const cfg = STATUS_CONFIG[order.status];
  const next = NEXT_TRANSITION[order.status];
  const canCancel = CANCELLABLE.includes(order.status);
  const isLoading = pendingId === order.id;

  return (
    <div
      className="flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-x-4 transition-colors"
      style={{ borderBottom: `1px solid ${colors.divider}` }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceElevated; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* ID */}
      <Link href={`/orders/${order.id}`} className="hidden sm:block text-xs font-mono transition-opacity hover:opacity-70" style={{ color: colors.textDim }}>
        #{shortId(order.id)}
      </Link>

      {/* Preview + address */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <Link href={`/orders/${order.id}`} className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity">
          {/* Thumbnail */}
          <div
            className="shrink-0 w-11 h-11 rounded-md overflow-hidden flex items-center justify-center"
            style={{ background: colors.surfaceSunken, border: `1px solid ${colors.border}` }}
          >
            {order.preview?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={order.preview.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Package size={18} strokeWidth={1.6} style={{ color: colors.textDim }} />
            )}
          </div>
          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                {order.preview?.title ?? 'Без товаров'}
              </p>
              {order.preview && order.preview.itemCount > 1 && (
                <span
                  className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: colors.accentMuted, color: colors.accent }}
                >
                  +{order.preview.itemCount - 1}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 truncate" style={{ color: colors.textDim }}>
              {(() => { const a = getAddr(order); return `${a.city ?? '—'} · ${a.street ?? '—'}`; })()} · #{shortId(order.id)}
            </p>
          </div>
        </Link>
        {/* Status badge — mobile only */}
        <span
          className="sm:hidden shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full self-start"
          style={{ background: cfg.color + '22', color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Amount */}
      <span className="text-sm font-medium" style={{ color: colors.accent }}>
        {fmt(order.totalAmount)}
      </span>

      {/* Status badge — desktop only */}
      <span
        className="hidden sm:inline text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
        style={{ background: cfg.color + '22', color: cfg.color }}
      >
        {cfg.label}
      </span>

      {/* Action buttons */}
      <div className="flex gap-2 items-center">
        {next && (
          <button
            onClick={() => onAction(order, next.status)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {isLoading ? '...' : next.label}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(order)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: dangerTint(0.12), color: colors.danger, border: `1px solid ${dangerTint(0.25)}` }}
          >
            Отмена
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${colors.divider}` }}>
      <div className="h-3.5 w-32 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
      <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [cancelTarget, setCancelTarget] = useState<OrderListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [accOrders, setAccOrders] = useState<OrderListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);

  const { data, isLoading, isError, isFetching } = useSellerOrders({
    ...(activeFilter !== 'ALL' ? { status: activeFilter } : {}),
    page,
    limit: PAGE_LIMIT,
  });
  const updateStatus = useUpdateOrderStatus();

  // Accumulate pages; reset on filter change
  useEffect(() => {
    if (!data?.data) return;
    setAccOrders((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data]);

  const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
  const searchFiltered = q
    ? accOrders.filter((o) => {
        const a = getAddr(o);
        return shortId(o.id).toLowerCase().includes(q) ||
          (a.city?.toLowerCase() ?? '').includes(q) ||
          (a.street?.toLowerCase() ?? '').includes(q) ||
          (o.preview?.title?.toLowerCase() ?? '').includes(q);
      })
    : accOrders;
  const orders = hideCompleted && activeFilter === 'ALL'
    ? searchFiltered.filter((o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED)
    : searchFiltered;
  const hasMore = data ? page * PAGE_LIMIT < data.meta.total : false;
  const isLoadingMore = isFetching && page > 1;

  function handleFilterChange(key: OrderStatus | 'ALL') {
    setActiveFilter(key);
    setPage(1);
    setAccOrders([]);
    setSearchQuery('');
  }

  async function handleAction(order: OrderListItem, toStatus: OrderStatus) {
    setPendingId(order.id);
    try {
      await updateStatus.mutateAsync({ id: order.id, status: toStatus });
      track.orderStatusChanged(order.id, order.status, toStatus);
    } finally {
      setPendingId(null);
    }
  }

  async function handleCancelConfirm(reason: string) {
    if (!cancelTarget) return;
    setPendingId(cancelTarget.id);
    try {
      await updateStatus.mutateAsync({ id: cancelTarget.id, status: OrderStatus.CANCELLED, reason });
      track.orderStatusChanged(cancelTarget.id, cancelTarget.status, OrderStatus.CANCELLED);
      setCancelTarget(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Заказы</h1>
        <p className="text-sm mt-0.5" style={{ color: colors.textDim }}>
          {isLoading
            ? 'Загрузка...'
            : q
              ? `Найдено: ${orders.length} из ${accOrders.length} загруженных`
              : `${data?.meta.total ?? 0} заказов`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={
                active
                  ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                  : { background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }
              }
            >
              {tab.label}
            </button>
          );
        })}
        {activeFilter === 'ALL' && (
          <button
            onClick={() => setHideCompleted((v) => !v)}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ml-auto"
            title="Скрыть заказы в статусах Доставлен и Отменён"
            style={
              hideCompleted
                ? { background: 'rgba(52,211,153,0.18)', color: colors.success, border: '1px solid rgba(52,211,153,0.30)' }
                : { background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }
            }
          >
            {hideCompleted ? '✓ ' : ''}Скрыть завершённые
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по № заказа, городу, адресу, товару"
          className="w-full h-10 pl-10 pr-10 rounded-md text-sm focus:outline-none focus:ring-2"
          style={{
            ...inputStyle,
            '--tw-ring-color': colors.accentBorder,
          } as React.CSSProperties}
        />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: colors.textDim }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.8-5.7a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-opacity hover:opacity-70"
            style={{ color: colors.textMuted }}
            aria-label="Очистить"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg overflow-hidden" style={card}>
        {/* Header row — desktop */}
        <div
          className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: colors.textDim, background: colors.surfaceMuted, borderBottom: `1px solid ${colors.divider}` }}
        >
          <span>#</span>
          <span>Заказ</span>
          <span>Сумма</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>

        {isLoading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {isError && (
          <div className="px-5 py-8 text-center text-sm" style={{ color: colors.danger }}>
            Не удалось загрузить заказы. Попробуйте обновить страницу.
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: colors.textDim }}>
              {q
                ? `Ничего не найдено по запросу «${searchQuery}». Попробуйте загрузить больше заказов.`
                : activeFilter === 'ALL'
                  ? 'Заказов пока нет'
                  : `Нет заказов со статусом "${STATUS_CONFIG[activeFilter]?.label}"`}
            </p>
          </div>
        )}

        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            onAction={(o, s) => handleAction(o, s)}
            onCancel={setCancelTarget}
            pendingId={pendingId}
          />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoadingMore}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
        >
          {isLoadingMore ? 'Загрузка...' : 'Загрузить ещё'}
        </button>
      )}

      {/* Cancel modal */}
      {cancelTarget && (
        <CancelModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelConfirm}
          loading={pendingId === cancelTarget.id}
        />
      )}
    </div>
  );
}
