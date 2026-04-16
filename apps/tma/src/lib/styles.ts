// ── Design tokens — Cyber Orchid × Arctic Cyan ─────────────────────────────
export const COLORS = {
  orchid:    '#A855F7',   // primary CTA, accents
  orchidDim: 'rgba(168,85,247,0.18)',
  orchidGlow:'rgba(168,85,247,0.35)',
  cyan:      '#22D3EE',   // status indicators
  cyanDim:   'rgba(34,211,238,0.15)',
  bg:        '#0B0E14',   // deep charcoal
} as const;

// Frosted glass — 25px blur, frost-white border glow, micro-reflection top edge
export const glass = {
  background:          'rgba(255,255,255,0.055)',
  backdropFilter:      'blur(25px)',
  WebkitBackdropFilter:'blur(25px)',
  border:              '1px solid rgba(255,255,255,0.11)',
  borderRadius:        18,
  boxShadow:           '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)',
} as const;

// Deep charcoal with subtle navy undertones
export const gradientBg = 'linear-gradient(160deg, #0B0E14 0%, #0D1120 45%, #0B0F1C 100%)';
