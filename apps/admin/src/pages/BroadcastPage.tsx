import { useRef, useState } from 'react'
import { Send, Eye, AlertCircle, CheckCircle, RefreshCw, Megaphone } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { api } from '../lib/api'

interface BroadcastLog {
  id: string
  message: string
  sentCount: number
  failedCount: number
  createdAt: string
  creator: { phone: string }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TelegramPreview({ text }: { text: string }) {
  const html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gs, '<b>$1</b>')
    .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gs, '<i>$1</i>')
    .replace(/&lt;a href="(.*?)"&gt;(.*?)&lt;\/a&gt;/gs, '<a href="$1" style="color:#5BC8F5">$2</a>')

  return (
    <div style={{ background: '#1a2133', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#818CF8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Превью Telegram
      </div>
      <div style={{
        display: 'inline-block', maxWidth: 320,
        background: '#2b3a5c', borderRadius: '4px 14px 14px 14px',
        padding: '10px 14px', fontSize: 14, lineHeight: 1.5, color: '#E2E8F0',
      }}
        dangerouslySetInnerHTML={{ __html: html || '<span style="opacity:0.4">Введите текст...</span>' }}
      />
    </div>
  )
}

const TOOLBAR_BUTTONS = [
  { label: 'B', title: 'Жирный', open: '<b>', close: '</b>', style: { fontWeight: 800 } },
  { label: 'I', title: 'Курсив', open: '<i>', close: '</i>', style: { fontStyle: 'italic' } },
  { label: '🔗', title: 'Ссылка', open: '<a href="">', close: '</a>', style: {} },
  { label: '🎉', title: 'Праздник', open: '🎉', close: '', style: {} },
  { label: '🔥', title: 'Огонь', open: '🔥', close: '', style: {} },
  { label: '✅', title: 'Галочка', open: '✅', close: '', style: {} },
  { label: '⚠️', title: 'Внимание', open: '⚠️', close: '', style: {} },
  { label: '📢', title: 'Рупор', open: '📢', close: '', style: {} },
]

function wrapSelection(
  el: HTMLTextAreaElement,
  open: string,
  close: string,
  setter: (v: string) => void,
) {
  const { selectionStart: s, selectionEnd: e, value } = el;
  const newVal = value.slice(0, s) + open + value.slice(s, e) + close + value.slice(e);
  setter(newVal);
  setTimeout(() => {
    el.focus();
    el.selectionStart = s + open.length;
    el.selectionEnd = e + open.length;
  }, 0);
}

export default function BroadcastPage() {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [result, setResult] = useState<{ queued: number } | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const { data: history, loading: histLoading, refetch: refetchHistory } = useFetch<BroadcastLog[]>(
    '/api/v1/admin/broadcast',
    [],
  )

  const handlePreview = async () => {
    if (!message.trim()) return
    setSendError(null)
    try {
      const res = await api.post<{ queued: number }>('/api/v1/admin/broadcast', {
        message,
        preview_mode: true,
      })
      setPreviewCount(res.queued)
      setConfirm(true)
    } catch (e: any) {
      setSendError(e.message ?? 'Ошибка')
    }
  }

  const handleSend = async () => {
    setSending(true)
    setSendError(null)
    try {
      const res = await api.post<{ queued: number }>('/api/v1/admin/broadcast', { message })
      setResult(res)
      setConfirm(false)
      setMessage('')
      refetchHistory()
    } catch (e: any) {
      setSendError(e.message ?? 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Рассылка
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Telegram-рассылка всем продавцам с привязанным аккаунтом
          </p>
        </div>
        <button
          onClick={refetchHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> Обновить
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Composer */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Сообщение</span>
            <span style={{ fontSize: 11, color: message.length > 4000 ? '#EF4444' : 'var(--text-dim)' }}>
              {message.length} / 4096
            </span>
          </div>

          {/* Rich text toolbar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                title={btn.title}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (textareaRef.current) {
                    wrapSelection(textareaRef.current, btn.open, btn.close, (v) => {
                      setMessage(v);
                      setResult(null);
                      setSendError(null);
                    });
                  }
                }}
                style={{
                  padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)',
                  background: 'var(--surface2)', color: 'var(--text)', fontSize: 13,
                  cursor: 'pointer', lineHeight: 1.4, ...btn.style,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={e => { setMessage(e.target.value); setResult(null); setSendError(null) }}
            placeholder="Введите текст рассылки..."
            rows={8}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 14px',
              borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--surface2)', color: 'var(--text)',
              fontSize: 14, lineHeight: 1.6, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          {sendError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444', fontSize: 13 }}>
              <AlertCircle size={14} /> {sendError}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10B981', fontSize: 13 }}>
              <CheckCircle size={14} /> Отправлено в очередь: {result.queued} получателей
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={!message.trim() || sending}
            style={{
              marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0', borderRadius: 10, border: 'none',
              background: !message.trim() ? 'var(--surface2)' : 'var(--primary)',
              color: !message.trim() ? 'var(--text-dim)' : '#fff',
              fontSize: 14, fontWeight: 600, cursor: !message.trim() ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            <Eye size={15} /> Предпросмотр и отправка
          </button>
        </div>

        {/* Preview */}
        <TelegramPreview text={message} />
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Megaphone size={20} style={{ color: '#818CF8' }} />
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Подтвердите рассылку</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
              Сообщение будет отправлено{' '}
              <strong style={{ color: 'var(--text)' }}>{previewCount} получателям</strong> в Telegram.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>
              Это действие нельзя отменить.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 8, border: 'none', background: '#818CF8', color: '#fff', fontSize: 14, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
              >
                <Send size={14} /> {sending ? 'Отправка...' : 'Отправить всем'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>История рассылок</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Сообщение', 'Отправлено', 'Ошибок', 'Автор', 'Дата'].map(h => (
                  <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {histLoading ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</td></tr>
              ) : !history?.length ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Megaphone size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  Рассылок ещё не было
                </td></tr>
              ) : history.map((log, i) => (
                <tr key={log.id}
                  style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '13px 20px', maxWidth: 280 }}>
                    <span style={{ color: 'var(--text)', fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                      {log.sentCount}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    {log.failedCount > 0
                      ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{log.failedCount}</span>
                      : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace' }}>
                    {log.creator?.phone ?? '—'}
                  </td>
                  <td style={{ padding: '13px 20px', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
