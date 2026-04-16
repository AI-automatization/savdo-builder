'use client';

import { useSellerSummary } from '@/hooks/use-analytics';
import { Star } from 'lucide-react';
import { useSellerProduct } from '@/hooks/use-products';

// ── Glass token ────────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.13)',
} as const;

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={glass}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {label}
        </span>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + '22', color }}>
          {icon}
        </span>
      </div>
      {loading ? (
        <div className="h-8 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
      ) : (
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      )}
      {sub && !loading && (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{sub}</p>
      )}
    </div>
  );
}

// ── Top Product Card ───────────────────────────────────────────────────────────

function TopProductCard({
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
    <div className="rounded-2xl p-5 flex flex-col gap-3" style={glass}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Топ товар
        </span>
        <span
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
          style={{ background: 'rgba(251,191,36,0.15)', color: 'rgba(251,191,36,0.85)' }}
        >
          <Star size={16} />
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="h-6 w-40 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="h-3.5 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      ) : title ? (
        <>
          <p className="text-xl font-bold text-white leading-snug">{title}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {views.toLocaleString('ru-RU')} просмотров за 30 дней
          </p>
        </>
      ) : (
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Недостаточно данных
        </p>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useSellerSummary();

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Аналитика</h1>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
          Последние 30 дней
        </p>
      </div>

      {isError && (
        <div
          className="rounded-2xl px-5 py-4 text-sm"
          style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', color: 'rgba(248,113,113,0.85)' }}
        >
          Не удалось загрузить аналитику. Попробуйте обновить страницу.
        </div>
      )}

      {/* Main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Просмотры"
          value={data ? data.views.toLocaleString('ru-RU') : '—'}
          sub="товаров и магазина"
          color="rgba(167,139,250,0.85)"
          loading={isLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        <StatCard
          label="Конверсия"
          value={data ? `${data.conversionRate}%` : '—'}
          sub="просмотр → заказ"
          color="rgba(52,211,153,0.85)"
          loading={isLoading}
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
      </div>

      {/* Top product */}
      <TopProductCard
        productId={data?.topProduct?.productId ?? null}
        views={data?.topProduct?.views ?? 0}
        loading={isLoading}
      />

      {/* Empty state hint */}
      {!isLoading && !isError && data?.views === 0 && (
        <div
          className="rounded-2xl px-5 py-6 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-sm font-medium text-white/60">Пока нет данных</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.28)' }}>
            Поделитесь ссылкой на магазин — статистика появится после первых просмотров
          </p>
        </div>
      )}
    </div>
  );
}
