/**
 * Savdo buyer — shared visual tokens (Light revamp, Phase 1)
 *
 * Buyer storefront moved from glass to light solid surfaces:
 * - White/cream background, dark text → matches familiar e-commerce pattern
 *   (WB / Ozon / Uzum) and trust signal for small UZ sellers.
 * - Solid surfaces with subtle borders, no blur.
 * - Brand violet (#7C3AED) reserved for prices and CTAs — visible against light.
 *
 * Seller stays dark (CRM mood). Same tokens shape, different values.
 * Legacy `glass` exports kept temporarily for pages not yet migrated; they will
 * read poorly on the new light background — that's the visual cue to migrate.
 */

// ── Raw colour tokens ────────────────────────────────────────────────────────

export const colors = {
  // Surface palette (cream-tinted off-white)
  bg:              '#FAFAF7',                  // body / app shell
  surface:         '#FFFFFF',                  // primary card surface
  surfaceMuted:    '#F4F4EF',                  // sunken / nested panels, list rows
  surfaceElevated: '#FFFFFF',                  // hover/active (uses border lift)
  surfaceSunken:   '#EFEFEA',                  // inputs, dim wells
  divider:         'rgba(15,17,21,0.06)',
  border:          'rgba(15,17,21,0.10)',
  borderStrong:    'rgba(15,17,21,0.18)',
  // Type
  textPrimary:     '#0F1115',                  // near-black slate
  textMuted:       '#5C6470',                  // slate-500
  textDim:         '#8A93A0',                  // slate-400
  // Accent (violet — bridges to seller)
  accent:          '#7C3AED',                  // violet-600 — solid actions
  accentHover:     '#6D28D9',                  // violet-700
  accentMuted:     'rgba(124,58,237,0.10)',
  accentBorder:    'rgba(124,58,237,0.32)',
  accentTextOnBg:  '#FFFFFF',                  // white text on violet button
  // Brand wordmark — single shared violet between buyer & seller for "Savdo" logo / hero
  brand:           '#7C3AED',                  // identical token in seller styles.ts
  // Semantic (light-readable)
  success:         '#16A34A',                  // green-600
  warning:         '#D97706',                  // amber-600
  danger:          '#DC2626',                  // red-600
  // Telegram blue (kept for "Написать в TG" CTA)
  telegram:        '#2AABEE',
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
// These render poorly on the new light bg — visible cue to refactor the page.

/** @deprecated — migrate to `card` */
export const glass = {
  background:           'rgba(255,255,255,0.85)',
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
