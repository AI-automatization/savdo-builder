"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { RecentStores } from "@/components/home/RecentStores";
import { ShoppingCart, Package, MessageSquare } from "lucide-react";
import { glass, glassDim } from "@/lib/styles";

const SLUG_RE = /^[a-z0-9-]+$/;

function extractSlug(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return null;

  // Telegram deep link: t.me/<bot>?startapp=store_<slug>  (или &start= / start=)
  const tgMatch = trimmed.match(/[?&](?:startapp|start)=store_([^&#]+)/i);
  if (tgMatch) {
    const s = tgMatch[1].toLowerCase();
    return SLUG_RE.test(s) ? s : null;
  }

  // Полный URL savdo.uz/<slug> или https://savdo.uz/<slug>
  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?savdo\.uz\/([^/?#]+)/i);
  if (urlMatch) {
    const s = urlMatch[1].toLowerCase();
    return SLUG_RE.test(s) ? s : null;
  }

  // Просто slug
  const s = trimmed.toLowerCase();
  return SLUG_RE.test(s) ? s : null;
}

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug]   = useState("");
  const [error, setError] = useState(false);

  function handleGo() {
    const parsed = extractSlug(slug);
    if (!parsed) { setError(true); return; }
    router.push(`/${parsed}`);
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
          {error && (
            <p className="text-[11px]" style={{ color: "rgba(239,68,68,.80)" }}>
              Проверьте ссылку — подойдёт slug (например <span style={{ color: "#fff" }}>nike-uz</span>), <span style={{ color: "#fff" }}>savdo.uz/nike-uz</span> или Telegram-ссылка магазина.
            </p>
          )}
        </div>

        {/* Recent stores */}
        <RecentStores />

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
