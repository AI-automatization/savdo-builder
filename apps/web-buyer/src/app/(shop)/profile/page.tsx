"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { useAuth } from "@/lib/auth/context";
import { useLogout, useUploadAvatar } from "@/hooks/use-auth";
import { useOrders } from "@/hooks/use-orders";
import { useWishlist } from "@/hooks/use-wishlist";
import {
  Camera,
  Loader2,
  User as UserIcon,
  ShoppingCart,
  Package,
  Heart,
  Bell,
  ChevronRight,
} from "lucide-react";
import { colors } from "@/lib/styles";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center justify-center py-3.5" style={{ background: colors.surface }}>
      <div className="text-base font-bold" style={{ color: colors.textStrong }}>{value}</div>
      <div className="text-[10px] mt-0.5 tracking-wide uppercase" style={{ color: colors.textMuted }}>{label}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-5 pb-2 text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
      — {children}
    </div>
  );
}

function MenuRow({
  icon,
  label,
  sub,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:opacity-80"
      style={{ background: colors.surface }}
    >
      <div
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: colors.brandMuted, color: colors.brand }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate" style={{ color: colors.textStrong }}>{label}</div>
        {sub && <div className="text-[11px] mt-0.5 truncate" style={{ color: colors.textMuted }}>{sub}</div>}
      </div>
      <ChevronRight size={14} className="flex-shrink-0" style={{ color: colors.textDim }} />
    </Link>
  );
}

// ── ProfileView ──────────────────────────────────────────────────────────────

function ProfileView() {
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = useLogout();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const avatarUrl = user?.buyer?.avatarUrl ?? null;

  // Stats — best-effort. Skip when auth is still rehydrating (Strict Mode 401 race) AND when
  // the user signed in as SELLER — buyer/orders is BUYER-gated and would 403.
  const isBuyer = user?.role === 'BUYER';
  const { data: ordersData } = useOrders({ page: 1, limit: 1, enabled: isAuthenticated && isBuyer });
  const { data: wishlist } = useWishlist();
  const ordersCount = ordersData?.meta?.total ?? 0;
  const wishlistCount = wishlist?.length ?? 0;

  async function handleLogout() {
    await logoutMutation.mutateAsync();
  }

  function handlePickAvatar() {
    setAvatarError(null);
    fileInputRef.current?.click();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Только JPEG, PNG или WebP");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Файл больше 10 МБ");
      return;
    }
    try {
      await uploadAvatar.mutateAsync(file);
    } catch {
      setAvatarError("Не удалось загрузить фото");
    }
  }

  return (
    <div className="flex flex-col">
      {/* User card */}
      <div className="flex items-center gap-3.5 px-4 py-4" style={{ background: colors.surface }}>
        <button
          type="button"
          onClick={handlePickAvatar}
          disabled={uploadAvatar.isPending}
          className="relative w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: colors.brand, color: colors.brandTextOnBg }}
          aria-label="Изменить фото профиля"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt="Фото профиля"
              width={56}
              height={56}
              className="w-full h-full object-cover"
              unoptimized
            />
          ) : (
            <UserIcon size={22} />
          )}
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: uploadAvatar.isPending ? "rgba(0,0,0,0.45)" : "transparent",
              opacity: uploadAvatar.isPending ? 1 : 0,
              transition: "opacity 150ms",
            }}
          >
            {uploadAvatar.isPending && <Loader2 size={18} className="animate-spin text-white" />}
          </span>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold truncate" style={{ color: colors.textStrong }}>{user?.phone}</p>
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={uploadAvatar.isPending}
            className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ color: colors.brand }}
          >
            <Camera size={11} />
            {avatarUrl ? "Изменить фото" : "Добавить фото"}
          </button>
          {avatarError && (
            <p className="text-[11px] mt-1" style={{ color: colors.danger }}>{avatarError}</p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(",")}
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-3"
        style={{ background: colors.divider, gap: "1px", borderTop: `1px solid ${colors.divider}`, borderBottom: `1px solid ${colors.divider}` }}
      >
        <Stat label="Заказов" value={ordersCount} />
        <Stat label="В избранном" value={wishlistCount} />
        <Link href="/cart" className="flex flex-col items-center justify-center py-3.5 transition-opacity hover:opacity-80" style={{ background: colors.surface }}>
          <ShoppingCart size={18} style={{ color: colors.textStrong }} />
          <div className="text-[10px] mt-1 tracking-wide uppercase" style={{ color: colors.textMuted }}>Корзина</div>
        </Link>
      </div>

      {/* My activity */}
      <SectionLabel>Активность</SectionLabel>
      <MenuRow icon={<Package size={16} />} label="Мои заказы" sub={ordersCount > 0 ? `${ordersCount} ${ordersCount === 1 ? "заказ" : ordersCount < 5 ? "заказа" : "заказов"}` : "Пусто"} href="/orders" />
      <div style={{ height: 1, background: colors.divider }} className="mx-4" />
      <MenuRow icon={<Heart size={16} />} label="Избранное" sub={wishlistCount > 0 ? `${wishlistCount} ${wishlistCount === 1 ? "товар" : wishlistCount < 5 ? "товара" : "товаров"}` : "Пусто"} href="/wishlist" />
      <div style={{ height: 1, background: colors.divider }} className="mx-4" />
      <MenuRow icon={<Bell size={16} />} label="Уведомления" sub="История событий" href="/notifications" />

      {/* Logout */}
      <div className="px-4 py-6 mt-2">
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="w-full py-3 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
            style={{ background: "transparent", color: colors.danger, border: `1px solid ${colors.danger}` }}
          >
            Выйти из аккаунта
          </button>
        ) : (
          <div
            className="rounded-md p-3.5 flex flex-col gap-2.5"
            style={{ background: colors.surface, border: `1px solid ${colors.danger}` }}
          >
            <p className="text-xs text-center" style={{ color: colors.textStrong }}>Выйти из аккаунта?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 py-2 rounded-md text-[11px] font-semibold"
                style={{ background: colors.surfaceSunken, color: colors.textBody }}
              >
                Отмена
              </button>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="flex-1 py-2 rounded-md text-[11px] font-semibold disabled:opacity-40"
                style={{ background: colors.danger, color: "#FFFFFF" }}
              >
                {logoutMutation.isPending ? "..." : "Выйти"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b" style={{ background: colors.surface, borderColor: colors.divider }}>
        <h1 className="text-lg font-bold" style={{ color: colors.textStrong }}>Профиль</h1>
      </div>

      <div className="max-w-2xl mx-auto pb-28 md:pb-12">
        {isAuthenticated ? (
          <ProfileView />
        ) : (
          <div className="px-4 pt-6">
            <OtpGate icon={<UserIcon size={22} />} title="Войдите в аккаунт" />
          </div>
        )}
      </div>

      <BottomNavBar active="profile" />
    </div>
  );
}
