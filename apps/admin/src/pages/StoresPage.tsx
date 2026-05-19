import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, Package, ShoppingCart, RefreshCw, AlertCircle, ChevronRight, Search, ShieldCheck, BadgeCheck } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { api } from '../lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PaginationBar } from '../components/admin/PaginationBar'

interface StoreItem {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  seller: { id: string; fullName: string; verificationStatus: string }
  _count?: { products: number; orders: number }
  // MARKETING-VERIFIED-SELLER-001
  isVerified?: boolean
  avgRating?: number | string | null
  reviewCount?: number
}
interface StoresResponse { stores: StoreItem[]; total: number }

const STATUS_CFG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'muted'; labelKey: string }> = {
  APPROVED:       { variant: 'success', labelKey: 'stores.sApproved' },
  PUBLISHED:      { variant: 'success', labelKey: 'stores.sPublished' },
  PENDING_REVIEW: { variant: 'warning', labelKey: 'stores.sPendingReview' },
  SUSPENDED:      { variant: 'danger',  labelKey: 'stores.sSuspended' },
  REJECTED:       { variant: 'danger',  labelKey: 'stores.sRejected' },
  DRAFT:          { variant: 'muted',   labelKey: 'stores.sDraft' },
}

const FILTERS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'SUSPENDED', 'DRAFT'] as const
const FILTER_LABEL_KEY: Record<string, string> = {
  ALL: 'common.all',
  PENDING_REVIEW: 'stores.sPendingReview',
  APPROVED: 'stores.filterApproved',
  PUBLISHED: 'stores.filterPublished',
  SUSPENDED: 'stores.filterSuspended',
  DRAFT: 'stores.filterDraft',
}

export default function StoresPage() {
  const navigate = useNavigate()
  const { t, locale } = useTranslation()
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
      setActionError(e.message ?? t('stores.errApprove'))
    } finally {
      setActionLoading(null)
    }
  }

  // MARKETING-VERIFIED-SELLER-001: переключение «trust-signal» галочки.
  // Verify — без reason; unverify — INV-A02 требует comment, спрашиваем через prompt.
  async function toggleVerify(storeId: string, willVerify: boolean) {
    let reason: string | undefined
    if (!willVerify) {
      const input = window.prompt(t('stores.unverifyPrompt'))
      if (!input?.trim()) return
      reason = input.trim()
    }
    setLocalStores(prev => prev.map(s => s.id === storeId ? { ...s, isVerified: willVerify } : s))
    setActionLoading(storeId)
    setActionError(null)
    try {
      const url = `/api/v1/admin/stores/${storeId}/${willVerify ? 'verify' : 'unverify'}`
      await api.post(url, willVerify ? {} : { reason })
    } catch (e: any) {
      setLocalStores(data?.stores ?? [])
      setActionError(e.message ?? t('stores.errVerifyChange'))
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{t('stores.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? t('common.loading') : t('stores.count', { count: total })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={13} /> {t('common.refresh')}
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
            placeholder={t('stores.searchPlaceholder')}
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
              {t(FILTER_LABEL_KEY[f])}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {[t('stores.colStore'), t('stores.colSeller'), t('stores.colStatus'), t('stores.colProducts'), t('stores.colOrders'), t('stores.colRegistered'), ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t('common.notFound')}</td></tr>
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
                        <div className="font-medium flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
                          {s.name}
                          {/* MARKETING-VERIFIED-SELLER-001 */}
                          {s.isVerified && (
                            <BadgeCheck size={13} style={{ color: '#60a5fa' }} aria-label={t('stores.verifiedStore')} />
                          )}
                          {s.reviewCount != null && s.reviewCount > 0 && s.avgRating != null && (
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              ⭐ {Number(s.avgRating).toFixed(1)} ({s.reviewCount})
                            </span>
                          )}
                        </div>
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
                    <Badge variant={cfg.variant}>{t(cfg.labelKey)}</Badge>
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
                    {new Date(s.createdAt).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {(s.status === 'PENDING_REVIEW' || s.status === 'DRAFT') && (
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
                          {t('stores.approve')}
                        </button>
                      )}
                      {/* MARKETING-VERIFIED-SELLER-001 — trust-signal toggle */}
                      <button
                        disabled={actionLoading === s.id}
                        onClick={(e) => { e.stopPropagation(); toggleVerify(s.id, !s.isVerified) }}
                        title={s.isVerified ? t('stores.unverifyTitle') : t('stores.verifyTitle')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          cursor: actionLoading === s.id ? 'not-allowed' : 'pointer',
                          opacity: actionLoading === s.id ? 0.5 : 1,
                          border: s.isVerified ? '1px solid rgba(96,165,250,0.45)' : '1px solid var(--border)',
                          background: s.isVerified ? 'rgba(37,99,235,0.10)' : 'transparent',
                          color: s.isVerified ? '#60a5fa' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <BadgeCheck size={12} />
                        {s.isVerified ? t('stores.verified') : t('stores.verify')}
                      </button>
                      <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination — ADMIN-PAGINATION-DISABLED-001: unified via PaginationBar */}
        {totalPages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemsLabel={t('stores.itemsLabel')} />
          </div>
        )}
      </div>
    </div>
  )
}
