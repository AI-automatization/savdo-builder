import { useState } from 'react'
import { CheckCircle, XCircle, Clock, User, Store, AlertTriangle, X } from 'lucide-react'

const QUEUE = [
  { id: 1, type: 'SELLER' as const, name: 'Nodira Yusupova', phone: '+998909876543', detail: 'Новый продавец — хочет открыть Fashion Hub', time: '2ч назад', urgent: false },
  { id: 2, type: 'STORE' as const, name: 'Fashion Hub', phone: 'Nodira Yusupova', detail: 'Магазин подан на публикацию, 95 товаров', time: '3ч назад', urgent: false },
  { id: 3, type: 'SELLER' as const, name: 'Suspicious User', phone: '+998900000000', detail: 'Подозрительная активность — 20 попыток за 5 мин', time: '10ч назад', urgent: true },
  { id: 4, type: 'STORE' as const, name: 'Beauty Lab', phone: 'Dilnoza Ergasheva', detail: 'Магазин подан на публикацию, 0 товаров', time: '1д назад', urgent: false },
]

export default function ModerationPage() {
  const [tab, setTab] = useState<'ALL' | 'SELLER' | 'STORE'>('ALL')
  const [rejectTarget, setRejectTarget] = useState<{ id: number; name: string } | null>(null)
  const [comment, setComment] = useState('')
  const [approved, setApproved] = useState<number[]>([])
  const [rejected, setRejected] = useState<number[]>([])

  const visible = QUEUE.filter(i => {
    if (approved.includes(i.id) || rejected.includes(i.id)) return false
    if (tab === 'ALL') return true
    return i.type === tab
  })

  const doApprove = (id: number) => setApproved(a => [...a, id])
  const doReject = () => {
    if (!rejectTarget || !comment.trim()) return
    setRejected(r => [...r, rejectTarget.id])
    setRejectTarget(null)
    setComment('')
  }

  const counts = {
    ALL: QUEUE.filter(i => !approved.includes(i.id) && !rejected.includes(i.id)).length,
    SELLER: QUEUE.filter(i => i.type === 'SELLER' && !approved.includes(i.id) && !rejected.includes(i.id)).length,
    STORE:  QUEUE.filter(i => i.type === 'STORE'  && !approved.includes(i.id) && !rejected.includes(i.id)).length,
  }

  return (
    <div style={{ padding: '32px 32px 48px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>Модерация</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
          Очередь на проверку · {counts.ALL} ожидает
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['ALL', 'SELLER', 'STORE'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            border: `1px solid ${tab === t ? 'var(--primary)' : 'var(--border)'}`,
            background: tab === t ? 'var(--primary-dim)' : 'var(--surface)',
            color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            {t === 'SELLER' && <User size={13} />}
            {t === 'STORE' && <Store size={13} />}
            {t === 'ALL' ? 'Все' : t === 'SELLER' ? 'Продавцы' : 'Магазины'}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
              background: tab === t ? 'rgba(129,140,248,0.2)' : 'var(--surface2)',
              color: tab === t ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.length === 0 && (
          <div style={{ padding: '60px', textAlign: 'center', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Очередь пуста — всё проверено
          </div>
        )}
        {visible.map(item => (
          <div key={item.id} style={{
            background: 'var(--surface)',
            border: `1px solid ${item.urgent ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            {/* Icon */}
            <div style={{
              width: 46, height: 46, borderRadius: 12, flexShrink: 0,
              background: item.type === 'SELLER' ? 'rgba(129,140,248,0.12)' : 'rgba(16,185,129,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.type === 'SELLER'
                ? <User size={20} color="var(--primary)" />
                : <Store size={20} color="#10B981" />
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>{item.name}</span>
                {item.urgent && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#EF4444',
                    background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 20,
                    border: '1px solid rgba(239,68,68,0.2)',
                  }}>
                    <AlertTriangle size={10} /> СРОЧНО
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {item.phone} · {item.detail}
              </div>
            </div>

            {/* Time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginRight: 4, whiteSpace: 'nowrap' }}>
              <Clock size={12} /> {item.time}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => doApprove(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                color: '#10B981', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
              >
                <CheckCircle size={15} /> Одобрить
              </button>
              <button onClick={() => setRejectTarget({ id: item.id, name: item.name })} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#EF4444', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              >
                <XCircle size={15} /> Отклонить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setRejectTarget(null)}>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 20, padding: 28, width: 440, maxWidth: '90vw',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                Отклонить заявку
              </h3>
              <button onClick={() => setRejectTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ margin: '0 0 6px', color: 'var(--text-muted)', fontSize: 14 }}>
              Заявка: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{rejectTarget.name}</span>
            </p>
            <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 13 }}>
              Укажи причину — она будет отправлена продавцу. Обязательное поле.
            </p>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Например: профиль не заполнен, нарушение правил платформы..."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: 14, resize: 'vertical', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5, transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--error)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 4, marginBottom: 18 }}>
              {comment.length} символов
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRejectTarget(null); setComment('') }} style={{
                padding: '10px 20px', borderRadius: 10, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
              }}>
                Отмена
              </button>
              <button
                onClick={doReject}
                disabled={!comment.trim()}
                style={{
                  padding: '10px 24px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 600,
                  cursor: comment.trim() ? 'pointer' : 'not-allowed',
                  background: comment.trim() ? '#EF4444' : 'var(--surface2)',
                  color: comment.trim() ? 'white' : 'var(--text-muted)',
                  transition: 'background 0.2s',
                }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
