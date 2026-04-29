"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { useAuth } from "@/lib/auth/context";
import { useLogout, useUploadAvatar } from "@/hooks/use-auth";
import { Camera, Loader2, User as UserIcon, ShoppingCart, Package, ChevronRight } from "lucide-react";
import { colors } from "@/lib/styles";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ProfileView() {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const uploadAvatar = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const avatarUrl = user?.buyer?.avatarUrl ?? null;

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
    <div className="flex flex-col gap-4 max-w-2xl">
      <div
        className="flex items-center gap-4 px-4 py-4 rounded-2xl"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <button
          type="button"
          onClick={handlePickAvatar}
          disabled={uploadAvatar.isPending}
          className="relative w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
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
            <UserIcon size={20} style={{ color: colors.accent }} />
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
          <p className="text-base font-bold truncate" style={{ color: colors.textPrimary }}>{user?.phone}</p>
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={uploadAvatar.isPending}
            className="mt-0.5 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ color: colors.accent }}
          >
            <Camera size={12} />
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

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/5"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <span style={{ color: colors.accent }}><Package size={18} /></span>
          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Мои заказы</span>
          <ChevronRight size={16} className="ml-auto" style={{ color: colors.textDim }} />
        </Link>
        <Link
          href="/cart"
          className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-black/5"
        >
          <span style={{ color: colors.accent }}><ShoppingCart size={18} /></span>
          <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>Корзина</span>
          <ChevronRight size={16} className="ml-auto" style={{ color: colors.textDim }} />
        </Link>
      </div>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: 'rgba(220,38,38,0.08)', color: colors.danger, border: `1px solid rgba(220,38,38,0.30)` }}
        >
          Выйти из аккаунта
        </button>
      ) : (
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: 'rgba(220,38,38,0.06)', border: `1px solid rgba(220,38,38,0.30)` }}
        >
          <p className="text-sm text-center" style={{ color: colors.textPrimary }}>Выйти из аккаунта?</p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: colors.surface, color: colors.textMuted, border: `1px solid ${colors.border}` }}
            >
              Отмена
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: colors.danger, color: "#FFFFFF" }}
            >
              {logoutMutation.isPending ? "..." : "Выйти"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: colors.textPrimary }}>Профиль</h1>
        {isAuthenticated ? <ProfileView /> : (
          <OtpGate
            icon={<UserIcon size={22} />}
            title="Войдите в аккаунт"
          />
        )}
      </div>

      <BottomNavBar active="profile" />
    </div>
  );
}
