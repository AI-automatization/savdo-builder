import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const buyerTabs: NavItem[] = [
  { path: '/buyer', label: 'Магазины', icon: '🏪' },
  { path: '/buyer/cart', label: 'Корзина', icon: '🛒' },
  { path: '/buyer/orders', label: 'Заказы', icon: '📦' },
];

const sellerTabs: NavItem[] = [
  { path: '/seller', label: 'Заказы', icon: '📋' },
  { path: '/seller/store', label: 'Магазин', icon: '🏪' },
  { path: '/seller/stats', label: 'Статистика', icon: '📊' },
];

export function BottomNav({ role }: { role: 'BUYER' | 'SELLER' }) {
  const tabs = role === 'SELLER' ? sellerTabs : buyerTabs;
  const location = useLocation();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-around py-2 pb-safe z-50"
      style={{
        background: 'rgba(15,10,30,0.92)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.path ||
          (tab.path !== '/buyer' && tab.path !== '/seller' && location.pathname.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            onClick={() => {
              tg?.HapticFeedback.selectionChanged();
              navigate(tab.path);
            }}
            className="flex flex-col items-center gap-0.5 px-4 py-1"
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span
              className="text-[10px] font-medium"
              style={{ color: active ? '#A78BFA' : 'rgba(255,255,255,0.35)' }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
