import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Store, Clock, CheckCircle, XCircle,
  AlertTriangle, GitMerge, UserCheck, FolderOpen, RotateCcw,
  AlertCircle, X,
} from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface ModerationAction {
  id: string
  actionType: string
  adminUserId: string
  comment: string | null
  createdAt: string
}

interface ModerationCase {
  id: string
  entityType: string
  entityId: string
  caseType: string
  status: string
  reason: string | null
  assignedAdminId: string | null
  createdAt: string
  updatedAt: string
  actions: ModerationAction[]
}

const TYPE_CFG: Record<string, { color: string; bg: string; label: string }> = {
  seller: { color: 'var(--primary)', bg: 'rgba(129,140,248,0.12)', label: 'Продавец' },
  store:  { color: '#10B981',        bg: 'rgba(16,185,129,0.12)',  label: 'Магазин'  },
}

const CASE_TYPE_LABEL: Record<string, string> = {
  verification:  'Верификация',
  abuse:         'Жалоба',
  manual_review: 'Ручная проверка',
  VERIFICATION:  'Верификация',
  ABUSE:         'Жалоба',
  MANUAL_REVIEW: 'Ручная проверка',
}

const ACTION_CFG: Record<string, { color: string; bg: string; label: string }> = {
  APPROVE:         { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Одобрено' },
  REJECT:          { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Отклонено' },
  REQUEST_CHANGES: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', label: 'Доработка' },
  ESCALATE:        { color: '#818CF8', bg: 'rgba(129,140,248,0.12)', label: 'Эскалация' },
  CLOSE:           { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: 'Закрыто' },
  REOPEN:          { color: '#818CF8', bg: 'rgba(129,140,248,0.12)', label: 'Переоткрыто' },
}

const SLA_HOURS = 24

function getSla(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime()
  const remaining = SLA_HOURS * 3_600_000 - elapsed
  if (remaining <= 0) {
    const h = Math.abs(Math.floor(remaining / 3_600_000))
    return { label: `SLA +${h}ч просрочка`, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
  }
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const label = h > 0 ? `SLA ${h}ч ${m}м` : `SLA ${m}м`
  if (remaining < 2 * 3_600_000) return { label, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' }
  if (remaining < 8 * 3_600_000) return { label, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
  return { label, color: '#10B981', bg: 'rgba(16,185,129,0.12)' }
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

export default function ModerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [rejectOpen, setRejectOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: modCase, loading, error, refetch } = useFetch<ModerationCase>(
    `/api/v1/admin/moderation/${id}`,
    [id],
  )

  async function doAction(action: string, actionComment?: string) {
    if (!id) return
    setActionLoading(action)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/moderation/${id}/action`, { action, comment: actionComment })
      setRejectOpen(false)
      setComment('')
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  async function assignToMe() {
    if (!id) return
    setActionLoading('assign')
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/moderation/${id}/assign`, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка назначения')
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleStatus() {
    if (!id || !modCase) return
    const endpoint = modCase.status === 'open' ? 'close' : 'reopen'
    setActionLoading(endpoint)
    setActionError(null)
    try {
      await api.patch(`/api/v1/admin/moderation/${id}/${endpoint}`, {})
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px', color: 'var(--text-muted)', fontSize: 15 }}>Загрузка...</div>
    )
  }

  if (error || !modCase) {
    return (
      <div style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontSize: 14 }}>
          <AlertCircle size={16} /> {error ?? 'Кейс не найден'}
        </div>
      </div>
    )
  }

  const cfg = TYPE_CFG[modCase.entityType] ?? TYPE_CFG.seller
  const sla = getSla(modCase.createdAt)
  const isClosed = modCase.status !== 'open'
  const isLoading = (a: string) => actionLoading === a

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/moderation')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Очередь
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            Кейс · {modCase.id.slice(0, 8)}…
          </h1>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {cfg.label} · {CASE_TYPE_LABEL[modCase.caseType] ?? modCase.caseType}
          </p>
        </div>
      </div>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Left — Info + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Case Info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Информация о кейсе</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Row label="ID сущности">
                <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>{modCase.entityId}</span>
              </Row>
              <Row label="Тип сущности">
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
              </Row>
              <Row label="Тип кейса">
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{CASE_TYPE_LABEL[modCase.caseType] ?? modCase.caseType}</span>
              </Row>
              <Row label="Статус">
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: isClosed ? 'rgba(148,163,184,0.12)' : 'rgba(16,185,129,0.12)',
                  color: isClosed ? '#94A3B8' : '#10B981',
                }}>
                  {isClosed ? 'Закрыт' : 'Открыт'}
                </span>
              </Row>
              <Row label="SLA">
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: sla.bg, color: sla.color }}>
                  {sla.label}
                </span>
              </Row>
              {modCase.reason && (
                <Row label="Причина">
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{modCase.reason}</span>
                </Row>
              )}
              <Row label="Создан">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {new Date(modCase.createdAt).toLocaleString('ru-RU')} ({timeAgo(modCase.createdAt)})
                </span>
              </Row>
              <Row label="Назначен">
                {modCase.assignedAdminId
                  ? <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#10B981' }}>{modCase.assignedAdminId.slice(0, 12)}…</span>
                  : <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Не назначен</span>
                }
              </Row>
            </div>
          </div>

          {/* Action History */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              История действий ({modCase.actions.length})
            </h3>
            {modCase.actions.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Действий ещё не было</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {modCase.actions.map((action, i) => {
                  const acfg = ACTION_CFG[action.actionType] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: action.actionType }
                  return (
                    <div key={action.id} style={{
                      display: 'flex', gap: 14, alignItems: 'flex-start',
                      paddingBottom: i < modCase.actions.length - 1 ? 12 : 0,
                      borderBottom: i < modCase.actions.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: acfg.color, marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: acfg.bg, color: acfg.color }}>
                            {acfg.label}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(action.createdAt)}</span>
                        </div>
                        {action.comment && (
                          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {action.comment}
                          </p>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                          {action.adminUserId.slice(0, 10)}…
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Actions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Действия</h3>

          {isClosed ? (
            <button
              disabled={!!actionLoading}
              onClick={toggleStatus}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(129,140,248,0.3)',
                background: 'rgba(129,140,248,0.08)', color: 'var(--primary)',
                fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <RotateCcw size={14} /> Переоткрыть
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!modCase.assignedAdminId && (
                <ActionBtn
                  icon={<UserCheck size={14} />}
                  label="Взять в работу"
                  color="#818CF8"
                  bg="rgba(129,140,248,0.08)"
                  border="rgba(129,140,248,0.25)"
                  loading={isLoading('assign')}
                  disabled={!!actionLoading}
                  onClick={assignToMe}
                />
              )}
              <ActionBtn
                icon={<CheckCircle size={14} />}
                label="Одобрить"
                color="#10B981"
                bg="rgba(16,185,129,0.1)"
                border="rgba(16,185,129,0.25)"
                loading={isLoading('APPROVE')}
                disabled={!!actionLoading}
                onClick={() => doAction('APPROVE')}
              />
              <ActionBtn
                icon={<AlertTriangle size={14} />}
                label="Запросить доработку"
                color="#F59E0B"
                bg="rgba(245,158,11,0.08)"
                border="rgba(245,158,11,0.25)"
                loading={isLoading('REQUEST_CHANGES')}
                disabled={!!actionLoading}
                onClick={() => doAction('REQUEST_CHANGES')}
              />
              <ActionBtn
                icon={<GitMerge size={14} />}
                label="Эскалировать"
                color="#818CF8"
                bg="rgba(129,140,248,0.08)"
                border="rgba(129,140,248,0.25)"
                loading={isLoading('ESCALATE')}
                disabled={!!actionLoading}
                onClick={() => doAction('ESCALATE')}
              />
              <ActionBtn
                icon={<XCircle size={14} />}
                label="Отклонить"
                color="#EF4444"
                bg="rgba(239,68,68,0.08)"
                border="rgba(239,68,68,0.25)"
                loading={isLoading('REJECT')}
                disabled={!!actionLoading}
                onClick={() => setRejectOpen(true)}
              />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 2 }}>
                <ActionBtn
                  icon={<FolderOpen size={14} />}
                  label="Закрыть без решения"
                  color="#94A3B8"
                  bg="rgba(148,163,184,0.06)"
                  border="rgba(148,163,184,0.25)"
                  loading={isLoading('close')}
                  disabled={!!actionLoading}
                  onClick={toggleStatus}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}
          onClick={() => { setRejectOpen(false); setComment('') }}
        >
          <div
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Отклонить кейс</h3>
              <button onClick={() => { setRejectOpen(false); setComment('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
              Укажи причину отклонения — обязательное поле.
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Например: профиль не заполнен, нарушение правил платформы..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
              }}
            />
            <div style={{ fontSize: 12, color: comment.length >= 10 ? 'var(--text-muted)' : '#EF4444', textAlign: 'right', marginTop: 4, marginBottom: 18 }}>
              {comment.length} символов {comment.length < 10 && '(мин. 10)'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectOpen(false); setComment('') }} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
                Отмена
              </button>
              <button
                onClick={() => doAction('REJECT', comment)}
                disabled={comment.trim().length < 10 || !!actionLoading}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: comment.trim().length >= 10 ? 'pointer' : 'not-allowed',
                  background: comment.trim().length >= 10 ? '#EF4444' : 'var(--surface2)',
                  color: comment.trim().length >= 10 ? 'white' : 'var(--text-muted)',
                }}
              >
                {isLoading('REJECT') ? 'Отправка...' : 'Отклонить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ width: 120, flexShrink: 0, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function ActionBtn({ icon, label, color, bg, border, loading, disabled, onClick }: {
  icon: React.ReactNode
  label: string
  color: string
  bg: string
  border: string
  loading: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8,
        padding: '11px 16px', borderRadius: 10, border: `1px solid ${border}`,
        background: bg, color, fontSize: 14, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.7 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {icon} {loading ? 'Загрузка...' : label}
    </button>
  )
}
