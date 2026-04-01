import { useState } from 'react'
import { CheckCircle, XCircle, Clock, User, Store, AlertTriangle, X, RefreshCw, AlertCircle, GitMerge } from 'lucide-react'
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}д назад`
  if (h > 0) return `${h}ч назад`
  return 'только что'
}

export default function ModerationPage() {
  const [tab, setTab] = useState<'ALL' | 'seller' | 'store'>('ALL')
  const [rejectTarget, setRejectTarget] = useState<ModerationCase | null>(null)
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, refetch } = useFetch<QueueResponse>('/api/v1/admin/moderation/queue', [tab])

  const cases = (data?.cases ?? []).filter(c => tab === 'ALL' || c.entityType === tab)
  const total = data?.total ?? 0

  const counts = {
    ALL: data?.cases.length ?? 0,
    seller: data?.cases.filter(c => c.entityType === 'seller').length ?? 0,
    store:  data?.cases.filter(c => c.entityType === 'store').length ?? 0,
  }

  async function doAction(caseId: string, action: string, comment?: string) {
    setActionLoading(caseId)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/moderation/${caseId}/action`, { action, comment })
      setRejectTarget(null)
      setComment('')
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
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
            {loading ? 'Загрузка...' : `Очередь · ${total} ожидает`}
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['ALL', 'seller', 'store'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
            background: tab === t ? 'var(--primary-dim)' : 'var(--surface)',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {t === 'seller' && <User size={13} />}
            {t === 'store' && <Store size={13} />}
            {t === 'ALL' ? 'Все' : t === 'seller' ? 'Продавцы' : 'Магазины'}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
              background: tab === t ? 'rgba(129,140,248,0.2)' : 'var(--surface2)',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Загрузка...</div>
        ) : cases.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Очередь пуста — всё проверено
          </div>
        ) : cases.map(item => {
          const cfg = TYPE_CFG[item.entityType] ?? TYPE_CFG.seller
          const isProcessing = actionLoading === item.id
          return (
            <div key={item.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              opacity: isProcessing ? 0.6 : 1, transition: 'opacity 0.2s',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <cfg.icon size={20} color={cfg.color} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{cfg.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', background: 'var(--surface2)', padding: '1px 8px', borderRadius: 20, fontFamily: 'monospace' }}>
                    {item.caseType}
                  </span>
                  {item.assignedAdminId && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 8px', borderRadius: 20 }}>
                      Назначен
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  ID: {item.entityId}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginRight: 4, whiteSpace: 'nowrap' }}>
                <Clock size={12} /> {timeAgo(item.createdAt)}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  disabled={isProcessing}
                  onClick={() => doAction(item.id, 'APPROVE')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                    color: '#10B981', fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !isProcessing && ((e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.1)')}
                >
                  <CheckCircle size={15} /> Одобрить
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => setRejectTarget(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                    color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !isProcessing && ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.16)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)')}
                >
                  <XCircle size={15} /> Отклонить
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => doAction(item.id, 'REQUEST_CHANGES')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                    color: '#F59E0B', fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !isProcessing && ((e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.16)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)')}
                >
                  <AlertTriangle size={14} />
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => doAction(item.id, 'ESCALATE')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                    background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.25)',
                    color: 'var(--primary)', fontSize: 13, fontWeight: 600, cursor: isProcessing ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => !isProcessing && ((e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.16)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'rgba(129,140,248,0.08)')}
                >
                  <GitMerge size={14} />
                </button>
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
            <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 14 }}>
              Тип: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{TYPE_CFG[rejectTarget.entityType]?.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 8, fontFamily: 'monospace' }}>{rejectTarget.entityId.slice(0, 12)}...</span>
            </p>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              Укажи причину — она будет передана в систему. Обязательное поле.
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4, marginBottom: 18 }}>
              {comment.length} символов
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
                disabled={!comment.trim() || actionLoading === rejectTarget.id}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: comment.trim() ? 'pointer' : 'not-allowed',
                  background: comment.trim() ? '#EF4444' : 'var(--surface2)',
                  color: comment.trim() ? 'white' : 'var(--text-muted)',
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
