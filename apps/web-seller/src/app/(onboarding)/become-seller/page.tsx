'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../../lib/auth/context';
import { useStore } from '../../../hooks/use-seller';
import { track } from '../../../lib/analytics';
import { card, colors } from '@/lib/styles';

const BUYER_URL = process.env.NEXT_PUBLIC_BUYER_URL ?? 'https://savdo.uz';

export default function BecomeSellerPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  // Если SELLER уже с store — сразу в dashboard.
  const { data: store } = useStore({
    enabled: isAuthenticated && user?.role === 'SELLER',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    track.becomeSellerInterceptShown();
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user?.role === 'SELLER' && store) {
      router.replace('/dashboard');
    }
  }, [user, store, router]);

  if (!isAuthenticated) return null;

  function handleAccept() {
    track.becomeSellerInterceptAccepted();
    router.push('/onboarding');
  }

  function handleDismiss() {
    track.becomeSellerInterceptDismissed();
    window.location.href = BUYER_URL;
  }

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <div className="rounded-3xl p-7" style={card}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: colors.accent }}
        >
          <ShoppingCart size={16} color={colors.accentTextOnBg} />
        </div>
        <span className="text-base font-bold" style={{ color: colors.brand }}>
          Savdo
        </span>
      </div>

      <div className="text-center mb-7">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: colors.accent }}
        >
          <Rocket size={26} color={colors.accentTextOnBg} />
        </div>
        <h1
          className="text-xl font-bold mb-2"
          style={{ color: colors.textPrimary }}
        >
          У вас ещё нет магазина
        </h1>
        <p
          className="text-sm leading-relaxed"
          style={{ color: colors.textMuted }}
        >
          Откройте свой магазин в Savdo — принимайте заказы прямо в Telegram,
          без сайта и без посредников.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          Открыть магазин
        </button>
        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            background: colors.surfaceMuted,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        >
          Перейти к покупкам
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={handleLogout}
          className="text-xs transition-opacity hover:opacity-80 underline"
          style={{ color: colors.textDim }}
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
