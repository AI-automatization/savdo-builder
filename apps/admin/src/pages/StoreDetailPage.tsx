import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Phone, Ban, Unlock, ExternalLink, Package, User, XCircle, Archive, CheckCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  payload: Record<string, any> | null
  createdAt: string
  actorUser?: { phone: string }
}

interface StoreDetail {
  id: string
  name: string
  slug: string
  status: string
  description: string | null
  createdAt: string
  updatedAt: string
  seller: {
    id: string
    fullName: string
    verificationStatus: string
    user: { id: string; phone: string; status: string }
  }
  contacts: { type: string; value: string }[]
  deliverySettings: { deliveryEnabled: boolean; minOrderAmount: number | null } | null
  _count?: { products: number; orders: number }
}

const STATUS_CFG: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED:       { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Одобрен' },
  PENDING_REVIEW: { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'На проверке' },
  SUSPENDED:      { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', label: 'Приостановлен' },
  DRAFT:          { bg: 'rgba(148,163,184,0.1)',  text: '#94A3B8', label: 'Черновик' },
  REJECTED:       { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', label: 'Отклонён' },
  PUBLISHED:      { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Опубликован' },
  ARCHIVED:       { bg: 'rgba(148,163,184,0.1)',  text: '#94A3B8', label: 'Архив' },
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

export default function StoreDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: store, loading, error, refetch } = useFetch<StoreDetail>(`/api/v1/admin/stores/${id}`)
  const { data: auditData } = useFetch<{ logs: AuditEntry[]; total: number }>(
    `/api/v1/admin/audit-log?entityType=Store&entityId=${store?.id ?? 'none'}&limit=20`,
    [store?.id],
  )

  const [modal, setModal] = useState<'suspend' | 'unsuspend' | 'reject' | 'archive' | 'approve' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const MODAL_ENDPOINT: Record<string, string> = {
    suspend:   'suspend',
    unsuspend: 'unsuspend',
    reject:    'reject',
    archive:   'archive',
    approve:   'approve',
  }

  const handleAction = async (reason: string) => {
    if (!store || !modal) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/stores/${store.id}/${MODAL_ENDPOINT[modal]}`, { reason })
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

  if (error || !store) return (
    <div style={{ padding: 32 }}>
      <button onClick={() => navigate('/stores')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 20 }}>
        <ArrowLeft size={16} /> Назад
      </button>
      <div style={{ color: '#EF4444', fontSize: 14 }}>{error ?? 'Магазин не найден'}</div>
    </div>
  )

  const statusCfg = STATUS_CFG[store.status] ?? STATUS_CFG.DRAFT
  const isSuspended   = store.status === 'SUSPENDED'
  const isRejected    = store.status === 'REJECTED'
  const isArchived    = store.status === 'ARCHIVED'
  const isPendingReview = store.status === 'PENDING_REVIEW'
  const suspendEntry = auditData?.logs?.find(e => e.action === 'STORE_SUSPENDED')
  const suspendReason: string | null = suspendEntry?.payload?.reason ?? null

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh', maxWidth: 900 }}>
      {/* Back */}
      <button onClick={() => navigate('/stores')} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginBottom: 24, padding: 0 }}>
        <ArrowLeft size={16} /> Назад к магазинам
      </button>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertTriangle size={15} /> {actionError}
        </div>
      )}

      {isSuspended && suspendReason && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <Ban size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span><strong>Причина приостановки:</strong> {suspendReason}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{store.name}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusCfg.bg, color: statusCfg.text }}>
              {statusCfg.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 13 }}>/{store.slug}</span>
            <a
              href={`${(import.meta as any).env?.VITE_BUYER_URL ?? '#'}/${store.slug}`}
              target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)', fontSize: 12, textDecoration: 'none' }}
            >
              <ExternalLink size={12} /> Открыть витрину
            </a>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPendingReview && (
            <button onClick={() => setModal('approve')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <CheckCircle size={14} /> Одобрить
            </button>
          )}
          {isSuspended ? (
            <button onClick={() => setModal('unsuspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Unlock size={14} /> Восстановить
            </button>
          ) : (
            <button onClick={() => setModal('suspend')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Ban size={14} /> Приостановить
            </button>
          )}
          {!isRejected && (
            <button onClick={() => setModal('reject')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <XCircle size={14} /> Отклонить
            </button>
          )}
          {!isArchived && (
            <button onClick={() => setModal('archive')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(148,163,184,0.06)', color: '#94A3B8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Archive size={14} /> В архив
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {store._count && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Товаров', value: store._count.products, icon: Package },
            { label: 'Заказов', value: store._count.orders, icon: Package },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Seller */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Продавец</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #818CF8, #6366F1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {store.seller.fullName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{store.seller.fullName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{store.seller.verificationStatus}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Phone size={13} color="var(--text-muted)" />
            <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 13 }}>{store.seller.user.phone}</span>
          </div>
          <button onClick={() => navigate(`/sellers/${store.seller.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
            <User size={13} /> Перейти к продавцу
          </button>
        </div>

        {/* Dates */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Информация</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Создан</span>
            <span style={{ color: 'var(--text)', fontSize: 13 }}>{new Date(store.createdAt).toLocaleDateString('ru-RU')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Обновлён</span>
            <span style={{ color: 'var(--text)', fontSize: 13 }}>{new Date(store.updatedAt).toLocaleDateString('ru-RU')}</span>
          </div>
          {store.deliverySettings && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Доставка</span>
              <span style={{ color: store.deliverySettings.deliveryEnabled ? '#10B981' : 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>
                {store.deliverySettings.deliveryEnabled ? 'Включена' : 'Выключена'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {store.description && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Описание</div>
          <p style={{ margin: 0, color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{store.description}</p>
        </div>
      )}

      {/* Contacts */}
      {store.contacts?.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>Контакты</div>
          {store.contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < store.contacts.length - 1 ? 8 : 0 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{c.type}</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontFamily: 'monospace' }}>{c.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Audit History */}
      {auditData && auditData.logs.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            История действий ({auditData.logs.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditData.logs.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.action.includes('SUSPENDED') || entry.action.includes('REJECTED') ? '#EF4444' : entry.action.includes('APPROVED') || entry.action.includes('UNSUSPEND') ? '#10B981' : '#94A3B8', marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{entry.action}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(entry.createdAt).toLocaleString('ru-RU')}</span>
                  </div>
                  {entry.payload?.reason && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Причина: {entry.payload.reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'suspend' && (
        <ConfirmModal
          title="Приостановить магазин"
          description={`Магазин «${store.name}» будет скрыт и недоступен покупателям.`}
          actionLabel="Приостановить"
          actionColor="#EF4444"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'unsuspend' && (
        <ConfirmModal
          title="Восстановить магазин"
          description={`Магазин «${store.name}» снова станет доступен покупателям.`}
          actionLabel="Восстановить"
          actionColor="#10B981"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'reject' && (
        <ConfirmModal
          title="Отклонить магазин"
          description={`Магазин «${store.name}» получит статус REJECTED и будет недоступен покупателям.`}
          actionLabel="Отклонить"
          actionColor="#EF4444"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'archive' && (
        <ConfirmModal
          title="Архивировать магазин"
          description={`Магазин «${store.name}» будет перемещён в архив. Данные сохранятся.`}
          actionLabel="В архив"
          actionColor="#64748B"
          requireReason={true}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
      {modal === 'approve' && (
        <ConfirmModal
          title="Одобрить магазин"
          description={`Магазин «${store.name}» будет одобрен и получит статус APPROVED.`}
          actionLabel="Одобрить"
          actionColor="#10B981"
          requireReason={false}
          onConfirm={handleAction}
          onCancel={() => setModal(null)}
          loading={actionLoading}
        />
      )}
    </div>
  )
}
