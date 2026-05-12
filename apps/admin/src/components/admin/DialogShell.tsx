import type { CSSProperties, ReactNode } from 'react'
import { useFocusTrap } from '../../lib/use-focus-trap'

/**
 * Стандартная модальная оболочка с a11y:
 *   - role="dialog" + aria-modal="true"
 *   - focus-trap (Tab/Shift+Tab остаются внутри)
 *   - Escape закрывает (если onClose передан и closeOnEscape !== false)
 *   - Возврат фокуса на trigger при закрытии
 *   - Backdrop click закрывает (можно отключить closeOnBackdrop=false)
 *
 * Не управляет открытием — рендери условно от родителя.
 */
export function DialogShell({
  children,
  onClose,
  width = 440,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdrop = true,
  closeOnEscape = true,
  zIndex = 200,
  contentStyle,
}: {
  children: ReactNode
  onClose: () => void
  width?: number | string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  zIndex?: number
  contentStyle?: CSSProperties
}) {
  const dialogRef = useFocusTrap<HTMLDivElement>(closeOnEscape ? onClose : undefined)

  return (
    <div
      onClick={closeOnBackdrop ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 28,
          width,
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          outline: 'none',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  )
}
