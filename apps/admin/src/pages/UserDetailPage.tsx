import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Phone, AlertCircle, ShieldOff, ShieldCheck, UserCheck, Store, ShoppingBag, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { auth, api } from '../lib/api'
import { useImpersonation } from '../lib/impersonation'
import { PageHeader } from '../components/admin/PageHeader'
import { Panel } from '../components/admin/Panel'
import { InfoRow } from '../components/admin/InfoRow'
import { ActionPanel } from '../components/admin/ActionPanel'
import { StatusBadge } from '../components/admin/StatusBadge'

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
  SELLER: { bg: 'rgba(129,140,248,0.12)', text: '#818CF8', label: 'Продавец' },
  BUYER:  { bg: 'rgba(34,197,94,0.12)',   text: '#22C55E', label: 'Покупатель' },
  ADMIN:  { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', label: 'Администратор' },
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const impersonation = useImpersonation()

  const [suspendModal, setSuspendModal] = useState(false)
  const [reason, setReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [impersonateConfirm, setImpersonateConfirm] = useState(false)
  const [impersonating, setImpersonating] = useState(false)

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

  async function handleImpersonate() {
    if (!id || !user) return
    setImpersonating(true)
    try {
      const res = await api.post<{ accessToken: string; refreshToken?: string }>(
        `/api/v1/admin/auth/impersonate/${id}`,
        {},
      )
      const originalAccess = auth.getAccess() ?? ''
      const originalRefresh = auth.getRefresh()
      impersonation.start(
        {
          userId: id,
          userPhone: user.phone,
          userName: user.buyer?.fullName ?? null,
          startedAt: new Date().toISOString(),
        },
        originalAccess,
        originalRefresh,
      )
      auth.setTokens(res.accessToken, res.refreshToken ?? originalRefresh ?? '')
      toast.success(`Вы вошли как ${user.phone}`)
      const tmaUrl = (import.meta as any).env?.VITE_BUYER_URL ?? '/'
      window.open(tmaUrl, '_blank', 'noopener')
      setImpersonateConfirm(false)
    } catch (e: any) {
      toast.error(e.message ?? 'Не удалось переключиться на пользователя')
    } finally {
      setImpersonating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-[14px]" style={{ color: 'var(--text-muted)' }}>Загрузка...</div>
  }

  if (error || !user) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-[14px]" style={{ color: '#EF4444' }}>
          <AlertCircle size={16} /> {error ?? 'Пользователь не найден'}
        </div>
      </div>
    )
  }

  const roleCfg = ROLE_CFG[user.role] ?? ROLE_CFG.BUYER
  const isBlocked = user.status === 'BLOCKED'

  return (
    <div className="px-8 pt-8 pb-12 min-h-screen">
      <PageHeader
        icon={<Phone size={18} />}
        title={user.phone}
        subtitle={`ID: ${user.id}`}
        backTo="/users"
        backLabel="Пользователи"
        actions={
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
              style={{ background: roleCfg.bg, color: roleCfg.text }}
            >
              {roleCfg.label}
            </span>
            <StatusBadge status={user.status} />
          </div>
        }
      />

      {actionError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-[13px]"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 280px', alignItems: 'start' }}>
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <Panel title="Основная информация">
            <InfoRow label="Телефон">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                  {user.phone}
                </span>
                {user.isPhoneVerified && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,197,94,0.12)', color: '#22C55E' }}>
                    верифицирован
                  </span>
                )}
              </div>
            </InfoRow>
            <InfoRow label="Роль">
              <span
                className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
                style={{ background: roleCfg.bg, color: roleCfg.text }}
              >
                {roleCfg.label}
              </span>
            </InfoRow>
            <InfoRow label="Статус">
              <StatusBadge status={user.status} />
            </InfoRow>
            <InfoRow label="Язык">
              <span className="text-[13px]" style={{ color: 'var(--text)' }}>{user.languageCode ?? '—'}</span>
            </InfoRow>
            <InfoRow label="Регистрация" border={false}>
              <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                {new Date(user.createdAt).toLocaleString('ru-RU')}
              </span>
            </InfoRow>
          </Panel>

          {user.seller && (
            <Panel title="Профиль продавца" icon={<Store size={15} />}>
              <InfoRow label="Верификация">
                <StatusBadge status={user.seller.verificationStatus} />
              </InfoRow>
              <InfoRow label="Telegram">
                {user.seller.telegramChatId ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[12px]" style={{ color: '#22C55E' }}>
                      {user.seller.telegramChatId}
                    </span>
                    {user.seller.telegramUsername && (
                      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                        @{user.seller.telegramUsername}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[13px]" style={{ color: 'var(--text-dim)' }}>Не подключён</span>
                )}
              </InfoRow>
              <InfoRow label="Продавец с" border={false}>
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(user.seller.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </InfoRow>
              <div className="mt-3">
                <button
                  onClick={() => navigate(`/sellers/${user.seller!.id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-semibold"
                  style={{
                    border: '1px solid rgba(129,140,248,0.3)',
                    background: 'rgba(129,140,248,0.08)',
                    color: '#818CF8',
                    cursor: 'pointer',
                  }}
                >
                  <UserCheck size={13} /> Открыть профиль продавца
                </button>
              </div>
            </Panel>
          )}

          {user.buyer && (
            <Panel title="Профиль покупателя" icon={<ShoppingBag size={15} />}>
              <InfoRow label="Имя">
                <span className="text-[13px]" style={{ color: 'var(--text)' }}>{user.buyer.fullName ?? '—'}</span>
              </InfoRow>
              <InfoRow label="Покупатель с" border={false}>
                <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                  {new Date(user.buyer.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </InfoRow>
            </Panel>
          )}

          {user.admin && (
            <div
              className="rounded-xl px-5 py-4 text-[13px] font-semibold"
              style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
            >
              Системный администратор — ограниченные действия
            </div>
          )}
        </div>

        {/* Right column */}
        <ActionPanel>
          {user.admin ? (
            <p className="m-0 text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Нельзя блокировать администраторов через UI.
            </p>
          ) : isBlocked ? (
            <button
              disabled={actionLoading}
              onClick={unsuspend}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[14px] font-semibold transition-opacity"
              style={{
                border: '1px solid rgba(34,197,94,0.3)',
                background: 'rgba(34,197,94,0.08)',
                color: '#22C55E',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <ShieldCheck size={14} /> {actionLoading ? 'Загрузка...' : 'Разблокировать'}
            </button>
          ) : (
            <button
              disabled={actionLoading}
              onClick={() => { setSuspendModal(true); setReason(''); setActionError(null) }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[14px] font-semibold transition-opacity"
              style={{
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.08)',
                color: '#EF4444',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.6 : 1,
              }}
            >
              <ShieldOff size={14} /> Заблокировать
            </button>
          )}

          {!user.admin && !isBlocked && (
            <button
              onClick={() => setImpersonateConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-[14px] font-semibold"
              style={{
                border: '1px solid rgba(245,158,11,0.3)',
                background: 'rgba(245,158,11,0.08)',
                color: '#F59E0B',
                cursor: 'pointer',
              }}
              title="Войти в TMA от имени пользователя для диагностики"
            >
              <Eye size={14} /> Impersonate
            </button>
          )}
        </ActionPanel>
      </div>

      {/* Suspend Modal */}
      {suspendModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[200]"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSuspendModal(false)}
        >
          <div
            className="rounded-2xl p-7 w-[420px] max-w-[90vw]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="m-0 mb-2 text-[18px] font-bold" style={{ color: 'var(--text)' }}>
              Заблокировать пользователя
            </h3>
            <p className="m-0 mb-4 text-[14px]" style={{ color: 'var(--text-muted)' }}>
              <code className="font-mono">{user.phone}</code> потеряет доступ к платформе.
            </p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Причина блокировки (обязательно)..."
              rows={3}
              className="w-full px-3.5 py-3 rounded-xl text-[14px] resize-y outline-none"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
            {actionError && (
              <div className="mt-2 text-[12px]" style={{ color: '#EF4444' }}>{actionError}</div>
            )}
            <div className="flex gap-2.5 justify-end mt-4">
              <button
                onClick={() => setSuspendModal(false)}
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
                onClick={suspend}
                disabled={reason.trim().length < 5 || actionLoading}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold"
                style={{
                  border: 'none',
                  cursor: reason.trim().length >= 5 ? 'pointer' : 'not-allowed',
                  background: reason.trim().length >= 5 ? '#EF4444' : 'var(--surface2)',
                  color: reason.trim().length >= 5 ? 'white' : 'var(--text-muted)',
                }}
              >
                {actionLoading ? 'Загрузка...' : 'Заблокировать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impersonate Confirm */}
      {impersonateConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 200 }}
          onClick={() => !impersonating && setImpersonateConfirm(false)}
        >
          <div
            className="rounded-2xl p-7 w-[480px] max-w-[92vw]"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="m-0 mb-2 text-[18px] font-bold" style={{ color: 'var(--text)' }}>
              Войти как {user.phone}?
            </h3>
            <p className="m-0 mb-3 text-[13px]" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Все ваши действия в TMA будут выполнены от имени пользователя
              и записаны в audit-log с пометкой <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>impersonated_by</code>.
            </p>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 12, marginBottom: 18 }}>
              <p className="m-0 text-[12px]" style={{ color: '#F59E0B' }}>
                ⚠ Используйте только для диагностики проблем.
                Не делайте покупок, не пишите сообщения от имени пользователя без согласия.
              </p>
            </div>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setImpersonateConfirm(false)}
                disabled={impersonating}
                className="px-5 py-2.5 rounded-xl text-[14px]"
                style={{ border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={handleImpersonate}
                disabled={impersonating}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold"
                style={{ border: 'none', background: '#F59E0B', color: 'white', cursor: impersonating ? 'wait' : 'pointer', opacity: impersonating ? 0.6 : 1 }}
              >
                {impersonating ? 'Переключение...' : 'Войти как пользователь'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
