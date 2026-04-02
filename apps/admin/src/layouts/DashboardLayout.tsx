import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { auth, api } from '../lib/api'
import {
  LayoutDashboard, Users, Store, ShoppingCart,
  Shield, ScrollText, LogOut, Sun, Moon, Package,
  Search, User, ShoppingBag,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sellers',    icon: Users,           label: 'Продавцы' },
  { to: '/stores',     icon: Store,           label: 'Магазины' },
  { to: '/products',   icon: Package,         label: 'Товары' },
  { to: '/orders',     icon: ShoppingCart,    label: 'Заказы' },
  { to: '/moderation', icon: Shield,          label: 'Модерация', badge: undefined },
  { to: '/audit-logs', icon: ScrollText,      label: 'Аудит-лог' },
]

// ── Global Search ─────────────────────────────────────────────────────────────

interface SearchResult {
  users:  { id: string; phone: string; role: string }[]
  orders: { id: string; orderNumber: string; status: string; store: { name: string } }[]
  stores: { id: string; name: string; slug: string; seller: { id: string } }[]
}

function GlobalSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (query: string) => {
    if (query.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const data = await api.get<SearchResult>(`/api/v1/admin/search?q=${encodeURIComponent(query)}`)
      setResults(data)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  function onChange(val: string) {
    setQ(val)
    setOpen(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(val), 350)
  }

  function go(path: string) {
    setOpen(false)
    setQ('')
    setResults(null)
    navigate(path)
  }

  useEffect(() => {
    function onClickOut(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOut)
    return () => document.removeEventListener('mousedown', onClickOut)
  }, [])

  const hasResults = results && (results.users.length + results.orders.length + results.stores.length) > 0

  return (
    <div ref={wrapRef} style={{ position: 'relative', padding: '8px 10px' }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={q}
          onChange={e => onChange(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          placeholder="Поиск: телефон, номер, slug..."
          style={{
            width: '100%', padding: '8px 10px 8px 28px', borderRadius: 8, boxSizing: 'border-box',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 12, outline: 'none',
          }}
        />
      </div>

      {open && q.length >= 2 && (
        <div style={{
          position: 'absolute', left: 10, right: 10, top: '100%', marginTop: 4, zIndex: 200,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)', overflow: 'hidden', maxHeight: 380, overflowY: 'auto',
        }}>
          {loading && (
            <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: 12 }}>Поиск...</div>
          )}
          {!loading && !hasResults && results && (
            <div style={{ padding: '14px', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>Ничего не найдено</div>
          )}
          {!loading && hasResults && (
            <>
              {results!.users.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Пользователи</div>
                  {results!.users.map(u => (
                    <button key={u.id} onClick={() => go(`/sellers`)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <User size={13} color="var(--primary)" />
                      <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--text)' }}>{u.phone}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.orders.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Заказы</div>
                  {results!.orders.map(o => (
                    <button key={o.id} onClick={() => go(`/orders`)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <ShoppingBag size={13} color="#10B981" />
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{o.orderNumber}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{o.store.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.stores.length > 0 && (
                <div>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Магазины</div>
                  {results!.stores.map(s => (
                    <button key={s.id} onClick={() => go(`/stores/${s.id}`)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <Store size={13} color="#F59E0B" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginLeft: 'auto' }}>/{s.slug}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Layout ────────────────────────────────────────────────────────────────────

function getInitialDark(): boolean {
  const saved = localStorage.getItem('admin-theme')
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export default function DashboardLayout() {
  const navigate = useNavigate()
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
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
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
          <GlobalSearch />
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
