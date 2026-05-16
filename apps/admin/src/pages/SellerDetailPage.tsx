import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, Store, Phone, Calendar, Ban, Unlock, Shield, UserCheck, Plus, X } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { SellerVerificationPanel } from '../components/admin/SellerVerificationPanel'
import { ActivityLogPanel } from '../components/admin/ActivityLogPanel'
import { useTranslation } from '../lib/i18n'

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

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  payload: Record<string, any> | null
  createdAt: string
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

const VERIFY_CFG: Record<string, { bg: string; text: string; icon: any; labelKey: string }> = {
  VERIFIED:   { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', icon: CheckCircle,   labelKey: 'sellerDetail.statusVERIFIED' },
  PENDING:    { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', icon: Clock,          labelKey: 'sellerDetail.statusPENDING' },
  REJECTED:   { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', icon: XCircle,        labelKey: 'sellerDetail.statusREJECTED' },
  UNVERIFIED: { bg: 'rgba(148,163,184,0.1)',  text: '#94A3B8', icon: Clock,          labelKey: 'sellerDetail.statusUNVERIFIED' },
  SUSPENDED:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', icon: AlertTriangle,  labelKey: 'sellerDetail.statusSUSPENDED' },
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
  const { t } = useTranslation()
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw' }}>
        <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: 18, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '0 0 20px', color: 'var(--text-muted)', fontSize: 14 }}>{description}</p>
        {requireReason && (
          <textarea
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder={t('sellerDetail.reasonPlaceholder')}
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', marginBottom: 16 }}
          />
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
            {t('common.cancel')}
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || (requireReason && !reason.trim())}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: actionColor, color: 'white', fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: (requireReason && !reason.trim()) ? 0.5 : 1 }}
          >
            {loading ? t('common.loading') : actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: seller, loading, error, refetch } = useFetch<SellerDetail>(`/api/v1/admin/sellers/${id}`)
  const { data: auditData } = useFetch<{ logs: AuditEntry[]; total: number }>(
    `/api/v1/admin/audit-log?entityType=User&entityId=${seller?.user?.id ?? 'none'}&limit=50`,
    [seller?.user?.id],
  )

  const [modal, setModal] = useState<'suspend' | 'unsuspend' | 'verify' | 'reject' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showCreateStore, setShowCreateStore] = useState(false)
  const [createStoreForm, setCreateStoreForm] = useState({ name: '', city: '', telegramContactLink: '', description: '', region: '', slug: '' })
  const [createStoreLoading, setCreateStoreLoading] = useState(false)
  const [createStoreError, setCreateStoreError] = useState<string | null>(null)

  const handleCreateStore = async () => {
    if (!seller || !createStoreForm.name.trim() || !createStoreForm.city.trim() || !createStoreForm.telegramContactLink.trim()) return
    setCreateStoreLoading(true); setCreateStoreError(null)
    try {
      await api.post(`/api/v1/admin/sellers/${seller.id}/create-store`, createStoreForm)
      setShowCreateStore(false)
      setCreateStoreForm({ name: '', city: '', telegramContactLink: '', description: '', region: '', slug: '' })
      refetch()
    } catch (e: any) {
      setCreateStoreError(e.message ?? t('common.error'))
    } finally {
      setCreateStoreLoading(false)
    }
  }

  const handleAction = async (reason: string) => {
    if (!seller) return
    setActionLoading(true)
    setActionError(null)
    try {
      if (modal === 'verify' || modal === 'reject') {
        const status = modal === 'verify' ? 'VERIFIED' : 'REJECTED'
        await api.patch(`/api/v1/admin/sellers/${seller.id}/verify`, { status })
      } else {
        const endpoint = modal === 'suspend'
          ? `/api/v1/admin/users/${seller.user.id}/suspend`
          : `/api/v1/admin/users/${seller.user.id}/unsuspend`
        await api.post(endpoint, { reason })
      }
      setModal(null)
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? t('common.error'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>{t('common.loading')}</div>
  )

  if (error || !seller) return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate('/sellers')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> {t('common.back')}
      </button>
      <div style={{ color: '#EF4444', fontSize: 14 }}>{error ?? t('sellerDetail.notFound')}</div>
    </div>
  )

  const verifyCfg = VERIFY_CFG[seller.verificationStatus] ?? VERIFY_CFG.UNVERIFIED
  const isUserBlocked = seller.user.status === 'BLOCKED'
  const suspendEntry = auditData?.logs?.find(e => e.action === 'USER_SUSPENDED')
  const blockReason: string | null = suspendEntry?.payload?.reason ?? null

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh', maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => navigate('/sellers')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> {t('sellerDetail.back')}
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
                <verifyCfg.icon size={11} /> {t(verifyCfg.labelKey)}
              </span>
              {isUserBlocked && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                  <Ban size={11} /> {t('sellerDetail.accountBlocked')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {seller.verificationStatus === 'PENDING' && (
            <>
              <button onClick={() => setModal('verify')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <UserCheck size={14} /> {t('sellerDetail.verify')}
              </button>
              <button onClick={() => setModal('reject')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <XCircle size={14} /> {t('sellerDetail.reject')}
              </button>
            </>
          )}
          {seller.verificationStatus === 'VERIFIED' && (
            <button onClick={() => setModal('reject')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <XCircle size={14} /> {t('sellerDetail.unverify')}
            </button>
          )}
          {(seller.verificationStatus === 'REJECTED' || seller.verificationStatus === 'UNVERIFIED') && (
            <button onClick={() => setModal('verify')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <UserCheck size={14} /> {t('sellerDetail.verify')}
            </button>
          )}
          {isUserBlocked ? (
            <button onClick={() => setModal('unsuspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Unlock size={14} /> {t('sellerDetail.unblock')}
            </button>
          ) : (
            <button onClick={() => setModal('suspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Ban size={14} /> {t('sellerDetail.block')}
            </button>
          )}
        </div>
      </div>

      {/* Main layout: left info + right history */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Контакт + Аккаунт side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{t('sellerDetail.contact')}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Phone size={13} color="var(--text-muted)" />
                <span style={{ fontFamily: 'monospace', color: 'var(--text)', fontSize: 13 }}>{seller.user.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={13} color="var(--text-muted)" />
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {new Date(seller.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{t('sellerDetail.account')}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('sellerDetail.statusLabel')}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: isUserBlocked ? '#EF4444' : '#10B981' }}>
                  {isUserBlocked ? t('sellerDetail.accBlocked') : t('sellerDetail.accActive')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('sellerDetail.role')}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{seller.user.role}</span>
              </div>
              {isUserBlocked && blockReason && (
                <div style={{ fontSize: 11, color: '#EF4444', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 7, marginTop: 8 }}>
                  {t('sellerDetail.reasonLabel')}: {blockReason}
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {seller.bio && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{t('sellerDetail.about')}</div>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 13, lineHeight: 1.6 }}>{seller.bio}</p>
            </div>
          )}

          {/* Store */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{t('sellerDetail.store')}</div>
            {seller.store ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Store size={16} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{seller.store.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{seller.store.slug}</div>
                  </div>
                </div>
                <button onClick={() => navigate(`/stores/${seller.store!.id}`)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                  {t('sellerDetail.open')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t('sellerDetail.noStore')}</span>
                <button onClick={() => setShowCreateStore(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'rgba(16,185,129,0.12)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> {t('sellerDetail.createStore')}
                </button>
              </div>
            )}
          </div>

          {/* Moderation Cases */}
          {seller.moderationCases && seller.moderationCases.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Shield size={13} color="var(--text-muted)" />
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {t('sellerDetail.modCases', { count: seller.moderationCases.length })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {seller.moderationCases.map(mc => (
                  <div key={mc.id} style={{ background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mc.actions.length > 0 ? 8 : 0 }}>
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

        </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT COLUMN — Верификация + История */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SellerVerificationPanel
          sellerId={seller.id}
          initialStatus={seller.verificationStatus}
          onChanged={refetch}
        />
        <ActivityLogPanel
          entityType="User"
          entityId={seller.user?.id ?? null}
          emptyText={t('sellerDetail.historyEmpty')}
        />
        </div>
        {/* END RIGHT COLUMN */}

      </div>
      {/* END MAIN GRID */}

      {/* Modals */}
      {modal === 'verify' && (
        <ConfirmModal
          title={t('sellerDetail.mVerifyTitle')}
          description={t('sellerDetail.mVerifyDesc', { name: seller.fullName })}
          actionLabel={t('sellerDetail.verify')}
          actionColor="#10B981"
          requireReason={false}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'reject' && (
        <ConfirmModal
          title={t('sellerDetail.mRejectTitle')}
          description={t('sellerDetail.mRejectDesc', { name: seller.fullName })}
          actionLabel={t('sellerDetail.reject')}
          actionColor="#EF4444"
          requireReason={false}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'suspend' && (
        <ConfirmModal
          title={t('sellerDetail.mSuspendTitle')}
          description={t('sellerDetail.mSuspendDesc', { phone: seller.user.phone })}
          actionLabel={t('sellerDetail.block')}
          actionColor="#EF4444"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'unsuspend' && (
        <ConfirmModal
          title={t('sellerDetail.mUnsuspendTitle')}
          description={t('sellerDetail.mUnsuspendDesc', { phone: seller.user.phone })}
          actionLabel={t('sellerDetail.unblock')}
          actionColor="#10B981"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}

      {/* Create Store Modal */}
      {showCreateStore && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 480, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{t('sellerDetail.createStore')}</h3>
              <button onClick={() => setShowCreateStore(false)} aria-label={t('sellerDetail.close')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18, padding: '8px 12px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, borderLeft: '3px solid #10B981' }}>
              {t('sellerDetail.csNote')} <strong>{seller.fullName}</strong>
            </div>
            {([
              { key: 'name', label: t('sellerDetail.csName'), required: true, placeholder: 'Uzcar Market' },
              { key: 'city', label: t('sellerDetail.csCity'), required: true, placeholder: t('sellerDetail.csCityPh') },
              { key: 'telegramContactLink', label: t('sellerDetail.csTgContact'), required: true, placeholder: '@username' },
              { key: 'description', label: t('sellerDetail.csDescription'), required: false, placeholder: t('sellerDetail.csOptional') },
              { key: 'region', label: t('sellerDetail.csRegion'), required: false, placeholder: t('sellerDetail.csOptional') },
              { key: 'slug', label: t('sellerDetail.csSlug'), required: false, placeholder: t('sellerDetail.csSlugAuto') },
            ] as const).map(({ key, label, required, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
                </div>
                <input value={createStoreForm[key]} onChange={e => setCreateStoreForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }} />
              </div>
            ))}
            {createStoreError && (
              <div style={{ fontSize: 12, color: '#EF4444', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, marginBottom: 14 }}>{createStoreError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateStore(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>{t('common.cancel')}</button>
              <button onClick={handleCreateStore} disabled={createStoreLoading || !createStoreForm.name.trim() || !createStoreForm.city.trim() || !createStoreForm.telegramContactLink.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, border: 'none', background: '#10B981', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: (!createStoreForm.name.trim() || !createStoreForm.city.trim() || !createStoreForm.telegramContactLink.trim()) ? 0.5 : 1 }}>
                <Store size={14} /> {createStoreLoading ? t('sellerDetail.creating') : t('sellerDetail.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
