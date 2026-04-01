import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Store, ShoppingCart,
  Shield, ScrollText, LogOut, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sellers', icon: Users, label: 'Продавцы' },
  { to: '/stores', icon: Store, label: 'Магазины' },
  { to: '/orders', icon: ShoppingCart, label: 'Заказы' },
  { to: '/moderation', icon: Shield, label: 'Модерация', badge: 3 },
  { to: '/audit-logs', icon: ScrollText, label: 'Аудит-лог' },
]

export default function DashboardLayout() {
  const navigate = useNavigate()
  const [dark, setDark] = useState(true)

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const logout = () => {
    sessionStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            }}>
              <Store size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>Savdo</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            padding: '4px 10px 8px', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            Управление
          </div>
          {NAV.map(({ to, icon: Icon, label, badge }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-dim)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.15s',
            })}>
              <Icon size={16} />
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  background: 'var(--error)', color: 'white',
                  fontSize: 11, fontWeight: 700, borderRadius: 10,
                  padding: '1px 6px', minWidth: 18, textAlign: 'center',
                }}>
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <button onClick={toggleTheme} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--text-muted)', fontSize: 13, marginBottom: 2,
          }}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? 'Светлая тема' : 'Тёмная тема'}
          </button>
          <button onClick={logout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--error)', fontSize: 13,
          }}>
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh' }}>
        <Outlet />
      </main>
    </div>
  )
}
