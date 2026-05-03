import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { auth } from './lib/api'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import SellersPage from './pages/SellersPage'
import SellerDetailPage from './pages/SellerDetailPage'
import StoresPage from './pages/StoresPage'
import StoreDetailPage from './pages/StoreDetailPage'
import OrdersPage from './pages/OrdersPage'
import ProductsPage from './pages/ProductsPage'
import ModerationPage from './pages/ModerationPage'
import ModerationDetailPage from './pages/ModerationDetailPage'
import AuditLogsPage from './pages/AuditLogsPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import DatabasePage from './pages/DatabasePage'
import BroadcastPage from './pages/BroadcastPage'
import ChatsPage from './pages/ChatsPage'
import AnalyticsDashboardPage from './pages/AnalyticsDashboardPage'
import AnalyticsEventsPage from './pages/AnalyticsEventsPage'
import CategoriesPage from './pages/CategoriesPage'
import ReportsPage from './pages/ReportsPage'
import SystemHealthPage from './pages/SystemHealthPage'
import FeatureFlagsPage from './pages/FeatureFlagsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const hasAccess  = !!auth.getAccess()
  const hasRefresh = !!auth.getRefresh()
  return (hasAccess || hasRefresh) ? <>{children}</> : <Navigate to="/login" replace />
}

function AuthLogoutListener() {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = () => navigate('/login', { replace: true })
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [navigate])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthLogoutListener />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="sellers/:id" element={<SellerDetailPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:id" element={<StoreDetailPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="moderation/:id" element={<ModerationDetailPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="broadcast" element={<BroadcastPage />} />
          <Route path="chats" element={<ChatsPage />} />
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="analytics/events" element={<AnalyticsEventsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="system/health" element={<SystemHealthPage />} />
          <Route path="system/feature-flags" element={<FeatureFlagsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
