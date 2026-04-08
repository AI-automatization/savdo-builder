import { useState } from 'react'
import { BarChart2, Search, X, ChevronLeft, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'

interface AnalyticsEvent {
  id: string
  actorUserId: string | null
  actorType: string | null
  storeId: string | null
  eventName: string
  eventPayload: Record<string, unknown>
  sessionKey: string | null
  createdAt: string
}

interface EventsResponse {
  events: AnalyticsEvent[]
  total: number
}

const EVENT_COLORS: Record<string, { bg: string; text: string }> = {
  storefront_viewed:    { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8' },
  product_viewed:       { bg: 'rgba(99,102,241,0.10)',  text: '#818CF8' },
  add_to_cart:          { bg: 'rgba(16,185,129,0.12)',  text: '#10B981' },
  checkout_started:     { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
  order_created:        { bg: 'rgba(16,185,129,0.15)',  text: '#10B981' },
  order_status_changed: { bg: 'rgba(245,158,11,0.10)',  text: '#F59E0B' },
  store_link_copied:    { bg: 'rgba(129,140,248,0.10)', text: '#818CF8' },
  store_published:      { bg: 'rgba(16,185,129,0.10)',  text: '#10B981' },
  product_created:      { bg: 'rgba(16,185,129,0.10)',  text: '#10B981' },
}

const KNOWN_EVENTS = [
  'storefront_viewed', 'product_viewed', 'add_to_cart',
  'checkout_started', 'order_created', 'order_status_changed',
  'store_link_copied', 'store_published', 'product_created',
]

const LIMIT = 50

function eventColor(name: string) {
  return EVENT_COLORS[name] ?? { bg: 'rgba(148,163,184,0.10)', text: '#94A3B8' }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}д назад`
  if (h > 0) return `${h}ч назад`
  const m = Math.floor(diff / 60_000)
  return m > 0 ? `${m}м назад` : 'только что'
}

export default function AnalyticsEventsPage() {
  const [page, setPage] = useState(1)
  const [eventName, setEventName] = useState('')
  const [storeIdInput, setStoreIdInput] = useState('')
  const [storeId, setStoreId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (eventName) params.set('eventName', eventName)
  if (storeId)   params.set('storeId', storeId)

  const { data, loading, error, refetch } = useFetch<EventsResponse>(
    `/api/v1/admin/analytics/events?${params}`,
    [page, eventName, storeId],
  )

  const events = data?.events ?? []
  const total  = data?.total ?? 0
  const totalPages = Math.ceil(total / LIMIT)

  function applyStore() {
    setStoreId(storeIdInput.trim())
    setPage(1)
  }

  function clearFilters() {
    setEventName('')
    setStoreIdInput('')
    setStoreId('')
    setPage(1)
  }

  const hasFilters = !!eventName || !!storeId

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <BarChart2 size={20} color="var(--primary)" />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Analytics Events</h1>
            {total > 0 && (
              <span style={{ padding: '2px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', color: '#818CF8', fontSize: 12, fontWeight: 700 }}>
                {total}
              </span>
            )}
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
            Лента аналитических событий платформы в реальном времени
          </p>
        </div>
        <button
          onClick={refetch}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Event name filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setEventName(''); setPage(1) }}
            style={{ height: 34, padding: '0 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: !eventName ? '1px solid var(--primary)' : '1px solid var(--border)', background: !eventName ? 'var(--primary)' : 'var(--surface2)', color: !eventName ? 'white' : 'var(--text-muted)' }}
          >
            Все события
          </button>
          {KNOWN_EVENTS.map(ev => {
            const c = eventColor(ev)
            const active = eventName === ev
            return (
              <button
                key={ev}
                onClick={() => { setEventName(active ? '' : ev); setPage(1) }}
                style={{
                  height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: active ? `1px solid ${c.text}` : '1px solid var(--border)',
                  background: active ? c.bg : 'var(--surface2)',
                  color: active ? c.text : 'var(--text-muted)',
                }}
              >
                {ev}
              </button>
            )
          })}
        </div>

        {/* Store ID search */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              value={storeIdInput}
              onChange={e => setStoreIdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyStore()}
              placeholder="Store ID..."
              style={{ paddingLeft: 30, paddingRight: 12, height: 34, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 12, outline: 'none', width: 200, fontFamily: 'monospace' }}
            />
          </div>
          <button onClick={applyStore} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Найти
          </button>
          {hasFilters && (
            <button onClick={clearFilters} style={{ height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <X size={12} /> Сброс
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, marginBottom: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Events table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Событие', 'Actor', 'Store', 'Сессия', 'Когда', 'Payload'].map(col => (
                <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Загрузка...</td>
              </tr>
            )}
            {!loading && events.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  {hasFilters ? 'Событий не найдено с текущими фильтрами' : 'Нет событий'}
                </td>
              </tr>
            )}
            {events.map((ev, i) => {
              const c = eventColor(ev.eventName)
              const isExpanded = expandedId === ev.id
              const payloadStr = JSON.stringify(ev.eventPayload)
              const payloadShort = payloadStr.length > 60 ? payloadStr.slice(0, 60) + '…' : payloadStr

              return (
                <>
                  <tr
                    key={ev.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                  >
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, color: c.text, whiteSpace: 'nowrap' }}>
                        {ev.eventName}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {ev.actorUserId ? (
                        <span title={ev.actorUserId}>{ev.actorUserId.slice(0, 8)}…</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                      {ev.actorType && (
                        <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'var(--surface2)', color: 'var(--text-muted)' }}>
                          {ev.actorType}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {ev.storeId ? (
                        <span title={ev.storeId}>{ev.storeId.slice(0, 8)}…</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-dim)' }}>
                      {ev.sessionKey ? ev.sessionKey.slice(0, 10) + '…' : '—'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {timeAgo(ev.createdAt)}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {payloadShort !== '{}' ? payloadShort : <span style={{ color: 'var(--text-dim)' }}>∅</span>}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={ev.id + '_exp'} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                      <td colSpan={6} style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID события</div>
                            <code style={{ fontSize: 12, color: 'var(--text)', background: 'var(--surface)', padding: '3px 8px', borderRadius: 6 }}>{ev.id}</code>
                          </div>
                          {ev.actorUserId && (
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actor ID</div>
                              <code style={{ fontSize: 12, color: 'var(--text)', background: 'var(--surface)', padding: '3px 8px', borderRadius: 6 }}>{ev.actorUserId}</code>
                            </div>
                          )}
                          {ev.storeId && (
                            <div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Store ID</div>
                              <code style={{ fontSize: 12, color: 'var(--text)', background: 'var(--surface)', padding: '3px 8px', borderRadius: 6 }}>{ev.storeId}</code>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Время</div>
                            <span style={{ fontSize: 12, color: 'var(--text)' }}>{new Date(ev.createdAt).toLocaleString('ru-RU')}</span>
                          </div>
                          <div style={{ flexBasis: '100%' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payload</div>
                            <pre style={{ margin: 0, fontSize: 12, color: 'var(--text)', background: 'var(--surface)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', overflow: 'auto', maxHeight: 200 }}>
                              {JSON.stringify(ev.eventPayload, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Стр. {page} из {totalPages} · {total} событий
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === 1 ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 13, cursor: page === 1 ? 'default' : 'pointer' }}
            >
              <ChevronLeft size={14} /> Назад
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: page === totalPages ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: 13, cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              Вперёд <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
