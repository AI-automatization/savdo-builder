/**
 * Savdo buyer — shared visual tokens
 *
 * Single source of truth for glassmorphism surfaces across web-buyer.
 * Import these instead of redeclaring `const glass = {...}` per page.
 *
 * Buyer app intentionally leans into the glass-heavy "storefront" feel —
 * seller/admin use their own, denser surface set. See
 * docs/design/liquid-authority.md for the broader plan (buyer stays glass,
 * seller moves to solid surfaces).
 */

// Primary surface — cards, inputs-with-container, CTA backdrops
export const glass = {
  background:           'rgba(255,255,255,0.08)',
  backdropFilter:       'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border:               '1px solid rgba(255,255,255,0.15)',
} as const;

// Secondary surface — list rows, subtle panels, variant chips
export const glassDim = {
  background:           'rgba(255,255,255,0.04)',
  backdropFilter:       'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border:               '1px solid rgba(255,255,255,0.09)',
} as const;

// Heavier surface — checkout summary, totals card
export const glassDark = {
  background:           'rgba(255,255,255,0.05)',
  backdropFilter:       'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border:               '1px solid rgba(255,255,255,0.10)',
} as const;

// Input base — text/number/email fields
export const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border:     '1px solid rgba(255,255,255,0.13)',
  color:      '#fff',
  outline:    'none',
} as const;
