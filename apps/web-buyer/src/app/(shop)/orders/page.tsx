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
import { useTranslation } from "@/lib/i18n";

// ── Status config ─────────────────────────────────────────────────────────────

type StatusTone = "success" | "brand" | "warning" | "danger" | "muted";

const STATUS_TONE: Record<string, StatusTone> = {
  [OrderStatus.PENDING]:    "warning",
  [OrderStatus.CONFIRMED]:  "brand",
  [OrderStatus.PROCESSING]: "brand",
  [OrderStatus.SHIPPED]:    "brand",
  [OrderStatus.DELIVERED]:  "success",
  [OrderStatus.CANCELLED]:  "muted",
};

const TONE_COLORS: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: "rgba(74,107,69,0.12)",  fg: colors.success },
  brand:   { bg: colors.brandMuted,       fg: colors.brand   },
  warning: { bg: "rgba(156,122,46,0.12)", fg: colors.warning },
  danger:  { bg: "rgba(139,58,58,0.12)",  fg: colors.danger  },
  muted:   { bg: colors.surfaceSunken,    fg: colors.textMuted },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Russian plural: 1 товар / 2 товара / 5 товаров */
function pluralItems(count: number): string {
  const abs = Math.abs(count) % 100;
  const rem = abs % 10;
  if (abs >= 11 && abs <= 14) return `${count} товаров`;
  if (rem === 1) return `${count} товар`;
  if (rem >= 2 && rem <= 4) return `${count} товара`;
  return `${count} товаров`;
}

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
  const { t } = useTranslation();
  const tone = STATUS_TONE[status] ?? "muted";
  const c = TONE_COLORS[tone] ?? TONE_COLORS.muted;
  const label = t(`orders.status.${status}` as Parameters<typeof t>[0]) || status;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {label}
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
  const { t, locale } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [accOrders, setAccOrders] = useState<OrderListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const FILTER_TABS: { key: OrderStatus | "ALL"; label: string }[] = [
    { key: "ALL",                   label: t('orders.filter.all')       },
    { key: OrderStatus.PENDING,     label: t('orders.filter.pending')   },
    { key: OrderStatus.CONFIRMED,   label: t('orders.filter.confirmed') },
    { key: OrderStatus.SHIPPED,     label: t('orders.filter.shipped')   },
    { key: OrderStatus.DELIVERED,   label: t('orders.filter.delivered') },
    { key: OrderStatus.CANCELLED,   label: t('orders.filter.cancelled') },
  ];

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

  // Reset pagination + accumulator when the filter changes — otherwise stale
  // page state lets the next fetch return page-3 of the new filter and append
  // it to old-filter rows.
  useEffect(() => {
    setPage(1);
    setAccOrders([]);
  }, [activeFilter]);

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

  const statusLabel = activeFilter !== "ALL"
    ? (t(`orders.status.${activeFilter}` as Parameters<typeof t>[0]) || activeFilter)
    : "";

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
            placeholder={t('orders.search.placeholder')}
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
              aria-label={t('orders.search.clearLabel')}
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
          {t('orders.error')}
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
            {t('orders.empty.label')}
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: colors.textStrong }}>
            {q
              ? t('orders.empty.noResults', { query: searchQuery })
              : activeFilter === OrderStatus.CANCELLED
                ? t('orders.empty.noCancelled')
                : activeFilter === "ALL"
                  ? t('orders.empty.noOrders')
                  : t('orders.empty.noStatus', { label: statusLabel })}
          </h2>
          <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
            {q
              ? t('orders.empty.hint')
              : t('orders.empty.hintFirst')}
          </p>
          {!q && activeFilter === "ALL" && (
            <Link
              href="/"
              className="px-6 py-3 text-sm font-bold rounded"
              style={{ background: colors.brand, color: colors.brandTextOnBg }}
            >
              {t('orders.empty.toStores')}
            </Link>
          )}
        </div>
      )}

      {/* Order cards */}
      {orders.length > 0 && (
        <div className="px-4 space-y-2 pb-4">
          {orders.map((order) => {
            const itemCount =
              order.preview?.itemCount ?? order.itemCount ?? 0;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block p-4 rounded-md transition active:opacity-80"
                style={{ background: colors.surface }}
              >
                <div className="flex justify-between items-baseline mb-1 gap-2">
                  <div className="text-[13px] font-semibold" style={{ color: colors.textStrong }}>
                    {t('orders.card.number', { number: String(order.orderNumber ?? shortId(order.id)) })}
                  </div>
                  <StatusPill status={order.status} />
                </div>
                <div className="text-[11px]" style={{ color: colors.textMuted }}>
                  {itemCount > 0
                    ? `${locale === 'uz' ? t('orders.itemCountUz', { count: itemCount }) : pluralItems(itemCount)} · `
                    : ""}
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
            {isLoadingMore ? t('common.loading') : t('orders.card.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  useBuyerSocket();

  const isBuyer = user?.role === 'BUYER';

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b" style={{ borderColor: colors.divider }}>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textStrong }}>{t('orders.title')}</h1>
      </div>

      <div className="max-w-4xl mx-auto pb-28 md:pb-12">
        {!isAuthenticated ? (
          <div className="px-4 pt-6">
            <OtpGate
              icon={<Package size={22} />}
              title={t('orders.loginTitle')}
            />
          </div>
        ) : !isBuyer ? (
          <div className="px-4 pt-10 max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ background: colors.brandMuted, color: colors.brand }}>
              <Package size={20} />
            </div>
            <h2 className="text-base font-bold mb-2" style={{ color: colors.textStrong }}>
              {t('orders.sellerAccountTitle')}
            </h2>
            <p className="text-[13px]" style={{ color: colors.textMuted }}>
              {t('orders.sellerAccountDesc')}
            </p>
          </div>
        ) : (
          <OrdersList />
        )}
      </div>

      <BottomNavBar active="orders" />
    </div>
  );
}
