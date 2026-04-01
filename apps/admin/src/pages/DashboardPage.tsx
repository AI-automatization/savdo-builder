import { TrendingUp, Users, Store, ShoppingCart, AlertCircle, Clock } from 'lucide-react'
import { useFetch } from '../lib/hooks'

interface SellersResponse { sellers: unknown[]; total: number }
interface StoresResponse  { stores: unknown[];  total: number }
interface QueueResponse   { cases: unknown[];   total: number }

function StatCard({
  label, value, loading, error, color, bg, icon: Icon,
}: {
  label: string; value: number | string; loading: boolean; error: string | null
  color: string; bg: string; icon: any
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '22px 20px 18px',
      transition: 'border-color 0.2s, transform 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
        {error ? (
          <AlertCircle size={14} color="#EF4444" />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 20 }}>
            <TrendingUp size={11} /> live
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: loading ? 'var(--text-muted)' : 'var(--text)', lineHeight: 1, letterSpacing: '-1px' }}>
        {loading ? '—' : error ? '!' : value}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const sellers = useFetch<SellersResponse>('/api/v1/admin/sellers?limit=1', [])
  const stores  = useFetch<StoresResponse>('/api/v1/admin/stores?limit=1', [])
  const queue   = useFetch<QueueResponse>('/api/v1/admin/moderation/queue?limit=1', [])

  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Обзор платформы — {today}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Продавцов"
          value={sellers.data?.total ?? 0}
          loading={sellers.loading}
          error={sellers.error}
          color="#818CF8" bg="rgba(129,140,248,0.12)"
          icon={Users}
        />
        <StatCard
          label="Магазинов"
          value={stores.data?.total ?? 0}
          loading={stores.loading}
          error={stores.error}
          color="#10B981" bg="rgba(16,185,129,0.12)"
          icon={Store}
        />
        <StatCard
          label="На модерации"
          value={queue.data?.total ?? 0}
          loading={queue.loading}
          error={queue.error}
          color="#F59E0B" bg="rgba(245,158,11,0.12)"
          icon={Clock}
        />
        <StatCard
          label="Заказов"
          value="—"
          loading={false}
          error={null}
          color="#EF4444" bg="rgba(239,68,68,0.12)"
          icon={ShoppingCart}
        />
      </div>

      {/* Recent orders — endpoint not available yet */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>Заказы</div>
        <div style={{ fontSize: 13 }}>Статистика заказов появится здесь</div>
      </div>
    </div>
  )
}
