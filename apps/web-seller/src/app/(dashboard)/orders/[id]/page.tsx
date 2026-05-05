'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from 'types';
import { useSellerOrder, useUpdateOrderStatus } from '@/hooks/use-orders';
import { track } from '@/lib/analytics';
import { card, cardMuted, colors, inputStyle } from '@/lib/styles';

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: 'Ожидает',     color: colors.warning },
  [OrderStatus.CONFIRMED]:  { label: 'Подтверждён', color: '#60A5FA' },
  [OrderStatus.PROCESSING]: { label: 'Обработка',   color: colors.accent },
  [OrderStatus.SHIPPED]:    { label: 'В пути',       color: '#818CF8' },
  [OrderStatus.DELIVERED]:  { label: 'Доставлен',   color: colors.success },
  [OrderStatus.CANCELLED]:  { label: 'Отменён',     color: colors.danger },
};

const NEXT_TRANSITION: Record<string, { status: OrderStatus; label: string }> = {
  [OrderStatus.PENDING]:    { status: OrderStatus.CONFIRMED,  label: 'Подтвердить заказ' },
  [OrderStatus.CONFIRMED]:  { status: OrderStatus.PROCESSING, label: 'Взять в обработку' },
  [OrderStatus.PROCESSING]: { status: OrderStatus.SHIPPED,    label: 'Отправить' },
  [OrderStatus.SHIPPED]:    { status: OrderStatus.DELIVERED,  label: 'Отметить доставленным' },
};

const CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID:   'Ожидает оплаты',
  PAID:     'Оплачен',
  REFUNDED: 'Возврат',
};

function toNum(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === 'object') { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
}

function fmt(n: unknown) {
  return toNum(n).toLocaleString('ru-RU') + ' сум';
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-6).toUpperCase() : id;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: colors.surfaceElevated }}
    />
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────

function CancelModal({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
    >
      <div className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4 shadow-2xl" style={card}>
        <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>Отменить заказ</h2>
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
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
          >
            Назад
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: 'rgba(248,113,113,0.22)', color: colors.danger, border: `1px solid rgba(248,113,113,0.35)` }}
          >
            {loading ? 'Отмена...' : 'Отменить заказ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const { data: order, isLoading, isError } = useSellerOrder(id);
  const updateStatus = useUpdateOrderStatus();

  const [showCancel, setShowCancel] = useState(false);
  const [pending, setPending]       = useState(false);

  async function handleForward(toStatus: OrderStatus) {
    if (!order) return;
    setPending(true);
    try {
      await updateStatus.mutateAsync({ id, status: toStatus });
      track.orderStatusChanged(id, order.status, toStatus);
    } finally {
      setPending(false);
    }
  }

  async function handleCancel(reason: string) {
    if (!order) return;
    setPending(true);
    try {
      await updateStatus.mutateAsync({ id, status: OrderStatus.CANCELLED, reason });
      track.orderStatusChanged(id, order.status, OrderStatus.CANCELLED);
      setShowCancel(false);
    } finally {
      setPending(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="max-w-2xl flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Skel className="w-8 h-8" />
          <div className="flex flex-col gap-2 flex-1">
            <Skel className="h-5 w-48" />
            <Skel className="h-3 w-28" />
          </div>
        </div>
        <Skel className="h-32 rounded-2xl" />
        <Skel className="h-48 rounded-2xl" />
        <Skel className="h-24 rounded-2xl" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  if (isError || !order) {
    return (
      <div className="max-w-2xl">
        <div className="rounded-lg px-6 py-10 text-center" style={card}>
          <p className="text-sm" style={{ color: colors.danger }}>Заказ не найден.</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 text-sm underline"
            style={{ color: colors.accent }}
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const cfg  = STATUS_CONFIG[order.status] ?? { label: String(order.status ?? '—'), color: colors.textMuted };
  const next = NEXT_TRANSITION[order.status];
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: colors.textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Заказ #{shortId(order.id)}</h1>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: cfg.color + '22', color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleString('ru-RU', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Action panel */}
      {(next || canCancel) && order.status !== OrderStatus.CANCELLED && (
        <div className="rounded-lg px-5 py-4 flex items-center gap-3 flex-wrap" style={card}>
          <p className="text-sm font-medium flex-1 min-w-0" style={{ color: colors.textPrimary }}>Следующий шаг</p>
          {next && (
            <button
              onClick={() => handleForward(next.status)}
              disabled={pending}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
            >
              {pending ? '...' : next.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              disabled={pending}
              className="px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: 'rgba(248,113,113,0.12)', color: colors.danger, border: '1px solid rgba(248,113,113,0.25)' }}
            >
              Отменить
            </button>
          )}
        </div>
      )}

      {/* Items */}
      <div className="rounded-lg overflow-hidden" style={card}>
        <div
          className="px-5 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: colors.textDim, background: colors.surfaceMuted, borderBottom: `1px solid ${colors.divider}` }}
        >
          Товары ({order.items?.length ?? 0})
        </div>
        {(order.items ?? []).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5"
            style={{ borderBottom: `1px solid ${colors.divider}` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>{item.title}</p>
              {item.variantTitle && (
                <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                  {item.variantTitle}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium" style={{ color: colors.accent }}>{fmt(item.subtotal)}</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                {item.quantity} × {fmt(item.unitPrice)}
              </p>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="px-5 py-4 flex flex-col gap-2" style={{ background: colors.surfaceMuted }}>
          <div className="flex items-center justify-between text-sm" style={{ color: colors.textMuted }}>
            <span>Доставка</span>
            <span>{toNum(order.deliveryFee) > 0 ? fmt(order.deliveryFee) : 'Бесплатно'}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold" style={{ color: colors.textPrimary }}>
            <span>Итого</span>
            <span style={{ color: colors.accent }}>{fmt(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery & payment */}
      <div className="rounded-lg px-5 py-5 flex flex-col gap-4" style={card}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Доставка и оплата
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>Адрес</p>
            <p className="text-sm" style={{ color: colors.textPrimary }}>
              {order.deliveryAddress?.city ?? '—'}, {order.deliveryAddress?.street ?? '—'}
            </p>
            {order.deliveryAddress?.region && (
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                {order.deliveryAddress.region}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>Оплата</p>
            <p className="text-sm" style={{ color: colors.textPrimary }}>{order.paymentMethod ?? 'Не указан'}</p>
            <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
              {order.paymentStatus ? (PAYMENT_STATUS_LABELS[order.paymentStatus] ?? '—') : '—'}
            </p>
          </div>
        </div>

        {order.buyer?.phone && (
          <div>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>Номер аккаунта</p>
            <a
              href={`tel:${order.buyer.phone}`}
              className="text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: colors.accent }}
            >
              {order.buyer.phone}
            </a>
          </div>
        )}

        {order.customerPhone && order.customerPhone !== order.buyer?.phone && (
          <div>
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>Резервный номер</p>
            <a
              href={`tel:${order.customerPhone}`}
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: colors.textMuted }}
            >
              {order.customerPhone}
            </a>
          </div>
        )}

        {order.buyerNote && (
          <div
            className="rounded-md px-3.5 py-2.5"
            style={cardMuted}
          >
            <p className="text-xs mb-1" style={{ color: colors.textDim }}>Комментарий покупателя</p>
            <p className="text-sm" style={{ color: colors.textPrimary }}>{order.buyerNote}</p>
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <CancelModal
          onClose={() => setShowCancel(false)}
          onConfirm={handleCancel}
          loading={pending}
        />
      )}
    </div>
  );
}
