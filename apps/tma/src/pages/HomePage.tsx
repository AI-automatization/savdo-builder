import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { api } from '@/lib/api';

// Deep link formats:
//   startapp=store_<slug>        → /buyer/store/<slug>
//   startapp=product_<productId> → /buyer/store/<slug>/product/<id> (resolves slug via API)
type DeepLink =
  | { type: 'store'; slug: string }
  | { type: 'product'; productId: string }
  | null;

function parseStartParam(param: string | null): DeepLink {
  if (!param) return null;
  if (param.startsWith('store_')) return { type: 'store', slug: param.slice(6) };
  if (param.startsWith('product_')) return { type: 'product', productId: param.slice(8) };
  return null;
}

export default function HomePage() {
  const { user, loading, authenticated } = useAuth();
  const { startParam } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const deepLink = parseStartParam(startParam);

    if (deepLink?.type === 'store') {
      navigate(`/buyer/store/${deepLink.slug}`, { replace: true });
      return;
    }

    if (deepLink?.type === 'product') {
      // Slug is unknown from the start_param; fetch product summary to resolve it.
      api<{ id: string; store?: { slug?: string } }>(`/storefront/products/${deepLink.productId}`)
        .then((p) => {
          const slug = p.store?.slug;
          if (slug) navigate(`/buyer/store/${slug}/product/${p.id}`, { replace: true });
          else navigate('/buyer', { replace: true });
        })
        .catch(() => navigate('/buyer', { replace: true }));
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
