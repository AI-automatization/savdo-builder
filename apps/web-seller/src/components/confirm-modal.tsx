'use client';

import { useEffect } from 'react';
import { card, colors } from '@/lib/styles';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger=true → красная подтверждающая кнопка (для destructive actions) */
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && !loading) onConfirm();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, loading, onClose, onConfirm]);

  if (!open) return null;

  const confirmStyle: React.CSSProperties = danger
    ? {
        background: `color-mix(in srgb, ${colors.danger} 22%, transparent)`,
        color: colors.danger,
        border: `1px solid color-mix(in srgb, ${colors.danger} 35%, transparent)`,
      }
    : {
        background: colors.accent,
        color: colors.accentTextOnBg,
        border: `1px solid ${colors.accentBorder}`,
      };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl p-6 flex flex-col gap-3"
        style={{ ...card, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 id="confirm-modal-title" className="text-lg font-bold" style={{ color: colors.textPrimary }}>
          {title}
        </h2>
        {message && (
          <p className="text-sm" style={{ color: colors.textMuted }}>{message}</p>
        )}
        <div className="flex gap-2.5 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
            style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={confirmStyle}
            autoFocus
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
