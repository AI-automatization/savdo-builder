import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowRight, Loader2, AlertCircle, MessageCircle, ChevronLeft } from 'lucide-react'
import { api, auth } from '../lib/api'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [phone, setPhone] = useState('+998')
  const [otp, setOtp] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

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
    if (digits.length === 4) {
      const arr = digits.split('')
      setOtp(arr)
      setTimeout(() => verify(arr.join('')), 50)
      return
    }
    const next = [...otp]
    next[i] = digits[0] ?? ''
    setOtp(next)
    if (digits[0] && i < 3) inputRefs.current[i + 1]?.focus()
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
        setOtp(['', '', '', ''])
        setLoading(false)
        return
      }
      auth.setTokens(data.accessToken, data.refreshToken)
      navigate('/dashboard')
    } catch (e: any) {
      if (e.message?.includes('TELEGRAM_NOT_LINKED')) {
        setError('Telegram не привязан. Напиши боту @savdo_builderBOT команду /start')
      } else {
        setError('Неверный или просроченный код.')
      }
      setOtp(['', '', '', ''])
      setTimeout(() => inputRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setStep(1); setOtp(['', '', '', '']); setError('') }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-5 relative overflow-hidden">

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

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-[#111113] border border-zinc-800 rounded-2xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
            <Store size={20} color="white" />
          </div>
          <h1 className="text-base font-semibold text-zinc-100 tracking-tight">Savdo Admin</h1>
          <p className="mt-1 text-xs text-zinc-600">
            {step === 1 ? 'Вход через Telegram OTP' : `Код отправлен на ${phone}`}
          </p>
        </div>

        {/* Step bar */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={cn(
              'flex-1 h-0.5 rounded-full transition-colors duration-300',
              s <= step ? 'bg-indigo-500' : 'bg-zinc-800',
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
              <label className="block mb-1.5 text-xs font-medium text-zinc-500">Номер телефона</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendOtp()}
                placeholder="+998901234567"
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
              <MessageCircle size={12} className="text-indigo-400 shrink-0" />
              <span className="text-xs text-zinc-600">Код придёт в Telegram от @savdo_builderBOT</span>
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
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-zinc-600 text-center">Введите 4-значный код из Telegram</p>

            {/* OTP inputs */}
            <div className="flex gap-2 justify-center">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  value={d}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  maxLength={6}
                  inputMode="numeric"
                  className={cn(
                    'w-12 h-14 text-center text-xl font-bold font-mono rounded-lg border bg-zinc-900 text-zinc-100',
                    'focus:outline-none transition-colors',
                    d ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-zinc-800 focus:border-zinc-600',
                  )}
                />
              ))}
            </div>

            {timer > 0 ? (
              <p className="text-center text-xs text-zinc-600">
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
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
                <Loader2 size={13} className="animate-spin" /> Проверяем...
              </div>
            )}

            <button onClick={reset} className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-500 transition-colors mt-2">
              <ChevronLeft size={13} /> Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
