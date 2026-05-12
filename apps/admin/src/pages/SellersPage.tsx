import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle, XCircle, Clock, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PaginationBar } from '../components/admin/PaginationBar'

interface Seller {
  id: string
  fullName: string
  bio: string | null
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  isBlocked: boolean
  blockedReason: string | null
  createdAt: string
  user: { id: string; phone: string; status: string }
}
interface SellersResponse { sellers: Seller[]; total: number }

const VSTATUS: Record<string, { variant: 'success' | 'warning' | 'danger' | 'muted'; icon: React.ElementType; label: string }> = {
  VERIFIED: { variant: 'success', icon: CheckCircle, label: 'Проверен' },
  PENDING:  { variant: 'warning', icon: Clock,       label: 'На проверке' },
  REJECTED: { variant: 'danger',  icon: XCircle,     label: 'Отклонён' },
}

const FILTERS = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const
const FILTER_LABEL: Record<string, string> = {
  ALL: 'Все', PENDING: 'На проверке', VERIFIED: 'Проверены', REJECTED: 'Отклонены',
}

export default function SellersPage() {
  const navigate = useNavigate()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const LIMIT = 20

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  const query = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (filter !== 'ALL') query.set('verificationStatus', filter)
  if (search) query.set('search', search)
  const { data, loading, error, refetch } = useFetch<SellersResponse>(
    `/api/v1/admin/sellers?${query}`, [page, filter, search],
  )

  const sellers = data?.sellers ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Продавцы</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Загрузка...' : `${total} продавцов`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={13} /> Обновить
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-5 text-xs border"
          style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }}>
          <AlertCircle size={13} /> {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Имя или телефон..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-1.5">
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
              {['Продавец', 'Телефон', 'Верификация', 'Аккаунт', 'Зарегистрирован', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: 'var(--text-dim)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : sellers.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Ничего не найдено</td></tr>
            ) : sellers.map((s, i) => {
              const vstatus = s.isBlocked
                ? { variant: 'danger' as const, icon: XCircle, label: 'Заблокирован' }
                : VSTATUS[s.verificationStatus] ?? VSTATUS.PENDING
              const StatusIcon = vstatus.icon

              return (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/sellers/${s.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: i < sellers.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600/80 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {s.fullName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        {s.fullName || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {s.user.phone}
                  </td>

                  {/* Verification */}
                  <td className="px-4 py-3">
                    <Badge variant={vstatus.variant} className="gap-1">
                      <StatusIcon size={10} />
                      {vstatus.label}
                    </Badge>
                  </td>

                  {/* Account status */}
                  <td className="px-4 py-3">
                    <Badge variant={s.user.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {s.user.status}
                    </Badge>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(s.createdAt).toLocaleDateString('ru-RU')}
                  </td>

                  {/* Arrow */}
                  <td className="px-4 py-3">
                    <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination — ADMIN-PAGINATION-DISABLED-001: unified via PaginationBar */}
        {totalPages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemsLabel="продавцов" />
          </div>
        )}
      </div>
    </div>
  )
}
