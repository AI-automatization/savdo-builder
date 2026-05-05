"use client";

import Link from "next/link";
import Image from "next/image";
import type { WishlistItem } from "types";
import { Heart, ShoppingBag, X } from "lucide-react";
import Header from "@/components/layout/Header";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { useAuth } from "@/lib/auth/context";
import { useWishlist, useToggleWishlist } from "@/hooks/use-wishlist";
import { colors } from "@/lib/styles";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: colors.textPrimary }}>
          Избранное
        </h1>
        {isAuthenticated ? <WishlistContent /> : (
          <OtpGate
            icon={<Heart size={22} />}
            title="Войдите чтобы видеть избранное"
            subtitle="Подтвердите номер телефона — после этого сможете сохранять товары и видеть их здесь."
          />
        )}
      </div>
      <BottomNavBar active="wishlist" />
    </div>
  );
}

function WishlistContent() {
  const { data, isLoading, isError } = useWishlist();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="rounded-2xl p-5 text-sm"
        style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.30)', color: colors.danger }}
      >
        Не удалось загрузить избранное. Попробуйте обновить страницу.
      </div>
    );
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center flex flex-col items-center gap-3"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: colors.accentMuted, color: colors.accent }}
        >
          <Heart size={24} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold" style={{ color: colors.textPrimary }}>Здесь пусто</p>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            Нажимайте на сердечко на карточке товара — товар появится здесь.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          К магазинам
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => <WishlistCard key={item.id} item={item} />)}
    </div>
  );
}

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
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-[0.98]"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div
          className="aspect-square relative flex items-center justify-center select-none overflow-hidden"
          style={{ background: colors.surfaceMuted }}
        >
          {cover ? (
            <Image
              src={cover}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            />
          ) : (
            <ShoppingBag size={32} style={{ color: colors.textDim }} />
          )}

          {!product.isAvailable && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.78)', zIndex: 3 }}
            >
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
              >
                Нет в наличии
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRemove}
            aria-label="Убрать из избранного"
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              zIndex: 4,
              opacity: toggleWishlist.isPending ? 0.6 : 1,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <p className="text-[11px] uppercase tracking-wider truncate" style={{ color: colors.textDim }}>
            {product.storeName}
          </p>
          <p className="text-sm font-medium leading-snug line-clamp-2" style={{ color: colors.textPrimary }}>
            {product.title}
          </p>
          <div className="mt-auto">
            <span className="text-base font-bold" style={{ color: colors.accent }}>
              {Number(product.basePrice).toLocaleString("ru-RU")}
            </span>
            <span className="text-xs ml-1" style={{ color: colors.textMuted }}>сум</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="aspect-square animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3 w-2/3 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
        <div className="h-3 w-1/2 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      </div>
    </div>
  );
}
