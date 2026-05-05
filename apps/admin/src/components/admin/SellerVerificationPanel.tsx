import { useState } from 'react'
import { ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../lib/api'

const STATUSES = [
  { value: 'PENDING_REVIEW', label: 'На проверке',  color: '#F59E0B' },
  { value: 'APPROVED',        label: 'Одобрен',       color: '#22C55E' },
  { value: 'REJECTED',        label: 'Отклонён',      color: '#EF4444' },
] as const

const REQUIREMENTS = [
  'Документы загружены',
  'Telegram привязан',
  'Контакты валидны',
  'Категория соответствует фактическому ассортименту',
] as const

type Status = typeof STATUSES[number]['value']

interface Props {
  sellerId: string
  initialStatus?: string | null
  onChanged?: () => void
}

export function SellerVerificationPanel({ sellerId, initialStatus, onChanged }: Props) {
  const [status, setStatus] = useState<Status>(
    (STATUSES.find(s => s.value === initialStatus)?.value as Status) ?? 'PENDING_REVIEW',
  )
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const checkedRequirements = REQUIREMENTS.filter(r => checked[r])
  const allChecked = checkedRequirements.length === REQUIREMENTS.length
  const canApprove = status !== 'APPROVED' || allChecked
  const canSubmit = canApprove && (status === 'APPROVED' || reason.trim().length >= 3) && !loading

  const submit = async () => {
    setLoading(true)
    try {
      await api.patch(`/api/v1/admin/sellers/${sellerId}/verify`, {
        status,
        reason: reason.trim() || null,
        notes: notes.trim() || null,
        checkedRequirements,
      })
      toast.success('Решение по верификации сохранено')
      onChanged?.()
    } catch (e: any) {
      toast.error(e.message ?? 'Не удалось сохранить')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <ShieldCheck size={14} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Верификация продавца</h3>
      </div>

      {/* Status select */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Решение</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUSES.map(s => {
            const active = status === s.value
            return (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                style={{
                  flex: 1, height: 36, borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: active ? `1px solid ${s.color}` : '1px solid var(--border)',
                  background: active ? `${s.color}1a` : 'var(--surface2)',
                  color: active ? s.color : 'var(--text-muted)',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Requirements */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Проверенные требования</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {REQUIREMENTS.map(req => {
            const isChecked = !!checked[req]
            return (
              <label
                key={req}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--surface2)',
                  border: `1px solid ${isChecked ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={e => setChecked(prev => ({ ...prev, [req]: e.target.checked }))}
                  style={{ accentColor: '#22C55E' }}
                />
                <span style={{ fontSize: 12, color: isChecked ? 'var(--text)' : 'var(--text-muted)' }}>{req}</span>
              </label>
            )
          })}
        </div>
        {status === 'APPROVED' && !allChecked && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#F59E0B' }}>
            <AlertCircle size={12} /> Для одобрения нужно отметить все требования
          </div>
        )}
      </div>

      {/* Reason */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>
          Причина {status !== 'APPROVED' && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={status === 'REJECTED' ? 'Почему отклонено (видно продавцу)...' : 'Краткое обоснование решения...'}
          rows={2}
          style={textareaStyle}
        />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Внутренние заметки</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Только для администраторов..."
          rows={2}
          style={textareaStyle}
        />
      </div>

      <button
        onClick={submit}
        disabled={!canSubmit}
        style={{
          width: '100%', height: 40, borderRadius: 10, border: 'none',
          background: canSubmit ? 'var(--primary)' : 'var(--surface2)',
          color: canSubmit ? 'white' : 'var(--text-muted)',
          fontSize: 13, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? 'Сохранение...' : 'Сохранить решение'}
      </button>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
}
const textareaStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--surface2)',
  color: 'var(--text)', fontSize: 13, resize: 'vertical', outline: 'none',
  fontFamily: 'inherit',
}
