'use client';

import { useState } from 'react';
import { Star, ShoppingBag, Package, Hourglass, TrendingUp } from 'lucide-react';
import { useSellerSummary, useSellerAnalytics, type AnalyticsPeriod } from '@/hooks/use-analytics';
import type { DailyPoint } from '@/lib/api/analytics.api';
import { useSellerProduct } from '@/hooks/use-products';
import { card, cardMuted, colors, dangerTint } from '@/lib/styles';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 7,  label: '7 дней'  },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' млн';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + ' тыс';
  return n.toLocaleString('ru-RU');
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  sub,
  color,
  icon,
  loading,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-lg p-5 flex flex-col gap-3" style={card}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          {label}
        </span>
        <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: color + '22', color }}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded-md animate-pulse" style={{ background: colors.surfaceElevated }} />
      ) : (
        <div className="flex items-baseline gap-1.5">
          <p className="text-3xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>{value}</p>
          {unit && <span className="text-xs" style={{ color: colors.textDim }}>{unit}</span>}
        </div>
      )}
      {sub && !loading && (
        <p className="text-xs" style={{ color: colors.textDim }}>{sub}</p>
      )}
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ daily }: { daily: DailyPoint[] }) {
  const W = 600;
  const H = 90;
  const pad = 6;
  if (daily.length < 2) return null;
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const step = (W - pad * 2) / (daily.length - 1);
  const points = daily
    .map((d, i) => {
      const x = pad + i * step;
      const y = pad + (H - pad * 2) * (1 - d.revenue / max);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const lastPoint = points.split(' ').pop() ?? '';
  const [lx, ly] = lastPoint.split(',').map(Number);
  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="rounded-lg p-5 flex flex-col gap-3" style={card}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>Выручка по дням</p>
          <p className="text-sm mt-0.5" style={{ color: colors.textPrimary }}>
            <span className="font-semibold">{fmt(totalRevenue)}</span> сум суммарно
          </p>
        </div>
        <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: colors.accent + '22', color: colors.accent }}>
          <TrendingUp size={16} />
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="sellerSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={colors.accent} stopOpacity={0.35} />
            <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={`${pad},${H - pad} ${points} ${W - pad},${H - pad}`} fill="url(#sellerSparkFill)" />
        <polyline points={points} fill="none" stroke={colors.accent} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
        {Number.isFinite(lx) && Number.isFinite(ly) && (
          <circle cx={lx} cy={ly} r={3} fill={colors.accent} />
        )}
      </svg>
    </div>
  );
}

// ── Top Products ──────────────────────────────────────────────────────────────

function TopProductsList({
  products,
  loading,
}: {
  products: { productId: string | null; title: string; quantity: number; revenue: number }[];
  loading: boolean;
}) {
  if (!loading && products.length === 0) return null;

  return (
    <div className="rounded-lg p-5 flex flex-col gap-3" style={card}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Топ товары · по выручке
        </span>
        <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)', color: colors.warning }}>
          <Star size={16} />
        </span>
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md animate-pulse" style={{ background: colors.surfaceMuted }} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col">
          {products.slice(0, 5).map((p, idx) => (
            <div
              key={p.productId ?? `${p.title}-${idx}`}
              className="flex items-baseline justify-between gap-3 py-2.5"
              style={{ borderTop: idx > 0 ? `1px solid ${colors.divider}` : 'none' }}
            >
              <span className="text-[10px] font-mono w-5 flex-shrink-0" style={{ color: colors.textDim }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="text-sm flex-1 truncate" style={{ color: colors.textPrimary }}>{p.title}</span>
              <span className="text-xs flex-shrink-0" style={{ color: colors.textDim }}>× {p.quantity}</span>
              <span className="text-sm font-bold flex-shrink-0" style={{ color: colors.accent }}>
                {fmt(p.revenue)} сум
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Legacy: Top by views ──────────────────────────────────────────────────────

function TopByViewsCard({
  productId,
  views,
  loading,
}: {
  productId: string | null;
  views: number;
  loading: boolean;
}) {
  const { data: product, isLoading: productLoading } = useSellerProduct(productId ?? '');
  const isLoading = loading || (!!productId && productLoading);
  const title = product?.title ?? (productId ? `#${productId.slice(-6).toUpperCase()}` : null);

  return (
    <div className="rounded-lg p-5 flex flex-col gap-3" style={card}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Самый просматриваемый · 30 дней
        </span>
        <span className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `color-mix(in srgb, ${colors.info} 15%, transparent)`, color: colors.info }}>
          <Star size={16} />
        </span>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded-md animate-pulse" style={{ background: colors.surfaceElevated }} />
          <div className="h-3.5 w-24 rounded-md animate-pulse" style={{ background: colors.surfaceMuted }} />
        </div>
      ) : title ? (
        <>
          <p className="text-xl font-bold leading-snug" style={{ color: colors.textPrimary }}>{title}</p>
          <p className="text-xs" style={{ color: colors.textDim }}>
            {views.toLocaleString('ru-RU')} просмотров
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: colors.textDim }}>Недостаточно данных</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>(30);
  const { data, isLoading, isError } = useSellerAnalytics(period);
  const { data: summary, isLoading: summaryLoading } = useSellerSummary();

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Header + period selector */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Аналитика</h1>
          <p className="text-sm mt-0.5" style={{ color: colors.textDim }}>
            Заказы и выручка магазина
          </p>
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Период">
          {PERIODS.map((p) => {
            const active = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => setPeriod(p.value)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors"
                style={
                  active
                    ? { background: colors.accent, color: colors.accentTextOnBg, border: `1px solid ${colors.accent}` }
                    : { background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {isError && (
        <div
          className="rounded-lg px-5 py-4 text-sm"
          style={{ background: dangerTint(0.1), border: `1px solid ${dangerTint(0.25)}`, color: colors.danger }}
        >
          Не удалось загрузить аналитику. Попробуйте обновить страницу.
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Выручка"
          value={data ? fmt(data.revenue.completed) : '—'}
          unit="сум"
          sub="Доставленные заказы"
          color={colors.success}
          loading={isLoading}
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          label="Заказы"
          value={data ? String(data.orders.total) : '—'}
          sub={data ? `${data.orders.byStatus.DELIVERED ?? 0} доставлено` : undefined}
          color={colors.accent}
          loading={isLoading}
          icon={<Package size={16} />}
        />
        <KpiCard
          label="В работе"
          value={data ? fmt(data.revenue.pending) : '—'}
          unit="сум"
          sub="Confirmed + Processing + Shipped"
          color={colors.warning}
          loading={isLoading}
          icon={<Hourglass size={16} />}
        />
      </div>

      {/* Sparkline */}
      {!isLoading && !isError && data && data.daily.length > 1 && (
        <Sparkline daily={data.daily} />
      )}

      {/* Top products by revenue */}
      <TopProductsList products={data?.topProducts ?? []} loading={isLoading} />

      {/* Empty state */}
      {!isLoading && !isError && data && data.orders.total === 0 && (
        <div className="rounded-lg px-5 py-8 text-center" style={cardMuted}>
          <ShoppingBag size={28} className="mx-auto mb-2" style={{ color: colors.textDim }} />
          <p className="text-sm font-medium" style={{ color: colors.textMuted }}>За {PERIODS.find((p) => p.value === period)?.label.toLowerCase()} ещё нет заказов</p>
          <p className="text-xs mt-1" style={{ color: colors.textDim }}>
            Поделитесь ссылкой на магазин и продвигайте товары — статистика появится здесь
          </p>
        </div>
      )}

      {/* Legacy: views & conversion + top by views — show as secondary section */}
      <div className="flex flex-col gap-3 mt-4">
        <hr style={{ border: 0, borderTop: `1px solid ${colors.divider}` }} />
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Просмотры и конверсия (за 30 дней)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KpiCard
            label="Просмотры"
            value={summary ? summary.views.toLocaleString('ru-RU') : '—'}
            sub="товаров и магазина"
            color={colors.accent}
            loading={summaryLoading}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <KpiCard
            label="Конверсия"
            value={summary ? `${summary.conversionRate}` : '—'}
            unit="%"
            sub="просмотр → заказ"
            color={colors.success}
            loading={summaryLoading}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
        </div>
        <TopByViewsCard
          productId={summary?.topProduct?.productId ?? null}
          views={summary?.topProduct?.views ?? 0}
          loading={summaryLoading}
        />
      </div>
    </div>
  );
}
