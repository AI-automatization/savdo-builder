import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';
import { getCart } from '@/lib/cart';
import { subscribeToUnread } from '@/lib/notifications';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
  badge?: () => number;
}

const buyerTabs: NavItem[] = [
  { path: '/buyer',        label: 'Магазины', icon: '🏪', exact: true },
  { path: '/buyer/cart',   label: 'Корзина',  icon: '🛒', badge: () => getCart().reduce((s, i) => s + i.qty, 0) },
  { path: '/buyer/orders', label: 'Заказы',   icon: '📦' },
  { path: '/buyer/chat',   label: 'Чат',      icon: '💬' },
];

const sellerTabs: NavItem[] = [
  { path: '/seller',          label: 'Дашборд', icon: '📊', exact: true },
  { path: '/seller/store',    label: 'Магазин', icon: '🏪' },
  { path: '/seller/products', label: 'Товары',  icon: '📦' },
  { path: '/seller/orders',   label: 'Заказы',  icon: '📋' },
  { path: '/seller/chat',     label: 'Чат',     icon: '💬' },
];

function isActive(tab: NavItem, pathname: string): boolean {
  if (tab.exact) return pathname === tab.path;
  return pathname === tab.path || pathname.startsWith(tab.path + '/');
}

export function BottomNav({ role }: { role: 'BUYER' | 'SELLER' }) {
  const tabs = role === 'SELLER' ? sellerTabs : buyerTabs;
  const location = useLocation();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  // NOTIF-IN-APP-001: unread-count badge на иконку «Чат» (общий счётчик
  // уведомлений: новые сообщения + статусы заказов + апдейты магазина).
  const [unread, setUnread] = useState(0);
  useEffect(() => subscribeToUnread(setUnread), []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex z-50"
      style={{
        background: 'rgba(11,14,20,0.94)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.40)',
        paddingBottom: 'env(safe-area-inset-bottom, 10px)',
        paddingTop: 6,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab, location.pathname);
        const tabBadge = tab.badge?.() ?? 0;
        // Уведомления добавляются к иконке «Чат» если она есть.
        const isChatTab = tab.path.endsWith('/chat');
        const badgeCount = isChatTab ? tabBadge + unread : tabBadge;

        return (
          <button
            key={tab.path}
            className="nav-btn flex flex-col items-center gap-0.5 flex-1 py-1"
            style={{ minWidth: 0, position: 'relative' }}
            onClick={() => {
              if (!active) {
                tg?.HapticFeedback.selectionChanged();
                navigate(tab.path);
              }
            }}
          >
            {/* Icon + badge */}
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span
                aria-hidden="true"
                style={{
                  fontSize: 22,
                  display: 'block',
                  filter: active ? 'none' : 'grayscale(55%) brightness(0.75)',
                  transform: active ? 'scale(1.12)' : 'scale(1)',
                  transition: 'transform 0.15s, filter 0.15s',
                }}
              >
                {tab.icon}
              </span>
              {badgeCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -6,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #A855F7, #22D3EE)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    boxShadow: '0 0 8px rgba(168,85,247,0.60)',
                    lineHeight: 1,
                  }}
                >
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
            </span>

            {/* Label */}
            <span
              className="text-[10px] font-semibold truncate w-full text-center"
              style={{
                color: active ? '#A855F7' : 'rgba(255,255,255,0.50)',
                transition: 'color 0.15s',
                letterSpacing: '0.01em',
              }}
            >
              {tab.label}
            </span>

            {/* Active indicator line */}
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: active ? 28 : 0,
                height: 2,
                borderRadius: 1,
                background: 'linear-gradient(90deg, #A855F7, #22D3EE)',
                transition: 'width 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          </button>
        );
      })}
    </nav>
  );
}
