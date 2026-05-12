import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, User, Store, AlertTriangle, X, RefreshCw, AlertCircle, GitMerge, UserCheck, FolderOpen, RotateCcw, ExternalLink } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { PageHeader } from '../components/admin/PageHeader'
import { EmptyState } from '../components/admin/EmptyState'
import { DialogShell } from '../components/admin/DialogShell'

interface ModerationCase {
  id: string
  entityType: string
  entityId: string
  caseType: string
  status: string
  assignedAdminId: string | null
  createdAt: string
}

interface QueueResponse {
  cases: ModerationCase[]
  total: number
}

const TYPE_CFG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  seller: { icon: User,  color: 'var(--primary)', bg: 'rgba(129,140,248,0.12)', label: 'Продавец' },
  store:  { icon: Store, color: '#22C55E',         bg: 'rgba(34,197,94,0.12)',  label: 'Магазин'  },
}

const CASE_TYPE_LABEL: Record<string, string> = {
  verification:   'Верификация',
  abuse:          'Жалоба',
  manual_review:  'Ручная проверка',
  VERIFICATION:   'Верификация',
  ABUSE:          'Жалоба',
  MANUAL_REVIEW:  'Ручная проверка',
}

const SLA_HOURS = 24

function getSla(createdAt: string): { label: string; color: string; bg: string; overdue: boolean } {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const remaining = SLA_HOURS * 3_600_000 - elapsed
  if (remaining <= 0) {
    const over = Math.abs(remaining)
    const h = Math.floor(over / 3_600_000)
    return { label: `SLA +${h}ч`, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', overdue: true }
  }
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const label = h > 0 ? `SLA ${h}ч ${m}м` : `SLA ${m}м`
  if (remaining < 2 * 3_600_000) return { label, color: '#EF4444', bg: 'rgba(239,68,68,0.12)', overdue: false }
  if (remaining < 8 * 3_600_000) return { label, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', overdue: false }
  return { label, color: '#22C55E', bg: 'rgba(34,197,94,0.12)', overdue: false }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}д назад`
  if (h > 0) return `${h}ч назад`
  const m = Math.floor(diff / 60_000)
  return m > 0 ? `${m}м назад` : 'только что'
}

export default function ModerationPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'ALL' | 'seller' | 'store' | 'CLOSED'>('ALL')
  const [rejectTarget, setRejectTarget] = useState<ModerationCase | null>(null)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const isClosed = tab === 'CLOSED'
  const fetchUrl = isClosed
    ? '/api/v1/admin/moderation?status=CLOSED&limit=50'
    : '/api/v1/admin/moderation/queue'

  const { data, loading, error, refetch } = useFetch<QueueResponse>(fetchUrl, [tab])

  const cases = (data?.cases ?? []).filter(c => {
    if (isClosed || tab === 'ALL') return true
    return c.entityType === tab
  })
  const total = data?.total ?? 0

  const counts = {
    ALL:    data?.cases.length ?? 0,
    seller: data?.cases.filter(c => c.entityType === 'seller').length ?? 0,
    store:  data?.cases.filter(c => c.entityType === 'store').length ?? 0,
    CLOSED: isClosed ? total : 0,
  }

  async function doAction(caseId: string, action: string, actionComment?: string) {
    setActionLoading(caseId)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/moderation/${caseId}/action`, { action, comment: actionComment })
      setRejectTarget(null)
      setComment('')
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleCaseStatus(caseId: string, currentStatus: string) {
    setActionLoading(caseId)
    setActionError(null)
    const endpoint = currentStatus === 'OPEN' ? 'close' : 'reopen'
    try {
      await api.patch(`/api/v1/admin/moderation/${caseId}/${endpoint}`, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  async function assignToMe(caseId: string) {
    setActionLoading(caseId)
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/moderation/${caseId}/assign`, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка назначения')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="px-8 pt-8 pb-12 min-h-screen">
      <PageHeader
        title="Модерация"
        subtitle={loading ? 'Загрузка...' : `Очередь · ${total} ожидает · SLA ${SLA_HOURS}ч`}
        actions={
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px]"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Обновить
          </button>
        }
      />

      {(error || actionError) && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle size={15} /> {error ?? actionError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['ALL', 'seller', 'store', 'CLOSED'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium"
            style={{
              cursor: 'pointer',
              border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
              background: tab === t ? 'var(--primary-dim)' : 'var(--surface)',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {t === 'seller' && <User size={13} />}
            {t === 'store' && <Store size={13} />}
            {t === 'CLOSED' && <FolderOpen size={13} />}
            {t === 'ALL' ? 'Все' : t === 'seller' ? 'Продавцы' : t === 'store' ? 'Магазины' : 'Закрыты'}
            {t !== 'CLOSED' && (
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === t ? 'rgba(129,140,248,0.2)' : 'var(--surface2)',
                  color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
                }}
              >
                {counts[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Queue */}
      <div className="flex flex-col gap-2.5">
        {loading ? (
          <div
            className="p-16 text-center rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Загрузка...
          </div>
        ) : cases.length === 0 ? (
          <div
            className="rounded-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <EmptyState title="Очередь пуста — всё проверено" />
          </div>
        ) : cases.map(item => {
          const cfg = TYPE_CFG[item.entityType] ?? TYPE_CFG.seller
          const sla = getSla(item.createdAt)
          const isProcessing = actionLoading === item.id

          return (
            <div
              key={item.id}
              className="flex items-center gap-3.5 px-5 py-4 rounded-2xl transition-opacity"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${sla.overdue ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
                opacity: isProcessing ? 0.6 : 1,
              }}
            >
              {/* Entity icon */}
              <div
                className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                style={{ background: cfg.bg }}
              >
                <cfg.icon size={20} color={cfg.color} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-[15px]" style={{ color: 'var(--text)' }}>{cfg.label}</span>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
                  >
                    {CASE_TYPE_LABEL[item.caseType] ?? item.caseType}
                  </span>
                  {item.assignedAdminId && (
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                    >
                      Назначен
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {item.entityId.slice(0, 8)}…
                  </span>
                  <span className="text-[11px] flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={10} />
                    {timeAgo(item.createdAt)}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: sla.bg, color: sla.color }}
                  >
                    {sla.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => navigate(`/moderation/${item.id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={12} /> Открыть
                </button>
                {isClosed ? (
                  <button
                    disabled={isProcessing}
                    onClick={() => toggleCaseStatus(item.id, item.status)}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold"
                    style={{
                      background: 'rgba(129,140,248,0.08)',
                      border: '1px solid rgba(129,140,248,0.25)',
                      color: 'var(--primary)',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <RotateCcw size={13} /> Переоткрыть
                  </button>
                ) : (
                  <>
                    {!item.assignedAdminId && (
                      <button
                        disabled={isProcessing}
                        onClick={() => assignToMe(item.id)}
                        title="Взять в работу"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                        style={{
                          background: 'rgba(129,140,248,0.06)',
                          border: '1px solid rgba(129,140,248,0.2)',
                          color: 'var(--primary)',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <UserCheck size={13} /> Взять
                      </button>
                    )}
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'REQUEST_CHANGES')}
                      title="Запросить изменения"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                      style={{
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.25)',
                        color: '#F59E0B',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <AlertTriangle size={13} /> Доработка
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'ESCALATE')}
                      title="Эскалировать"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                      style={{
                        background: 'rgba(129,140,248,0.08)',
                        border: '1px solid rgba(129,140,248,0.25)',
                        color: 'var(--primary)',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <GitMerge size={13} /> Эскалация
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => setRejectTarget(item)}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold"
                      style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#EF4444',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <XCircle size={13} /> Отклонить
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'APPROVE')}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold"
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.25)',
                        color: '#22C55E',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <CheckCircle size={14} /> Одобрить
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => toggleCaseStatus(item.id, item.status)}
                      title="Закрыть кейс без решения"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold"
                      style={{
                        background: 'rgba(148,163,184,0.06)',
                        border: '1px solid rgba(148,163,184,0.25)',
                        color: '#94A3B8',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <FolderOpen size={13} /> Закрыть
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reject Modal — ADMIN-MODAL-A11Y-001: DialogShell wraps for role=dialog/aria-modal/Esc/focus-trap */}
      {rejectTarget && (
        <DialogShell
          onClose={() => { setRejectTarget(null); setComment('') }}
          width={440}
          ariaLabelledBy="reject-modal-title"
        >
            <div className="flex items-center justify-between mb-2">
              <h3 id="reject-modal-title" className="m-0 text-[18px] font-bold" style={{ color: 'var(--text)' }}>Отклонить заявку</h3>
              <button
                onClick={() => { setRejectTarget(null); setComment('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <p className="m-0 mb-1 text-[14px]" style={{ color: 'var(--text-muted)' }}>
              {TYPE_CFG[rejectTarget.entityType]?.label}
              <span className="font-mono text-[12px] ml-2" style={{ color: 'var(--text-muted)' }}>
                {rejectTarget.entityId.slice(0, 12)}…
              </span>
            </p>
            <div className="mb-4">
              {(() => {
                const s = getSla(rejectTarget.createdAt)
                return (
                  <span
                    className="text-[12px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                )
              })()}
            </div>
            <p className="m-0 mb-4 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Укажи причину — обязательное поле (INV-A02).
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Например: профиль не заполнен, нарушение правил платформы..."
              rows={4}
              className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-y outline-none leading-relaxed"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#EF4444'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div
              className="text-[12px] text-right mt-1 mb-4"
              style={{ color: comment.length > 10 ? 'var(--text-muted)' : '#EF4444' }}
            >
              {comment.length} символов {comment.length < 10 && '(мин. 10)'}
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => { setRejectTarget(null); setComment('') }}
                className="px-5 py-2.5 rounded-xl text-[14px]"
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
              <button
                onClick={() => doAction(rejectTarget.id, 'REJECT', comment)}
                disabled={comment.trim().length < 10 || actionLoading === rejectTarget.id}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold"
                style={{
                  border: 'none',
                  cursor: comment.trim().length >= 10 ? 'pointer' : 'not-allowed',
                  background: comment.trim().length >= 10 ? '#EF4444' : 'var(--surface2)',
                  color: comment.trim().length >= 10 ? 'white' : 'var(--text-muted)',
                  transition: 'background 0.2s',
                }}
              >
                {actionLoading === rejectTarget.id ? 'Отправка...' : 'Отклонить'}
              </button>
            </div>
        </DialogShell>
      )}
    </div>
  )
}
