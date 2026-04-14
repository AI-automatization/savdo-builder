"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/hooks/use-cart";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { track } from "@/lib/analytics";
import type { CartItem } from "types";

// ── Glass tokens ───────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.08)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.15)",
} as const;

const glassDark = {
  background:           "rgba(255,255,255,0.05)",
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               "1px solid rgba(255,255,255,0.10)",
} as const;

const glassDim = {
  background:           "rgba(255,255,255,0.04)",
  backdropFilter:       "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  border:               "1px solid rgba(255,255,255,0.09)",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ru-RU");
const plural = (n: number) => n === 1 ? "товар" : n < 5 ? "товара" : "товаров";

// ── Icons ──────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;
const IcoTrash   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>;
const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}    className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>;

// ── Cart Item Row ──────────────────────────────────────────────────────────

function CartItemRow({ item, storeId, pendingId }: { item: CartItem; storeId: string; pendingId: string | null }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

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
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={glass}>
      {/* Thumbnail */}
      <div
        className="w-[62px] h-[62px] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {item.product.mediaUrl ? (
          <Image
            src={item.product.mediaUrl}
            alt={item.product.title}
            width={62}
            height={62}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white leading-snug truncate">{item.product.title}</p>
        {item.variant?.titleOverride && (
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>
            {item.variant.titleOverride}
          </p>
        )}
        <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>
          {fmt(item.unitPrice)} сум
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <button
          onClick={() => remove.mutate(item.id)}
          disabled={busy}
          className="text-white/22 hover:text-red-400 transition-colors disabled:opacity-40"
          aria-label="Удалить"
        >
          <IcoTrash />
        </button>
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.13)" }}>
          <button
            onClick={() => adjust(-1)}
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none disabled:opacity-40"
          >−</button>
          <span className="w-7 h-7 flex items-center justify-center text-sm font-semibold text-white">
            {item.quantity}
          </span>
          <button
            onClick={() => adjust(+1)}
            disabled={busy}
            className="w-7 h-7 flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10 transition-colors text-lg leading-none disabled:opacity-40"
          >+</button>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonItem() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={glass}>
      <div className="w-[62px] h-[62px] rounded-xl animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3.5 w-36 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
        <div className="h-3 w-24 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { data: cart, isLoading, isError } = useCart();

  const items = cart?.items ?? [];
  const totalQty = items.reduce((s, it) => s + it.quantity, 0);


  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80,  background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13)  0%, transparent 70%)", filter: "blur(28px)" }} />
        <div className="absolute rounded-full" style={{ width: 220, height: 220, top: "45%", left: "50%", transform: "translateX(-50%)", background: "radial-gradient(circle, rgba(96,165,250,.10) 0%, transparent 70%)", filter: "blur(24px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-5 pb-52" style={{ zIndex: 1 }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors" style={glass}>
            <IcoBack />
          </Link>
          <h1 className="flex-1 text-xl font-semibold text-white tracking-tight">Корзина</h1>
          {totalQty > 0 && (
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: "rgba(167,139,250,.22)", color: "#A78BFA" }}>
              {totalQty} {plural(totalQty)}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <SkeletonItem />
            <SkeletonItem />
            <SkeletonItem />
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-center text-sm py-16" style={{ color: "rgba(248,113,113,.80)" }}>
            Не удалось загрузить корзину
          </p>
        )}

        {/* Empty */}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.40)" }}>Корзина пуста</p>
            <Link
              href="/"
              className="inline-block px-5 py-2.5 rounded-2xl text-sm font-medium"
              style={{ background: "rgba(167,139,250,.22)", color: "#A78BFA" }}
            >
              Перейти в магазин
            </Link>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <>
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <CartItemRow key={item.id} item={item} storeId={cart!.storeId} pendingId={null} />
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 rounded-2xl" style={glassDark}>
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                Итого
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>Товары ({totalQty})</span>
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>{fmt(cart!.totalAmount)} сум</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>Доставка</span>
                  <span style={{ color: "rgba(255,255,255,0.50)" }}>рассчитывается при оформлении</span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.09)" }}>
                <span className="text-base font-semibold text-white">Товары</span>
                <span className="text-base font-bold" style={{ color: "#A78BFA" }}>{fmt(cart!.totalAmount)} сум</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      {items.length > 0 && (
        <div className="fixed left-0 right-0 px-4" style={{ bottom: 80, zIndex: 50 }}>
          <div className="max-w-md mx-auto">
            <Link
              href="/checkout"
              className="w-full py-4 rounded-2xl text-[15px] font-semibold text-white tracking-wide active:scale-[0.98] transition-transform flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,0.38)" }}
            >
              Оформить заказ · {fmt(cart!.totalAmount)} сум
            </Link>
          </div>
        </div>
      )}

      <BottomNavBar active="cart" cartBadge={totalQty} />
    </div>
  );
}
