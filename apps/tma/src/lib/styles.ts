// ── Design tokens — maxsavdo Dark Luxury (design-v2) ──────────────────────
// Source of truth: docs/design/maxsavdo-design-v2.md
// Старая палитра Cyber Orchid × Arctic Cyan — deprecated с 04.06.2026
// (TMA-DESIGN-V2-MIGRATE-001). Имена констант сохранены, чтобы legacy-импорты
// продолжили работать; внутри — Champagne Gold + Rich Black.
export const COLORS = {
  orchid:    '#C9A876',   // Champagne Gold (alias для legacy `orchid` имени)
  orchidDim: 'rgba(201,168,118,0.18)',
  orchidGlow:'rgba(201,168,118,0.35)',
  cyan:      '#C9A876',   // alias на gold — cyan убран из design-v2
  cyanDim:   'rgba(201,168,118,0.15)',
  bg:        '#0A0A0A',   // Rich Black
  gold:      '#C9A876',
  goldLight: '#E8C898',
} as const;

// Plain surface card (design-v2 не использует frosted glass — flat surface).
// Старое имя `glass` сохранено для совместимости с компонентами, которые
// импортят { glass } и spread'ят в style.
//
// ВАЖНО (04.06.2026, hotfix light theme):
// Раньше тут было `background: '#141414'` хардкодом → ломало light-theme
// (Sidebar/StoreCard оставались тёмными на белом фоне body). Теперь через
// CSS-переменные — в dark theme это #141414 (--tg-surface), в light — #FAFAFA.
export const glass = {
  background:          'var(--tg-surface)',
  backdropFilter:      'none',
  WebkitBackdropFilter:'none',
  border:              '1px solid var(--tg-border-soft)',
  borderRadius:        18,
  boxShadow:           'var(--tg-card-shadow, 0 8px 32px rgba(0,0,0,0.40))',
} as const;

// Rich Black gradient (subtle, чтобы поверхность не казалась плоско-серой).
// Используется в dark mode; в light mode body берёт сплошной #FFFFFF из CSS vars.
export const gradientBg = 'linear-gradient(160deg, #0A0A0A 0%, #101010 50%, #0A0A0A 100%)';
