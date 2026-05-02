import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';

const PRIMARY_PATHS = new Set([
  '/buyer',
  '/buyer/cart',
  '/buyer/orders',
  '/buyer/chat',
  '/seller',
  '/seller/store',
  '/seller/products',
  '/seller/orders',
  '/seller/chat',
]);

// Routes that have their own in-page back button (would otherwise duplicate)
const HIDE_ON_PREFIXES = ['/buyer/chat/', '/seller/chat/'];

export function InAppBackBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  if (PRIMARY_PATHS.has(location.pathname)) return null;
  if (HIDE_ON_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <div className="mb-3">
      <button
        className="in-app-back"
        onClick={() => {
          tg?.HapticFeedback.impactOccurred('light');
          navigate(-1);
        }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>‹</span>
        Назад
      </button>
    </div>
  );
}
