/**
 * Savdo Design Tokens — DaisyUI v5 theme
 * Maps to tailwind.config.ts daisyui.themes
 *
 * Usage:
 *   import { colors } from '@savdo/ui/tokens/colors';
 *   // or just use Tailwind class names: bg-primary, text-base-content, etc.
 */

export const colors = {
  // ── Brand palette ───────────────────────────────────────────────────────────
  primary: '#6366f1',        // indigo-500  — CTA buttons, links
  'primary-content': '#ffffff',

  secondary: '#f59e0b',      // amber-400   — badges, highlights
  'secondary-content': '#1c1917',

  accent: '#10b981',         // emerald-500 — success states, online dot
  'accent-content': '#ffffff',

  // ── Neutral ─────────────────────────────────────────────────────────────────
  neutral: '#1e293b',        // slate-800
  'neutral-content': '#f1f5f9',

  // ── Base surfaces ────────────────────────────────────────────────────────────
  'base-100': '#ffffff',     // page background
  'base-200': '#f8fafc',     // card / sidebar background
  'base-300': '#e2e8f0',     // borders, dividers
  'base-content': '#0f172a', // default text

  // ── Semantic ─────────────────────────────────────────────────────────────────
  info: '#3b82f6',           // blue-500
  'info-content': '#ffffff',

  success: '#22c55e',        // green-500
  'success-content': '#ffffff',

  warning: '#f59e0b',        // amber-400
  'warning-content': '#1c1917',

  error: '#ef4444',          // red-500
  'error-content': '#ffffff',
} as const;

export type ColorToken = keyof typeof colors;
