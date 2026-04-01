'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

// ── Storefront view tracker ───────────────────────────────────────────────────

export function TrackStorefrontView({ storeId, storeSlug }: { storeId: string; storeSlug: string }) {
  useEffect(() => {
    track.storefrontViewed(storeId, storeSlug);
  }, [storeId, storeSlug]);
  return null;
}

// ── Telegram click tracker ────────────────────────────────────────────────────

export function TelegramLink({
  href,
  storeId,
  context,
  children,
  className,
  style,
}: {
  href: string;
  storeId: string;
  context: 'storefront' | 'product' | 'order';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={style}
      onClick={() => track.telegramClicked(storeId, context)}
    >
      {children}
    </a>
  );
}
