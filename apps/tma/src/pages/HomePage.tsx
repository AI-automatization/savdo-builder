import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

// Deep link format: startapp=store_my-shop-slug → /buyer/store/my-shop-slug
function parseStartParam(param: string | null): string | null {
  if (!param) return null;
  if (param.startsWith('store_')) return `/buyer/store/${param.slice(6)}`;
  return null;
}

export default function HomePage() {
  const { user, loading, authenticated } = useAuth();
  const { startParam } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    // Deep link — приоритет над обычным редиректом
    const deepLink = parseStartParam(startParam);
    if (deepLink) {
      navigate(deepLink, { replace: true });
      return;
    }

    if (!authenticated || !user) {
      navigate('/buyer', { replace: true });
      return;
    }

    // ADMIN и SELLER → панель продавца, BUYER → покупатель
    if (user.role === 'SELLER' || user.role === 'ADMIN') {
      navigate('/seller', { replace: true });
    } else {
      navigate('/buyer', { replace: true });
    }
  }, [loading, authenticated, user, startParam, navigate]);

  return <LoadingScreen />;
}
