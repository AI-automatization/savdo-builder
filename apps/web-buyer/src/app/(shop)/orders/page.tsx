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
import { colors } from "@/lib/styles";

// ── Status config ─────────────────────────────────────────────────────────────

type StatusTone = "success" | "brand" | "warning" | "danger" | "muted";

const STATUS_CONFIG: Record<string, { label: string; tone: StatusTone }> = {
  [OrderStatus.PENDING]:    { label: "Ожидает",      tone: "warning" },
  [OrderStatus.CONFIRMED]:  { label: "Подтверждён",  tone: "brand"   },
  [OrderStatus.PROCESSING]: { label: "Обработка",    tone: "brand"   },
  [OrderStatus.SHIPPED]:    { label: "В пути",        tone: "brand"   },
  [OrderStatus.DELIVERED]:  { label: "Доставлен",    tone: "success" },
  [OrderStatus.CANCELLED]:  { label: "Отменён",      tone: "muted"   },
};

const TONE_COLORS: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: "rgba(74,107,69,0.12)",  fg: colors.success },
  brand:   { bg: colors.brandMuted,       fg: colors.brand   },
  warning: { bg: "rgba(156,122,46,0.12)", fg: colors.warning },
  danger:  { bg: "rgba(139,58,58,0.12)",  fg: colors.danger  },
  muted:   { bg: colors.surfaceSunken,    fg: colors.textMuted },
};

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTER_TABS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL",                   label: "Все"         },
  { key: OrderStatus.PENDING,     label: "Ожидают"     },
  { key: OrderStatus.CONFIRMED,   label: "Подтвержд."  },
  { key: OrderStatus.SHIPPED,     label: "В пути"      },
  { key: OrderStatus.DELIVERED,   label: "Доставлены"  },
  { key: OrderStatus.CANCELLED,   label: "Отменённые"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const formatPrice = (n: unknown) => toNum(n).toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

// ── StatusPill ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, tone: "muted" as StatusTone };
  const c = TONE_COLORS[cfg.tone] ?? TONE_COLORS.muted;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {cfg.label}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="p-4 rounded-md flex flex-col gap-2" style={{ background: colors.surface }}>
      <div className="flex justify-between">
        <div className="h-3.5 w-24 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
        <div className="h-3.5 w-16 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      </div>
      <div className="h-3 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="h-3.5 w-20 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
    </div>
  );
}

// ── PAGE_LIMIT ────────────────────────────────────────────────────────────────

const PAGE_LIMIT = 20;

// ── OrdersList ────────────────────────────────────────────────────────────────

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
        (o.deliveryAddress?.street?.toLowerCase().includes(q) ?? false)
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
    <div className="flex flex-col">
      {/* Filter tabs */}
      <div className="px-4 py-2.5 flex gap-1.5 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className="flex-shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded transition"
              style={
                active
                  ? { background: colors.textStrong, color: colors.brandTextOnBg }
                  : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search (shown when enough orders) */}
      {accOrders.length > 3 && (
        <div className="px-4 pb-2 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по № заказа или адресу"
            className="w-full h-10 pl-10 pr-10 rounded-xl text-sm outline-none"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.textStrong,
            }}
          />
          <Search size={16} className="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: colors.textDim }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
              aria-label="Очистить"
            >
              <X size={14} style={{ color: colors.textMuted }} />
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="px-4 space-y-2 pb-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-sm text-center py-8 px-4" style={{ color: colors.danger }}>
          Не удалось загрузить заказы. Обновите страницу.
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
            — Пусто
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: colors.textStrong }}>
            {q
              ? `Ничего по «${searchQuery}»`
              : activeFilter === OrderStatus.CANCELLED
                ? "Нет отменённых заказов"
                : activeFilter === "ALL"
                  ? "Заказов пока нет"
                  : `Нет заказов: «${STATUS_CONFIG[activeFilter]?.label ?? activeFilter}»`}
          </h2>
          <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
            {q
              ? "Попробуйте другой запрос"
              : "Когда оформите заказ — он появится здесь"}
          </p>
          {!q && activeFilter === "ALL" && (
            <Link
              href="/"
              className="px-6 py-3 text-sm font-bold rounded"
              style={{ background: colors.brand, color: colors.brandTextOnBg }}
            >
              К магазинам
            </Link>
          )}
        </div>
      )}

      {/* Order cards */}
      {orders.length > 0 && (
        <div className="px-4 space-y-2 pb-4">
          {orders.map((order) => {
            const itemCount =
              order.preview?.itemCount ??
              (order as unknown as { itemCount?: number }).itemCount ??
              0;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block p-4 rounded-md transition active:opacity-80"
                style={{ background: colors.surface }}
              >
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <div className="text-[13px] font-semibold" style={{ color: colors.textStrong }}>
                    Заказ #{order.orderNumber ?? shortId(order.id)}
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="text-[11px]" style={{ color: colors.textMuted }}>
                  {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? "товар" : itemCount < 5 ? "товара" : "товаров"} · ` : ""}
                  {formatDate(order.createdAt)}
                </div>
                <div className="text-sm font-bold mt-1.5" style={{ color: colors.textStrong }}>
                  {formatPrice(order.totalAmount)} сум
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="px-4 pb-4">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isLoadingMore}
            className="w-full py-3 rounded-md text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
          >
            {isLoadingMore ? "Загрузка..." : "Загрузить ещё"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  useBuyerSocket();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b" style={{ borderColor: colors.divider }}>
        <h1 className="text-lg font-bold" style={{ color: colors.textStrong }}>Заказы</h1>
      </div>

      <div className="max-w-4xl mx-auto pb-28 md:pb-12">
        {isAuthenticated ? (
          <OrdersList />
        ) : (
          <div className="px-4 pt-6">
            <OtpGate
              icon={<Package size={22} />}
              title="Войдите чтобы видеть заказы"
            />
          </div>
        )}
      </div>

      <BottomNavBar active="orders" />
    </div>
  );
}
