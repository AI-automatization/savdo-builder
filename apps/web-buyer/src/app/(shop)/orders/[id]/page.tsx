"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OrderStatus, DeliveryType } from "types";
import { useOrder, useCancelOrder } from "@/hooks/use-orders";
import { useBuyerSocket } from "@/hooks/use-buyer-socket";
import { track } from "@/lib/analytics";
import { CheckCircle, Truck, Package, Frown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Glass tokens ───────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

// ── Status progress ────────────────────────────────────────────────────────

const PROGRESS_STEPS: { key: OrderStatus; label: string; icon: LucideIcon | null }[] = [
  { key: OrderStatus.PENDING,   label: "Ожидает",    icon: null },
  { key: OrderStatus.CONFIRMED, label: "Подтверждён", icon: CheckCircle },
  { key: OrderStatus.SHIPPED,   label: "В пути",     icon: Truck },
  { key: OrderStatus.DELIVERED, label: "Доставлен",  icon: Package },
];

const ACTIVE_STEP: Record<string, number> = {
  [OrderStatus.PENDING]:    0,
  [OrderStatus.CONFIRMED]:  1,
  [OrderStatus.PROCESSING]: 1, // show same step as confirmed
  [OrderStatus.SHIPPED]:    2,
  [OrderStatus.DELIVERED]:  3,
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  [OrderStatus.PENDING]:    { label: "Ожидает",     color: "#FBBF24" },
  [OrderStatus.CONFIRMED]:  { label: "Подтверждён", color: "#60A5FA" },
  [OrderStatus.PROCESSING]: { label: "В обработке", color: "#A78BFA" },
  [OrderStatus.SHIPPED]:    { label: "В пути",      color: "#818CF8" },
  [OrderStatus.DELIVERED]:  { label: "Доставлен",   color: "#34D399" },
  [OrderStatus.CANCELLED]:  { label: "Отменён",     color: "#F87171" },
};

// ── Icons ──────────────────────────────────────────────────────────────────

const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}    className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IcoPin     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const IcoMsg     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>;

// ── Section component ──────────────────────────────────────────────────────

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color: "#A78BFA" }}>{icon}</span>
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.12)" }} />
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={glass}>
        {[100, 60, 80].map((w, i) => (
          <div key={i} className="h-3 rounded-full animate-pulse" style={{ width: w, background: "rgba(255,255,255,0.08)" }} />
        ))}
      </div>
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={glass}>
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-3 w-32 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
              <div className="h-2.5 w-20 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading, isError } = useOrder(id);
  const cancelOrder = useCancelOrder();
  useBuyerSocket();
  const [confirmCancel, setConfirmCancel] = useState(false);


  const currentStep = order ? (ACTIVE_STEP[order.status] ?? 0) : 0;
  const isCancelled = order?.status === OrderStatus.CANCELLED;
  const canCancel = order && [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  const subtotal = order?.items.reduce((s, it) => s + it.subtotal, 0) ?? 0;
  const statusCfg = order ? (STATUS_LABEL[order.status] ?? { label: order.status, color: "#fff" }) : null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-5 pb-56" style={{ zIndex: 1 }}>

        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="w-9 h-9 flex items-center justify-center rounded-xl text-white/70 hover:text-white transition-colors flex-shrink-0" style={glass}>
            <IcoBack />
          </Link>
          <h1 className="flex-1 text-xl font-semibold text-white tracking-tight">
            Заказ #{order ? shortId(order.id) : "…"}
          </h1>
          {statusCfg && (
            <span className="text-xs font-medium px-3 py-1 rounded-full shrink-0" style={{ background: statusCfg.color + "22", color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          )}
        </div>

        {isLoading && <PageSkeleton />}

        {isError && (
          <div className="text-center py-16">
            <Frown size={32} style={{ color: 'rgba(255,255,255,0.3)' }} className="mb-3 mx-auto" />
            <p className="text-sm" style={{ color: "rgba(248,113,113,.80)" }}>Не удалось загрузить заказ</p>
            <Link href="/orders" className="text-xs mt-3 inline-block" style={{ color: "#A78BFA" }}>← Назад к заказам</Link>
          </div>
        )}

        {order && (
          <div className="flex flex-col gap-4">

            {/* Progress bar — hide if cancelled */}
            {!isCancelled && (
              <div className="rounded-2xl px-4 pt-4 pb-5" style={glass}>
                <div className="flex justify-between mb-3">
                  {PROGRESS_STEPS.map((step, i) => (
                    <span key={step.key} className="text-[10px] font-medium text-center flex-1" style={{ color: i <= currentStep ? "#A78BFA" : "rgba(255,255,255,0.25)" }}>
                      {step.label}
                    </span>
                  ))}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-0 right-0 h-[2px] rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
                  <div
                    className="absolute left-0 h-[2px] rounded-full transition-all duration-500"
                    style={{
                      background: "linear-gradient(90deg, #7C3AED, #A78BFA)",
                      width: `${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}%`,
                      boxShadow: "0 0 8px rgba(167,139,250,.5)",
                    }}
                  />
                  <div className="relative flex justify-between w-full">
                    {PROGRESS_STEPS.map((step, i) => {
                      const done    = i < currentStep;
                      const current = i === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                            style={
                              current
                                ? { background: "#A78BFA", boxShadow: "0 0 12px rgba(167,139,250,.7)", border: "2px solid #fff" }
                                : done
                                ? { background: "#7C3AED", border: "2px solid #A78BFA" }
                                : { background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.18)" }
                            }
                          >
                            {done && (
                              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  {PROGRESS_STEPS.map((step, i) => (
                    <span key={step.key} className="flex-1 flex justify-center" style={{ opacity: i <= currentStep ? 1 : 0.25 }}>
                      {step.icon ? <step.icon size={16} /> : <span className="text-base">&#8987;</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Store card */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={glass}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0" style={{ background: "rgba(167,139,250,.28)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.4)" }}>
                {order.store.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{order.store.name}</p>
                <p className="text-[11px] text-white/35 mt-0.5">Магазин</p>
              </div>
              {order.store.telegramContactLink && (
                <a
                  href={order.store.telegramContactLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track.chatStarted(order.storeId, "order")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
                  style={{ background: "rgba(167,139,250,.18)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.28)" }}
                >
                  <IcoMsg />
                  Написать
                </a>
              )}
            </div>

            {/* Items */}
            <Section label="Товары" icon={<IcoOrders />}>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Package size={16} style={{ color: '#A78BFA' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{item.title}</p>
                    {item.variantTitle && (
                      <p className="text-[11px] text-white/40 mt-0.5">{item.variantTitle}</p>
                    )}
                    <p className="text-[11px] text-white/38 mt-0.5">{item.quantity} шт.</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: "#A78BFA" }}>
                    {fmt(item.subtotal)} сум
                  </span>
                </div>
              ))}
            </Section>

            {/* Delivery */}
            <Section label="Доставка" icon={<IcoPin />}>
              {order.deliveryType === DeliveryType.DELIVERY ? (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: "#A78BFA" }}><IcoPin /></span>
                  <div>
                    <p className="text-[11px] text-white/38 mb-0.5">Адрес доставки</p>
                    <p className="text-sm text-white/80">{order.deliveryAddress?.street ?? '—'}, {order.deliveryAddress?.city ?? '—'}</p>
                    {order.deliveryAddress?.region && (
                      <p className="text-xs text-white/40 mt-0.5">{order.deliveryAddress.region}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/70">Самовывоз</p>
              )}
              {order.buyerNote && (
                <div className="pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-[11px] text-white/38 mb-0.5">Комментарий</p>
                  <p className="text-sm text-white/70">{order.buyerNote}</p>
                </div>
              )}
            </Section>

            {/* Total */}
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={glassDim}>
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-1">Итого к оплате</p>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Товары ({order.items.reduce((s, i) => s + i.quantity, 0)} шт.)</span>
                <span className="text-white/70">{fmt(subtotal)} сум</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Доставка</span>
                <span className="text-white/70">{fmt(order.deliveryFee)} сум</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span className="text-base font-semibold text-white">К оплате</span>
                <span className="text-base font-bold" style={{ color: "#A78BFA" }}>{fmt(order.totalAmount)} сум</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {order && !isCancelled && (
        <div className="fixed left-0 right-0 px-4" style={{ bottom: 76, zIndex: 50 }}>
          <div className="max-w-md mx-auto flex flex-col gap-2.5">
            {order.store.telegramContactLink && (
              <a
                href={order.store.telegramContactLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.chatStarted(order.storeId, "order")}
                className="w-full py-3.5 rounded-2xl text-[15px] font-semibold text-white tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)", boxShadow: "0 8px 28px rgba(167,139,250,.38)" }}
              >
                <IcoMsg />
                Написать продавцу
              </a>
            )}
            {canCancel && !confirmCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity"
                style={{ background: "rgba(248,113,113,0.12)", color: "rgba(248,113,113,.90)", border: "1px solid rgba(248,113,113,0.20)" }}
              >
                Отменить заказ
              </button>
            )}
            {canCancel && confirmCancel && (
              <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: "rgba(248,113,113,0.10)", border: "1px solid rgba(248,113,113,0.22)" }}>
                <p className="text-sm text-white/80 text-center">Отменить заказ #{shortId(order.id)}?</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => cancelOrder.mutate({ id: order.id })}
                    disabled={cancelOrder.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ background: "rgba(248,113,113,0.22)", color: "rgba(248,113,113,.95)" }}
                  >
                    {cancelOrder.isPending ? "..." : "Да, отменить"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNavBar active="orders" />
    </div>
  );
}
