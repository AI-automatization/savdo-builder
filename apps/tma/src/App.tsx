import { Component, lazy, Suspense, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';

// ── Error Boundary ─────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; message: string }

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): EBState {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }

  componentDidCatch(_err: unknown, info: ErrorInfo) {
    console.error('[TMA ErrorBoundary]', _err, info.componentStack);
    try { window.Telegram?.WebApp?.BackButton?.hide(); } catch { /* noop */ }
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 gap-5"
        style={{ background: 'linear-gradient(135deg, #0f0c1a 0%, #1a1035 100%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          ⚠️
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-base">Что-то пошло не так</p>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Попробуйте вернуться на главную
          </p>
        </div>
        <button
          onClick={() => { this.setState({ hasError: false, message: '' }); window.location.replace('/'); }}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
        >
          На главную
        </button>
      </div>
    );
  }
}

// ── Lazy pages ─────────────────────────────────────────────────────────────────

const HomePage        = lazy(() => import('@/pages/HomePage'));
const BuyerStores     = lazy(() => import('@/pages/buyer/StoresPage'));
const BuyerStore      = lazy(() => import('@/pages/buyer/StorePage'));
const BuyerProduct    = lazy(() => import('@/pages/buyer/ProductPage'));
const BuyerCart       = lazy(() => import('@/pages/buyer/CartPage'));
const BuyerCheckout   = lazy(() => import('@/pages/buyer/CheckoutPage'));
const BuyerOrders     = lazy(() => import('@/pages/buyer/OrdersPage'));
const BuyerWishlist   = lazy(() => import('@/pages/buyer/WishlistPage'));
const BuyerProfile    = lazy(() => import('@/pages/buyer/ProfilePage'));
const BuyerSettings   = lazy(() => import('@/pages/buyer/SettingsPage'));
const BuyerChat       = lazy(() => import('@/pages/buyer/ChatPage'));
const SellerDashboard = lazy(() => import('@/pages/seller/DashboardPage'));
const SellerOrders    = lazy(() => import('@/pages/seller/OrdersPage'));
const SellerStore     = lazy(() => import('@/pages/seller/StorePage'));
const SellerProducts  = lazy(() => import('@/pages/seller/ProductsPage'));
const SellerAddProduct   = lazy(() => import('@/pages/seller/AddProductPage'));
const SellerEditProduct  = lazy(() => import('@/pages/seller/EditProductPage'));
const SellerProfile   = lazy(() => import('@/pages/seller/ProfilePage'));
const SellerSettings  = lazy(() => import('@/pages/seller/SettingsPage'));
const SellerChat      = lazy(() => import('@/pages/seller/ChatPage'));

// ── Guards ────────────────────────────────────────────────────────────────────

function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') return <Navigate to="/buyer" replace />;
  return <>{children}</>;
}

function BuyerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && (user.role === 'SELLER' || user.role === 'ADMIN')) {
    return <Navigate to="/seller" replace />;
  }
  return <>{children}</>;
}

// ── Persistent layout wrappers ────────────────────────────────────────────────

function BuyerLayout() {
  return (
    <AppShell role="BUYER">
      <PageOutlet />
    </AppShell>
  );
}

function SellerLayout() {
  return (
    <SellerGuard>
      <AppShell role="SELLER">
        <PageOutlet />
      </AppShell>
    </SellerGuard>
  );
}

// Scroll to top on route change + fade-in animation
function PageOutlet() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-enter">
      <Suspense fallback={<LoadingScreen />}>
        <Outlet />
      </Suspense>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Suspense fallback={<LoadingScreen />}><HomePage /></Suspense>} />

        {/* Buyer section — AppShell mounts once, persists across all buyer routes */}
        <Route path="/buyer" element={<BuyerLayout />}>
          <Route index element={<BuyerStores />} />
          <Route path="store/:slug" element={<BuyerStore />} />
          <Route path="store/:slug/product/:id" element={<BuyerProduct />} />
          <Route path="cart" element={<BuyerGuard><BuyerCart /></BuyerGuard>} />
          <Route path="checkout" element={<BuyerGuard><BuyerCheckout /></BuyerGuard>} />
          <Route path="orders" element={<BuyerGuard><BuyerOrders /></BuyerGuard>} />
          <Route path="wishlist" element={<BuyerGuard><BuyerWishlist /></BuyerGuard>} />
          <Route path="profile" element={<BuyerProfile />} />
          <Route path="settings" element={<BuyerSettings />} />
          <Route path="chat" element={<BuyerGuard><BuyerChat /></BuyerGuard>} />
          <Route path="chat/:threadId" element={<BuyerGuard><BuyerChat /></BuyerGuard>} />
        </Route>

        {/* Seller section — AppShell mounts once, persists across all seller routes */}
        <Route path="/seller" element={<SellerLayout />}>
          <Route index element={<SellerDashboard />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="store" element={<SellerStore />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/add" element={<SellerAddProduct />} />
          <Route path="products/:id/edit" element={<SellerEditProduct />} />
          <Route path="profile" element={<SellerProfile />} />
          <Route path="settings" element={<SellerSettings />} />
          <Route path="chat" element={<SellerChat />} />
          <Route path="chat/:threadId" element={<SellerChat />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
