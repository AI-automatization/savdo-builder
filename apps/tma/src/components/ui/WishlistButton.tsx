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
  const fontSize = variant === 'page' ? 20 : 15;

  return (
    <button
      onClick={onClick}
      aria-label={active ? 'Удалить из избранного' : 'Добавить в избранное'}
      style={{
        width: size,
        height: size,
        borderRadius: variant === 'page' ? 14 : 10,
        background: active ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.10)',
        border: `1px solid ${active ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.18)'}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        color: active ? '#FB7185' : 'rgba(255,255,255,0.85)',
        fontSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.12s ease, background 0.15s ease, border-color 0.15s ease',
        transform: busy ? 'scale(0.92)' : 'scale(1)',
        lineHeight: 1,
      }}
    >
      {active ? '❤️' : '🤍'}
    </button>
  );
}
