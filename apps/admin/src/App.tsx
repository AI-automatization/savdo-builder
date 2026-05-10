import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'sonner'
import { auth } from './lib/api'
import { ImpersonationProvider } from './lib/impersonation'
import { ConfirmContainer } from './components/admin/ConfirmDialog'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'

// UX-004: lazy-load всех роутов чтобы main bundle уменьшился с ~900КБ до ~300КБ.
// LoginPage оставлен eager — первый экран без сети должен открываться мгновенно.
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const SellersPage = lazy(() => import('./pages/SellersPage'))
const SellerDetailPage = lazy(() => import('./pages/SellerDetailPage'))
const StoresPage = lazy(() => import('./pages/StoresPage'))
const StoreDetailPage = lazy(() => import('./pages/StoreDetailPage'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const ModerationPage = lazy(() => import('./pages/ModerationPage'))
const ModerationDetailPage = lazy(() => import('./pages/ModerationDetailPage'))
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage'))
const DatabasePage = lazy(() => import('./pages/DatabasePage'))
const BroadcastPage = lazy(() => import('./pages/BroadcastPage'))
const ChatsPage = lazy(() => import('./pages/ChatsPage'))
const AnalyticsDashboardPage = lazy(() => import('./pages/AnalyticsDashboardPage'))
const AnalyticsEventsPage = lazy(() => import('./pages/AnalyticsEventsPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const SystemHealthPage = lazy(() => import('./pages/SystemHealthPage'))
const FeatureFlagsPage = lazy(() => import('./pages/FeatureFlagsPage'))
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'))
const MfaSetupPage = lazy(() => import('./pages/MfaSetupPage'))

function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, color: 'var(--text-muted)', fontSize: 13 }}>
      Загрузка…
    </div>
  )
}

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
    // Bull Board защищён JWT — передаём admin access token в query.
    // Сервер примет либо BULL_BOARD_TOKEN (legacy), либо валидный admin JWT.
    const accessToken = auth.getAccess() ?? ''
    const tokenParam = accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''
    window.location.assign(`${apiUrl}/api/v1/admin/queues${tokenParam}`)
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
        <ConfirmContainer />
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
          closeButton
          toastOptions={{ style: { fontSize: '13px' } }}
        />
        <Suspense fallback={<PageFallback />}>
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
        </Suspense>
      </ImpersonationProvider>
    </BrowserRouter>
  )
}
