'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OrderStatus } from 'types';
import type { OrderListItem } from 'types';
import { useSellerOrders, useUpdateOrderStatus } from '@/hooks/use-orders';
import { track } from '@/lib/analytics';

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.13)',
} as const;

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: 'Ожидает',      color: 'rgba(251,191,36,.85)' },
  [OrderStatus.CONFIRMED]:  { label: 'Подтверждён',  color: 'rgba(96,165,250,.85)' },
  [OrderStatus.PROCESSING]: { label: 'Обработка',    color: 'rgba(167,139,250,.90)' },
  [OrderStatus.SHIPPED]:    { label: 'В пути',        color: 'rgba(129,140,248,.85)' },
  [OrderStatus.DELIVERED]:  { label: 'Доставлен',    color: 'rgba(52,211,153,.85)' },
  [OrderStatus.CANCELLED]:  { label: 'Отменён',      color: 'rgba(248,113,113,.85)' },
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

function fmt(amount: number) {
  return amount.toLocaleString('ru-RU') + ' сум';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={glass}>
        <h2 className="text-lg font-bold text-white">Отменить заказ #{shortId(order.id)}</h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>
          {order.deliveryAddress.city}, {order.deliveryAddress.street}
        </p>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Причина отмены <span style={{ color: 'rgba(248,113,113,.85)' }}>*</span>
          </label>
          <textarea
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.13)',
              minHeight: 80,
              '--tw-ring-color': 'rgba(167,139,250,0.50)',
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
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.65)' }}
          >
            Назад
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40"
            style={{ background: 'rgba(248,113,113,0.22)', color: 'rgba(248,113,113,.95)' }}
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
      className="flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:items-center sm:gap-x-4"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* ID */}
      <Link href={`/orders/${order.id}`} className="hidden sm:block text-xs font-mono transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.30)' }}>
        #{shortId(order.id)}
      </Link>

      {/* Buyer info (address) */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/orders/${order.id}`} className="hover:opacity-80 transition-opacity">
          <p className="text-sm font-medium text-white">
            {order.deliveryAddress.city}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            {order.deliveryAddress.street} · #{shortId(order.id)}
          </p>
        </Link>
        {/* Status badge — mobile only */}
        <span
          className="sm:hidden shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
          style={{ background: cfg.color + '22', color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Amount */}
      <span className="text-sm font-medium" style={{ color: '#A78BFA' }}>
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
            className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: 'rgba(167,139,250,0.18)', color: 'rgba(167,139,250,.95)' }}
          >
            {isLoading ? '...' : next.label}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => onCancel(order)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: 'rgba(248,113,113,0.12)', color: 'rgba(248,113,113,.80)' }}
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
    <div className="flex flex-col gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-3.5 w-32 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.10)' }} />
      <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [cancelTarget, setCancelTarget] = useState<OrderListItem | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const { data, isLoading, isError } = useSellerOrders(
    activeFilter !== 'ALL' ? { status: activeFilter } : undefined,
  );
  const updateStatus = useUpdateOrderStatus();

  const orders = data?.data ?? [];

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
        <h1 className="text-xl font-bold text-white">Заказы</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {isLoading ? 'Загрузка...' : `${data?.meta.total ?? 0} заказов`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? { background: 'rgba(167,139,250,0.25)', color: 'rgba(167,139,250,1)', border: '1px solid rgba(167,139,250,0.35)' }
                  : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.10)' }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        {/* Header row — desktop */}
        <div
          className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.28)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span>#</span>
          <span>Адрес доставки</span>
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
          <div className="px-5 py-8 text-center text-sm" style={{ color: 'rgba(248,113,113,.80)' }}>
            Не удалось загрузить заказы. Попробуйте обновить страницу.
          </div>
        )}

        {!isLoading && !isError && orders.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {activeFilter === 'ALL' ? 'Заказов пока нет' : `Нет заказов со статусом "${STATUS_CONFIG[activeFilter]?.label}"`}
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
