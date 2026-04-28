'use client';

import { useState } from 'react';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth';
import { glass, inputStyle } from '@/lib/styles';

type OtpStep = 'phone' | 'code';

interface OtpGateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function OtpGate({ icon, title, subtitle }: OtpGateProps) {
  const [step, setStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  async function handleSend() {
    setError('');
    try {
      await requestOtp.mutateAsync({ phone, purpose: 'checkout' });
      setStep('code');
    } catch {
      setError('Не удалось отправить код. Проверьте номер.');
    }
  }

  async function handleVerify() {
    setError('');
    try {
      await verifyOtp.mutateAsync({ phone, code, purpose: 'checkout' });
    } catch {
      setError('Неверный код. Попробуйте ещё раз.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(167,139,250,.20)', border: '1px solid rgba(167,139,250,.35)' }}
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {step === 'phone'
              ? (subtitle ?? 'Введите номер телефона для входа')
              : `Код отправлен в Telegram на ${phone}`}
          </p>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-3" style={glass}>
          {step === 'phone' ? (
            <>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                className="h-11 px-4 rounded-xl text-sm w-full focus:outline-none focus:ring-2"
                style={{ ...inputStyle, '--tw-ring-color': 'rgba(167,139,250,0.50)' } as React.CSSProperties}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!phone.trim() || requestOtp.isPending}
                className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
              >
                {requestOtp.isPending ? 'Отправка...' : 'Получить код'}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                maxLength={6}
                className="h-11 px-4 rounded-xl text-sm text-center tracking-widest w-full focus:outline-none focus:ring-2"
                style={{ ...inputStyle, '--tw-ring-color': 'rgba(167,139,250,0.50)' } as React.CSSProperties}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || verifyOtp.isPending}
                className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
              >
                {verifyOtp.isPending ? 'Проверка...' : 'Войти'}
              </button>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="text-xs text-center"
                style={{ color: 'rgba(255,255,255,0.40)' }}
              >
                Изменить номер
              </button>
            </>
          )}
          {error && <p className="text-xs text-center" style={{ color: 'rgba(248,113,113,.85)' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
