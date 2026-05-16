import { useRef, useState, type ReactNode } from 'react'
import { Send, Eye, AlertCircle, CheckCircle, RefreshCw, Megaphone } from 'lucide-react'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { api } from '../lib/api'
import { DialogShell } from '../components/admin/DialogShell'

interface BroadcastLog {
  id: string
  message: string
  sentCount: number
  failedCount: number
  createdAt: string
  creator: { phone: string }
}

function formatDate(iso: string, dateLocale: string) {
  return new Date(iso).toLocaleString(dateLocale, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// TOKEN_RE splits text into: plain segments and recognised Telegram markup tokens.
// React renders plain segments as escaped text — no XSS possible.
const TOKEN_RE = /(<b>[\s\S]*?<\/b>|<i>[\s\S]*?<\/i>|<a href="[^"]*">[\s\S]*?<\/a>)/g;

function parseTelegram(text: string): ReactNode[] {
  const parts = text.split(TOKEN_RE);
  const nodes: ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    const boldM = part.match(/^<b>([\s\S]*?)<\/b>$/);
    const italicM = part.match(/^<i>([\s\S]*?)<\/i>$/);
    const linkM = part.match(/^<a href="([^"]*)">([\s\S]*?)<\/a>$/);

    if (boldM) {
      nodes.push(<strong key={i}>{boldM[1]}</strong>);
    } else if (italicM) {
      nodes.push(<em key={i}>{italicM[1]}</em>);
    } else if (linkM) {
      const rawHref = linkM[1];
      const href = /^https?:\/\//i.test(rawHref) || /^tg:\/\//i.test(rawHref) ? rawHref : '#';
      nodes.push(<a key={i} href={href} style={{ color: '#5BC8F5' }}>{linkM[2]}</a>);
    } else {
      // React escapes this automatically — safe plain text
      nodes.push(part);
    }
  }

  return nodes;
}

function TelegramPreview({ text, t }: { text: string; t: (k: string, v?: Record<string, string | number>) => string }) {
  return (
    <div style={{ background: '#1a2133', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#818CF8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {t('broadcast.preview')}
      </div>
      <div style={{
        display: 'inline-block', maxWidth: 320,
        background: '#2b3a5c', borderRadius: '4px 14px 14px 14px',
        padding: '10px 14px', fontSize: 14, lineHeight: 1.5, color: '#E2E8F0',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {text ? parseTelegram(text) : <span style={{ opacity: 0.4 }}>{t('broadcast.previewEmpty')}</span>}
      </div>
    </div>
  )
}

const TOOLBAR_BUTTONS = [
  { label: 'B', titleKey: 'broadcast.tbBold', open: '<b>', close: '</b>', style: { fontWeight: 800 } },
  { label: 'I', titleKey: 'broadcast.tbItalic', open: '<i>', close: '</i>', style: { fontStyle: 'italic' } },
  { label: '🔗', titleKey: 'broadcast.tbLink', open: '<a href="">', close: '</a>', style: {} },
  { label: '🎉', titleKey: 'broadcast.tbParty', open: '🎉', close: '', style: {} },
  { label: '🔥', titleKey: 'broadcast.tbFire', open: '🔥', close: '', style: {} },
  { label: '✅', titleKey: 'broadcast.tbCheck', open: '✅', close: '', style: {} },
  { label: '⚠️', titleKey: 'broadcast.tbWarning', open: '⚠️', close: '', style: {} },
  { label: '📢', titleKey: 'broadcast.tbMegaphone', open: '📢', close: '', style: {} },
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

type Audience = 'all' | 'sellers' | 'buyers'

const AUDIENCE_OPTIONS: { value: Audience; labelKey: string; descKey: string }[] = [
  { value: 'all',     labelKey: 'common.all',           descKey: 'broadcast.audAllDesc' },
  { value: 'sellers', labelKey: 'nav.sellers',          descKey: 'broadcast.audSellersDesc' },
  { value: 'buyers',  labelKey: 'broadcast.audBuyers',  descKey: 'broadcast.audBuyersDesc' },
]

export default function BroadcastPage() {
  const { t, locale } = useTranslation()
  const dateLocale = locale === 'uz' ? 'uz-UZ' : 'ru-RU'
  const [message, setMessage] = useState('')
  const [audience, setAudience] = useState<Audience>('all')
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
        audience,
        preview_mode: true,
      })
      setPreviewCount(res.queued)
      setConfirm(true)
    } catch (e: any) {
      setSendError(e.message ?? t('common.error'))
    }
  }

  const handleSend = async () => {
    setSending(true)
    setSendError(null)
    try {
      const res = await api.post<{ queued: number }>('/api/v1/admin/broadcast', { message, audience })
      setResult(res)
      setConfirm(false)
      setMessage('')
      refetchHistory()
    } catch (e: any) {
      setSendError(e.message ?? t('broadcast.errSend'))
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
            {t('broadcast.title')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            {t('broadcast.subtitle')}
          </p>
        </div>
        <button
          onClick={refetchHistory}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
        >
          <RefreshCw size={14} /> {t('common.refresh')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Composer */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t('broadcast.message')}</span>
            <span style={{ fontSize: 11, color: message.length > 4000 ? '#EF4444' : 'var(--text-dim)' }}>
              {message.length} / 4096
            </span>
          </div>

          {/* Rich text toolbar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {TOOLBAR_BUTTONS.map((btn) => (
              <button
                key={btn.label}
                title={t(btn.titleKey)}
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
            placeholder={t('broadcast.textPlaceholder')}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--surface-error)', border: '1px solid var(--border-error-soft)', color: 'var(--error)', fontSize: 13 }}>
              <AlertCircle size={14} /> {sendError}
            </div>
          )}

          {result && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--surface-success)', border: '1px solid var(--border-success-soft)', color: 'var(--success)', fontSize: 13 }}>
              <CheckCircle size={14} /> {t('broadcast.queued', { n: result.queued })}
            </div>
          )}

          {/* Audience selector */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('broadcast.recipients')}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAudience(opt.value)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    border: `1px solid ${audience === opt.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: audience === opt.value ? 'rgba(129,140,248,0.12)' : 'var(--surface2)',
                    color: audience === opt.value ? '#818CF8' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                  title={t(opt.descKey)}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handlePreview}
            disabled={!message.trim() || sending}
            style={{
              marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '11px 0', borderRadius: 10, border: 'none',
              background: !message.trim() ? 'var(--surface2)' : 'var(--primary)',
              color: !message.trim() ? 'var(--text-dim)' : '#fff',
              fontSize: 14, fontWeight: 600, cursor: !message.trim() ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
          >
            <Eye size={15} /> {t('broadcast.previewAndSend')}
          </button>
        </div>

        {/* Preview */}
        <TelegramPreview text={message} t={t} />
      </div>

      {/* Confirm modal — ADMIN-MODAL-A11Y-001: DialogShell */}
      {confirm && (
        <DialogShell
          onClose={() => !sending && setConfirm(false)}
          width={420}
          ariaLabelledBy="broadcast-confirm-title"
          closeOnBackdrop={!sending}
          closeOnEscape={!sending}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Megaphone size={20} style={{ color: '#818CF8' }} />
            <span id="broadcast-confirm-title" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{t('broadcast.confirmTitle')}</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
            {t('broadcast.confirmTextBefore')}{' '}
            <strong style={{ color: 'var(--text)' }}>{t('broadcast.confirmRecipients', { n: previewCount ?? 0 })}</strong> {t('broadcast.confirmTextAfter')}
            {' '}(
            <span style={{ color: '#818CF8' }}>
              {(() => { const o = AUDIENCE_OPTIONS.find(o => o.value === audience); return o ? t(o.labelKey) : audience })()}
            </span>
            ).
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 24 }}>
            {t('broadcast.confirmIrreversible')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setConfirm(false)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer' }}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 8, border: 'none', background: '#818CF8', color: '#fff', fontSize: 14, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}
            >
              <Send size={14} /> {sending ? t('broadcast.sending') : t('broadcast.sendAll')}
            </button>
          </div>
        </DialogShell>
      )}

      {/* History */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>{t('broadcast.history')}</div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {[t('broadcast.colMessage'), t('broadcast.colSent'), t('broadcast.colFailed'), t('broadcast.colAuthor'), t('broadcast.colDate')].map(h => (
                  <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {histLoading ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>{t('common.loading')}</td></tr>
              ) : !history?.length ? (
                <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Megaphone size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                  {t('broadcast.historyEmpty')}
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
                    {formatDate(log.createdAt, dateLocale)}
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
