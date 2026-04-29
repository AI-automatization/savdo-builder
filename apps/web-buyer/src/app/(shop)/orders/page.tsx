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
import { X, Search, Package, ChevronRight } from "lucide-react";
import { colors } from "@/lib/styles";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [OrderStatus.PENDING]: { label: "Ожидает", color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  [OrderStatus.CONFIRMED]: { label: "Подтверждён", color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  [OrderStatus.PROCESSING]: { label: "Обработка", color: colors.accent, bg: colors.accentMuted },
  [OrderStatus.SHIPPED]: { label: "В пути", color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  [OrderStatus.DELIVERED]: { label: "Доставлен", color: colors.success, bg: "rgba(22,163,74,0.10)" },
  [OrderStatus.CANCELLED]: { label: "Отменён", color: colors.danger, bg: "rgba(220,38,38,0.10)" },
};

const FILTER_TABS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL", label: "Все" },
  { key: OrderStatus.PENDING, label: "Ожидают" },
  { key: OrderStatus.CONFIRMED, label: "Подтвержд." },
  { key: OrderStatus.SHIPPED, label: "В пути" },
  { key: OrderStatus.DELIVERED, label: "Доставлены" },
];

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const fmt = (n: unknown) => toNum(n).toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

function OrderCard({ order }: { order: OrderListItem }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: colors.textMuted, bg: colors.surfaceMuted };
  const raw = order as unknown as { city?: string | null; addressLine1?: string | null };
  const addrCity = order.deliveryAddress?.city ?? raw.city ?? null;
  const addrStreet = order.deliveryAddress?.street ?? raw.addressLine1 ?? null;
  const hasAddress = !!(addrCity || addrStreet);
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-80 transition-all hover:-translate-y-0.5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>#{shortId(order.id)}</span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-xs mt-1 truncate" style={{ color: colors.textMuted }}>
          {hasAddress ? `${addrCity ?? '—'}, ${addrStreet ?? '—'}` : 'Самовывоз'}
        </p>
        <p className="text-sm font-semibold mt-1.5" style={{ color: colors.accent }}>
          {fmt(order.totalAmount)} сум
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0" style={{ color: colors.textDim }} />
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="px-4 py-3.5 rounded-2xl flex flex-col gap-2" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex justify-between">
        <div className="h-3.5 w-20 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
        <div className="h-3.5 w-16 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      </div>
      <div className="h-3 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="h-3.5 w-24 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
    </div>
  );
}

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
                  ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                  : { background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {accOrders.length > 3 && (
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по № заказа или адресу"
            className="w-full h-10 pl-10 pr-10 rounded-xl text-sm outline-none focus:ring-2"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              ['--tw-ring-color' as string]: colors.accentBorder,
            }}
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: colors.textDim }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors hover:bg-black/5" aria-label="Очистить">
              <X size={14} style={{ color: colors.textMuted }} />
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
        <p className="text-sm text-center py-8" style={{ color: colors.danger }}>
          Не удалось загрузить заказы. Обновите страницу.
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-12">
          <div className="mb-3 mx-auto" style={{ color: colors.textDim }}>{q ? <Search size={32} /> : <Package size={32} />}</div>
          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
            {q
              ? `Ничего не найдено по запросу «${searchQuery}»`
              : activeFilter === "ALL"
                ? "У вас пока нет заказов"
                : `Нет заказов со статусом "${STATUS_CONFIG[activeFilter]?.label}"`}
          </p>
          {!q && activeFilter === "ALL" && (
            <Link
              href="/"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
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
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-50 hover:opacity-80"
          style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
        >
          {isLoadingMore ? "Загрузка..." : "Загрузить ещё"}
        </button>
      )}
    </div>
  );
}

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  useBuyerSocket();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: colors.textPrimary }}>Мои заказы</h1>
        {isAuthenticated ? <OrdersList /> : (
          <OtpGate
            icon={<Package size={22} />}
            title="Войдите чтобы видеть заказы"
          />
        )}
      </div>

      <BottomNavBar active="orders" />
    </div>
  );
}
