import { useState } from 'react'
import { ShoppingCart, Search, RefreshCw, AlertCircle, XCircle, ChevronRight, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { api } from '../lib/api'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DialogShell } from '../components/admin/DialogShell'
import { Input } from '@/components/ui/input'
import { PaginationBar } from '../components/admin/PaginationBar'

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

// STATUS-LABEL-CANONICAL-* (от Азима, web-sync audit 14.05.2026):
// единые лейблы по всей платформе — PENDING='Ожидает', SHIPPED='В пути'.
const STATUS_CFG: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'muted'; labelKey: string }> = {
  PENDING:    { variant: 'warning', labelKey: 'orderStatus.PENDING' },
  CONFIRMED:  { variant: 'info',    labelKey: 'orderStatus.CONFIRMED' },
  PROCESSING: { variant: 'info',    labelKey: 'orderStatus.PROCESSING' },
  SHIPPED:    { variant: 'info',    labelKey: 'orderStatus.SHIPPED' },
  DELIVERED:  { variant: 'success', labelKey: 'orderStatus.DELIVERED' },
  CANCELLED:  { variant: 'danger',  labelKey: 'orderStatus.CANCELLED' },
}

const STATUSES = ['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const
const FILTER_LABEL_KEY: Record<string, string> = {
  '': 'common.all',
  PENDING: 'orders.fPending', CONFIRMED: 'orders.fConfirmed', PROCESSING: 'orders.fProcessing',
  SHIPPED: 'orders.fShipped', DELIVERED: 'orders.fDelivered', CANCELLED: 'orders.fCancelled',
}

const TERMINAL = new Set(['DELIVERED', 'CANCELLED'])

interface CancelModal { orderId: string; orderNumber: string }

export default function OrdersPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'uz' ? 'uz-UZ' : 'ru-RU'
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT = 25

  const [cancelModal, setCancelModal] = useState<CancelModal | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [refundOrder, setRefundOrder] = useState<Order | null>(null)

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
      setCancelError(e.message ?? t('common.error'))
    } finally {
      setCancelLoading(false)
    }
  }

  return (
    <div className="p-8 min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{t('orders.title')}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {loading ? t('common.loading') : t('orders.count', { count: total })}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refetch}>
          <RefreshCw size={13} /> {t('common.refresh')}
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
            placeholder={t('orders.searchPlaceholder')}
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
              {t(FILTER_LABEL_KEY[s])}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {[t('dashboard.colNumber'), t('dashboard.colStore'), t('dashboard.colCustomer'), t('dashboard.colAmount'), t('dashboard.colStatus'), t('dashboard.colDate'), ''].map(h => (
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
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
                  <ShoppingCart size={28} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium mb-1">{t('orders.noOrders')}</p>
                  {search && <p className="text-xs">{t('orders.tryChangeQuery')}</p>}
                </td>
              </tr>
            ) : orders.map((o, i) => {
              const cfg = STATUS_CFG[o.status] ?? { variant: 'muted' as const, labelKey: '' }
              const statusLabel = cfg.labelKey ? t(cfg.labelKey) : o.status
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
                    <Badge variant={cfg.variant}>{statusLabel}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                    {new Date(o.placedAt).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    {!TERMINAL.has(o.status) ? (
                      <button
                        onClick={() => { setCancelModal({ orderId: o.id, orderNumber: o.orderNumber }); setCancelReason(''); setCancelError(null) }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border"
                        style={{ borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: 'var(--error)' }}
                      >
                        <XCircle size={11} /> {t('orders.cancel')}
                      </button>
                    ) : o.status === 'DELIVERED' ? (
                      <button
                        onClick={() => setRefundOrder(o)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium border"
                        style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.06)', color: '#F59E0B' }}
                        title={t('orders.refundTitle')}
                      >
                        <Wallet size={11} /> {t('orders.refund')}
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

        {/* Pagination — ADMIN-PAGINATION-DISABLED-001: unified via PaginationBar */}
        {totalPages > 1 && (
          <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <PaginationBar page={page} totalPages={totalPages} total={total} onPageChange={setPage} itemsLabel={t('orders.itemsLabel')} />
          </div>
        )}
      </div>

      {/* Cancel Modal — ADMIN-MODAL-A11Y-001: DialogShell для role=dialog/aria-modal/Esc/focus-trap */}
      {cancelModal && (
        <DialogShell
          onClose={() => { setCancelModal(null); setCancelReason(''); setCancelError(null) }}
          width={448}
          ariaLabelledBy="cancel-order-title"
        >
          <h3 id="cancel-order-title" className="text-base font-semibold mb-1" style={{ color: 'var(--text)' }}>{t('orders.cancelTitle')}</h3>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            {t('orders.cancelOrderLabel')} <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{cancelModal.orderNumber}</span> {t('orders.cancelOrderSuffix')}
          </p>
          <textarea
            value={cancelReason}
            onChange={e => setCancelReason(e.target.value)}
            placeholder={t('orders.cancelReasonPlaceholder')}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-y outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', marginBottom: 12 }}
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
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleCancelConfirm}
              disabled={cancelLoading || !cancelReason.trim()}
            >
              {cancelLoading ? t('common.loading') : t('orders.cancelTitle')}
            </Button>
          </div>
        </DialogShell>
      )}

      {/* Refund Modal */}
      {refundOrder && (
        <RefundDialog
          order={refundOrder}
          onClose={() => setRefundOrder(null)}
          onSuccess={() => { setRefundOrder(null); refetch() }}
        />
      )}
    </div>
  )
}

// ── Refund Dialog ──────────────────────────────────────────────────────────

function RefundDialog({ order, onClose, onSuccess }: {
  order: Order
  onClose: () => void
  onSuccess: () => void
}) {
  const { t } = useTranslation()
  const fullAmount = Number(order.totalAmount)
  const [partial, setPartial] = useState(false)
  const [amount, setAmount] = useState(String(fullAmount))
  const [reason, setReason] = useState('')
  const [returnToWallet, setReturnToWallet] = useState(true)
  const [loading, setLoading] = useState(false)

  const numAmount = Number(amount)
  const isAmountValid = !partial || (numAmount > 0 && numAmount <= fullAmount)
  const canSubmit = reason.trim().length >= 3 && isAmountValid && !loading

  const submit = async () => {
    setLoading(true)
    try {
      // Field name MUST match backend (refund-order.use-case.ts: returnedToWallet).
      // Старое имя returnToWallet всегда уходило с false → wallet не пополнялся.
      const body: { amount?: number; reason: string; returnedToWallet: boolean } = {
        reason: reason.trim(),
        returnedToWallet: returnToWallet,
      }
      if (partial) body.amount = numAmount
      await api.post(`/api/v1/admin/orders/${order.id}/refund`, body)
      toast.success(t('orders.refundDone', { amount: `${new Intl.NumberFormat('ru-RU').format(partial ? numAmount : fullAmount)} ${order.currencyCode}` }))
      onSuccess()
    } catch (e: any) {
      toast.error(e.message ?? t('orders.refundError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <DialogShell
      onClose={() => !loading && onClose()}
      width={448}
      ariaLabelledBy="refund-title"
      closeOnBackdrop={!loading}
      closeOnEscape={!loading}
    >
        <div className="flex items-center gap-3 mb-4">
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={18} color="#F59E0B" />
          </div>
          <div>
            <h3 id="refund-title" className="text-base font-semibold" style={{ color: 'var(--text)' }}>{t('orders.refundDialogTitle')}</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('orders.orderWord')} <span className="font-mono">{order.orderNumber}</span> · {order.customerFullName || order.customerPhone}
            </p>
          </div>
        </div>

        {/* Amount section */}
        <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('orders.orderAmount')}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
              {new Intl.NumberFormat('ru-RU').format(fullAmount)} {order.currencyCode}
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={partial}
              onChange={e => { setPartial(e.target.checked); if (!e.target.checked) setAmount(String(fullAmount)) }}
              style={{ accentColor: 'var(--primary)' }}
            />
            {t('orders.partialRefund')}
          </label>
          {partial && (
            <div className="mt-3">
              <input
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                inputMode="decimal"
                placeholder={String(fullAmount)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  height: 38, padding: '0 12px', borderRadius: 8,
                  border: `1px solid ${isAmountValid ? 'var(--border)' : '#EF4444'}`,
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 14, fontFamily: 'monospace', outline: 'none',
                }}
              />
              {!isAmountValid && (
                <div style={{ marginTop: 4, fontSize: 11, color: '#EF4444' }}>
                  {t('orders.amountRange', { max: fullAmount })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div className="mb-3">
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {t('orders.refundReason')}
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('orders.refundReasonPlaceholder')}
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-sm resize-y outline-none"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Wallet toggle */}
        <label className="flex items-start gap-2 cursor-pointer mb-5" style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--surface2)' }}>
          <input
            type="checkbox"
            checked={returnToWallet}
            onChange={e => setReturnToWallet(e.target.checked)}
            style={{ marginTop: 3, accentColor: 'var(--primary)' }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t('orders.returnToWallet')}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {returnToWallet
                ? t('orders.returnToWalletOn')
                : t('orders.returnToWalletOff')}
            </div>
          </div>
        </label>

        <div className="flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              height: 32, padding: '0 16px', borderRadius: 6, border: 'none',
              background: canSubmit ? '#F59E0B' : 'var(--surface2)',
              color: canSubmit ? 'white' : 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Wallet size={13} /> {loading ? t('orders.refundProgress') : t('orders.refundConfirm')}
          </button>
        </div>
    </DialogShell>
  )
}
