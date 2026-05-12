import type { ReactNode } from 'react';
import { colors } from '@/lib/styles';

interface Props {
  /** Visible text shown to sighted users. The trigger should still own its own `aria-label`. */
  label: string;
  children: ReactNode;
  /** Side of the trigger to render the tooltip on. Default `'bottom'`. */
  side?: 'bottom' | 'top';
  /** Pixel offset between trigger and tooltip. Default 6. */
  offset?: number;
  className?: string;
}

/**
 * Lightweight CSS-only hover/focus tooltip.
 *
 * Renders inline-flex wrapper around `children` with an absolutely-positioned
 * pill that appears on `:hover` and `:focus-within`. No JS, no portal — relies
 * on `z-50` to clear most local stacking contexts; if the parent has
 * `overflow:hidden` the tooltip will get clipped (use a portal-based tooltip
 * for that case if it shows up).
 *
 * Theme-aware via tokens: pill background = `colors.textPrimary` (dark in light
 * mode, light in dark mode), text = `colors.bg` — gives a high-contrast inverted
 * look in both themes (mac-style).
 *
 * Accessibility note: the visible label is decorative for sighted users. Always
 * keep the trigger's own `aria-label` so screen readers don't depend on hover.
 */
export function Tooltip({ label, children, side = 'bottom', offset = 6, className = '' }: Props) {
  const positionClass = side === 'bottom' ? 'top-full' : 'bottom-full';
  const offsetStyle = side === 'bottom' ? { marginTop: offset } : { marginBottom: offset };
  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${positionClass} z-50 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100`}
        style={{
          background: colors.textPrimary,
          color: colors.bg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
          ...offsetStyle,
        }}
      >
        {label}
      </span>
    </span>
  );
}
