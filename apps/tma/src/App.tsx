import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { useAuth } from '@/providers/AuthProvider';

const HomePage = lazy(() => import('@/pages/HomePage'));
const BuyerStores = lazy(() => import('@/pages/buyer/StoresPage'));
const BuyerStore = lazy(() => import('@/pages/buyer/StorePage'));
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
const BuyerProfile = lazy(() => import('@/pages/buyer/ProfilePage'));

function SellerGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  // ADMIN имеет доступ ко всем секциям включая seller
  if (user.role !== 'SELLER' && user.role !== 'ADMIN') return <Navigate to="/buyer" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/buyer" element={<BuyerStores />} />
        <Route path="/buyer/store/:slug" element={<BuyerStore />} />
        <Route path="/buyer/cart" element={<BuyerCart />} />
        <Route path="/buyer/checkout" element={<BuyerCheckout />} />
        <Route path="/buyer/orders" element={<BuyerOrders />} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
        <Route path="/seller" element={<SellerGuard><SellerDashboard /></SellerGuard>} />
        <Route path="/seller/orders" element={<SellerGuard><SellerOrders /></SellerGuard>} />
        <Route path="/seller/store" element={<SellerGuard><SellerStore /></SellerGuard>} />
        <Route path="/seller/products" element={<SellerGuard><SellerProducts /></SellerGuard>} />
        <Route path="/seller/products/add" element={<SellerGuard><SellerAddProduct /></SellerGuard>} />
        <Route path="/seller/products/:id/edit" element={<SellerGuard><SellerEditProduct /></SellerGuard>} />
        <Route path="/seller/profile" element={<SellerGuard><SellerProfile /></SellerGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
