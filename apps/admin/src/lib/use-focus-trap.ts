import { useEffect, useRef } from 'react'

/**
 * Focus trap для модалок: запирает Tab внутри контейнера, ставит фокус на
 * первый focusable при mount, возвращает фокус на trigger при unmount,
 * закрывает модалку по Escape.
 *
 * Использование:
 *   const ref = useFocusTrap<HTMLDivElement>(onClose)
 *   return <div ref={ref} role="dialog" aria-modal="true">...</div>
 */
export function useFocusTrap<T extends HTMLElement>(onEscape?: () => void) {
  const containerRef = useRef<T | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Сохраняем элемент, на котором был фокус до открытия модалки
    const triggerElement = document.activeElement as HTMLElement | null

    const getFocusable = (): HTMLElement[] => {
      const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      return Array.from(container.querySelectorAll<HTMLElement>(sel))
        .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1)
    }

    // Фокус на первый input/button/etc внутри модалки
    const focusFirst = () => {
      const focusables = getFocusable()
      if (focusables.length > 0) focusables[0].focus()
      else container.focus()
    }
    focusFirst()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }
      if (e.key !== 'Tab') return

      const focusables = getFocusable()
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Возвращаем фокус на исходный trigger при закрытии модалки
      triggerElement?.focus?.()
    }
  }, [onEscape])

  return containerRef
}
