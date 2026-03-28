"use client";

import { useState } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────

type DeliveryMode = "delivery" | "pickup";

// ── Mock order summary ─────────────────────────────────────────────────────

const SUBTOTAL  = 3_660_000;
const DELIVERY  = 25_000;

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ru-RU");

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

// ── Input shared style ─────────────────────────────────────────────────────

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
const IcoUser    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>;
const IcoPhone   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>;
const IcoPin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>;
const IcoNote    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>;

// ── Section wrapper ────────────────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      {/* Section header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <span style={{ color: "#A78BFA" }}>{icon}</span>
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────

function Field({
  label,
  prefix,
  type = "text",
  placeholder,
  value,
  onChange,
  textarea,
}: {
  label: string;
  prefix?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-white/40 font-medium">{label}</label>
      <div className="flex items-center rounded-xl overflow-hidden" style={inputStyle}>
        {prefix && (
          <span
            className="px-3 text-sm text-white/40 flex-shrink-0 h-[44px] flex items-center"
            style={{ borderRight: "1px solid rgba(255,255,255,0.10)" }}
          >
            {prefix}
          </span>
        )}
        {textarea ? (
          <textarea
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 py-3 text-sm bg-transparent placeholder-white/25 resize-none"
            style={{ color: "#fff", outline: "none" }}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-3 h-[44px] text-sm bg-transparent placeholder-white/25"
            style={{ color: "#fff", outline: "none" }}
          />
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const [name,     setName]     = useState("");
  const [phone,    setPhone]    = useState("");
  const [address,  setAddress]  = useState("");
  const [comment,  setComment]  = useState("");
  const [mode,     setMode]     = useState<DeliveryMode>("delivery");
  const [submitted, setSubmit]  = useState(false);

  const total = mode === "delivery" ? SUBTOTAL + DELIVERY : SUBTOTAL;

  const canSubmit = name.trim() && phone.trim().length >= 9 &&
    (mode === "pickup" || address.trim());

  const NAV = [
    { href: "/",        label: "Магазин", icon: <IcoShop /> },
    { href: "/cart",    label: "Корзина", icon: <IcoCart />, badge: 4 },
    { href: "/chats",   label: "Чаты",    icon: <IcoChat /> },
    { href: "/orders",  label: "Заказы",  icon: <IcoOrders /> },
    { href: "/profile", label: "Профиль", icon: <IcoProfile /> },
  ];

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
      >
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -80, right: -80,  background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
          <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: 100, left: -60, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)",  filter: "blur(28px)" }} />
        </div>
        <div className="relative z-10">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
            style={{ background: "rgba(167,139,250,.18)", border: "1px solid rgba(167,139,250,.35)" }}
          >
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заказ оформлен!</h2>
          <p className="text-white/45 text-sm mb-8 leading-relaxed">
            Продавец свяжется с вами<br/>в ближайшее время
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,.38)" }}
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80,  background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: 140, left: -70,  background: "radial-gradient(circle, rgba(34,197,94,.12)  0%, transparent 70%)", filter: "blur(28px)" }} />
        <div className="absolute rounded-full" style={{ width: 200, height: 200, top: "45%", left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(96,165,250,.09) 0%, transparent 70%)", filter: "blur(24px)" }} />
      </div>

      {/* Scrollable content */}
      <div className="relative max-w-md mx-auto px-4 pt-5 pb-60" style={{ zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/cart"
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors flex-shrink-0"
            style={glass}
          >
            <IcoBack />
          </Link>
          <h1 className="flex-1 text-xl font-semibold text-white tracking-tight">
            Оформление заказа
          </h1>
        </div>

        {/* ── Delivery toggle ── */}
        <div className="flex gap-2 mb-5 p-1 rounded-2xl" style={glassDim}>
          {(["delivery", "pickup"] as DeliveryMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                mode === m
                  ? { background: "rgba(167,139,250,.25)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.35)" }
                  : { color: "rgba(255,255,255,0.38)", border: "1px solid transparent" }
              }
            >
              {m === "delivery" ? <IcoTruck /> : <IcoPickup />}
              {m === "delivery" ? "Доставка" : "Самовывоз"}
            </button>
          ))}
        </div>

        {/* ── Sections ── */}
        <div className="flex flex-col gap-4">

          {/* Recipient */}
          <Section label="Получатель" icon={<IcoUser />}>
            <Field
              label="Имя"
              placeholder="Ваше имя"
              value={name}
              onChange={setName}
            />
            <Field
              label="Телефон"
              type="tel"
              prefix="+998"
              placeholder="90 123 45 67"
              value={phone}
              onChange={setPhone}
            />
          </Section>

          {/* Delivery details */}
          <Section label={mode === "delivery" ? "Доставка" : "Самовывоз"} icon={mode === "delivery" ? <IcoTruck /> : <IcoPickup />}>
            {mode === "delivery" ? (
              <>
                <Field
                  label="Адрес"
                  placeholder="Улица, дом, квартира"
                  value={address}
                  onChange={setAddress}
                />
                <Field
                  label="Комментарий к заказу"
                  placeholder="Подъезд, этаж, ориентир..."
                  value={comment}
                  onChange={setComment}
                  textarea
                />
              </>
            ) : (
              <div
                className="flex items-start gap-3 py-2"
              >
                <span style={{ color: "#A78BFA" }} className="mt-0.5"><IcoPin /></span>
                <div>
                  <p className="text-sm text-white/80 font-medium">Nike Uzbekistan</p>
                  <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                    г. Ташкент, ул. Амира Темура 5<br/>
                    Пн–Сб, 10:00–20:00
                  </p>
                </div>
              </div>
            )}
          </Section>

          {/* Payment */}
          <Section label="Оплата" icon={<IcoCash />}>
            <div
              className="flex items-center gap-3 py-1 px-1 rounded-xl"
              style={{ border: "1px solid rgba(167,139,250,.35)", background: "rgba(167,139,250,.08)" }}
            >
              {/* Radio dot */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: "2px solid #A78BFA" }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#A78BFA" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Наличными при получении</p>
                <p className="text-[11px] text-white/38 mt-0.5">Cash on Delivery</p>
              </div>
              <IcoCash />
            </div>
            <p className="text-[11px] text-white/28 px-1">
              Другие способы оплаты появятся позже
            </p>
          </Section>

          {/* Order summary */}
          <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={glassDim}>
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-1">Итого</p>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Товары</span>
              <span className="text-white/70">{fmt(SUBTOTAL)} сум</span>
            </div>
            {mode === "delivery" && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Доставка</span>
                <span className="text-white/70">{fmt(DELIVERY)} сум</span>
              </div>
            )}
            {mode === "pickup" && (
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Доставка</span>
                <span className="text-emerald-400 text-sm">Бесплатно</span>
              </div>
            )}
            <div
              className="flex justify-between pt-2 mt-1"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-base font-semibold text-white">К оплате</span>
              <span className="text-base font-bold" style={{ color: "#A78BFA" }}>
                {fmt(total)} сум
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed left-0 right-0 px-4" style={{ bottom: 76, zIndex: 50 }}>
        <div className="max-w-md mx-auto">
          <button
            disabled={!canSubmit}
            onClick={() => setSubmit(true)}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white tracking-wide transition-all active:scale-[0.98]"
            style={
              canSubmit
                ? { background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,.38)" }
                : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)", cursor: "not-allowed" }
            }
          >
            Подтвердить заказ · {fmt(total)} сум
          </button>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 50 }}>
        <div
          className="max-w-md mx-auto"
          style={{ ...glassDim, borderRadius: "20px 20px 0 0", borderBottom: "none" }}
        >
          <nav className="flex items-center justify-around px-2 py-2">
            {NAV.map(({ href, label, icon, badge }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-[3px] px-3 py-1 rounded-xl"
              >
                <div className="relative">
                  <span style={{ color: "rgba(255,255,255,0.32)" }}>{icon}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 w-[17px] h-[17px] flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "#A78BFA", color: "#0d0d1f" }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
