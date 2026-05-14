import { ScrollText, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { useFetch } from '../lib/hooks'
import { PaginationBar } from '../components/admin/PaginationBar'

interface AuditLog {
  id: string
  actorUserId: string
  actorType: string
  action: string
  entityType: string
  entityId: string
  payload: Record<string, any>
  createdAt: string
}

interface AuditLogResponse {
  logs: AuditLog[]
  total: number
}

const ACTION_CFG: Record<string, { color: string; bg: string }> = {
  'moderation.approve':     { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  'moderation.reject':      { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  'moderation.escalate':    { color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
  'moderation.request_changes': { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  'user.suspend':           { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  'user.unsuspend':         { color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
  'store.suspend':          { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  'store.unsuspend':        { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error, refetch } = useFetch<AuditLogResponse>(
    `/api/v1/admin/audit-log?page=${page}&limit=20`,
    [page],
  )

  const logs = data?.logs ?? []
  const total = data?.total ?? 0

  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.entityType.toLowerCase().includes(search.toLowerCase()) ||
        l.actorUserId.toLowerCase().includes(search.toLowerCase())
      )
    : logs

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Аудит-лог</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `${total} записей`}
          </p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'var(--surface-error)', border: '1px solid var(--border-error-soft)', color: 'var(--error)', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Фильтр по действию, типу объекта..."
          style={{
            width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, boxSizing: 'border-box',
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 14, outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['Действие', 'Тип объекта', 'ID объекта', 'Актор', 'Тип', 'Время'].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {total === 0 ? <><ScrollText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />Аудит-лог пуст</> : 'Ничего не найдено'}
              </td></tr>
            ) : filtered.map((log, i) => {
              const cfg = ACTION_CFG[log.action] ?? { color: 'var(--text-muted)', bg: 'var(--surface2)' }
              return (
                <tr key={log.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      fontFamily: 'monospace', background: cfg.bg, color: cfg.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
                    {log.entityType}
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace', maxWidth: 140 }}>
                    <span title={log.entityId}>{log.entityId.slice(0, 12)}...</span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace', maxWidth: 140 }}>
                    <span title={log.actorUserId}>{log.actorUserId.slice(0, 12)}...</span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                      {log.actorType}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {total > 20 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
            <PaginationBar
              page={page}
              totalPages={Math.ceil(total / 20)}
              total={total}
              itemsLabel="записей"
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
