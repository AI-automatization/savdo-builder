import { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock, MoreHorizontal, UserPlus } from 'lucide-react'

const SELLERS = [
  { id: 1, name: 'Alisher Karimov', phone: '+998901234567', store: 'TechZone UZ', status: 'ACTIVE', joined: '15.03.2026', orders: 312 },
  { id: 2, name: 'Nodira Yusupova', phone: '+998909876543', store: 'Fashion Hub', status: 'PENDING', joined: '28.03.2026', orders: 0 },
  { id: 3, name: 'Bobur Toshmatov', phone: '+998907654321', store: 'Gadgets Pro', status: 'ACTIVE', joined: '10.02.2026', orders: 189 },
  { id: 4, name: 'Malika Rakhimova', phone: '+998901112233', store: 'Books & More', status: 'SUSPENDED', joined: '01.01.2026', orders: 45 },
  { id: 5, name: 'Jasur Mirzayev', phone: '+998905556677', store: 'Sport World', status: 'ACTIVE', joined: '20.03.2026', orders: 77 },
  { id: 6, name: 'Dilnoza Ergasheva', phone: '+998903334455', store: 'Beauty Lab', status: 'PENDING', joined: '31.03.2026', orders: 0 },
]

const STATUS_CFG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  ACTIVE:    { bg: 'rgba(16,185,129,0.12)', text: '#10B981', icon: CheckCircle, label: 'Активный' },
  PENDING:   { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', icon: Clock, label: 'На проверке' },
  SUSPENDED: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', icon: XCircle, label: 'Заблокирован' },
}

const FILTERS = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED']

export default function SellersPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')

  const filtered = SELLERS.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.store.toLowerCase().includes(q)
    const matchFilter = filter === 'ALL' || s.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Продавцы</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {SELLERS.length} продавцов · {SELLERS.filter(s => s.status === 'PENDING').length} на проверке
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, магазину..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, boxSizing: 'border-box',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {FILTERS.map(f => {
            const count = f === 'ALL' ? SELLERS.length : SELLERS.filter(s => s.status === f).length
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                background: filter === f ? 'var(--primary-dim)' : 'var(--surface)',
                color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {f === 'ALL' ? 'Все' : STATUS_CFG[f]?.label}
                <span style={{
                  background: filter === f ? 'rgba(129,140,248,0.2)' : 'var(--surface2)',
                  padding: '1px 6px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
                }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['Продавец', 'Телефон', 'Магазин', 'Заказы', 'Статус', 'Дата', ''].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Ничего не найдено</td></tr>
            ) : filtered.map((s, i) => {
              const cfg = STATUS_CFG[s.status]
              return (
                <tr key={s.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                        background: 'linear-gradient(135deg, #818CF8, #6366F1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color: 'white',
                      }}>
                        {s.name[0]}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 13 }}>{s.phone}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--text)', fontSize: 14 }}>{s.store}</td>
                  <td style={{ padding: '13px 20px', color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{s.orders}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                      background: cfg.bg, color: cfg.text,
                    }}>
                      <cfg.icon size={11} />
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{s.joined}</td>
                  <td style={{ padding: '13px 20px' }}>
                    <button style={{
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', padding: '6px 8px', borderRadius: 8, cursor: 'pointer',
                    }}>
                      <MoreHorizontal size={15} />
                    </button>
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
