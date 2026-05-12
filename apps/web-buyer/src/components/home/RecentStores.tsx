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
      <p className="text-[10px] tracking-[0.18em] uppercase font-semibold mb-3 px-1" style={{ color: colors.textMuted }}>
        — Недавние магазины
      </p>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-1">
        {stores.map((store) => (
          // Link wraps the visual content; remove-button is a SIBLING (positioned
          // absolutely over the card) so we don't nest <button> inside <a>.
          <div key={store.slug} className="group relative flex-shrink-0 w-[84px]">
            <Link
              href={`/${store.slug}`}
              className="flex flex-col items-center gap-2 p-2 rounded-md transition-all hover:-translate-y-0.5"
            >
              <div
                className="w-14 h-14 rounded-md flex items-center justify-center text-lg font-bold relative overflow-hidden"
                style={{ background: colors.brandMuted, color: colors.brand }}
              >
                {store.logoUrl ? (
                  <Image src={store.logoUrl} alt={store.name} fill className="object-cover" sizes="56px" />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </div>
              <p className="text-[11px] text-center leading-tight line-clamp-2 w-full" style={{ color: colors.textStrong }}>
                {store.name}
              </p>
            </Link>
            <button
              type="button"
              onClick={(e) => handleRemove(e, store.slug)}
              aria-label="Забыть магазин"
              className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10"
              style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
