'use client';

import { useState } from 'react';
import { useRequestOtp, useVerifyOtp } from '@/hooks/use-auth';
import { colors } from '@/lib/styles';
import { PhoneInput, isValidUzPhone } from '@/components/PhoneInput';
import { useTranslation } from '@/lib/i18n';

type OtpStep = 'phone' | 'code';
type OtpPurpose = 'login' | 'register' | 'checkout';

interface OtpGateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  /**
   * Backend assigns user role based on purpose: 'checkout' → BUYER, 'login' → SELLER.
   * web-buyer всегда должен создавать BUYER, поэтому дефолт 'checkout'.
   * checkout flow имеет свою local OtpGate в (minimal)/checkout/page.tsx.
   */
  purpose?: OtpPurpose;
}

export function OtpGate({ icon, title, subtitle, purpose = 'checkout' }: OtpGateProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<OtpStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  async function handleSend() {
    setError('');
    try {
      await requestOtp.mutateAsync({ phone, purpose });
      setStep('code');
    } catch (e: unknown) {
      // Пробрасываем реальное сообщение API (TELEGRAM_NOT_LINKED,
      // OTP_SEND_LIMIT и т.п.) — раньше catch {} глотал его и всегда
      // показывал статичное «Проверьте номер», что дезориентировало.
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? t('auth.sendError'));
    }
  }

  async function handleVerify() {
    setError('');
    try {
      await verifyOtp.mutateAsync({ phone, code, purpose });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? t('auth.wrongCode'));
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-3"
            style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}`, color: colors.accent }}
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>{title}</h2>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
            {step === 'phone'
              ? (subtitle ?? t('auth.phoneFallbackSubtitle'))
              : t('auth.codeSentTo', { phone })}
          </p>
        </div>

        <div
          className="rounded-lg p-4 flex flex-col gap-3"
          style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        >
          {step === 'phone' ? (
            <>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                onEnter={handleSend}
                ariaLabel={t('auth.phoneAriaLabel')}
                className="h-11 px-4 rounded text-sm w-full focus:outline-none focus:ring-2"
                style={{
                  background: colors.surfaceMuted,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  ['--tw-ring-color' as string]: colors.accentBorder,
                }}
              />
              <button
                onClick={handleSend}
                disabled={!isValidUzPhone(phone) || requestOtp.isPending}
                className="h-11 rounded text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                {requestOtp.isPending ? t('auth.sending') : t('auth.getCode')}
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
                className="h-11 px-4 rounded text-sm text-center tracking-widest w-full focus:outline-none focus:ring-2"
                style={{
                  background: colors.surfaceMuted,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                  ['--tw-ring-color' as string]: colors.accentBorder,
                }}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={code.length < 6 || verifyOtp.isPending}
                className="h-11 rounded text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                {verifyOtp.isPending ? t('auth.verifying') : t('auth.signIn')}
              </button>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                className="text-xs text-center"
                style={{ color: colors.textDim }}
              >
                {t('auth.changePhone')}
              </button>
            </>
          )}
          {error && <p className="text-xs text-center" style={{ color: colors.danger }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
