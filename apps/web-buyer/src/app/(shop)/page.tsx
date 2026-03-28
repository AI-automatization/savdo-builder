"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Glass tokens ──────────────────────────────────────────────────────────────

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

// ── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    emoji: "🛍",
    title: "Витрина товаров",
    desc:  "Красивый каталог с фото, ценами и категориями",
  },
  {
    emoji: "📦",
    title: "Приём заказов",
    desc:  "Покупатели оформляют заказы прямо со страницы магазина",
  },
  {
    emoji: "💬",
    title: "Чат с покупателями",
    desc:  "Общайтесь и отвечайте на вопросы в один клик",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [slug, setSlug]   = useState("");
  const [error, setError] = useState(false);

  function handleSlugGo() {
    const val = slug.trim().toLowerCase().replace(/\s+/g, "");
    if (!val) { setError(true); return; }
    router.push(`/${val}`);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSlugGo();
  }

  return (
    <div className="relative min-h-screen flex flex-col">

      {/* ── Ambient glow orbs ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 500, height: 500, top: -160, right: -140, background: "radial-gradient(circle, rgba(167,139,250,.22) 0%, transparent 70%)", filter: "blur(48px)" }} />
        <div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: 80,  left: -100,  background: "radial-gradient(circle, rgba(34,197,94,.14)  0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, top: "50%",  left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(96,165,250,.12) 0%, transparent 70%)", filter: "blur(36px)" }} />
        <div className="absolute rounded-full" style={{ width: 200, height: 200, bottom: 220, right: 60,   background: "radial-gradient(circle, rgba(167,139,250,.10) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full px-5 py-16 gap-8" style={{ zIndex: 1 }}>

        {/* ── Logo ── */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background:  "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
              boxShadow:   "0 12px 40px rgba(167,139,250,.45)",
            }}
          >
            <span className="text-4xl select-none">🛒</span>
          </div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: "#A78BFA", letterSpacing: "-0.02em" }}
          >
            Savdo
          </span>
        </div>

        {/* ── Hero text ── */}
        <div className="text-center flex flex-col gap-3">
          <h1 className="text-[26px] font-bold text-white leading-tight">
            Твой магазин в Telegram —<br />
            <span style={{ color: "#A78BFA" }}>теперь с витриной</span>
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
            Создай магазин за 5 минут и получи ссылку для покупателей
          </p>
        </div>

        {/* ── CTA button ── */}
        <Link
          href="/seller/register"
          className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white text-center tracking-wide active:scale-[0.98] transition-transform"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
            boxShadow:  "0 10px 32px rgba(167,139,250,.42)",
          }}
        >
          Создать магазин
        </Link>

        {/* ── Features ── */}
        <div className="w-full flex flex-col gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl"
              style={glass}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "rgba(167,139,250,.18)", border: "1px solid rgba(167,139,250,.25)" }}
              >
                {f.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-[12px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.42)" }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Slug lookup ── */}
        <div className="w-full rounded-2xl p-4 flex flex-col gap-3" style={glassDim}>
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
            Уже есть магазин?
          </p>
          <p className="text-sm text-white/55">Введите slug магазина и перейдите к витрине</p>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center rounded-xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: error ? "1px solid rgba(239,68,68,.55)" : "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <span
                className="px-3 text-sm flex-shrink-0 select-none"
                style={{ color: "rgba(255,255,255,0.28)", borderRight: "1px solid rgba(255,255,255,0.10)" }}
              >
                savdo.uz/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setError(false); }}
                onKeyDown={handleKey}
                placeholder="nike"
                className="flex-1 h-[44px] px-3 text-sm bg-transparent placeholder-white/20"
                style={{ color: "#fff", outline: "none" }}
              />
            </div>
            <button
              onClick={handleSlugGo}
              className="px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-80 active:scale-[0.97] flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
                boxShadow:  "0 4px 16px rgba(167,139,250,.32)",
              }}
            >
              Перейти
            </button>
          </div>
          {error && (
            <p className="text-[11px]" style={{ color: "rgba(239,68,68,.80)" }}>
              Введите slug магазина
            </p>
          )}
        </div>

      </div>

      {/* ── Footer note ── */}
      <div className="relative pb-8 text-center" style={{ zIndex: 1 }}>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.20)" }}>
          © 2026 Savdo — магазины в Telegram
        </p>
      </div>

    </div>
  );
}
