import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadingScreen } from '@/components/layout/LoadingScreen';

const HomePage = lazy(() => import('@/pages/HomePage'));
const BuyerStores = lazy(() => import('@/pages/buyer/StoresPage'));
const BuyerStore = lazy(() => import('@/pages/buyer/StorePage'));
const BuyerCart = lazy(() => import('@/pages/buyer/CartPage'));
const BuyerCheckout = lazy(() => import('@/pages/buyer/CheckoutPage'));
const BuyerOrders = lazy(() => import('@/pages/buyer/OrdersPage'));
const SellerDashboard = lazy(() => import('@/pages/seller/DashboardPage'));
const SellerOrders = lazy(() => import('@/pages/seller/OrdersPage'));
const SellerStore = lazy(() => import('@/pages/seller/StorePage'));

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
        <Route path="/seller" element={<SellerDashboard />} />
        <Route path="/seller/orders" element={<SellerOrders />} />
        <Route path="/seller/store" element={<SellerStore />} />
      </Routes>
    </Suspense>
  );
}
