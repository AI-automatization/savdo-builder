'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '../../../hooks/use-seller';
import { useSellerOrders } from '../../../hooks/use-orders';
import { useSellerSummary } from '../../../hooks/use-analytics';
import { useSellerProducts } from '../../../hooks/use-products';
import { OrderStatus, StoreStatus } from '@/lib/enums';
import { track } from '../../../lib/analytics';
import { buyerStoreUrl } from '@/lib/buyer-url';
import { Package, Eye, Link2, Clock, Plus, ClipboardList, BarChart3 } from 'lucide-react';
import { card, cardMuted, colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  [OrderStatus.PENDING]:    colors.warning,
  [OrderStatus.CONFIRMED]:  colors.info,
  [OrderStatus.PROCESSING]: colors.accent,
  [OrderStatus.SHIPPED]:    colors.info,
  [OrderStatus.DELIVERED]:  colors.success,
  [OrderStatus.CANCELLED]:  colors.danger,
};

const STORE_STATUS_I18N_KEY: Record<string, string> = {
  [StoreStatus.DRAFT]:          'common.storeStatus.DRAFT',
  [StoreStatus.PENDING_REVIEW]: 'common.storeStatus.PENDING_REVIEW',
  [StoreStatus.APPROVED]:       'common.storeStatus.APPROVED',
  [StoreStatus.REJECTED]:       'common.storeStatus.REJECTED',
  [StoreStatus.SUSPENDED]:      'common.storeStatus.SUSPENDED',
  [StoreStatus.ARCHIVED]:       'common.storeStatus.ARCHIVED',
};

function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
}

function fmt(n: unknown) {
  return toNum(n).toLocaleString('ru-RU') + ' сум';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: colors.surfaceElevated }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t } = useTranslation();
  const { data: store, isLoading: storeLoading } = useStore();
  const { data: ordersData, isLoading: ordersLoading } = useSellerOrders({ limit: 5 });
  // Отдельный запрос на счётчик PENDING: limit:5 у списка занижал KPI при >5
  // ожидающих заказов. meta.total даёт полное число без выгрузки всех строк.
  const { data: pendingData } = useSellerOrders({ status: OrderStatus.PENDING, limit: 1 });
  const { data: summary, isLoading: summaryLoading } = useSellerSummary();
  const { data: productsData, isLoading: productsLoading } = useSellerProducts();
  const [copied, setCopied] = useState(false);
  const hasNoProducts = !productsLoading && (productsData?.total ?? 0) === 0;

  function handleCopyLink() {
    if (!store) return;
    const url = buyerStoreUrl(store.slug);
    navigator.clipboard.writeText(url).then(() => {
      track.storeLinkCopied(store.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const orders = ordersData?.data ?? [];
  const pendingCount = pendingData?.meta.total ?? 0;

  const quickActions = [
    { labelKey: 'dashboard.quickAddProduct',     href: "/products/create", icon: Plus },
    { labelKey: 'dashboard.quickProcessOrders',  href: "/orders",          icon: ClipboardList },
    { labelKey: 'dashboard.quickAnalytics',      href: "/analytics",       icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{t('dashboard.greeting')}</h1>
        <div className="text-sm mt-1" style={{ color: colors.textMuted }}>
          {storeLoading ? (
            <Skeleton className="h-4 w-40 inline-block" />
          ) : store ? (
            <>{t('dashboard.storeLabel')}: <span style={{ color: colors.accent }}>{store.name}</span>
            {' '}<span className="text-xs" style={{ color: colors.textDim }}>
              · {t(STORE_STATUS_I18N_KEY[store.status] ?? '') || store.status}
            </span></>
          ) : (
            <span style={{ color: colors.danger }}>{t('dashboard.storeNotFound')}</span>
          )}
        </div>
      </div>

      {/* Empty-state: no products yet */}
      {hasNoProducts && store && (
        <div className="rounded-2xl p-6" style={card}>
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: colors.accent }}
            >
              <Plus size={22} color={colors.accentTextOnBg} />
            </div>
            <div className="flex-1">
              <h2
                className="text-base font-bold mb-1"
                style={{ color: colors.textPrimary }}
              >
                {store.status === StoreStatus.APPROVED
                  ? t('dashboard.addFirstProduct')
                  : t('dashboard.storeOnReview')}
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: colors.textMuted }}
              >
                {store.status === StoreStatus.APPROVED
                  ? t('dashboard.addProductCta')
                  : t('dashboard.addProductCtaPending')}
              </p>
              <Link
                href="/products/create"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Plus size={16} />
                {t('dashboard.addProductBtn')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Orders today (pending) */}
        <div className="rounded-lg p-4" style={card}>
          <div className="flex items-start justify-between mb-3">
            <Package size={22} style={{ color: colors.accent }} />
            {ordersLoading ? (
              <Skeleton className="h-5 w-8" />
            ) : pendingCount > 0 ? (
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(251,191,36,.15)", color: colors.warning }}
              >
                +{pendingCount}
              </span>
            ) : null}
          </div>
          {ordersLoading ? (
            <Skeleton className="h-6 w-12 mb-1" />
          ) : (
            <p className="text-lg font-bold leading-none" style={{ color: colors.textPrimary }}>{ordersData?.meta.total ?? 0}</p>
          )}
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>{t('dashboard.totalOrders')}</p>
        </div>

        {/* Views */}
        <div className="rounded-lg p-4" style={card}>
          <div className="flex items-start justify-between mb-3">
            <Eye size={22} style={{ color: colors.accent }} />
          </div>
          {summaryLoading ? (
            <Skeleton className="h-6 w-16 mb-1" />
          ) : (
            <p className="text-lg font-bold leading-none" style={{ color: colors.textPrimary }}>
              {(summary?.views ?? 0).toLocaleString('ru-RU')}
            </p>
          )}
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>{t('dashboard.viewsMonth')}</p>
        </div>

        {/* Store slug — copy link */}
        <button
          type="button"
          className="rounded-lg p-4 text-left cursor-pointer transition-colors active:scale-[0.99]"
          style={{ ...card, color: colors.textPrimary }}
          onClick={handleCopyLink}
          onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceElevated; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
        >
          <div className="flex items-start justify-between mb-3">
            <Link2 size={22} style={{ color: colors.accent }} />
            {copied && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(52,211,153,.15)", color: colors.success }}>
                {t('dashboard.copied')}
              </span>
            )}
          </div>
          {storeLoading ? (
            <Skeleton className="h-6 w-20 mb-1" />
          ) : store ? (
            <p className="text-sm font-bold leading-none truncate" style={{ color: colors.textPrimary }}>/{store.slug}</p>
          ) : (
            <p className="text-sm font-bold leading-none" style={{ color: colors.textDim }}>—</p>
          )}
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>{t('dashboard.copyLink')}</p>
        </button>

        {/* Pending orders */}
        <div className="rounded-lg p-4" style={card}>
          <div className="flex items-start justify-between mb-3">
            <Clock size={22} style={{ color: colors.accent }} />
          </div>
          {ordersLoading ? (
            <Skeleton className="h-6 w-8 mb-1" />
          ) : (
            <p className="text-lg font-bold leading-none" style={{ color: colors.textPrimary }}>{pendingCount}</p>
          )}
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>{t('dashboard.pendingOrders')}</p>
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-lg overflow-hidden" style={card}>
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{t('dashboard.recentOrders')}</p>
          <Link href="/orders" className="text-xs font-medium" style={{ color: colors.accent }}>{t('dashboard.allOrders')}</Link>
        </div>

        {ordersLoading ? (
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: colors.textDim }}>
            {t('dashboard.noOrders')}
          </div>
        ) : (
          <div>
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-4 px-5 py-3 transition-colors"
                style={{ borderBottom: `1px solid ${colors.divider}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceElevated; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="text-xs font-mono shrink-0" style={{ color: colors.textDim }}>
                  #{o.id.slice(-4).toUpperCase()}
                </span>
                <span className="flex-1 text-sm truncate" style={{ color: colors.textPrimary }}>
                  {o.deliveryAddress?.city ?? (o as unknown as { city?: string | null }).city ?? '—'}
                </span>
                <span className="text-sm font-medium shrink-0" style={{ color: colors.accent }}>
                  {fmt(o.totalAmount)}
                </span>
                <span
                  className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
                  style={{
                    background: (STATUS_COLORS[o.status] ?? colors.textDim) + "22",
                    color: STATUS_COLORS[o.status] ?? colors.textMuted,
                  }}
                >
                  {t(`orders.status.${o.status}`) || o.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.labelKey}
              href={a.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{ ...cardMuted, color: colors.textPrimary }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceElevated; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = colors.surfaceMuted; }}
            >
              <Icon size={18} style={{ color: colors.accent }} />
              {t(a.labelKey)}
            </Link>
          );
        })}
      </div>

    </div>
  );
}
