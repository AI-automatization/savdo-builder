import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowRight, Loader2, AlertCircle, MessageCircle, ChevronLeft, Sun, Moon, Lock } from 'lucide-react'
import { api, auth } from '../lib/api'
import { cn } from '@/lib/utils'

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

  // step 1 = phone, 2 = OTP, 3 = MFA TOTP challenge.
  // После Wave 30 (c1607c5) MFA enforced на admin endpoints — JWT с mfaPending=true
  // не пройдёт MfaEnforcedGuard. Step 3 обменивает mfaPending JWT на полный.
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [phone, setPhone] = useState('+998')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [mfaCode, setMfaCode] = useState('')
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
      setError('Формат: +998XXXXXXXXX (9 цифр после кода)')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/v1/auth/request-otp', { phone, purpose: 'login' })
      setStep(2)
      setTimer(300)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (e: any) {
      setError(e.message ?? 'Ошибка отправки кода')
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

  const verify = async (code: string) => {
    setError('')
    setLoading(true)
    try {
      const data: any = await api.post('/api/v1/auth/verify-otp', { phone, code, purpose: 'login' })
      if (data.user?.role !== 'ADMIN') {
        setError('Доступ запрещён. Этот кабинет только для администраторов Savdo.')
        setOtp(['', '', '', '', '', ''])
        setLoading(false)
        return
      }
      // Сохраняем токены до проверки MFA — refresh-token нужен для возможной replay,
      // accessToken с mfaPending=true даёт доступ только к /admin/auth/mfa/* (SkipMfaCheck).
      auth.setTokens(data.accessToken, data.refreshToken)

      // Decode JWT — если mfaPending=true, переходим на step 3 (TOTP challenge).
      const payload = decodeJwtPayload<{ mfaPending?: boolean }>(data.accessToken)
      if (payload?.mfaPending) {
        setStep(3)
        setOtp(['', '', '', '', '', ''])
        setMfaCode('')
        setLoading(false)
        setTimeout(() => mfaInputRef.current?.focus(), 100)
        return
      }

      navigate('/dashboard')
    } catch (e: any) {
      if (e.message?.includes('TELEGRAM_NOT_LINKED')) {
        setError('Telegram не привязан. Напиши боту @savdo_builderBOT команду /start')
      } else {
        setError('Неверный или просроченный код.')
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
      setError(e.message?.includes('Invalid') ? 'Неверный TOTP код' : (e.message ?? 'Не удалось войти'))
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
        aria-label={dark ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
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
          <h1 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Savdo Admin</h1>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            {step === 1
              ? 'Вход через Telegram OTP'
              : step === 2
                ? `Код отправлен на ${phone}`
                : 'Введите код из приложения-аутентификатора'}
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
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Номер телефона</label>
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
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Код придёт в Telegram от @savdo_builderBOT</span>
            </div>

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full h-9 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Отправляем...</>
                : <>Получить код <ArrowRight size={15} /></>
              }
            </button>
          </div>
        ) : step === 3 ? (
          // ── MFA TOTP Challenge ─────────────────────────────────────────────
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <Lock size={12} className="text-indigo-400 shrink-0" />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Двухфакторная аутентификация активна. Откройте Google Authenticator / Authy / 1Password.
              </span>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Код из приложения (6 цифр)
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
                ? <><Loader2 size={15} className="animate-spin" /> Проверяем...</>
                : <>Подтвердить <ArrowRight size={15} /></>
              }
            </button>

            <button onClick={reset} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: 'var(--text-dim)' }}>
              <ChevronLeft size={13} /> Войти заново
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="text-xs text-center w-full" style={{ color: 'var(--text-muted)', marginBottom: 12 }}>
                Введите 6-значный код из Telegram
              </legend>

              {/* OTP inputs */}
              <div className="flex gap-2 justify-center" role="group" aria-label="Код подтверждения">
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
                    aria-label={`Цифра ${i + 1} из 6`}
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
                Повторить через{' '}
                <span className="text-indigo-400 font-mono font-semibold">
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <p className="text-center">
                <button onClick={reset} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Отправить код повторно
                </button>
              </p>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 size={13} className="animate-spin" /> Проверяем...
              </div>
            )}

            <button onClick={reset} className="flex items-center gap-1.5 text-xs transition-colors mt-2" style={{ color: 'var(--text-dim)' }}>
              <ChevronLeft size={13} /> Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
