import { ScrollText, Search } from 'lucide-react'
import { useState } from 'react'

const LOGS = [
  { id: 1, action: 'SELLER_APPROVED', actor: 'polat@savdo', target: 'Alisher Karimov', ip: '195.158.18.x', time: '01.04.2026 11:32', comment: '' },
  { id: 2, action: 'STORE_REJECTED',  actor: 'polat@savdo', target: 'Bad Store', ip: '195.158.18.x', time: '01.04.2026 10:15', comment: 'Нарушение правил' },
  { id: 3, action: 'USER_SUSPENDED',  actor: 'polat@savdo', target: 'Suspicious User', ip: '195.158.18.x', time: '31.03.2026 18:00', comment: 'Брутфорс 20 попыток' },
  { id: 4, action: 'SELLER_APPROVED', actor: 'polat@savdo', target: 'Nodira Yusupova', ip: '195.158.18.x', time: '30.03.2026 14:22', comment: '' },
  { id: 5, action: 'STORE_APPROVED',  actor: 'polat@savdo', target: 'TechZone UZ', ip: '195.158.18.x', time: '15.03.2026 09:00', comment: '' },
  { id: 6, action: 'USER_UNSUSPENDED',actor: 'polat@savdo', target: 'Test Account', ip: '195.158.18.x', time: '14.03.2026 17:45', comment: 'Подтверждена ошибка' },
]

const ACTION_CFG: Record<string, { color: string; bg: string }> = {
  SELLER_APPROVED:  { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  SELLER_REJECTED:  { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  STORE_APPROVED:   { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  STORE_REJECTED:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  USER_SUSPENDED:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  USER_UNSUSPENDED: { color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('')
  const filtered = LOGS.filter(l =>
    l.action.includes(search.toUpperCase()) ||
    l.actor.includes(search) ||
    l.target.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Аудит-лог</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
          История всех действий администраторов
        </p>
      </div>

      <div style={{ position: 'relative', maxWidth: 380, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Фильтр по действию, исполнителю..."
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
              {['Действие', 'Исполнитель', 'Объект', 'Комментарий', 'IP', 'Время'].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => {
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
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text)', fontSize: 13 }}>{log.actor}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{log.target}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 13, fontStyle: log.comment ? 'normal' : 'italic' }}>
                    {log.comment || '—'}
                  </td>
                  <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>{log.ip}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{log.time}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
