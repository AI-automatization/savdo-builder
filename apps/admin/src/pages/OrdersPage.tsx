import { useState } from 'react'
import { ShoppingCart, Search, RefreshCw, AlertCircle, XCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

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

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:    { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'Ожидание' },
  CONFIRMED:  { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Подтверждён' },
  PROCESSING: { bg: 'rgba(99,102,241,0.12)',  text: '#6366F1', label: 'Обработка' },
  SHIPPED:    { bg: 'rgba(14,165,233,0.12)',  text: '#0EA5E9', label: 'Отправлен' },
  DELIVERED:  { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Доставлен' },
  CANCELLED:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', label: 'Отменён' },
}

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED'])

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatAmount(raw: string, currency: string) {
  return new Intl.NumberFormat('ru-RU').format(Number(raw)) + ' ' + currency
}

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

  function onStatusChange(s: string) {
    setStatusFilter(s)
    setPage(1)
  }

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
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Заказы</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `${total} заказов`}
          </p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Номер, телефон, магазин..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: 8, boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {STATUSES.map(s => {
            const cfg = s ? STATUS_CFG[s] : null
            return (
              <button key={s} onClick={() => onStatusChange(s)} style={{
                padding: '7px 13px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${statusFilter === s ? 'var(--primary)' : 'var(--border)'}`,
                background: statusFilter === s ? 'var(--primary-dim)' : 'var(--surface)',
                color: statusFilter === s ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {s === '' ? 'Все' : cfg?.label ?? s}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Номер', 'Магазин', 'Покупатель', 'Сумма', 'Статус', 'Дата', ''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '52px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.2 }} />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Заказов не найдено</div>
                  {search && <div style={{ fontSize: 12 }}>Попробуй изменить запрос</div>}
                </td>
              </tr>
            ) : orders.map(o => {
              const cfg = STATUS_CFG[o.status] ?? { bg: 'var(--surface2)', text: 'var(--text-muted)', label: o.status }
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>
                    {o.orderNumber}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)' }}>{o.store.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{o.store.slug}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: 'var(--text)' }}>{o.customerFullName || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{o.customerPhone}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: 'var(--text)', fontWeight: 600 }}>
                    {formatAmount(o.totalAmount, o.currencyCode)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap' }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDate(o.placedAt)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {!TERMINAL_STATUSES.has(o.status) && (
                      <button
                        onClick={() => { setCancelModal({ orderId: o.id, orderNumber: o.orderNumber }); setCancelReason(''); setCancelError(null) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        <XCircle size={12} /> Отменить
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Стр. {page} из {totalPages} · {total} заказов
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: page <= 1 ? 'var(--text-muted)' : 'var(--text)', fontSize: 13, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
            >← Назад</button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: page >= totalPages ? 'var(--text-muted)' : 'var(--text)', fontSize: 13, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
            >Вперёд →</button>
          </div>
        </div>
      )}
      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>Отменить заказ</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
              Заказ <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{cancelModal.orderNumber}</span> будет отменён.
            </p>
            <textarea
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Причина отмены (обязательно)..."
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 12 }}
            />
            {cancelError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, marginBottom: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
                <AlertCircle size={13} /> {cancelError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setCancelModal(null); setCancelReason(''); setCancelError(null) }}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
              >Отмена</button>
              <button
                onClick={handleCancelConfirm}
                disabled={cancelLoading || !cancelReason.trim()}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontSize: 14, fontWeight: 600, cursor: cancelLoading ? 'wait' : 'pointer', opacity: !cancelReason.trim() ? 0.5 : 1 }}
              >{cancelLoading ? 'Загрузка...' : 'Отменить заказ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
