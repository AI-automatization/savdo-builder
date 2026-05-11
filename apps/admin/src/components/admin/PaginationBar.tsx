import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { CSSProperties } from 'react'

/**
 * Стандартная пагинация для admin-таблиц.
 *
 * Замечания по UX/a11y:
 *  - disabled-кнопки получают opacity 0.4 + cursor:not-allowed (раньше во многих
 *    местах disabled был незаметен и пользователь продолжал тыкать)
 *  - aria-label на кнопках навигации (icon-only `<` `>` без текста)
 *  - text-tabular для счётчика «N из M»
 */
export function PaginationBar({
  page,
  totalPages,
  total,
  onPageChange,
  itemsLabel = 'записей',
  compact = false,
}: {
  page: number
  totalPages: number
  /** Total items — рендерится в счётчик «N записей» если задан. */
  total?: number
  onPageChange: (next: number) => void
  itemsLabel?: string
  compact?: boolean
}) {
  if (totalPages <= 1) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  const btn = (disabled: boolean): CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 4,
    padding: compact ? '6px 12px' : '7px 14px',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--surface2)',
    color: disabled ? 'var(--text-dim)' : 'var(--text)',
    fontSize: 13,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    transition: 'opacity 120ms, color 120ms',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        Стр. {page} из {totalPages}{typeof total === 'number' ? ` · ${total} ${itemsLabel}` : ''}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => !prevDisabled && onPageChange(Math.max(1, page - 1))}
          disabled={prevDisabled}
          aria-label="Предыдущая страница"
          style={btn(prevDisabled)}
        >
          <ChevronLeft size={14} /> Назад
        </button>
        <button
          onClick={() => !nextDisabled && onPageChange(Math.min(totalPages, page + 1))}
          disabled={nextDisabled}
          aria-label="Следующая страница"
          style={btn(nextDisabled)}
        >
          Вперёд <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
