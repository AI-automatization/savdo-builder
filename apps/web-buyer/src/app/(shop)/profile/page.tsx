"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { useAuth } from "@/lib/auth/context";
import { useLogout, useUploadAvatar } from "@/hooks/use-auth";
import { Camera, Loader2, User as UserIcon } from "lucide-react";
import { glass, glassDim } from "@/lib/styles";

const MAX_AVATAR_BYTES = 10 * 1024 * 1024; // 10 MB — must match API guard
const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ── Icons ──────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;


// ── Authenticated Profile ──────────────────────────────────────────────────

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
    e.target.value = ""; // allow re-selecting same file
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
    <div className="flex flex-col gap-4 max-w-sm">
      {/* Avatar + phone */}
      <div className="flex items-center gap-4 px-4 py-4 rounded-2xl" style={glass}>
        <button
          type="button"
          onClick={handlePickAvatar}
          disabled={uploadAvatar.isPending}
          className="relative w-14 h-14 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "rgba(167,139,250,.22)", border: "1px solid rgba(167,139,250,.35)" }}
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
            <UserIcon size={20} style={{ color: '#A78BFA' }} />
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
          <p className="text-base font-bold text-white truncate">{user?.phone}</p>
          <button
            type="button"
            onClick={handlePickAvatar}
            disabled={uploadAvatar.isPending}
            className="mt-0.5 inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{ color: "#A78BFA" }}
          >
            <Camera size={12} />
            {avatarUrl ? "Изменить фото" : "Добавить фото"}
          </button>
          {avatarError && (
            <p className="text-[11px] mt-1" style={{ color: "rgba(248,113,113,.85)" }}>{avatarError}</p>
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

      {/* Quick links */}
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <Link
          href="/orders"
          className="flex items-center gap-3 px-4 py-3.5 transition-opacity hover:opacity-80"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span style={{ color: "#A78BFA" }}><IcoOrders /></span>
          <span className="text-sm font-medium text-white">Мои заказы</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        <Link
          href="/cart"
          className="flex items-center gap-3 px-4 py-3.5 transition-opacity hover:opacity-80"
        >
          <span style={{ color: "#A78BFA" }}><IcoCart /></span>
          <span className="text-sm font-medium text-white">Корзина</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 ml-auto" style={{ color: "rgba(255,255,255,0.25)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Logout */}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(248,113,113,0.10)", color: "rgba(248,113,113,.85)", border: "1px solid rgba(248,113,113,0.18)" }}
        >
          Выйти из аккаунта
        </button>
      ) : (
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={glassDim}>
          <p className="text-sm text-white/80 text-center">Выйти из аккаунта?</p>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
            >
              Отмена
            </button>
            <button
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "rgba(248,113,113,0.18)", color: "rgba(248,113,113,.90)" }}
            >
              {logoutMutation.isPending ? "..." : "Выйти"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
    >
      {/* Glow orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-md mx-auto px-4 pt-6 pb-28" style={{ zIndex: 1 }}>
        <h1 className="text-xl font-bold text-white mb-5">Профиль</h1>
        {isAuthenticated ? <ProfileView /> : (
          <OtpGate
            icon={<UserIcon size={32} style={{ color: '#A78BFA' }} />}
            title="Войдите в аккаунт"
          />
        )}
      </div>

      {/* Bottom nav */}
      <BottomNavBar active="profile" />
    </div>
  );
}
