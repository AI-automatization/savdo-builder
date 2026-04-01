import { Store, Eye, Package, ShoppingCart } from 'lucide-react'

const STORES = [
  { id: 1, name: 'TechZone UZ', slug: 'techzone-uz', seller: 'Alisher Karimov', products: 48, orders: 312, status: 'APPROVED', joined: '15.03.2026' },
  { id: 2, name: 'Fashion Hub', slug: 'fashion-hub', seller: 'Nodira Yusupova', products: 95, orders: 0, status: 'PENDING_REVIEW', joined: '28.03.2026' },
  { id: 3, name: 'Gadgets Pro', slug: 'gadgets-pro', seller: 'Bobur Toshmatov', products: 27, orders: 189, status: 'APPROVED', joined: '10.02.2026' },
  { id: 4, name: 'Books & More', slug: 'books-more', seller: 'Malika Rakhimova', products: 0, orders: 45, status: 'SUSPENDED', joined: '01.01.2026' },
  { id: 5, name: 'Sport World', slug: 'sport-world', seller: 'Jasur Mirzayev', products: 63, orders: 77, status: 'APPROVED', joined: '20.03.2026' },
  { id: 6, name: 'Beauty Lab', slug: 'beauty-lab', seller: 'Dilnoza Ergasheva', products: 0, orders: 0, status: 'DRAFT', joined: '31.03.2026' },
]

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; border: string }> = {
  APPROVED:       { bg: 'rgba(16,185,129,0.1)',  text: '#10B981', label: 'Одобрен',      border: 'rgba(16,185,129,0.2)' },
  PENDING_REVIEW: { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B', label: 'На проверке',  border: 'rgba(245,158,11,0.2)' },
  SUSPENDED:      { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444', label: 'Заблокирован', border: 'rgba(239,68,68,0.2)' },
  DRAFT:          { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', label: 'Черновик',     border: 'rgba(148,163,184,0.2)' },
  REJECTED:       { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444', label: 'Отклонён',     border: 'rgba(239,68,68,0.2)' },
}

export default function StoresPage() {
  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Магазины</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
          {STORES.length} магазинов · {STORES.filter(s => s.status === 'APPROVED').length} активных
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {STORES.map(s => {
          const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.DRAFT
          return (
            <div key={s.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 16, padding: 22, cursor: 'default',
              transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(129,140,248,0.5)'
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--border)'
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
              }}
            >
              {/* Top */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                    background: 'var(--primary-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Store size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{s.slug}</div>
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                  whiteSpace: 'nowrap',
                }}>
                  {cfg.label}
                </span>
              </div>

              {/* Seller */}
              <div style={{
                fontSize: 13, color: 'var(--text-muted)', marginBottom: 16,
                padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8,
              }}>
                Продавец: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{s.seller}</span>
                <span style={{ color: 'var(--border)', margin: '0 6px' }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>{s.joined}</span>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                <div style={{
                  background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Package size={16} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s.products}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>товаров</div>
                  </div>
                </div>
                <div style={{
                  background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ShoppingCart size={16} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s.orders}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>заказов</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <button style={{
                width: '100%', padding: '9px', borderRadius: 10,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'background 0.15s, color 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
              >
                <Eye size={14} /> Открыть магазин
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
