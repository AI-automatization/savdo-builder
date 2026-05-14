import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTelegram } from '@/providers/TelegramProvider';
import { SIDEBAR_WIDTH } from '@/components/layout/Sidebar';

interface ConfirmOptions {
  title: string;
  body?: string;
  confirmText?: string;
  cancelText?: string;
  /** danger=true красит кнопку подтверждения красным (для удалений) */
  danger?: boolean;
}

interface OpenPayload extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

const EVENT_NAME = 'tma:confirm';

/**
 * TMA-NATIVE-CONFIRM-001: imperative confirm dialog по аналогии с `showToast`.
 * Возвращает Promise<boolean> — true если юзер подтвердил, false если отменил
 * (или закрыл по бэкдропу). Замена window.confirm — последний на desktop Telegram
 * не работает (no popup) и ломает UX.
 */
export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    window.dispatchEvent(
      new CustomEvent<OpenPayload>(EVENT_NAME, { detail: { ...opts, resolve } }),
    );
  });
}

export function ConfirmContainer() {
  const [payload, setPayload] = useState<OpenPayload | null>(null);
  const { viewportWidth } = useTelegram();
  const desktopOffset = (viewportWidth ?? 0) >= 768 ? { left: SIDEBAR_WIDTH } : {};

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<OpenPayload>).detail;
      setPayload(detail);
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
      if (e.key === 'Enter') close(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload]);

  const close = (ok: boolean) => {
    if (!payload) return;
    payload.resolve(ok);
    setPayload(null);
  };

  if (!payload) return null;
  if (typeof document === 'undefined') return null;

  const { title, body, confirmText = 'Подтвердить', cancelText = 'Отмена', danger } = payload;

  // Polat 07.05: portal в document.body — иначе backdrop-filter в GlassCard
  // ловит fixed-position и обрезает modal до карточки.
  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', ...desktopOffset }}
      onClick={() => close(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5"
        style={{
          background: 'var(--tg-card-bg, #1f2937)',
          color: 'var(--tg-text, #fff)',
          border: '1px solid var(--tg-border-soft)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h3 id="confirm-title" className="text-base font-semibold mb-2">{title}</h3>
        {body && (
          <p className="text-sm opacity-80 mb-4 whitespace-pre-line">{body}</p>
        )}
        <div className="flex gap-2 justify-end mt-2">
          <button
            type="button"
            onClick={() => close(false)}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: 'var(--tg-surface-hover)',
              border: '1px solid var(--tg-border-soft)',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            autoFocus
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={
              danger
                ? { background: 'rgba(239,68,68,0.9)', color: '#fff' }
                : { background: 'var(--tg-accent, #2AABEE)', color: '#fff' }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
