'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useCart } from '@/hooks/use-cart';
import { IcoShop, IcoCart, IcoChat, IcoOrders, IcoProfile } from '@/components/icons';
import { glassDim } from '@/lib/styles';

export type NavActive = 'store' | 'cart' | 'chats' | 'orders' | 'profile';

export function BottomNavBar({
  active,
  cartBadge,
  storeSlug: propSlug,
}: {
  active: NavActive;
  cartBadge?: number;
  storeSlug?: string;
}) {
  const [storedSlug, setStoredSlug] = useState(propSlug ?? '');
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: cart } = useCart();
  const cartCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  useEffect(() => {
    if (!propSlug) {
      setStoredSlug(localStorage.getItem('last_store_slug') ?? '');
    }
  }, [propSlug]);

  const storeSlug = propSlug ?? storedSlug;

  const NAV: { key: NavActive; href: string; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'store',   href: storeSlug ? `/${storeSlug}` : '/', label: 'Магазин', icon: <IcoShop /> },
    { key: 'cart',    href: '/cart',    label: 'Корзина', icon: <IcoCart />, badge: cartBadge ?? cartCount },
    { key: 'chats',   href: '/chats',   label: 'Чаты',    icon: <IcoChat /> },
    { key: 'orders',  href: '/orders',  label: 'Заказы',  icon: <IcoOrders /> },
    { key: 'profile', href: '/profile', label: 'Профиль', icon: <IcoProfile />, badge: unreadCount },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0" style={{ zIndex: 50 }}>
      <div
        className="max-w-md mx-auto"
        style={{ ...glassDim, borderRadius: '20px 20px 0 0', borderBottom: 'none' }}
      >
        <nav className="flex items-center justify-around px-2 py-2">
          {NAV.map(({ key, href, label, icon, badge }) => {
            const isActive = key === active;
            return (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center gap-[3px] px-3 py-1 rounded-xl"
              >
                <div className="relative">
                  <span style={{ color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.32)' }}>{icon}</span>
                  {badge != null && badge > 0 && (
                    <span
                      className="absolute -top-1 -right-1.5 w-[17px] h-[17px] flex items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: '#A78BFA', color: '#0d0d1f' }}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium" style={{ color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.28)' }}>
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
