import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, User, Store, AlertTriangle, X, RefreshCw, AlertCircle, GitMerge, UserCheck, FolderOpen, RotateCcw, ExternalLink } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

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
  store:  { icon: Store, color: '#10B981',         bg: 'rgba(16,185,129,0.12)',  label: 'Магазин'  },
}

const CASE_TYPE_LABEL: Record<string, string> = {
  verification:   'Верификация',
  abuse:          'Жалоба',
  manual_review:  'Ручная проверка',
  VERIFICATION:   'Верификация',
  ABUSE:          'Жалоба',
  MANUAL_REVIEW:  'Ручная проверка',
}

// SLA = 24h from createdAt
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
  return { label, color: '#10B981', bg: 'rgba(16,185,129,0.12)', overdue: false }
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
    ? '/api/v1/admin/moderation?status=closed&limit=50'
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
    const endpoint = currentStatus === 'open' ? 'close' : 'reopen'
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
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Модерация</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {loading ? 'Загрузка...' : `Очередь · ${total} ожидает · SLA ${SLA_HOURS}ч`}
          </p>
        </div>
        <button onClick={refetch} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {(error || actionError) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {error ?? actionError}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['ALL', 'seller', 'store', 'CLOSED'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
            background: tab === t ? 'var(--primary-dim)' : 'var(--surface)',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {t === 'seller' && <User size={13} />}
            {t === 'store' && <Store size={13} />}
            {t === 'CLOSED' && <FolderOpen size={13} />}
            {t === 'ALL' ? 'Все' : t === 'seller' ? 'Продавцы' : t === 'store' ? 'Магазины' : 'Закрыты'}
            {t !== 'CLOSED' && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                background: tab === t ? 'rgba(129,140,248,0.2)' : 'var(--surface2)',
                color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
              }}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Загрузка...</div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Очередь пуста — всё проверено ✓
          </div>
        ) : cases.map(item => {
          const cfg = TYPE_CFG[item.entityType] ?? TYPE_CFG.seller
          const sla = getSla(item.createdAt)
          const isProcessing = actionLoading === item.id

          return (
            <div key={item.id} style={{
              background: 'var(--surface)',
              border: `1px solid ${sla.overdue ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: isProcessing ? 0.6 : 1, transition: 'opacity 0.2s',
            }}>
              {/* Entity icon */}
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <cfg.icon size={20} color={cfg.color} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{cfg.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '1px 8px', borderRadius: 20 }}>
                    {CASE_TYPE_LABEL[item.caseType] ?? item.caseType}
                  </span>
                  {item.assignedAdminId && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 8px', borderRadius: 20 }}>
                      Назначен
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {item.entityId.slice(0, 8)}…
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                    {timeAgo(item.createdAt)}
                  </span>
                  {/* SLA badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: sla.bg, color: sla.color,
                  }}>
                    {sla.label}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* Detail link */}
                <button
                  onClick={() => navigate(`/moderation/${item.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <ExternalLink size={12} /> Открыть
                </button>
                {isClosed ? (
                  // Closed case — only reopen
                  <button
                    disabled={isProcessing}
                    onClick={() => toggleCaseStatus(item.id, item.status)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
                      background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)',
                      color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
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
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                          background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
                          color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <UserCheck size={13} /> Взять
                      </button>
                    )}
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'REQUEST_CHANGES')}
                      title="Запросить изменения"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                        color: '#F59E0B', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <AlertTriangle size={13} /> Доработка
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'ESCALATE')}
                      title="Эскалировать"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                        background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)',
                        color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <GitMerge size={13} /> Эскалация
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => setRejectTarget(item)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                        color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <XCircle size={13} /> Отклонить
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => doAction(item.id, 'APPROVE')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8,
                        background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                        color: '#10B981', fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <CheckCircle size={14} /> Одобрить
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => toggleCaseStatus(item.id, item.status)}
                      title="Закрыть кейс без решения"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8,
                        background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.25)',
                        color: '#94A3B8', fontSize: 12, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
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

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(4px)',
        }} onClick={() => { setRejectTarget(null); setComment('') }}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Отклонить заявку</h3>
              <button onClick={() => { setRejectTarget(null); setComment('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 4px', color: 'var(--text-muted)', fontSize: 14 }}>
              {TYPE_CFG[rejectTarget.entityType]?.label}
              <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8, fontFamily: 'monospace' }}>
                {rejectTarget.entityId.slice(0, 12)}…
              </span>
            </p>
            {/* SLA in modal */}
            <div style={{ marginBottom: 16 }}>
              {(() => {
                const s = getSla(rejectTarget.createdAt)
                return (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color }}>
                    {s.label}
                  </span>
                )
              })()}
            </div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              Укажи причину — обязательное поле (INV-A02).
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Например: профиль не заполнен, нарушение правил платформы..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#EF4444'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ fontSize: 12, color: comment.length > 10 ? 'var(--text-muted)' : '#EF4444', textAlign: 'right', marginTop: 4, marginBottom: 18 }}>
              {comment.length} символов {comment.length < 10 && '(мин. 10)'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectTarget(null); setComment('') }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
              }}>
                Отмена
              </button>
              <button
                onClick={() => doAction(rejectTarget.id, 'REJECT', comment)}
                disabled={comment.trim().length < 10 || actionLoading === rejectTarget.id}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: comment.trim().length >= 10 ? 'pointer' : 'not-allowed',
                  background: comment.trim().length >= 10 ? '#EF4444' : 'var(--surface2)',
                  color: comment.trim().length >= 10 ? 'white' : 'var(--text-muted)',
                  transition: 'background 0.2s',
                }}
              >
                {actionLoading === rejectTarget.id ? 'Отправка...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
