/** @type {import('tailwindcss').Config} */
//
// TMA-TYPOGRAPHY-SCALE-001: типографический масштаб теперь определён в theme.
// Используем CSS-vars (`--t-*`) чтобы значения можно было переопределять
// per-context (desktop scale, role-specific) через CSS.
// Кастомный `text-xxs` нужен потому что в TMA много мелкого UI (11px),
// который раньше писался как `text-[11px]` (~280 хардкодов).
//
// Migrate map (заменять в коде по мере касания файлов):
//   text-[10px]  → text-xxs           (10-11px)
//   text-[11px]  → text-xxs
//   text-[12px]  → text-xs            (12px)
//   text-[13px]  → text-sm            (13px)
//   text-[14px]  → text-base          (14px) — default
//   text-[15-16] → text-lg
//   text-[18+]   → text-xl
//
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: '#A78BFA',
        'accent-dim': 'rgba(167,139,250,0.20)',
      },
      fontSize: {
        // Все размеры — через CSS-vars (см. index.css).
        // Desktop может переопределять масштаб (например 1.05× на ≥1024).
        xxs:   ['var(--t-xxs, 11px)',  { lineHeight: 'var(--t-xxs-lh, 1.4)' }],
        xs:    ['var(--t-xs,  12px)',  { lineHeight: 'var(--t-xs-lh,  1.45)' }],
        sm:    ['var(--t-sm,  13px)',  { lineHeight: 'var(--t-sm-lh,  1.5)' }],
        base:  ['var(--t-base, 14px)', { lineHeight: 'var(--t-base-lh, 1.5)' }],
        lg:    ['var(--t-lg,  16px)',  { lineHeight: 'var(--t-lg-lh,  1.45)' }],
        xl:    ['var(--t-xl,  18px)',  { lineHeight: 'var(--t-xl-lh,  1.35)' }],
        '2xl': ['var(--t-2xl, 22px)',  { lineHeight: 'var(--t-2xl-lh, 1.3)' }],
      },
    },
  },
  plugins: [],
};
