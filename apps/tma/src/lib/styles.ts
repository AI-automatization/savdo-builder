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
export const glass = {
  background:          '#141414',
  backdropFilter:      'none',
  WebkitBackdropFilter:'none',
  border:              '1px solid rgba(255,255,255,0.12)',
  borderRadius:        18,
  boxShadow:           '0 8px 32px rgba(0,0,0,0.40)',
} as const;

// Rich Black gradient (subtle, чтобы поверхность не казалась плоско-серой)
export const gradientBg = 'linear-gradient(160deg, #0A0A0A 0%, #101010 50%, #0A0A0A 100%)';
