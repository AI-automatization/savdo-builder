"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuth } from "@/lib/auth/context";
import { useRequestOtp, useVerifyOtp } from "@/hooks/use-auth";
import { useCheckoutPreview, useConfirmCheckout } from "@/hooks/use-checkout";
import { useCart } from "@/hooks/use-cart";
import { track } from "@/lib/analytics";
import type { CheckoutPreview, CheckoutPreviewItem, CartItem } from "types";
import { ArrowLeft, Truck, Package as PackageIcon, MapPin, NotebookPen, Banknote } from "lucide-react";
import { colors } from "@/lib/styles";

type DeliveryMode = "delivery" | "pickup";
type PageStep = "otp-phone" | "otp-code" | "form";

type PreviewItemLoose = CheckoutPreviewItem & { title?: string; productTitleSnapshot?: string; variantLabelSnapshot?: string | null; lineTotal?: number };
type PreviewWithFee = CheckoutPreview & {
  deliveryFee?: number;
  total?: number;
  validItems?: PreviewItemLoose[];
};

const fmt = (n: number | null | undefined) =>
  (typeof n === "number" ? n : Number(n) || 0).toLocaleString("ru-RU");

const toNum = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") { const n = Number(v); return Number.isFinite(n) ? n : 0; }
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

const fieldStyle = {
  background: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  color: colors.textPrimary,
  outline: 'none',
} as const;

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

function Field({
  label, prefix, type = "text", placeholder, value, onChange, textarea,
}: {
  label: string; prefix?: string; type?: string; placeholder?: string;
  value: string; onChange: (v: string) => void; textarea?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium" style={{ color: colors.textMuted }}>{label}</label>
      <div className="flex items-center rounded-xl overflow-hidden" style={fieldStyle}>
        {prefix && (
          <span
            className="px-3 text-sm flex-shrink-0 h-[44px] flex items-center"
            style={{ borderRight: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            {prefix}
          </span>
        )}
        {textarea ? (
          <textarea
            rows={2}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 py-3 text-sm bg-transparent resize-none"
            style={{ color: colors.textPrimary, outline: "none" }}
          />
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 px-3 h-[44px] text-sm bg-transparent"
            style={{ color: colors.textPrimary, outline: "none" }}
          />
        )}
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm"
      style={{ background: 'rgba(220,38,38,0.08)', border: `1px solid rgba(220,38,38,0.30)`, color: colors.danger }}
    >
      {message}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl ${className}`} style={{ background: colors.surfaceMuted }} />;
}

function OtpGate({ onSuccess }: { onSuccess: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");

  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  function handleSendOtp() {
    if (phone.trim().length < 9) return;
    requestOtp.mutate(
      { phone: `+998${phone.replace(/\s/g, "")}`, purpose: "checkout" },
      { onSuccess: () => setStep("code") },
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
          {step === "phone" ? "Введите телефон" : "Введите код"}
        </h2>
        <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
          {step === "phone"
            ? "Для оформления заказа нужно подтвердить номер"
            : `Код отправлен в Telegram на +998 ${phone}`}
        </p>
      </div>

      {step === "phone" ? (
        <>
          <div>
            <label className="text-[11px] font-medium block mb-1.5" style={{ color: colors.textMuted }}>Телефон</label>
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
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendOtp()}
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
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {requestOtp.isPending ? "Отправка..." : "Получить код"}
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="text-[11px] font-medium block mb-1.5" style={{ color: colors.textMuted }}>Код из сообщения</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              maxLength={6}
              className="w-full px-4 h-[52px] rounded-xl text-center text-xl font-bold tracking-[0.5em]"
              style={{ ...fieldStyle, letterSpacing: "0.5em" }}
            />
          </div>
          <ErrorBanner message={verifyOtp.error?.message} />
          <button
            disabled={code.trim().length < 6 || verifyOtp.isPending}
            onClick={handleVerify}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {verifyOtp.isPending ? "Проверка..." : "Подтвердить"}
          </button>
          <button
            onClick={() => setStep("phone")}
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

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();

  const isAuthed = !!user?.isPhoneVerified;
  const [step, setStep] = useState<PageStep>(isAuthed ? "form" : "otp-phone");

  useEffect(() => {
    if (user?.isPhoneVerified && step !== "form") setStep("form");
  }, [user?.isPhoneVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = useCheckoutPreview();
  const confirm = useConfirmCheckout();
  const { data: cart } = useCart();
  const cartItems = cart?.items ?? [];

  const [mode, setMode] = useState<DeliveryMode>("delivery");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("Ташкент");
  const [note, setNote] = useState("");
  const [apiError, setApiError] = useState<string>();

  const previewData = preview.data as PreviewWithFee | undefined;
  const previewItems: PreviewItemLoose[] = previewData?.items ?? previewData?.validItems ?? [];
  const storeDeliveryFee = previewData?.deliveryFee ?? 0;
  const deliveryFee = mode === "delivery" ? storeDeliveryFee : 0;
  const cartSubtotal = cartItems.reduce((s, it) => s + cartItemUnitPrice(it) * (it.quantity || 0), 0);
  const rawSubtotal = toNum(previewData?.subtotal);
  const subtotal = rawSubtotal > 0 ? rawSubtotal : cartSubtotal;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    if (
      step === "form" &&
      preview.isSuccess &&
      previewItems.length === 0 &&
      cartItems.length === 0
    ) {
      router.replace("/cart");
    }
  }, [step, preview.isSuccess, previewItems.length, cartItems.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (previewData) {
      track.checkoutStarted(previewData.storeId, previewItems.length, subtotal);
    }
  }, [previewData?.storeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSubmit =
    step === "form" &&
    !confirm.isPending &&
    (mode === "pickup" || (street.trim() !== "" && city.trim() !== ""));

  async function handleConfirm() {
    if (!canSubmit) return;
    setApiError(undefined);
    try {
      const order = await confirm.mutateAsync({
        deliveryAddress: mode === "pickup"
          ? { street: "Самовывоз", city: city.trim() || "—" }
          : { street, city },
        buyerNote: note || undefined,
        deliveryFee,
      });
      const storeId = previewData?.storeId ?? cart?.storeId ?? "";
      if (storeId) track.orderCreated(storeId, order.id, order.totalAmount, "COD");
      router.replace(`/orders/${order.id}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setApiError(err?.response?.data?.message ?? "Не удалось оформить заказ. Попробуйте ещё раз.");
      if (typeof window !== "undefined") {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    }
  }

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-5 pb-44 md:pb-12">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/cart"
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors hover:bg-black/5"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="flex-1 text-xl sm:text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
            Оформление заказа
          </h1>
        </div>

        {step !== "form" && (
          <div className="rounded-2xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <OtpGate onSuccess={() => setStep("form")} />
          </div>
        )}

        {step === "form" && (
          <div className="flex flex-col gap-4">
            {/* Delivery toggle */}
            <div
              className="flex gap-2 p-1 rounded-2xl"
              style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
            >
              {(["delivery", "pickup"] as DeliveryMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={
                    mode === m
                      ? { background: colors.accent, color: colors.accentTextOnBg }
                      : { color: colors.textMuted }
                  }
                >
                  {m === "delivery" ? <Truck size={16} /> : <PackageIcon size={16} />}
                  {m === "delivery" ? "Доставка" : "Самовывоз"}
                </button>
              ))}
            </div>

            {/* Delivery address */}
            {mode === "delivery" && (
              <Section label="Адрес доставки" icon={<MapPin size={16} />}>
                <Field label="Улица, дом, квартира *" placeholder="ул. Навои 15, кв. 3"
                  value={street} onChange={setStreet} />
                <Field label="Город *" placeholder="Ташкент"
                  value={city} onChange={setCity} />
                <Field label="Комментарий к заказу" placeholder="Подъезд, этаж, ориентир..."
                  value={note} onChange={setNote} textarea />
              </Section>
            )}

            {mode === "pickup" && (
              <Section label="Самовывоз" icon={<PackageIcon size={16} />}>
                <div className="flex items-start gap-3 py-1">
                  <span style={{ color: colors.accent }} className="mt-0.5">
                    <MapPin size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Адрес уточните у продавца</p>
                    <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>Свяжитесь через Telegram для согласования</p>
                  </div>
                </div>
                <Field label="Комментарий" placeholder="Удобное время самовывоза..."
                  value={note} onChange={setNote} textarea />
              </Section>
            )}

            {/* Payment */}
            <Section label="Оплата" icon={<Banknote size={16} />}>
              <div
                className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ border: `2px solid ${colors.accent}` }}
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.accent }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Наличными при получении</p>
                  <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>Cash on Delivery</p>
                </div>
                <Banknote size={18} style={{ color: colors.accent }} />
              </div>
            </Section>

            {/* Order items */}
            <Section label="Состав заказа" icon={<NotebookPen size={16} />}>
              {preview.isLoading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                cartItems.map((it) => {
                  const label = (it as unknown as { product?: { title?: string } }).product?.title ?? "Товар";
                  const variantLabel = it.variant?.title ?? null;
                  const unit = cartItemUnitPrice(it);
                  const lineTotal = unit * (it.quantity || 0);
                  return (
                    <div key={it.id} className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: colors.textPrimary }}>{label}</p>
                        {variantLabel && (
                          <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>{variantLabel}</p>
                        )}
                        <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>× {it.quantity}</p>
                      </div>
                      <span className="text-sm font-medium flex-shrink-0" style={{ color: colors.accent }}>
                        {fmt(lineTotal)} сум
                      </span>
                    </div>
                  );
                })
              )}

              {(preview.data?.stockWarnings?.length ?? 0) > 0 && (
                <div
                  className="px-3 py-2 rounded-xl text-xs"
                  style={{ background: 'rgba(217,119,6,0.10)', border: `1px solid rgba(217,119,6,0.28)`, color: colors.warning }}
                >
                  Некоторые товары заканчиваются. Вернитесь в корзину и скорректируйте количество.
                </div>
              )}
            </Section>

            {/* Summary */}
            <div
              className="rounded-2xl px-4 py-3 flex flex-col gap-2"
              style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: colors.textDim }}>Итого</p>
              {preview.isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Товары</span>
                    <span style={{ color: colors.textPrimary }}>{fmt(subtotal)} сум</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.textMuted }}>Доставка</span>
                    {deliveryFee > 0
                      ? <span style={{ color: colors.textPrimary }}>{fmt(deliveryFee)} сум</span>
                      : <span style={{ color: colors.success }}>Бесплатно</span>}
                  </div>
                  <div
                    className="flex justify-between pt-2 mt-1"
                    style={{ borderTop: `1px solid ${colors.divider}` }}
                  >
                    <span className="text-base font-semibold" style={{ color: colors.textPrimary }}>К оплате</span>
                    <span className="text-base font-bold" style={{ color: colors.accent }}>
                      {fmt(total)} сум
                    </span>
                  </div>
                </>
              )}
            </div>

            <ErrorBanner message={apiError} />
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {step === "form" && (
        <div className="fixed left-0 right-0 px-4 md:bottom-6 md:left-auto md:right-6 md:max-w-md" style={{ bottom: 76, zIndex: 50 }}>
          <div className="max-w-md mx-auto">
            <button
              disabled={!canSubmit}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl text-[15px] font-semibold tracking-wide transition-all active:scale-[0.98]"
              style={
                canSubmit
                  ? { background: colors.accent, color: colors.accentTextOnBg, boxShadow: `0 8px 28px ${colors.accentMuted}` }
                  : { background: colors.surfaceMuted, color: colors.textDim, cursor: "not-allowed", border: `1px solid ${colors.border}` }
              }
            >
              {confirm.isPending
                ? "Оформляем..."
                : `Подтвердить заказ · ${fmt(total)} сум`}
            </button>
          </div>
        </div>
      )}

      <BottomNavBar active="cart" />
    </div>
  );
}
