import { ShoppingCart, Search, Filter } from 'lucide-react'
import { useState } from 'react'

const ORDERS = [
  { id: '#8429', store: 'TechZone UZ', buyer: '+998901234567', items: 3, amount: '$120', status: 'DELIVERED', date: '01.04.2026 11:32' },
  { id: '#8428', store: 'Fashion Hub', buyer: '+998909876543', items: 1, amount: '$45', status: 'PENDING', date: '01.04.2026 10:15' },
  { id: '#8427', store: 'Gadgets Pro', buyer: '+998907654321', items: 2, amount: '$380', status: 'PROCESSING', date: '31.03.2026 18:00' },
  { id: '#8426', store: 'Books & More', buyer: '+998901112233', items: 1, amount: '$22', status: 'CANCELLED', date: '31.03.2026 14:22' },
  { id: '#8425', store: 'Sport World', buyer: '+998905556677', items: 4, amount: '$95', status: 'DELIVERED', date: '30.03.2026 09:11' },
  { id: '#8424', store: 'TechZone UZ', buyer: '+998901234567', items: 1, amount: '$55', status: 'DELIVERED', date: '29.03.2026 16:44' },
  { id: '#8423', store: 'Gadgets Pro', buyer: '+998903334455', items: 2, amount: '$210', status: 'PROCESSING', date: '29.03.2026 12:30' },
]

const S: Record<string, { bg: string; text: string; label: string }> = {
  DELIVERED:  { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Доставлен' },
  PENDING:    { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Ожидание' },
  PROCESSING: { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Обработка' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Отменён' },
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')
  const filtered = ORDERS.filter(o =>
    o.id.includes(search) || o.store.toLowerCase().includes(search.toLowerCase()) || o.buyer.includes(search)
  )

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Заказы</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
          {ORDERS.length} заказов всего
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по ID, магазину, телефону..."
            style={{
              width: '100%', padding: '10px 14px 10px 36px', borderRadius: 10, boxSizing: 'border-box',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14, outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Магазин', 'Покупатель', 'Позиции', 'Сумма', 'Статус', 'Дата'].map(h => (
                <th key={h} style={{
                  padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((o, i) => (
              <tr key={o.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700, fontSize: 13 }}>{o.id}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text)', fontWeight: 500 }}>{o.store}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13 }}>{o.buyer}</td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{o.items} шт.</td>
                <td style={{ padding: '14px 20px', color: 'var(--text)', fontWeight: 700 }}>{o.amount}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: S[o.status]?.bg, color: S[o.status]?.text }}>
                    {S[o.status]?.label}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 13 }}>{o.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
