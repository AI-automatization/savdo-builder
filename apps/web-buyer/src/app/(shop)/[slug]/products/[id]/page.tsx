"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import Image from "next/image";
import { useProduct } from "@/hooks/use-storefront";
import { useAddToCart } from "@/hooks/use-cart";
import { ProductStatus } from "types";
import { track } from "@/lib/analytics";
import {
  findVariantBySelection,
  initialSelectionFromVariants,
  isSelectionComplete,
  isValueAvailable,
  type OptionSelection,
} from "@/lib/variants";

// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.09)",
} as const;

const fmt = (n: number) => n.toLocaleString("ru-RU");

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}    className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: "rgba(255,255,255,0.10)" }}
    />
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const slug   = params.slug as string;
  const id     = params.id as string;

  const { data: product, isLoading, isError } = useProduct(id);
  const addToCart = useAddToCart();

  const [activeImage,   setActiveImage]   = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selection, setSelection] = useState<OptionSelection>({});
  const [added, setAdded] = useState(false);

  const activeVariants = product?.variants.filter(v => v.isActive) ?? [];
  const optionGroups   = product?.optionGroups ?? [];
  const hasGroups      = optionGroups.length > 0;

  const selectedVariantObj = hasGroups
    ? findVariantBySelection(activeVariants, selection, optionGroups)
    : activeVariants.find(v => v.id === selectedVariantId) ?? null;

  const displayPrice = selectedVariantObj?.priceOverride ?? product?.basePrice ?? 0;
  const isUnavailable           = !product || product.status !== ProductStatus.ACTIVE || !product.isVisible;
  const requiresVariantSelection = hasGroups
    ? (optionGroups.length > 0 && !isSelectionComplete(selection, optionGroups))
    : (activeVariants.length > 0 && !selectedVariantId);
  const isOutOfStock             = selectedVariantObj
    ? selectedVariantObj.stockQuantity === 0
    : (activeVariants.length > 0 && activeVariants.every(v => v.stockQuantity === 0));

  const images = product?.mediaUrls ?? [];
  const notFound = !isLoading && (isError || !product);

  useEffect(() => {
    if (product) track.productViewed(product.storeId, product.id);
  }, [product?.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-select an in-stock variant so the CTA starts actionable.
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
      quantity:  1,
    });
    track.addToCart(product.storeId, product.id, variantId, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const NAV = [
    { href: `/${slug}`,  label: "Магазин", icon: <IcoShop /> },
    { href: "/cart",     label: "Корзина", icon: <IcoCart /> },
    { href: "/chats",    label: "Чаты",    icon: <IcoChat /> },
    { href: "/orders",   label: "Заказы",  icon: <IcoOrders /> },
    { href: "/profile",  label: "Профиль", icon: <IcoProfile /> },
  ];

  return (
    <div className="relative min-h-screen">

      {/* ── Ambient orbs ── */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80,  background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 280, height: 280, bottom: 160, left: -70,  background: "radial-gradient(circle, rgba(34,197,94,.13)  0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-md mx-auto px-4 pt-5 pb-48" style={{ zIndex: 1 }}>

        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => window.history.length > 1 ? router.back() : router.push(`/${slug}`)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors flex-shrink-0"
            style={glass}
          >
            <IcoBack />
          </button>
        </div>

        {notFound ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-sm font-medium text-white/70">Товар не найден</p>
            <p className="text-xs mt-1.5 mb-5" style={{ color: "rgba(255,255,255,0.35)" }}>
              Возможно, продавец его удалил или скрыл
            </p>
            <button
              onClick={() => router.push(`/${slug}`)}
              className="inline-block px-5 py-2.5 rounded-2xl text-sm font-medium"
              style={{ background: "rgba(167,139,250,.22)", color: "#A78BFA" }}
            >
              К магазину
            </button>
          </div>
        ) : (<>

        {/* ── Main image ── */}
        <div
          className="relative aspect-square rounded-2xl flex items-center justify-center mb-3 overflow-hidden"
          style={glass}
        >
          {isLoading ? (
            <Skeleton className="absolute inset-0 rounded-2xl" />
          ) : images.length > 0 ? (
            <Image
              src={images[activeImage]}
              alt={product?.title ?? ""}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 448px"
              priority
            />
          ) : (
            <span className="text-[96px] select-none">🛍</span>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 1 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className="rounded-full transition-all"
                  style={{
                    width:      i === activeImage ? 16 : 8,
                    height:     8,
                    background: i === activeImage ? "#A78BFA" : "rgba(255,255,255,0.30)",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Thumbnail row ── */}
        {images.length > 1 && (
          <div className="flex gap-2 mb-5">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className="w-16 h-16 rounded-xl overflow-hidden relative flex items-center justify-center transition-all"
                style={i === activeImage ? { ...glass, border: "1px solid rgba(167,139,250,.55)" } : glassDim}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}

        {/* ── Product info ── */}
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-8 w-32 mb-5" />
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-white leading-snug mb-2">{product?.title}</h1>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-2xl font-bold" style={{ color: "#A78BFA" }}>
                {fmt(displayPrice)} сум
              </span>
            </div>
          </>
        )}

        {/* ── Variant options ── */}
        {!isLoading && hasGroups && (
          <div className="mb-5 flex flex-col gap-4">
            {optionGroups.map((g) => (
              <div key={g.id}>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2.5">
                  {g.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.values.map((val) => {
                    const isSelected = selection[g.id] === val.id;
                    const available  = isValueAvailable(val.id, g.id, activeVariants, selection, optionGroups);
                    return (
                      <button
                        key={val.id}
                        onClick={() => available && handleOptionSelect(g.id, val.id)}
                        disabled={!available}
                        className="px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all"
                        style={
                          !available
                            ? { ...glassDim, color: "rgba(255,255,255,0.20)", cursor: "not-allowed", textDecoration: "line-through" }
                            : isSelected
                            ? { background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.55)", boxShadow: "0 0 10px rgba(167,139,250,.25)" }
                            : { ...glassDim, color: "rgba(255,255,255,0.65)" }
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
              <p className="text-xs" style={{ color: "#fbbf24" }}>
                Эта комбинация временно недоступна
              </p>
            )}
          </div>
        )}

        {/* ── Fallback: flat variants when product has no option groups ── */}
        {!isLoading && !hasGroups && activeVariants.length > 0 && (
          <div className="mb-5">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest mb-2.5">
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
                      ? { ...glassDim, color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
                      : selectedVariantId === v.id
                      ? { background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.55)", boxShadow: "0 0 10px rgba(167,139,250,.25)" }
                      : { ...glassDim, color: "rgba(255,255,255,0.55)" }
                  }
                >
                  {v.titleOverride ?? v.sku}
                  {v.priceOverride && (
                    <span className="ml-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {fmt(v.priceOverride)} сум
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Description ── */}
        {!isLoading && product?.description && (
          <div className="rounded-2xl p-4" style={glassDim}>
            <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2">Описание</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.60)" }}>
              {product.description}
            </p>
          </div>
        )}

        </>)}
      </div>

      {/* ── Sticky CTA ── */}
      {!notFound && (
      <div className="fixed left-0 right-0 px-4" style={{ bottom: 76, zIndex: 50 }}>
        <div className="max-w-md mx-auto flex gap-2.5">
          <button
            onClick={handleAddToCart}
            disabled={isLoading || isUnavailable || isOutOfStock || requiresVariantSelection || addToCart.isPending}
            className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold text-white transition-all active:scale-[0.98]"
            style={
              isLoading || isUnavailable || isOutOfStock || requiresVariantSelection
                ? { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.28)", cursor: "not-allowed" }
                : added
                ? { background: "linear-gradient(135deg, #059669 0%, #34d399 100%)", boxShadow: "0 8px 24px rgba(52,211,153,.35)" }
                : { background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,.38)" }
            }
          >
            {isLoading ? "Загрузка..." : isOutOfStock ? "Нет в наличии" : requiresVariantSelection ? "Выберите вариант" : added ? "Добавлено ✓" : "В корзину"}
          </button>

          {product?.store?.telegramContactLink && (
            <a
              href={product.store.telegramContactLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track.chatStarted(product.storeId, "product")}
              className="w-14 flex items-center justify-center rounded-2xl text-white transition-opacity hover:opacity-85 active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #1d6fa4 0%, #2AABEE 100%)", boxShadow: "0 8px 24px rgba(42,171,238,.28)" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z" />
              </svg>
            </a>
          )}
        </div>
      </div>
      )}

      {/* ── Bottom navigation ── */}
      <BottomNavBar active="store" storeSlug={slug} />

    </div>
  );
}
