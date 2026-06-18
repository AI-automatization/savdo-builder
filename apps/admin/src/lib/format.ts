/**
 * Format helpers for admin UI.
 * Per DRY-audit 2026-06-01 (DUP-007): 4 copies of `formatDate` lived in
 * BroadcastPage / AuditLogsPage / ChatsPage / ReportsPage with slight variants
 * (year numeric vs 2-digit vs absent, null-handling). Unified here.
 */

export type AdminDateYearStyle = 'numeric' | '2-digit' | 'none'

export interface FormatAdminDateOptions {
  /** Включать ли год и в каком формате. Default: 'numeric'. */
  year?: AdminDateYearStyle
  /** Что вернуть если iso=null/undefined. Default: '—'. */
  fallback?: string
}

/**
 * Форматирует ISO-дату для admin UI с учётом locale (ru-RU / uz-UZ).
 * Всегда показывает day/month/hour/minute. Год — опционально.
 */
export function formatAdminDate(
  iso: string | null | undefined,
  dateLocale: string,
  opts: FormatAdminDateOptions = {},
): string {
  if (!iso) return opts.fallback ?? '—'
  const yearStyle = opts.year ?? 'numeric'
  const formatOpts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }
  if (yearStyle !== 'none') {
    formatOpts.year = yearStyle
  }
  return new Date(iso).toLocaleString(dateLocale, formatOpts)
}
