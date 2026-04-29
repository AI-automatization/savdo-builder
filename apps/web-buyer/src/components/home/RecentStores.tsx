"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { getRecentStores, removeRecentStore, type RecentStore } from "@/lib/recent-stores";
import { colors } from "@/lib/styles";

export function RecentStores() {
  const [stores, setStores] = useState<RecentStore[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setStores(getRecentStores());
    setMounted(true);
  }, []);

  if (!mounted || stores.length === 0) return null;

  function handleRemove(e: React.MouseEvent, slug: string) {
    e.preventDefault();
    e.stopPropagation();
    removeRecentStore(slug);
    setStores((prev) => prev.filter((s) => s.slug !== slug));
  }

  return (
    <div className="w-full">
      <p className="text-xs font-semibold mb-3 px-1" style={{ color: colors.textMuted }}>
        Недавние магазины
      </p>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
        {stores.map((store) => (
          <Link
            key={store.slug}
            href={`/${store.slug}`}
            className="group relative flex flex-col items-center gap-2 flex-shrink-0 w-[84px] p-2.5 rounded-2xl transition-all hover:-translate-y-0.5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <button
              type="button"
              onClick={(e) => handleRemove(e, store.slug)}
              aria-label="Забыть магазин"
              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity"
              style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
            >
              <X size={11} />
            </button>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold relative overflow-hidden"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} fill className="object-cover" sizes="48px" />
              ) : (
                store.name.charAt(0).toUpperCase()
              )}
            </div>
            <p className="text-[11px] text-center leading-tight line-clamp-2 w-full" style={{ color: colors.textPrimary }}>
              {store.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
