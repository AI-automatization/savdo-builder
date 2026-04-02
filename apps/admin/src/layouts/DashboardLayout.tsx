import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useCallback } from 'react'
import { auth, api } from '../lib/api'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Store, ShoppingCart,
  Shield, ScrollText, LogOut, Package,
  Search, User, ShoppingBag, ChevronRight,
} from 'lucide-react'

const NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sellers',    icon: Users,           label: 'Продавцы' },
  { to: '/stores',     icon: Store,           label: 'Магазины' },
  { to: '/products',   icon: Package,         label: 'Товары' },
  { to: '/orders',     icon: ShoppingCart,    label: 'Заказы' },
  { to: '/moderation', icon: Shield,          label: 'Модерация' },
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
    setOpen(false); setQ(''); setResults(null)
    navigate(path)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const hasResults = results && (results.users.length + results.orders.length + results.stores.length) > 0

  return (
    <div ref={wrapRef} className="relative px-3 py-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
        <input
          value={q}
          onChange={e => onChange(e.target.value)}
          onFocus={() => q.length >= 2 && setOpen(true)}
          placeholder="Поиск..."
          className="w-full h-7 pl-7 pr-3 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
        />
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 font-mono hidden sm:block">⌘K</kbd>
      </div>

      {open && q.length >= 2 && (
        <div className="absolute left-3 right-3 top-full mt-1 z-50 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
          {loading && <div className="px-3 py-2.5 text-xs text-zinc-500">Поиск...</div>}
          {!loading && !hasResults && results && (
            <div className="px-3 py-4 text-xs text-zinc-500 text-center">Ничего не найдено</div>
          )}
          {!loading && hasResults && (
            <>
              {results!.users.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Пользователи</div>
                  {results!.users.map(u => (
                    <button key={u.id} onClick={() => go('/sellers')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-900 transition-colors">
                      <User size={12} className="text-indigo-400 shrink-0" />
                      <span className="font-mono text-xs text-zinc-200">{u.phone}</span>
                      <span className="ml-auto text-[10px] text-zinc-600">{u.role}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.orders.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Заказы</div>
                  {results!.orders.map(o => (
                    <button key={o.id} onClick={() => go('/orders')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-900 transition-colors">
                      <ShoppingBag size={12} className="text-emerald-400 shrink-0" />
                      <span className="font-mono font-semibold text-xs text-zinc-200">{o.orderNumber}</span>
                      <span className="ml-auto text-[10px] text-zinc-600">{o.store.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results!.stores.length > 0 && (
                <div>
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Магазины</div>
                  {results!.stores.map(s => (
                    <button key={s.id} onClick={() => go(`/stores/${s.id}`)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-900 transition-colors">
                      <Store size={12} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-medium text-zinc-200">{s.name}</span>
                      <span className="ml-auto font-mono text-[10px] text-zinc-600">/{s.slug}</span>
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

export default function DashboardLayout() {
  const navigate = useNavigate()

  const logout = () => {
    auth.clear()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-[220px] shrink-0 fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[#111113] border-r border-zinc-900">

        {/* Logo */}
        <div className="px-4 pt-5 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
              <Store size={14} color="white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-100 leading-none">Savdo</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">Admin Panel</div>
            </div>
          </div>
          <GlobalSearch />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          <p className="px-2 mb-2 text-[10px] font-semibold text-zinc-700 uppercase tracking-widest">
            Управление
          </p>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'group flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300',
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon size={15} className={cn('shrink-0', isActive ? 'text-zinc-100' : 'text-zinc-600 group-hover:text-zinc-400')} />
                  <span className="flex-1 font-medium">{label}</span>
                  {isActive && <ChevronRight size={12} className="text-zinc-600" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-zinc-900">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-zinc-600 hover:bg-zinc-900 hover:text-red-400 transition-colors"
          >
            <LogOut size={15} className="shrink-0" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[220px] flex-1 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
