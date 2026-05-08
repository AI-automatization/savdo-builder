"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useCheckoutPreview, useConfirmCheckout } from "@/hooks/use-checkout";
import { useCart } from "@/hooks/use-cart";
import { track } from "@/lib/analytics";
import type { CheckoutPreview, CheckoutPreviewItem, CartItem } from "types";
import { ArrowLeft } from "lucide-react";
import { colors } from "@/lib/styles";

type DeliveryMode = "delivery" | "pickup";
type PageStep = "otp-phone" | "otp-code" | "form";
type PaymentId = "cash" | "card" | "online";

type PreviewItemLoose = CheckoutPreviewItem & {
  title?: string;
  productTitleSnapshot?: string;
  variantLabelSnapshot?: string | null;
  lineTotal?: number;
};
type PreviewWithFee = CheckoutPreview & {
  deliveryFee?: number;
  total?: number;
  validItems?: PreviewItemLoose[];
};

const fmt = (n: number | null | undefined) =>
  (typeof n === "number" ? n : Number(n) || 0).toLocaleString("ru-RU");

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const cartItemUnitPrice = (i: CartItem) => {
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

// ── Reusable field style ──────────────────────────────────────────────────────

const fieldStyle = {
  background: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  color: colors.textPrimary,
  outline: "none",
} as const;

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm"
      style={{
        background: "rgba(220,38,38,0.08)",
        border: `1px solid rgba(220,38,38,0.30)`,
        color: colors.danger,
      }}
    >
      {message}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className}`}
      style={{ background: colors.surfaceMuted }}
    />
  );
}

// ── CheckoutStep card ─────────────────────────────────────────────────────────

function CheckoutStep({
  n,
  title,
  action,
  children,
}: {
  n: number;
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div
      className="p-4 md:p-5 rounded-lg"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-2.5 mb-3 md:mb-4">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={{ background: colors.brand, color: colors.brandTextOnBg }}
        >
          {n}
        </div>
        <div className="text-sm font-bold" style={{ color: colors.textStrong }}>
          {title}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="ml-auto text-xs font-semibold"
            style={{ color: colors.brand, background: "transparent", border: "none" }}
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
}

// ── OTP Gate ──────────────────────────────────────────────────────────────────

function OtpGate({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  function handleSendOtp() {
    if (phone.trim().length < 9) return;
    requestOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, purpose: "checkout" },
      { onSuccess: () => setOtpStep("code") },
    );
  }

  function handleVerify() {
    if (code.trim().length < 6) return;
    verifyOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, code, purpose: "checkout" },
      { onSuccess: () => onSuccess() },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          {otpStep === "phone" ? "Введите телефон" : "Введите код"}
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
          {otpStep === "phone"
            ? "Для оформления заказа нужно подтвердить номер"
            : `Код отправлен в Telegram на +998 ${phone}`}
        </p>
      </div>

      {otpStep === "phone" ? (
        <>
          <div>
            <label
              className="text-[11px] font-medium block mb-1.5"
              style={{ color: colors.textMuted }}
            >
              Телефон
            </label>
            <div className="flex items-center rounded-xl overflow-hidden" style={fieldStyle}>
              <span
                className="px-3 text-sm flex-shrink-0 h-[44px] flex items-center"
                style={{ borderRight: `1px solid ${colors.border}`, color: colors.textMuted }}
              >
                +998
              </span>
              <input
                type="tel"
                placeholder="90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                className="flex-1 px-3 h-[44px] text-sm bg-transparent"
                style={{ color: colors.textPrimary, outline: "none" }}
              />
            </div>
          </div>
          <ErrorBanner message={requestOtp.error?.message} />
          <button
            disabled={phone.trim().length < 9 || requestOtp.isPending}
            onClick={handleSendOtp}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {requestOtp.isPending ? "Отправка..." : "Получить код"}
          </button>
        </>
      ) : (
        <>
          <div>
            <label
              className="text-[11px] font-medium block mb-1.5"
              style={{ color: colors.textMuted }}
            >
              Код из сообщения
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              maxLength={6}
              className="w-full px-4 h-[52px] rounded-xl text-center text-xl font-bold"
              style={{ ...fieldStyle, letterSpacing: "0.5em" }}
            />
          </div>
          <ErrorBanner message={verifyOtp.error?.message} />
          <button
            disabled={code.trim().length < 6 || verifyOtp.isPending}
            onClick={handleVerify}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {verifyOtp.isPending ? "Проверка..." : "Подтвердить"}
          </button>
          <button
            onClick={() => setOtpStep("phone")}
            className="text-xs text-center"
            style={{ color: colors.textMuted }}
          >
            ← Изменить номер
          </button>
        </>
      )}
    </div>
  );
}

// ── Payment options ───────────────────────────────────────────────────────────

const paymentMethods: {
  id: PaymentId;
  label: string;
  sub: string;
  disabled: boolean;
  badge?: string;
}[] = [
  {
    id: "cash",
    label: "Наличные курьеру",
    sub: "оплата при получении",
    disabled: false,
  },
  {
    id: "card",
    label: "Картой курьеру",
    sub: "UzCard / Humo POS-терминал",
    disabled: false,
  },
  {
    id: "online",
    label: "Online",
    sub: "Payme / Click",
    disabled: true,
    badge: "Скоро",
  },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const isAuthed = !!user?.isPhoneVerified;
  // Lazy init avoids a 1-frame flash of the OTP form on hydration:
  // we already know we have a session if there's a token in storage, even if
  // the AuthContext hasn't populated `user` yet.
  const [pageStep, setPageStep] = useState<PageStep>(() => {
    if (typeof window === "undefined") return "otp-phone";
    return localStorage.getItem("savdo_access_token") ? "form" : "otp-phone";
  });

  useEffect(() => {
    if (user?.isPhoneVerified && pageStep !== "form") setPageStep("form");
  }, [user?.isPhoneVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useCheckoutPreview();
  const confirm = useConfirmCheckout();
  const { data: cart } = useCart();
  const cartItems = cart?.items ?? [];

  // Delivery
  const [mode, setMode] = useState<DeliveryMode>("delivery");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Ташкент");

  // Contacts editing
  const [editContacts, setEditContacts] = useState(false);
  const [contactName, setContactName] = useState(
    (user as unknown as { name?: string })?.name ?? "",
  );
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentId>("cash");

  // Comment
  const [comment, setComment] = useState("");

  // Error
  const [apiError, setApiError] = useState<string>();

  const previewData = preview.data as PreviewWithFee | undefined;
  const previewItems: PreviewItemLoose[] =
    previewData?.items ?? previewData?.validItems ?? [];
  const storeDeliveryFee = previewData?.deliveryFee ?? 0;
  const deliveryFee = mode === "delivery" ? storeDeliveryFee : 0;
  const cartSubtotal = cartItems.reduce(
    (s, it) => s + cartItemUnitPrice(it) * (it.quantity || 0),
    0,
  );
  const rawSubtotal = toNum(previewData?.subtotal);
  const subtotal = rawSubtotal > 0 ? rawSubtotal : cartSubtotal;
  const total = subtotal + deliveryFee;

  // Redirect away if cart becomes empty after preview loads
  useEffect(() => {
    if (
      pageStep === "form" &&
      preview.isSuccess &&
      previewItems.length === 0 &&
      cartItems.length === 0
    ) {
      router.replace("/cart");
    }
  }, [pageStep, preview.isSuccess, previewItems.length, cartItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analytics
  useEffect(() => {
    if (previewData) {
      track.checkoutStarted(previewData.storeId, previewItems.length, subtotal);
    }
  }, [previewData?.storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync contact fields when user loads
  useEffect(() => {
    if (user) {
      setContactName((user as unknown as { name?: string })?.name ?? "");
      setContactPhone(user.phone ?? "");
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit =
    pageStep === "form" &&
    !confirm.isPending &&
    (mode === "pickup" || (street.trim() !== "" && city.trim() !== ""));

  async function handleConfirm() {
    if (!canSubmit) return;
    setApiError(undefined);
    try {
      const trimmedName = contactName.trim();
      const trimmedPhone = contactPhone.trim();
      const order = await confirm.mutateAsync({
        deliveryAddress:
          mode === "pickup"
            ? { street: "Самовывоз", city: city.trim() || "—" }
            : { street, city },
        buyerNote: comment || undefined,
        deliveryFee,
        customerFullName: trimmedName || undefined,
        customerPhone: trimmedPhone || undefined,
      });
      const storeId = previewData?.storeId ?? cart?.storeId ?? "";
      if (storeId) track.orderCreated(storeId, order.id, order.totalAmount, "COD");
      router.replace(`/orders/${order.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setApiError(
        err?.response?.data?.message ?? "Не удалось оформить заказ. Попробуйте ещё раз.",
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  }

  // Display name for contacts step
  const displayName = contactName.trim() || (user as unknown as { name?: string })?.name || "";
  const displayPhone = contactPhone || user?.phone || "";
  const contactsLine =
    displayName && displayPhone
      ? `${displayName} · ${displayPhone}`
      : displayPhone || displayName || "—";

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-20 px-4 py-3 flex items-center gap-3"
        style={{
          background: colors.bg,
          borderBottom: `1px solid ${colors.divider}`,
        }}
      >
        <Link
          href="/cart"
          className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1
          className="flex-1 text-base font-bold tracking-tight"
          style={{ color: colors.textStrong }}
        >
          Оформление заказа
        </h1>
      </div>

      {/* ── OTP gate ───────────────────────────────────────────────────────── */}
      {pageStep !== "form" && (
        <div className="max-w-md mx-auto px-4 pt-6 pb-10">
          <div
            className="rounded-2xl p-6"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <OtpGate onSuccess={() => setPageStep("form")} />
          </div>
        </div>
      )}

      {/* ── Main form ──────────────────────────────────────────────────────── */}
      {pageStep === "form" && (
        <div className="md:grid md:grid-cols-[7fr_5fr] md:gap-6 md:p-6 max-w-5xl mx-auto">
          {/* Left column — 3 step cards */}
          <div className="px-4 pt-4 pb-4 md:px-0 md:pt-0 flex flex-col gap-3">
            {/* ── Step 1: Контакты ─────────────────────────────────────────── */}
            <CheckoutStep
              n={1}
              title="Контакты"
              action={
                editContacts
                  ? { label: "Готово", onClick: () => setEditContacts(false) }
                  : { label: "Изменить", onClick: () => setEditContacts(true) }
              }
            >
              {editContacts ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[11px] font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Имя
                    </label>
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-3 h-[44px] text-sm rounded-lg outline-none"
                      style={{
                        background: colors.surfaceMuted,
                        border: `1px solid ${colors.border}`,
                        color: colors.textBody,
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[11px] font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Телефон
                    </label>
                    <input
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 h-[44px] text-sm rounded-lg outline-none"
                      style={{
                        background: colors.surfaceMuted,
                        border: `1px solid ${colors.border}`,
                        color: colors.textBody,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm" style={{ color: colors.textBody }}>
                  {contactsLine}
                </div>
              )}
            </CheckoutStep>

            {/* ── Step 2: Доставка ─────────────────────────────────────────── */}
            <CheckoutStep n={2} title="Доставка">
              {/* Delivery/Pickup toggle */}
              <div
                className="flex gap-2 p-1 rounded-xl mb-3"
                style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
              >
                {(["delivery", "pickup"] as DeliveryMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={
                      mode === m
                        ? { background: colors.brand, color: colors.brandTextOnBg }
                        : { color: colors.textMuted, background: "transparent" }
                    }
                  >
                    {m === "delivery" ? "Доставка" : "Самовывоз"}
                  </button>
                ))}
              </div>

              {mode === "delivery" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[11px] font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Улица, дом, квартира *
                    </label>
                    <input
                      type="text"
                      placeholder="ул. Навои 15, кв. 3"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3 h-[44px] text-sm rounded-md outline-none"
                      style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.textBody,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[11px] font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      Город *
                    </label>
                    <input
                      type="text"
                      placeholder="Ташкент"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 h-[44px] text-sm rounded-md outline-none"
                      style={{
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        color: colors.textBody,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className="p-3.5 rounded-md text-sm"
                  style={{
                    background: colors.surfaceMuted,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <p className="font-medium text-xs" style={{ color: colors.textStrong }}>
                    Адрес уточните у продавца
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                    Свяжитесь через Telegram для согласования
                  </p>
                </div>
              )}
            </CheckoutStep>

            {/* ── Step 3: Оплата ───────────────────────────────────────────── */}
            <CheckoutStep n={3} title="Оплата">
              <div className="space-y-2 md:grid md:grid-cols-3 md:gap-2.5 md:space-y-0">
                {paymentMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    disabled={m.disabled}
                    onClick={() => setPaymentMethod(m.id)}
                    className="text-left p-3.5 rounded-md transition disabled:cursor-not-allowed"
                    style={{
                      background: colors.surface,
                      border: `${paymentMethod === m.id ? 2 : 1}px ${m.disabled ? "dashed" : "solid"} ${paymentMethod === m.id ? colors.brand : colors.border}`,
                      opacity: m.disabled ? 0.55 : 1,
                    }}
                  >
                    <div
                      className="text-xs font-semibold flex items-center gap-1.5"
                      style={{
                        color: m.disabled ? colors.textMuted : colors.textStrong,
                      }}
                    >
                      {m.label}
                      {m.badge && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{
                            background: colors.brandMuted,
                            color: colors.brand,
                          }}
                        >
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[10px] mt-0.5"
                      style={{ color: colors.textMuted }}
                    >
                      {m.sub}
                    </div>
                  </button>
                ))}
              </div>

              {/* Courier comment */}
              <div className="mt-4">
                <div
                  className="text-[11px] mb-1.5"
                  style={{ color: colors.textMuted }}
                >
                  Комментарий курьеру (необязательно)
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Например: позвонить за 10 минут"
                  rows={2}
                  className="w-full px-3 py-2.5 text-xs rounded resize-none outline-none"
                  style={{
                    background: colors.surface,
                    border: `1px solid ${colors.border}`,
                    color: colors.textBody,
                  }}
                />
              </div>
            </CheckoutStep>

            {/* Stock warnings */}
            {(preview.data?.stockWarnings?.length ?? 0) > 0 && (
              <div
                className="px-3 py-2.5 rounded-xl text-xs"
                style={{
                  background: "rgba(217,119,6,0.10)",
                  border: `1px solid rgba(217,119,6,0.28)`,
                  color: colors.warning,
                }}
              >
                Некоторые товары заканчиваются. Вернитесь в корзину и скорректируйте количество.
              </div>
            )}

            <ErrorBanner message={apiError} />
          </div>

          {/* Right column — summary sidebar */}
          <div className="px-4 pb-4 md:px-0 md:pb-0">
            <div
              className="md:sticky md:top-5 p-4 md:p-5 rounded-lg"
              style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <div
                className="text-[10px] tracking-[0.18em] uppercase mb-3.5"
                style={{ color: colors.textMuted }}
              >
                — Ваш заказ
              </div>

              {/* Mini items */}
              {preview.isLoading ? (
                <div className="space-y-3 pb-3 mb-3" style={{ borderBottom: `1px solid ${colors.divider}` }}>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <div
                  className="space-y-3 pb-3 mb-3"
                  style={{ borderBottom: `1px solid ${colors.divider}` }}
                >
                  {cartItems.map((item) => {
                    const productRaw = item as unknown as {
                      product?: { title?: string; mediaUrl?: string };
                    };
                    const title = productRaw.product?.title ?? "Товар";
                    const mediaUrl = productRaw.product?.mediaUrl ?? null;
                    const unit = cartItemUnitPrice(item);
                    const lineSubtotal =
                      typeof item.subtotal === "number"
                        ? item.subtotal
                        : unit * (item.quantity || 0);
                    return (
                      <div key={item.id} className="flex gap-2.5">
                        <div
                          className="w-12 h-12 flex-shrink-0 rounded overflow-hidden"
                          style={{ background: colors.surfaceSunken }}
                        >
                          {mediaUrl && (
                            <Image
                              src={mediaUrl}
                              alt=""
                              width={100}
                              height={100}
                              className="object-cover w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div
                            className="text-[11px] line-clamp-1"
                            style={{ color: colors.textStrong }}
                          >
                            {title}
                          </div>
                          <div
                            className="text-[10px]"
                            style={{ color: colors.textMuted }}
                          >
                            ×{item.quantity}
                            {item.variant ? ` · ${item.variant.title}` : ""}
                          </div>
                        </div>
                        <div
                          className="text-[11px] font-semibold flex-shrink-0"
                          style={{ color: colors.textStrong }}
                        >
                          {fmt(lineSubtotal)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Breakdown */}
              <div
                className="flex justify-between text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                <span>Подытог</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div
                className="flex justify-between text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                <span>Доставка</span>
                {deliveryFee > 0 ? (
                  <span>{fmt(deliveryFee)}</span>
                ) : (
                  <span style={{ color: colors.success }}>Бесплатно</span>
                )}
              </div>
              <div
                className="flex justify-between text-base font-bold pt-2.5 mt-1.5"
                style={{
                  color: colors.textStrong,
                  borderTop: `1px dashed ${colors.divider}`,
                }}
              >
                <span>К оплате</span>
                <span>{fmt(total)} сум</span>
              </div>

              {/* Desktop submit */}
              <button
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="hidden md:block w-full mt-4 py-3.5 text-sm font-bold rounded transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                {confirm.isPending ? "Оформляем..." : "Подтвердить заказ →"}
              </button>
              <div
                className="hidden md:block text-[10px] mt-2 text-center"
                style={{ color: colors.textMuted }}
              >
                Нажимая «Подтвердить», вы соглашаетесь с условиями
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile sticky bottom CTA ────────────────────────────────────────── */}
      {pageStep === "form" && (
        <div
          className="md:hidden sticky bottom-0 z-30 p-3 border-t"
          style={{ background: colors.surfaceMuted, borderColor: colors.divider }}
        >
          <button
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="w-full py-3.5 text-sm font-bold rounded disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {confirm.isPending
              ? "Оформляем..."
              : `Подтвердить заказ · ${fmt(total)} сум`}
          </button>
          <div
            className="text-[10px] mt-1.5 text-center"
            style={{ color: colors.textMuted }}
          >
            Нажимая «Подтвердить», вы соглашаетесь с условиями
          </div>
        </div>
      )}

      <BottomNavBar active="cart" />
    </div>
  );
}
