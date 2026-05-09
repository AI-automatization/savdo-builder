"use client";

import { use, useState } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OrderStatus, DeliveryType, ThreadType } from "types";
import { useOrder, useCancelOrder } from "@/hooks/use-orders";
import { useBuyerSocket } from "@/hooks/use-buyer-socket";
import { track } from "@/lib/analytics";
import { ArrowLeft, Package, Frown, MessageSquare, MapPin, Send } from "lucide-react";
import ChatComposerModal from "@/components/chat/ChatComposerModal";
import { colors } from "@/lib/styles";

// ── Helpers ───────────────────────────────────────────────────────────────────

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
  if (v && typeof v === "object") { const n = Number(String(v)); return Number.isFinite(n) ? n : 0; }
  return 0;
};
const formatPrice = (n: unknown) => toNum(n).toLocaleString("ru-RU");
const shortId = (id: string) => id.slice(-6).toUpperCase();

// ── Types + normalize ────────────────────────────────────────────────────────

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
  orderNumber?: string;
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
    id: raw.id ?? '',
    orderNumber: raw.orderNumber ?? '',
    status: raw.status,
    storeId: raw.storeId ?? '',
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

// ── Status meta ──────────────────────────────────────────────────────────────

type StatusTone = "success" | "brand" | "warning" | "muted";

const STATUS_META: Record<string, { label: string; eta: string; tone: StatusTone }> = {
  [OrderStatus.PENDING]:    { label: "Ожидает подтверждения", eta: "Продавец рассмотрит в течение часа",  tone: "warning" },
  [OrderStatus.CONFIRMED]:  { label: "Подтверждён",            eta: "Магазин готовит ваш заказ",            tone: "brand"   },
  [OrderStatus.PROCESSING]: { label: "В обработке",            eta: "Идёт сборка заказа",                   tone: "brand"   },
  [OrderStatus.SHIPPED]:    { label: "В пути",                  eta: "Курьер скоро привезёт",                tone: "brand"   },
  [OrderStatus.DELIVERED]:  { label: "Доставлен",               eta: "Спасибо за покупку",                   tone: "success" },
  [OrderStatus.CANCELLED]:  { label: "Отменён",                 eta: "Заказ был отменён",                    tone: "muted"   },
};

const TONE_COLORS: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: "rgba(74,107,69,0.12)",  fg: colors.success },
  brand:   { bg: colors.brandMuted,       fg: colors.brand   },
  warning: { bg: "rgba(156,122,46,0.12)", fg: colors.warning },
  muted:   { bg: colors.surfaceSunken,    fg: colors.textMuted },
};

// ── Timeline ─────────────────────────────────────────────────────────────────

const TIMELINE: { key: OrderStatus; label: string }[] = [
  { key: OrderStatus.PENDING,    label: "Заказ оформлен"          },
  { key: OrderStatus.CONFIRMED,  label: "Подтверждён продавцом"   },
  { key: OrderStatus.PROCESSING, label: "Сборка заказа"           },
  { key: OrderStatus.SHIPPED,    label: "Передан курьеру"         },
  { key: OrderStatus.DELIVERED,  label: "Доставлен"               },
];

const STATUS_INDEX: Record<string, number> = {
  [OrderStatus.PENDING]: 0,
  [OrderStatus.CONFIRMED]: 1,
  [OrderStatus.PROCESSING]: 2,
  [OrderStatus.SHIPPED]: 3,
  [OrderStatus.DELIVERED]: 4,
};

function StatusPill({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] ?? { label: status, tone: "muted" as StatusTone };
  const c = TONE_COLORS[meta.tone];
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={{ background: c.bg, color: c.fg }}
    >
      {meta.label}
    </span>
  );
}

function StatusHero({ order }: { order: NormalizedOrder }) {
  const meta = STATUS_META[order.status] ?? STATUS_META[OrderStatus.PENDING];
  const cancelled = order.status === OrderStatus.CANCELLED;

  if (cancelled) {
    return (
      <div className="px-4 py-5" style={{ background: colors.surfaceSunken }}>
        <div className="text-[10px] tracking-[0.18em] uppercase mb-1.5" style={{ color: colors.textMuted }}>
          — Статус
        </div>
        <div className="text-lg font-bold mb-1" style={{ color: colors.textStrong }}>
          {meta.label}
        </div>
        <div className="text-[11px]" style={{ color: colors.textMuted }}>
          {meta.eta}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5" style={{ background: colors.brand, color: colors.brandTextOnBg }}>
      <div className="text-[10px] tracking-[0.18em] uppercase opacity-70 mb-1.5">
        — Статус
      </div>
      <div className="text-lg font-bold mb-1">
        {meta.label}
      </div>
      <div className="text-[11px] opacity-85">
        {meta.eta}
      </div>
    </div>
  );
}

function Timeline({ status }: { status: OrderStatus }) {
  if (status === OrderStatus.CANCELLED) return null;
  const currentIdx = STATUS_INDEX[status] ?? 0;

  return (
    <div className="px-4 py-5" style={{ background: colors.surface }}>
      <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
        — Этапы
      </div>
      {TIMELINE.map((step, i) => {
        const completed = i < currentIdx;
        const current = i === currentIdx;
        const upcoming = i > currentIdx;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center" style={{ minHeight: i === TIMELINE.length - 1 ? "auto" : 36 }}>
              <div
                className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0${current ? " animate-pulse" : ""}`}
                style={{
                  background: completed || current ? colors.brand : colors.divider,
                  color: colors.brandTextOnBg,
                }}
              >
                {completed ? "✓" : current ? "●" : ""}
              </div>
              {i < TIMELINE.length - 1 && (
                <div
                  className="w-px flex-1 min-h-[18px]"
                  style={{ background: completed ? colors.brand : colors.divider }}
                />
              )}
            </div>
            <div className="flex-1 pb-3">
              <div
                className="text-xs font-semibold"
                style={{
                  color: current
                    ? colors.brand
                    : completed
                      ? colors.textStrong
                      : colors.textMuted,
                  opacity: upcoming ? 0.7 : 1,
                }}
              >
                {step.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="px-4 py-5 flex flex-col gap-3">
      <div className="h-5 w-48 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="h-3 w-32 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
      <div className="h-3 w-40 rounded-full animate-pulse mt-3" style={{ background: colors.surfaceMuted }} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: rawOrder, isLoading, isError } = useOrder(id);
  const cancelOrder = useCancelOrder();
  useBuyerSocket();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const order = rawOrder ? normalizeOrder(rawOrder) : null;
  const isCancelled = order?.status === OrderStatus.CANCELLED;
  const canCancel = order && [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  const subtotal = order?.items.reduce((s, it) => s + it.subtotal, 0) ?? 0;
  const totalQty = order?.items.reduce((s, i) => s + (i.quantity ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      {/* Header bar */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b"
        style={{ background: colors.surface, borderColor: colors.divider }}
      >
        <Link
          href="/orders"
          className="w-8 h-8 flex items-center justify-center rounded-md transition-colors"
          style={{ color: colors.textBody }}
          aria-label="Назад"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="flex-1 text-[15px] font-bold" style={{ color: colors.textStrong }}>
          Заказ #{order ? (order.orderNumber ?? shortId(order.id)) : "…"}
        </h1>
        {order && <StatusPill status={order.status} />}
      </div>

      <div className="max-w-3xl mx-auto pb-44 md:pb-12">
        {isLoading && <PageSkeleton />}

        {isError && (
          <div className="text-center py-16 px-4">
            <Frown size={28} style={{ color: colors.textDim }} className="mb-3 mx-auto" />
            <p className="text-sm" style={{ color: colors.danger }}>Не удалось загрузить заказ</p>
            <Link href="/orders" className="text-xs mt-3 inline-block font-semibold" style={{ color: colors.brand }}>
              ← Назад к заказам
            </Link>
          </div>
        )}

        {order && (
          <>
            <StatusHero order={order} />

            <Timeline status={order.status} />

            <div style={{ height: 1, background: colors.divider }} className="mx-4" />

            {/* Store row */}
            {order.store && (
              <div
                className="flex items-center gap-3 px-4 py-4"
                style={{ background: colors.surface }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{ background: colors.brand, color: colors.brandTextOnBg }}
                >
                  {order.store.name?.charAt(0)?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: colors.textStrong }}>
                    {order.store.name ?? "Магазин"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>Продавец</p>
                </div>
                {order.store.telegramContactLink && (
                  <a
                    href={order.store.telegramContactLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track.chatStarted(order.storeId, "order")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-opacity hover:opacity-80"
                    style={{ background: colors.brandMuted, color: colors.brand }}
                  >
                    <Send size={11} />
                    Написать
                  </a>
                )}
              </div>
            )}

            <div style={{ height: 1, background: colors.divider }} className="mx-4" />

            {/* Items */}
            <div className="px-4 py-4" style={{ background: colors.surface }}>
              <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
                — Товары · {totalQty} шт
              </div>
              <div className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: colors.surfaceSunken }}
                    >
                      <Package size={16} style={{ color: colors.textDim }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: colors.textStrong }}>
                        {item.title}
                      </p>
                      {item.variantTitle && (
                        <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                          {item.variantTitle}
                        </p>
                      )}
                      <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-[13px] font-bold flex-shrink-0" style={{ color: colors.textStrong }}>
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: colors.divider }} className="mx-4" />

            {/* Delivery */}
            <div className="px-4 py-4" style={{ background: colors.surface }}>
              <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
                — Доставка
              </div>
              {order.deliveryType === DeliveryType.DELIVERY ? (
                <div className="flex items-start gap-2.5">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.brand }} />
                  <div>
                    <p className="text-xs" style={{ color: colors.textStrong }}>
                      {order.deliveryAddress?.street ?? "—"}
                      {order.deliveryAddress?.city ? `, ${order.deliveryAddress.city}` : ""}
                    </p>
                    {order.deliveryAddress?.region && (
                      <p className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>
                        {order.deliveryAddress.region}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs" style={{ color: colors.textStrong }}>Самовывоз</p>
              )}
              {order.buyerNote && (
                <div className="mt-3 pt-3" style={{ borderTop: `1px dashed ${colors.divider}` }}>
                  <p className="text-[10px] mb-1" style={{ color: colors.textMuted }}>Комментарий покупателя</p>
                  <p className="text-xs" style={{ color: colors.textBody }}>{order.buyerNote}</p>
                </div>
              )}
            </div>

            <div style={{ height: 1, background: colors.divider }} className="mx-4" />

            {/* Total */}
            <div className="px-4 py-4" style={{ background: colors.surface }}>
              <div className="text-[10px] tracking-[0.18em] uppercase mb-3" style={{ color: colors.textMuted }}>
                — Итого
              </div>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: colors.textMuted }}>Товары · {totalQty} шт</span>
                <span style={{ color: colors.textBody }}>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs mb-1.5">
                <span style={{ color: colors.textMuted }}>Доставка</span>
                <span style={{ color: colors.textBody }}>{formatPrice(order.deliveryFee)}</span>
              </div>
              <div
                className="flex justify-between items-baseline pt-2.5 mt-2"
                style={{ borderTop: `1px dashed ${colors.divider}` }}
              >
                <span className="text-sm font-bold" style={{ color: colors.textStrong }}>К оплате</span>
                <span className="text-base font-bold" style={{ color: colors.textStrong }}>
                  {formatPrice(order.totalAmount)} сум
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA bar */}
      {order && (
        <div
          className="fixed left-0 right-0 px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md"
          style={{ bottom: 76, zIndex: 51 }}
        >
          <div className="max-w-md mx-auto flex flex-col gap-2">
            {!isCancelled && (
              <button
                onClick={() => {
                  track.chatStarted(order.storeId, "order");
                  setChatOpen(true);
                }}
                className="w-full py-3.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                <MessageSquare size={16} />
                Чат по заказу
              </button>
            )}

            {isCancelled && (
              <Link
                href="/"
                className="w-full py-3.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                К магазинам
              </Link>
            )}

            {order.store?.telegramContactLink && !isCancelled && (
              <a
                href={order.store.telegramContactLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track.chatStarted(order.storeId, "order")}
                className="w-full py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                style={{ background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }}
              >
                <Send size={12} />
                Открыть в Telegram
              </a>
            )}

            {canCancel && !confirmCancel && (
              <button
                onClick={() => setConfirmCancel(true)}
                className="w-full py-2.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ background: "transparent", color: colors.danger, border: `1px solid ${colors.danger}` }}
              >
                Отменить заказ
              </button>
            )}

            {canCancel && confirmCancel && (
              <div
                className="rounded-md p-3.5 flex flex-col gap-2.5"
                style={{ background: colors.surface, border: `1px solid ${colors.danger}` }}
              >
                <p className="text-xs text-center" style={{ color: colors.textStrong }}>
                  Отменить заказ #{order.orderNumber ?? shortId(order.id)}?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-2 rounded-md text-[11px] font-semibold"
                    style={{ background: colors.surfaceSunken, color: colors.textBody }}
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => cancelOrder.mutate({ id: order.id })}
                    disabled={cancelOrder.isPending}
                    className="flex-1 py-2 rounded-md text-[11px] font-semibold disabled:opacity-40"
                    style={{ background: colors.danger, color: "#FFFFFF" }}
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
          title={`Заказ #${order.orderNumber ?? shortId(order.id)}`}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
