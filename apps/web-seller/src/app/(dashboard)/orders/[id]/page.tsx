'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OrderStatus } from 'types';
import { useSellerOrder, useUpdateOrderStatus } from '@/hooks/use-orders';
import { track } from '@/lib/analytics';

// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           'rgba(255,255,255,0.08)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               '1px solid rgba(255,255,255,0.13)',
} as const;

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: 'Ожидает',     color: 'rgba(251,191,36,.85)' },
  [OrderStatus.CONFIRMED]:  { label: 'Подтверждён', color: 'rgba(96,165,250,.85)' },
  [OrderStatus.PROCESSING]: { label: 'Обработка',   color: 'rgba(167,139,250,.90)' },
  [OrderStatus.SHIPPED]:    { label: 'В пути',       color: 'rgba(129,140,248,.85)' },
  [OrderStatus.DELIVERED]:  { label: 'Доставлен',   color: 'rgba(52,211,153,.85)' },
  [OrderStatus.CANCELLED]:  { label: 'Отменён',     color: 'rgba(248,113,113,.85)' },
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

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' сум';
}

function shortId(id: string) {
  return id.length > 8 ? id.slice(-6).toUpperCase() : id;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: 'rgba(255,255,255,0.10)' }}
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
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4" style={glass}>
        <h2 className="text-lg font-bold text-white">Отменить заказ</h2>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Причина отмены <span style={{ color: 'rgba(248,113,113,.85)' }}>*</span>
          </label>
          <textarea
            className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white resize-none focus:outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.13)',
              minHeight: 80,
            }}
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
        <div className="rounded-2xl px-6 py-10 text-center" style={glass}>
          <p className="text-sm" style={{ color: '#f87171' }}>Заказ не найден.</p>
          <button
            onClick={() => router.push('/orders')}
            className="mt-4 text-sm underline"
            style={{ color: '#A78BFA' }}
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const cfg  = STATUS_CONFIG[order.status];
  const next = NEXT_TRANSITION[order.status];
  const canCancel = CANCELLABLE.includes(order.status);

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.10)' }}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-white">Заказ #{shortId(order.id)}</h1>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: cfg.color + '22', color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {new Date(order.createdAt).toLocaleString('ru-RU', {
              day: '2-digit', month: 'long', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Action panel */}
      {(next || canCancel) && order.status !== OrderStatus.CANCELLED && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-3 flex-wrap" style={glass}>
          <p className="text-sm font-medium text-white flex-1 min-w-0">Следующий шаг</p>
          {next && (
            <button
              onClick={() => handleForward(next.status)}
              disabled={pending}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 16px rgba(167,139,250,.30)' }}
            >
              {pending ? '...' : next.label}
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancel(true)}
              disabled={pending}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'rgba(248,113,113,0.12)', color: 'rgba(248,113,113,.90)', border: '1px solid rgba(248,113,113,.20)' }}
            >
              Отменить
            </button>
          )}
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div
          className="px-5 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'rgba(255,255,255,0.28)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          Товары ({order.items.length})
        </div>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{item.title}</p>
              {item.variantTitle && (
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  {item.variantTitle}
                </p>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-medium" style={{ color: '#A78BFA' }}>{fmt(item.subtotal)}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {item.quantity} × {fmt(item.unitPrice)}
              </p>
            </div>
          </div>
        ))}

        {/* Totals */}
        <div className="px-5 py-4 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm" style={{ color: 'rgba(255,255,255,0.50)' }}>
            <span>Доставка</span>
            <span>{order.deliveryFee > 0 ? fmt(order.deliveryFee) : 'Бесплатно'}</span>
          </div>
          <div className="flex items-center justify-between text-base font-bold text-white">
            <span>Итого</span>
            <span style={{ color: '#A78BFA' }}>{fmt(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Delivery & payment */}
      <div className="rounded-2xl px-5 py-5 flex flex-col gap-4" style={glass}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.28)' }}>
          Доставка и оплата
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Адрес</p>
            <p className="text-sm text-white">
              {order.deliveryAddress?.city ?? '—'}, {order.deliveryAddress?.street ?? '—'}
            </p>
            {order.deliveryAddress?.region && (
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {order.deliveryAddress.region}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Оплата</p>
            <p className="text-sm text-white">{order.paymentMethod ?? 'Не указан'}</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </p>
          </div>
        </div>

        {order.buyer?.phone && (
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Номер аккаунта</p>
            <a
              href={`tel:${order.buyer.phone}`}
              className="text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ color: '#A78BFA' }}
            >
              {order.buyer.phone}
            </a>
          </div>
        )}

        {order.customerPhone && order.customerPhone !== order.buyer?.phone && (
          <div>
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Резервный номер</p>
            <a
              href={`tel:${order.customerPhone}`}
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'rgba(255,255,255,0.65)' }}
            >
              {order.customerPhone}
            </a>
          </div>
        )}

        {order.buyerNote && (
          <div
            className="rounded-xl px-3.5 py-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.40)' }}>Комментарий покупателя</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.80)' }}>{order.buyerNote}</p>
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
