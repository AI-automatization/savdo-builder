import { ShoppingCart, Search } from 'lucide-react'
import { useState } from 'react'

const S: Record<string, { bg: string; text: string; label: string }> = {
  DELIVERED:  { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Доставлен' },
  PENDING:    { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Ожидание' },
  PROCESSING: { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Обработка' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)',  text: '#EF4444', label: 'Отменён' },
}

export default function OrdersPage() {
  const [search, setSearch] = useState('')

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Заказы</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Управление заказами платформы</p>
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
            <tr>
              <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingCart size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Заказов пока нет</div>
                <div style={{ fontSize: 13 }}>Здесь появятся заказы когда покупатели начнут оформлять</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
