"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { track } from "@/lib/analytics";
import { getRecentStores } from "@/lib/recent-stores";
import type { CartItem } from "types";
import { ThreadType } from "types";
import { ArrowLeft, Package, ShoppingCart, MessageSquare } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
import { colors } from "@/lib/styles";
import { useTranslation } from "@/lib/i18n";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined) =>
  (typeof n === "number" ? n : Number(n) || 0).toLocaleString("ru-RU");

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  return 0;
};

const itemUnitPrice = (i: CartItem) =>
  toNum(i.variant?.salePriceOverride) ||
  toNum(i.variant?.priceOverride) ||
  toNum(i.salePriceSnapshot) ||
  toNum(i.unitPrice) ||
  toNum(i.unitPriceSnapshot) ||
  toNum(i.product?.salePrice) ||
  toNum(i.product?.basePrice) ||
  0;

const itemSubtotal = (i: CartItem) =>
  typeof i.subtotal === "number" ? i.subtotal : itemUnitPrice(i) * (i.quantity || 0);

// Russian plural for «товар» — used only when locale === 'ru'
const pluralRu = (n: number) => n === 1 ? "товар" : n < 5 ? "товара" : "товаров";

// ── QtyStepper ────────────────────────────────────────────────────────────────

function QtyStepper({ value, onChange, disabled }: { value: number; onChange: (q: number) => void; disabled?: boolean }) {
  return (
    <div
      className="flex items-center rounded-md"
      style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="px-2.5 py-1.5 text-sm disabled:opacity-40"
        style={{ color: colors.textMuted }}
      >
        −
      </button>
      <div className="px-1 min-w-[20px] text-center text-[12px] font-bold" style={{ color: colors.textStrong }}>
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled}
        className="px-2.5 py-1.5 text-sm disabled:opacity-40"
        style={{ color: colors.textBody }}
      >
        +
      </button>
    </div>
  );
}

// ── CartItemRow ───────────────────────────────────────────────────────────────

function CartItemRow({ item, storeId }: { item: CartItem; storeId: string }) {
  const { t } = useTranslation();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const [imgFailed, setImgFailed] = useState(false);
  const [rowError, setRowError] = useState<string>();

  const busy = update.isPending || remove.isPending;

  // OOS detection — CartItemProduct exposes the current stock snapshot
  const outOfStock =
    item.product.stock === 0 || item.product.isAvailable === false;

  function describeErr(e: unknown): string {
    const err = e as { response?: { data?: { message?: string } } };
    return err?.response?.data?.message ?? t('cart.updateError');
  }

  function handleRemove() {
    setRowError(undefined);
    remove.mutate(item.id, { onError: (e) => setRowError(describeErr(e)) });
  }

  function adjustQty(next: number) {
    setRowError(undefined);
    if (next <= 0) {
      handleRemove();
    } else {
      update.mutate(
        { itemId: item.id, data: { quantity: next } },
        { onError: (e) => setRowError(describeErr(e)) },
      );
      if (next > item.quantity) {
        track.addToCart(storeId, item.productId, item.variantId, next - item.quantity);
      }
    }
  }

  const variantLabel = item.variant?.title ?? null;

  return (
    <div
      className="flex gap-3 py-3.5 px-4 border-b md:border-b-0 md:rounded-md md:p-4 md:mb-2 transition-opacity"
      style={{
        borderColor: colors.divider,
        opacity: outOfStock ? 0.55 : 1,
      }}
    >
      {/* Photo */}
      <div
        className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
        style={{ background: colors.surfaceSunken }}
      >
        {item.product.mediaUrl && !imgFailed ? (
          <Image
            src={item.product.mediaUrl}
            alt={item.product.title}
            width={150}
            height={150}
            className="object-cover w-full h-full"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Package size={22} style={{ color: colors.textDim }} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="text-xs md:text-sm leading-snug" style={{ color: colors.textStrong }}>
          {item.product.title}
        </div>
        <div
          className="text-[10px] md:text-[11px] mt-0.5"
          style={{ color: outOfStock ? colors.danger : colors.textMuted }}
        >
          {outOfStock ? t('cart.outOfStock') : (variantLabel ?? " ")}
        </div>

        {/* Bottom row: actions + price */}
        <div className="mt-auto flex justify-between items-center pt-2">
          {outOfStock ? (
            <div className="flex gap-2">
              <button
                className="px-2.5 py-1 text-[10px] font-semibold rounded border"
                style={{ borderColor: colors.brand, color: colors.brand, background: "transparent" }}
                disabled
              >
                {t('cart.notify')}
              </button>
              <button
                onClick={handleRemove}
                disabled={busy}
                className="text-[10px] disabled:opacity-40"
                style={{ color: colors.textMuted, background: "transparent", border: "none" }}
              >
                {t('common.delete')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5">
                <QtyStepper value={item.quantity} onChange={adjustQty} disabled={busy} />
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={busy}
                  className="text-[10px] disabled:opacity-40"
                  style={{ color: colors.textMuted, background: "transparent", border: "none" }}
                >
                  {t('common.delete')}
                </button>
              </div>
              <div className="text-[13px] md:text-sm font-bold" style={{ color: colors.textStrong }}>
                {fmt(itemSubtotal(item))} сум
              </div>
            </>
          )}
        </div>
        {rowError && (
          <p className="text-[10px] mt-1" style={{ color: colors.danger }}>{rowError}</p>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="flex gap-3 py-3.5 px-4 border-b" style={{ borderColor: colors.divider }}>
      <div className="w-[72px] h-[72px] rounded-md animate-pulse flex-shrink-0" style={{ background: colors.skeleton }} />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="h-3.5 w-40 rounded-full animate-pulse" style={{ background: colors.skeleton }} />
        <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: colors.skeleton }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { t, locale } = useTranslation();
  const { data: cart, isLoading, isError } = useCart();
  const [chatOpen, setChatOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState<{ name: string; slug: string } | null>(null);

  const items = cart?.items ?? [];
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);
  const subtotal =
    typeof cart?.totalAmount === "number"
      ? cart.totalAmount
      : items.reduce((s, it) => s + itemSubtotal(it), 0);
  // Delivery: 0 if above threshold (placeholder — real per-store rule TBD)
  // Доставка считается на checkout (per-store deliverySettings) — в корзине
  // total равен subtotal.
  const total = subtotal;

  const storeId = cart?.storeId ?? "";
  const firstItem = items[0];

  // Try to resolve store name + slug from recent-stores cache
  useEffect(() => {
    if (!storeId) return;
    const recents = getRecentStores();
    // Fallback: read last_store_slug from localStorage
    try {
      const slug = window.localStorage.getItem("last_store_slug") ?? "";
      const bySlug = recents.find((s) => s.slug === slug);
      if (bySlug) {
        setStoreInfo({ name: bySlug.name, slug: bySlug.slug });
        return;
      }
      // Any recent store as last resort
      if (recents.length > 0) {
        setStoreInfo({ name: recents[0].name, slug: recents[0].slug });
      }
    } catch {
      // localStorage unavailable
    }
  }, [storeId]);

  const storeName = storeInfo?.name ?? t('cart.storeFallback');
  const storeSlug = storeInfo?.slug ?? "";
  const storeInitial = storeName.charAt(0).toUpperCase();

  // Item count label — RU uses plural declension, UZ uses a flat form
  const itemCountLabel =
    locale === 'uz'
      ? t('cart.itemCountUz', { count: totalQty })
      : `${totalQty} ${pluralRu(totalQty)}`;

  const cartAsChatMessage = items
    .map((it) => `• ${it.product?.title ?? t('cart.productFallback')} × ${it.quantity}`)
    .join("\n");
  const chatInitialText = items.length > 0
    ? t('cart.chatInitialText', { items: cartAsChatMessage })
    : "";

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: colors.surface, borderColor: colors.divider }}
      >
        <Link
          href="/"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover-soft"
          style={{ color: colors.textPrimary }}
          aria-label={t('cart.backLabel')}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-base font-bold tracking-tight" style={{ color: colors.textStrong }}>
          {t('cart.title')}
        </h1>
        {totalQty > 0 && (
          <span
            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
            style={{ background: colors.brandMuted, color: colors.brand }}
          >
            {itemCountLabel}
          </span>
        )}
      </div>

      {/* ── Loading ───────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex flex-col">
          <SkeletonItem />
          <SkeletonItem />
          <SkeletonItem />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {isError && (
        <p className="text-center text-sm py-16" style={{ color: colors.danger }}>
          {t('cart.loadError')}
        </p>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div
            className="text-[10px] tracking-[0.18em] uppercase mb-3"
            style={{ color: colors.textMuted }}
          >
            {t('cart.emptyLabel')}
          </div>
          <ShoppingCart size={40} style={{ color: colors.textDim }} className="mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{ color: colors.textStrong }}>
            {t('cart.emptyTitle')}
          </h2>
          <p className="text-sm mb-6" style={{ color: colors.textMuted }}>
            {t('cart.emptyHint')}
          </p>
          <Link
            href="/"
            className="px-6 py-3 text-sm font-bold rounded-lg"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {t('cart.toStores')}
          </Link>
        </div>
      )}

      {/* ── Cart content ──────────────────────────────────────────────────── */}
      {items.length > 0 && (
        <>
          {/* Store strip */}
          <div
            className="flex items-center gap-2.5 px-4 md:px-6 py-3 border-b"
            style={{ background: colors.surface, borderColor: colors.divider }}
          >
            <div
              className="w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: colors.brand, color: colors.brandTextOnBg }}
            >
              {storeInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: colors.textStrong }}
              >
                {storeName}
              </div>
              <div className="text-[10px]" style={{ color: colors.textMuted }}>
                {t('cart.writeSeller')}
              </div>
            </div>
            <button
              onClick={() => {
                track.chatStarted(storeId, "cart");
                setChatOpen(true);
              }}
              className="text-[11px] font-semibold whitespace-nowrap"
              style={{ color: colors.brand, background: "transparent", border: "none" }}
            >
              {t('cart.chat')}
            </button>
          </div>

          {/* Desktop grid: items left, summary right */}
          <div className="md:grid md:grid-cols-[7fr_5fr] gap-6 md:p-6 md:max-w-5xl md:mx-auto">
            {/* Items list */}
            <div className="md:rounded-xl md:overflow-hidden" style={{ background: 'transparent' }}>
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} storeId={storeId} />
              ))}
            </div>

            {/* Summary — desktop only (mobile has its own block below) */}
            <div className="hidden md:block">
              <div
                className="md:sticky md:top-5 p-4 md:p-5 rounded-none md:rounded-xl mt-4 md:mt-0"
                style={{ background: colors.surface }}
              >
                <div
                  className="text-[10px] tracking-[0.18em] uppercase mb-3.5"
                  style={{ color: colors.textMuted }}
                >
                  {t('cart.summaryLabel')}
                </div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}>
                  <span>{t('cart.subtotal')}</span>
                  <span>{fmt(subtotal)} сум</span>
                </div>
                <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}>
                  <span>{t('cart.delivery')}</span>
                  <span style={{ color: colors.textDim }}>
                    {t('cart.deliveryAtCheckout')}
                  </span>
                </div>
                <div
                  className="flex justify-between text-base font-bold pt-2.5 mt-1.5"
                  style={{
                    color: colors.textStrong,
                    borderTop: `1px dashed ${colors.divider}`,
                  }}
                >
                  <span>{t('cart.total')}</span>
                  <span>{fmt(total)} сум</span>
                </div>

                {/* Desktop CTA (hidden on mobile) */}
                <Link
                  href="/checkout"
                  className="hidden md:block w-full mt-4 py-3.5 text-center text-sm font-bold rounded-lg transition-opacity hover:opacity-90"
                  style={{ background: colors.brand, color: colors.brandTextOnBg }}
                >
                  {t('cart.checkout')}
                </Link>
                {storeSlug && (
                  <Link
                    href={`/${storeSlug}`}
                    className="hidden md:block w-full mt-2 py-2.5 text-center text-xs font-semibold"
                    style={{ color: colors.brand }}
                  >
                    {t('cart.continueShopping')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Mobile summary (no CTA — that's in sticky bottom) */}
          <div className="md:hidden px-4 pt-3 pb-2 mt-2" style={{ background: colors.surface }}>
            <div
              className="text-[10px] tracking-[0.18em] uppercase mb-3"
              style={{ color: colors.textMuted }}
            >
              {t('cart.summaryLabel')}
            </div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}>
              <span>{t('cart.subtotal')}</span>
              <span>{fmt(subtotal)} сум</span>
            </div>
            <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}>
              <span>{t('cart.delivery')}</span>
              <span style={{ color: colors.textDim }}>
                {t('cart.deliveryAtCheckout')}
              </span>
            </div>
            <div
              className="flex justify-between text-base font-bold pt-2.5 mt-1.5 pb-3"
              style={{
                color: colors.textStrong,
                borderTop: `1px dashed ${colors.divider}`,
              }}
            >
              <span>{t('cart.total')}</span>
              <span>{fmt(total)} сум</span>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile sticky CTA ─────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div
          className="md:hidden sticky bottom-0 z-[51] p-3 border-t"
          style={{ background: colors.surfaceMuted, borderColor: colors.divider }}
        >
          <Link
            href="/checkout"
            className="block w-full py-3.5 text-center text-sm font-bold rounded-lg"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {t('cart.checkoutWithAmount', { amount: fmt(total) })}
          </Link>
        </div>
      )}

      {/* Chat modal */}
      {chatOpen && firstItem && (
        <ChatComposerModal
          contextType={ThreadType.PRODUCT}
          contextId={firstItem.productId}
          title={t('cart.chatTitle', { items: itemCountLabel })}
          initialText={chatInitialText}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Bottom nav — needs enough space above sticky CTA */}
      <div className={items.length > 0 ? "pb-20 md:pb-0" : ""} />
      <BottomNavBar active="cart" cartBadge={totalQty} />
    </div>
  );
}
