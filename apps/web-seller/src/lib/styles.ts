/**
 * Savdo seller — shared visual tokens (Strategy C, Phase 2)
 *
 * Seller dashboard intentionally moves away from buyer's glass-heavy storefront
 * aesthetic to a denser, scannable surface set: solid backgrounds, solid borders,
 * no blur. Optimised for fast data scanning vs. emotional purchase flow.
 *
 * Buyer remains glass — see apps/web-buyer/src/lib/styles.ts.
 * See docs/design/liquid-authority.md for the broader plan.
 */

// ── Raw colour tokens ────────────────────────────────────────────────────────

export const colors = {
  // Slate-900 base palette
  bg:              '#0F172A',  // body / app shell — slate-950
  surface:         '#1E293B',  // primary card surface — slate-800
  surfaceMuted:    '#172033',  // sunken / nested panels
  surfaceElevated: '#293548',  // hover / focus / active row
  surfaceSunken:   '#0B1120',  // input wells, dim wells
  divider:         'rgba(148,163,184,0.16)',  // slate-400 @ 16%
  border:          'rgba(148,163,184,0.20)',  // slate-400 @ 20%
  borderStrong:    'rgba(148,163,184,0.32)',  // hover / focused
  // Type
  textPrimary:     '#F1F5F9',  // slate-100
  textMuted:       '#94A3B8',  // slate-400
  textDim:         '#64748B',  // slate-500
  // Accent (used sparingly — primary actions / brand)
  accent:          '#A78BFA',  // violet-400 — keep as the one bridge to buyer
  accentMuted:     'rgba(167,139,250,0.14)',
  accentBorder:    'rgba(167,139,250,0.40)',
  // Brand wordmark — single shared violet with buyer for "Savdo" logo. Identical
  // hex in both apps so the brand identity is unified across light & dark themes.
  brand:           '#7C3AED',  // identical token in buyer styles.ts
  // Semantic
  success:         '#34D399',  // emerald-400
  warning:         '#FBBF24',  // amber-400
  danger:          '#F87171',  // red-400
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
