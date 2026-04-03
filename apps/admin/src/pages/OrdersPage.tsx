import { useState } from 'react'
import { ShoppingCart, Search, RefreshCw, AlertCircle, XCircle, ChevronRight } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Store { id: string; name: string; slug: string }
interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: string
  currencyCode: string
  customerFullName: string
  customerPhone: string
  placedAt: string
  store: Store
}
interface OrdersResponse { orders: Order[]; total: number }

const STATUS_CFG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'muted'; label: string }> = {
  PENDING:    { variant: 'warning', label: 'Ожидание' },
  CONFIRMED:  { variant: 'info',    label: 'Подтверждён' },
  PROCESSING: { variant: 'info',    label: 'Обработка' },
  SHIPPED:    { variant: 'info',    label: 'Отправлен' },
  DELIVERED:  { variant: 'success', label: 'Доставлен' },
  CANCELLED:  { variant: 'danger',  label: 'Отменён' },
}

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
const FILTER_LABEL: Record<string, string> = {
  '': 'Все',
  PENDING: 'Ожидание', CONFIRMED: 'Подтверждены', PROCESSING: 'В обработке',
  SHIPPED: 'Отправлены', DELIVERED: 'Доставлены', CANCELLED: 'Отменены',
}

const TERMINAL = new Set(['DELIVERED', 'CANCELLED'])

interface CancelModal { orderId: string; orderNumber: string }

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 25

  const [cancelModal, setCancelModal] = useState<CancelModal | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const query = [
    statusFilter && `status=${statusFilter}`,
    `page=${page}`,
    `limit=${LIMIT}`,
  ].filter(Boolean).join('&')

  const { data, loading, error, refetch } = useFetch<OrdersResponse>(
    `/api/v1/admin/orders?${query}`,
    [statusFilter, page],
  )

  const orders = (data?.orders ?? []).filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.customerFullName.toLowerCase().includes(q) ||
      o.store.slug.toLowerCase().includes(q) ||
      o.store.name.toLowerCase().includes(q)
    )
  })

  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  async function handleCancelConfirm() {
    if (!cancelModal) return
    setCancelLoading(true)
    setCancelError(null)
    try {
      await api.patch(`/api/v1/admin/orders/${cancelModal.orderId}/status`, {
        status: 'CANCELLED',
        reason: cancelReason,
      })
      setCancelModal(null)
      setCancelReason('')
      refetch()
    } catch (e: any) {
      setCancelError(e.message ?? 'Ошибка')
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Заказы</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? 'Загрузка...' : `${total} заказов`}
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
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Номер, телефон, магазин..."
            className="pl-8"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn(
                'px-3 h-8 rounded-md text-xs font-medium transition-colors border',
                statusFilter === s
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'border-transparent hover:bg-white/5',
              )}
            >
              {FILTER_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {['Номер', 'Магазин', 'Покупатель', 'Сумма', 'Статус', 'Дата', ''].map(h => (
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  <ShoppingCart size={28} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium mb-1">Заказов не найдено</p>
                  {search && <p className="text-xs">Попробуйте изменить запрос</p>}
                </td>
              </tr>
            ) : orders.map((o, i) => {
              const cfg = STATUS_CFG[o.status] ?? { variant: 'muted' as const, label: o.status }
              return (
                <tr
                  key={o.id}
                  className="transition-colors"
                  style={{ borderBottom: i < orders.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: 'var(--text)' }}>
                    {o.orderNumber}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{o.store.name}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>/{o.store.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs" style={{ color: 'var(--text)' }}>{o.customerFullName || '—'}</div>
                    <div className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>{o.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text)' }}>
                    {new Intl.NumberFormat('ru-RU').format(Number(o.totalAmount))} {o.currencyCode}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(o.placedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    {!TERMINAL.has(o.status) ? (
                      <button
                        onClick={() => { setCancelModal({ orderId: o.id, orderNumber: o.orderNumber }); setCancelReason(''); setCancelError(null) }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors border"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: 'var(--error)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.12)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
                      >
                        <XCircle size={11} /> Отменить
                      </button>
                    ) : (
                      <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                    )}
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
              Стр. {page} из {totalPages} · {total} заказов
            </span>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Назад</Button>
              <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Вперёд →</Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-md rounded-2xl p-7 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>Отменить заказ</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Заказ <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{cancelModal.orderNumber}</span> будет отменён.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Причина отмены (обязательно)..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-y outline-none transition-colors"
              style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 12 }}
              onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            {cancelError && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-4 text-xs border"
                style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }}>
                <AlertCircle size={12} /> {cancelError}
              </div>
            )}
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="secondary"
                onClick={() => { setCancelModal(null); setCancelReason(''); setCancelError(null) }}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelConfirm}
                disabled={cancelLoading || !cancelReason.trim()}
              >
                {cancelLoading ? 'Загрузка...' : 'Отменить заказ'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
