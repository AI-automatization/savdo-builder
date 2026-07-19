import { useState, useEffect } from 'react'
import { Package, Eye, EyeOff, AlertCircle, Search, RefreshCw, Archive, Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { useTranslation } from '../lib/i18n/I18nProvider'
import { TableSkeletonRows } from '@/components/ui/skeleton'

interface ProductImage { url: string }
interface ProductStoreRef { id: string; name: string }
interface Product {
  id: string
  storeId: string
  // P2-6 (audit 2026-06-04): backend пока не возвращает store (см. logs.md
  // ADMIN-PRODUCTS-NO-STORE-FIELD). Поле optional — UI работает как до фикса,
  // а после backend-доработки сразу подхватит имя без правок здесь.
  store?: ProductStoreRef | null
  storeName?: string | null
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE:          { bg: 'rgba(16,185,129,0.12)',  text: '#10B981' },
  DRAFT:           { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
  ARCHIVED:        { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
  HIDDEN_BY_ADMIN: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444' },
}

function price(val: number, currency: string) {
  return new Intl.NumberFormat('ru-RU').format(val) + ' ' + currency
}

export default function ProductsPage() {
  const { t } = useTranslation()
  const [statusFilter, setStatusFilter] = useState('')
  // FRONT-SERVER-SEARCH (18.07.2026): поиск ушёл на сервер (PERF-API-001,
  // GET /admin/products?search= по title/description) — клиентский filter
  // видел только загруженные 50 строк. Debounce-паттерн как в SellersPage.
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  // P1-4 (audit 2026-06-04): toggle soft-deleted, иначе UI=7 vs DB=26 (19 удалённых).
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const STATUS_LABELS: Record<string, string> = {
    ACTIVE: t('products.statusActive'),
    DRAFT: t('products.statusDraft'),
    ARCHIVED: t('products.statusArchived'),
    HIDDEN_BY_ADMIN: t('products.statusHidden'),
  }

  const STATUS_FILTERS = ['', 'ACTIVE', 'HIDDEN_BY_ADMIN', 'DRAFT', 'ARCHIVED'] as const

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const params: string[] = ['limit=50']
  if (statusFilter) params.push(`status=${statusFilter}`)
  if (includeDeleted) params.push('includeDeleted=true')
  if (search) params.push(`search=${encodeURIComponent(search)}`)
  const query = params.join('&')
  const { data, loading, error, refetch } = useFetch<ProductsResponse>(`/api/v1/admin/products?${query}`, [statusFilter, includeDeleted, search])

  const [localProducts, setLocalProducts] = useState<Product[]>([])
  useEffect(() => { setLocalProducts(data?.products ?? []) }, [data])

  const products = localProducts

  async function toggleHide(product: Product) {
    const isHidden = product.status === 'HIDDEN_BY_ADMIN'
    const endpoint = isHidden
      ? `/api/v1/admin/products/${product.id}/restore`
      : `/api/v1/admin/products/${product.id}/hide`
    const newStatus = isHidden ? 'ACTIVE' : 'HIDDEN_BY_ADMIN'

    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
    setActionLoading(product.id)
    setActionError(null)
    try {
      await api.patch(endpoint, {})
    } catch (e: any) {
      setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: product.status } : p))
      setActionError(e.message ?? t('common.error'))
    } finally {
      setActionLoading(null)
    }
  }

  async function archiveProduct(product: Product) {
    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: 'ARCHIVED' } : p))
    setActionLoading(product.id)
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/products/${product.id}/archive`, {})
    } catch (e: any) {
      setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: product.status } : p))
      setActionError(e.message ?? t('common.error'))
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteProduct(productId: string) {
    setConfirmDelete(null)
    setLocalProducts(prev => prev.filter(p => p.id !== productId))
    setActionLoading(productId)
    setActionError(null)
    try {
      await api.delete(`/api/v1/admin/products/${productId}`)
    } catch (e: any) {
      setLocalProducts(data?.products ?? [])
      setActionError(e.message ?? t('common.error'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>{t('products.title')}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? t('common.loading') : t('products.count', { count: data?.total ?? 0 })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* P2-8 (audit 2026-06-04): placeholder-кнопка. Endpoint POST /admin/products
              ещё не реализован (см. analiz/logs.md → ADMIN-PRODUCTS-NO-CREATE-ENDPOINT).
              По клику — toast с инструкцией (раньше блокирующий alert(), 29.06). */}
          <button
            onClick={() => toast.info(t('products.createSoonAlert'))}
            title={t('products.createSoonTitle')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--primary)',
              background: 'var(--primary-dim)',
              color: 'var(--primary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              opacity: 0.85,
            }}
          >
            <Plus size={14} /> {t('products.createBtn')}
          </button>
          <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            <RefreshCw size={14} /> {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            aria-label={t('products.searchPlaceholder')}
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
          />
        </div>
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`,
            background: statusFilter === s ? 'var(--primary-dim)' : 'var(--surface)',
            color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)',
          }}>
            {s === '' ? t('common.all') : STATUS_LABELS[s] ?? s}
          </button>
        ))}
        {/* P1-4 (audit 2026-06-04): toggle soft-deleted — синхронизация с разделом «База данных». */}
        <button
          onClick={() => setIncludeDeleted(v => !v)}
          title="includeDeleted"
          style={{
            padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: `1px solid ${includeDeleted ? 'rgba(239,68,68,0.5)' : 'var(--border)'}`,
            background: includeDeleted ? 'rgba(239,68,68,0.1)' : 'var(--surface)',
            color: includeDeleted ? '#EF4444' : 'var(--text-muted)',
            marginLeft: 'auto',
          }}>
          {includeDeleted ? t('products.withDeleted') : t('products.showDeleted')}
        </button>
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
              {[t('products.colProduct'), t('products.colStore'), t('products.colStatus'), t('products.colPrice'), t('products.colId'), ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={8} cols={6} />
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('products.noProducts')}</td></tr>
            ) : products.map(p => {
              const colors = STATUS_COLORS[p.status] ?? { bg: 'var(--surface2)', text: 'var(--text-muted)' }
              const label = STATUS_LABELS[p.status] ?? p.status
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
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                    {p.store?.name ?? p.storeName ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: colors.bg, color: colors.text }}>
                      {label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text)', fontFamily: 'monospace', fontSize: 13 }}>
                    {price(p.basePrice, p.currencyCode)}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>
                    {p.id.slice(0, 8)}…
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
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
                        {isHidden ? <><Eye size={13} /> {t('products.restore')}</> : <><EyeOff size={13} /> {t('products.hide')}</>}
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
                          <Archive size={13} /> {t('products.archive')}
                        </button>
                      )}
                      {confirmDelete === p.id ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            disabled={isProcessing}
                            onClick={() => deleteProduct(p.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              border: '1px solid rgba(239,68,68,0.5)',
                              background: 'rgba(239,68,68,0.15)',
                              color: '#EF4444',
                            }}
                          >
                            {t('products.deleteConfirm')}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{
                              padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {t('common.cancel')}
                          </button>
                        </span>
                      ) : (
                        <button
                          disabled={isProcessing}
                          onClick={() => setConfirmDelete(p.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            border: '1px solid rgba(239,68,68,0.25)',
                            background: 'rgba(239,68,68,0.05)',
                            color: '#EF4444',
                          }}
                        >
                          <Trash2 size={13} /> {t('common.delete')}
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
