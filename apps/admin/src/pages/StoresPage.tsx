import { useState } from 'react'
import { Store, Eye, Package, RefreshCw, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'

interface StoreItem {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  seller: { id: string; fullName: string; verificationStatus: string }
  _count?: { products: number; orders: number }
}

interface StoresResponse {
  stores: StoreItem[]
  total: number
}

const STATUS_CFG: Record<string, { bg: string; text: string; label: string; border: string }> = {
  APPROVED:       { bg: 'rgba(16,185,129,0.1)',  text: '#10B981', label: 'Одобрен',      border: 'rgba(16,185,129,0.2)' },
  PENDING_REVIEW: { bg: 'rgba(245,158,11,0.1)',  text: '#F59E0B', label: 'На проверке',  border: 'rgba(245,158,11,0.2)' },
  SUSPENDED:      { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444', label: 'Заблокирован', border: 'rgba(239,68,68,0.2)' },
  DRAFT:          { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', label: 'Черновик',     border: 'rgba(148,163,184,0.2)' },
  REJECTED:       { bg: 'rgba(239,68,68,0.1)',   text: '#EF4444', label: 'Отклонён',     border: 'rgba(239,68,68,0.2)' },
  PUBLISHED:      { bg: 'rgba(16,185,129,0.1)',  text: '#10B981', label: 'Опубликован',  border: 'rgba(16,185,129,0.2)' },
}

export default function StoresPage() {
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (filter !== 'ALL') query.set('status', filter)
  const { data, loading, error, refetch } = useFetch<StoresResponse>(`/api/v1/admin/stores?${query}`, [page, filter])

  const stores = data?.stores ?? []
  const total = data?.total ?? 0

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Магазины</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `${total} магазинов`}
          </p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['ALL', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED', 'DRAFT'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1) }} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
            background: filter === f ? 'var(--primary-dim)' : 'var(--surface)',
            color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {f === 'ALL' ? 'Все' : STATUS_CFG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {stores.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Магазины не найдены
            </div>
          ) : stores.map(s => {
            const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.DRAFT
            return (
              <div key={s.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, padding: 22, cursor: 'default', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(129,140,248,0.5)'; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.3)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'none'; el.style.boxShadow = 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Store size={22} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{s.slug}</div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                  Продавец: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{s.seller?.fullName || '—'}</span>
                  <span style={{ color: 'var(--border)', margin: '0 6px' }}>·</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(s.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
                {s._count && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={15} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s._count.products}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>товаров</div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={15} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s._count.orders}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>заказов</div>
                      </div>
                    </div>
                  </div>
                )}
                <button style={{ width: '100%', padding: '9px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s, color 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
                >
                  <Eye size={14} /> Открыть
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
