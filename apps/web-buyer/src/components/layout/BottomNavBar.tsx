'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export type NavActive = 'store' | 'cart' | 'chats' | 'orders' | 'profile';

const glassDim = {
  background:           'rgba(255,255,255,0.04)',
  backdropFilter:       'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border:               '1px solid rgba(255,255,255,0.09)',
} as const;

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;

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

  useEffect(() => {
    if (!propSlug) {
      setStoredSlug(localStorage.getItem('last_store_slug') ?? '');
    }
  }, [propSlug]);

  const storeSlug = propSlug ?? storedSlug;

  const NAV: { key: NavActive; href: string; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'store',   href: storeSlug ? `/${storeSlug}` : '/', label: 'Магазин', icon: <IcoShop /> },
    { key: 'cart',    href: '/cart',    label: 'Корзина', icon: <IcoCart />, badge: cartBadge },
    { key: 'chats',   href: '/chats',   label: 'Чаты',    icon: <IcoChat /> },
    { key: 'orders',  href: '/orders',  label: 'Заказы',  icon: <IcoOrders /> },
    { key: 'profile', href: '/profile', label: 'Профиль', icon: <IcoProfile /> },
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
