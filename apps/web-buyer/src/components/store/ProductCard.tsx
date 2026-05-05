"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductListItem } from "types";
import { ProductStatus } from "types";
import { ShoppingBag, Layers, Heart } from "lucide-react";
import { colors } from "@/lib/styles";
import { useAuth } from "@/lib/auth/context";
import { useToggleWishlist, useWishlistIds } from "@/hooks/use-wishlist";

type Props = {
  product: ProductListItem;
  storeSlug: string;
};

const MAX_DOTS = 5;

export default function ProductCard({ product, storeSlug }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const wishlistIds = useWishlistIds();
  const toggleWishlist = useToggleWishlist();

  // Server-sent flag (auth'd storefront feed) wins; client cache is the fallback
  // for cards rendered from a non-feed source (cart, recent stores, etc).
  const inWishlist = product.inWishlist ?? wishlistIds.has(product.id);

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/wishlist');
      return;
    }
    if (toggleWishlist.isPending) return;
    toggleWishlist.mutate({ productId: product.id, inWishlist });
  }

  const mediaUrls =
    (product as unknown as { images?: Array<{ url: string }> }).images?.map((i) => i.url)
    ?? product.mediaUrls
    ?? [];
  const isUnavailable = product.status !== ProductStatus.ACTIVE || !product.isVisible;
  const displayType = product.displayType ?? 'SINGLE';

  const useCollage = displayType === 'COLLAGE_2X2' && mediaUrls.length >= 2;
  const showSliderDots = displayType === 'SLIDER' && mediaUrls.length > 1;

  return (
    <Link href={`/${storeSlug}/products/${product.id}`} className="block group">
      <div
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md group-active:scale-[0.98]"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
        }}
      >
        {/* Image area */}
        <div
          className="aspect-square relative flex items-center justify-center select-none overflow-hidden"
          style={{ background: colors.surfaceMuted }}
        >
          {mediaUrls.length === 0 ? (
            <ShoppingBag size={32} style={{ color: colors.textDim }} />
          ) : useCollage ? (
            <CollageGrid urls={mediaUrls} alt={product.title} />
          ) : (
            <Image
              src={mediaUrls[0]}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            />
          )}

          {/* Slider dots — decorative */}
          {showSliderDots && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1"
              style={{ zIndex: 2 }}
            >
              {Array.from({ length: Math.min(mediaUrls.length, MAX_DOTS) }).map((_, i) => (
                <span
                  key={i}
                  className="rounded-full"
                  style={{
                    width: i === 0 ? 10 : 5,
                    height: 5,
                    background: i === 0 ? colors.accent : 'rgba(255,255,255,0.85)',
                    boxShadow: '0 0 4px rgba(0,0,0,0.20)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Variants badge */}
          {product.variantCount > 0 && !isUnavailable && (
            <div
              className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: colors.surface,
                color: colors.accent,
                border: `1px solid ${colors.accentBorder}`,
                zIndex: 1,
              }}
            >
              <Layers size={10} />
              {product.variantCount}
            </div>
          )}

          {/* Wishlist heart */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={inWishlist ? "Убрать из избранного" : "В избранное"}
            aria-pressed={inWishlist}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              color: inWishlist ? colors.accent : colors.textMuted,
              zIndex: 4,
              opacity: toggleWishlist.isPending ? 0.6 : 1,
            }}
          >
            <Heart
              size={15}
              fill={inWishlist ? "currentColor" : "none"}
              strokeWidth={inWishlist ? 0 : 1.75}
            />
          </button>

          {/* Out of stock overlay */}
          {isUnavailable && (
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
        </div>

        {/* Info */}
        <div className="p-3 flex flex-col gap-1.5 flex-1">
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

// ── Collage 2×2 ────────────────────────────────────────────────────────────

function CollageGrid({ urls, alt }: { urls: string[]; alt: string }) {
  const cells = [0, 1, 2, 3].map((i) => urls[i] ?? null);

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px">
      {cells.map((url, i) => (
        <div key={i} className="relative overflow-hidden" style={{ background: colors.surfaceSunken }}>
          {url ? (
            <Image
              src={url}
              alt={`${alt} — фото ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 25vw, 110px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag size={14} style={{ color: colors.textDim }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
