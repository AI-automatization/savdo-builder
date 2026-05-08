"use client";

import Link from "next/link";
import Image from "next/image";
import type { WishlistItem } from "types";
import { Heart, ShoppingBag } from "lucide-react";
import Header from "@/components/layout/Header";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { useAuth } from "@/lib/auth/context";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { colors } from "@/lib/styles";

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      <Header />

      <div className="max-w-7xl mx-auto pb-28 md:pb-12">
        {isAuthenticated ? <WishlistContent /> : (
          <div className="px-4 pt-6">
            <OtpGate
              icon={<Heart size={22} />}
              title="Войдите чтобы видеть избранное"
              subtitle="Подтвердите номер телефона — после этого сможете сохранять товары и видеть их здесь."
            />
          </div>
        )}
      </div>

      <BottomNavBar active="wishlist" />
    </div>
  );
}

// ── Content ──────────────────────────────────────────────────────────────────

function WishlistContent() {
  const { data, isLoading, isError } = useWishlist();
  const items = data ?? [];

  return (
    <>
      {/* Sub-header — editorial */}
      <div className="px-4 md:px-6 pt-5 pb-3 flex items-baseline justify-between">
        <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
          — Избранное{items.length > 0 ? ` · ${items.length}` : ""}
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-6">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {isError && (
        <div className="px-4 md:px-6">
          <p className="text-sm py-8 text-center" style={{ color: colors.danger }}>
            Не удалось загрузить избранное. Попробуйте обновить страницу.
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
            — Пока пусто
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: colors.textStrong }}>
            Избранное пустое
          </h2>
          <p className="text-sm mb-6 max-w-sm" style={{ color: colors.textMuted }}>
            Нажимайте на сердечко на карточке товара — товар появится здесь.
          </p>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-bold rounded-md"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            К магазинам
          </Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-6">
          {items.map((item) => <WishlistCard key={item.id} item={item} />)}
        </div>
      )}
    </>
  );
}

// ── WishlistCard ─────────────────────────────────────────────────────────────

function WishlistCard({ item }: { item: WishlistItem }) {
  const { product } = item;
  const toggleWishlist = useToggleWishlist();
  const href = `/${product.storeSlug}/products/${product.id}`;
  const cover = product.mediaUrls?.[0];

  function handleRemove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (toggleWishlist.isPending) return;
    toggleWishlist.mutate({ productId: product.id, inWishlist: true });
  }

  return (
    <Link href={href} className="block group">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden rounded-md mb-2"
        style={{ background: colors.surfaceSunken }}
      >
        {cover ? (
          <Image
            src={cover}
            alt={product.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} style={{ color: colors.textDim }} />
          </div>
        )}

        {/* Heart overlay — filled brand, click removes */}
        <button
          type="button"
          onClick={handleRemove}
          disabled={toggleWishlist.isPending}
          aria-label="Убрать из избранного"
          className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90"
          style={{
            background: "rgba(255,255,255,0.85)",
            opacity: toggleWishlist.isPending ? 0.6 : 1,
          }}
        >
          <Heart size={14} fill={colors.brand} stroke={colors.brand} />
        </button>

        {/* OOS overlay */}
        {!product.isAvailable && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.78)" }}
          >
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
            >
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      {/* Store eyebrow */}
      <p className="text-[10px] tracking-[0.1em] uppercase truncate mb-0.5" style={{ color: colors.textMuted }}>
        {product.storeName}
      </p>

      {/* Title */}
      <p className="text-[12px] md:text-[13px] leading-snug line-clamp-2" style={{ color: colors.textBody }}>
        {product.title}
      </p>

      {/* Price */}
      <div className="text-[13px] font-bold mt-0.5" style={{ color: colors.textStrong }}>
        {Number(product.basePrice).toLocaleString("ru-RU")}
        <span className="text-[11px] font-normal ml-1" style={{ color: colors.textMuted }}>сум</span>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div>
      <div className="aspect-square rounded-md animate-pulse mb-2" style={{ background: colors.surfaceMuted }} />
      <div className="h-2.5 w-1/2 rounded-full animate-pulse mb-1.5" style={{ background: colors.surfaceMuted }} />
      <div className="h-3 w-3/4 rounded-full animate-pulse mb-1" style={{ background: colors.surfaceMuted }} />
      <div className="h-3 w-1/3 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
    </div>
  );
}
