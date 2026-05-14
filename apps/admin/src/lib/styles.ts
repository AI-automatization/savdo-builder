import type { CSSProperties } from 'react';

// DESIGN-SEMANTIC-COLORS-001 (admin): mirror Azim'овских web-* helpers,
// чтобы admin тоже мог использовать `dangerTint(0.10)` вместо хардкода
// `rgba(220,38,38,0.10)`. Theme-aware через CSS-vars из index.css.
//
// Принцип:
//   dangerTint(0.08) → 'var(--surface-error)' (или другой нужный уровень)
//   warningTint(0.10) → 'var(--surface-warning)'
//   successTint(0.08) → 'var(--surface-success)'
//
// Для произвольных opacity используем `color-mix(in srgb, var(--error) X%, transparent)`
// который supported в Chrome 111+, Safari 16.4+, Firefox 113+ (admin — desktop
// browser, требования жёсткие). Fallback на статичные `--surface-error` vars
// если color-mix не поддержан — браузер просто игнорирует невалидное правило.

const tint = (color: '--error' | '--warning' | '--success', opacity: number): string =>
  `color-mix(in srgb, var(${color}) ${Math.round(opacity * 100)}%, transparent)`;

export const dangerTint  = (opacity: number) => tint('--error',   opacity);
export const warningTint = (opacity: number) => tint('--warning', opacity);
export const successTint = (opacity: number) => tint('--success', opacity);

// Готовые стили для частых случаев — error banner, success badge и т.д.
// Заменяют hardcoded inline-style объекты.

export const errorBanner = (): CSSProperties => ({
  background: 'var(--surface-error)',
  border: '1px solid var(--border-error-soft)',
  color: 'var(--error)',
});

export const successBanner = (): CSSProperties => ({
  background: 'var(--surface-success)',
  border: '1px solid var(--border-success-soft)',
  color: 'var(--success)',
});

export const warningBanner = (): CSSProperties => ({
  background: 'var(--surface-warning)',
  border: '1px solid var(--border-warning)',
  color: 'var(--warning)',
});
