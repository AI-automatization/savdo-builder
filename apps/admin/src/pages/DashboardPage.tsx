import { TrendingUp, TrendingDown, Users, Store, ShoppingCart, DollarSign, Activity, ArrowUpRight } from 'lucide-react'

const STATS = [
  { label: 'Продавцов', value: '1,248', delta: '+12%', up: true, icon: Users, color: '#818CF8', bg: 'rgba(129,140,248,0.12)' },
  { label: 'Магазинов', value: '986', delta: '+8%', up: true, icon: Store, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { label: 'Заказов', value: '8,429', delta: '+23%', up: true, icon: ShoppingCart, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { label: 'Выручка', value: '$142K', delta: '-3%', up: false, icon: DollarSign, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
]

const ORDERS = [
  { id: '#8429', store: 'TechZone UZ', buyer: '+998901234567', amount: '$120', status: 'DELIVERED' },
  { id: '#8428', store: 'Fashion Hub', buyer: '+998909876543', amount: '$45', status: 'PENDING' },
  { id: '#8427', store: 'Gadgets Pro', buyer: '+998907654321', amount: '$380', status: 'PROCESSING' },
  { id: '#8426', store: 'Books & More', buyer: '+998901112233', amount: '$22', status: 'CANCELLED' },
  { id: '#8425', store: 'Sport World', buyer: '+998905556677', amount: '$95', status: 'DELIVERED' },
]

const S: Record<string, { bg: string; text: string; label: string }> = {
  DELIVERED:  { bg: 'rgba(16,185,129,0.12)', text: '#10B981', label: 'Доставлен' },
  PENDING:    { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: 'Ожидание' },
  PROCESSING: { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Обработка' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: 'Отменён' },
}

export default function DashboardPage() {
  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
          Обзор платформы — 1 апреля 2026
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {STATS.map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '22px 20px 18px',
            transition: 'border-color 0.2s, transform 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = s.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={20} color={s.color} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
                color: s.up ? '#10B981' : '#EF4444',
                background: s.up ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                padding: '3px 8px', borderRadius: 20,
              }}>
                {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {s.delta}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1, letterSpacing: '-1px' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={17} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>Последние заказы</span>
          </div>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
            color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500,
          }}>
            Все заказы <ArrowUpRight size={13} />
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)' }}>
              {['ID', 'Магазин', 'Покупатель', 'Сумма', 'Статус'].map(h => (
                <th key={h} style={{
                  padding: '10px 24px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((o, i) => (
              <tr key={o.id}
                style={{ borderBottom: i < ORDERS.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '14px 24px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}>{o.id}</td>
                <td style={{ padding: '14px 24px', color: 'var(--text)', fontWeight: 500 }}>{o.store}</td>
                <td style={{ padding: '14px 24px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13 }}>{o.buyer}</td>
                <td style={{ padding: '14px 24px', color: 'var(--text)', fontWeight: 700 }}>{o.amount}</td>
                <td style={{ padding: '14px 24px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: S[o.status]?.bg, color: S[o.status]?.text,
                  }}>{S[o.status]?.label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
