import { useState } from 'react'
import { Package, Eye, EyeOff, AlertCircle, Search, RefreshCw, Archive } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface ProductImage { url: string }
interface Product {
  id: string
  storeId: string
  title: string
  status: string
  basePrice: number
  currencyCode: string
  createdAt: string
  images: ProductImage[]
}

interface ProductsResponse {
  products: Product[]
  total: number
}

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  ACTIVE:          { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Активен' },
  DRAFT:           { bg: 'rgba(107,114,128,0.12)', text: '#6B7280', label: 'Черновик' },
  ARCHIVED:        { bg: 'rgba(107,114,128,0.12)', text: '#6B7280', label: 'Архив' },
  HIDDEN_BY_ADMIN: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', label: 'Скрыт' },
}

function price(val: number, currency: string) {
  return new Intl.NumberFormat('ru-RU').format(val) + ' ' + currency
}

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const query = statusFilter ? `status=${statusFilter}&limit=50` : 'limit=50'
  const { data, loading, error, refetch } = useFetch<ProductsResponse>(`/api/v1/admin/products?${query}`, [statusFilter])

  const products = (data?.products ?? []).filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)
  )

  async function toggleHide(product: Product) {
    const isHidden = product.status === 'HIDDEN_BY_ADMIN'
    const endpoint = isHidden
      ? `/api/v1/admin/products/${product.id}/restore`
      : `/api/v1/admin/products/${product.id}/hide`

    setActionLoading(product.id)
    setActionError(null)
    try {
      await api.patch(endpoint, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  async function archiveProduct(product: Product) {
    setActionLoading(product.id)
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/products/${product.id}/archive`, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Товары</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `${data?.total ?? 0} товаров`}
          </p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
          />
        </div>
        {(['', 'ACTIVE', 'HIDDEN_BY_ADMIN', 'DRAFT', 'ARCHIVED'] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`,
            background: statusFilter === s ? 'var(--primary-dim)' : 'var(--surface)',
            color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {s === '' ? 'Все' : STATUS_CFG[s]?.label ?? s}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={14} /> {error ?? actionError}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Товар', 'Статус', 'Цена', 'ID', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Нет товаров</td></tr>
            ) : products.map(p => {
              const cfg = STATUS_CFG[p.status] ?? { bg: 'var(--surface2)', text: 'var(--text-muted)', label: p.status }
              const isHidden = p.status === 'HIDDEN_BY_ADMIN'
              const isArchived = p.status === 'ARCHIVED'
              const isProcessing = actionLoading === p.id

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: isProcessing ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.images[0] ? (
                        <img src={p.images[0].url} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: 'var(--surface2)' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={16} color="var(--text-muted)" />
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.text }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>
                    {price(p.basePrice, p.currencyCode)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                    {p.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        disabled={isProcessing}
                        onClick={() => toggleHide(p)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          border: isHidden ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                          background: isHidden ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          color: isHidden ? '#10B981' : '#EF4444',
                        }}
                      >
                        {isHidden ? <><Eye size={13} /> Восстановить</> : <><EyeOff size={13} /> Скрыть</>}
                      </button>
                      {!isArchived && (
                        <button
                          disabled={isProcessing}
                          onClick={() => archiveProduct(p)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            border: '1px solid rgba(148,163,184,0.3)',
                            background: 'rgba(148,163,184,0.06)',
                            color: '#94A3B8',
                          }}
                        >
                          <Archive size={13} /> В архив
                        </button>
                      )}
                    </div>
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
