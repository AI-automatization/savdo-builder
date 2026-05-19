import { TrendingUp, ShoppingCart, XCircle, UserPlus, Store, DollarSign } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { NumberTicker } from '@/components/ui/number-ticker'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, Cell, ComposedChart, Area,
} from 'recharts'

interface KpiStats {
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
  cancelledPct: number
  newSellers: number
  newStores: number
}

interface FunnelStep {
  event: string
  label: string
  count: number
  pct: number
}

interface TopStore {
  storeId: string
  storeName: string
  orderCount: number
  revenue: number
}

interface DailyOrderStat { date: string; count: number }
interface DailyGrowthStat { date: string; sellers: number; stores: number }

interface AnalyticsSummary {
  kpi: KpiStats
  ordersPerDay: DailyOrderStat[]
  topStores: TopStore[]
  funnel: FunnelStep[]
  growth: DailyGrowthStat[]
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: 'var(--surface2)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--text)',
  },
  labelStyle: { color: 'var(--text-muted)' },
}

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n)
}

function KpiCard({
  label, value, sub, icon: Icon, accent, dim, prefix = '', suffix = '',
}: {
  label: string; value: number; sub?: string
  icon: React.ElementType; accent: string; dim: string
  prefix?: string; suffix?: string
}) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dim}`}>
          <Icon size={15} className={accent} />
        </div>
      </div>
      <div className="text-2xl font-bold tabular-nums tracking-tight leading-none mb-1" style={{ color: 'var(--text)' }}>
        {prefix}<NumberTicker value={value} />{suffix}
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{label}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
      {children}
    </p>
  )
}

export default function AnalyticsDashboardPage() {
  const { t } = useTranslation()
  const { data, loading } = useFetch<AnalyticsSummary>('/api/v1/admin/analytics/summary', [])

  const kpi = data?.kpi
  const funnel = data?.funnel ?? []
  const topStores = data?.topStores ?? []
  const ordersPerDay = data?.ordersPerDay ?? []
  const growth = data?.growth ?? []

  return (
    <div className="p-8 min-h-screen space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {t('analytics.title')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t('analytics.last30days')}
        </p>
      </div>

      {/* KPI Cards */}
      <div>
        <SectionTitle>{t('analytics.kpiSection')}</SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          <KpiCard label={t('analytics.kpiOrders')} value={kpi?.totalOrders ?? 0}
            icon={ShoppingCart} accent="text-sky-400" dim="bg-sky-500/10" />
          <KpiCard label={t('analytics.kpiRevenue')} value={kpi?.totalRevenue ?? 0}
            suffix={t('analytics.sum')} icon={DollarSign} accent="text-emerald-400" dim="bg-emerald-500/10" />
          <KpiCard label={t('analytics.kpiAvgOrder')} value={kpi?.avgOrderValue ?? 0}
            suffix={t('analytics.sum')} icon={TrendingUp} accent="text-indigo-400" dim="bg-indigo-500/10" />
          <KpiCard label={t('analytics.kpiCancelled')} value={kpi?.cancelledPct ?? 0}
            suffix="%" sub={t('analytics.ofAllOrders')} icon={XCircle} accent="text-red-400" dim="bg-red-500/10" />
          <KpiCard label={t('analytics.kpiNewSellers')} value={kpi?.newSellers ?? 0}
            icon={UserPlus} accent="text-violet-400" dim="bg-violet-500/10" />
          <KpiCard label={t('analytics.kpiNewStores')} value={kpi?.newStores ?? 0}
            icon={Store} accent="text-amber-400" dim="bg-amber-500/10" />
        </div>
      </div>

      {/* Orders per day + Growth */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">

        {/* Orders per day */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>{t('analytics.ordersByDay')}</SectionTitle>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <ComposedChart data={ordersPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)}
                  tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...TOOLTIP_STYLE} labelFormatter={d => String(d)} formatter={(v) => [`${v}`, t('dashboard.ordersTooltip')]} />
                <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2}
                  fill="url(#ordersGrad)" dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Growth: sellers + stores per day */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>{t('analytics.platformGrowth')}</SectionTitle>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />{t('nav.sellers')}
                </span>
                <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{t('nav.stores')}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={growth} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="date" tickFormatter={d => d.slice(5)}
                    tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip {...TOOLTIP_STYLE} labelFormatter={d => String(d)} />
                  <Line type="monotone" dataKey="sellers" name={t('nav.sellers')} stroke="#818CF8" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                  <Line type="monotone" dataKey="stores" name={t('nav.stores')} stroke="#22C55E" strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <SectionTitle>{t('analytics.funnel')}</SectionTitle>
        {loading ? (
          <div className="h-20 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
        ) : funnel.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</div>
        ) : (
          <div className="space-y-2.5">
            {funnel.map((step, i) => (
              <div key={step.event} className="flex items-center gap-3">
                <div className="w-32 text-xs shrink-0" style={{ color: 'var(--text-dim)' }}>{step.label}</div>
                <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'var(--surface2)' }}>
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{
                      width: `${step.pct}%`,
                      background: `rgba(99,102,241,${1 - i * 0.15})`,
                    }}
                  />
                </div>
                <div className="w-20 text-right text-xs tabular-nums" style={{ color: 'var(--text)' }}>
                  {fmt(step.count)}
                </div>
                <div className="w-10 text-right text-xs font-semibold tabular-nums" style={{ color: 'var(--text-dim)' }}>
                  {step.pct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top stores table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <SectionTitle>{t('analytics.top10Stores')}</SectionTitle>
        </div>
        {loading ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</div>
        ) : topStores.length === 0 ? (
          <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.noData')}</div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="px-5 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={topStores.slice(0, 5)} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="storeName" width={90}
                    tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${v}`, t('dashboard.ordersTooltip')]} />
                  <Bar dataKey="orderCount" radius={[0, 4, 4, 0]}>
                    {topStores.slice(0, 5).map((_, i) => (
                      <Cell key={i} fill={`rgba(99,102,241,${1 - i * 0.15})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                  {['#', t('analytics.colStore'), t('analytics.colOrders'), t('analytics.colRevenue')].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topStores.map((s, i, arr) => (
                  <tr key={s.storeId}
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
                      {i + 1}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {s.storeName}
                    </td>
                    <td className="px-4 py-2.5 text-xs tabular-nums font-semibold" style={{ color: 'var(--text)' }}>
                      {fmt(s.orderCount)}
                    </td>
                    <td className="px-4 py-2.5 text-xs tabular-nums font-semibold" style={{ color: 'var(--primary)' }}>
                      {fmt(s.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

    </div>
  )
}
