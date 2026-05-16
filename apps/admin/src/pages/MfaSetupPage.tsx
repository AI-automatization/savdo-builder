import { useEffect, useState } from 'react'
import { Lock, Shield, ShieldCheck, ShieldOff, AlertCircle, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { useTranslation } from '../lib/i18n'

interface MfaStatus {
  enabled: boolean
  enabledAt?: string | null
}

// Backend payload from GET /admin/auth/me (super-admin.controller.ts:49).
// Эндпоинт /mfa/status НЕ существует — берём mfaEnabled/mfaEnabledAt из /me.
interface AdminAuthMe {
  mfaEnabled: boolean
  mfaEnabledAt?: string | null
}

interface SetupResponse {
  qrCodeDataUrl: string
  secret: string
  otpAuthUrl?: string
}

export default function MfaSetupPage() {
  const { t, locale } = useTranslation()
  const [status, setStatus] = useState<MfaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setup, setSetup] = useState<SetupResponse | null>(null)
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [showDisable, setShowDisable] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [secretCopied, setSecretCopied] = useState(false)

  useEffect(() => {
    api.get<AdminAuthMe>('/api/v1/admin/auth/me')
      .then(me => setStatus({ enabled: me.mfaEnabled, enabledAt: me.mfaEnabledAt ?? null }))
      .catch(e => setError(e.message ?? t('mfa.errStatus')))
      .finally(() => setLoading(false))
  }, [t])

  const startSetup = async () => {
    setError(null); setCode('')
    try {
      const res = await api.post<SetupResponse>('/api/v1/admin/auth/mfa/setup', {})
      setSetup(res)
    } catch (e: any) {
      setError(e.message ?? t('mfa.errStartSetup'))
      toast.error(e.message ?? t('mfa.errStartSetup'))
    }
  }

  const verify = async () => {
    if (code.trim().length !== 6) return
    setVerifying(true)
    try {
      await api.post('/api/v1/admin/auth/mfa/verify', { code: code.trim() })
      toast.success(t('mfa.connected'))
      setSetup(null); setCode('')
      setStatus({ enabled: true, enabledAt: new Date().toISOString() })
    } catch (e: any) {
      toast.error(e.message ?? t('mfa.errBadCode'))
    } finally {
      setVerifying(false)
    }
  }

  const disable = async () => {
    setDisableLoading(true)
    try {
      await api.post('/api/v1/admin/auth/mfa/disable', {})
      toast.success(t('mfa.disabled'))
      setStatus({ enabled: false })
      setShowDisable(false)
    } catch (e: any) {
      toast.error(e.message ?? t('mfa.errDisable'))
    } finally {
      setDisableLoading(false)
    }
  }

  const copySecret = async () => {
    if (!setup?.secret) return
    try {
      await navigator.clipboard.writeText(setup.secret)
      setSecretCopied(true)
      setTimeout(() => setSecretCopied(false), 2000)
    } catch {
      toast.error(t('mfa.errCopy'))
    }
  }

  if (loading) {
    return <div style={{ padding: 24, color: 'var(--text-muted)' }}>{t('common.loading')}</div>
  }

  return (
    <div style={{ padding: '32px 32px 48px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Lock size={20} color="var(--primary)" />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{t('mfa.title')}</h1>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-muted)' }}>
        {t('mfa.subtitle')}
      </p>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Current status */}
      <div
        style={{
          background: 'var(--surface)',
          border: `1px solid ${status?.enabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {status?.enabled ? (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={22} color="#22C55E" />
            </div>
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={22} color="#F59E0B" />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              {status?.enabled ? t('mfa.statusEnabled') : t('mfa.statusDisabled')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {status?.enabled
                ? status.enabledAt
                  ? t('mfa.activeSince', { date: new Date(status.enabledAt).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU') })
                  : t('mfa.active')
                : t('mfa.enableHint')}
            </div>
          </div>
          {status?.enabled && (
            <button
              onClick={() => setShowDisable(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <ShieldOff size={14} /> {t('mfa.disable')}
            </button>
          )}
        </div>
      </div>

      {/* Setup flow */}
      {!status?.enabled && !setup && (
        <button
          onClick={startSetup}
          style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42, padding: '0 22px', borderRadius: 10, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          <Shield size={16} /> {t('mfa.startSetup')}
        </button>
      )}

      {setup && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('mfa.step1')}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {t('mfa.step1Hint')}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: 16, borderRadius: 12 }}>
              <img
                src={setup.qrCodeDataUrl}
                alt={t('mfa.qrAlt')}
                style={{ width: 200, height: 200, display: 'block' }}
              />
            </div>
          </div>

          <div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('mfa.manualEntry')}</h4>
            <div
              onClick={copySecret}
              style={{
                marginTop: 8, padding: '12px 14px', borderRadius: 10,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                fontFamily: 'monospace', fontSize: 13, color: 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', wordBreak: 'break-all',
              }}
            >
              <span style={{ flex: 1 }}>{setup.secret}</span>
              {secretCopied ? (
                <CheckCircle2 size={16} color="#22C55E" />
              ) : (
                <Copy size={14} color="var(--text-muted)" />
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border)' }} />

          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{t('mfa.step2')}</h3>
            <input
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && code.length === 6 && verify()}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              style={{
                marginTop: 10, width: '100%', boxSizing: 'border-box',
                height: 56, padding: '0 18px', borderRadius: 12,
                border: '1px solid var(--border)', background: 'var(--surface2)',
                color: 'var(--text)', fontSize: 24, letterSpacing: '0.5em',
                fontFamily: 'monospace', textAlign: 'center', outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setSetup(null); setCode('') }}
              style={{ height: 38, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={verify}
              disabled={code.length !== 6 || verifying}
              style={{ height: 38, padding: '0 22px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: verifying ? 'wait' : 'pointer', opacity: (code.length !== 6 || verifying) ? 0.5 : 1 }}
            >
              {verifying ? t('mfa.verifying') : t('common.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* Disable confirm */}
      {showDisable && (
        <div
          onClick={() => !disableLoading && setShowDisable(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 440, maxWidth: '92vw' }}
          >
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{t('mfa.disableTitle')}</h3>
            <p style={{ margin: '8px 0 22px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t('mfa.disableWarning')}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDisable(false)}
                disabled={disableLoading}
                style={{ height: 38, padding: '0 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={disable}
                disabled={disableLoading}
                style={{ height: 38, padding: '0 18px', borderRadius: 8, border: 'none', background: '#EF4444', color: 'white', fontSize: 13, fontWeight: 600, cursor: disableLoading ? 'wait' : 'pointer', opacity: disableLoading ? 0.6 : 1 }}
              >
                {disableLoading ? '...' : t('mfa.disableConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
