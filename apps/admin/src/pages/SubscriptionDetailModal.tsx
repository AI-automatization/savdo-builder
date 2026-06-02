import { useState } from 'react'
import { toast } from 'sonner'
import { X, CreditCard, Calendar, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type {
  AdminSubscriptionListItem,
  SubscriptionPaymentMethod,
  SubscriptionStatus,
  SubscriptionTier,
} from 'types'
import { api } from '../lib/api'
import { useFetch } from '../lib/hooks'
import { useTranslation } from '../lib/i18n'
import { DialogShell } from '../components/admin/DialogShell'
import { confirmDialog } from '../components/admin/ConfirmDialog'

// BILLING-MACHINE-001 — admin subscription detail с действиями.
// DTO из workspace-пакета `types` (DUP-008).

type SubscriptionDetail = AdminSubscriptionListItem

const STATUS_CFG: Record<SubscriptionStatus, { bg: string; text: string; labelKey: string }> = {
  ACTIVE:    { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', labelKey: 'subscriptions.statusActive' },
  TRIAL:     { bg: 'rgba(59,130,246,0.12)',  text: '#60A5FA', labelKey: 'subscriptions.statusTrial' },
  PAST_DUE:  { bg: 'rgba(245,158,11,0.14)',  text: '#F59E0B', labelKey: 'subscriptions.statusPastDue' },
  SUSPENDED: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', labelKey: 'subscriptions.statusSuspended' },
  CHURNED:   { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.statusChurned' },
  CANCELLED: { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.statusCancelled' },
}

const TIER_CFG: Record<SubscriptionTier, { bg: string; text: string; labelKey: string }> = {
  STARTER:  { bg: 'rgba(148,163,184,0.14)', text: '#94A3B8', labelKey: 'subscriptions.tierStarter' },
  PRO:      { bg: 'rgba(201,168,118,0.14)', text: '#C9A876', labelKey: 'subscriptions.tierPro' },
  BUSINESS: { bg: 'rgba(201,168,118,0.22)', text: '#E0C896', labelKey: 'subscriptions.tierBusiness' },
}

const TIER_OPTIONS: SubscriptionTier[] = ['STARTER', 'PRO', 'BUSINESS']
const METHOD_OPTIONS: SubscriptionPaymentMethod[] = ['MANUAL_TRANSFER', 'CLICK', 'PAYME', 'COMP']

type ActiveForm = 'none' | 'mark-paid' | 'extend-trial'

interface Props {
  subscriptionId: string
  onClose: () => void
  onChanged: () => void
}

export default function SubscriptionDetailModal({ subscriptionId, onClose, onChanged }: Props) {
  const { t, locale } = useTranslation()
  const { data: sub, loading, refetch } = useFetch<SubscriptionDetail>(
    `/api/v1/admin/subscriptions/${subscriptionId}`,
    [subscriptionId],
  )

  const [active, setActive] = useState<ActiveForm>('none')
  const [busy, setBusy] = useState(false)

  // Mark Paid form
  const today = new Date().toISOString().slice(0, 10)
  const inMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  const [paidTier, setPaidTier] = useState<SubscriptionTier>('PRO')
  const [paidAmount, setPaidAmount] = useState<string>('')
  const [paidStart, setPaidStart] = useState<string>(today)
  const [paidEnd, setPaidEnd] = useState<string>(inMonth)
  const [paidMethod, setPaidMethod] = useState<SubscriptionPaymentMethod>('MANUAL_TRANSFER')
  const [paidNotes, setPaidNotes] = useState<string>('')

  // Extend trial form
  const [extDays, setExtDays] = useState<string>('7')
  const [extReason, setExtReason] = useState<string>('')

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(locale === 'uz' ? 'uz-UZ' : 'ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  }

  async function handleMarkPaid(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return

    const amount = Number(paidAmount.replace(/\s/g, ''))
    if (!amount || amount <= 0) {
      toast.error(t('subscriptions.errAmountRequired'))
      return
    }
    if (!paidStart || !paidEnd) {
      toast.error(t('subscriptions.errDatesRequired'))
      return
    }
    if (new Date(paidEnd) <= new Date(paidStart)) {
      toast.error(t('subscriptions.errEndAfterStart'))
      return
    }

    setBusy(true)
    try {
      await api.post(`/api/v1/admin/subscriptions/${subscriptionId}/mark-paid`, {
        tier: paidTier,
        amountUzs: amount,
        periodStart: new Date(paidStart).toISOString(),
        periodEnd: new Date(paidEnd).toISOString(),
        method: paidMethod,
        notes: paidNotes || undefined,
      })
      toast.success(t('subscriptions.toastMarkedPaid'))
      setActive('none')
      setPaidAmount(''); setPaidNotes('')
      refetch()
      onChanged()
    } catch (e: any) {
      toast.error(e?.message ?? t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleExtendTrial(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return

    const days = Number(extDays)
    if (!days || days <= 0 || days > 365) {
      toast.error(t('subscriptions.errDaysRange'))
      return
    }

    setBusy(true)
    try {
      await api.post(`/api/v1/admin/subscriptions/${subscriptionId}/extend-trial`, {
        days,
        reason: extReason || undefined,
      })
      toast.success(t('subscriptions.toastTrialExtended', { days: String(days) }))
      setActive('none')
      setExtReason('')
      refetch()
      onChanged()
    } catch (e: any) {
      toast.error(e?.message ?? t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  async function handleCancel() {
    if (!sub) return
    const ok = await confirmDialog({
      title: t('subscriptions.confirmCancelTitle'),
      body: t('subscriptions.confirmCancelBody', { name: sub.seller.fullName || sub.seller.telegramUsername || sub.id }),
      confirmText: t('subscriptions.cancelAction'),
      cancelText: t('common.cancel'),
      danger: true,
    })
    if (!ok) return

    setBusy(true)
    try {
      await api.post(`/api/v1/admin/subscriptions/${subscriptionId}/cancel`, {})
      toast.success(t('subscriptions.toastCancelled'))
      refetch()
      onChanged()
    } catch (e: any) {
      toast.error(e?.message ?? t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const isTerminal = sub && (sub.status === 'CANCELLED' || sub.status === 'CHURNED')
  const canExtendTrial = sub?.status === 'TRIAL'

  return (
    <DialogShell onClose={onClose} width={620}>
      {loading || !sub ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          {t('common.loading')}
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <CreditCard size={18} color="#C9A876" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                  {sub.seller.fullName || sub.seller.telegramUsername || sub.id}
                </h2>
              </div>
              {sub.seller.telegramUsername && (
                <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                  @{sub.seller.telegramUsername}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: TIER_CFG[sub.tier].bg, color: TIER_CFG[sub.tier].text,
                }}>
                  {t(TIER_CFG[sub.tier].labelKey)}
                </span>
                <span style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: STATUS_CFG[sub.status].bg, color: STATUS_CFG[sub.status].text,
                }}>
                  {t(STATUS_CFG[sub.status].labelKey)}
                </span>
                {sub.cancelAtPeriodEnd && (
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    background: 'rgba(245,158,11,0.14)', color: '#F59E0B',
                  }}>
                    {t('subscriptions.cancelAtPeriodEnd')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label={t('common.close')}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface2)', color: 'var(--text-muted)',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Info grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24,
            padding: 14, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <InfoCell icon={<Calendar size={12} />} label={t('subscriptions.fieldPeriodStart')} value={fmtDate(sub.currentPeriodStart)} />
            <InfoCell icon={<Calendar size={12} />} label={t('subscriptions.fieldPeriodEnd')} value={fmtDate(sub.currentPeriodEnd)} />
            <InfoCell icon={<Clock size={12} />} label={t('subscriptions.fieldTrialEndsAt')} value={fmtDate(sub.trialEndsAt)} />
            <InfoCell icon={<Clock size={12} />} label={t('subscriptions.fieldGraceEndsAt')} value={fmtDate(sub.graceEndsAt)} />
            <InfoCell icon={<Clock size={12} />} label={t('subscriptions.fieldDaysLeft')} value={sub.daysLeft === null ? '—' : `${sub.daysLeft}`} />
            <InfoCell icon={<Calendar size={12} />} label={t('subscriptions.fieldUpdatedAt')} value={fmtDate(sub.updatedAt)} />
          </div>

          {/* Action chooser */}
          {active === 'none' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!isTerminal && (
                <button
                  onClick={() => setActive('mark-paid')}
                  disabled={busy}
                  style={primaryActionBtn(busy)}
                >
                  <CheckCircle2 size={14} />
                  {t('subscriptions.actionMarkPaid')}
                </button>
              )}
              {canExtendTrial && (
                <button
                  onClick={() => setActive('extend-trial')}
                  disabled={busy}
                  style={secondaryActionBtn(busy)}
                >
                  <Clock size={14} />
                  {t('subscriptions.actionExtendTrial')}
                </button>
              )}
              {!isTerminal && (
                <button
                  onClick={handleCancel}
                  disabled={busy}
                  style={dangerActionBtn(busy)}
                >
                  <AlertTriangle size={14} />
                  {busy ? t('common.loading') : t('subscriptions.actionCancel')}
                </button>
              )}
              {isTerminal && (
                <div style={{
                  padding: 14, borderRadius: 10, fontSize: 12, color: 'var(--text-muted)',
                  background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center',
                }}>
                  {t('subscriptions.terminalNote')}
                </div>
              )}
            </div>
          )}

          {/* Mark Paid form */}
          {active === 'mark-paid' && (
            <form onSubmit={handleMarkPaid} style={formStyle}>
              <h3 style={formTitleStyle}>{t('subscriptions.actionMarkPaid')}</h3>

              <FieldRow>
                <Label>{t('subscriptions.fieldTier')}</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {TIER_OPTIONS.map(tr => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => setPaidTier(tr)}
                      style={tinyPill(paidTier === tr)}
                    >
                      {t(TIER_CFG[tr].labelKey)}
                    </button>
                  ))}
                </div>
              </FieldRow>

              <FieldRow>
                <Label>{t('subscriptions.fieldAmountUzs')}</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value.replace(/[^\d\s]/g, ''))}
                  placeholder="500000"
                  style={inputStyle}
                  required
                />
              </FieldRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <FieldRow>
                  <Label>{t('subscriptions.fieldPeriodStart')}</Label>
                  <input type="date" value={paidStart} onChange={e => setPaidStart(e.target.value)} style={inputStyle} required />
                </FieldRow>
                <FieldRow>
                  <Label>{t('subscriptions.fieldPeriodEnd')}</Label>
                  <input type="date" value={paidEnd} onChange={e => setPaidEnd(e.target.value)} style={inputStyle} required />
                </FieldRow>
              </div>

              <FieldRow>
                <Label>{t('subscriptions.fieldMethod')}</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {METHOD_OPTIONS.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaidMethod(m)}
                      style={tinyPill(paidMethod === m)}
                    >
                      {t(`subscriptions.method.${m}`)}
                    </button>
                  ))}
                </div>
              </FieldRow>

              <FieldRow>
                <Label>{t('subscriptions.fieldNotes')}</Label>
                <textarea
                  value={paidNotes}
                  onChange={e => setPaidNotes(e.target.value)}
                  rows={2}
                  placeholder={t('subscriptions.notesPlaceholder')}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </FieldRow>

              <FormActions
                onCancel={() => setActive('none')}
                busy={busy}
                submitLabel={t('subscriptions.actionMarkPaid')}
                cancelLabel={t('common.cancel')}
              />
            </form>
          )}

          {/* Extend Trial form */}
          {active === 'extend-trial' && (
            <form onSubmit={handleExtendTrial} style={formStyle}>
              <h3 style={formTitleStyle}>{t('subscriptions.actionExtendTrial')}</h3>

              <FieldRow>
                <Label>{t('subscriptions.fieldDays')}</Label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={extDays}
                  onChange={e => setExtDays(e.target.value)}
                  style={inputStyle}
                  required
                />
              </FieldRow>

              <FieldRow>
                <Label>{t('subscriptions.fieldReason')}</Label>
                <textarea
                  value={extReason}
                  onChange={e => setExtReason(e.target.value)}
                  rows={3}
                  placeholder={t('subscriptions.reasonPlaceholder')}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </FieldRow>

              <FormActions
                onCancel={() => setActive('none')}
                busy={busy}
                submitLabel={t('subscriptions.actionExtendTrial')}
                cancelLabel={t('common.cancel')}
              />
            </form>
          )}
        </>
      )}
    </DialogShell>
  )
}

// ── Local presentational helpers ──────────────────────────────────────────────

function InfoCell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {icon}
        {label}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>{children}</div>
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </label>
  )
}

function FormActions({ onCancel, busy, submitLabel, cancelLabel }: { onCancel: () => void; busy: boolean; submitLabel: string; cancelLabel: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
      <button
        type="button"
        onClick={onCancel}
        disabled={busy}
        style={{
          height: 36, padding: '0 16px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--surface2)',
          color: 'var(--text-muted)', fontSize: 13, cursor: busy ? 'wait' : 'pointer',
        }}
      >
        {cancelLabel}
      </button>
      <button
        type="submit"
        disabled={busy}
        style={{
          height: 36, padding: '0 18px', borderRadius: 8, border: 'none',
          background: '#C9A876', color: '#1a1a1a',
          fontSize: 13, fontWeight: 700, cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        {submitLabel}
      </button>
    </div>
  )
}

const formStyle: React.CSSProperties = {
  padding: 16,
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
}

const formTitleStyle: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--text)',
}

const inputStyle: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 13,
  outline: 'none',
}

function tinyPill(active: boolean): React.CSSProperties {
  return {
    height: 30, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
    border: active ? '1px solid #C9A876' : '1px solid var(--border)',
    background: active ? 'rgba(201,168,118,0.14)' : 'var(--surface)',
    color: active ? '#C9A876' : 'var(--text-muted)',
  }
}

function primaryActionBtn(disabled: boolean): React.CSSProperties {
  return {
    height: 40, borderRadius: 10, border: 'none',
    background: '#C9A876', color: '#1a1a1a',
    fontSize: 13, fontWeight: 700, cursor: disabled ? 'wait' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: disabled ? 0.6 : 1,
  }
}

function secondaryActionBtn(disabled: boolean): React.CSSProperties {
  return {
    height: 40, borderRadius: 10,
    border: '1px solid var(--border)', background: 'var(--surface2)',
    color: 'var(--text)',
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'wait' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: disabled ? 0.6 : 1,
  }
}

function dangerActionBtn(disabled: boolean): React.CSSProperties {
  return {
    height: 40, borderRadius: 10,
    border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
    color: '#EF4444',
    fontSize: 13, fontWeight: 600, cursor: disabled ? 'wait' : 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: disabled ? 0.6 : 1,
  }
}
