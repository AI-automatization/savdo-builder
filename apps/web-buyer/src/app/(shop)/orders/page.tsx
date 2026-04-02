"use client";

import { useState } from "react";
import Link from "next/link";
import { OrderStatus } from "types";
import type { OrderListItem } from "types";
import { useAuth } from "@/lib/auth/context";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";

// ── Glass tokens ───────────────────────────────────────────────────────────

const glass = {
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDim = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.09)",
} as const;

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "#fff",
  outline: "none",
} as const;

// ── Icons ──────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;

// ── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: "Ожидает",     color: "rgba(251,191,36,.85)" },
  [OrderStatus.CONFIRMED]:  { label: "Подтверждён", color: "rgba(96,165,250,.85)" },
  [OrderStatus.PROCESSING]: { label: "Обработка",   color: "rgba(167,139,250,.90)" },
  [OrderStatus.SHIPPED]:    { label: "В пути",      color: "rgba(129,140,248,.85)" },
  [OrderStatus.DELIVERED]:  { label: "Доставлен",   color: "rgba(52,211,153,.85)" },
  [OrderStatus.CANCELLED]:  { label: "Отменён",     color: "rgba(248,113,113,.85)" },
};

const FILTER_TABS: { key: OrderStatus | "ALL"; label: string }[] = [
  { key: "ALL",                    label: "Все" },
  { key: OrderStatus.PENDING,      label: "Ожидают" },
  { key: OrderStatus.CONFIRMED,    label: "Подтвержд." },
  { key: OrderStatus.SHIPPED,      label: "В пути" },
  { key: OrderStatus.DELIVERED,    label: "Доставлены" },
];

const fmt = (n: number) => n.toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

// ── Nav ────────────────────────────────────────────────────────────────────

const NAV = [
  { href: "/",        label: "Магазин", icon: <IcoShop /> },
  { href: "/cart",    label: "Корзина", icon: <IcoCart /> },
  { href: "/chats",   label: "Чаты",    icon: <IcoChat /> },
  { href: "/orders",  label: "Заказы",  icon: <IcoOrders />, active: true },
  { href: "/profile", label: "Профиль", icon: <IcoProfile /> },
];

// ── OTP Gate ───────────────────────────────────────────────────────────────

type OtpStep = "phone" | "code";

function OtpGate() {
  const [step, setStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  async function handleSendCode() {
    setError("");
    try {
      await requestOtp.mutateAsync({ phone, purpose: "login" });
      setStep("code");
    } catch {
      setError("Не удалось отправить код. Проверьте номер.");
    }
  }

  async function handleVerify() {
    setError("");
    try {
      await verifyOtp.mutateAsync({ phone, code, purpose: "login" });
    } catch {
      setError("Неверный код. Попробуйте ещё раз.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(167,139,250,.20)", border: "1px solid rgba(167,139,250,.35)" }}>
            <IcoOrders />
          </div>
          <h2 className="text-lg font-bold text-white">Войдите чтобы видеть заказы</h2>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
            {step === "phone" ? "Введите номер телефона для входа" : `Код отправлен на ${phone}`}
          </p>
        </div>

        <div className="rounded-2xl p-4 flex flex-col gap-3" style={glass}>
          {step === "phone" ? (
            <>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 000 00 00"
                className="h-11 px-4 rounded-xl text-sm w-full focus:outline-none focus:ring-2"
                style={{ ...inputStyle, "--tw-ring-color": "rgba(167,139,250,0.50)" } as React.CSSProperties}
                onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
              />
              <button
                onClick={handleSendCode}
                disabled={!phone.trim() || requestOtp.isPending}
                className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
              >
                {requestOtp.isPending ? "Отправка..." : "Получить код"}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="0000"
                maxLength={6}
                className="h-11 px-4 rounded-xl text-sm text-center tracking-widest w-full focus:outline-none focus:ring-2"
                style={{ ...inputStyle, "--tw-ring-color": "rgba(167,139,250,0.50)" } as React.CSSProperties}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              />
              <button
                onClick={handleVerify}
                disabled={code.length < 4 || verifyOtp.isPending}
                className="h-11 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
              >
                {verifyOtp.isPending ? "Проверка..." : "Войти"}
              </button>
              <button
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="text-xs text-center"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Изменить номер
              </button>
            </>
          )}
          {error && <p className="text-xs text-center" style={{ color: "rgba(248,113,113,.85)" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderListItem }) {
  const cfg = STATUS_CONFIG[order.status] ?? { label: order.status, color: "rgba(255,255,255,.5)" };
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl active:opacity-80 transition-opacity"
      style={glass}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">#{shortId(order.id)}</span>
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0"
            style={{ background: cfg.color + "22", color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="text-xs mt-1 truncate" style={{ color: "rgba(255,255,255,0.40)" }}>
          {order.deliveryAddress.city}, {order.deliveryAddress.street}
        </p>
        <p className="text-sm font-medium mt-1.5" style={{ color: "#A78BFA" }}>
          {fmt(order.totalAmount)} сум
        </p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="px-4 py-3.5 rounded-2xl flex flex-col gap-2" style={glass}>
      <div className="flex justify-between">
        <div className="h-3.5 w-20 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.12)" }} />
        <div className="h-3.5 w-16 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
      <div className="h-3 w-36 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
      <div className="h-3.5 w-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
    </div>
  );
}

// ── Orders List ────────────────────────────────────────────────────────────

function OrdersList() {
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "ALL">("ALL");
  const { data, isLoading, isError } = useOrders(
    activeFilter !== "ALL" ? { status: activeFilter } : undefined,
  );

  const orders = data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const active = tab.key === activeFilter;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={
                active
                  ? { background: "rgba(167,139,250,0.25)", color: "rgba(167,139,250,1)", border: "1px solid rgba(167,139,250,0.35)" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.10)" }
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {isError && (
        <p className="text-sm text-center py-8" style={{ color: "rgba(248,113,113,.80)" }}>
          Не удалось загрузить заказы. Обновите страницу.
        </p>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">📦</p>
          <p className="text-sm font-medium text-white/60">
            {activeFilter === "ALL" ? "У вас пока нет заказов" : `Нет заказов со статусом "${STATUS_CONFIG[activeFilter]?.label}"`}
          </p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-6 pb-28" style={{ zIndex: 1 }}>
        <h1 className="text-xl font-bold text-white mb-5">Мои заказы</h1>
        {isAuthenticated ? <OrdersList /> : <OtpGate />}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 50 }}>
        <div className="max-w-md mx-auto" style={{ ...glassDim, borderRadius: "20px 20px 0 0", borderBottom: "none" }}>
          <nav className="flex items-center justify-around px-2 py-2">
            {NAV.map(({ href, label, icon, active }) => (
              <Link key={href} href={href} className="flex flex-col items-center gap-[3px] px-3 py-1 rounded-xl">
                <span style={{ color: active ? "#A78BFA" : "rgba(255,255,255,0.32)" }}>{icon}</span>
                <span className="text-[10px] font-medium" style={{ color: active ? "#A78BFA" : "rgba(255,255,255,0.28)" }}>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
