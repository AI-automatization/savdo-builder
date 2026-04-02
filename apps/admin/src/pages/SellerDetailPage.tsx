import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, Store, Phone, Calendar, Ban, Unlock, Shield } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface ModerationAction {
  id: string
  action: string
  comment: string | null
  createdAt: string
  adminUser: { id: string; isSuperadmin: boolean; user: { phone: string } }
}

interface ModerationCase {
  id: string
  caseType: string
  status: string
  createdAt: string
  actions: ModerationAction[]
}

interface SellerDetail {
  id: string
  fullName: string
  bio: string | null
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED'
  isBlocked: boolean
  blockedReason: string | null
  createdAt: string
  user: { id: string; phone: string; status: string; role: string }
  store: { id: string; name: string; slug: string; status: string } | null
  moderationCases: ModerationCase[]
}

const VERIFY_CFG: Record<string, { bg: string; text: string; icon: any; label: string }> = {
  VERIFIED:   { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', icon: CheckCircle,   label: 'Верифицирован' },
  PENDING:    { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', icon: Clock,          label: 'На проверке' },
  REJECTED:   { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', icon: XCircle,        label: 'Отклонён' },
  UNVERIFIED: { bg: 'rgba(148,163,184,0.1)',  text: '#94A3B8', icon: Clock,          label: 'Не верифицирован' },
  SUSPENDED:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', icon: AlertTriangle,  label: 'Заблокирован' },
}

function ConfirmModal({
  title, description, actionLabel, actionColor, requireReason,
  onConfirm, onCancel, loading,
}: {
  title: string; description: string; actionLabel: string; actionColor: string
  requireReason: boolean; onConfirm: (reason: string) => void
  onCancel: () => void; loading: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>{description}</p>
        {requireReason && (
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Причина (обязательно)..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 16 }}
          />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
            Отмена
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || (requireReason && !reason.trim())}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: actionColor, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: (requireReason && !reason.trim()) ? 0.5 : 1 }}
          >
            {loading ? 'Загрузка...' : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: seller, loading, error, refetch } = useFetch<SellerDetail>(`/api/v1/admin/sellers/${id}`)

  const [modal, setModal] = useState<'suspend' | 'unsuspend' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAction = async (reason: string) => {
    if (!seller) return
    setActionLoading(true)
    setActionError(null)
    try {
      const endpoint = modal === 'suspend'
        ? `/api/v1/admin/users/${seller.user.id}/suspend`
        : `/api/v1/admin/users/${seller.user.id}/unsuspend`
      await api.post(endpoint, { reason })
      setModal(null)
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</div>
  )

  if (error || !seller) return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate('/sellers')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Назад
      </button>
      <div style={{ color: '#EF4444', fontSize: 14 }}>{error ?? 'Продавец не найден'}</div>
    </div>
  )

  const verifyCfg = VERIFY_CFG[seller.verificationStatus] ?? VERIFY_CFG.UNVERIFIED
  const isUserBlocked = seller.user.status === 'BLOCKED'

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh', maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => navigate('/sellers')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Назад к продавцам
      </button>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertTriangle size={15} /> {actionError}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #818CF8, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {seller.fullName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{seller.fullName || '—'}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: verifyCfg.bg, color: verifyCfg.text }}>
                <verifyCfg.icon size={11} /> {verifyCfg.label}
              </span>
              {isUserBlocked && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                  <Ban size={11} /> Аккаунт заблокирован
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {isUserBlocked ? (
            <button onClick={() => setModal('unsuspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Unlock size={14} /> Разблокировать
            </button>
          ) : (
            <button onClick={() => setModal('suspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Ban size={14} /> Заблокировать
            </button>
          )}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Контакт</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Phone size={15} color="var(--text-muted)" />
            <span style={{ fontFamily: 'monospace', color: 'var(--text)', fontSize: 14 }}>{seller.user.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={15} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              Зарегистрирован {new Date(seller.createdAt).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Аккаунт</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Статус</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: isUserBlocked ? '#EF4444' : '#10B981' }}>
              {isUserBlocked ? 'Заблокирован' : 'Активен'}
            </span>
          </div>
          {seller.isBlocked && seller.blockedReason && (
            <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
              Причина: {seller.blockedReason}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      {seller.bio && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>О продавце</div>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{seller.bio}</p>
        </div>
      )}

      {/* Store */}
      {seller.store && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Магазин</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Store size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{seller.store.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{seller.store.slug}</div>
              </div>
            </div>
            <button onClick={() => navigate(`/stores/${seller.store!.id}`)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
              Открыть
            </button>
          </div>
        </div>
      )}

      {/* Moderation History */}
      {seller.moderationCases && seller.moderationCases.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Shield size={15} color="var(--text-muted)" />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              История модерации ({seller.moderationCases.length})
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {seller.moderationCases.map(mc => (
              <div key={mc.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mc.actions.length > 0 ? 10 : 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{mc.caseType}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                      background: mc.status === 'CLOSED' ? 'rgba(16,185,129,0.12)' : mc.status === 'OPEN' ? 'rgba(245,158,11,0.12)' : 'rgba(148,163,184,0.1)',
                      color: mc.status === 'CLOSED' ? '#10B981' : mc.status === 'OPEN' ? '#F59E0B' : '#94A3B8',
                    }}>{mc.status}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(mc.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
                {mc.actions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {mc.actions.map(a => {
                      const actionColor: Record<string, string> = {
                        APPROVE: '#10B981', REJECT: '#EF4444',
                        REQUEST_CHANGES: '#F59E0B', ESCALATE: '#818CF8',
                      }
                      return (
                        <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '6px 10px', borderRadius: 8, background: 'var(--surface)', borderLeft: `3px solid ${actionColor[a.action] ?? '#94A3B8'}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: a.comment ? 4 : 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: actionColor[a.action] ?? '#94A3B8' }}>{a.action}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.adminUser.user.phone}{a.adminUser.isSuperadmin ? ' (super)' : ''}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {new Date(a.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {a.comment && (
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{a.comment}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'suspend' && (
        <ConfirmModal
          title="Заблокировать аккаунт"
          description={`Пользователь ${seller.user.phone} потеряет доступ к платформе.`}
          actionLabel="Заблокировать"
          actionColor="#EF4444"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'unsuspend' && (
        <ConfirmModal
          title="Разблокировать аккаунт"
          description={`Пользователь ${seller.user.phone} снова получит доступ к платформе.`}
          actionLabel="Разблокировать"
          actionColor="#10B981"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
