import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

/**
 * UIUX-ADMIN-TMA-001: skeleton-заглушки вместо текстовой строки «Загрузка…» —
 * layout не прыгает, воспринимаемая скорость выше (design-v2: fast scanning).
 */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md', className)}
      style={{ background: 'var(--surface2)', ...style }}
    />
  )
}

/** Строки-скелетоны для <tbody> таблиц админки. Ширины чередуются, чтобы не было «решётки». */
export function TableSkeletonRows({ rows = 8, cols }: { rows?: number; cols: number }) {
  const widths = ['70%', '45%', '55%', '35%', '60%', '40%', '50%']
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} aria-hidden="true" style={{ borderBottom: '1px solid var(--border)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-3" style={{ width: widths[(r + c) % widths.length] }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
