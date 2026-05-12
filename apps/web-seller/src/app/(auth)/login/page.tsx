"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequestOtp, useVerifyOtp } from "../../../hooks/use-auth";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../../../lib/auth/context";
import { track } from "../../../lib/analytics";
import { card, colors, inputStyle as inputBase } from "@/lib/styles";

const inputStyle: React.CSSProperties = {
  ...inputBase,
};

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
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
      router.replace('/onboarding');
    }
  }, [user, router]);

  useEffect(() => { track.signupStarted('direct'); }, []);

  function handleSendOtp() {
    if (phone.trim().length < 9) return;
    requestOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, purpose: "login" },
      { onSuccess: () => setStep("otp") },
    );
  }

  function handleVerify() {
    if (otp.trim().length < 6) return;
    const fullPhone = `+998${phone.replace(/\s/g, "")}`;
    verifyOtp.mutate(
      { phone: fullPhone, code: otp, purpose: "login" },
      {
        onSuccess: (data) => {
          track.otpVerified(fullPhone);
          if (data.user.role === 'SELLER') {
            router.replace("/dashboard");
          } else {
            router.replace("/onboarding");
          }
        },
      },
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
          <div
            className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: colors.accent }}
          >
            <ShoppingCart size={28} color={colors.accentTextOnBg} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: colors.brand }}>Savdo</h1>
          <p className="text-sm mt-1" style={{ color: colors.textMuted }}>Панель продавца</p>
        </div>

        {/* Card */}
        <div className="rounded-lg p-6" style={card}>
          {step === "phone" ? (
            <>
              <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>Войти</h2>
              <p className="text-sm mb-5" style={{ color: colors.textMuted }}>
                Введите номер телефона — отправим код
              </p>

              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: colors.textDim }}>
                Телефон
              </label>
              <div className="flex items-center rounded-md overflow-hidden mb-4" style={inputStyle}>
                <span className="px-3 text-sm h-11 flex items-center flex-shrink-0" style={{ color: colors.textDim, borderRight: `1px solid ${colors.border}` }}>
                  +998
                </span>
                <input
                  type="tel"
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  className="flex-1 px-3 h-11 text-sm bg-transparent"
                  style={{ color: colors.textPrimary, outline: "none" }}
                />
              </div>

              {sendError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-md" style={{ color: colors.danger, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)" }}>
                  {sendError}
                </p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={requestOtp.isPending || phone.trim().length < 9}
                className="w-full h-11 rounded-md text-sm font-semibold transition-opacity active:scale-[0.98] hover:opacity-90"
                style={primaryBtn(phone.trim().length >= 9 && !requestOtp.isPending)}
              >
                {requestOtp.isPending ? "Отправка..." : "Получить код"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); verifyOtp.reset(); }}
                className="flex items-center gap-1.5 text-sm mb-4"
                style={{ color: colors.textMuted }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                +998 {phone}
              </button>

              <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>Введите код</h2>
              <p className="text-sm mb-5" style={{ color: colors.textMuted }}>
                Код отправлен в Telegram-бот @savdo_builderBOT
              </p>

              <label className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: colors.textDim }}>
                Код из Telegram
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
                <p className="text-xs mb-3 px-3 py-2 rounded-md" style={{ color: colors.danger, background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.25)" }}>
                  {verifyError}
                </p>
              )}

              <button
                onClick={handleVerify}
                disabled={verifyOtp.isPending || otp.length < 6}
                className="w-full h-11 rounded-md text-sm font-semibold transition-opacity active:scale-[0.98] hover:opacity-90"
                style={primaryBtn(otp.length >= 6 && !verifyOtp.isPending)}
              >
                {verifyOtp.isPending ? "Проверка..." : "Войти"}
              </button>

              <p className="text-center text-xs mt-3" style={{ color: colors.textDim }}>
                Не пришёл код?{" "}
                <button
                  onClick={() => { requestOtp.reset(); handleSendOtp(); }}
                  className="underline"
                  style={{ color: colors.accent }}
                >
                  Отправить снова
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: colors.textDim }}>
          © 2026 Savdo
        </p>
      </div>
    </div>
  );
}
