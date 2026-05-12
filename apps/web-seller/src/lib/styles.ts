/**
 * Savdo seller — shared visual tokens.
 *
 * Values resolve to CSS variables defined in `apps/web-seller/src/app/globals.css`,
 * themed via `[data-theme="dark|light"]` on <html>. Every consumer of `colors.X`
 * automatically reflects the active theme.
 *
 * Dark values (the original CRM palette) live in `[data-theme="dark"]`.
 * Light values live in `:root` of the same file.
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
  accentMuted:     'var(--color-accent-muted)',
  accentBorder:    'var(--color-accent-border)',
  /** Text colour to use on accent-coloured backgrounds — always white for contrast */
  accentTextOnBg:  'var(--color-accent-text-on-bg)',
  // Brand wordmark — single shared violet with buyer for "Savdo" logo
  brand:           'var(--color-brand)',
  // Semantic
  success:         'var(--color-success)',
  warning:         'var(--color-warning)',
  danger:          'var(--color-danger)',
  /** Info / in-flight status / Telegram-action (blue) */
  info:            'var(--color-info)',
} as const;

// ── Surface presets — drop-in style objects ──────────────────────────────────

/** Primary card — top-level content containers */
export const card = {
  background: colors.surface,
  border:     `1px solid ${colors.border}`,
} as const;

/** Muted/nested card — list rows, secondary sections */
export const cardMuted = {
  background: colors.surfaceMuted,
  border:     `1px solid ${colors.border}`,
} as const;

/** App shell surface — sidebar, top bar */
export const shell = {
  background: colors.surface,
  borderRight: `1px solid ${colors.divider}`,
} as const;

export const shellTop = {
  background: colors.surface,
  borderBottom: `1px solid ${colors.divider}`,
} as const;

/** Input base — text, number, email, select, textarea */
export const inputStyle = {
  background: colors.surfaceSunken,
  border:     `1px solid ${colors.border}`,
  color:      colors.textPrimary,
  outline:    'none',
} as const;

/** Pill / chip — for filter chips, tags */
export const pill = {
  background: colors.surfaceMuted,
  border:     `1px solid ${colors.border}`,
  color:      colors.textMuted,
} as const;

export const pillActive = {
  background: colors.accentMuted,
  border:     `1px solid ${colors.accentBorder}`,
  color:      colors.accent,
} as const;
