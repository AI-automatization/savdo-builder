import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { useTelegram } from '@/providers/TelegramProvider';
import { useTranslation } from '@/lib/i18n';
import { showToast } from './Toast';

const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME ?? 'savdo_builderBOT';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'warning' | 'code' | 'success';

interface RequestResponse {
  message: string;
  expiresAt: string;
}

interface ConfirmResponse {
  message: string;
  deletedAt: string;
  gracePeriodDays: number;
}

/**
 * ACCOUNT-DELETION-OTP-001: модал удаления аккаунта.
 *
 * Step 1 (warning) — большое предупреждение + 90-day recovery hint.
 * Step 2 (code)    — 6-значный OTP из Telegram + countdown до expiresAt.
 * Step 3 (success) — подтверждение soft-delete, автоматический redirect через 5с.
 *
 * Бэкенд:
 *   POST /me/account-deletion/request → { message, expiresAt }
 *   POST /me/account-deletion/confirm { code } → { message, deletedAt, gracePeriodDays }
 *
 * Spec error-codes (см. requirements):
 *   429 RATE_LIMIT, 400 TELEGRAM_NOT_LINKED, 502 TG_SEND_FAILED,
 *   404 OTP_NOT_FOUND, 400 OTP_INVALID, 429 OTP_TOO_MANY_ATTEMPTS.
 */
export function DeleteAccountModal({ open, onClose }: Props) {
  const { tg } = useTelegram();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('warning');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [needsBot, setNeedsBot] = useState(false);

  const codeInputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  // ── Reset on open/close ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      // Lazy reset так что юзер не видит "мигания" во время fade-out (если будет).
      const id = setTimeout(() => {
        setStep('warning');
        setCode('');
        setError(null);
        setSending(false);
        setVerifying(false);
        setExpiresAt(null);
        setSecondsLeft(0);
        setNeedsBot(false);
        if (redirectTimerRef.current) {
          clearTimeout(redirectTimerRef.current);
          redirectTimerRef.current = null;
        }
      }, 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // ── Escape & body lock ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'success' && !verifying) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, verifying, onClose]);

  // ── Countdown timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'code' || !expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setSecondsLeft(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, expiresAt]);

  // ── Focus 6-digit input when step becomes 'code' ───────────────────────
  useEffect(() => {
    if (step === 'code') {
      // Небольшая задержка чтобы DOM успел отрисоваться (создание input).
      const id = setTimeout(() => codeInputRef.current?.focus(), 80);
      return () => clearTimeout(id);
    }
  }, [step]);

  // ── Auto-redirect on success ────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'success') return;
    redirectTimerRef.current = window.setTimeout(() => {
      finalizeLogout();
    }, 5000);
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function finalizeLogout() {
    try {
      // Чистим persistent auth state. logout() уже снимает sessionStorage token,
      // но на всякий случай чистим localStorage тоже (legacy keys, cart sync flag).
      try { localStorage.removeItem('access_token'); } catch { /* ignore */ }
      try { localStorage.removeItem('refresh_token'); } catch { /* ignore */ }
      try { localStorage.removeItem('savdo_cart_synced'); } catch { /* ignore */ }
    } finally {
      logout();
      navigate('/', { replace: true });
    }
  }

  // ── Step 1 → request OTP ────────────────────────────────────────────────
  async function handleRequestCode() {
    if (sending) return;
    setSending(true);
    setError(null);
    setNeedsBot(false);
    try {
      const res = await api<RequestResponse>('/me/account-deletion/request', {
        method: 'POST',
        noCache: true,
      });
      tg?.HapticFeedback.notificationOccurred('warning');
      const expMs = res.expiresAt ? new Date(res.expiresAt).getTime() : Date.now() + 5 * 60_000;
      setExpiresAt(Number.isFinite(expMs) ? expMs : Date.now() + 5 * 60_000);
      setStep('code');
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      if (err instanceof ApiError) {
        const msg = (err.message ?? '').toUpperCase();
        if (err.status === 429) {
          setError(t('settings.deleteAccount.errRateLimit'));
        } else if (err.status === 400 && msg.includes('TELEGRAM_NOT_LINKED')) {
          setError(t('settings.deleteAccount.errTgNotLinked'));
          setNeedsBot(true);
        } else if (err.status === 502) {
          setError(t('settings.deleteAccount.errTgSendFailed'));
        } else {
          setError(err.message || t('common.somethingWentWrong'));
        }
      } else {
        setError(t('error.network'));
      }
    } finally {
      setSending(false);
    }
  }

  // ── Step 2 → confirm with OTP ───────────────────────────────────────────
  async function handleConfirm() {
    if (verifying) return;
    if (code.length !== 6) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await api<ConfirmResponse>('/me/account-deletion/confirm', {
        method: 'POST',
        body: { code },
        noCache: true,
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast(
        t('settings.deleteAccount.successToast').replace(
          '{days}',
          String(res.gracePeriodDays ?? 90),
        ),
        'success',
        4000,
      );
      setStep('success');
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      if (err instanceof ApiError) {
        const msg = (err.message ?? '').toUpperCase();
        if (err.status === 404 || msg.includes('OTP_NOT_FOUND')) {
          setError(t('settings.deleteAccount.errOtpExpired'));
          setExpiresAt(Date.now()); // визуально показать "истёк"
        } else if (err.status === 429 || msg.includes('TOO_MANY_ATTEMPTS')) {
          setError(t('settings.deleteAccount.errOtpTooMany'));
        } else if (err.status === 400 && msg.includes('OTP_INVALID')) {
          setError(t('settings.deleteAccount.errOtpInvalid'));
          setCode('');
          // Фокус обратно на input для повторного ввода.
          setTimeout(() => codeInputRef.current?.focus(), 50);
        } else {
          setError(err.message || t('common.somethingWentWrong'));
        }
      } else {
        setError(t('error.network'));
      }
    } finally {
      setVerifying(false);
    }
  }

  function handleCodeChange(v: string) {
    // Только цифры, максимум 6.
    const clean = v.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
    if (error) setError(null);
    if (clean.length === 6) {
      // Auto-submit на полном вводе. UX как у iOS one-time-code.
      // setTimeout чтобы React успел применить setCode перед confirm.
      setTimeout(() => {
        // Re-check state guard: пользователь не отменил, не уже verifying.
        if (!verifying) handleConfirm();
      }, 50);
    }
  }

  function handleOpenBot() {
    tg?.HapticFeedback.impactOccurred('light');
    tg?.openTelegramLink?.(`https://t.me/${BOT_USERNAME}?start=link`);
  }

  function handleRequestNew() {
    setStep('warning');
    setCode('');
    setError(null);
    setExpiresAt(null);
  }

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const mmss = (() => {
    if (!secondsLeft) return '0:00';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  // ── Styles ──────────────────────────────────────────────────────────────
  const dangerBg = 'rgba(239,68,68,0.9)';
  const dangerSoftBg = 'rgba(239,68,68,0.12)';
  const dangerSoftBorder = 'rgba(239,68,68,0.35)';
  const dangerColor = '#F87171';

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={() => {
        if (step !== 'success' && !verifying) onClose();
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: 'var(--tg-surface)',
          color: 'var(--tg-text-primary)',
          border: '1px solid var(--tg-border-soft)',
          boxShadow: 'var(--tg-card-shadow)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        {/* ───── Step 1: Warning ───── */}
        {step === 'warning' && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 22 }}>⚠️</span>
              <h3
                id="delete-account-title"
                className="text-base font-bold"
                style={{ color: dangerColor }}
              >
                {t('settings.deleteAccount.title')}
              </h3>
            </div>

            <p className="text-sm mb-3 leading-relaxed" style={{ color: 'var(--tg-text-secondary)' }}>
              {t('settings.deleteAccount.warn')}
            </p>

            <div
              className="rounded-xl p-3 mb-4 text-xs leading-relaxed"
              style={{
                background: dangerSoftBg,
                border: `1px solid ${dangerSoftBorder}`,
                color: dangerColor,
              }}
            >
              {t('settings.deleteAccount.warn90d')}
            </div>

            {error && (
              <p
                className="text-xs mb-3 leading-relaxed"
                style={{ color: dangerColor }}
                role="alert"
              >
                {error}
              </p>
            )}

            {needsBot && (
              <button
                type="button"
                onClick={handleOpenBot}
                className="w-full mb-3 py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'var(--tg-surface-hover)',
                  border: '1px solid var(--tg-border-soft)',
                  color: 'var(--tg-text-primary)',
                  minHeight: 44,
                }}
              >
                {t('settings.deleteAccount.openBot')}
              </button>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'var(--tg-surface-hover)',
                  border: '1px solid var(--tg-border-soft)',
                  color: 'var(--tg-text-primary)',
                  minHeight: 44,
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRequestCode}
                disabled={sending}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{
                  background: dangerBg,
                  color: '#fff',
                  minHeight: 44,
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? t('settings.deleteAccount.sending') : t('settings.deleteAccount.sendCode')}
              </button>
            </div>
          </>
        )}

        {/* ───── Step 2: Code entry ───── */}
        {step === 'code' && (
          <>
            <h3
              id="delete-account-title"
              className="text-base font-bold mb-2"
              style={{ color: 'var(--tg-text-primary)' }}
            >
              {t('settings.deleteAccount.enterCodeTitle')}
            </h3>

            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: 'var(--tg-text-secondary)' }}
            >
              {t('settings.deleteAccount.enterCodeHint').replace('{bot}', BOT_USERNAME)}
            </p>

            <input
              ref={codeInputRef}
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              autoComplete="one-time-code"
              aria-label={t('settings.deleteAccount.codeAria')}
              className="w-full mb-2 px-4 py-3 rounded-xl text-center font-bold"
              style={{
                background: 'var(--tg-surface-hover)',
                border: `1px solid ${error ? dangerSoftBorder : 'var(--tg-border-soft)'}`,
                color: 'var(--tg-text-primary)',
                fontSize: 22,
                letterSpacing: '0.5em',
                minHeight: 56,
              }}
              placeholder="••••••"
              disabled={verifying}
            />

            {error ? (
              <p className="text-xs mb-3" style={{ color: dangerColor }} role="alert">
                {error}
              </p>
            ) : (
              <p className="text-xs mb-3" style={{ color: 'var(--tg-text-dim)' }}>
                {secondsLeft > 0
                  ? t('settings.deleteAccount.expiresIn').replace('{time}', mmss)
                  : t('settings.deleteAccount.expired')}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={code.length !== 6 || verifying || secondsLeft === 0}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: dangerBg,
                  color: '#fff',
                  minHeight: 44,
                  opacity: code.length !== 6 || verifying || secondsLeft === 0 ? 0.5 : 1,
                }}
              >
                {verifying
                  ? t('settings.deleteAccount.deleting')
                  : t('settings.deleteAccount.confirmCta')}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRequestNew}
                  disabled={verifying}
                  className="flex-1 py-2 rounded-xl text-xs font-medium"
                  style={{
                    background: 'var(--tg-surface-hover)',
                    border: '1px solid var(--tg-border-soft)',
                    color: 'var(--tg-text-secondary)',
                    minHeight: 40,
                    opacity: verifying ? 0.6 : 1,
                  }}
                >
                  {t('settings.deleteAccount.requestNew')}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={verifying}
                  className="flex-1 py-2 rounded-xl text-xs font-medium"
                  style={{
                    background: 'var(--tg-surface-hover)',
                    border: '1px solid var(--tg-border-soft)',
                    color: 'var(--tg-text-secondary)',
                    minHeight: 40,
                    opacity: verifying ? 0.6 : 1,
                  }}
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ───── Step 3: Success ───── */}
        {step === 'success' && (
          <>
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                style={{ background: dangerSoftBg, border: `1px solid ${dangerSoftBorder}` }}
              >
                <span style={{ fontSize: 28 }}>👋</span>
              </div>
              <h3
                id="delete-account-title"
                className="text-base font-bold mb-2"
                style={{ color: 'var(--tg-text-primary)' }}
              >
                {t('settings.deleteAccount.successTitle')}
              </h3>
              <p
                className="text-sm mb-4 leading-relaxed"
                style={{ color: 'var(--tg-text-secondary)' }}
              >
                {t('settings.deleteAccount.successBody').replace('{bot}', BOT_USERNAME)}
              </p>

              <button
                type="button"
                onClick={finalizeLogout}
                className="w-full py-2.5 rounded-xl text-sm font-semibold"
                style={{
                  background: 'var(--tg-accent)',
                  color: '#0A0A0A',
                  minHeight: 44,
                }}
              >
                {t('settings.deleteAccount.successCta')}
              </button>

              <p className="text-xxs mt-3" style={{ color: 'var(--tg-text-dim)' }}>
                {t('settings.deleteAccount.successAutoRedirect')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
