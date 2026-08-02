import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { api } from '@/lib/api';

// Deep link formats (TMA-DEEPLINK-EXPAND-001):
//   startapp=store_<slug>        → /buyer/store/<slug>
//   startapp=product_<productId> → /buyer/store/<slug>/product/<id> (resolves slug via API)
//   startapp=chat_<threadId>     → /buyer/chat/<threadId> или /seller/chat/<threadId>
//   startapp=cart_<slug>         → /buyer/store/<slug>/cart (cart-abandonment nudge)
//   startapp=seller_<page>       → /seller/<page> (page: products/orders/dashboard/profile/store)
//
// ВНИМАНИЕ: backend генераторы deep-link (см. wishlist-notify, cart-abandonment,
// telegram-demo) ДОЛЖНЫ слать ТОЛЬКО разрешённые префиксы и ТОЛЬКО известные форматы.
// Wishlist для product_<id> шлёт только id (без slug) — TMA сама резолвит slug через
// /storefront/products/<id>.
type DeepLink =
  | { type: 'store'; slug: string }
  | { type: 'product'; productId: string }
  | { type: 'chat'; threadId: string }
  | { type: 'cart'; slug: string }
  | { type: 'seller'; page: SellerPage }
  | null;

type SellerPage = 'dashboard' | 'products' | 'orders' | 'profile' | 'store' | 'chats';

const SELLER_PAGE_WHITELIST: ReadonlyArray<SellerPage> = [
  'dashboard',
  'products',
  'orders',
  'profile',
  'store',
  'chats',
];

function parseStartParam(param: string | null): DeepLink {
  if (!param) return null;
  if (param.startsWith('store_')) return { type: 'store', slug: param.slice(6) };
  if (param.startsWith('product_')) return { type: 'product', productId: param.slice(8) };
  if (param.startsWith('chat_')) return { type: 'chat', threadId: param.slice(5) };
  if (param.startsWith('cart_')) return { type: 'cart', slug: param.slice(5) };
  if (param.startsWith('seller_')) {
    const page = param.slice(7) as SellerPage;
    if (SELLER_PAGE_WHITELIST.includes(page)) return { type: 'seller', page };
    // Неизвестный seller_<page> — fallback на default seller route.
    return { type: 'seller', page: 'dashboard' };
  }
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

    // Chat deep-link (из TG-уведомления): открываем чат в правильной роли.
    // Если ещё нет user (auth идёт) — ждём loading=false выше отработало,
    // user уже должен быть resolved или null.
    if (deepLink?.type === 'chat' && user) {
      const route = user.role === 'BUYER'
        ? `/buyer/chat/${deepLink.threadId}`
        : `/seller/chat/${deepLink.threadId}`;
      navigate(route, { replace: true });
      return;
    }

    // Cart-abandonment deep-link (TMA-DEEPLINK-EXPAND-001):
    // Маркетинговый nudge «вернись в корзину» — открыть корзину магазина.
    if (deepLink?.type === 'cart') {
      navigate(`/buyer/store/${deepLink.slug}/cart`, { replace: true });
      return;
    }

    // Seller page deep-link (TMA-DEEPLINK-EXPAND-001):
    // Кнопки «Открыть товары / заказы / профиль» из TG-меню seller.
    if (deepLink?.type === 'seller') {
      navigate(`/seller/${deepLink.page === 'dashboard' ? '' : deepLink.page}`, { replace: true });
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
