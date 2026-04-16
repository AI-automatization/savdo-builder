"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequestOtp, useVerifyOtp } from "../../../hooks/use-auth";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "../../../lib/auth/context";
import { track } from "../../../lib/analytics";


// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               "1px solid rgba(255,255,255,0.15)",
} as const;

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border:     "1px solid rgba(255,255,255,0.13)",
  color:      "#fff",
  outline:    "none",
} as const;

// ── Page ──────────────────────────────────────────────────────────────────────

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
    if (otp.trim().length < 4) return;
    const fullPhone = `+998${phone.replace(/\s/g, "")}`;
    verifyOtp.mutate(
      { phone: fullPhone, code: otp, purpose: "login" },
      {
        onSuccess: (data) => {
          track.otpVerified(fullPhone);
          // SELLER → дашборд, BUYER → онбординг для создания магазина
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">

      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 500, height: 500, top: -160, right: -120, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(48px)" }} />
        <div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: -80, left: -100,  background: "radial-gradient(circle, rgba(34,197,94,.13)  0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      <div className="relative w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 12px 36px rgba(167,139,250,.40)" }}
          >
            <ShoppingCart size={28} color="#fff" />
          </div>
          <h1 className="text-2xl font-bold text-white">Savdo</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>Панель продавца</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={glass}>
          {step === "phone" ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-1">Войти</h2>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Введите номер телефона — отправим код
              </p>

              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                Телефон
              </label>
              <div className="flex items-center rounded-xl overflow-hidden mb-4" style={inputStyle}>
                <span className="px-3 text-sm h-11 flex items-center flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
                  +998
                </span>
                <input
                  type="tel"
                  placeholder="90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                  className="flex-1 px-3 h-11 text-sm bg-transparent placeholder-white/20"
                  style={{ color: "#fff", outline: "none" }}
                />
              </div>

              {sendError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(248,113,113,0.10)" }}>
                  {sendError}
                </p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={requestOtp.isPending || phone.trim().length < 9}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={
                  phone.trim().length >= 9 && !requestOtp.isPending
                    ? { background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 6px 20px rgba(167,139,250,.38)" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)", cursor: "not-allowed" }
                }
              >
                {requestOtp.isPending ? "Отправка..." : "Получить код"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); verifyOtp.reset(); }}
                className="flex items-center gap-1.5 text-sm mb-4"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                +998 {phone}
              </button>

              <h2 className="text-lg font-semibold text-white mb-1">Введите код</h2>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Отправили SMS на +998 {phone}
              </p>

              <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                Код из SMS
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
                className="w-full h-11 px-4 rounded-xl text-center text-lg font-bold tracking-[0.4em] mb-4"
                style={{ ...inputStyle, letterSpacing: "0.4em" }}
              />

              {verifyError && (
                <p className="text-xs mb-3 px-3 py-2 rounded-lg" style={{ color: "#f87171", background: "rgba(248,113,113,0.10)" }}>
                  {verifyError}
                </p>
              )}

              <button
                onClick={handleVerify}
                disabled={verifyOtp.isPending || otp.length < 4}
                className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98]"
                style={
                  otp.length >= 4 && !verifyOtp.isPending
                    ? { background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 6px 20px rgba(167,139,250,.38)" }
                    : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.30)", cursor: "not-allowed" }
                }
              >
                {verifyOtp.isPending ? "Проверка..." : "Войти"}
              </button>

              <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.30)" }}>
                Не пришёл код?{" "}
                <button
                  onClick={() => { requestOtp.reset(); handleSendOtp(); }}
                  className="underline"
                  style={{ color: "#A78BFA" }}
                >
                  Отправить снова
                </button>
              </p>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.20)" }}>
          © 2026 Savdo
        </p>
      </div>
    </div>
  );
}
