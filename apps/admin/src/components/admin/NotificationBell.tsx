import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShoppingCart, Shield, Store, CheckCheck } from 'lucide-react'
import { useTranslation } from '../../lib/i18n'
import { useAdminNotifications, type AdminNotification, type AdminNotificationType } from '../../lib/useAdminNotifications'

// ADMIN-NOTIFICATIONS-001
//
// Bell icon + dropdown с агрегированными уведомлениями (moderation/orders/stores).
// Polling каждые 30 сек, состояние "прочитано" — в localStorage админ-приложения.

const ICON_BY_TYPE: Record<AdminNotificationType, typeof ShoppingCart> = {
  MODERATION_OPEN: Shield,
  ORDER_PENDING: ShoppingCart,
  STORE_PENDING_REVIEW: Store,
}

const COLOR_BY_TYPE: Record<AdminNotificationType, string> = {
  MODERATION_OPEN: 'var(--warning, #f59e0b)',
  ORDER_PENDING: 'var(--info, #38bdf8)',
  STORE_PENDING_REVIEW: 'var(--primary, #a78bfa)',
}

function formatRelative(iso: string, t: (k: string, v?: Record<string, string | number>) => string): string {
  const d = new Date(iso).getTime()
  if (Number.isNaN(d)) return ''
  const diff = Math.max(0, Date.now() - d)
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return t('notifications.justNow')
  if (minutes < 60) return t('notifications.minutesAgo', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('notifications.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  return t('notifications.daysAgo', { n: days })
}

interface NotificationItemProps {
  ev: AdminNotification
  read: boolean
  onClick: () => void
  t: (k: string, v?: Record<string, string | number>) => string
}

function NotificationItem({ ev, read, onClick, t }: NotificationItemProps) {
  const Icon = ICON_BY_TYPE[ev.type] ?? Bell
  const color = COLOR_BY_TYPE[ev.type] ?? 'var(--text-dim)'
  const typeLabel = t(`notifications.type.${ev.type}`)
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors"
      style={{
        background: read ? 'transparent' : 'var(--surface2)',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = read ? 'transparent' : 'var(--surface2)' }}
    >
      <span
        className="shrink-0 mt-0.5 rounded-full p-1.5"
        style={{ background: `${color}22`, color }}
        aria-hidden="true"
      >
        <Icon size={14} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-semibold uppercase tracking-wide"
            style={{ color }}
          >
            {typeLabel}
          </span>
          {!read && (
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--primary)' }}
              aria-label={t('notifications.unreadDot')}
            />
          )}
        </span>
        <span className="block text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>
          {ev.title}
        </span>
        {ev.body && (
          <span className="block text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
            {ev.body}
          </span>
        )}
        <span className="block text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
          {formatRelative(ev.createdAt, t)}
        </span>
      </span>
    </button>
  )
}

export function NotificationBell() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { events, unreadCount, markAllRead, markRead, loading, isRead } = useAdminNotifications(true)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Закрываем дропдаун при клике вне.
  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const handleItemClick = (ev: AdminNotification) => {
    markRead(ev.id)
    setOpen(false)
    navigate(ev.link)
  }

  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    markAllRead()
  }

  const badge = unreadCount > 99 ? '99+' : String(unreadCount)
  const hasUnread = unreadCount > 0

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-md transition-colors"
        style={{
          background: open ? 'var(--surface2)' : 'transparent',
          color: 'var(--text-muted)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('notifications.openAria')}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <Bell size={16} />
        {hasUnread && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums"
            style={{
              background: 'var(--error, #ef4444)',
              color: '#fff',
              border: '1px solid var(--surface)',
            }}
            aria-label={t('notifications.unreadCountAria', { n: unreadCount })}
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t('notifications.dropdownAria')}
          className="absolute right-0 top-[calc(100%+6px)] z-[60] w-[360px] max-w-[92vw] rounded-lg shadow-xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            // shadow только в темной — fallback через box-shadow
            boxShadow: '0 10px 32px rgba(0,0,0,0.32)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} style={{ color: 'var(--text-dim)' }} />
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
                {t('notifications.title')}
              </span>
              {hasUnread && (
                <span
                  className="text-[11px] px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            {hasUnread && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                <CheckCheck size={12} />
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 400 }}>
            {loading && events.length === 0 && (
              <div className="px-3 py-6 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('common.loading')}
              </div>
            )}
            {!loading && events.length === 0 && (
              <div className="px-3 py-8 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                {t('notifications.empty')}
              </div>
            )}
            {events.map((ev) => (
              <NotificationItem
                key={ev.id}
                ev={ev}
                read={isRead(ev.id)}
                onClick={() => handleItemClick(ev)}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

