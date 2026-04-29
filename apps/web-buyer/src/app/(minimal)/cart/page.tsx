"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { track } from "@/lib/analytics";
import type { CartItem } from "types";
import { ThreadType } from "types";
import { ArrowLeft, Package, ShoppingCart, MessageSquare, Trash2 } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
import { colors } from "@/lib/styles";

const fmt = (n: number | null | undefined) => (typeof n === "number" ? n : Number(n) || 0).toLocaleString("ru-RU");
const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const itemUnitPrice = (i: CartItem) => {
  const raw = i as unknown as {
    unitPrice?: number | string;
    salePriceSnapshot?: number | string | null;
    unitPriceSnapshot?: number | string | null;
    product?: { basePrice?: number | string; salePrice?: number | string | null };
    variant?: { priceOverride?: number | string | null; salePriceOverride?: number | string | null };
  };
  return (
    toNum(raw.variant?.salePriceOverride) ||
    toNum(raw.variant?.priceOverride) ||
    toNum(raw.salePriceSnapshot) ||
    toNum(raw.unitPrice) ||
    toNum(raw.unitPriceSnapshot) ||
    toNum(raw.product?.salePrice) ||
    toNum(raw.product?.basePrice) ||
    0
  );
};
const itemSubtotal = (i: CartItem) =>
  typeof i.subtotal === "number" ? i.subtotal : itemUnitPrice(i) * (i.quantity || 0);
const plural = (n: number) => n === 1 ? "товар" : n < 5 ? "товара" : "товаров";

function CartItemRow({ item, storeId, pendingId }: { item: CartItem; storeId: string; pendingId: string | null }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const [imgFailed, setImgFailed] = useState(false);

  const busy = pendingId === item.id || update.isPending || remove.isPending;

  function adjust(delta: number) {
    const next = item.quantity + delta;
    if (next <= 0) {
      remove.mutate(item.id);
    } else {
      update.mutate({ itemId: item.id, data: { quantity: next } });
      if (delta > 0) {
        track.addToCart(storeId, item.productId, item.variantId, delta);
      }
    }
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div
        className="w-[62px] h-[62px] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
      >
        {item.product.mediaUrl && !imgFailed ? (
          <Image
            src={item.product.mediaUrl}
            alt={item.product.title}
            width={62}
            height={62}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <Package size={24} style={{ color: colors.textDim }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-snug truncate" style={{ color: colors.textPrimary }}>{item.product.title}</p>
        {item.variant?.titleOverride && (
          <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
            {item.variant.titleOverride}
          </p>
        )}
        <span className="text-sm font-semibold" style={{ color: colors.accent }}>
          {fmt(itemUnitPrice(item))} сум
        </span>
      </div>

      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <button
          onClick={() => remove.mutate(item.id)}
          disabled={busy}
          className="transition-colors disabled:opacity-40"
          style={{ color: colors.textDim }}
          aria-label="Удалить"
        >
          <Trash2 size={16} />
        </button>
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${colors.border}`, background: colors.surfaceMuted }}>
          <button
            onClick={() => adjust(-1)}
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-40 hover:bg-black/5"
            style={{ color: colors.textPrimary }}
          >−</button>
          <span className="w-7 h-7 flex items-center justify-center text-sm font-semibold" style={{ color: colors.textPrimary }}>
            {item.quantity}
          </span>
          <button
            onClick={() => adjust(+1)}
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center transition-colors text-lg leading-none disabled:opacity-40 hover:bg-black/5"
            style={{ color: colors.textPrimary }}
          >+</button>
        </div>
      </div>
    </div>
  );
}

function SkeletonItem() {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="w-[62px] h-[62px] rounded-xl animate-pulse flex-shrink-0" style={{ background: colors.surfaceMuted }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
        <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      </div>
    </div>
  );
}

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();
  const [chatOpen, setChatOpen] = useState(false);

  const items = cart?.items ?? [];
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);
  const totalAmount =
    typeof cart?.totalAmount === "number"
      ? cart.totalAmount
      : items.reduce((s, it) => s + itemSubtotal(it), 0);

  const firstItem = items[0];
  const cartAsChatMessage = items
    .map((it) => `• ${it.product?.title ?? "Товар"} × ${it.quantity}`)
    .join("\n");
  const chatInitialText = items.length > 0
    ? `Хочу уточнить по товарам из корзины:\n${cartAsChatMessage}`
    : "";

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-40 md:pb-12">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-xl sm:text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>Корзина</h1>
          {totalQty > 0 && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              {totalQty} {plural(totalQty)}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3">
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        )}

        {isError && (
          <p className="text-center text-sm py-16" style={{ color: colors.danger }}>
            Не удалось загрузить корзину
          </p>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="text-center py-24">
            <ShoppingCart size={48} style={{ color: colors.textDim }} className="mb-4 mx-auto" />
            <p className="text-sm mb-6" style={{ color: colors.textMuted }}>Корзина пуста</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
            >
              Перейти в магазин
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} storeId={cart!.storeId} pendingId={null} />
              ))}
            </div>

            <div
              className="mt-4 p-4 rounded-2xl"
              style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: colors.textDim }}>
                Итого
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textMuted }}>Товары ({totalQty})</span>
                  <span style={{ color: colors.textPrimary }}>{fmt(totalAmount)} сум</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: colors.textMuted }}>Доставка</span>
                  <span style={{ color: colors.textDim }}>рассчитывается при оформлении</span>
                </div>
              </div>
              <div
                className="flex justify-between items-center mt-3 pt-3"
                style={{ borderTop: `1px solid ${colors.divider}` }}
              >
                <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>К оплате</span>
                <span className="text-lg font-bold" style={{ color: colors.accent }}>{fmt(totalAmount)} сум</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA */}
      {items.length > 0 && (
        <div className="fixed left-0 right-0 px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md" style={{ bottom: 80, zIndex: 50 }}>
          <div className="max-w-md mx-auto flex gap-2.5">
            <Link
              href="/checkout"
              className="flex-1 py-4 rounded-2xl text-[15px] font-semibold tracking-wide active:scale-[0.98] transition-transform flex items-center justify-center"
              style={{ background: colors.accent, color: colors.accentTextOnBg, boxShadow: `0 8px 28px ${colors.accentMuted}` }}
            >
              Оформить · {fmt(totalAmount)} сум
            </Link>
            {firstItem && (
              <button
                onClick={() => {
                  track.chatStarted(cart?.storeId ?? "", "cart");
                  setChatOpen(true);
                }}
                aria-label="Уточнить у продавца"
                className="w-14 flex items-center justify-center rounded-2xl transition-opacity hover:opacity-90"
                style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
              >
                <MessageSquare size={20} />
              </button>
            )}
          </div>
        </div>
      )}

      {chatOpen && firstItem && (
        <ChatComposerModal
          contextType={ThreadType.PRODUCT}
          contextId={firstItem.productId}
          title={`Корзина · ${totalQty} ${plural(totalQty)}`}
          initialText={chatInitialText}
          onClose={() => setChatOpen(false)}
        />
      )}

      <BottomNavBar active="cart" cartBadge={totalQty} />
    </div>
  );
}
