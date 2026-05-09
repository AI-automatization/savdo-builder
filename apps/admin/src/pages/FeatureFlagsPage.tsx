import { useEffect, useState } from 'react'
import { api } from '../lib/api'

interface FeatureFlag {
  key: string
  label: string
  value: boolean
  envOverridable: boolean
  locked?: boolean
  reason?: string
}

interface FlagsResponse {
  flags: FeatureFlag[]
  note: string
}

export default function FeatureFlagsPage() {
  const [data, setData] = useState<FlagsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<FlagsResponse>('/api/v1/admin/system/feature-flags')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Загрузка...</div>
  if (error)   return <div style={{ padding: 24, color: '#ef4444' }}>⚠ {error}</div>
  if (!data)   return null

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Feature Flags</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
          Управляющие флаги платформы — какие фичи включены прямо сейчас в продакшене.
        </p>
      </div>

      <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.30)', borderRadius: 10, padding: 12, fontSize: 12, color: '#fbbf24' }}>
        ℹ {data.note}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.flags.map((flag) => (
          <FlagRow key={flag.key} flag={flag} />
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, fontSize: 12, color: 'var(--text-muted)' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Как изменить флаг:</p>
        <ol style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
          <li>Railway Dashboard → savdo-api → Variables</li>
          <li>Найти переменную (напр. <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>STORE_APPROVAL_REQUIRED</code>)</li>
          <li>Изменить на <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>true</code> или <code style={{ background: 'var(--bg)', padding: '2px 6px', borderRadius: 4 }}>false</code></li>
          <li>Save → api перезапустится автоматически (~30 сек)</li>
          <li>Refresh эту страницу — увидишь новое значение</li>
        </ol>
      </div>
    </div>
  )
}

function FlagRow({ flag }: { flag: FeatureFlag }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        opacity: flag.locked ? 0.6 : 1,
      }}
    >
      <Toggle on={flag.value} disabled />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
          {flag.label}
          {flag.locked && <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 6px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 4 }}>LOCKED</span>}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', fontFamily: 'monospace' }}>{flag.key}</p>
        {flag.reason && (
          <p style={{ fontSize: 11, color: '#fbbf24', margin: '4px 0 0' }}>⚠ {flag.reason}</p>
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 10px',
          borderRadius: 6,
          background: flag.value ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.04)',
          color: flag.value ? '#34d399' : 'var(--text-muted)',
        }}
      >
        {flag.value ? 'ENABLED' : 'DISABLED'}
      </span>
    </div>
  )
}

function Toggle({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <div
      style={{
        width: 36,
        height: 22,
        borderRadius: 11,
        background: on ? '#34d399' : 'rgba(255,255,255,0.10)',
        position: 'relative',
        flexShrink: 0,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: on ? 16 : 2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.18s',
        }}
      />
    </div>
  )
}
