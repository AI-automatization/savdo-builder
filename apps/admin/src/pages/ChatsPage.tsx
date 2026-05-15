import { useState } from 'react'
import { MessageSquare, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { confirmDialog } from '../components/admin/ConfirmDialog'

interface ThreadRow {
  id: string
  status: string
  threadType: string
  lastMessageAt: string | null
  storeName: string | null
  storeSlug: string | null
  buyerPhone: string | null
  lastMessage: string | null
}

interface ThreadDetail {
  id: string
  status: string
  storeName: string | null
  buyerPhone: string | null
  messages: Array<{ id: string; senderUserId: string; body: string; createdAt: string }>
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  OPEN:   { bg: 'rgba(34,211,238,0.10)', color: '#22D3EE' },
  CLOSED: { bg: 'rgba(148,163,184,0.10)', color: '#94A3B8' },
}

export default function ChatsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ThreadDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: raw, loading, refetch } = useFetch<{ data: ThreadRow[]; total: number }>(
    `/api/v1/admin/chat/threads${statusFilter ? `?status=${statusFilter}` : ''}`,
  )

  const threads = (raw?.data ?? []).filter((t) =>
    !search || t.storeName?.toLowerCase().includes(search.toLowerCase()) || t.buyerPhone?.includes(search),
  )

  const openDetail = async (id: string) => {
    setSelectedId(id)
    setDetail(null)
    setDetailLoading(true)
    try {
      const res = await api.get<ThreadDetail>(`/api/v1/admin/chat/threads/${id}/messages`)
      setDetail(res)
    } catch { /* noop */ }
    finally { setDetailLoading(false) }
  }

  const deleteThread = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const ok = await confirmDialog({
      title: 'Удалить диалог?',
      body: 'Все сообщения треда будут удалены безвозвратно. Восстановить нельзя.',
      confirmText: 'Удалить',
      danger: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      await api.delete(`/api/v1/admin/chat/threads/${id}`)
      if (selectedId === id) { setSelectedId(null); setDetail(null) }
      toast.success('Диалог удалён')
      refetch()
    } catch { toast.error('Не удалось удалить') }
    finally { setDeletingId(null) }
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Чаты
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Мониторинг диалогов между покупателями и продавцами
          </p>
        </div>
        <button
          onClick={() => refetch()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по магазину или телефону..."
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
        />
        {(['', 'OPEN', 'CLOSED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: statusFilter === s ? 'var(--primary)' : 'var(--surface2)',
              border: '1px solid var(--border)',
              color: statusFilter === s ? '#fff' : 'var(--text-muted)',
            }}
          >
            {s === '' ? 'Все' : s === 'OPEN' ? 'Открытые' : 'Закрытые'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedId ? '1fr 420px' : '1fr', gap: 20 }}>
        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Магазин', 'Покупатель', 'Статус', 'Последнее сообщение', 'Дата', ''].map((h) => (
                  <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
              ) : !threads.length ? (
                <tr><td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  Чатов не найдено
                </td></tr>
              ) : threads.map((t, i) => {
                const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.CLOSED
                const isSelected = selectedId === t.id
                return (
                  <tr
                    key={t.id}
                    onClick={() => openDetail(t.id)}
                    style={{
                      borderBottom: i < threads.length - 1 ? '1px solid var(--border)' : 'none',
                      cursor: 'pointer',
                      background: isSelected ? 'var(--surface2)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--text)', fontSize: 13 }}>
                      {t.storeName ?? <span style={{ color: 'var(--text-dim)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>
                      {t.buyerPhone ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {t.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, maxWidth: 200 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.lastMessage ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatDate(t.lastMessageAt)}
                    </td>
                    <td style={{ padding: '12px 16px' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => deleteThread(t.id, e)}
                        disabled={deletingId === t.id}
                        title="Удалить диалог"
                        aria-label="Удалить диалог"
                        style={{
                          background: 'var(--surface-error-soft)', border: '1px solid var(--border-error)',
                          borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--error)',
                          opacity: deletingId === t.id ? 0.5 : 1, display: 'flex', alignItems: 'center',
                        }}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {raw && (
            <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--border)' }}>
              Всего: {raw.total}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: '75vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {detail?.storeName ?? '—'}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {detail?.buyerPhone ?? '—'}
                </p>
              </div>
              <button onClick={() => setSelectedId(null)} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailLoading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Загрузка...</p>}
              {!detailLoading && detail?.messages.map((m) => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: 'var(--surface2)', color: 'var(--text)',
                    border: '1px solid var(--border)',
                    maxWidth: '85%',
                  }}>
                    {m.body}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    {new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {!detailLoading && detail?.messages.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Нет сообщений</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
