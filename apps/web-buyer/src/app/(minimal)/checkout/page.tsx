"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useCheckoutPreview, useConfirmCheckout } from "@/hooks/use-checkout";
import { track } from "@/lib/analytics";
import type { CheckoutPreview, CheckoutPreviewItem } from "types";

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryMode = "delivery" | "pickup";
type PageStep = "otp-phone" | "otp-code" | "form";

// Extend preview type — API returns deliveryFee/total + validItems (not items) but shared type doesn't match yet
type PreviewItemLoose = CheckoutPreviewItem & { title?: string; productTitleSnapshot?: string; variantLabelSnapshot?: string | null; lineTotal?: number };
type PreviewWithFee = CheckoutPreview & {
  deliveryFee?: number;
  total?: number;
  validItems?: PreviewItemLoose[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined) =>
  (typeof n === "number" ? n : Number(n) || 0).toLocaleString("ru-RU");

// ── Glass tokens ───────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.09)",
} as const;

const inputStyle = {
  background:  "rgba(255,255,255,0.06)",
  border:      "1px solid rgba(255,255,255,0.13)",
  color:       "#fff",
  outline:     "none",
} as const;

// ── SVG Icons ──────────────────────────────────────────────────────────────

const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}    className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>;
const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;
const IcoTruck   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/></svg>;
const IcoPickup  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"/></svg>;
const IcoCash    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>;
const IcoNote    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>;

// ── Shared UI ──────────────────────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: "#A78BFA" }}>{icon}</span>
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Field({
  label, prefix, type = "text", placeholder, value, onChange, textarea,
}: {
  label: string; prefix?: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-white/40 font-medium">{label}</label>
      <div className="flex items-center rounded-xl overflow-hidden" style={inputStyle}>
        {prefix && (
          <span className="px-3 text-sm text-white/40 flex-shrink-0 h-[44px] flex items-center"
            style={{ borderRight: "1px solid rgba(255,255,255,0.10)" }}>
            {prefix}
          </span>
        )}
        {textarea ? (
          <textarea rows={2} placeholder={placeholder} value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-3 text-sm bg-transparent placeholder-white/25 resize-none"
            style={{ color: "#fff", outline: "none" }} />
        ) : (
          <input type={type} placeholder={placeholder} value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 h-[44px] text-sm bg-transparent placeholder-white/25"
            style={{ color: "#fff", outline: "none" }} />
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="px-4 py-3 rounded-xl text-sm"
      style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}>
      {message}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: "rgba(255,255,255,0.08)" }} />;
}

// ── OTP Gate ──────────────────────────────────────────────────────────────

function OtpGate({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code,  setCode]  = useState("");
  const [step,  setStep]  = useState<"phone" | "code">("phone");

  const requestOtp = useRequestOtp();
  const verifyOtp  = useVerifyOtp();

  function handleSendOtp() {
    if (phone.trim().length < 9) return;
    requestOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, purpose: "checkout" },
      { onSuccess: () => setStep("code") },
    );
  }

  function handleVerify() {
    if (code.trim().length < 4) return;
    verifyOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, code, purpose: "checkout" },
      { onSuccess: () => onSuccess() },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">
          {step === "phone" ? "Введите телефон" : "Введите код"}
        </h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          {step === "phone"
            ? "Для оформления заказа нужно подтвердить номер"
            : `Код отправлен в Telegram на +998 ${phone}`}
        </p>
      </div>

      {step === "phone" ? (
        <>
          <div>
            <label className="text-[11px] text-white/40 font-medium block mb-1.5">Телефон</label>
            <div className="flex items-center rounded-xl overflow-hidden" style={inputStyle}>
              <span className="px-3 text-sm text-white/40 flex-shrink-0 h-[44px] flex items-center"
                style={{ borderRight: "1px solid rgba(255,255,255,0.10)" }}>
                +998
              </span>
              <input
                type="tel"
                placeholder="90 123 45 67"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
                className="flex-1 px-3 h-[44px] text-sm bg-transparent placeholder-white/25"
                style={{ color: "#fff", outline: "none" }}
              />
            </div>
          </div>
          <ErrorBanner message={requestOtp.error?.message} />
          <button
            disabled={phone.trim().length < 9 || requestOtp.isPending}
            onClick={handleSendOtp}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 8px 28px rgba(167,139,250,.35)" }}
          >
            {requestOtp.isPending ? "Отправка..." : "Получить код"}
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="text-[11px] text-white/40 font-medium block mb-1.5">Код из сообщения</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="• • • •"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              className="w-full px-4 h-[52px] rounded-xl text-center text-xl font-bold tracking-[0.5em] placeholder-white/20"
              style={{ ...inputStyle, letterSpacing: "0.5em" }}
            />
          </div>
          <ErrorBanner message={verifyOtp.error?.message} />
          <button
            disabled={code.trim().length < 4 || verifyOtp.isPending}
            onClick={handleVerify}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 8px 28px rgba(167,139,250,.35)" }}
          >
            {verifyOtp.isPending ? "Проверка..." : "Подтвердить"}
          </button>
          <button
            onClick={() => setStep("phone")}
            className="text-xs text-center"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            ← Изменить номер
          </button>
        </>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router  = useRouter();
  const { user } = useAuth();

  const isAuthed = !!user?.isPhoneVerified;
  const [step, setStep] = useState<PageStep>(isAuthed ? "form" : "otp-phone");

  // Sync step when auth state changes (after OTP success)
  useEffect(() => {
    if (user?.isPhoneVerified && step !== "form") setStep("form");
  }, [user?.isPhoneVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview   = useCheckoutPreview();
  const confirm   = useConfirmCheckout();

  const [mode,    setMode]    = useState<DeliveryMode>("delivery");
  const [street,  setStreet]  = useState("");
  const [city,    setCity]    = useState("Ташкент");
  const [note,    setNote]    = useState("");
  const [apiError, setApiError] = useState<string>();

  const previewData = preview.data as PreviewWithFee | undefined;
  const previewItems: PreviewItemLoose[] =
    previewData?.items ?? previewData?.validItems ?? [];
  const storeDeliveryFee = previewData?.deliveryFee ?? 0;
  const deliveryFee = mode === "delivery" ? storeDeliveryFee : 0;
  const subtotal    = previewData?.subtotal ?? 0;
  const total       = subtotal + deliveryFee;

  // Redirect only if preview succeeded AND the cart is explicitly empty.
  // A transient fetch error must not kick the user out while they type.
  useEffect(() => {
    if (
      step === "form" &&
      preview.isSuccess &&
      previewData &&
      previewItems.length === 0
    ) {
      router.replace("/cart");
    }
  }, [step, preview.isSuccess, previewData, previewItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analytics
  useEffect(() => {
    if (previewData) {
      track.checkoutStarted(previewData.storeId, previewItems.length, subtotal);
    }
  }, [previewData?.storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit =
    step === "form" &&
    !confirm.isPending &&
    (mode === "pickup" || (street.trim() !== "" && city.trim() !== ""));

  async function handleConfirm() {
    if (!canSubmit || !preview.data) return;
    setApiError(undefined);
    try {
      const order = await confirm.mutateAsync({
        deliveryAddress: mode === "pickup"
          ? { street: "Самовывоз", city: city.trim() || "—" }
          : { street, city },
        buyerNote: note || undefined,
        deliveryFee,
      });
      track.orderCreated(preview.data.storeId, order.id, order.totalAmount, "COD");
      router.replace(`/orders/${order.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setApiError(err?.response?.data?.message ?? "Не удалось оформить заказ. Попробуйте ещё раз.");
    }
  }


  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}>

      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: 140, left: -70, background: "radial-gradient(circle, rgba(34,197,94,.12) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-5 pb-60" style={{ zIndex: 1 }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/cart"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors flex-shrink-0"
            style={glass}>
            <IcoBack />
          </Link>
          <h1 className="flex-1 text-xl font-semibold text-white tracking-tight">
            Оформление заказа
          </h1>
        </div>

        {/* ── OTP Gate ── */}
        {step !== "form" && (
          <div className="rounded-2xl p-6" style={glass}>
            <OtpGate onSuccess={() => setStep("form")} />
          </div>
        )}

        {/* ── Checkout Form ── */}
        {step === "form" && (
          <div className="flex flex-col gap-4">

            {/* Delivery toggle */}
            <div className="flex gap-2 p-1 rounded-2xl" style={glassDim}>
              {(["delivery", "pickup"] as DeliveryMode[]).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={mode === m
                    ? { background: "rgba(167,139,250,.25)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.35)" }
                    : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }}>
                  {m === "delivery" ? <IcoTruck /> : <IcoPickup />}
                  {m === "delivery" ? "Доставка" : "Самовывоз"}
                </button>
              ))}
            </div>

            {/* Delivery address */}
            {mode === "delivery" && (
              <Section label="Адрес доставки" icon={<IcoNote />}>
                <Field label="Улица, дом, квартира *" placeholder="ул. Навои 15, кв. 3"
                  value={street} onChange={setStreet} />
                <Field label="Город *" placeholder="Ташкент"
                  value={city} onChange={setCity} />
                <Field label="Комментарий к заказу" placeholder="Подъезд, этаж, ориентир..."
                  value={note} onChange={setNote} textarea />
              </Section>
            )}

            {mode === "pickup" && (
              <Section label="Самовывоз" icon={<IcoPickup />}>
                <div className="flex items-start gap-3 py-1">
                  <span style={{ color: "#A78BFA" }} className="mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/>
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm text-white/80 font-medium">Адрес уточните у продавца</p>
                    <p className="text-xs text-white/40 mt-0.5">Свяжитесь через Telegram для согласования</p>
                  </div>
                </div>
                <Field label="Комментарий" placeholder="Удобное время самовывоза..."
                  value={note} onChange={setNote} textarea />
              </Section>
            )}

            {/* Payment */}
            <Section label="Оплата" icon={<IcoCash />}>
              <div className="flex items-center gap-3 py-1 px-1 rounded-xl"
                style={{ border: "1px solid rgba(167,139,250,.35)", background: "rgba(167,139,250,.08)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: "2px solid #A78BFA" }}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#A78BFA" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Наличными при получении</p>
                  <p className="text-[11px] text-white/38 mt-0.5">Cash on Delivery</p>
                </div>
                <IcoCash />
              </div>
            </Section>

            {/* Order items */}
            <Section label="Состав заказа" icon={<IcoOrders />}>
              {preview.isLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                previewItems.map((item) => {
                  const label = item.title ?? item.productTitleSnapshot ?? "Товар";
                  const variantLabel = item.variantTitle ?? item.variantLabelSnapshot ?? null;
                  const lineTotal = item.subtotal ?? item.lineTotal ?? 0;
                  return (
                    <div key={item.productId + (item.variantId ?? "")}
                      className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/85 truncate">{label}</p>
                        {variantLabel && (
                          <p className="text-xs text-white/40 mt-0.5">{variantLabel}</p>
                        )}
                        <p className="text-xs text-white/35 mt-0.5">× {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium flex-shrink-0" style={{ color: "#A78BFA" }}>
                        {fmt(lineTotal)} сум
                      </span>
                    </div>
                  );
                })
              )}

              {/* Stock warnings */}
              {(preview.data?.stockWarnings?.length ?? 0) > 0 && (
                <div className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: "rgba(251,191,36,.10)", border: "1px solid rgba(251,191,36,.25)", color: "#fbbf24" }}>
                  Некоторые товары заканчиваются. Вернитесь в корзину и скорректируйте количество.
                </div>
              )}
            </Section>

            {/* Summary */}
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={glassDim}>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-1">Итого</p>
              {preview.isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Товары</span>
                    <span className="text-white/70">{fmt(subtotal)} сум</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/50">Доставка</span>
                    {deliveryFee > 0
                      ? <span className="text-white/70">{fmt(deliveryFee)} сум</span>
                      : <span className="text-emerald-400">Бесплатно</span>}
                  </div>
                  <div className="flex justify-between pt-2 mt-1"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                    <span className="text-base font-semibold text-white">К оплате</span>
                    <span className="text-base font-bold" style={{ color: "#A78BFA" }}>
                      {fmt(total)} сум
                    </span>
                  </div>
                </>
              )}
            </div>

            <ErrorBanner message={apiError} />

          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      {step === "form" && (
        <div className="fixed left-0 right-0 px-4" style={{ bottom: 76, zIndex: 50 }}>
          <div className="max-w-md mx-auto">
            <button
              disabled={!canSubmit}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]"
              style={canSubmit
                ? { background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,.38)" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)", cursor: "not-allowed" }}>
              {confirm.isPending
                ? "Оформляем..."
                : `Подтвердить заказ · ${fmt(total)} сум`}
            </button>
          </div>
        </div>
      )}

      <BottomNavBar active="cart" />
    </div>
  );
}
