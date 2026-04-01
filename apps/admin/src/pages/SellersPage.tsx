import { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock, MoreHorizontal, RefreshCw, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'

interface Seller {
  id: string
  fullName: string
  bio: string | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  isBlocked: boolean
  blockedReason: string | null
  createdAt: string
  user: { id: string; phone: string; status: string }
}

interface SellersResponse {
  sellers: Seller[]
  total: number
}

const STATUS_CFG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  VERIFIED:  { bg: 'rgba(16,185,129,0.12)', text: '#10B981', icon: CheckCircle, label: 'Проверен' },
  PENDING:   { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', icon: Clock,       label: 'На проверке' },
  REJECTED:  { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', icon: XCircle,     label: 'Отклонён' },
}

export default function SellersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (filter !== 'ALL') query.set('verificationStatus', filter)
  const { data, loading, error, refetch } = useFetch<SellersResponse>(`/api/v1/admin/sellers?${query}`, [page, filter])

  const sellers = data?.sellers ?? []
  const total = data?.total ?? 0

  const filtered = search
    ? sellers.filter(s =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.user.phone.includes(search)
      )
    : sellers

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Продавцы</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `${total} продавцов`}
          </p>
        </div>
        <button onClick={refetch} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--surface)',
          color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
        }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} style={{
            padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
            background: filter === f ? 'var(--primary-dim)' : 'var(--surface)',
            color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {f === 'ALL' ? 'Все' : STATUS_CFG[f]?.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['Продавец', 'Телефон', 'Статус верификации', 'Аккаунт', 'Дата', ''].map(h => (
                <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>Ничего не найдено</td></tr>
            ) : filtered.map((s, i) => {
              const cfg = s.isBlocked
                ? { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', icon: XCircle, label: 'Заблокирован' }
                : STATUS_CFG[s.verificationStatus] ?? STATUS_CFG.PENDING
              return (
                <tr key={s.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg, #818CF8, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white' }}>
                        {s.fullName?.[0] ?? '?'}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{s.fullName || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 13 }}>{s.user.phone}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.text }}>
                      <cfg.icon size={11} /> {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.user.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: s.user.status === 'ACTIVE' ? '#10B981' : '#EF4444' }}>
                      {s.user.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <button style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 8px', borderRadius: 8, cursor: 'pointer' }}>
                      <MoreHorizontal size={15} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {total > 20 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Страница {page} · {total} всего
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, fontSize: 13 }}>←</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', cursor: page * 20 >= total ? 'not-allowed' : 'pointer', opacity: page * 20 >= total ? 0.5 : 1, fontSize: 13 }}>→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
