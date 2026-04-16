"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { ShoppingCart, Package, MessageSquare } from "lucide-react";

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

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug]   = useState("");
  const [error, setError] = useState(false);

  function handleGo() {
    const val = slug.trim().toLowerCase().replace(/\s+/g, "");
    if (!val) { setError(true); return; }
    router.push(`/${val}`);
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 500, height: 500, top: -160, right: -140, background: "radial-gradient(circle, rgba(167,139,250,.22) 0%, transparent 70%)", filter: "blur(48px)" }} />
        <div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: 80, left: -100, background: "radial-gradient(circle, rgba(34,197,94,.14) 0%, transparent 70%)", filter: "blur(40px)" }} />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-5 pb-32 pt-16 gap-8" style={{ zIndex: 1 }}>

        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 12px 40px rgba(167,139,250,.45)" }}
          >
            <ShoppingCart size={40} style={{ color: '#A78BFA' }} />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#A78BFA", letterSpacing: "-0.02em" }}>
            Savdo
          </span>
        </div>

        {/* Hero */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-[26px] font-bold text-white leading-tight">
            Магазины Узбекистана —<br />
            <span style={{ color: "#A78BFA" }}>в одном месте</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
            Покупайте у проверенных продавцов через Telegram
          </p>
        </div>

        {/* Slug input — основное действие */}
        <div className="w-full rounded-2xl p-4 flex flex-col gap-3" style={glass}>
          <p className="text-sm font-semibold text-white">Перейти в магазин</p>
          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.42)" }}>
            Введите ссылку магазина из Telegram
          </p>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: error ? "1px solid rgba(239,68,68,.55)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span className="px-3 text-sm flex-shrink-0 select-none" style={{ color: "rgba(255,255,255,0.28)", borderRight: "1px solid rgba(255,255,255,0.10)" }}>
                savdo.uz/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleGo()}
                placeholder="nike-uz"
                className="flex-1 h-[44px] px-3 text-sm bg-transparent placeholder-white/20"
                style={{ color: "#fff", outline: "none" }}
              />
            </div>
            <button
              onClick={handleGo}
              className="px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80 active:scale-[0.97] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 4px 16px rgba(167,139,250,.32)" }}
            >
              Перейти
            </button>
          </div>
          {error && <p className="text-[11px]" style={{ color: "rgba(239,68,68,.80)" }}>Введите ссылку магазина</p>}
        </div>

        {/* Quick links */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-opacity hover:opacity-80"
            style={glassDim}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(167,139,250,.18)", border: "1px solid rgba(167,139,250,.25)" }}>
              <Package size={20} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Мои заказы</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>Статус доставки и история покупок</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>

          <Link
            href="/chats"
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-opacity hover:opacity-80"
            style={glassDim}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(167,139,250,.18)", border: "1px solid rgba(167,139,250,.25)" }}>
              <MessageSquare size={20} style={{ color: '#A78BFA' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Чаты с продавцами</p>
              <p className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.42)" }}>Вопросы по заказу или товару</p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        </div>

        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.18)" }}>© 2026 Savdo</p>
      </div>

      {/* Bottom nav */}
      <BottomNavBar active="store" />
    </div>
  );
}
