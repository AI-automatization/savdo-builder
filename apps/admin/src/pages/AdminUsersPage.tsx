import { useState } from 'react'
import { Shield, Plus, UserCog, Trash2, AlertCircle, Phone, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { api } from '../lib/api'
import { useFocusTrap } from '../lib/use-focus-trap'
import { ROLE_OPTIONS, ROLE_BADGE, type AdminRole } from '../lib/admin-roles'

// API contract from super-admin.controller.ts admin-users-management.use-case.ts list().
// Backend возвращает плоский массив AdminRow[]; поле adminRole (НЕ role); user без fullName.
interface AdminRow {
  id: string
  userId: string
  adminRole: AdminRole
  isSuperadmin: boolean
  mfaEnabled?: boolean
  lastLoginAt?: string | null
  createdAt: string
  user: {
    id: string
    phone: string
  }
}

// /admin/auth/me возвращает текущую роль + permissions для UI gates.
interface AdminMe {
  id: string
  userId: string
  adminRole: AdminRole
  isSuperadmin: boolean
  mfaEnabled: boolean
}

export default function AdminUsersPage() {
  const { t, locale } = useTranslation()
  const { data: admins, loading, error, refetch } = useFetch<AdminRow[]>('/api/v1/admin/admins')
  const { data: me } = useFetch<AdminMe>('/api/v1/admin/auth/me')
  const [editTarget, setEditTarget] = useState<AdminRow | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<AdminRow | null>(null)

  const adminsList = admins ?? []
  const currentRole: AdminRole | null = me?.adminRole ?? null
  const currentAdminId: string | null = me?.id ?? null
  const isSuperAdmin = currentRole === 'super_admin'

  const handleRemove = async () => {
    if (!removeTarget) return
    try {
      await api.delete(`/api/v1/admin/admins/${removeTarget.id}`)
      toast.success(t('adminUsers.accessRemoved', { phone: removeTarget.user.phone }))
      setRemoveTarget(null)
      refetch()
    } catch (e: any) {
      toast.error(e.message ?? t('adminUsers.errRemove'))
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Shield size={20} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{t('adminUsers.title')}</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              {t('adminUsers.subtitle')}
            </p>
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setAddOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={14} /> {t('adminUsers.add')}
          </button>
        )}
      </div>

      {!isSuperAdmin && currentRole && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B', fontSize: 13 }}>
          <AlertCircle size={15} />
          {t('adminUsers.superAdminOnly')} <strong>{ROLE_BADGE[currentRole].label}</strong>
        </div>
      )}

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'var(--surface-error)', border: '1px solid var(--border-error-soft)', color: 'var(--error)', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('common.loading')}</div>
      ) : adminsList.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
          <Shield size={32} style={{ opacity: 0.3, color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>{t('adminUsers.notFound')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {adminsList.map(admin => {
            const cfg = ROLE_BADGE[admin.adminRole] ?? ROLE_BADGE.read_only
            const isSelf = admin.id === currentAdminId
            return (
              <div
                key={admin.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <UserCog size={18} color={cfg.text} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {admin.user.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Phone size={11} color="var(--text-dim)" />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: 12 }}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap' }}>
                    {cfg.label}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>
                  {t('adminUsers.assignedOn', { date: new Date(admin.createdAt).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU') })}
                </div>

                {isSuperAdmin && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setEditTarget(admin)}
                      disabled={isSelf}
                      style={{ flex: 1, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer', opacity: isSelf ? 0.5 : 1 }}
                    >
                      {t('adminUsers.changeRole')}
                    </button>
                    <button
                      onClick={() => setRemoveTarget(admin)}
                      disabled={isSelf || admin.adminRole === 'super_admin'}
                      title={admin.adminRole === 'super_admin' ? t('adminUsers.cannotRemoveSuper') : t('adminUsers.removeAccess')}
                      aria-label={admin.adminRole === 'super_admin' ? t('adminUsers.cannotRemoveSuper') : t('adminUsers.removeAccessAria')}
                      style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-error)', background: 'var(--surface-error)', color: 'var(--error)', fontSize: 12, fontWeight: 600, cursor: (isSelf || admin.adminRole === 'super_admin') ? 'not-allowed' : 'pointer', opacity: (isSelf || admin.adminRole === 'super_admin') ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Role Modal */}
      {editTarget && (
        <EditRoleDialog
          admin={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); refetch() }}
        />
      )}

      {/* Add Admin Modal */}
      {addOpen && (
        <AddAdminDialog
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); refetch() }}
        />
      )}

      {/* Remove confirm */}
      {removeTarget && (
        <ConfirmDialog
          title={t('adminUsers.removeConfirmTitle')}
          description={t('adminUsers.removeConfirmDesc', { phone: removeTarget.user.phone, role: ROLE_BADGE[removeTarget.adminRole].label })}
          actionLabel={t('common.delete')}
          actionColor="#EF4444"
          onConfirm={handleRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}

// ── Edit Role ────────────────────────────────────────────────────────────────

function EditRoleDialog({ admin, onClose, onSaved }: { admin: AdminRow; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [role, setRole] = useState<AdminRole>(admin.adminRole)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      // Backend (super-admin.controller.ts:131) expects @Body('adminRole'), не 'role'.
      await api.patch(`/api/v1/admin/admins/${admin.id}/role`, { adminRole: role })
      toast.success(t('adminUsers.roleUpdated', { role: ROLE_BADGE[role].label }))
      onSaved()
    } catch (e: any) {
      toast.error(e.message ?? t('adminUsers.errChangeRole'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width={500}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{t('adminUsers.changeRole')}</h3>
      <p style={{ margin: '6px 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>
        {admin.user.phone}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {ROLE_OPTIONS.map(opt => {
          const isActive = role === opt.value
          return (
            <label
              key={opt.value}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                borderRadius: 10, cursor: 'pointer',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: isActive ? 'rgba(129,140,248,0.06)' : 'var(--surface2)',
              }}
            >
              <input
                type="radio"
                checked={isActive}
                onChange={() => setRole(opt.value)}
                style={{ marginTop: 3, accentColor: 'var(--primary)' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {opt.description}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btnSecondary}>{t('common.cancel')}</button>
        <button
          onClick={submit}
          disabled={loading || role === admin.adminRole}
          style={{ ...btnPrimary, opacity: (loading || role === admin.adminRole) ? 0.5 : 1, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? t('adminUsers.saving') : t('common.save')}
        </button>
      </div>
    </ModalShell>
  )
}

// ── Add Admin ────────────────────────────────────────────────────────────────

interface FoundUser { id: string; phone: string; role: string; fullName?: string | null }

function AddAdminDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState('')
  const [searching, setSearching] = useState(false)
  const [found, setFound] = useState<FoundUser | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [role, setRole] = useState<AdminRole>('moderator')
  const [creating, setCreating] = useState(false)

  const lookup = async () => {
    if (!phone.trim()) return
    setSearching(true); setSearchError(null); setFound(null)
    try {
      const params = new URLSearchParams({ search: phone.trim(), limit: '1' })
      const res = await api.get<{ users: FoundUser[] }>(`/api/v1/admin/users?${params}`)
      const user = res.users?.[0] ?? null
      if (!user) {
        setSearchError(t('adminUsers.userNotFound'))
      } else {
        setFound(user)
      }
    } catch (e: any) {
      setSearchError(e.message ?? t('adminUsers.errSearch'))
    } finally {
      setSearching(false)
    }
  }

  const create = async () => {
    if (!found) return
    setCreating(true)
    try {
      // Backend (super-admin.controller.ts:115) expects {phone, adminRole}, не {userId, role}.
      // Phone берём из found, чтобы избежать опечаток пользователя.
      await api.post('/api/v1/admin/admins', { phone: found.phone, adminRole: role })
      toast.success(t('adminUsers.roleAssigned', { role: ROLE_BADGE[role].label, phone: found.phone }))
      onSaved()
    } catch (e: any) {
      toast.error(e.message ?? t('adminUsers.errCreate'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <ModalShell onClose={onClose} width={520}>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{t('adminUsers.add')}</h3>
      <p style={{ margin: '6px 0 18px', fontSize: 13, color: 'var(--text-muted)' }}>
        {t('adminUsers.addHint')}
      </p>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>{t('users.colPhone')}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="+998..."
            style={{ flex: 1, height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'monospace' }}
          />
          <button
            onClick={lookup}
            disabled={searching || !phone.trim()}
            style={{ ...btnPrimary, padding: '0 16px', height: 38, opacity: (searching || !phone.trim()) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Search size={14} /> {searching ? t('adminUsers.searching') : t('common.find')}
          </button>
        </div>
        {searchError && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444' }}>{searchError}</div>
        )}
      </div>

      {found && (
        <>
          <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
              {found.fullName || t('adminUsers.noName')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>
              {found.phone}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
              {t('adminUsers.currentRole')}: {found.role}
            </div>
          </div>

          <label style={labelStyle}>{t('adminUsers.assignRole')}</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
            {ROLE_OPTIONS.filter(r => r.value !== 'super_admin').map(opt => {
              const isActive = role === opt.value
              return (
                <label
                  key={opt.value}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                    borderRadius: 8, cursor: 'pointer',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: isActive ? 'rgba(129,140,248,0.06)' : 'var(--surface2)',
                  }}
                >
                  <input type="radio" checked={isActive} onChange={() => setRole(opt.value)} style={{ marginTop: 3, accentColor: 'var(--primary)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{opt.description}</div>
                  </div>
                </label>
              )
            })}
          </div>
        </>
      )}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={btnSecondary}>{t('common.cancel')}</button>
        <button
          onClick={create}
          disabled={!found || creating}
          style={{ ...btnPrimary, opacity: (!found || creating) ? 0.5 : 1, cursor: creating ? 'wait' : 'pointer' }}
        >
          {creating ? t('adminUsers.creating') : t('adminUsers.assignRole')}
        </button>
      </div>
    </ModalShell>
  )
}

// ── Confirm ──────────────────────────────────────────────────────────────────

function ConfirmDialog({ title, description, actionLabel, actionColor, onConfirm, onCancel }:
  { title: string; description: string; actionLabel: string; actionColor: string; onConfirm: () => void; onCancel: () => void }
) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  return (
    <ModalShell onClose={onCancel} width={420}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
      <p style={{ margin: '8px 0 22px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{description}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnSecondary}>{t('common.cancel')}</button>
        <button
          onClick={async () => { setLoading(true); try { await onConfirm() } finally { setLoading(false) } }}
          disabled={loading}
          style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: actionColor, color: 'white', fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : actionLabel}
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({ children, onClose, width, labelledBy }: { children: React.ReactNode; onClose: () => void; width: number; labelledBy?: string }) {
  const dialogRef = useFocusTrap<HTMLDivElement>(onClose)
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width, maxWidth: '92vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', outline: 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
}
const btnPrimary: React.CSSProperties = {
  height: 38, padding: '0 18px', borderRadius: 8, border: 'none',
  background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
}
const btnSecondary: React.CSSProperties = {
  height: 38, padding: '0 18px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface2)',
  color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
}
