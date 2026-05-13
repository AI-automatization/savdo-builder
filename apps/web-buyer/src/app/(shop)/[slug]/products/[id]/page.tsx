"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useProduct, useStoreWithTrust } from "@/hooks/use-storefront";
import { useAddToCart } from "@/hooks/use-cart";
import { ProductStatus, ThreadType } from "types";
import { track } from "@/lib/analytics";
import { ArrowLeft, Search, ShoppingBag, Share2, Check, MessageSquare, Heart, Minus, Plus } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
import { ProductReviews } from "@/components/store/ProductReviews";
import { SellerCard } from "@/components/store/SellerCard";
import { colors } from "@/lib/styles";
import { useAuth } from "@/lib/auth/context";
import { useToggleWishlist, useWishlistIds } from "@/hooks/use-wishlist";
import { Tooltip } from "@/components/tooltip";
import {
  findVariantBySelection,
  initialSelectionFromVariants,
  isSelectionComplete,
  isValueAvailable,
  type OptionSelection,
} from "@/lib/variants";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'savdo_builderBOT';

const fmt = (n: unknown) => {
  const num = typeof n === "number" ? n : Number(n);
  return (Number.isFinite(num) ? num : 0).toLocaleString("ru-RU");
};

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ background: colors.surfaceMuted }}
    />
  );
}

// ── Qty Stepper ───────────────────────────────────────────────────────────────
function QtyStepper({ qty, onDec, onInc }: { qty: number; onDec: () => void; onInc: () => void }) {
  return (
    <div
      className="flex items-center rounded"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <button
        onClick={onDec}
        className="flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ padding: "6px 12px", color: colors.textBody }}
        aria-label="Уменьшить количество"
      >
        <Minus size={14} />
      </button>
      <span
        className="text-sm font-semibold select-none"
        style={{ minWidth: 24, textAlign: "center", color: colors.textStrong }}
      >
        {qty}
      </span>
      <button
        onClick={onInc}
        className="flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ padding: "6px 12px", color: colors.textBody }}
        aria-label="Увеличить количество"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const { data: product, isLoading, isError } = useProduct(id);
  const storeFull = useStoreWithTrust(slug);
  const addToCart = useAddToCart();
  const { isAuthenticated } = useAuth();
  const wishlistIds = useWishlistIds();
  const toggleWishlist = useToggleWishlist();
  const inWishlist = product
    ? ((product as { inWishlist?: boolean }).inWishlist ?? wishlistIds.has(product.id))
    : false;

  function handleWishlistToggle() {
    if (!product) return;
    if (!isAuthenticated) {
      router.push('/wishlist');
      return;
    }
    if (toggleWishlist.isPending) return;
    toggleWishlist.mutate({ productId: product.id, inWishlist });
  }

  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selection, setSelection] = useState<OptionSelection>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  function handleShare() {
    const url = `https://t.me/${BOT_USERNAME}?startapp=product_${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }).catch(() => {
      // Clipboard API may reject on HTTP / Telegram WebView with no permission.
      // Silent best-effort — sharing is a nice-to-have, not a critical path.
    });
  }

  const activeVariants = product?.variants.filter(v => v.isActive) ?? [];
  const optionGroups = product?.optionGroups ?? [];
  const hasGroups = optionGroups.length > 0;
  const productAttributes = product?.attributes ?? [];

  const selectedVariantObj = hasGroups
    ? findVariantBySelection(activeVariants, selection, optionGroups)
    : activeVariants.find(v => v.id === selectedVariantId) ?? null;

  const displayPrice = selectedVariantObj?.priceOverride ?? product?.basePrice ?? 0;
  const totalPrice = displayPrice * qty;
  const isUnavailable = !product || product.status !== ProductStatus.ACTIVE || !product.isVisible;
  const requiresVariantSelection = hasGroups
    ? (optionGroups.length > 0 && !isSelectionComplete(selection, optionGroups))
    : (activeVariants.length > 0 && !selectedVariantId);
  const isOutOfStock = selectedVariantObj
    ? selectedVariantObj.stockQuantity === 0
    : (activeVariants.length > 0 && activeVariants.every(v => v.stockQuantity === 0));

  // Stock quantity for display
  const stockQty = selectedVariantObj?.stockQuantity
    ?? (activeVariants.length > 0 ? activeVariants.reduce((s, v) => s + v.stockQuantity, 0) : null);

  const images = product?.mediaUrls ?? [];
  const notFound = !isLoading && (isError || !product);

  // Store info
  const storeId = product?.storeId ?? '';
  const storeName = product?.store?.name ?? '';
  const storeSlug = product?.store?.slug ?? slug;
  const storeCity = product?.store?.city ?? '';

  useEffect(() => {
    if (product) track.productViewed(product.storeId, product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset & re-initialize variant selection on product change. Triggering only on
  // product.id (not optionGroups/activeVariants) is intentional — those derive from
  // product itself, so we always read the freshest value via the closure that fires
  // for THIS render of THIS product. Back/forward cache used to leave stale selection
  // because we read snapshot inputs without resetting first.
  useEffect(() => {
    if (!product) return;
    if (hasGroups) {
      setSelection(initialSelectionFromVariants(activeVariants, optionGroups));
      setSelectedVariantId(null);
    } else if (activeVariants.length > 0) {
      const firstInStock = activeVariants.find((v) => v.stockQuantity > 0);
      setSelectedVariantId(firstInStock?.id ?? null);
      setSelection({});
    } else {
      setSelection({});
      setSelectedVariantId(null);
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFlatVariantSelect(variantId: string) {
    setSelectedVariantId(variantId);
    if (product) track.variantSelected(product.storeId, product.id, variantId);
  }

  function handleOptionSelect(groupId: string, valueId: string) {
    const next = { ...selection, [groupId]: valueId };
    setSelection(next);
    const matched = findVariantBySelection(activeVariants, next, optionGroups);
    if (matched && product) track.variantSelected(product.storeId, product.id, matched.id);
  }

  async function handleAddToCart() {
    if (!product) return;
    const variantId = selectedVariantObj?.id ?? null;
    await addToCart.mutateAsync({
      productId: product.id,
      variantId: variantId ?? undefined,
      quantity: qty,
    });
    track.addToCart(product.storeId, product.id, variantId, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const isCtaDisabled = isLoading || isUnavailable || isOutOfStock || requiresVariantSelection || addToCart.isPending;

  // ── Primary CTA label ────────────────────────────────────────────────────────
  function ctaLabel() {
    if (isLoading) return "Загрузка...";
    if (isOutOfStock) return "Нет в наличии";
    if (requiresVariantSelection) return "Выберите вариант";
    if (added) return "Добавлено ✓";
    return `В корзину · ${fmt(totalPrice)} сум`;
  }

  // ── Variant: detect if a group is color-like ──────────────────────────────────
  function isColorGroup(groupName: string) {
    const n = groupName.toLowerCase();
    return n.includes("цвет") || n.includes("color") || n.includes("colour");
  }

  // ── Helper: is the value a CSS-parseable color ──────────────────────────────
  function looksLikeColor(value: string) {
    return /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) || /^(rgb|hsl|oklch)/i.test(value.trim());
  }

  return (
    <div className="relative" style={{ background: colors.bg, minHeight: '100vh' }}>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Tooltip label="Назад">
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push(`/${slug}`)}
              className="w-9 h-9 flex items-center justify-center rounded transition-colors"
              style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textBody }}
              aria-label="Назад"
            >
              <ArrowLeft size={18} />
            </button>
          </Tooltip>

          {/* Store name — center */}
          {product && !notFound && (
            <Link
              href={`/${storeSlug}`}
              className="flex-1 text-sm font-semibold truncate text-center"
              style={{ color: colors.textStrong }}
            >
              {storeName}
            </Link>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 ml-auto">
            {!notFound && product && (
              <Tooltip label={inWishlist ? 'Убрать из избранного' : 'В избранное'}>
                <button
                  onClick={handleWishlistToggle}
                  aria-label={inWishlist ? 'Убрать из избранного' : 'В избранное'}
                  aria-pressed={inWishlist}
                  className="w-9 h-9 flex items-center justify-center rounded transition-colors"
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: inWishlist ? colors.brand : colors.textMuted,
                    opacity: toggleWishlist.isPending ? 0.6 : 1,
                  }}
                >
                  <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={inWishlist ? 0 : 1.75} />
                </button>
              </Tooltip>
            )}
            {!notFound && (
              <Tooltip label={shared ? 'Ссылка скопирована' : 'Поделиться в Telegram'}>
                <button
                  onClick={handleShare}
                  aria-label="Поделиться в Telegram"
                  className="w-9 h-9 flex items-center justify-center rounded transition-colors"
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: shared ? colors.success : colors.textMuted,
                  }}
                >
                  {shared ? <Check size={18} /> : <Share2 size={18} />}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      {/* ── Not found ─────────────────────────────────────────────────────────── */}
      {notFound ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center py-20">
          <Search size={48} style={{ color: colors.textDim }} className="mb-4 mx-auto" />
          <p className="text-base font-semibold" style={{ color: colors.textStrong }}>Товар не найден</p>
          <p className="text-sm mt-2 mb-5" style={{ color: colors.textMuted }}>
            Возможно, продавец его удалил или скрыл
          </p>
          <button
            onClick={() => router.push(`/${slug}`)}
            className="inline-block px-5 py-2.5 rounded text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: colors.brandMuted, color: colors.brand, border: `1px solid ${colors.brandBorder}` }}
          >
            К магазину
          </button>
        </div>
      ) : (
        <>
          {/* ── Desktop split + Mobile vertical ─────────────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-6 md:gap-8 p-0 md:p-4 md:pt-2">

              {/* ── LEFT: Gallery ───────────────────────────────────────────── */}
              <div>
                {/* Main image */}
                <div
                  className="relative aspect-square overflow-hidden"
                  style={{
                    borderRadius: 8,
                    background: colors.surfaceSunken,
                  }}
                >
                  {isLoading ? (
                    <Skeleton className="absolute inset-0 rounded" />
                  ) : images.length > 0 ? (
                    <Image
                      src={images[activeImage]}
                      alt={product?.title ?? ""}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 58vw"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag size={96} style={{ color: colors.textDim }} />
                    </div>
                  )}

                  {/* Mobile: image counter pill */}
                  {images.length > 1 && (
                    <div
                      className="md:hidden absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1 }}
                    >
                      {activeImage + 1}/{images.length}
                    </div>
                  )}

                  {/* Mobile: dots pagination */}
                  {images.length > 1 && (
                    <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 1 }}>
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImage(i)}
                          className="rounded-full transition-all"
                          style={{
                            width: i === activeImage ? 16 : 8,
                            height: 8,
                            background: i === activeImage ? colors.brand : 'rgba(255,255,255,0.75)',
                            boxShadow: '0 0 4px rgba(0,0,0,0.20)',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop: 4-thumb row */}
                {images.length > 1 && (
                  <div className="hidden md:grid grid-cols-4 gap-2 mt-2.5">
                    {images.slice(0, 4).map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className="relative aspect-square overflow-hidden rounded transition-all"
                        style={{
                          background: colors.surfaceSunken,
                          outline: i === activeImage ? `2px solid ${colors.textStrong}` : 'none',
                          outlineOffset: '-1px',
                          opacity: i === activeImage ? 1 : 0.65,
                        }}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="15vw" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Mobile: scrollable thumb row (hidden on desktop, replaced by grid above) */}
                {images.length > 1 && (
                  <div className="md:hidden flex gap-2 mt-2 overflow-x-auto scrollbar-none pb-1">
                    {images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className="w-16 h-16 rounded overflow-hidden relative flex-shrink-0 transition-all"
                        style={{
                          background: colors.surfaceSunken,
                          outline: i === activeImage ? `2px solid ${colors.textStrong}` : 'none',
                          outlineOffset: '-1px',
                          opacity: i === activeImage ? 1 : 0.65,
                        }}
                      >
                        <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── RIGHT: Info column ──────────────────────────────────────── */}
              <div className="md:sticky md:top-20 md:self-start flex flex-col gap-5">

                {/* Editorial label + title + price + stock */}
                {isLoading ? (
                  <>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-3/4 mt-1" />
                    <Skeleton className="h-7 w-32 mt-2" />
                  </>
                ) : (
                  <div>
                    {/* Editorial category label */}
                    <div
                      className="text-[10px] tracking-[0.18em] uppercase mb-2"
                      style={{ color: colors.textMuted }}
                    >
                      — {product?.globalCategory?.nameRu ?? 'Товар'}
                    </div>

                    {/* Title */}
                    <h1
                      className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-3"
                      style={{ color: colors.textStrong }}
                    >
                      {product?.title}
                    </h1>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-xl md:text-2xl font-bold" style={{ color: colors.textStrong }}>
                        {fmt(displayPrice)}
                      </span>
                      <span className="text-sm" style={{ color: colors.textMuted }}>сум</span>
                    </div>

                    {/* Stock */}
                    {stockQty !== null && (
                      <div className="text-xs" style={{ color: isOutOfStock ? colors.danger : colors.textMuted }}>
                        {isOutOfStock
                          ? 'Нет в наличии'
                          : `В наличии · ${stockQty} шт`}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Seller card (NEW position, выше variants — chat-first conversion) */}
                {!isLoading && product && (
                  <SellerCard
                    slug={product.store.slug}
                    name={product.store.name}
                    city={product.store.city}
                    logoUrl={product.store.logoUrl ?? storeFull.data?.logoUrl ?? null}
                    isVerified={storeFull.data?.isVerified ?? false}
                    avgRating={storeFull.data?.avgRating ?? null}
                    reviewCount={storeFull.data?.reviewCount ?? 0}
                  />
                )}

                {/* ── Variant pickers ─────────────────────────────────────── */}
                {!isLoading && hasGroups && (
                  <div className="flex flex-col gap-4">
                    {optionGroups.map((g) => {
                      const selectedVal = g.values.find(v => v.id === selection[g.id]);
                      const isColor = isColorGroup(g.name);
                      return (
                        <div key={g.id}>
                          {/* Label: "Цвет: Синий" */}
                          <div className="text-xs mb-2.5">
                            <span style={{ color: colors.textMuted }}>{g.name}:</span>{' '}
                            {selectedVal && (
                              <strong style={{ color: colors.textStrong }}>{selectedVal.value}</strong>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {g.values.map((val) => {
                              const isSelected = selection[g.id] === val.id;
                              const available = isValueAvailable(val.id, g.id, activeVariants, selection, optionGroups);

                              if (isColor && looksLikeColor(val.code ?? val.value)) {
                                // Color circle
                                return (
                                  <button
                                    key={val.id}
                                    onClick={() => available && handleOptionSelect(g.id, val.id)}
                                    disabled={!available}
                                    title={val.value}
                                    className="rounded-full transition-all"
                                    style={{
                                      width: 36,
                                      height: 36,
                                      background: val.code ?? val.value,
                                      outline: isSelected ? `2px solid ${colors.textStrong}` : '2px solid transparent',
                                      outlineOffset: isSelected ? '-4px' : '0',
                                      opacity: available ? 1 : 0.35,
                                      cursor: available ? 'pointer' : 'not-allowed',
                                      boxShadow: isSelected ? `0 0 0 4px ${colors.bg}` : 'none',
                                    }}
                                  />
                                );
                              }

                              // Size / generic pill
                              return (
                                <button
                                  key={val.id}
                                  onClick={() => available && handleOptionSelect(g.id, val.id)}
                                  disabled={!available}
                                  className="text-xs font-semibold transition-all rounded"
                                  style={
                                    !available
                                      ? {
                                          padding: '8px 14px',
                                          background: colors.surfaceMuted,
                                          color: colors.textDim,
                                          textDecoration: 'line-through',
                                          border: `1px solid ${colors.border}`,
                                          cursor: 'not-allowed',
                                        }
                                      : isSelected
                                        ? {
                                            padding: '8px 14px',
                                            background: colors.textStrong,
                                            color: colors.brandTextOnBg,
                                            fontWeight: 700,
                                            border: `1px solid ${colors.textStrong}`,
                                          }
                                        : {
                                            padding: '8px 14px',
                                            background: colors.surface,
                                            color: colors.textMuted,
                                            border: `1px solid ${colors.border}`,
                                          }
                                  }
                                >
                                  {val.value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {selectedVariantObj && isOutOfStock && (
                      <p className="text-xs" style={{ color: colors.warning }}>
                        Эта комбинация временно недоступна
                      </p>
                    )}
                  </div>
                )}

                {/* Flat variants fallback */}
                {!isLoading && !hasGroups && activeVariants.length > 0 && (
                  <div>
                    <div className="text-xs mb-2.5">
                      <span style={{ color: colors.textMuted }}>Вариант:</span>{' '}
                      {selectedVariantId && (
                        <strong style={{ color: colors.textStrong }}>
                          {activeVariants.find(v => v.id === selectedVariantId)?.titleOverride
                            ?? activeVariants.find(v => v.id === selectedVariantId)?.sku}
                        </strong>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => handleFlatVariantSelect(v.id)}
                          disabled={v.stockQuantity === 0}
                          className="text-xs font-semibold transition-all rounded"
                          style={
                            v.stockQuantity === 0
                              ? {
                                  padding: '8px 14px',
                                  background: colors.surfaceMuted,
                                  color: colors.textDim,
                                  textDecoration: 'line-through',
                                  border: `1px solid ${colors.border}`,
                                  cursor: 'not-allowed',
                                }
                              : selectedVariantId === v.id
                                ? {
                                    padding: '8px 14px',
                                    background: colors.textStrong,
                                    color: colors.brandTextOnBg,
                                    fontWeight: 700,
                                    border: `1px solid ${colors.textStrong}`,
                                  }
                                : {
                                    padding: '8px 14px',
                                    background: colors.surface,
                                    color: colors.textMuted,
                                    border: `1px solid ${colors.border}`,
                                  }
                          }
                        >
                          {v.titleOverride ?? v.sku}
                          {v.priceOverride && (
                            <span className="ml-1.5 opacity-70">{fmt(v.priceOverride)} сум</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}


                {/* ── Desktop CTAs (qty + В корзину + Обсудить) ─────────── */}
                {!isLoading && (
                  <div className="hidden md:flex flex-col gap-3">
                    <div className="flex gap-2 items-center">
                      <QtyStepper
                        qty={qty}
                        onDec={() => setQty(q => Math.max(1, q - 1))}
                        onInc={() => setQty(q => q + 1)}
                      />
                      <button
                        onClick={handleAddToCart}
                        disabled={isCtaDisabled}
                        className="flex-1 text-sm font-bold transition-all active:scale-[0.98]"
                        style={{
                          padding: '12px 14px',
                          borderRadius: 6,
                          background: isCtaDisabled ? colors.surfaceMuted : colors.brand,
                          color: isCtaDisabled ? colors.textDim : colors.brandTextOnBg,
                          border: isCtaDisabled ? `1px solid ${colors.border}` : 'none',
                          cursor: isCtaDisabled ? 'not-allowed' : 'pointer',
                          opacity: isCtaDisabled && !isLoading ? 0.5 : 1,
                        }}
                      >
                        {ctaLabel()}
                      </button>
                      <button
                        onClick={() => {
                          if (!product) return;
                          track.chatStarted(product.storeId, "product");
                          setChatOpen(true);
                        }}
                        aria-label="Обсудить с продавцом"
                        className="text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:scale-[0.98]"
                        style={{
                          padding: '12px 16px',
                          borderRadius: 6,
                          background: colors.accent,
                          color: colors.accentTextOnBg,
                          flexShrink: 0,
                        }}
                      >
                        <MessageSquare size={16} />
                        Обсудить
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── Full-width below: description + attributes ─────────────────────── */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 mt-6 md:mt-8">

            {/* Description */}
            {!isLoading && product?.description && (
              <section className="mb-8">
                <div
                  className="text-[10px] tracking-[0.18em] uppercase mb-3"
                  style={{ color: colors.textMuted }}
                >
                  — Описание
                </div>
                <p
                  className="text-sm max-w-[680px]"
                  style={{ lineHeight: 1.6, color: colors.textBody }}
                >
                  {product.description}
                </p>
              </section>
            )}

            {/* Attributes */}
            {!isLoading && productAttributes.length > 0 && (
              <section className="mb-8">
                <div
                  className="text-[10px] tracking-[0.18em] uppercase mb-3"
                  style={{ color: colors.textMuted }}
                >
                  — Характеристики
                </div>
                <div
                  className="rounded-md p-4 max-w-[680px]"
                  style={{ background: colors.surface }}
                >
                  <div className="flex flex-col gap-2">
                    {productAttributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between gap-4 text-sm">
                        <span style={{ color: colors.textMuted }}>{attr.name}</span>
                        <span className="text-right font-medium" style={{ color: colors.textStrong }}>
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Reviews */}
            {!isLoading && product && <ProductReviews productId={product.id} />}

            {/* Related products placeholder — fetching out of scope; editorial section kept */}
            {!isLoading && product && (
              <section className="mt-2 mb-10">
                <div className="flex justify-between items-baseline mb-4">
                  <div
                    className="text-[10px] tracking-[0.18em] uppercase"
                    style={{ color: colors.textMuted }}
                  >
                    — Из этого магазина
                  </div>
                  <Link
                    href={`/${storeSlug}`}
                    className="text-xs font-semibold"
                    style={{ color: colors.brand }}
                  >
                    Все →
                  </Link>
                </div>
                {/* Related products grid — populated when fetched upstream; currently empty placeholder */}
              </section>
            )}
          </div>

          {/* ── Mobile sticky bottom CTA ──────────────────────────────────────── */}
          {!notFound && !isLoading && (
            <div
              className="md:hidden sticky bottom-0 z-30 flex gap-2.5 p-3 border-t"
              style={{ background: colors.surfaceMuted, borderColor: colors.divider }}
            >
              <QtyStepper
                qty={qty}
                onDec={() => setQty(q => Math.max(1, q - 1))}
                onInc={() => setQty(q => q + 1)}
              />
              <button
                onClick={handleAddToCart}
                disabled={isCtaDisabled}
                className="flex-1 text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  padding: '12px 14px',
                  borderRadius: 4,
                  background: isCtaDisabled ? colors.surfaceMuted : colors.brand,
                  color: isCtaDisabled ? colors.textDim : colors.brandTextOnBg,
                  border: isCtaDisabled ? `1px solid ${colors.border}` : 'none',
                  cursor: isCtaDisabled ? 'not-allowed' : 'pointer',
                  opacity: isCtaDisabled ? 0.5 : 1,
                }}
              >
                {ctaLabel()}
              </button>
            </div>
          )}
        </>
      )}

      {chatOpen && product && (
        <ChatComposerModal
          contextType={ThreadType.PRODUCT}
          contextId={product.id}
          title={product.title}
          onClose={() => setChatOpen(false)}
        />
      )}

      <BottomNavBar active="store" storeSlug={slug} />
    </div>
  );
}
