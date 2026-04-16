import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Package, ShoppingCart, RefreshCw, AlertCircle, ChevronRight, Search, ShieldCheck } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StoreItem {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  seller: { id: string; fullName: string; verificationStatus: string }
  _count?: { products: number; orders: number }
}
interface StoresResponse { stores: StoreItem[]; total: number }

const STATUS_CFG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'muted'; label: string }> = {
  APPROVED:       { variant: 'success', label: 'Одобрен' },
  PUBLISHED:      { variant: 'success', label: 'Опубликован' },
  PENDING_REVIEW: { variant: 'warning', label: 'На проверке' },
  SUSPENDED:      { variant: 'danger',  label: 'Заблокирован' },
  REJECTED:       { variant: 'danger',  label: 'Отклонён' },
  DRAFT:          { variant: 'muted',   label: 'Черновик' },
}

const FILTERS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED', 'DRAFT'] as const
const FILTER_LABEL: Record<string, string> = {
  ALL: 'Все',
  PENDING_REVIEW: 'На проверке',
  APPROVED: 'Одобрены',
  PUBLISHED: 'Опубликованы',
  SUSPENDED: 'Заблокированы',
  DRAFT: 'Черновики',
}

export default function StoresPage() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const LIMIT = 20

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (filter !== 'ALL') query.set('status', filter)
  const { data, loading, error, refetch } = useFetch<StoresResponse>(
    `/api/v1/admin/stores?${query}`, [page, filter],
  )

  const [localStores, setLocalStores] = useState<StoreItem[]>([])
  useEffect(() => { setLocalStores(data?.stores ?? []) }, [data])

  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  const filtered = search
    ? localStores.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.slug.toLowerCase().includes(search.toLowerCase()) ||
        s.seller?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : localStores

  async function approveStore(storeId: string) {
    setLocalStores(prev => prev.map(s => s.id === storeId ? { ...s, status: 'APPROVED' } : s))
    setActionLoading(storeId)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/stores/${storeId}/approve`, {})
    } catch (e: any) {
      setLocalStores(data?.stores ?? [])
      setActionError(e.message ?? 'Ошибка верификации')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Магазины</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Загрузка...' : `${total} магазинов`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={13} /> Обновить
        </Button>
      </div>

      {/* Error */}
      {(error || actionError) && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-5 text-xs border"
          style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }}>
          <AlertCircle size={13} /> {error ?? actionError}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Название, slug или продавец..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={cn(
                'px-3 h-8 rounded-md text-xs font-medium transition-colors border',
                filter === f
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'border-transparent hover:bg-white/5',
              )}
            >
              {FILTER_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {['Магазин', 'Продавец', 'Статус', 'Товары', 'Заказы', 'Зарегистрирован', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Ничего не найдено</td></tr>
            ) : filtered.map((s, i) => {
              const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.DRAFT

              return (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/stores/${s.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Store name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: 'var(--primary-dim)' }}>
                        <Store size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                      <div>
                        <div className="font-medium" style={{ color: 'var(--text)' }}>{s.name}</div>
                        <div className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>/{s.slug}</div>
                      </div>
                    </div>
                  </td>

                  {/* Seller */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.seller?.fullName || '—'}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>

                  {/* Products */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Package size={12} style={{ color: 'var(--text-dim)' }} />
                      {s._count?.products ?? '—'}
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <ShoppingCart size={12} style={{ color: 'var(--text-dim)' }} />
                      {s._count?.orders ?? '—'}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {s.status === 'PENDING_REVIEW' && (
                        <button
                          disabled={actionLoading === s.id}
                          onClick={(e) => { e.stopPropagation(); approveStore(s.id) }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                            cursor: actionLoading === s.id ? 'not-allowed' : 'pointer',
                            opacity: actionLoading === s.id ? 0.5 : 1,
                            border: '1px solid rgba(16,185,129,0.35)',
                            background: 'rgba(16,185,129,0.08)',
                            color: '#10B981',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <ShieldCheck size={12} />
                          Верифицировать
                        </button>
                      )}
                      <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Стр. {page} из {totalPages} · {total} магазинов
            </span>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Назад</Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Вперёд →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
