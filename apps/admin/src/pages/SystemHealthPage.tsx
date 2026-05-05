import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface HealthCheck {
  ok: boolean
  latencyMs: number
  error?: string
  configured?: boolean
}

interface SystemHealth {
  status: 'ok' | 'degraded' | 'down'
  uptime: number
  timestamp: string
  checks: {
    database: HealthCheck
    redis: HealthCheck
    storage: HealthCheck
  }
  metrics: {
    nodeVersion: string
    memoryMb: number
    rssMb: number
  }
  features: Record<string, boolean>
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

const STATUS_BG: Record<SystemHealth['status'], string> = {
  ok:       'rgba(52,211,153,0.15)',
  degraded: 'rgba(251,191,36,0.15)',
  down:     'rgba(239,68,68,0.15)',
}
const STATUS_FG: Record<SystemHealth['status'], string> = {
  ok:       '#34d399',
  degraded: '#fbbf24',
  down:     '#ef4444',
}
const STATUS_LABEL: Record<SystemHealth['status'], string> = {
  ok:       'Все системы работают',
  degraded: 'Частичная деградация',
  down:     'Критический сбой',
}

export default function SystemHealthPage() {
  const [data, setData] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchHealth = async () => {
    try {
      const res = await api.get<SystemHealth>('/admin/system/health')
      setData(res)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось получить health')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    if (!autoRefresh) return
    const t = setInterval(fetchHealth, 10_000)
    return () => clearInterval(t)
  }, [autoRefresh])

  if (loading && !data) {
    return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Загрузка...</div>
  }

  if (error && !data) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: 'var(--danger, #ef4444)' }}>⚠ {error}</p>
        <button onClick={fetchHealth} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text)' }}>↻ Повторить</button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header + status banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>System Health</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Обновлено: {new Date(data.timestamp).toLocaleTimeString('ru')} · Auto-refresh каждые 10s
          </p>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh
        </label>
      </div>

      <div style={{ background: STATUS_BG[data.status], border: `1px solid ${STATUS_FG[data.status]}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: STATUS_FG[data.status], boxShadow: `0 0 12px ${STATUS_FG[data.status]}` }} />
        <span style={{ fontWeight: 700, fontSize: 16, color: STATUS_FG[data.status] }}>{STATUS_LABEL[data.status]}</span>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>Uptime: {formatUptime(data.uptime)}</span>
      </div>

      {/* Health checks grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <HealthCard title="🗄  Database (Postgres)" check={data.checks.database} />
        <HealthCard title="⚡  Redis"               check={data.checks.redis} />
        <HealthCard title="📦  Storage (Supabase S3)" check={data.checks.storage} configurable />
      </div>

      {/* Metrics */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: 12 }}>Server Metrics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          <Metric label="Node.js"      value={data.metrics.nodeVersion} />
          <Metric label="Heap"          value={`${data.metrics.memoryMb} MB`} />
          <Metric label="RSS"           value={`${data.metrics.rssMb} MB`} />
          <Metric label="Uptime"        value={formatUptime(data.uptime)} />
        </div>
      </section>

      {/* Feature flags */}
      <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0, marginBottom: 12 }}>Active Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
          {Object.entries(data.features).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: v ? '#34d399' : 'var(--border)' }} />
              <span>{k}</span>
              <span style={{ marginLeft: 'auto', color: v ? '#34d399' : 'var(--text-muted)', fontWeight: 600 }}>{v ? 'ON' : 'OFF'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function HealthCard({ title, check, configurable }: { title: string; check: HealthCheck; configurable?: boolean }) {
  const ok = check.ok || (configurable && check.configured)
  const color = ok ? '#34d399' : configurable && !check.configured ? '#fbbf24' : '#ef4444'
  const label = configurable && !check.configured ? 'Не настроен' : ok ? 'OK' : 'Сбой'

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: 12, padding: 16, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 0 }}>{title}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color, margin: '6px 0' }}>{label}</p>
      {check.latencyMs !== undefined && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latency: {check.latencyMs}ms</p>
      )}
      {check.error && (
        <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>⚠ {check.error.slice(0, 80)}</p>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '4px 0 0' }}>{value}</p>
    </div>
  )
}
