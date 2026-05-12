import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';

interface DailyPoint {
  date: string;
  revenue: number;
  orderCount: number;
}

interface TopProduct {
  productId: string | null;
  title: string;
  quantity: number;
  revenue: number;
}

interface SellerAnalytics {
  range: { from: string; to: string };
  revenue: { total: number; completed: number; pending: number };
  orders: { total: number; byStatus: Record<string, number> };
  topProducts: TopProduct[];
  daily: DailyPoint[];
}

const PERIODS = [
  { value: 7, label: '7д' },
  { value: 30, label: '30д' },
  { value: 90, label: '90д' },
] as const;

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('ru');
}

/**
 * FEAT-006-FE: компактный sparkline + KPI для seller dashboard.
 * Чистый SVG (без recharts) — лёгкий бандл, ~3-4 КБ.
 */
export function SellerAnalyticsCard() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(false);
    const to = new Date();
    const from = new Date(to.getTime() - period * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
    api<SellerAnalytics>(`/seller/analytics?${params}`, { signal: ac.signal })
      .then((res) => { if (!ac.signal.aborted) setData(res); })
      .catch(() => { if (!ac.signal.aborted) setError(true); })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, [period]);

  return (
    <GlassCard className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>📊 Аналитика</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold"
              style={
                period === p.value
                  ? { background: 'var(--tg-accent-dim)', border: '1px solid var(--tg-accent-border)', color: 'var(--tg-accent)' }
                  : { background: 'var(--tg-surface)', border: '1px solid var(--tg-border-soft)', color: 'var(--tg-text-muted)' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="flex justify-center py-6"><Spinner size={20} /></div>}

      {!loading && error && (
        <p className="text-xs text-center py-3" style={{ color: 'rgba(248,113,113,0.85)' }}>
          Не удалось загрузить аналитику
        </p>
      )}

      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Kpi label="Выручка" value={fmt(data.revenue.completed)} unit="сум" tone="purple" />
            <Kpi label="Заказы" value={String(data.orders.total)} tone="cyan" />
            <Kpi
              label="В работе"
              value={fmt(data.revenue.pending)}
              unit="сум"
              tone="amber"
            />
          </div>

          {data.daily.length > 1 && <Sparkline daily={data.daily} />}

          {data.topProducts.length > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
                Топ товары
              </p>
              {data.topProducts.slice(0, 3).map((p) => (
                <div key={p.productId ?? p.title} className="flex items-baseline justify-between gap-2">
                  <span className="text-xs truncate flex-1" style={{ color: 'var(--tg-text-secondary)' }}>
                    {p.title}
                  </span>
                  <span className="text-[11px] shrink-0" style={{ color: 'var(--tg-text-muted)' }}>
                    × {p.quantity}
                  </span>
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--tg-accent)' }}>
                    {fmt(p.revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </GlassCard>
  );
}

function Kpi({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone: 'purple' | 'cyan' | 'amber' }) {
  const color = tone === 'purple' ? '#A855F7' : tone === 'cyan' ? '#22D3EE' : '#FBBF24';
  return (
    <div className="flex flex-col items-start gap-0.5 px-2.5 py-2 rounded-lg"
      style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border-soft)' }}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--tg-text-muted)' }}>
        {label}
      </span>
      <span className="text-base font-bold" style={{ color }}>{value}</span>
      {unit && <span className="text-[9px]" style={{ color: 'var(--tg-text-dim)' }}>{unit}</span>}
    </div>
  );
}

function Sparkline({ daily }: { daily: DailyPoint[] }) {
  const W = 280;
  const H = 60;
  const pad = 4;
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const step = (W - pad * 2) / Math.max(1, daily.length - 1);
  const points = daily.map((d, i) => {
    const x = pad + i * step;
    const y = pad + (H - pad * 2) * (1 - d.revenue / max);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastPoint = points.split(' ').pop() ?? '';
  const [lx, ly] = lastPoint.split(',').map(Number);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
        Выручка по дням
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(168,85,247,0.40)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0)" />
          </linearGradient>
        </defs>
        <polygon
          points={`${pad},${H - pad} ${points} ${W - pad},${H - pad}`}
          fill="url(#sparkFill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#A855F7"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {Number.isFinite(lx) && Number.isFinite(ly) && (
          <circle cx={lx} cy={ly} r={2.5} fill="#A855F7" />
        )}
      </svg>
    </div>
  );
}
