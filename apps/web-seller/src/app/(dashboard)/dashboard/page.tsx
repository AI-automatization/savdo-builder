'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '../../../hooks/use-seller';
import { useSellerOrders } from '../../../hooks/use-orders';
import { useSellerSummary } from '../../../hooks/use-analytics';
import { OrderStatus, StoreStatus } from 'types';
import { track } from '../../../lib/analytics';

// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.13)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.08)",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.PENDING]:    "rgba(251,191,36,.80)",
  [OrderStatus.CONFIRMED]:  "rgba(96,165,250,.80)",
  [OrderStatus.PROCESSING]: "rgba(167,139,250,.90)",
  [OrderStatus.SHIPPED]:    "rgba(167,139,250,.90)",
  [OrderStatus.DELIVERED]:  "rgba(52,211,153,.80)",
  [OrderStatus.CANCELLED]:  "rgba(239,68,68,.80)",
};

const STATUS_LABELS: Record<string, string> = {
  [OrderStatus.PENDING]:    "Ожидает",
  [OrderStatus.CONFIRMED]:  "Подтверждён",
  [OrderStatus.PROCESSING]: "В обработке",
  [OrderStatus.SHIPPED]:    "В пути",
  [OrderStatus.DELIVERED]:  "Доставлен",
  [OrderStatus.CANCELLED]:  "Отменён",
};

const STORE_STATUS_LABELS: Record<string, string> = {
  [StoreStatus.DRAFT]:          "Черновик",
  [StoreStatus.PENDING_REVIEW]: "На проверке",
  [StoreStatus.APPROVED]:       "Активен",
  [StoreStatus.REJECTED]:       "Отклонён",
  [StoreStatus.SUSPENDED]:      "Приостановлен",
  [StoreStatus.ARCHIVED]:       "Архивирован",
};

function fmt(n: number) {
  return n.toLocaleString('ru-RU') + ' сум';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: "rgba(255,255,255,0.10)" }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: store, isLoading: storeLoading } = useStore();
  const { data: ordersData, isLoading: ordersLoading } = useSellerOrders({ limit: 5 });
  const { data: summary, isLoading: summaryLoading } = useSellerSummary();
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    if (!store) return;
    const url = `https://savdo.uz/${store.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      track.storeLinkCopied(store.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const orders = ordersData?.data ?? [];
  const pendingCount = orders.filter(o => o.status === OrderStatus.PENDING).length;

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-white">Добро пожаловать 👋</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
          {storeLoading ? (
            <Skeleton className="h-4 w-40 inline-block" />
          ) : store ? (
            <>Магазин: <span style={{ color: "#A78BFA" }}>{store.name}</span>
            {' '}<span className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              · {STORE_STATUS_LABELS[store.status] ?? store.status}
            </span></>
          ) : (
            <span style={{ color: "#f87171" }}>Магазин не найден</span>
          )}
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Orders today (pending) */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">📦</span>
            {ordersLoading ? (
              <Skeleton className="h-5 w-8" />
            ) : pendingCount > 0 ? (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(251,191,36,.15)", color: "#fbbf24" }}
              >
                +{pendingCount}
              </span>
            ) : null}
          </div>
          {ordersLoading ? (
            <Skeleton className="h-6 w-12 mb-1" />
          ) : (
            <p className="text-lg font-bold text-white leading-none">{ordersData?.meta.total ?? 0}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>Всего заказов</p>
        </div>

        {/* Views */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">👁</span>
          </div>
          {summaryLoading ? (
            <Skeleton className="h-6 w-16 mb-1" />
          ) : (
            <p className="text-lg font-bold text-white leading-none">
              {(summary?.views ?? 0).toLocaleString('ru-RU')}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>Просмотров за 30 дней</p>
        </div>

        {/* Store slug — copy link */}
        <div
          className="rounded-2xl p-4 cursor-pointer transition-opacity hover:opacity-80 active:scale-[0.98]"
          style={glass}
          onClick={handleCopyLink}
        >
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">🔗</span>
            {copied && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,.15)", color: "#34d399" }}>
                Скопировано
              </span>
            )}
          </div>
          {storeLoading ? (
            <Skeleton className="h-6 w-20 mb-1" />
          ) : store ? (
            <p className="text-sm font-bold text-white leading-none truncate">/{store.slug}</p>
          ) : (
            <p className="text-sm font-bold leading-none" style={{ color: "rgba(255,255,255,0.30)" }}>—</p>
          )}
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>Нажми чтобы скопировать</p>
        </div>

        {/* Pending orders */}
        <div className="rounded-2xl p-4" style={glass}>
          <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">⏳</span>
          </div>
          {ordersLoading ? (
            <Skeleton className="h-6 w-8 mb-1" />
          ) : (
            <p className="text-lg font-bold text-white leading-none">{pendingCount}</p>
          )}
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.38)" }}>Ожидают обработки</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-sm font-semibold text-white">Последние заказы</p>
          <Link href="/orders" className="text-xs font-medium" style={{ color: "#A78BFA" }}>Все заказы →</Link>
        </div>

        {ordersLoading ? (
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>
            Заказов пока нет
          </div>
        ) : (
          <div>
            {orders.map((o) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3 transition-opacity hover:opacity-75" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xs font-mono shrink-0" style={{ color: "rgba(255,255,255,0.30)" }}>
                  #{o.id.slice(-4).toUpperCase()}
                </span>
                <span className="flex-1 text-sm text-white truncate">
                  {o.deliveryAddress.city}
                </span>
                <span className="text-sm font-medium shrink-0" style={{ color: "#A78BFA" }}>
                  {fmt(o.totalAmount)}
                </span>
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: (STATUS_COLORS[o.status] ?? "rgba(255,255,255,.15)") + "22",
                    color: STATUS_COLORS[o.status] ?? "rgba(255,255,255,.60)",
                  }}
                >
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "Добавить товар",    href: "/products/create", icon: "➕" },
          { label: "Обработать заказы", href: "/orders",          icon: "📋" },
          { label: "Аналитика",         href: "/analytics",       icon: "📊" },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white transition-all hover:opacity-80"
            style={glassDim}
          >
            <span className="text-xl">{a.icon}</span>
            {a.label}
          </Link>
        ))}
      </div>

    </div>
  );
}
