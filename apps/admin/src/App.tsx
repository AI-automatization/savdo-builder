import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { auth } from './lib/api'
import { ImpersonationProvider } from './lib/impersonation'
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
import AdminUsersPage from './pages/AdminUsersPage'
import MfaSetupPage from './pages/MfaSetupPage'

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

function QueuesRedirect() {
  useEffect(() => {
    const apiUrl = (import.meta as any).env?.VITE_API_URL ?? ''
    window.location.assign(`${apiUrl}/api/v1/admin/queues`)
  }, [])
  return (
    <div style={{ padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
      Открываем Bull Board...
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ImpersonationProvider>
        <AuthLogoutListener />
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{ style: { fontSize: '13px' } }}
        />
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
            <Route path="admins" element={<AdminUsersPage />} />
            <Route path="security/mfa" element={<MfaSetupPage />} />
            <Route path="queues" element={<QueuesRedirect />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ImpersonationProvider>
    </BrowserRouter>
  )
}
