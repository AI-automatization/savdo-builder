"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequestOtp, useVerifyOtp } from "../../../hooks/use-auth";
import { useAuth } from "../../../lib/auth/context";
import { track } from "../../../lib/analytics";
import { card, colors, dangerTint, inputStyle as inputBase } from "@/lib/styles";
import { PhoneInput, formatUzPhone, isValidUzPhone } from "../../../components/PhoneInput";
import { useTranslation } from "@/lib/i18n";
import { MaxsavdoLogo } from "@/components/brand/MaxsavdoLogo";

const inputStyle: React.CSSProperties = {
  ...inputBase,
};

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [step,  setStep]  = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp,   setOtp]   = useState("");

  const requestOtp = useRequestOtp();
  const verifyOtp  = useVerifyOtp();
  useEffect(() => {
    if (!user) return;
    if (user.role === 'SELLER') {
      router.replace('/dashboard');
    } else {
      router.replace('/become-seller');
    }
  }, [user, router]);

  useEffect(() => { track.signupStarted('direct'); }, []);

  function handleSendOtp() {
    if (!isValidUzPhone(phone)) return;
    requestOtp.mutate(
      { phone, purpose: "login" },
      { onSuccess: () => setStep("otp") },
    );
  }

  function handleVerify() {
    if (otp.trim().length < 6) return;
    // Редирект НЕ делаем здесь: useVerifyOtp.onSuccess зовёт login() → setUser
    // в контексте → useEffect([user]) выше выполняет role-aware router.replace.
    // Единый источник навигации (контекстный user) убирает гонку двойного
    // onSuccess (хук пишет auth, useEffect владеет редиректом).
    verifyOtp.mutate(
      { phone, code: otp, purpose: "login" },
      { onSuccess: () => track.otpVerified(phone) },
    );
  }

  const sendError   = requestOtp.error?.message;
  const verifyError = verifyOtp.error?.message;

  const primaryBtn = (active: boolean): React.CSSProperties =>
    active
      ? { background: colors.accent, color: colors.accentTextOnBg }
      : { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", border: `1px solid ${colors.border}` };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: colors.bg }}>
      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <MaxsavdoLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.brand }}>maxsavdo</h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>{t('auth.sellerPanel')}</p>
        </div>

        {/* Card */}
        <div className="rounded-lg p-6" style={card}>
          {step === "phone" ? (
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>{t('auth.loginTitle')}</h2>
              <p className="text-sm mb-5" style={{ color: colors.textMuted }}>
                {t('auth.loginSubtitle')}
              </p>

              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: colors.textDim }}>
                {t('auth.phoneLabel')}
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                onEnter={handleSendOtp}
                className="w-full px-3 h-11 text-sm rounded-md mb-4"
                style={{ ...inputStyle, color: colors.textPrimary }}
              />

              {sendError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-md" style={{ color: colors.danger, background: dangerTint(0.10), border: `1px solid ${dangerTint(0.25)}` }}>
                  {sendError}
                </p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={requestOtp.isPending || !isValidUzPhone(phone)}
                className="w-full h-11 rounded-md text-sm font-semibold transition-opacity active:scale-[0.98] hover:opacity-90"
                style={primaryBtn(isValidUzPhone(phone) && !requestOtp.isPending)}
              >
                {requestOtp.isPending ? t('auth.sendingOtp') : t('auth.getCode')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); verifyOtp.reset(); }}
                className="flex items-center gap-1.5 text-sm mb-4"
                style={{ color: colors.textMuted }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                {formatUzPhone(phone)}
              </button>

              <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>{t('auth.enterCodeTitle')}</h2>
              <p className="text-sm mb-2" style={{ color: colors.textMuted }}>
                {t('auth.codeSentToTelegram')}
              </p>
              <p className="text-xs mb-5 px-3 py-2 rounded-md" style={{ background: colors.surfaceMuted, color: colors.textDim }}>
                {t('auth.startBotHint')}
              </p>

              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: colors.textDim }}>
                {t('auth.telegramCodeLabel')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                className="w-full h-11 px-4 rounded-md text-center text-lg font-bold tracking-[0.4em] mb-4"
                style={{ ...inputStyle, letterSpacing: "0.4em" }}
              />

              {verifyError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-md" style={{ color: colors.danger, background: dangerTint(0.10), border: `1px solid ${dangerTint(0.25)}` }}>
                  {verifyError}
                </p>
              )}

              <button
                onClick={handleVerify}
                disabled={verifyOtp.isPending || otp.length < 6}
                className="w-full h-11 rounded-md text-sm font-semibold transition-opacity active:scale-[0.98] hover:opacity-90"
                style={primaryBtn(otp.length >= 6 && !verifyOtp.isPending)}
              >
                {verifyOtp.isPending ? t('auth.verifying') : t('auth.loginButton')}
              </button>

              <p className="text-center text-xs mt-3" style={{ color: colors.textDim }}>
                {t('auth.codeNotReceived')}{" "}
                <button
                  onClick={() => { requestOtp.reset(); handleSendOtp(); }}
                  className="underline"
                  style={{ color: colors.accent }}
                >
                  {t('auth.resendCode')}
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: colors.textDim }}>
          © 2026 maxsavdo
        </p>
      </div>
    </div>
  );
}
