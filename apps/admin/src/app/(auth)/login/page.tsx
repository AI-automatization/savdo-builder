"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ArrowRight, RotateCcw, Store } from "lucide-react";
import { BGPattern } from "@/components/ui/bg-pattern";

type Step = "phone" | "otp";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? "savdo_builderBOT";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setCountdown(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("998")) return `+${digits}`;
    if (digits.startsWith("8")) return `+7${digits.slice(1)}`;
    return digits.length > 0 ? `+${digits}` : "";
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const normalizedPhone = formatPhone(phone) || phone;

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone, purpose: "login" }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.code === "TELEGRAM_NOT_LINKED"
            ? `Telegram не привязан. Откройте @${BOT_USERNAME}, нажмите /start и поделитесь номером.`
            : data.message ?? "Ошибка. Попробуйте снова.";
        setError(msg);
        return;
      }

      setExpiresAt(new Date(data.expiresAt));
      setPhone(normalizedPhone);
      setStep("otp");
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      setError("Сервер недоступен. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 3) inputRefs.current[index + 1]?.focus();
    if (next.every(d => d) && digit) handleVerify(next.join(""));
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, purpose: "login" }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg =
          data.code === "OTP_INVALID" ? "Неверный код" :
          data.code === "OTP_EXPIRED" ? "Код истёк. Запросите новый." :
          data.message ?? "Ошибка проверки.";
        setError(msg);
        setOtp(["", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.user?.role !== "ADMIN") {
        setError("Доступ запрещён. Только для администраторов Savdo.");
        setOtp(["", "", "", ""]);
        return;
      }

      sessionStorage.setItem("access_token", data.accessToken);
      localStorage.setItem("refresh_token", data.refreshToken);
      window.location.href = "/dashboard";
    } catch {
      setError("Сервер недоступен.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (digits.length === 4) {
      const arr = digits.split("");
      setOtp(arr);
      inputRefs.current[3]?.focus();
      handleVerify(digits);
    }
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      <BGPattern variant="grid" mask="fade-edges" size={28} fill="rgba(129,140,248,0.07)" />

      {/* Glow orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none"
        style={{
          width: "480px",
          height: "320px",
          background: "radial-gradient(ellipse, rgba(129,140,248,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "40px 36px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            style={{
              width: "56px",
              height: "56px",
              background: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 6px 24px rgba(129,140,248,0.45)",
            }}
          >
            <Store size={26} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: "21px",
              fontWeight: "700",
              color: "var(--color-text)",
              marginBottom: "6px",
              letterSpacing: "-0.01em",
            }}
          >
            Savdo Admin
          </h1>
          <p style={{ fontSize: "13px", color: "var(--color-text-muted)", textAlign: "center" }}>
            {step === "phone"
              ? "Панель управления платформой"
              : `Код отправлен в Telegram на ${phone}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-7">
          {(["phone", "otp"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: step === s || (s === "phone" && step === "otp")
                    ? "var(--color-primary)"
                    : "var(--color-surface2)",
                  color: step === s || (s === "phone" && step === "otp")
                    ? "#fff"
                    : "var(--color-text-muted)",
                  transition: "all 200ms ease",
                }}
              >
                {i + 1}
              </div>
              {i === 0 && (
                <div
                  style={{
                    width: "32px",
                    height: "2px",
                    borderRadius: "2px",
                    background: step === "otp"
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                    transition: "background 200ms ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Phone step */}
        {step === "phone" && (
          <form
            onSubmit={handleRequestOtp}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  marginBottom: "8px",
                }}
              >
                Номер телефона
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                className="admin-input"
                style={{ fontSize: "15px" }}
                required
                autoFocus
                autoComplete="tel"
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginTop: "8px",
                  lineHeight: "1.5",
                }}
              >
                Код придёт в Telegram от{" "}
                <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>
                  @{BOT_USERNAME}
                </span>
              </p>
            </div>

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              className="btn-primary justify-center"
              style={{ height: "46px", fontSize: "14px" }}
              disabled={loading || !phone.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Отправка...
                </>
              ) : (
                <>
                  Получить код <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* OTP step */}
        {step === "otp" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{ display: "flex", gap: "12px", justifyContent: "center" }}
              onPaste={handlePaste}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={e => handleOtpInput(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  maxLength={1}
                  style={{
                    width: "64px",
                    height: "68px",
                    textAlign: "center",
                    fontSize: "26px",
                    fontWeight: "700",
                    background: "var(--color-surface2)",
                    border: `2px solid ${digit ? "var(--color-primary)" : "var(--color-border)"}`,
                    borderRadius: "14px",
                    color: "var(--color-text)",
                    outline: "none",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                    caretColor: "var(--color-primary)",
                    boxShadow: digit ? "0 0 0 3px rgba(129,140,248,0.15)" : "none",
                  }}
                  disabled={loading}
                />
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)" }}>
              {countdown > 0 ? (
                <>
                  Код действителен ещё{" "}
                  <span
                    style={{
                      color: countdown < 30 ? "var(--color-error)" : "var(--color-text)",
                      fontWeight: "600",
                    }}
                  >
                    {minutes > 0
                      ? `${minutes}:${String(seconds).padStart(2, "0")}`
                      : `${seconds}с`}
                  </span>
                </>
              ) : (
                <span style={{ color: "var(--color-error)" }}>Код истёк</span>
              )}
            </div>

            {error && <ErrorBox message={error} />}

            {loading && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <Loader2
                  size={20}
                  className="animate-spin"
                  style={{ color: "var(--color-primary)" }}
                />
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp(["", "", "", ""]);
                  setError("");
                }}
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ← Изменить номер
              </button>
              {countdown === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOtp(["", "", "", ""]);
                    handleRequestOtp({ preventDefault: () => {} } as React.FormEvent);
                  }}
                  style={{
                    fontSize: "12px",
                    color: "var(--color-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "600",
                  }}
                >
                  <RotateCcw size={12} /> Новый код
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        fontSize: "13px",
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#EF4444",
        lineHeight: "1.5",
      }}
    >
      {message}
    </div>
  );
}
