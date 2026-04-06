import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '../lib/api'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, UserCog, Store, ShoppingCart,
  Shield, ScrollText, LogOut, Package, Database, Megaphone,
  ChevronRight, Search, Sun, Moon,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users',      icon: Users,           label: 'Пользователи' },
  { to: '/sellers',    icon: UserCog,         label: 'Продавцы' },
  { to: '/stores',     icon: Store,           label: 'Магазины' },
  { to: '/products',   icon: Package,         label: 'Товары' },
  { to: '/orders',     icon: ShoppingCart,    label: 'Заказы' },
  { to: '/moderation', icon: Shield,          label: 'Модерация' },
  { to: '/audit-logs', icon: ScrollText,      label: 'Аудит-лог' },
  { to: '/database',   icon: Database,        label: 'База данных' },
  { to: '/broadcast',  icon: Megaphone,       label: 'Рассылка' },
]

function useTashkentClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  )
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('ru-RU', { timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(t)
  }, [])
  return time
}

function getInitialDark(): boolean {
  const saved = localStorage.getItem('admin-theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const time = useTashkentClock()
  const [dark, setDark] = useState(() => {
    const isDark = getInitialDark()
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    return isDark
  })

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('admin-theme', next ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
  }

  const logout = () => {
    auth.clear()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="w-[216px] shrink-0 fixed top-0 left-0 bottom-0 z-50 flex flex-col"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Store size={14} color="white" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none" style={{ color: 'var(--text)' }}>Savdo</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Admin Panel</div>
            </div>
          </div>

          {/* Search hint — Cmd+K */}
          <button
            className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md text-xs transition-colors"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-dim)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Search size={12} />
            <span className="flex-1 text-left">Поиск...</span>
            <kbd className="text-[10px] font-mono opacity-50">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            Управление
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'group flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive ? 'bg-indigo-500/10 text-indigo-400' : '',
              )}
              style={({ isActive }) => ({
                color: isActive ? undefined : 'var(--text-muted)',
              })}
              onMouseEnter={e => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.background = 'var(--surface2)'
                  el.style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.background = ''
                  el.style.color = 'var(--text-muted)'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={cn('shrink-0', isActive ? 'text-indigo-400' : '')}
                    style={{ color: isActive ? undefined : 'var(--text-dim)' }} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={12} className="text-indigo-400/50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Tashkent clock */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            <span className="tabular-nums">{time}</span>
            <span className="opacity-50">TAS</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface2)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            {dark
              ? <Sun size={15} style={{ color: 'var(--text-dim)' }} />
              : <Moon size={15} style={{ color: 'var(--text-dim)' }} />
            }
            {dark ? 'Светлая тема' : 'Тёмная тема'}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
              e.currentTarget.style.color = 'var(--error)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <LogOut size={15} style={{ color: 'var(--text-dim)' }} />
            Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[216px] flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
