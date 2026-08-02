import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'

// ADMIN-NOTIFICATIONS-001
//
// Polling-based hook для админ-уведомлений. Без WebSocket: один админ,
// 30-секундный интервал, экономия соединений. Состояние "прочитано"
// хранится в localStorage (массив id), потому что отдельной таблицы
// AdminNotificationRead на бэке нет.

export type AdminNotificationType =
  | 'MODERATION_OPEN'
  | 'ORDER_PENDING'
  | 'STORE_PENDING_REVIEW'

export interface AdminNotification {
  id: string
  type: AdminNotificationType
  title: string
  body: string
  link: string
  createdAt: string
  entityId: string
}

interface AdminNotificationsResponse {
  events: AdminNotification[]
  total: number
  counts: { moderation: number; orders: number; stores: number }
}

const STORAGE_KEY = 'admin_notifications_read_ids'
const POLL_INTERVAL_MS = 30_000
const MAX_READ_IDS_STORED = 200 // не раздуваем localStorage бесконечно

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return new Set(parsed.filter((x) => typeof x === 'string'))
    return new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Trim oldest if слишком много — Set не гарантирует order, но мы держим
    // последние ~MAX штук чтобы предотвратить разрастание.
    const arr = Array.from(ids).slice(-MAX_READ_IDS_STORED)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
  } catch {
    // ignore — приватный режим
  }
}

interface UseAdminNotificationsResult {
  events: AdminNotification[]
  loading: boolean
  error: string | null
  unreadCount: number
  counts: { moderation: number; orders: number; stores: number } | null
  readIds: Set<string>
  isRead: (id: string) => boolean
  markAllRead: () => void
  markRead: (id: string) => void
  refetch: () => void
}

export function useAdminNotifications(enabled = true): UseAdminNotificationsResult {
  const [events, setEvents] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)
  const [counts, setCounts] = useState<{ moderation: number; orders: number; stores: number } | null>(null)
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds())

  // Используем ref чтобы избежать гонок при unmount / fast refresh.
  const aliveRef = useRef(true)
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<AdminNotificationsResponse>('/api/v1/admin/notifications?limit=20')
      if (!aliveRef.current) return
      setEvents(res.events ?? [])
      setCounts(res.counts ?? null)
      setError(null)
    } catch (e: any) {
      if (!aliveRef.current) return
      // Не показываем error баннер: уведомления не критичны для работы админки.
      setError(e?.message ?? 'fetch error')
    } finally {
      if (aliveRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    // Запускаем cразу + setInterval.
    fetchNotifications()
    const id = window.setInterval(fetchNotifications, POLL_INTERVAL_MS)

    // Пауза при скрытой вкладке — экономим запросы, refetch при возвращении.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchNotifications()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, fetchNotifications])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      for (const ev of events) next.add(ev.id)
      saveReadIds(next)
      return next
    })
  }, [events])

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveReadIds(next)
      return next
    })
  }, [])

  const unreadCount = events.reduce((acc, ev) => (readIds.has(ev.id) ? acc : acc + 1), 0)

  const isRead = useCallback((id: string) => readIds.has(id), [readIds])

  return {
    events,
    loading,
    error,
    unreadCount,
    counts,
    readIds,
    isRead,
    markAllRead,
    markRead,
    refetch: fetchNotifications,
  }
}

// Помощник для других мест: проверить прочитано ли уведомление.
export function isNotificationRead(id: string): boolean {
  return loadReadIds().has(id)
}
