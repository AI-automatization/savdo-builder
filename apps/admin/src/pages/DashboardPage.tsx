import { Users, Store, ShoppingCart, Clock, AlertCircle, ArrowUpRight } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/ui/number-ticker'

interface SellersResponse { sellers: unknown[]; total: number }
interface StoresResponse  { stores: unknown[];  total: number }
interface QueueResponse   { cases: unknown[];   total: number }

const STATS = [
  {
    key: 'sellers',
    label: 'Продавцов',
    icon: Users,
    accent: 'text-indigo-400',
    dim: 'bg-indigo-500/10',
  },
  {
    key: 'stores',
    label: 'Магазинов',
    icon: Store,
    accent: 'text-emerald-400',
    dim: 'bg-emerald-500/10',
  },
  {
    key: 'queue',
    label: 'На модерации',
    icon: Clock,
    accent: 'text-amber-400',
    dim: 'bg-amber-500/10',
  },
  {
    key: 'orders',
    label: 'Заказов',
    icon: ShoppingCart,
    accent: 'text-zinc-400',
    dim: 'bg-zinc-500/10',
  },
] as const

function StatCard({
  label, value, loading, error, icon: Icon, accent, dim,
}: {
  label: string
  value: number
  loading: boolean
  error: string | null
  icon: React.ElementType
  accent: string
  dim: string
}) {
  return (
    <div className={cn(
      'group relative bg-[#111113] border border-zinc-900 rounded-xl p-5',
      'hover:border-zinc-700 transition-colors duration-200',
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dim)}>
          <Icon size={15} className={accent} />
        </div>
        {error
          ? <AlertCircle size={13} className="text-red-500" />
          : <ArrowUpRight size={13} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
        }
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-zinc-100 tabular-nums tracking-tight leading-none mb-1">
        {loading
          ? <span className="text-zinc-700">—</span>
          : error
          ? <span className="text-red-500">!</span>
          : <NumberTicker value={value} className="text-zinc-100" />
        }
      </div>

      {/* Label */}
      <p className="text-xs text-zinc-600 font-medium">{label}</p>
    </div>
  )
}

export default function DashboardPage() {
  const sellers = useFetch<SellersResponse>('/api/v1/admin/sellers?limit=1', [])
  const stores  = useFetch<StoresResponse>('/api/v1/admin/stores?limit=1', [])
  const queue   = useFetch<QueueResponse>('/api/v1/admin/moderation/queue?limit=1', [])

  const today = new Date().toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statValues: Record<string, number> = {
    sellers: sellers.data?.total ?? 0,
    stores:  stores.data?.total  ?? 0,
    queue:   queue.data?.total   ?? 0,
    orders:  0,
  }
  const statLoading: Record<string, boolean> = {
    sellers: sellers.loading,
    stores:  stores.loading,
    queue:   queue.loading,
    orders:  false,
  }
  const statError: Record<string, string | null> = {
    sellers: sellers.error,
    stores:  stores.error,
    queue:   queue.error,
    orders:  null,
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">{today}</p>
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
          />
        ))}
      </div>

      {/* Orders placeholder */}
      <div className="bg-[#111113] border border-zinc-900 rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center mb-4">
          <ShoppingCart size={18} className="text-zinc-700" />
        </div>
        <p className="text-sm font-medium text-zinc-400 mb-1">Статистика заказов</p>
        <p className="text-xs text-zinc-700">Появится после подключения orders endpoint</p>
      </div>

    </div>
  )
}
