import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  User, Store, Clock, CheckCircle, XCircle,
  AlertTriangle, GitMerge, UserCheck, FolderOpen, RotateCcw,
  AlertCircle, X,
} from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { PageHeader } from '../components/admin/PageHeader'
import { Panel } from '../components/admin/Panel'
import { InfoRow } from '../components/admin/InfoRow'
import { ActionPanel } from '../components/admin/ActionPanel'
import { StatusBadge } from '../components/admin/StatusBadge'

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

const TYPE_CFG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  seller: { icon: User,  color: 'var(--primary)', bg: 'rgba(129,140,248,0.12)', label: 'Продавец' },
  store:  { icon: Store, color: '#22C55E',         bg: 'rgba(34,197,94,0.12)',  label: 'Магазин'  },
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
  APPROVE:         { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   label: 'Одобрено' },
  REJECT:          { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   label: 'Отклонено' },
  REQUEST_CHANGES: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'Доработка' },
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
  return { label, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' }
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
      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-[14px] font-semibold transition-opacity"
      style={{
        border: `1px solid ${border}`,
        background: bg,
        color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {icon} {loading ? 'Загрузка...' : label}
    </button>
  )
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
    const endpoint = modCase.status === 'OPEN' ? 'close' : 'reopen'
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
    return <div className="p-8 text-[15px]" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
  }

  if (error || !modCase) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-[14px]" style={{ color: '#EF4444' }}>
          <AlertCircle size={16} /> {error ?? 'Кейс не найден'}
        </div>
      </div>
    )
  }

  const cfg = TYPE_CFG[modCase.entityType] ?? TYPE_CFG.seller
  const sla = getSla(modCase.createdAt)
  const isClosed = modCase.status !== 'OPEN'
  const isLoading = (a: string) => actionLoading === a

  return (
    <div className="px-8 pt-8 pb-12 min-h-screen">
      <PageHeader
        title={`Кейс · ${modCase.id.slice(0, 8)}…`}
        subtitle={`${cfg.label} · ${CASE_TYPE_LABEL[modCase.caseType] ?? modCase.caseType}`}
        backTo="/moderation"
        backLabel="Очередь"
      />

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 340px', alignItems: 'start' }}>
        {/* Left — Info + History */}
        <div className="flex flex-col gap-5">
          <Panel title="Информация о кейсе">
            <InfoRow label="ID сущности">
              <span className="font-mono text-[13px]" style={{ color: 'var(--text)' }}>{modCase.entityId}</span>
            </InfoRow>
            <InfoRow label="Тип сущности">
              <span
                className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </InfoRow>
            <InfoRow label="Тип кейса">
              <span className="text-[13px]" style={{ color: 'var(--text)' }}>
                {CASE_TYPE_LABEL[modCase.caseType] ?? modCase.caseType}
              </span>
            </InfoRow>
            <InfoRow label="Статус">
              <StatusBadge status={modCase.status} />
            </InfoRow>
            <InfoRow label="SLA">
              <span
                className="px-2.5 py-1 rounded-full text-[12px] font-bold"
                style={{ background: sla.bg, color: sla.color }}
              >
                {sla.label}
              </span>
            </InfoRow>
            {modCase.reason && (
              <InfoRow label="Причина">
                <span className="text-[13px]" style={{ color: 'var(--text)' }}>{modCase.reason}</span>
              </InfoRow>
            )}
            <InfoRow label="Создан">
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(modCase.createdAt).toLocaleString('ru-RU')} ({timeAgo(modCase.createdAt)})
              </span>
            </InfoRow>
            <InfoRow label="Назначен" border={false}>
              {modCase.assignedAdminId ? (
                <span className="font-mono text-[12px]" style={{ color: '#22C55E' }}>
                  {modCase.assignedAdminId.slice(0, 12)}…
                </span>
              ) : (
                <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>Не назначен</span>
              )}
            </InfoRow>
          </Panel>

          <Panel title={`История действий (${modCase.actions.length})`}>
            {modCase.actions.length === 0 ? (
              <p className="m-0 text-[14px]" style={{ color: 'var(--text-muted)' }}>Действий ещё не было</p>
            ) : (
              <div className="flex flex-col gap-3">
                {modCase.actions.map((action, i) => {
                  const acfg = ACTION_CFG[action.actionType] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', label: action.actionType }
                  return (
                    <div
                      key={action.id}
                      className="flex gap-3.5 items-start pb-3"
                      style={{
                        borderBottom: i < modCase.actions.length - 1 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: acfg.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                            style={{ background: acfg.bg, color: acfg.color }}
                          >
                            {acfg.label}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {timeAgo(action.createdAt)}
                          </span>
                        </div>
                        {action.comment && (
                          <p className="m-0 mt-1 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {action.comment}
                          </p>
                        )}
                        <span className="text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>
                          {action.adminUserId.slice(0, 10)}…
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Right — Actions */}
        <ActionPanel>
          {isClosed ? (
            <ActionBtn
              icon={<RotateCcw size={14} />}
              label="Переоткрыть"
              color="var(--primary)"
              bg="rgba(129,140,248,0.08)"
              border="rgba(129,140,248,0.3)"
              loading={isLoading('reopen')}
              disabled={!!actionLoading}
              onClick={toggleStatus}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
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
                color="#22C55E"
                bg="rgba(34,197,94,0.1)"
                border="rgba(34,197,94,0.25)"
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
              <div className="pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
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
        </ActionPanel>
      </div>

      {/* Reject Modal */}
      {rejectOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[200]"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => { setRejectOpen(false); setComment('') }}
        >
          <div
            className="rounded-2xl p-7 w-[440px] max-w-[90vw]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="m-0 text-[18px] font-bold" style={{ color: 'var(--text)' }}>Отклонить кейс</h3>
              <button
                onClick={() => { setRejectOpen(false); setComment('') }}
                className="p-0"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <p className="m-0 mb-4 text-[14px]" style={{ color: 'var(--text-muted)' }}>
              Укажи причину отклонения — обязательное поле.
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
              }}
            />
            <div
              className="text-[12px] text-right mt-1 mb-4"
              style={{ color: comment.length >= 10 ? 'var(--text-muted)' : '#EF4444' }}
            >
              {comment.length} символов {comment.length < 10 && '(мин. 10)'}
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => { setRejectOpen(false); setComment('') }}
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
                onClick={() => doAction('REJECT', comment)}
                disabled={comment.trim().length < 10 || !!actionLoading}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold"
                style={{
                  border: 'none',
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
