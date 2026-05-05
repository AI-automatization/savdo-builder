/**
 * Savdo buyer — shared visual tokens.
 *
 * Values resolve to CSS variables defined in `apps/web-buyer/src/app/globals.css`,
 * which are themed by `[data-theme="dark|light"]` on <html>. This means every
 * component that reads `colors.X` / `card` / `pill` etc. automatically reflects
 * the active theme — no per-component refactor needed.
 *
 * Light values (originally hex literals here) live in `:root` of globals.css.
 * Dark values live in `[data-theme="dark"]` of the same file.
 *
 * If you add a new semantic token: add it BOTH here (as `var(--color-foo)`)
 * AND in globals.css for both `:root` and `[data-theme="dark"]`.
 */

// ── Raw colour tokens (resolve via CSS vars) ─────────────────────────────────

export const colors = {
  // Surface palette
  bg:              'var(--color-bg)',
  surface:         'var(--color-surface)',
  surfaceMuted:    'var(--color-surface-muted)',
  surfaceElevated: 'var(--color-surface-elevated)',
  surfaceSunken:   'var(--color-surface-sunken)',
  divider:         'var(--color-divider)',
  border:          'var(--color-border)',
  borderStrong:    'var(--color-border-strong)',
  // Type
  textPrimary:     'var(--color-text-primary)',
  textMuted:       'var(--color-text-muted)',
  textDim:         'var(--color-text-dim)',
  // Accent
  accent:          'var(--color-accent)',
  accentHover:     'var(--color-accent-hover)',
  accentMuted:     'var(--color-accent-muted)',
  accentBorder:    'var(--color-accent-border)',
  accentTextOnBg:  'var(--color-accent-text-on-bg)',
  // Brand wordmark — unified between buyer & seller for "Savdo" logo / hero
  brand:           'var(--color-brand)',
  // Semantic
  success:         'var(--color-success)',
  warning:         'var(--color-warning)',
  danger:          'var(--color-danger)',
  // Telegram blue (kept for "Написать в TG" CTA)
  telegram:        'var(--color-telegram)',
} as const;

// ── Surface presets — drop-in style objects ──────────────────────────────────

/** Primary card — top-level content containers */
export const card = {
  background: colors.surface,
  border:     `1px solid ${colors.border}`,
} as const;

/** Muted card — list rows, secondary sections, sunken panels */
export const cardMuted = {
  background: colors.surfaceMuted,
  border:     `1px solid ${colors.border}`,
} as const;

/** App shell surface — header, sidebar */
export const shell = {
  background: colors.surface,
  borderBottom: `1px solid ${colors.divider}`,
} as const;

/** Input base — text, number, email, select, textarea */
export const inputStyle = {
  background: colors.surface,
  border:     `1px solid ${colors.border}`,
  color:      colors.textPrimary,
  outline:    'none',
} as const;

/** Pill / chip — for category chips, filter chips */
export const pill = {
  background: colors.surface,
  border:     `1px solid ${colors.border}`,
  color:      colors.textMuted,
} as const;

export const pillActive = {
  background: colors.accentMuted,
  border:     `1px solid ${colors.accentBorder}`,
  color:      colors.accent,
} as const;

/** Primary CTA — "Купить", "Отправить", "В корзину" */
export const ctaPrimary = {
  background: colors.accent,
  color:      colors.accentTextOnBg,
  border:     'none',
} as const;

/** Soft action — secondary buttons */
export const ctaSoft = {
  background: colors.accentMuted,
  color:      colors.accent,
  border:     `1px solid ${colors.accentBorder}`,
} as const;

// ── Legacy glass tokens (kept until all pages migrate) ───────────────────────

/** @deprecated — migrate to `card` */
export const glass = {
  background:           colors.surface,
  backdropFilter:       'none',
  WebkitBackdropFilter: 'none',
  border:               `1px solid ${colors.border}`,
} as const;

/** @deprecated — migrate to `cardMuted` */
export const glassDim = {
  background:           colors.surfaceMuted,
  backdropFilter:       'none',
  WebkitBackdropFilter: 'none',
  border:               `1px solid ${colors.border}`,
} as const;

/** @deprecated — migrate to `cardMuted` */
export const glassDark = {
  background:           colors.surfaceMuted,
  backdropFilter:       'none',
  WebkitBackdropFilter: 'none',
  border:               `1px solid ${colors.border}`,
} as const;
