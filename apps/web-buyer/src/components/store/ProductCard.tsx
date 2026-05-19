"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ProductListItem } from "types";
import { ProductStatus } from "types";
import { ShoppingBag, Layers, Heart } from "lucide-react";
import { colors } from "@/lib/styles";
import { useAuth } from "@/lib/auth/context";
import { useToggleWishlist, useWishlistIds } from "@/hooks/use-wishlist";
import { useTranslation } from "@/lib/i18n";

type Props = {
  product: ProductListItem;
  storeSlug: string;
};

const MAX_DOTS = 5;

const fmt = (n: number | null | undefined) =>
  (typeof n === "number" && Number.isFinite(n) ? n : 0).toLocaleString("ru-RU");

export default function ProductCard({ product, storeSlug }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const wishlistIds = useWishlistIds();
  const toggleWishlist = useToggleWishlist();
  const [imageErrored, setImageErrored] = useState(false);
  const { t } = useTranslation();

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

  // ProductListItem декларирует оба поля (API-PRODUCT-LIST-IMAGES-CONTRACT-001,
  // закрыто Полатом 08.05.2026). Берём images когда есть — это canonical shape
  // на storefront feed; mediaUrls — fallback для callsite'ов, которые могут
  // строить ProductListItem из других источников (не storefront).
  const mediaUrls = (product.images?.length
    ? product.images.map((i) => i.url)
    : product.mediaUrls ?? []
  ).filter((u) => u.length > 0);
  const isUnavailable = product.status !== ProductStatus.ACTIVE || !product.isVisible;
  const displayType = product.displayType ?? 'SINGLE';

  // P3-004: товар на распродаже — salePrice/oldPrice/discountPercent от API.
  const onSale = product.isSale && typeof product.salePrice === "number";

  const useCollage = displayType === 'COLLAGE_2X2' && mediaUrls.length >= 2;
  const showSliderDots = displayType === 'SLIDER' && mediaUrls.length > 1;
  // Stale Supabase URLs (миграция R2/TG не покрыла старые записи) → 404 → onError
  // → показываем тот же placeholder, что и при пустых mediaUrls.
  const showPlaceholder = mediaUrls.length === 0 || (!useCollage && imageErrored);

  return (
    <Link href={`/${storeSlug}/products/${product.id}`} className="block group">
      <div className="overflow-hidden h-full flex flex-col transition-transform duration-150 group-hover:-translate-y-0.5 group-active:scale-[0.98]">
        {/* Image area */}
        <div
          className="aspect-square relative flex items-center justify-center select-none overflow-hidden rounded-md"
          style={{ background: colors.surfaceSunken }}
        >
          {showPlaceholder ? (
            <div className="flex flex-col items-center gap-1.5 px-3 text-center">
              <ShoppingBag size={26} style={{ color: colors.textMuted, opacity: 0.55 }} />
              <span className="text-[10px] font-medium tracking-wide uppercase" style={{ color: colors.textMuted, opacity: 0.7 }}>
                {t('store.noPhoto')}
              </span>
            </div>
          ) : useCollage ? (
            <CollageGrid urls={mediaUrls} alt={product.title} />
          ) : (
            <Image
              src={mediaUrls[0]}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
              onError={() => setImageErrored(true)}
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
                    background: i === 0 ? colors.brand : 'rgba(255,255,255,0.85)',
                    boxShadow: '0 0 4px rgba(0,0,0,0.20)',
                  }}
                />
              ))}
            </div>
          )}

          {/* Top-left badge stack: скидка → варианты */}
          <div className="absolute top-2 left-2 flex flex-col items-start gap-1" style={{ zIndex: 1 }}>
            {onSale && product.discountPercent != null && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: colors.danger, color: '#fff' }}
              >
                -{product.discountPercent}%
              </span>
            )}
            {product.variantCount > 0 && !isUnavailable && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: colors.brandTextOnBg,
                  color: colors.brand,
                  border: `1px solid ${colors.brandBorder}`,
                }}
              >
                <Layers size={10} />
                {product.variantCount}
              </div>
            )}
          </div>

          {/* Wishlist heart */}
          <button
            type="button"
            onClick={handleHeartClick}
            aria-label={inWishlist ? t('product.wishlistRemove') : t('product.wishlistAdd')}
            aria-pressed={inWishlist}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
            style={{
              background: 'rgba(255,255,255,0.85)',
              color: inWishlist ? colors.brand : colors.textBody,
              zIndex: 4,
              opacity: toggleWishlist.isPending ? 0.6 : 1,
            }}
          >
            <Heart
              size={16}
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
                style={{ background: colors.brandTextOnBg, color: colors.textBody, border: `1px solid ${colors.border}` }}
              >
                {t('store.outOfStock')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-2 flex flex-col gap-0.5 flex-1">
          <p className="text-[12px] md:text-[13px] leading-snug line-clamp-2" style={{ color: colors.textBody }}>
            {product.title}
          </p>
          <div className="text-[13px] font-bold mt-auto">
            {onSale ? (
              <span className="flex items-baseline gap-1.5 flex-wrap">
                <span style={{ color: colors.danger }}>
                  {fmt(product.salePrice)}{" "}
                  <span className="font-normal text-[11px]">сум</span>
                </span>
                <span className="font-normal text-[11px] line-through" style={{ color: colors.textMuted }}>
                  {fmt(product.oldPrice ?? product.basePrice)}
                </span>
              </span>
            ) : (
              <span style={{ color: colors.textStrong }}>
                {fmt(product.basePrice)}{" "}
                <span className="font-normal text-[11px]" style={{ color: colors.textMuted }}>сум</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Collage 2×2 ────────────────────────────────────────────────────────────

function CollageGrid({ urls, alt }: { urls: string[]; alt: string }) {
  const cells = [0, 1, 2, 3].map((i) => urls[i] ?? null);
  const [brokenCells, setBrokenCells] = useState<Set<number>>(new Set());
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-px">
      {cells.map((url, i) => (
        <div key={i} className="relative overflow-hidden" style={{ background: colors.surfaceSunken }}>
          {url && !brokenCells.has(i) ? (
            <Image
              src={url}
              alt={`${alt} — ${t('product.showPhoto', { n: i + 1 })}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 25vw, 110px"
              onError={() =>
                setBrokenCells((prev) => {
                  const next = new Set(prev);
                  next.add(i);
                  return next;
                })
              }
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag size={14} style={{ color: colors.textMuted }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
