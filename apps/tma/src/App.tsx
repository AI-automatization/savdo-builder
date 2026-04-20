import { Component, lazy, Suspense } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
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
    // Restore Telegram BackButton if it was hidden by the crashed component
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

const HomePage = lazy(() => import('@/pages/HomePage'));
const BuyerStores = lazy(() => import('@/pages/buyer/StoresPage'));
const BuyerStore = lazy(() => import('@/pages/buyer/StorePage'));
const BuyerProduct = lazy(() => import('@/pages/buyer/ProductPage'));
const BuyerCart = lazy(() => import('@/pages/buyer/CartPage'));
const BuyerCheckout = lazy(() => import('@/pages/buyer/CheckoutPage'));
const BuyerOrders = lazy(() => import('@/pages/buyer/OrdersPage'));
const SellerDashboard = lazy(() => import('@/pages/seller/DashboardPage'));
const SellerOrders = lazy(() => import('@/pages/seller/OrdersPage'));
const SellerStore = lazy(() => import('@/pages/seller/StorePage'));
const SellerProducts = lazy(() => import('@/pages/seller/ProductsPage'));
const SellerAddProduct = lazy(() => import('@/pages/seller/AddProductPage'));
const SellerEditProduct = lazy(() => import('@/pages/seller/EditProductPage'));
const SellerProfile = lazy(() => import('@/pages/seller/ProfilePage'));
const SellerChat = lazy(() => import('@/pages/seller/ChatPage'));
const BuyerProfile = lazy(() => import('@/pages/buyer/ProfilePage'));
const BuyerChat = lazy(() => import('@/pages/buyer/ChatPage'));

function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  // ADMIN имеет доступ ко всем секциям включая seller
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') return <Navigate to="/buyer" replace />;
  return <>{children}</>;
}

// Защищает транзакционные buyer-маршруты (корзина, checkout, заказы).
// Просмотр магазинов и товаров остаётся открытым для всех.
function BuyerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user && (user.role === 'SELLER' || user.role === 'ADMIN')) {
    return <Navigate to="/seller" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/buyer" element={<BuyerStores />} />
        <Route path="/buyer/store/:slug" element={<BuyerStore />} />
        <Route path="/buyer/store/:slug/product/:id" element={<BuyerProduct />} />
        <Route path="/buyer/cart" element={<BuyerGuard><BuyerCart /></BuyerGuard>} />
        <Route path="/buyer/checkout" element={<BuyerGuard><BuyerCheckout /></BuyerGuard>} />
        <Route path="/buyer/orders" element={<BuyerGuard><BuyerOrders /></BuyerGuard>} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
        <Route path="/seller" element={<SellerGuard><SellerDashboard /></SellerGuard>} />
        <Route path="/seller/orders" element={<SellerGuard><SellerOrders /></SellerGuard>} />
        <Route path="/seller/store" element={<SellerGuard><SellerStore /></SellerGuard>} />
        <Route path="/seller/products" element={<SellerGuard><SellerProducts /></SellerGuard>} />
        <Route path="/seller/products/add" element={<SellerGuard><SellerAddProduct /></SellerGuard>} />
        <Route path="/seller/products/:id/edit" element={<SellerGuard><SellerEditProduct /></SellerGuard>} />
        <Route path="/seller/profile" element={<SellerGuard><SellerProfile /></SellerGuard>} />
        <Route path="/seller/chat" element={<SellerGuard><SellerChat /></SellerGuard>} />
        <Route path="/buyer/chat" element={<BuyerChat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
