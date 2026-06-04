// Цветовые палитры для светлой и тёмной темы.
// Используются через CSS-переменные, см. apps/tma/src/index.css.
//
// maxsavdo design-v2 (Dark Luxury): Rich Black + Champagne Gold + Pure White.
// TMA-DESIGN-V2-MIGRATE-001, 04.06.2026.

export type ThemeMode = 'dark' | 'light';

interface ThemeColors {
  bg: string;
  bgGradient: string;
  surface: string;
  surfaceHover: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDim: string;
  border: string;
  borderSoft: string;
  accent: string;
  accentDim: string;
  accentGlow: string;
  accentText: string;
  cyan: string;
  cyanDim: string;
  success: string;
  successDim: string;
  warning: string;
  warningDim: string;
  danger: string;
  dangerDim: string;
}

export const DARK_THEME: ThemeColors = {
  // Фоновые слои — Rich Black
  bg:           '#0A0A0A',
  bgGradient:   'linear-gradient(160deg, #0A0A0A 0%, #101010 50%, #0A0A0A 100%)',
  surface:      '#141414',
  surfaceHover: '#1F1F1F',

  // Текст
  textPrimary:   '#FFFFFF',
  textSecondary: '#E5E5E5',
  textMuted:     '#A3A3A3',
  textDim:       '#737373',

  // Бордеры
  border:       'rgba(255,255,255,0.12)',
  borderSoft:   'rgba(255,255,255,0.08)',

  // Акценты — Champagne Gold (единственный chromatic accent в design-v2)
  accent:        '#C9A876',
  accentDim:     'rgba(201,168,118,0.18)',
  accentGlow:    'rgba(201,168,118,0.35)',
  accentText:    '#E8C898',

  // Cyan убран из палитры — alias на accent чтобы старый код не сломался
  cyan:          '#C9A876',
  cyanDim:       'rgba(201,168,118,0.15)',

  // Статусы — мягкие, чтобы не конкурировали с золотом
  success:    '#34D399',
  successDim: 'rgba(52,211,153,0.15)',
  warning:    '#FBBF24',
  warningDim: 'rgba(251,191,36,0.15)',
  danger:     '#F87171',
  dangerDim:  'rgba(248,113,113,0.15)',
};

export const LIGHT_THEME: ThemeColors = {
  bg:           '#FFFFFF',
  bgGradient:   'linear-gradient(160deg, #FFFFFF 0%, #FAFAFA 50%, #F5F5F5 100%)',
  surface:      '#FAFAFA',
  surfaceHover: '#F5F5F5',

  textPrimary:   '#0A0A0A',
  textSecondary: '#262626',
  textMuted:     '#737373',
  textDim:       '#A3A3A3',

  border:       '#E5E5E5',
  borderSoft:   '#F0F0F0',

  accent:        '#C9A876',
  accentDim:     'rgba(201,168,118,0.12)',
  accentGlow:    'rgba(201,168,118,0.25)',
  accentText:    '#B89868',

  cyan:          '#C9A876',
  cyanDim:       'rgba(201,168,118,0.10)',

  success:    '#10B981',
  successDim: 'rgba(16,185,129,0.10)',
  warning:    '#F59E0B',
  warningDim: 'rgba(245,158,11,0.10)',
  danger:     '#EF4444',
  dangerDim:  'rgba(239,68,68,0.10)',
};

const STORAGE_KEY = 'savdo:theme';

export function loadStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  const v = window.localStorage?.getItem(STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

export function saveTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  window.localStorage?.setItem(STORAGE_KEY, mode);
}

export function applyThemeToDocument(mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', mode);
}
