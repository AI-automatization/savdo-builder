import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ArrowRight, Loader2, AlertCircle, MessageCircle, ChevronLeft } from 'lucide-react'
import { api } from '../lib/api'

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
    if (e.key === 'Backspace') {
      if (!otp[i] && i > 0) {
        const next = [...otp]; next[i - 1] = ''
        setOtp(next)
        inputRefs.current[i - 1]?.focus()
      }
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
      sessionStorage.setItem('access_token', data.accessToken)
      if (data.refreshToken) localStorage.setItem('refresh_token', data.refreshToken)
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

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: [
          'linear-gradient(to right, rgba(129,140,248,0.04) 1px, transparent 1px)',
          'linear-gradient(to bottom, rgba(129,140,248,0.04) 1px, transparent 1px)',
        ].join(','),
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 100%)',
      }} />
      {/* Glow orb */}
      <div style={{
        position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400, borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 24, padding: '40px 40px 36px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(99,102,241,0.45)',
          }}>
            <Store size={28} color="white" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Savdo Admin
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {step === 1 ? 'Войдите через Telegram OTP' : `Код отправлен на ${phone}`}
          </p>
        </div>

        {/* Step progress */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.4s',
            }} />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 10, marginBottom: 20,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#EF4444', fontSize: 13, lineHeight: 1.5,
          }}>
            <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
              Номер телефона
            </label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              placeholder="+998901234567"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 16, outline: 'none',
                fontFamily: 'monospace', letterSpacing: '0.5px',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
              padding: '10px 14px', background: 'rgba(129,140,248,0.06)',
              borderRadius: 10, border: '1px solid rgba(129,140,248,0.15)',
            }}>
              <MessageCircle size={14} color="var(--primary)" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Код придёт в Telegram от @savdo_builderBOT
              </span>
            </div>
            <button
              onClick={sendOtp}
              disabled={loading}
              style={{
                width: '100%', marginTop: 20, padding: '13px',
                borderRadius: 10, border: 'none',
                background: loading ? 'var(--surface2)' : 'linear-gradient(135deg, #818CF8, #6366F1)',
                color: 'white', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
            >
              {loading
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Отправляем...</>
                : <>Получить код <ArrowRight size={18} /></>
              }
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 8, textAlign: 'center' }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>
                Введите 4-значный код из Telegram
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  value={d}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  maxLength={6}
                  inputMode="numeric"
                  style={{
                    width: 48, height: 56, textAlign: 'center',
                    fontSize: 24, fontWeight: 700, fontFamily: 'monospace',
                    borderRadius: 10, outline: 'none',
                    border: `2px solid ${d ? 'var(--primary)' : 'var(--border)'}`,
                    background: d ? 'var(--primary-dim)' : 'var(--surface2)',
                    color: 'var(--text)', transition: 'all 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => { if (!d) e.target.style.borderColor = 'var(--border)' }}
                />
              ))}
            </div>

            {timer > 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
                Повторить через{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                  {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                </span>
              </p>
            ) : (
              <p style={{ textAlign: 'center', margin: '0 0 16px' }}>
                <button onClick={() => { setStep(1); setOtp(['','','','','','']); setError('') }} style={{
                  background: 'none', border: 'none', color: 'var(--primary)',
                  fontSize: 13, cursor: 'pointer', fontWeight: 500,
                }}>
                  Отправить код повторно
                </button>
              </p>
            )}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Проверяем код...
              </div>
            )}

            <button onClick={() => { setStep(1); setOtp(['','','','','','']); setError('') }} style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 16,
              background: 'none', border: 'none', color: 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer',
            }}>
              <ChevronLeft size={14} /> Изменить номер
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
