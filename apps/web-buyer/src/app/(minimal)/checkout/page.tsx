"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { ArrowLeft, AlertCircle } from "lucide-react";
import { colors, dangerTint, warningTint } from "@/lib/styles";
import { PhoneInput, formatUzPhone, isValidUzPhone } from "@/components/PhoneInput";
import { useTranslation } from "@/lib/i18n";

type DeliveryMode = "delivery" | "pickup";
type PageStep = "otp-phone" | "otp-code" | "form";
type PaymentId = "cash" | "card" | "online";

type PreviewItemLoose = CheckoutPreviewItem & {
  title?: string;
  productTitleSnapshot?: string;
  variantLabelSnapshot?: string | null;
  lineTotal?: number;
};
// WB-B01: `CheckoutPreview` теперь канонически несёт `deliveryFee` + `total`
// (API-CHECKOUT-PREVIEW-DELIVERY-FEE-001). Локальный extension оставлен только
// под legacy-поле `validItems` — старые ответы preview отдавали его вместо `items`.
type PreviewWithFee = CheckoutPreview & {
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

const cartItemUnitPrice = (i: CartItem) =>
  toNum(i.variant?.salePriceOverride) ||
  toNum(i.variant?.priceOverride) ||
  toNum(i.salePriceSnapshot) ||
  toNum(i.unitPrice) ||
  toNum(i.unitPriceSnapshot) ||
  toNum(i.product?.salePrice) ||
  toNum(i.product?.basePrice) ||
  0;

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
        background: dangerTint(0.08),
        border: `1px solid ${dangerTint(0.30)}`,
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
  const { t } = useTranslation();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  function handleSendOtp() {
    if (!isValidUzPhone(phone)) return;
    requestOtp.mutate(
      { phone, purpose: "checkout" },
      { onSuccess: () => setOtpStep("code") },
    );
  }

  function handleVerify() {
    if (code.trim().length < 6) return;
    verifyOtp.mutate(
      { phone, code, purpose: "checkout" },
      { onSuccess: () => onSuccess() },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          {otpStep === "phone" ? t('checkout.otp.enterPhone') : t('checkout.otp.enterCode')}
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
          {otpStep === "phone"
            ? t('checkout.otp.phoneHint')
            : t('checkout.otp.codeHint', { phone: formatUzPhone(phone) })}
        </p>
      </div>

      {otpStep === "phone" ? (
        <>
          <div>
            <label
              className="text-[11px] font-medium block mb-1.5"
              style={{ color: colors.textMuted }}
            >
              {t('checkout.otp.phoneLabel')}
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onEnter={handleSendOtp}
              ariaLabel={t('checkout.otp.phoneLabel')}
              className="w-full px-3 h-[44px] text-sm rounded-xl"
              style={{ ...fieldStyle, color: colors.textPrimary }}
            />
          </div>
          <ErrorBanner message={requestOtp.error?.message} />
          <button
            disabled={!isValidUzPhone(phone) || requestOtp.isPending}
            onClick={handleSendOtp}
            className="w-full py-3.5 rounded text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {requestOtp.isPending ? t('checkout.otp.sending') : t('checkout.otp.getCode')}
          </button>
        </>
      ) : (
        <>
          <div>
            <label
              className="text-[11px] font-medium block mb-1.5"
              style={{ color: colors.textMuted }}
            >
              {t('checkout.otp.codeLabel')}
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
            className="w-full py-3.5 rounded text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {verifyOtp.isPending ? t('checkout.otp.verifying') : t('checkout.otp.confirm')}
          </button>
          <button
            onClick={() => setOtpStep("phone")}
            className="text-xs text-center"
            style={{ color: colors.textMuted }}
          >
            {t('checkout.otp.changePhone')}
          </button>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

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

  // Сессия протухла (токен в storage был, но невалиден — confirm/preview дал
  // 401, auth:expired почистил токен). Возвращаем на OTP-шаг, иначе юзер застрял
  // бы на форме, где «Подтвердить» молча падает.
  useEffect(() => {
    function onExpired() { setPageStep("otp-phone"); }
    window.addEventListener("savdo:auth:expired", onExpired);
    return () => window.removeEventListener("savdo:auth:expired", onExpired);
  }, []);

  const preview = useCheckoutPreview();
  const confirm = useConfirmCheckout();
  const { data: cart } = useCart();
  const cartItems = cart?.items ?? [];

  // Delivery
  const [mode, setMode] = useState<DeliveryMode>("delivery");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState(t('checkout.delivery.cityPlaceholder'));

  // Contacts editing
  const [editContacts, setEditContacts] = useState(false);
  const [contactName, setContactName] = useState(user?.name ?? "");
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

  // Payment methods — defined inside component to access t().
  // useMemo([t]): t is stable per locale, so the array rebuilds only on language switch.
  const paymentMethods: {
    id: PaymentId;
    label: string;
    sub: string;
    disabled: boolean;
    badge?: string;
  }[] = useMemo(() => [
    {
      id: "cash",
      label: t('checkout.payment.cashLabel'),
      sub: t('checkout.payment.cashSub'),
      disabled: false,
    },
    {
      // SEV-1 от WEB-AUDIT-SYNC-IDEOLOGY-001: card option был selectable, но
      // `paymentMethod` НИКОГДА не отправлялся в API (CheckoutConfirmRequest в
      // packages/types не имеет поля). Misleading UI. Disabled до тех пор пока
      // Полат не закроет API-CHECKOUT-PAYMENT-METHOD-001.
      id: "card",
      label: t('checkout.payment.cardLabel'),
      sub: t('checkout.payment.cardSub'),
      disabled: true,
      badge: t('checkout.payment.comingSoon'),
    },
    {
      id: "online",
      label: t('checkout.payment.onlineLabel'),
      sub: t('checkout.payment.onlineSub'),
      disabled: true,
      badge: t('checkout.payment.comingSoon'),
    },
  ], [t]);

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
      setContactName(user?.name ?? "");
      setContactPhone(user.phone ?? "");
    }
  }, [user?.phone]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit =
    pageStep === "form" &&
    !confirm.isPending &&
    (mode === "pickup" || (street.trim() !== "" && city.trim() !== ""));

  // Синхронный замок: disabled/isPending не успевают перерисоваться между двумя
  // быстрыми тапами на мобиле, и mutateAsync не дедуплицирует — без замка можно
  // создать два заказа (нарушение INV-C03).
  const confirming = useRef(false);

  async function handleConfirm() {
    if (!canSubmit || confirming.current) return;
    confirming.current = true;
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
        err?.response?.data?.message ?? t('checkout.submitError'),
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    } finally {
      confirming.current = false;
    }
  }

  // Display name for contacts step
  const displayName = contactName.trim() || user?.name || "";
  const displayPhone = formatUzPhone(contactPhone || user?.phone || "");
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
          {t('checkout.title')}
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

      {/* ── Preview error ──────────────────────────────────────────────────── */}
      {pageStep === "form" && preview.isError && (
        <div className="max-w-md mx-auto px-4 pt-6 pb-10">
          <div
            className="rounded-2xl p-6 flex flex-col items-center text-center gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <AlertCircle size={32} style={{ color: colors.danger }} />
            <h2 className="text-base font-bold" style={{ color: colors.textStrong }}>
              {t('checkout.previewError')}
            </h2>
            <p className="text-sm" style={{ color: colors.textMuted }}>
              {t('checkout.previewErrorDesc')}
            </p>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => preview.refetch()}
                disabled={preview.isFetching}
                className="px-4 py-2.5 text-sm font-bold rounded-lg disabled:opacity-50"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                {preview.isFetching ? t('checkout.previewLoading') : t('common.retry')}
              </button>
              <Link
                href="/cart"
                className="px-4 py-2.5 text-sm font-semibold rounded-lg"
                style={{
                  background: colors.surfaceMuted,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              >
                {t('checkout.toCart')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main form ──────────────────────────────────────────────────────── */}
      {pageStep === "form" && !preview.isError && (
        <div className="md:grid md:grid-cols-[7fr_5fr] md:gap-6 md:p-6 max-w-5xl mx-auto">
          {/* Left column — 3 step cards */}
          <div className="px-4 pt-4 pb-4 md:px-0 md:pt-0 flex flex-col gap-3">
            {/* ── Step 1: Контакты ─────────────────────────────────────────── */}
            <CheckoutStep
              n={1}
              title={t('checkout.step.contacts')}
              action={
                editContacts
                  ? { label: t('checkout.done'), onClick: () => setEditContacts(false) }
                  : { label: t('common.edit'), onClick: () => setEditContacts(true) }
              }
            >
              {editContacts ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-[11px] font-medium"
                      style={{ color: colors.textMuted }}
                    >
                      {t('checkout.nameLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('checkout.namePlaceholder')}
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
                      {t('checkout.phoneLabel')}
                    </label>
                    <PhoneInput
                      value={contactPhone}
                      onChange={setContactPhone}
                      ariaLabel={t('checkout.phoneLabel')}
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
            <CheckoutStep n={2} title={t('checkout.step.delivery')}>
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
                    {m === "delivery" ? t('checkout.delivery.modeDelivery') : t('checkout.delivery.modePickup')}
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
                      {t('checkout.delivery.streetLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('checkout.delivery.streetPlaceholder')}
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
                      {t('checkout.delivery.cityLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('checkout.delivery.cityPlaceholder')}
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
                    {t('checkout.delivery.pickupTitle')}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                    {t('checkout.delivery.pickupHint')}
                  </p>
                </div>
              )}
            </CheckoutStep>

            {/* ── Step 3: Оплата ───────────────────────────────────────────── */}
            <CheckoutStep n={3} title={t('checkout.step.payment')}>
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
                  {t('checkout.commentLabel')}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('checkout.commentPlaceholder')}
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
                  background: warningTint(0.10),
                  border: `1px solid ${warningTint(0.28)}`,
                  color: colors.warning,
                }}
              >
                {t('checkout.stockWarning')}
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
                {t('checkout.orderSummaryLabel')}
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
                    const title = item.product?.title ?? t('cart.productFallback');
                    const mediaUrl = item.product?.mediaUrl ?? null;
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
                <span>{t('cart.subtotal')}</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div
                className="flex justify-between text-xs mb-1.5"
                style={{ color: colors.textMuted }}
              >
                <span>{t('cart.delivery')}</span>
                {deliveryFee > 0 ? (
                  <span>{fmt(deliveryFee)}</span>
                ) : (
                  <span style={{ color: colors.success }}>{t('cart.deliveryFree')}</span>
                )}
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

              {/* Desktop submit */}
              <button
                onClick={handleConfirm}
                disabled={!canSubmit}
                className="hidden md:block w-full mt-4 py-3.5 text-sm font-bold rounded transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                {confirm.isPending ? t('checkout.submitting') : t('checkout.placeOrder')}
              </button>
              <div
                className="hidden md:block text-[10px] mt-2 text-center"
                style={{ color: colors.textMuted }}
              >
                {t('checkout.legalPrefix')}{" "}
                <Link href="/offer" className="underline" style={{ color: colors.textBody }}>
                  {t('checkout.legalOffer')}
                </Link>{" "}
                {t('checkout.legalAnd')}{" "}
                <Link href="/privacy" className="underline" style={{ color: colors.textBody }}>
                  {t('checkout.legalPrivacy')}
                </Link>
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
              ? t('checkout.submitting')
              : t('checkout.placeOrderWithAmount', { amount: fmt(total) })}
          </button>
          <div
            className="text-[10px] mt-1.5 text-center"
            style={{ color: colors.textMuted }}
          >
            {t('checkout.legalPrefix')}{" "}
            <Link href="/offer" className="underline" style={{ color: colors.textBody }}>
              {t('checkout.legalOffer')}
            </Link>{" "}
            {t('checkout.legalAnd')}{" "}
            <Link href="/privacy" className="underline" style={{ color: colors.textBody }}>
              {t('checkout.legalPrivacy')}
            </Link>
          </div>
        </div>
      )}

      <BottomNavBar active="cart" />
    </div>
  );
}
