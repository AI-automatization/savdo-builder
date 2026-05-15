import { useNavigate } from 'react-router-dom'
import { Users, Store, ShoppingCart, Clock, AlertCircle, ArrowUpRight, ChevronRight, TrendingUp, BarChart2 } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/ui/number-ticker'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts'

interface SellersResponse { sellers: unknown[]; total: number }
interface StoresResponse  { stores: unknown[];  total: number }
interface QueueResponse   { cases: unknown[];   total: number }
interface OrderItem {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  currencyCode: string
  customerFullName: string
  customerPhone: string
  placedAt: string
  store: { id: string; name: string; slug: string }
}
interface OrdersResponse { orders: OrderItem[]; total: number }

interface DailyOrderStat { date: string; count: number }
interface TopStore { storeId: string; storeName: string; orderCount: number }
interface AnalyticsSummary { ordersPerDay: DailyOrderStat[]; topStores: TopStore[] }

const STATS = [
  { key: 'sellers', label: 'Продавцов',    icon: Users,        accent: 'text-indigo-400', dim: 'bg-indigo-500/10', to: '/sellers' },
  { key: 'stores',  label: 'Магазинов',    icon: Store,        accent: 'text-emerald-400', dim: 'bg-emerald-500/10', to: '/stores' },
  { key: 'queue',   label: 'На модерации', icon: Clock,        accent: 'text-amber-400',   dim: 'bg-amber-500/10',  to: '/moderation' },
  { key: 'orders',  label: 'Заказов',      icon: ShoppingCart, accent: 'text-sky-400',     dim: 'bg-sky-500/10',    to: '/orders' },
] as const

// STATUS-LABEL-CANONICAL-* (web-sync audit 14.05.2026): единые лейблы.
const ORDER_STATUS: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'muted'; label: string }> = {
  PENDING:    { variant: 'warning', label: 'Ожидает' },
  CONFIRMED:  { variant: 'info',    label: 'Подтверждён' },
  PROCESSING: { variant: 'info',    label: 'Обработка' },
  SHIPPED:    { variant: 'info',    label: 'В пути' },
  DELIVERED:  { variant: 'success', label: 'Доставлен' },
  CANCELLED:  { variant: 'danger',  label: 'Отменён' },
}

function StatCard({
  label, value, loading, error, icon: Icon, accent, dim, onClick,
}: {
  label: string; value: number; loading: boolean; error: string | null
  icon: React.ElementType; accent: string; dim: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-xl p-5 transition-colors duration-200 w-full',
        'hover:border-zinc-700',
      )}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dim)}>
          <Icon size={15} className={accent} />
        </div>
        {error
          ? <AlertCircle size={13} className="text-red-500" />
          : <ArrowUpRight size={13} style={{ color: 'var(--text-dim)' }} className="transition-colors" />
        }
      </div>
      <div className="text-2xl font-bold tabular-nums tracking-tight leading-none mb-1" style={{ color: 'var(--text)' }}>
        {loading
          ? (
            <span
              aria-label="Загрузка значения"
              className="inline-block animate-pulse rounded"
              style={{ width: 56, height: 22, background: 'var(--surface2)' }}
            />
          )
          : error
          ? <span className="text-red-500">!</span>
          : <span style={{ color: 'var(--text)' }}><NumberTicker value={value} /></span>
        }
      </div>
      <p className="text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{label}</p>
    </button>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()

  const sellers   = useFetch<SellersResponse>('/api/v1/admin/sellers?limit=1', [])
  const stores    = useFetch<StoresResponse>('/api/v1/admin/stores?limit=1', [])
  const queue     = useFetch<QueueResponse>('/api/v1/admin/moderation/queue?limit=1', [])
  const recent    = useFetch<OrdersResponse>('/api/v1/admin/orders?limit=8', [])
  const analytics = useFetch<AnalyticsSummary>('/api/v1/admin/analytics/summary', [])

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statValues = {
    sellers: sellers.data?.total ?? 0,
    stores:  stores.data?.total  ?? 0,
    queue:   queue.data?.total   ?? 0,
    orders:  recent.data?.total  ?? 0,
  }
  const statLoading = {
    sellers: sellers.loading, stores: stores.loading,
    queue:   queue.loading,   orders: recent.loading,
  }
  const statError = {
    sellers: sellers.error, stores: stores.error,
    queue:   queue.error,   orders: recent.error,
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{today}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {STATS.map(s => (
          <StatCard
            key={s.key}
            label={s.label}
            value={statValues[s.key]}
            loading={statLoading[s.key]}
            error={statError[s.key]}
            icon={s.icon}
            accent={s.accent}
            dim={s.dim}
            onClick={() => navigate(s.to)}
          />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-8">

        {/* Line chart — orders per day */}
        <div className="xl:col-span-2 rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} style={{ color: 'var(--text-dim)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              Заказы за 30 дней
            </span>
          </div>
          {analytics.loading ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={analytics.data?.ordersPerDay ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="date"
                  tickFormatter={d => d.slice(5)}
                  tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  labelFormatter={d => String(d)}
                  formatter={(v) => [`${v}`, 'Заказов']}
                />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — top 5 stores */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} style={{ color: 'var(--text-dim)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              Топ магазинов
            </span>
          </div>
          {analytics.loading ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
          ) : (analytics.data?.topStores ?? []).length === 0 ? (
            <div className="h-40 flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={analytics.data?.topStores ?? []} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="storeName"
                  width={80}
                  tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text)' }}
                  formatter={(v) => [`${v}`, 'Заказов']}
                />
                <Bar dataKey="orderCount" radius={[0, 4, 4, 0]}>
                  {(analytics.data?.topStores ?? []).map((_, i) => (
                    <Cell key={i} fill={`rgba(99,102,241,${1 - i * 0.15})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div className="flex items-center gap-2">
            <ShoppingCart size={14} style={{ color: 'var(--text-dim)' }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              Последние заказы
            </span>
          </div>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            Все заказы <ChevronRight size={12} />
          </button>
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Номер', 'Магазин', 'Покупатель', 'Сумма', 'Статус', 'Дата'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.loading ? (
              <tr><td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : (recent.data?.orders ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  Заказов пока нет
                </td>
              </tr>
            ) : (recent.data?.orders ?? []).map((o, i, arr) => {
              const cfg = ORDER_STATUS[o.status] ?? { variant: 'muted' as const, label: o.status }
              return (
                <tr
                  key={o.id}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onClick={() => navigate('/orders')}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{o.store.name}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>/{o.store.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs" style={{ color: 'var(--text)' }}>{o.customerFullName || '—'}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {new Intl.NumberFormat('ru-RU').format(Number(o.totalAmount))} {o.currencyCode}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(o.placedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
