import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DialogShell } from './DialogShell'

/**
 * ADMIN-NATIVE-CONFIRM-001: imperative confirm-dialog по аналогии с TMA.
 * Возвращает Promise<boolean> — true если юзер подтвердил, false если отменил.
 * Замена `window.confirm()` который ломает design system + не локализуется.
 *
 * Использование:
 *   const ok = await confirmDialog({ title: 'Удалить?', body: '...', danger: true });
 *   if (!ok) return;
 *
 * Требует <ConfirmContainer/> смонтирован в App.tsx.
 */

interface ConfirmOptions {
  title: string
  body?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface OpenPayload extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

const EVENT_NAME = 'admin:confirm'

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent<OpenPayload>(EVENT_NAME, { detail: { ...opts, resolve } }))
  })
}

export function ConfirmContainer() {
  const [payload, setPayload] = useState<OpenPayload | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      setPayload((e as CustomEvent<OpenPayload>).detail)
    }
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  if (!payload) return null

  const close = (ok: boolean) => {
    payload.resolve(ok)
    setPayload(null)
  }

  return createPortal(
    <DialogShell onClose={() => close(false)} width={420}>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
        {payload.title}
      </h3>
      {payload.body && (
        <p style={{ margin: '8px 0 22px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {payload.body}
        </p>
      )}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={() => close(false)}
          style={{
            height: 38, padding: '0 18px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--surface2)',
            color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer',
          }}
        >
          {payload.cancelText ?? 'Отмена'}
        </button>
        <button
          onClick={() => close(true)}
          style={{
            height: 38, padding: '0 18px', borderRadius: 8, border: 'none',
            background: payload.danger ? '#EF4444' : 'var(--primary)',
            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          {payload.confirmText ?? 'Подтвердить'}
        </button>
      </div>
    </DialogShell>,
    document.body,
  )
}
