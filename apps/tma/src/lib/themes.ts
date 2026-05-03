// Цветовые палитры для светлой и тёмной темы.
// Используются через CSS-переменные, см. apps/tma/src/index.css.

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
  // Фоновые слои
  bg:           '#0B0E14',
  bgGradient:   'linear-gradient(160deg, #0B0E14 0%, #0D1120 45%, #0B0F1C 100%)',
  surface:      'rgba(255,255,255,0.055)',
  surfaceHover: 'rgba(255,255,255,0.08)',

  // Текст
  textPrimary:   'rgba(255,255,255,0.90)',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted:     'rgba(255,255,255,0.40)',
  textDim:       'rgba(255,255,255,0.30)',

  // Бордеры
  border:       'rgba(255,255,255,0.11)',
  borderSoft:   'rgba(255,255,255,0.06)',

  // Акценты (orchid + cyan)
  accent:        '#A855F7',
  accentDim:     'rgba(168,85,247,0.18)',
  accentGlow:    'rgba(168,85,247,0.35)',
  accentText:    '#F3E8FF',

  cyan:          '#22D3EE',
  cyanDim:       'rgba(34,211,238,0.15)',

  // Статусы
  success:    '#34D399',
  successDim: 'rgba(52,211,153,0.15)',
  warning:    '#FBBF24',
  warningDim: 'rgba(251,191,36,0.15)',
  danger:     '#EF4444',
  dangerDim:  'rgba(239,68,68,0.15)',
};

export const LIGHT_THEME: ThemeColors = {
  bg:           '#F7F8FB',
  bgGradient:   'linear-gradient(160deg, #FFFFFF 0%, #F7F8FB 45%, #EEF1F8 100%)',
  surface:      'rgba(0,0,0,0.04)',
  surfaceHover: 'rgba(0,0,0,0.06)',

  textPrimary:   'rgba(0,0,0,0.88)',
  textSecondary: 'rgba(0,0,0,0.62)',
  textMuted:     'rgba(0,0,0,0.45)',
  textDim:       'rgba(0,0,0,0.28)',

  border:       'rgba(0,0,0,0.10)',
  borderSoft:   'rgba(0,0,0,0.06)',

  accent:        '#7C3AED',
  accentDim:     'rgba(124,58,237,0.10)',
  accentGlow:    'rgba(124,58,237,0.25)',
  accentText:    '#5B21B6',

  cyan:          '#0891B2',
  cyanDim:       'rgba(8,145,178,0.10)',

  success:    '#059669',
  successDim: 'rgba(5,150,105,0.10)',
  warning:    '#D97706',
  warningDim: 'rgba(217,119,6,0.10)',
  danger:     '#DC2626',
  dangerDim:  'rgba(220,38,38,0.10)',
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
