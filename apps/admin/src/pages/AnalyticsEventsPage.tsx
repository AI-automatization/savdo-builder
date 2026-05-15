import { useState } from 'react'
import { BarChart2, Search, X, RefreshCw, AlertCircle } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { PageHeader } from '../components/admin/PageHeader'
import { Panel } from '../components/admin/Panel'
import { PaginationBar } from '../components/admin/PaginationBar'
import { EmptyState } from '../components/admin/EmptyState'

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
  storefront_viewed:    { bg: 'rgba(129,140,248,0.12)', text: '#818CF8' },
  product_viewed:       { bg: 'rgba(129,140,248,0.10)', text: '#818CF8' },
  add_to_cart:          { bg: 'rgba(34,197,94,0.12)',   text: '#22C55E' },
  checkout_started:     { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B' },
  order_created:        { bg: 'rgba(34,197,94,0.15)',   text: '#22C55E' },
  order_status_changed: { bg: 'rgba(245,158,11,0.10)',  text: '#F59E0B' },
  store_link_copied:    { bg: 'rgba(129,140,248,0.10)', text: '#818CF8' },
  store_published:      { bg: 'rgba(34,197,94,0.10)',   text: '#22C55E' },
  product_created:      { bg: 'rgba(34,197,94,0.10)',   text: '#22C55E' },
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
    <div className="px-8 pt-8 pb-12 min-h-screen">
      <PageHeader
        icon={<BarChart2 size={20} />}
        title="Analytics Events"
        subtitle="Лента аналитических событий платформы в реальном времени"
        count={total > 0 ? total : undefined}
        actions={
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px]"
            style={{
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> Обновить
          </button>
        }
      />

      {/* Filters */}
      <div className="flex gap-2.5 mb-5 flex-wrap items-center">
        {/* Event name buttons */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setEventName(''); setPage(1) }}
            className="h-8 px-3.5 rounded-lg text-[12px] font-semibold"
            style={{
              cursor: 'pointer',
              border: !eventName ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: !eventName ? 'var(--primary)' : 'var(--surface2)',
              color: !eventName ? 'white' : 'var(--text-muted)',
            }}
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
                className="h-8 px-3 rounded-lg text-[12px] font-semibold"
                style={{
                  cursor: 'pointer',
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
        <div className="flex gap-1.5 items-center ml-auto">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={storeIdInput}
              onChange={e => setStoreIdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyStore()}
              placeholder="Store ID..."
              className="pl-8 pr-3 h-8 rounded-lg text-[12px] font-mono outline-none w-48"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text)',
              }}
            />
          </div>
          <button
            onClick={applyStore}
            className="h-8 px-3 rounded-lg text-[13px] font-semibold"
            style={{ border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}
          >
            Найти
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="h-8 px-3 rounded-lg text-[12px] flex items-center gap-1"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface2)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={12} /> Сброс
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-[13px]"
          style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error-soft)', color: 'var(--error)' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Events table */}
      <Panel>
        <div className="overflow-hidden -m-6 rounded-xl">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Событие', 'Actor', 'Store', 'Сессия', 'Когда', 'Payload'].map(col => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[14px]" style={{ color: 'var(--text-muted)' }}>
                    Загрузка...
                  </td>
                </tr>
              )}
              {!loading && events.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<BarChart2 size={32} />}
                      title={hasFilters ? 'Событий не найдено с текущими фильтрами' : 'Нет событий'}
                    />
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
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface2)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className="px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
                          style={{ background: c.bg, color: c.text }}
                        >
                          {ev.eventName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {ev.actorUserId ? (
                          <span title={ev.actorUserId}>{ev.actorUserId.slice(0, 8)}…</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                        {ev.actorType && (
                          <span
                            className="ml-1.5 text-[10px] px-1 py-0.5 rounded"
                            style={{ background: 'var(--surface2)', color: 'var(--text-muted)' }}
                          >
                            {ev.actorType}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {ev.storeId ? (
                          <span title={ev.storeId}>{ev.storeId.slice(0, 8)}…</span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[11px] font-mono" style={{ color: 'var(--text-dim)' }}>
                        {ev.sessionKey ? ev.sessionKey.slice(0, 10) + '…' : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(ev.createdAt)}
                      </td>
                      <td
                        className="px-4 py-2.5 text-[11px] font-mono max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {payloadShort !== '{}' ? payloadShort : <span style={{ color: 'var(--text-dim)' }}>∅</span>}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={ev.id + '_exp'} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                        <td colSpan={6} className="px-5 py-3">
                          <div className="flex gap-8 flex-wrap">
                            <div>
                              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>ID события</div>
                              <code className="text-[12px] px-2 py-0.5 rounded" style={{ color: 'var(--text)', background: 'var(--surface)' }}>{ev.id}</code>
                            </div>
                            {ev.actorUserId && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Actor ID</div>
                                <code className="text-[12px] px-2 py-0.5 rounded" style={{ color: 'var(--text)', background: 'var(--surface)' }}>{ev.actorUserId}</code>
                              </div>
                            )}
                            {ev.storeId && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Store ID</div>
                                <code className="text-[12px] px-2 py-0.5 rounded" style={{ color: 'var(--text)', background: 'var(--surface)' }}>{ev.storeId}</code>
                              </div>
                            )}
                            <div>
                              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Время</div>
                              <span className="text-[12px]" style={{ color: 'var(--text)' }}>{new Date(ev.createdAt).toLocaleString('ru-RU')}</span>
                            </div>
                            <div className="basis-full">
                              <div className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>Payload</div>
                              <pre
                                className="m-0 text-[12px] px-3.5 py-2.5 rounded-lg overflow-auto max-h-48"
                                style={{ color: 'var(--text)', background: 'var(--surface)', border: '1px solid var(--border)' }}
                              >
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
      </Panel>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <PaginationBar page={page} totalPages={totalPages} total={total} itemsLabel="событий" onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
