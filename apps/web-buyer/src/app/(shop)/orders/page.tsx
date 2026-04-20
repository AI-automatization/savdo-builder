"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { OrderStatus } from "types";
import type { OrderListItem } from "types";
import { useAuth } from "@/lib/auth/context";
import { useOrders } from "@/hooks/use-orders";
import { useBuyerSocket } from "@/hooks/use-buyer-socket";
import { X, Search, Package } from "lucide-react";

// ── Glass tokens ───────────────────────────────────────────────────────────

const glass = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDim = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.09)",
} as const;

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "#fff",
  outline: "none",
} as const;

// ── Icons ──────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: "Ожидает",     color: "rgba(251,191,36,.85)" },
  [OrderStatus.CONFIRMED]:  { label: "Подтверждён", color: "rgba(96,165,250,.85)" },
  [OrderStatus.PROCESSING]: { label: "Обработка",   color: "rgba(167,139,250,.90)" },
  [OrderStatus.SHIPPED]:    { label: "В пути",      color: "rgba(129,140,248,.85)" },
  [OrderStatus.DELIVERED]:  { label: "Доставлен",   color: "rgba(52,211,153,.85)" },
  [OrderStatus.CANCELLED]:  { label: "Отменён",     color: "rgba(248,113,113,.85)" },
};

const FILTER_TABS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL",                    label: "Все" },
  { key: OrderStatus.PENDING,      label: "Ожидают" },
  { key: OrderStatus.CONFIRMED,    label: "Подтвержд." },
  { key: OrderStatus.SHIPPED,      label: "В пути" },
  { key: OrderStatus.DELIVERED,    label: "Доставлены" },
];

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const fmt = (n: unknown) => toNum(n).toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();


// ── Icons (used in OrderCard) ─────────────────────────────────────────────

// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderListItem }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "rgba(255,255,255,.5)" };
  // Fallback to flat Prisma fields (city/addressLine1) until buyer endpoint returns Order shape.
  const raw = order as unknown as { city?: string | null; addressLine1?: string | null };
  const addrCity = order.deliveryAddress?.city ?? raw.city ?? null;
  const addrStreet = order.deliveryAddress?.street ?? raw.addressLine1 ?? null;
  const hasAddress = !!(addrCity || addrStreet);
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-80 transition-opacity"
      style={glass}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">#{shortId(order.id)}</span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
            style={{ background: cfg.color + "22", color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.40)" }}>
          {hasAddress ? `${addrCity ?? '—'}, ${addrStreet ?? '—'}` : 'Самовывоз'}
        </p>
        <p className="text-sm font-medium mt-1.5" style={{ color: "#A78BFA" }}>
          {fmt(order.totalAmount)} сум
        </p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="px-4 py-3.5 rounded-2xl flex flex-col gap-2" style={glass}>
      <div className="flex justify-between">
        <div className="h-3.5 w-20 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.12)" }} />
        <div className="h-3.5 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
      <div className="h-3 w-36 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-3.5 w-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
    </div>
  );
}

// ── Orders List ────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

function OrdersList() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [accOrders, setAccOrders] = useState<OrderListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, isError, isFetching } = useOrders({
    ...(activeFilter !== "ALL" ? { status: activeFilter } : {}),
    page,
    limit: PAGE_LIMIT,
  });

  // Accumulate pages; reset on filter change
  useEffect(() => {
    if (!data?.data) return;
    setAccOrders((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.data]);

  const q = searchQuery.trim().toLowerCase().replace(/^#/, "");
  const orders = q
    ? accOrders.filter((o) =>
        shortId(o.id).toLowerCase().includes(q) ||
        (o.deliveryAddress?.city?.toLowerCase().includes(q) ?? false) ||
        (o.deliveryAddress?.street?.toLowerCase().includes(q) ?? false),
      )
    : accOrders;
  const hasMore = data ? page * PAGE_LIMIT < data.meta.total : false;
  const isLoadingMore = isFetching && page > 1;

  function handleFilterChange(key: OrderStatus | "ALL") {
    setActiveFilter(key);
    setPage(1);
    setAccOrders([]);
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? { background: "rgba(167,139,250,0.25)", color: "rgba(167,139,250,1)", border: "1px solid rgba(167,139,250,0.35)" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.10)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search — only show if user has enough orders */}
      {accOrders.length > 3 && (
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по № заказа или адресу"
            className="w-full h-10 pl-10 pr-10 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2"
            style={{ ...inputStyle, ["--tw-ring-color" as string]: "rgba(167,139,250,0.50)" } as React.CSSProperties}
          />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(255,255,255,0.30)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3m1.8-5.7a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.40)" }} aria-label="Очистить">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {isError && (
        <p className="text-sm text-center py-8" style={{ color: "rgba(248,113,113,.80)" }}>
          Не удалось загрузить заказы. Обновите страницу.
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-3 mx-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{q ? <Search size={32} /> : <Package size={32} />}</div>
          <p className="text-sm font-medium text-white/60">
            {q
              ? `Ничего не найдено по запросу «${searchQuery}»`
              : activeFilter === "ALL"
                ? "У вас пока нет заказов"
                : `Нет заказов со статусом "${STATUS_CONFIG[activeFilter]?.label}"`}
          </p>
          {!q && activeFilter === "ALL" && (
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.30)" }}
            >
              Перейти к магазинам
            </Link>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={isLoadingMore}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.10)" }}
        >
          {isLoadingMore ? "Загрузка..." : "Загрузить ещё"}
        </button>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  useBuyerSocket();

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-6 pb-28" style={{ zIndex: 1 }}>
        <h1 className="text-xl font-bold text-white mb-5">Мои заказы</h1>
        {isAuthenticated ? <OrdersList /> : (
          <OtpGate
            icon={<IcoOrders />}
            title="Войдите чтобы видеть заказы"
          />
        )}
      </div>

      {/* Bottom nav */}
      <BottomNavBar active="orders" />
    </div>
  );
}
