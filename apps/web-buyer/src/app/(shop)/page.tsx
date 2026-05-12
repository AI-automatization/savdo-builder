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
            className="w-20 h-20 rounded-lg flex items-center justify-center"
            style={{ background: colors.brand, boxShadow: `0 4px 12px rgba(124,63,46,0.15)` }}
          >
            <ShoppingCart size={36} style={{ color: colors.brandTextOnBg }} />
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: colors.brand }}>
            Savdo
          </span>
        </div>

        {/* Hero */}
        <div className="text-center flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: colors.textStrong }}>
            Магазины Узбекистана —<br />
            <span style={{ color: colors.brand }}>в одном месте</span>
          </h1>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: colors.textMuted }}>
            Покупайте у проверенных продавцов через Telegram
          </p>
        </div>

        {/* Slug input */}
        <div
          className="w-full rounded-lg p-4 sm:p-5 flex flex-col gap-3"
          style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="text-[10px] tracking-[0.18em] uppercase font-semibold" style={{ color: colors.textMuted }}>
            — Перейти в магазин
          </div>
          <p className="text-xs" style={{ color: colors.textMuted }}>
            Введите ссылку магазина из Telegram
          </p>
          <div className="flex gap-2">
            <div
              className="flex-1 flex items-center rounded-md overflow-hidden"
              style={{
                background: colors.surfaceMuted,
                border: error ? `1px solid ${colors.danger}` : `1px solid ${colors.border}`,
              }}
            >
              <span
                className="px-3 text-sm flex-shrink-0 select-none h-[44px] flex items-center"
                style={{ color: colors.textMuted, borderRight: `1px solid ${colors.border}` }}
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
                style={{ color: colors.textStrong }}
              />
            </div>
            <button
              onClick={handleGo}
              className="px-5 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.97] flex-shrink-0"
              style={{ background: colors.brand, color: colors.brandTextOnBg }}
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
        <div className="w-full flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-3">
          <Link
            href="/orders"
            className="flex items-center gap-3 px-4 py-3.5 rounded-md transition-all hover:-translate-y-0.5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: colors.brandMuted }}
            >
              <Package size={18} style={{ color: colors.brand }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: colors.textStrong }}>Мои заказы</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>Статус доставки и история</p>
            </div>
            <ChevronRight size={14} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
          </Link>

          <Link
            href="/chats"
            className="flex items-center gap-3 px-4 py-3.5 rounded-md transition-all hover:-translate-y-0.5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: colors.brandMuted }}
            >
              <MessageSquare size={18} style={{ color: colors.brand }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: colors.textStrong }}>Чаты с продавцами</p>
              <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>Вопросы по заказу или товару</p>
            </div>
            <ChevronRight size={14} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
          </Link>
        </div>

        <p className="text-[11px] text-center mt-auto" style={{ color: colors.textMuted }}>© 2026 Savdo</p>
      </div>

      <BottomNavBar active="store" />
    </div>
  );
}
