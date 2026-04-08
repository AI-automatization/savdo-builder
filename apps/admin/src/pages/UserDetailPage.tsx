import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, AlertCircle, ShieldOff, ShieldCheck, UserCheck, Store, ShoppingBag } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface Seller {
  id: string
  verificationStatus: string
  telegramChatId: string | null
  telegramUsername: string | null
  createdAt: string
}

interface Buyer {
  id: string
  fullName: string | null
  createdAt: string
}

interface AdminUser {
  id: string
}

interface UserDetail {
  id: string
  phone: string
  role: string
  status: string
  isPhoneVerified: boolean
  languageCode: string | null
  createdAt: string
  seller: Seller | null
  buyer: Buyer | null
  admin: AdminUser | null
}

const ROLE_CFG: Record<string, { bg: string; text: string; label: string }> = {
  SELLER: { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', label: 'Продавец' },
  BUYER:  { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Покупатель' },
  ADMIN:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'Администратор' },
}

const VERIFICATION_CFG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'На проверке' },
  VERIFIED:  { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', label: 'Верифицирован' },
  REJECTED:  { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', label: 'Отклонён' },
  UNVERIFIED:{ bg: 'rgba(148,163,184,0.10)', text: '#94A3B8', label: 'Не верифицирован' },
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: 13, color: 'var(--text-muted)', paddingTop: 2 }}>{label}</span>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [suspendModal, setSuspendModal] = useState(false)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: user, loading, error, refetch } = useFetch<UserDetail>(
    `/api/v1/admin/users/${id}`,
    [id],
  )

  async function suspend() {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/users/${id}/suspend`, { reason })
      setSuspendModal(false)
      setReason('')
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  async function unsuspend() {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.post(`/api/v1/admin/users/${id}/unsuspend`, { reason: 'Admin unsuspend' })
      refetch()
    } catch (e: any) {
      setActionError(e.message ?? 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--text-muted)' }}>Загрузка...</div>
  if (error || !user) return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#EF4444', fontSize: 14 }}>
        <AlertCircle size={16} /> {error ?? 'Пользователь не найден'}
      </div>
    </div>
  )

  const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.BUYER
  const isBlocked = user.status === 'BLOCKED'

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => navigate('/users')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <ArrowLeft size={14} /> Пользователи
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Phone size={16} color="var(--primary)" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{user.phone}</h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: roleCfg.bg, color: roleCfg.text }}>
              {roleCfg.label}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: isBlocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
              color: isBlocked ? '#EF4444' : '#10B981',
            }}>
              {isBlocked ? 'Заблокирован' : 'Активен'}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            ID: <code style={{ fontFamily: 'monospace', fontSize: 12 }}>{user.id}</code>
          </p>
        </div>
      </div>

      {actionError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, alignItems: 'start' }}>
        {/* Left — User info + role-specific */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Basic info */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Основная информация</h3>
            <div>
              <Row label="Телефон">
                <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.phone}</span>
                {user.isPhoneVerified && (
                  <span style={{ marginLeft: 8, fontSize: 11, padding: '1px 6px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>верифицирован</span>
                )}
              </Row>
              <Row label="Роль">
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: roleCfg.bg, color: roleCfg.text }}>{roleCfg.label}</span>
              </Row>
              <Row label="Статус">
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: isBlocked ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', color: isBlocked ? '#EF4444' : '#10B981' }}>
                  {isBlocked ? 'Заблокирован' : 'Активен'}
                </span>
              </Row>
              <Row label="Язык">
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{user.languageCode ?? '—'}</span>
              </Row>
              <Row label="Регистрация">
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleString('ru-RU')}</span>
              </Row>
            </div>
          </div>

          {/* Seller info */}
          {user.seller && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Store size={15} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Профиль продавца</h3>
              </div>
              <div>
                <Row label="Верификация">
                  {(() => {
                    const vcfg = VERIFICATION_CFG[user.seller!.verificationStatus] ?? VERIFICATION_CFG.UNVERIFIED
                    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: vcfg.bg, color: vcfg.text }}>{vcfg.label}</span>
                  })()}
                </Row>
                <Row label="Telegram">
                  {user.seller.telegramChatId ? (
                    <div>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#10B981' }}>{user.seller.telegramChatId}</span>
                      {user.seller.telegramUsername && (
                        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-muted)' }}>@{user.seller.telegramUsername}</span>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>Не подключён</span>
                  )}
                </Row>
                <Row label="Продавец с">
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(user.seller.createdAt).toLocaleDateString('ru-RU')}</span>
                </Row>
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => navigate(`/sellers/${user.seller!.id}`)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)', color: '#818CF8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <UserCheck size={13} /> Открыть профиль продавца →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Buyer info */}
          {user.buyer && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ShoppingBag size={15} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Профиль покупателя</h3>
              </div>
              <div>
                <Row label="Имя">
                  <span style={{ fontSize: 13, color: 'var(--text)' }}>{user.buyer.fullName ?? '—'}</span>
                </Row>
                <Row label="Покупатель с">
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(user.buyer.createdAt).toLocaleDateString('ru-RU')}</span>
                </Row>
              </div>
            </div>
          )}

          {user.admin && (
            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Системный администратор — ограниченные действия</span>
            </div>
          )}
        </div>

        {/* Right — Actions */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Действия</h3>

          {user.admin ? (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Нельзя блокировать администраторов через UI.</p>
          ) : isBlocked ? (
            <button
              disabled={actionLoading}
              onClick={unsuspend}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.3)',
                background: 'rgba(16,185,129,0.08)', color: '#10B981',
                fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <ShieldCheck size={14} /> {actionLoading ? 'Загрузка...' : 'Разблокировать'}
            </button>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => { setSuspendModal(true); setReason(''); setActionError(null) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)', color: '#EF4444',
                fontSize: 14, fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <ShieldOff size={14} /> Заблокировать
            </button>
          )}
        </div>
      </div>

      {/* Suspend Modal */}
      {suspendModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' }}
          onClick={() => setSuspendModal(false)}
        >
          <div
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Заблокировать пользователя</h3>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
              <code style={{ fontFamily: 'monospace' }}>{user.phone}</code> потеряет доступ к платформе.
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Причина блокировки (обязательно)..."
              rows={3}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box', background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            />
            {actionError && (
              <div style={{ marginTop: 8, color: '#EF4444', fontSize: 12 }}>{actionError}</div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>
              <button onClick={() => setSuspendModal(false)} style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}>
                Отмена
              </button>
              <button
                onClick={suspend}
                disabled={reason.trim().length < 5 || actionLoading}
                style={{ padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600, cursor: reason.trim().length >= 5 ? 'pointer' : 'not-allowed', background: reason.trim().length >= 5 ? '#EF4444' : 'var(--surface2)', color: reason.trim().length >= 5 ? 'white' : 'var(--text-muted)' }}
              >
                {actionLoading ? 'Загрузка...' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
