import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from '../lib/api'
import { cn } from '@/lib/utils'
import { ImpersonationBanner } from '../components/admin/ImpersonationBanner'
import { CommandPalette } from '../components/admin/CommandPalette'
import { useTranslation, SUPPORTED_LOCALES } from '../lib/i18n'
import {
  LayoutDashboard, Users, UserCog, Store, ShoppingCart,
  Shield, ScrollText, LogOut, Package, Database, Megaphone,
  ChevronRight, Search, Sun, Moon, BarChart2, Activity, MessageSquare, Tags, Flag,
  Heart, ToggleLeft, Lock, ListTodo,
} from 'lucide-react'

// MARKETING-LOCALIZATION-UZ-001: лейблы — i18n-ключи, резолвятся через t()
// в рендере (NAV_DATA — module-level const, t() там недоступен).
const NAV_DATA = [
  {
    groupKey: 'nav.group.data',
    items: [
      { to: '/dashboard',  icon: LayoutDashboard, labelKey: 'nav.dashboard' },
      { to: '/users',      icon: Users,           labelKey: 'nav.users' },
      { to: '/sellers',    icon: UserCog,         labelKey: 'nav.sellers' },
      { to: '/stores',     icon: Store,           labelKey: 'nav.stores' },
      { to: '/products',   icon: Package,         labelKey: 'nav.products' },
      { to: '/categories', icon: Tags,            labelKey: 'nav.categories' },
      { to: '/orders',     icon: ShoppingCart,    labelKey: 'nav.orders' },
    ],
  },
  {
    groupKey: 'nav.group.tools',
    items: [
      { to: '/moderation',        icon: Shield,    labelKey: 'nav.moderation' },
      { to: '/analytics',         icon: BarChart2, labelKey: 'nav.analytics' },
      { to: '/analytics/events',  icon: Activity,  labelKey: 'nav.events' },
      { to: '/audit-logs',        icon: ScrollText, labelKey: 'nav.auditLogs' },
      { to: '/database',   icon: Database,        labelKey: 'nav.database' },
      { to: '/broadcast',  icon: Megaphone,       labelKey: 'nav.broadcast' },
      { to: '/chats',      icon: MessageSquare,   labelKey: 'nav.chats' },
      { to: '/reports',    icon: Flag,            labelKey: 'nav.reports' },
    ],
  },
  {
    groupKey: 'nav.group.security',
    items: [
      { to: '/admins',       icon: Shield, labelKey: 'nav.admins' },
      { to: '/security/mfa', icon: Lock,   labelKey: 'nav.mfa' },
    ],
  },
  {
    groupKey: 'nav.group.devops',
    items: [
      { to: '/system/health',         icon: Heart,      labelKey: 'nav.systemHealth' },
      { to: '/system/feature-flags',  icon: ToggleLeft, labelKey: 'nav.featureFlags' },
      { to: '/queues',                icon: ListTodo,   labelKey: 'nav.queues' },
    ],
  },
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
  const { t, locale, setLocale } = useTranslation()
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

  const openSearch = () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      <CommandPalette />

      {/* Sidebar */}
      <aside
        className="w-[216px] shrink-0 fixed top-0 left-0 bottom-0 z-50 flex flex-col"
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
        aria-label={t('layout.navMain')}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
              <Store size={14} color="white" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-none" style={{ color: 'var(--text)' }}>Savdo</div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('layout.adminPanel')}</div>
            </div>
          </div>

          {/* Search hint — opens command palette */}
          <button
            onClick={openSearch}
            className="w-full flex items-center gap-2 px-2.5 h-8 rounded-md text-xs transition-colors"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--text-dim)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <Search size={12} />
            <span className="flex-1 text-left">{t('layout.search')}</span>
            <kbd className="text-[10px] font-mono opacity-50">⌘K</kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto" aria-label={t('layout.navSections')}>

          {NAV_DATA.map(({ groupKey, items }) => (
            <div key={groupKey} className="mb-4">
              <p
                className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                {t(groupKey)}
              </p>
              <div className="space-y-0.5">
                {items.map(({ to, icon: Icon, labelKey }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => cn(
                      'group relative flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors',
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
                        {/* Active indicator strip */}
                        {isActive && (
                          <span
                            className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-indigo-400"
                          />
                        )}
                        <Icon
                          size={15}
                          className={cn('shrink-0', isActive ? 'text-indigo-400' : '')}
                          style={{ color: isActive ? undefined : 'var(--text-dim)' }}
                        />
                        <span className="flex-1">{t(labelKey)}</span>
                        {isActive && <ChevronRight size={12} className="text-indigo-400/50" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Tashkent clock */}
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-mono" style={{ color: 'var(--text-dim)' }}>
            <span className="tabular-nums">{time}</span>
            <span className="opacity-50">TAS</span>
          </div>

          {/* Language switcher — MARKETING-LOCALIZATION-UZ-001 */}
          <div
            className="flex items-center gap-1 px-2 py-1.5"
            role="group"
            aria-label={t('common.language')}
          >
            {SUPPORTED_LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                className="px-2 py-0.5 rounded text-xs font-semibold uppercase transition-colors"
                aria-pressed={locale === l}
                style={{
                  background: locale === l ? 'var(--surface2)' : 'transparent',
                  color: locale === l ? 'var(--text)' : 'var(--text-dim)',
                  border: `1px solid ${locale === l ? 'var(--border)' : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label={dark ? t('theme.toLight') : t('theme.toDark')}
            aria-pressed={dark}
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
              ? <Sun size={15} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
              : <Moon size={15} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
            }
            {dark ? t('theme.light') : t('theme.dark')}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label={t('layout.logoutAria')}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-error)'
              e.currentTarget.style.color = 'var(--error)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = ''
              e.currentTarget.style.color = 'var(--text-muted)'
            }}
          >
            <LogOut size={15} style={{ color: 'var(--text-dim)' }} aria-hidden="true" />
            {t('layout.logout')}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[216px] flex-1 min-h-screen" id="main" aria-label={t('layout.content')}>
        <ImpersonationBanner />
        <Outlet />
      </main>
    </div>
  )
}
