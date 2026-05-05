"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useProduct } from "@/hooks/use-storefront";
import { useAddToCart } from "@/hooks/use-cart";
import { ProductStatus, ThreadType } from "types";
import { track } from "@/lib/analytics";
import { ArrowLeft, Search, ShoppingBag, Share2, Check, MessageSquare, Send, Heart } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
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

type ProductAttribute = { id: string; name: string; value: string; sortOrder: number };

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: colors.surfaceMuted }}
    />
  );
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;

  const { data: product, isLoading, isError } = useProduct(id);
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
  const [added, setAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  function handleShare() {
    const url = `https://t.me/${BOT_USERNAME}?startapp=product_${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    });
  }

  const activeVariants = product?.variants.filter(v => v.isActive) ?? [];
  const optionGroups = product?.optionGroups ?? [];
  const hasGroups = optionGroups.length > 0;
  const productAttributes =
    ((product as unknown as { attributes?: ProductAttribute[] } | undefined)?.attributes ?? []);

  const selectedVariantObj = hasGroups
    ? findVariantBySelection(activeVariants, selection, optionGroups)
    : activeVariants.find(v => v.id === selectedVariantId) ?? null;

  const displayPrice = selectedVariantObj?.priceOverride ?? product?.basePrice ?? 0;
  const isUnavailable = !product || product.status !== ProductStatus.ACTIVE || !product.isVisible;
  const requiresVariantSelection = hasGroups
    ? (optionGroups.length > 0 && !isSelectionComplete(selection, optionGroups))
    : (activeVariants.length > 0 && !selectedVariantId);
  const isOutOfStock = selectedVariantObj
    ? selectedVariantObj.stockQuantity === 0
    : (activeVariants.length > 0 && activeVariants.every(v => v.stockQuantity === 0));

  const images = product?.mediaUrls ?? [];
  const notFound = !isLoading && (isError || !product);

  useEffect(() => {
    if (product) track.productViewed(product.storeId, product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!product) return;
    if (hasGroups) {
      if (Object.keys(selection).length === 0) {
        setSelection(initialSelectionFromVariants(activeVariants, optionGroups));
      }
    } else if (!selectedVariantId && activeVariants.length > 0) {
      const firstInStock = activeVariants.find((v) => v.stockQuantity > 0);
      if (firstInStock) setSelectedVariantId(firstInStock.id);
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
      quantity: 1,
    });
    track.addToCart(product.storeId, product.id, variantId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="relative pb-40 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-4">
          <Tooltip label="Назад">
            <button
              onClick={() => window.history.length > 1 ? router.back() : router.push(`/${slug}`)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
              aria-label="Назад"
            >
              <ArrowLeft size={18} />
            </button>
          </Tooltip>
          {!notFound && product && (
            <Tooltip label={inWishlist ? 'Убрать из избранного' : 'В избранное'} className="ml-auto">
              <button
                onClick={handleWishlistToggle}
                aria-label={inWishlist ? 'Убрать из избранного' : 'В избранное'}
                aria-pressed={inWishlist}
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
                style={{
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  color: inWishlist ? colors.accent : colors.textMuted,
                  opacity: toggleWishlist.isPending ? 0.6 : 1,
                }}
              >
                <Heart size={18} fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={inWishlist ? 0 : 1.75} />
              </button>
            </Tooltip>
          )}
          {!notFound && (
            <Tooltip label={shared ? 'Ссылка скопирована' : 'Поделиться в Telegram'} className={product ? '' : 'ml-auto'}>
              <button
                onClick={handleShare}
                aria-label="Поделиться в Telegram"
                className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
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

        {notFound ? (
          <div className="text-center py-20">
            <Search size={48} style={{ color: colors.textDim }} className="mb-4 mx-auto" />
            <p className="text-base font-semibold" style={{ color: colors.textPrimary }}>Товар не найден</p>
            <p className="text-sm mt-2 mb-5" style={{ color: colors.textMuted }}>
              Возможно, продавец его удалил или скрыл
            </p>
            <button
              onClick={() => router.push(`/${slug}`)}
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              К магазину
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
            {/* LEFT — gallery */}
            <div>
              <div
                className="relative aspect-square rounded-2xl flex items-center justify-center mb-3 overflow-hidden"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                {isLoading ? (
                  <Skeleton className="absolute inset-0 rounded-2xl" />
                ) : images.length > 0 ? (
                  <Image
                    src={images[activeImage]}
                    alt={product?.title ?? ""}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                ) : (
                  <ShoppingBag size={96} style={{ color: colors.textDim }} />
                )}

                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 1 }}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImage(i)}
                        className="rounded-full transition-all"
                        style={{
                          width: i === activeImage ? 16 : 8,
                          height: 8,
                          background: i === activeImage ? colors.accent : 'rgba(255,255,255,0.85)',
                          boxShadow: '0 0 4px rgba(0,0,0,0.20)',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className="w-16 h-16 rounded-xl overflow-hidden relative flex items-center justify-center transition-all flex-shrink-0"
                      style={
                        i === activeImage
                          ? { background: colors.surface, border: `2px solid ${colors.accent}` }
                          : { background: colors.surfaceMuted, border: `1px solid ${colors.border}` }
                      }
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT — info */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              {isLoading ? (
                <>
                  <Skeleton className="h-7 w-3/4 mb-2" />
                  <Skeleton className="h-8 w-32 mb-5" />
                </>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold leading-snug mb-2" style={{ color: colors.textPrimary }}>
                    {product?.title}
                  </h1>
                  {product?.globalCategory && (
                    <div className="mb-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-wide"
                        style={{
                          background: colors.accentMuted,
                          color: colors.accent,
                          border: `1px solid ${colors.accentBorder}`,
                        }}
                      >
                        {product.globalCategory.nameRu}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-3 mb-5">
                    <span className="text-3xl font-bold" style={{ color: colors.accent }}>
                      {fmt(displayPrice)}
                    </span>
                    <span className="text-base" style={{ color: colors.textMuted }}>сум</span>
                  </div>
                </>
              )}

              {/* Variant options */}
              {!isLoading && hasGroups && (
                <div className="mb-5 flex flex-col gap-4">
                  {optionGroups.map((g) => (
                    <div key={g.id}>
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: colors.textDim }}>
                        {g.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {g.values.map((val) => {
                          const isSelected = selection[g.id] === val.id;
                          const available = isValueAvailable(val.id, g.id, activeVariants, selection, optionGroups);
                          return (
                            <button
                              key={val.id}
                              onClick={() => available && handleOptionSelect(g.id, val.id)}
                              disabled={!available}
                              className="px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
                              style={
                                !available
                                  ? { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", textDecoration: "line-through", border: `1px solid ${colors.border}` }
                                  : isSelected
                                    ? { background: colors.accentMuted, color: colors.accent, border: `2px solid ${colors.accent}` }
                                    : { background: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.border}` }
                              }
                            >
                              {val.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {selectedVariantObj && isOutOfStock && (
                    <p className="text-xs" style={{ color: colors.warning }}>
                      Эта комбинация временно недоступна
                    </p>
                  )}
                </div>
              )}

              {/* Flat variants fallback */}
              {!isLoading && !hasGroups && activeVariants.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: colors.textDim }}>
                    Вариант
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeVariants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleFlatVariantSelect(v.id)}
                        disabled={v.stockQuantity === 0}
                        className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                        style={
                          v.stockQuantity === 0
                            ? { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", border: `1px solid ${colors.border}` }
                            : selectedVariantId === v.id
                              ? { background: colors.accentMuted, color: colors.accent, border: `2px solid ${colors.accent}` }
                              : { background: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.border}` }
                        }
                      >
                        {v.titleOverride ?? v.sku}
                        {v.priceOverride && (
                          <span className="ml-1.5 text-xs" style={{ color: colors.textMuted }}>
                            {fmt(v.priceOverride)} сум
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {!isLoading && product?.description && (
                <div
                  className="rounded-2xl p-4 mb-3"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: colors.textDim }}>Описание</p>
                  <p className="text-sm leading-relaxed" style={{ color: colors.textPrimary }}>
                    {product.description}
                  </p>
                </div>
              )}

              {/* Attributes */}
              {!isLoading && productAttributes.length > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5" style={{ color: colors.textDim }}>Характеристики</p>
                  <div className="flex flex-col gap-2">
                    {productAttributes.map((attr) => (
                      <div key={attr.id} className="flex justify-between gap-4 text-sm">
                        <span style={{ color: colors.textMuted }}>{attr.name}</span>
                        <span className="text-right font-medium" style={{ color: colors.textPrimary }}>
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Desktop CTA inline (sticky on mobile only) */}
              <div className="hidden lg:block mt-6 flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleAddToCart}
                    disabled={isLoading || isUnavailable || isOutOfStock || requiresVariantSelection || addToCart.isPending}
                    className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
                    style={
                      isLoading || isUnavailable || isOutOfStock || requiresVariantSelection
                        ? { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", border: `1px solid ${colors.border}` }
                        : added
                          ? { background: colors.success, color: "#FFFFFF" }
                          : { background: colors.accent, color: colors.accentTextOnBg, boxShadow: `0 8px 24px ${colors.accentMuted}` }
                    }
                  >
                    {isLoading ? "Загрузка..." : isOutOfStock ? "Нет в наличии" : requiresVariantSelection ? "Выберите вариант" : added ? "Добавлено ✓" : "В корзину"}
                  </button>
                  {product && (
                    <button
                      onClick={() => {
                        track.chatStarted(product.storeId, "product");
                        setChatOpen(true);
                      }}
                      aria-label="Чат с продавцом"
                      className="w-14 flex items-center justify-center rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.97]"
                      style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                    >
                      <MessageSquare size={20} />
                    </button>
                  )}
                </div>
                {product?.store?.telegramContactLink && (
                  <a
                    href={product.store.telegramContactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track.chatStarted(product.storeId, "product")}
                    className="w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${colors.telegram} 0%, #1d6fa4 100%)`, color: "#FFFFFF" }}
                  >
                    <Send size={16} />
                    Написать в Telegram
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA — mobile only */}
      {!notFound && (
        <div
          className="fixed left-0 right-0 px-4 lg:hidden"
          style={{ bottom: 76, zIndex: 50 }}
        >
          <div className="max-w-md mx-auto flex gap-2.5">
            <button
              onClick={handleAddToCart}
              disabled={isLoading || isUnavailable || isOutOfStock || requiresVariantSelection || addToCart.isPending}
              className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold transition-all active:scale-[0.98]"
              style={
                isLoading || isUnavailable || isOutOfStock || requiresVariantSelection
                  ? { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", border: `1px solid ${colors.border}` }
                  : added
                    ? { background: colors.success, color: "#FFFFFF" }
                    : { background: colors.accent, color: colors.accentTextOnBg, boxShadow: `0 8px 24px ${colors.accentMuted}` }
              }
            >
              {isLoading ? "Загрузка..." : isOutOfStock ? "Нет в наличии" : requiresVariantSelection ? "Выберите вариант" : added ? "Добавлено ✓" : "В корзину"}
            </button>

            {product && (
              <button
                onClick={() => {
                  track.chatStarted(product.storeId, "product");
                  setChatOpen(true);
                }}
                aria-label="Чат с продавцом"
                className="w-14 flex items-center justify-center rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.97]"
                style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
              >
                <MessageSquare size={20} />
              </button>
            )}

            {product?.store?.telegramContactLink && (
              <a
                href={product.store.telegramContactLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.chatStarted(product.storeId, "product")}
                aria-label="Telegram"
                className="w-14 flex items-center justify-center rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${colors.telegram} 0%, #1d6fa4 100%)`, color: "#FFFFFF" }}
              >
                <Send size={18} />
              </a>
            )}
          </div>
        </div>
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
