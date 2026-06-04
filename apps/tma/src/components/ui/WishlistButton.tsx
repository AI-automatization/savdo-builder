import { useEffect, useState } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';
import { showToast } from '@/components/ui/Toast';
import { isInWishlist, subscribe, toggleWishlist } from '@/lib/wishlist';

interface Props {
  productId: string;
  /** Visual variant: 'card' = small overlay on ProductCard, 'page' = larger on ProductPage. */
  variant?: 'card' | 'page';
}

export function WishlistButton({ productId, variant = 'card' }: Props) {
  const { tg } = useTelegram();
  const [active, setActive] = useState(() => isInWishlist(productId));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setActive(isInWishlist(productId));
    return subscribe(() => setActive(isInWishlist(productId)));
  }, [productId]);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    tg?.HapticFeedback.impactOccurred('light');
    const wasActive = active;
    const ok = await toggleWishlist(productId);
    setBusy(false);
    if (!ok) {
      showToast('❌ Не удалось обновить избранное', 'error');
      return;
    }
    if (!wasActive) {
      tg?.HapticFeedback.notificationOccurred('success');
    }
  };

  const size = variant === 'page' ? 40 : 30;
  // BUG re-audit 04.06.2026: эмодзи ❤️/🤍 в Telegram WebApp рендерятся
  // системными шрифтами и часто получают фиолетовый/синий оттенок (Apple
  // Color Emoji vs Noto). Заменяем на SVG с brand-цветом Champagne Gold
  // (#C9A876) для активного состояния — гарантированно одинаково везде.
  const GOLD = '#C9A876';
  const iconSize = variant === 'page' ? 22 : 16;

  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Удалить из избранного' : 'Добавить в избранное'}
      style={{
        width: size,
        height: size,
        borderRadius: variant === 'page' ? 14 : 10,
        background: active ? 'rgba(201,168,118,0.16)' : 'var(--tg-surface-hover)',
        border: `1px solid ${active ? 'rgba(201,168,118,0.50)' : 'var(--tg-border)'}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: active ? GOLD : 'var(--tg-text-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.12s ease, background 0.15s ease, border-color 0.15s ease',
        transform: busy ? 'scale(0.92)' : 'scale(1)',
        lineHeight: 1,
        padding: 0,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={iconSize}
        height={iconSize}
        fill={active ? GOLD : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    </button>
  );
}
