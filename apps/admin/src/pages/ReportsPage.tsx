import { useState } from 'react'
import { Flag, RefreshCw, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'
import { confirmDialog } from '../components/admin/ConfirmDialog'
import { useNavigate } from 'react-router-dom'

interface ReportRow {
  id: string
  body: string
  reportedAt: string
  createdAt: string
  threadId: string
  threadStatus: string
  buyerPhone: string | null
  storeName: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReportsPage() {
  const navigate = useNavigate()
  const [dismissingId, setDismissingId] = useState<string | null>(null)

  const { data: reports, loading, refetch } = useFetch<ReportRow[]>('/api/v1/admin/chat/reports')

  const dismiss = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Снять жалобу?',
      body: 'Сообщение останется опубликованным. Если жалоба обоснована — лучше удалить через ChatsPage.',
      confirmText: 'Снять жалобу',
    })
    if (!ok) return
    setDismissingId(id)
    try {
      await api.delete(`/api/v1/admin/chat/messages/${id}/report`)
      toast.success('Жалоба снята')
      refetch()
    } catch {
      toast.error('Не удалось снять жалобу')
    } finally {
      setDismissingId(null)
    }
  }

  const rows = reports ?? []

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Жалобы на сообщения
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Сообщения, на которые пожаловались пользователи
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, background: rows.length > 0 ? 'rgba(239,68,68,0.12)' : 'var(--surface2)', border: `1px solid ${rows.length > 0 ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`, color: rows.length > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: 700 }}>
            {loading ? '...' : rows.length} жалоб
          </span>
          <button
            onClick={() => refetch()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
          >
            <RefreshCw size={14} /> Обновить
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['Сообщение', 'Магазин', 'Покупатель', 'Дата жалобы', 'Тред', ''].map((h) => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Загрузка...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 64, textAlign: 'center' }}>
                  <CheckCircle size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#4ade80', opacity: 0.6 }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>Жалоб нет</p>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-dim)', fontSize: 12 }}>Все сообщения чистые</p>
                </td>
              </tr>
            ) : rows.map((r, i) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  background: 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                {/* Message text */}
                <td style={{ padding: '13px 16px', maxWidth: 320 }}>
                  <div style={{
                    fontSize: 13, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    padding: '5px 10px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)',
                  }}>
                    <Flag size={11} style={{ display: 'inline', marginRight: 6, color: '#f87171', verticalAlign: 'middle' }} />
                    {r.body}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3, display: 'block' }}>
                    Отправлено: {formatDate(r.createdAt)}
                  </span>
                </td>

                {/* Store */}
                <td style={{ padding: '13px 16px', color: 'var(--text)', fontSize: 13 }}>
                  {r.storeName ?? <span style={{ color: 'var(--text-dim)' }}>—</span>}
                </td>

                {/* Buyer phone */}
                <td style={{ padding: '13px 16px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'monospace' }}>
                  {r.buyerPhone ?? '—'}
                </td>

                {/* Reported at */}
                <td style={{ padding: '13px 16px', color: '#f87171', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {formatDate(r.reportedAt)}
                </td>

                {/* Thread status */}
                <td style={{ padding: '13px 16px' }}>
                  <button
                    onClick={() => navigate(`/chats?thread=${r.threadId}`)}
                    title="Открыть диалог в разделе Чаты"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                      background: 'var(--surface2)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <ExternalLink size={12} /> Открыть тред
                  </button>
                </td>

                {/* Dismiss */}
                <td style={{ padding: '13px 16px' }}>
                  <button
                    onClick={() => dismiss(r.id)}
                    disabled={dismissingId === r.id}
                    title="Снять жалобу (сообщение не удаляется)"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 7, fontSize: 12, cursor: 'pointer',
                      background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)',
                      color: '#4ade80', opacity: dismissingId === r.id ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <CheckCircle size={12} />
                    {dismissingId === r.id ? '...' : 'Снять жалобу'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
