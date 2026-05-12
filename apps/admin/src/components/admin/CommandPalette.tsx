import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  LayoutDashboard, Users, UserCog, Store, ShoppingCart, Package, Tags,
  Shield, BarChart2, Activity, ScrollText, Database, Megaphone,
  MessageSquare, Flag, Heart, ToggleLeft, Lock, Search,
} from 'lucide-react'
import { api } from '../../lib/api'

interface UserHit { id: string; phone: string; fullName?: string | null }
interface StoreHit { id: string; name: string; slug: string }
interface OrderHit { id: string; orderNumber: string; customerPhone: string }

const ROUTES = [
  { path: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/users',               icon: Users,           label: 'Пользователи' },
  { path: '/sellers',             icon: UserCog,         label: 'Продавцы' },
  { path: '/stores',              icon: Store,           label: 'Магазины' },
  { path: '/products',            icon: Package,         label: 'Товары' },
  { path: '/categories',          icon: Tags,            label: 'Категории' },
  { path: '/orders',              icon: ShoppingCart,    label: 'Заказы' },
  { path: '/moderation',          icon: Shield,          label: 'Модерация' },
  { path: '/analytics',           icon: BarChart2,       label: 'Аналитика' },
  { path: '/analytics/events',    icon: Activity,        label: 'События' },
  { path: '/audit-logs',          icon: ScrollText,      label: 'Аудит-лог' },
  { path: '/database',            icon: Database,        label: 'База данных' },
  { path: '/broadcast',           icon: Megaphone,       label: 'Рассылка' },
  { path: '/chats',               icon: MessageSquare,   label: 'Чаты' },
  { path: '/reports',             icon: Flag,            label: 'Жалобы' },
  { path: '/system/health',       icon: Heart,           label: 'System Health' },
  { path: '/system/feature-flags', icon: ToggleLeft,     label: 'Feature flags' },
  { path: '/admins',              icon: Shield,          label: 'Администраторы' },
  { path: '/security/mfa',        icon: Lock,            label: 'MFA setup' },
] as const

export function CommandPalette() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserHit[]>([])
  const [stores, setStores] = useState<StoreHit[]>([])
  const [orders, setOrders] = useState<OrderHit[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<number | null>(null)

  // Toggle on Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Debounced search across users/stores/orders
  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) {
      setUsers([]); setStores([]); setOrders([])
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true)
      try {
        const [u, s, o] = await Promise.allSettled([
          api.get<{ users: UserHit[] }>(`/api/v1/admin/users?search=${encodeURIComponent(q)}&limit=5`),
          api.get<{ stores: StoreHit[] }>(`/api/v1/admin/stores?search=${encodeURIComponent(q)}&limit=5`),
          api.get<{ orders: OrderHit[] }>(`/api/v1/admin/orders?search=${encodeURIComponent(q)}&limit=5`),
        ])
        setUsers(u.status === 'fulfilled' ? u.value.users ?? [] : [])
        setStores(s.status === 'fulfilled' ? s.value.stores ?? [] : [])
        setOrders(o.status === 'fulfilled' ? o.value.orders ?? [] : [])
      } finally {
        setSearching(false)
      }
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [search])

  const go = (path: string) => {
    navigate(path)
    setOpen(false)
    setSearch('')
  }

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '15vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 600, maxWidth: '92vw',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        <Command shouldFilter={false} loop>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
            <Search size={16} color="var(--text-muted)" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Найти страницу, пользователя, магазин или заказ..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }}
            />
            {searching && (
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Поиск...</span>
            )}
            <kbd style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Esc</kbd>
          </div>

          <Command.List style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
            <Command.Empty style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
              Ничего не найдено
            </Command.Empty>

            <Command.Group
              heading="Навигация"
              style={cmdGroupStyle}
            >
              {ROUTES.filter(r => !search || r.label.toLowerCase().includes(search.toLowerCase())).map(({ path, icon: Icon, label }) => (
                <Command.Item key={path} value={`nav-${path}-${label}`} onSelect={() => go(path)} style={cmdItemStyle}>
                  <Icon size={14} color="var(--text-dim)" />
                  <span style={{ flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{path}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {users.length > 0 && (
              <Command.Group heading="Пользователи" style={cmdGroupStyle}>
                {users.map(u => (
                  <Command.Item key={`u-${u.id}`} value={`user-${u.id}`} onSelect={() => go(`/users/${u.id}`)} style={cmdItemStyle}>
                    <Users size={14} color="var(--text-dim)" />
                    <span style={{ flex: 1, fontFamily: 'monospace' }}>{u.phone}</span>
                    {u.fullName && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.fullName}</span>}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {stores.length > 0 && (
              <Command.Group heading="Магазины" style={cmdGroupStyle}>
                {stores.map(s => (
                  <Command.Item key={`s-${s.id}`} value={`store-${s.id}`} onSelect={() => go(`/stores/${s.id}`)} style={cmdItemStyle}>
                    <Store size={14} color="var(--text-dim)" />
                    <span style={{ flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>/{s.slug}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {orders.length > 0 && (
              <Command.Group heading="Заказы" style={cmdGroupStyle}>
                {orders.map(o => (
                  <Command.Item key={`o-${o.id}`} value={`order-${o.id}`} onSelect={() => go(`/orders?search=${o.orderNumber}`)} style={cmdItemStyle}>
                    <ShoppingCart size={14} color="var(--text-dim)" />
                    <span style={{ flex: 1, fontFamily: 'monospace' }}>{o.orderNumber}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'monospace' }}>{o.customerPhone}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span><kbd style={kbdStyle}>↑↓</kbd> навигация</span>
              <span><kbd style={kbdStyle}>↵</kbd> выбрать</span>
              <span><kbd style={kbdStyle}>Esc</kbd> закрыть</span>
            </div>
            <span>Cmd+K</span>
          </div>
        </Command>
      </div>
    </div>
  )
}

const cmdGroupStyle: React.CSSProperties = {
  marginBottom: 6,
}
const cmdItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 12px', borderRadius: 8,
  fontSize: 13, color: 'var(--text)',
  cursor: 'pointer',
}
const kbdStyle: React.CSSProperties = {
  padding: '1px 5px', borderRadius: 3,
  background: 'var(--surface2)', border: '1px solid var(--border)',
  fontFamily: 'monospace',
}
