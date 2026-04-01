import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardPage from './pages/DashboardPage'
import SellersPage from './pages/SellersPage'
import StoresPage from './pages/StoresPage'
import OrdersPage from './pages/OrdersPage'
import ModerationPage from './pages/ModerationPage'
import AuditLogsPage from './pages/AuditLogsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('access_token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="sellers" element={<SellersPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="moderation" element={<ModerationPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
