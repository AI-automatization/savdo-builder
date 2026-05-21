import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowRight, Loader2, AlertCircle, MessageCircle, ChevronLeft, Sun, Moon, Lock } from 'lucide-react'
import { api, auth } from '../lib/api'
import { cn } from '@/lib/utils'
import { useTranslation } from '../lib/i18n'

/** Decode JWT payload (no signature verify — фронт только читает claim'ы). */
function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    // base64url → base64 для atob (UTF-8 safe через decodeURIComponent + escape).
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
    const json = decodeURIComponent(
      atob(padded).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    return JSON.parse(json) as T
  } catch {
    return null
  }
}

function getInitialDark() {
  const saved = localStorage.getItem('admin-theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [dark, setDark] = useState(() => {
    const isDark = getInitialDark()
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    return isDark
  })
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('admin-theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  // step 1 = phone, 2 = OTP, 3 = MFA.
  // SEC-ADMIN-ACCESS-MODEL стадия C: MFA обязателен для ВСЕХ админов. На step 3:
  //  - mfaMode='challenge' — MFA уже настроен, вводим TOTP-код (/mfa/login);
  //  - mfaMode='setup'     — MFA ещё не настроен, показываем QR (/mfa/setup),
  //    затем /mfa/verify + /mfa/login.
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('+998')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [mfaCode, setMfaCode] = useState('')
  const [mfaMode, setMfaMode] = useState<'challenge' | 'setup'>('challenge')
  const [mfaQr, setMfaQr] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const mfaInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(v => v - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [timer])

  const sendOtp = async () => {
    setError('')
    if (!/^\+998\d{9}$/.test(phone)) {
      setError(t('login.errPhoneFormat'))
      return
    }
    setLoading(true)
    try {
      await api.post('/api/v1/auth/request-otp', { phone, purpose: 'login' })
      setStep(2)
      setTimer(300)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (e: any) {
      setError(e.message ?? t('login.errSendFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpInput = (i: number, val: string) => {
    const digits = val.replace(/\D/g, '')
    if (!digits && val !== '') return
    if (digits.length === 6) {
      const arr = digits.split('')
      setOtp(arr)
      setTimeout(() => verify(arr.join('')), 50)
      return
    }
    const next = [...otp]
    next[i] = digits[0] ?? ''
    setOtp(next)
    if (digits[0] && i < 5) inputRefs.current[i + 1]?.focus()
    if (next.every(d => d)) setTimeout(() => verify(next.join('')), 50)
  }

  const handleOtpKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      const next = [...otp]; next[i - 1] = ''
      setOtp(next)
      inputRefs.current[i - 1]?.focus()
    }
  }

  // SEC-ADMIN стадия D: после mfaPending — решаем challenge vs setup.
  // mfaEnabled берём из /admin/auth/me (SkipMfaCheck — доступен с mfaPending JWT).
  const routeToMfa = async () => {
    try {
      const me = await api.get<{ mfaEnabled?: boolean }>('/api/v1/admin/auth/me')
      if (me?.mfaEnabled) {
        setMfaMode('challenge')
      } else {
        const setup = await api.post<{ qrDataUrl: string; secret: string }>(
          '/api/v1/admin/auth/mfa/setup', {},
        )
        setMfaQr(setup.qrDataUrl)
        setMfaSecret(setup.secret)
        setMfaMode('setup')
      }
      setStep(3)
      setTimeout(() => mfaInputRef.current?.focus(), 100)
    } catch (e: any) {
      setError(e.message ?? t('login.errLoginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const verify = async (code: string) => {
    setError('')
    setLoading(true)
    try {
      const data: any = await api.post('/api/v1/auth/verify-otp', { phone, code, purpose: 'login' })
      if (data.user?.role !== 'ADMIN') {
        setError(t('login.errNotAdmin'))
        setOtp(['', '', '', '', '', ''])
        setLoading(false)
        return
      }
      // Сохраняем токены до проверки MFA — refresh-token нужен для возможной replay,
      // accessToken с mfaPending=true даёт доступ только к /admin/auth/mfa/* (SkipMfaCheck).
      auth.setTokens(data.accessToken, data.refreshToken)

      // Decode JWT — если mfaPending=true, идём на step 3 (challenge или setup).
      const payload = decodeJwtPayload<{ mfaPending?: boolean }>(data.accessToken)
      if (payload?.mfaPending) {
        setOtp(['', '', '', '', '', ''])
        setMfaCode('')
        await routeToMfa()
        return
      }

      navigate('/dashboard')
    } catch (e: any) {
      if (e.message?.includes('TELEGRAM_NOT_LINKED')) {
        setError(t('login.errTgNotLinked'))
      } else {
        setError(t('login.errBadCode'))
      }
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const verifyMfa = async () => {
    if (mfaCode.length !== 6) return
    setError('')
    setLoading(true)
    try {
      // POST /admin/auth/mfa/login — обменивает mfaPending JWT на полноценный
      // (super-admin.controller.ts mfaLogin → admin-auth.use-case.mfaLogin).
      const data: any = await api.post('/api/v1/admin/auth/mfa/login', { code: mfaCode })
      // refreshToken остаётся прежним — backend перевыпускает только access.
      auth.setTokens(data.accessToken, auth.getRefresh() ?? '')
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message?.includes('Invalid') ? t('login.errBadMfa') : (e.message ?? t('login.errLoginFailed')))
      setMfaCode('')
      setTimeout(() => mfaInputRef.current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  // setup-режим: /mfa/verify включает MFA, /mfa/login обменивает mfaPending
  // токен на чистый. Один и тот же TOTP-код проходит оба шага (окно 30с±).
  const completeMfaSetup = async () => {
    if (mfaCode.length !== 6) return
    setError('')
    setLoading(true)
    try {
      await api.post('/api/v1/admin/auth/mfa/verify', { code: mfaCode })
      const data: any = await api.post('/api/v1/admin/auth/mfa/login', { code: mfaCode })
      auth.setTokens(data.accessToken, auth.getRefresh() ?? '')
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message?.includes('Invalid') ? t('login.errBadMfa') : (e.message ?? t('login.errLoginFailed')))
      setMfaCode('')
      setTimeout(() => mfaInputRef.current?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep(1)
    setOtp(['', '', '', '', '', ''])
    setMfaCode('')
    setMfaMode('challenge')
    setMfaQr('')
    setMfaSecret('')
    setError('')
    auth.clear()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Subtle grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px)',
            'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 10%, transparent 100%)',
        }}
      />
      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        aria-label={dark ? t('theme.toLight') : t('theme.toDark')}
        className="fixed top-4 right-4 z-20 w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] rounded-2xl p-8 shadow-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Store size={20} color="white" />
          </div>
          <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{t('login.title')}</h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {step === 1
              ? t('login.subtitlePhone')
              : step === 2
                ? t('login.subtitleOtp', { phone })
                : mfaMode === 'setup'
                  ? t('login.subtitleMfaSetup')
                  : t('login.subtitleMfa')}
          </p>
        </div>

        {/* Step bar */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={cn(
              'flex-1 h-0.5 rounded-full transition-colors duration-300',
              s <= step ? 'bg-indigo-500' : 'bg-white/10',
            )} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg mb-5 bg-red-500/5 border border-red-500/20 text-red-400 text-xs leading-relaxed">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t('login.phoneLabel')}</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="+998901234567"
                className="w-full h-9 px-3 rounded-lg text-sm font-mono focus:outline-none focus:border-indigo-500/60 transition-colors"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <MessageCircle size={12} className="text-indigo-400 shrink-0" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('login.tgHint')}</span>
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {t('login.sending')}</>
                : <>{t('login.getCode')} <ArrowRight size={15} /></>
              }
            </button>
          </div>
        ) : step === 3 && mfaMode === 'setup' ? (
          // ── MFA Setup — первая настройка 2FA (SEC-ADMIN стадия D) ──────────
          <div className="space-y-4">
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <Lock size={12} className="text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {t('login.mfaSetupHint')}
              </span>
            </div>

            {mfaQr && (
              <div className="flex justify-center">
                <img
                  src={mfaQr}
                  alt=""
                  width={168}
                  height={168}
                  className="rounded-lg"
                  style={{ background: '#fff', padding: 8 }}
                />
              </div>
            )}

            <div>
              <label className="block mb-1 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('login.mfaSecretLabel')}
              </label>
              <code
                className="block w-full px-3 py-2 rounded-lg text-xs font-mono break-all select-all"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {mfaSecret}
              </code>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('login.mfaCodeLabel')}
              </label>
              <input
                ref={el => { mfaInputRef.current = el }}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && mfaCode.length === 6 && completeMfaSetup()}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full h-12 px-3 rounded-lg text-center text-xl font-bold font-mono tracking-[0.5em] focus:outline-none focus:border-indigo-500/60 transition-colors"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <button
              onClick={completeMfaSetup}
              disabled={loading || mfaCode.length !== 6}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {t('login.checking')}</>
                : <>{t('login.mfaSetupConfirm')} <ArrowRight size={15} /></>
              }
            </button>

            <button onClick={reset} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
              <ChevronLeft size={13} /> {t('login.loginAgain')}
            </button>
          </div>
        ) : step === 3 ? (
          // ── MFA TOTP Challenge ─────────────────────────────────────────────
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <Lock size={12} className="text-indigo-400 shrink-0" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('login.mfaActive')}
              </span>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                {t('login.mfaCodeLabel')}
              </label>
              <input
                ref={el => { mfaInputRef.current = el }}
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && mfaCode.length === 6 && verifyMfa()}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="w-full h-12 px-3 rounded-lg text-center text-xl font-bold font-mono tracking-[0.5em] focus:outline-none focus:border-indigo-500/60 transition-colors"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            </div>

            <button
              onClick={verifyMfa}
              disabled={loading || mfaCode.length !== 6}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {t('login.checking')}</>
                : <>{t('login.confirm')} <ArrowRight size={15} /></>
              }
            </button>

            <button onClick={reset} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
              <ChevronLeft size={13} /> {t('login.loginAgain')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="text-xs text-center w-full" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                {t('login.otpLegend')}
              </legend>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" role="group" aria-label={t('login.otpGroupAria')}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el }}
                    value={d}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    aria-label={t('login.otpDigitAria', { n: i + 1 })}
                    className={cn(
                      'w-12 h-14 text-center text-xl font-bold font-mono rounded-lg border',
                      'focus:outline-none transition-colors',
                      d ? 'border-indigo-500/60 bg-indigo-500/5' : 'focus:border-white/20',
                    )}
                    style={{ background: 'var(--surface2)', color: 'var(--text)', borderColor: d ? undefined : 'var(--border)' }}
                  />
                ))}
              </div>
            </fieldset>

            {timer > 0 ? (
              <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('login.resendIn')}{' '}
                <span className="text-indigo-400 font-mono font-semibold">
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <p className="text-center">
                <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {t('login.resend')}
                </button>
              </p>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 size={13} className="animate-spin" /> {t('login.checking')}
              </div>
            )}

            <button onClick={reset} className="flex items-center gap-1.5 text-xs transition-colors mt-2" style={{ color: 'var(--text-dim)' }}>
              <ChevronLeft size={13} /> {t('login.changeNumber')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
