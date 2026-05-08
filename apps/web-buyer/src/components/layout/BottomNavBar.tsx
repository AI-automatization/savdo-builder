'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useUnreadChatCount } from '@/hooks/use-chat';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/lib/auth/context';
import { IcoShop, IcoCart, IcoChat, IcoOrders, IcoProfile } from '@/components/icons';
import { colors } from '@/lib/styles';
import { getRecentStores } from '@/lib/recent-stores';

export type NavActive = 'store' | 'cart' | 'chats' | 'orders' | 'profile' | 'wishlist' | 'notifications';

export function BottomNavBar({
  active,
  cartBadge,
  storeSlug: propSlug,
}: {
  active?: NavActive;
  cartBadge?: number;
  storeSlug?: string;
}) {
  const [storedSlug, setStoredSlug] = useState(propSlug ?? '');
  const { isAuthenticated } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const unreadChatCount = useUnreadChatCount(isAuthenticated);
  const { data: cart } = useCart({ enabled: isAuthenticated });
  const cartCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  // Use the most recently visited store as the "Магазин" tab target.
  // (Older code read a `last_store_slug` key that nothing wrote — dead read.)
  useEffect(() => {
    if (!propSlug) {
      setStoredSlug(getRecentStores()[0]?.slug ?? '');
    }
  }, [propSlug]);

  const storeSlug = propSlug ?? storedSlug;

  const NAV: { key: NavActive; href: string; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'store',   href: storeSlug ? `/${storeSlug}` : '/', label: 'Магазин', icon: <IcoShop /> },
    { key: 'cart',    href: '/cart',    label: 'Корзина', icon: <IcoCart />, badge: cartBadge ?? cartCount },
    { key: 'chats',   href: '/chats',   label: 'Чаты',    icon: <IcoChat />, badge: unreadChatCount },
    { key: 'orders',  href: '/orders',  label: 'Заказы',  icon: <IcoOrders /> },
    { key: 'profile', href: '/profile', label: 'Профиль', icon: <IcoProfile />, badge: unreadCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden" style={{ zIndex: 50 }}>
      <div
        className="mx-auto"
        style={{
          background: colors.surface,
          borderTop: `1px solid ${colors.divider}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <nav className="flex items-center justify-around px-2 pt-2.5 pb-2 max-w-md mx-auto">
          {NAV.map(({ key, href, label, icon, badge }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center gap-[3px] px-3 py-1 rounded-xl"
              >
                <div className="relative">
                  <span style={{ color: isActive ? colors.brand : colors.textMuted }}>{icon}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 min-w-[17px] h-[17px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: colors.brand, color: colors.brandTextOnBg }}
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color: isActive ? colors.brand : colors.textMuted }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
