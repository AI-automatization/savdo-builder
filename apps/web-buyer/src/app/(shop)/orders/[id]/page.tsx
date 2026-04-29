"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OrderStatus, DeliveryType, ThreadType } from "types";
import { useOrder, useCancelOrder } from "@/hooks/use-orders";
import { useBuyerSocket } from "@/hooks/use-buyer-socket";
import { track } from "@/lib/analytics";
import { ArrowLeft, CheckCircle, Truck, Package, Frown, MessageSquare, MapPin, Send, Hourglass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
import { colors } from "@/lib/styles";

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const fmt = (n: unknown) => toNum(n).toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

type NormalizedItem = {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};
type NormalizedAddress = { street: string; city: string; region?: string } | undefined;
type NormalizedStore = { name?: string; telegramContactLink?: string | null } | null;
type NormalizedOrder = {
  id: string;
  status: OrderStatus;
  storeId: string;
  store: NormalizedStore;
  items: NormalizedItem[];
  totalAmount: number;
  deliveryFee: number;
  deliveryType: DeliveryType;
  deliveryAddress: NormalizedAddress;
  buyerNote: string | null;
};

function normalizeOrder(raw: any): NormalizedOrder {
  const rawItems: any[] = Array.isArray(raw.items) ? raw.items : [];
  const deliveryAddress: NormalizedAddress = raw.deliveryAddress
    ?? (raw.city || raw.addressLine1
      ? { street: raw.addressLine1 ?? '', city: raw.city ?? '', region: raw.region ?? undefined }
      : undefined);
  return {
    id: raw.id,
    status: raw.status,
    storeId: raw.storeId,
    store: raw.store ?? null,
    items: rawItems.map((it: any): NormalizedItem => ({
      id: it.id,
      title: it.title ?? it.productTitleSnapshot ?? '',
      variantTitle: it.variantTitle ?? it.variantLabelSnapshot ?? null,
      quantity: it.quantity ?? 0,
      unitPrice: toNum(it.unitPrice ?? it.unitPriceSnapshot),
      subtotal: toNum(it.subtotal ?? it.lineTotalAmount),
    })),
    totalAmount: toNum(raw.totalAmount),
    deliveryFee: toNum(raw.deliveryFee ?? raw.deliveryFeeAmount),
    deliveryType: raw.deliveryType,
    deliveryAddress,
    buyerNote: raw.buyerNote ?? raw.customerComment ?? null,
  };
}

const PROGRESS_STEPS: { key: OrderStatus; label: string; icon: LucideIcon }[] = [
  { key: OrderStatus.PENDING, label: "Ожидает", icon: Hourglass },
  { key: OrderStatus.CONFIRMED, label: "Подтверждён", icon: CheckCircle },
  { key: OrderStatus.SHIPPED, label: "В пути", icon: Truck },
  { key: OrderStatus.DELIVERED, label: "Доставлен", icon: Package },
];

const ACTIVE_STEP: Record<string, number> = {
  [OrderStatus.PENDING]: 0,
  [OrderStatus.CONFIRMED]: 1,
  [OrderStatus.PROCESSING]: 1,
  [OrderStatus.SHIPPED]: 2,
  [OrderStatus.DELIVERED]: 3,
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  [OrderStatus.PENDING]: { label: "Ожидает", color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  [OrderStatus.CONFIRMED]: { label: "Подтверждён", color: "#0EA5E9", bg: "rgba(14,165,233,0.10)" },
  [OrderStatus.PROCESSING]: { label: "В обработке", color: colors.accent, bg: colors.accentMuted },
  [OrderStatus.SHIPPED]: { label: "В пути", color: "#6366F1", bg: "rgba(99,102,241,0.10)" },
  [OrderStatus.DELIVERED]: { label: "Доставлен", color: colors.success, bg: "rgba(22,163,74,0.10)" },
  [OrderStatus.CANCELLED]: { label: "Отменён", color: colors.danger, bg: "rgba(220,38,38,0.10)" },
};

function Section({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${colors.divider}` }}>
        <span style={{ color: colors.accent }}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>{label}</span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-3">{children}</div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="h-6 w-40 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        {[100, 60, 80].map((w, i) => (
          <div key={i} className="h-3 rounded-full animate-pulse" style={{ width: w, background: colors.surfaceMuted }} />
        ))}
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rawOrder, isLoading, isError } = useOrder(id);
  const cancelOrder = useCancelOrder();
  useBuyerSocket();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const order = rawOrder ? normalizeOrder(rawOrder) : null;

  const currentStep = order ? (ACTIVE_STEP[order.status] ?? 0) : 0;
  const isCancelled = order?.status === OrderStatus.CANCELLED;
  const canCancel = order && [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  const subtotal = order?.items.reduce((s, it) => s + it.subtotal, 0) ?? 0;
  const statusCfg = order ? (STATUS_LABEL[order.status] ?? { label: order.status, color: colors.textPrimary, bg: colors.surfaceMuted }) : null;

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-44 md:pb-12">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/orders"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-xl sm:text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            Заказ #{order ? shortId(order.id) : "…"}
          </h1>
          {statusCfg && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full shrink-0"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          )}
        </div>

        {isLoading && <PageSkeleton />}

        {isError && (
          <div className="text-center py-16">
            <Frown size={32} style={{ color: colors.textDim }} className="mb-3 mx-auto" />
            <p className="text-sm" style={{ color: colors.danger }}>Не удалось загрузить заказ</p>
            <Link href="/orders" className="text-xs mt-3 inline-block" style={{ color: colors.accent }}>← Назад к заказам</Link>
          </div>
        )}

        {order && (
          <div className="flex flex-col gap-4">
            {!isCancelled && (
              <div
                className="rounded-2xl px-4 pt-4 pb-5"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <div className="flex justify-between mb-3">
                  {PROGRESS_STEPS.map((step, i) => (
                    <span
                      key={step.key}
                      className="text-[10px] font-medium text-center flex-1"
                      style={{ color: i <= currentStep ? colors.accent : colors.textDim }}
                    >
                      {step.label}
                    </span>
                  ))}
                </div>
                <div className="relative flex items-center">
                  <div className="absolute left-0 right-0 h-[2px] rounded-full" style={{ background: colors.surfaceMuted }} />
                  <div
                    className="absolute left-0 h-[2px] rounded-full transition-all duration-500"
                    style={{
                      background: colors.accent,
                      width: `${(currentStep / (PROGRESS_STEPS.length - 1)) * 100}%`,
                    }}
                  />
                  <div className="relative flex justify-between w-full">
                    {PROGRESS_STEPS.map((step, i) => {
                      const done = i < currentStep;
                      const current = i === currentStep;
                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300"
                            style={
                              current
                                ? { background: colors.accent, border: `2px solid ${colors.surface}`, boxShadow: `0 0 0 3px ${colors.accentMuted}` }
                                : done
                                  ? { background: colors.accent, border: `2px solid ${colors.accent}` }
                                  : { background: colors.surface, border: `2px solid ${colors.borderStrong}` }
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
                <div className="flex justify-between mt-2.5">
                  {PROGRESS_STEPS.map((step, i) => (
                    <span key={step.key} className="flex-1 flex justify-center" style={{ color: i <= currentStep ? colors.accent : colors.textDim, opacity: i <= currentStep ? 1 : 0.6 }}>
                      <step.icon size={16} />
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Store card */}
            {order.store && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                >
                  {order.store.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{order.store.name ?? 'Магазин'}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>Магазин</p>
                </div>
                {order.store.telegramContactLink && (
                  <a
                    href={order.store.telegramContactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track.chatStarted(order.storeId, "order")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-90"
                    style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                  >
                    <Send size={12} />
                    Написать
                  </a>
                )}
              </div>
            )}

            {/* Items */}
            <Section label="Товары" icon={<Package size={14} />}>
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
                  >
                    <Package size={16} style={{ color: colors.textDim }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug" style={{ color: colors.textPrimary }}>{item.title}</p>
                    {item.variantTitle && (
                      <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{item.variantTitle}</p>
                    )}
                    <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>{item.quantity} шт.</p>
                  </div>
                  <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.accent }}>
                    {fmt(item.subtotal)} сум
                  </span>
                </div>
              ))}
            </Section>

            {/* Delivery */}
            <Section label="Доставка" icon={<MapPin size={14} />}>
              {order.deliveryType === DeliveryType.DELIVERY ? (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0" style={{ color: colors.accent }}><MapPin size={14} /></span>
                  <div>
                    <p className="text-[11px] mb-0.5" style={{ color: colors.textDim }}>Адрес доставки</p>
                    <p className="text-sm" style={{ color: colors.textPrimary }}>{order.deliveryAddress?.street ?? '—'}, {order.deliveryAddress?.city ?? '—'}</p>
                    {order.deliveryAddress?.region && (
                      <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{order.deliveryAddress.region}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: colors.textPrimary }}>Самовывоз</p>
              )}
              {order.buyerNote && (
                <div className="pt-2" style={{ borderTop: `1px solid ${colors.divider}` }}>
                  <p className="text-[11px] mb-0.5" style={{ color: colors.textDim }}>Комментарий</p>
                  <p className="text-sm" style={{ color: colors.textPrimary }}>{order.buyerNote}</p>
                </div>
              )}
            </Section>

            {/* Total */}
            <div
              className="rounded-2xl px-4 py-3 flex flex-col gap-2"
              style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: colors.textDim }}>Итого к оплате</p>
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.textMuted }}>Товары ({order.items.reduce((s, i) => s + (i.quantity ?? 0), 0)} шт.)</span>
                <span style={{ color: colors.textPrimary }}>{fmt(subtotal)} сум</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: colors.textMuted }}>Доставка</span>
                <span style={{ color: colors.textPrimary }}>{fmt(order.deliveryFee)} сум</span>
              </div>
              <div className="flex justify-between items-center pt-2 mt-1" style={{ borderTop: `1px solid ${colors.divider}` }}>
                <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>К оплате</span>
                <span className="text-base font-bold" style={{ color: colors.accent }}>{fmt(order.totalAmount)} сум</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {order && !isCancelled && (
        <div className="fixed left-0 right-0 px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md" style={{ bottom: 76, zIndex: 50 }}>
          <div className="max-w-md mx-auto flex flex-col gap-2.5">
            <button
              onClick={() => {
                track.chatStarted(order.storeId, "order");
                setChatOpen(true);
              }}
              className="w-full py-3.5 rounded-2xl text-[15px] font-semibold tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: colors.accent, color: colors.accentTextOnBg, boxShadow: `0 8px 24px ${colors.accentMuted}` }}
            >
              <MessageSquare size={18} />
              Чат по заказу
            </button>
            {order.store?.telegramContactLink && (
              <a
                href={order.store.telegramContactLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.chatStarted(order.storeId, "order")}
                className="w-full py-2.5 rounded-2xl text-sm font-medium tracking-wide flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${colors.telegram} 0%, #1d6fa4 100%)`, color: "#FFFFFF" }}
              >
                <Send size={14} />
                Открыть Telegram
              </a>
            )}
            {canCancel && !confirmCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ background: 'rgba(220,38,38,0.08)', color: colors.danger, border: `1px solid rgba(220,38,38,0.30)` }}
              >
                Отменить заказ
              </button>
            )}
            {canCancel && confirmCancel && (
              <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.30)` }}>
                <p className="text-sm text-center" style={{ color: colors.textPrimary }}>Отменить заказ #{shortId(order.id)}?</p>
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => cancelOrder.mutate({ id: order.id })}
                    disabled={cancelOrder.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                    style={{ background: colors.danger, color: '#FFFFFF' }}
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

      {chatOpen && order && (
        <ChatComposerModal
          contextType={ThreadType.ORDER}
          contextId={order.id}
          title={`Заказ #${shortId(order.id)}`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
