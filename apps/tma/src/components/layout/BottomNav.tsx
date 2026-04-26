import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  /** match also sub-paths */
  exact?: boolean;
}

const buyerTabs: NavItem[] = [
  { path: '/buyer',         label: 'Магазины', icon: '🏪', exact: true },
  { path: '/buyer/cart',    label: 'Корзина',  icon: '🛒' },
  { path: '/buyer/orders',  label: 'Заказы',   icon: '📦' },
  { path: '/buyer/chat',    label: 'Чат',      icon: '💬' },
  { path: '/buyer/settings', label: 'Настройки', icon: '⚙️' },
];

const sellerTabs: NavItem[] = [
  { path: '/seller',           label: 'Дашборд',  icon: '📊', exact: true },
  { path: '/seller/products',  label: 'Товары',   icon: '📦' },
  { path: '/seller/orders',    label: 'Заказы',   icon: '📋' },
  { path: '/seller/chat',      label: 'Чат',      icon: '💬' },
  { path: '/seller/settings',  label: 'Настройки',icon: '⚙️' },
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

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around z-50"
      style={{
        background: 'rgba(11,14,20,0.92)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        paddingTop: 8,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab, location.pathname);
        return (
          <button
            key={tab.path}
            onClick={() => {
              if (!active) {
                tg?.HapticFeedback.selectionChanged();
                navigate(tab.path);
              }
            }}
            className="flex flex-col items-center gap-0.5 flex-1 py-1"
            style={{ minWidth: 0, position: 'relative' }}
          >
            <span
              style={{
                fontSize: 20,
                filter: active ? 'none' : 'grayscale(60%)',
                transform: active ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.15s',
              }}
            >
              {tab.icon}
            </span>
            <span
              className="text-[10px] font-medium truncate w-full text-center"
              style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.30)' }}
            >
              {tab.label}
            </span>
            {active && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 24,
                  height: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg, #A855F7, #22D3EE)',
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
