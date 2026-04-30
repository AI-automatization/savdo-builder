"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { RecentStores } from "@/components/home/RecentStores";
import { ShoppingCart, Package, MessageSquare, ChevronRight } from "lucide-react";
import { colors } from "@/lib/styles";

const SLUG_RE = /^[a-z0-9-]+$/;

function extractSlug(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) return null;

  const tgMatch = trimmed.match(/[?&](?:startapp|start)=store_([^&#]+)/i);
  if (tgMatch) {
    const s = tgMatch[1].toLowerCase();
    return SLUG_RE.test(s) ? s : null;
  }

  const urlMatch = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?savdo\.uz\/([^/?#]+)/i);
  if (urlMatch) {
    const s = urlMatch[1].toLowerCase();
    return SLUG_RE.test(s) ? s : null;
  }

  const s = trimmed.toLowerCase();
  return SLUG_RE.test(s) ? s : null;
}

export default function HomePage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [error, setError] = useState(false);

  function handleGo() {
    const parsed = extractSlug(slug);
    if (!parsed) { setError(true); return; }
    router.push(`/${parsed}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-32 md:pb-12 flex flex-col gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentHover} 100%)`, boxShadow: `0 12px 32px ${colors.accentMuted}` }}
          >
            <ShoppingCart size={36} style={{ color: "#FFFFFF" }} />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: colors.brand }}>
            Savdo
          </span>
        </div>

        {/* Hero */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: colors.textPrimary }}>
            Магазины Узбекистана —<br />
            <span style={{ color: colors.accent }}>в одном месте</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: colors.textMuted }}>
            Покупайте у проверенных продавцов через Telegram
          </p>
        </div>

        {/* Slug input */}
        <div
          className="w-full rounded-2xl p-4 sm:p-5 flex flex-col gap-3"
          style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Перейти в магазин</p>
          <p className="text-xs" style={{ color: colors.textMuted }}>
            Введите ссылку магазина из Telegram
          </p>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center rounded-xl overflow-hidden"
              style={{
                background: colors.surfaceMuted,
                border: error ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`,
              }}
            >
              <span
                className="px-3 text-sm flex-shrink-0 select-none h-[44px] flex items-center"
                style={{ color: colors.textDim, borderRight: `1px solid ${colors.border}` }}
              >
                savdo.uz/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleGo()}
                placeholder="nike-uz"
                className="flex-1 h-[44px] px-3 text-sm bg-transparent outline-none"
                style={{ color: colors.textPrimary }}
              />
            </div>
            <button
              onClick={handleGo}
              className="px-5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.97] flex-shrink-0"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
            >
              Перейти
            </button>
          </div>
          {error && (
            <p className="text-[11px]" style={{ color: colors.danger }}>
              Проверьте ссылку — подойдёт slug, savdo.uz/&lt;slug&gt; или Telegram-ссылка магазина
            </p>
          )}
        </div>

        {/* Recent stores */}
        <RecentStores />

        {/* Quick links */}
        <div className="w-full flex flex-col gap-3 sm:grid sm:grid-cols-2 sm:gap-4">
          <Link
            href="/orders"
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
            >
              <Package size={20} style={{ color: colors.accent }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Мои заказы</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Статус доставки и история</p>
            </div>
            <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
          </Link>

          <Link
            href="/chats"
            className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
            >
              <MessageSquare size={20} style={{ color: colors.accent }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Чаты с продавцами</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Вопросы по заказу или товару</p>
            </div>
            <ChevronRight size={16} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
          </Link>
        </div>

        <p className="text-[11px] text-center mt-auto" style={{ color: colors.textDim }}>© 2026 Savdo</p>
      </div>

      <BottomNavBar active="store" />
    </div>
  );
}
