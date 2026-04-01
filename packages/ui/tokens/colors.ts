/**
 * Savdo Design Tokens — 4 палитры на выбор
 *
 * Как выбрать:
 *   1. Показать заказчику все 4 варианта
 *   2. Выбрать одну → переименовать в bloomColors / emberColors
 *   3. Удалить остальные
 *
 * Все варианты: светлая (bloom) + тёмная (ember) версии
 */

// ─────────────────────────────────────────────────────────────────────────────
// ВАРИАНТ A — "Ocean Market"
// Синий + Оранжевый (классика e-commerce: Amazon, Booking, OLX)
// Ощущение: надёжно, энергично, коммерчески понятно
// ─────────────────────────────────────────────────────────────────────────────

export const variantA_bloom = {
  // Синий — доверие, надёжность (основной бренд)
  primary:           '#1d6fba',    // ocean blue — не холодный, не Steam
  'primary-content': '#ffffff',

  // Оранжевый — CTA, "В корзину", "Купить" (импульс)
  secondary:         '#f97316',    // orange-500
  'secondary-content': '#ffffff',

  accent:            '#059669',    // emerald — успех, наличие
  'accent-content':  '#ffffff',

  neutral:           '#1e2d3d',
  'neutral-content': '#f0f7ff',

  'base-100': '#f8faff',           // чуть голубоватый белый (не стерильный)
  'base-200': '#eef3fb',
  'base-300': '#d6e4f7',
  'base-content': '#0f1e2e',       // тёмно-синий текст

  info:    '#3b82f6', 'info-content': '#ffffff',
  success: '#10b981', 'success-content': '#ffffff',
  warning: '#f59e0b', 'warning-content': '#1a0f00',
  error:   '#ef4444', 'error-content':   '#ffffff',
} as const;

export const variantA_ember = {
  primary:           '#f97316',    // оранжевый — главный в тёмной теме
  'primary-content': '#ffffff',

  secondary:         '#3b82f6',    // синий — вторичный
  'secondary-content': '#ffffff',

  accent:            '#10b981',
  'accent-content':  '#ffffff',

  neutral:           '#e0eeff',
  'neutral-content': '#0f1e2e',

  'base-100': '#090e18',           // тёмный с синеватым оттенком (НЕ Steam — теплее)
  'base-200': '#111827',           // чуть теплее
  'base-300': '#1e2a3a',
  'base-content': '#e8f1ff',       // холодноватый белый (соответствует синему)

  info:    '#60a5fa', 'info-content': '#0f1e2e',
  success: '#10b981', 'success-content': '#ffffff',
  warning: '#fbbf24', 'warning-content': '#1a0f00',
  error:   '#f87171', 'error-content':   '#ffffff',
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// ВАРИАНТ B — "Sunrise Bazaar"
// Тёплый синий индиго + Горячий оранжевый
// Ощущение: молодёжный, живой, Центральная Азия, базар
// Ближе к Wildberries но без агрессии
// ─────────────────────────────────────────────────────────────────────────────

export const variantB_bloom = {
  primary:           '#4f46e5',    // indigo-600 (теплее чем #6366f1, не такой SaaS)
  'primary-content': '#ffffff',

  secondary:         '#ea580c',    // orange-600 — горячее, насыщеннее
  'secondary-content': '#ffffff',

  accent:            '#0891b2',    // cyan-600 — свежесть
  'accent-content':  '#ffffff',

  neutral:           '#1e1b4b',
  'neutral-content': '#eef2ff',

  'base-100': '#fafaf9',
  'base-200': '#f4f3ff',           // едва лиловатый фон (намёк на бренд)
  'base-300': '#e0e7ff',
  'base-content': '#1e1b4b',

  info:    '#06b6d4', 'info-content': '#ffffff',
  success: '#16a34a', 'success-content': '#ffffff',
  warning: '#d97706', 'warning-content': '#ffffff',
  error:   '#dc2626', 'error-content':   '#ffffff',
} as const;

export const variantB_ember = {
  primary:           '#ea580c',    // оранжевый горячий
  'primary-content': '#ffffff',

  secondary:         '#6366f1',    // indigo
  'secondary-content': '#ffffff',

  accent:            '#22d3ee',    // cyan
  'accent-content':  '#0c1a1f',

  neutral:           '#eef2ff',
  'neutral-content': '#1e1b4b',

  'base-100': '#0d0c1a',           // тёмно-индиго (не Steam — нет зелёного оттенка)
  'base-200': '#151428',
  'base-300': '#1e1d38',
  'base-content': '#f0eeff',

  info:    '#22d3ee', 'info-content': '#0c1a1f',
  success: '#4ade80', 'success-content': '#052e16',
  warning: '#fbbf24', 'warning-content': '#1a0f00',
  error:   '#f87171', 'error-content':   '#ffffff',
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// ВАРИАНТ C — "Tashkent Gold"
// Глубокий синий + Золотой (премиум, узбекский колорит)
// Ощущение: дорого, красиво, как ювелирный магазин но с восточным теплом
// Для более взрослой аудитории
// ─────────────────────────────────────────────────────────────────────────────

export const variantC_bloom = {
  primary:           '#1e40af',    // blue-800 — глубокий, премиум
  'primary-content': '#ffffff',

  secondary:         '#b45309',    // amber-700 — золото (не кричащий оранжевый)
  'secondary-content': '#ffffff',

  accent:            '#065f46',    // emerald-800 — тёмный зелёный
  'accent-content':  '#ffffff',

  neutral:           '#1e3a5f',
  'neutral-content': '#fffff0',

  'base-100': '#fffdf7',           // тёплый кремово-золотой фон
  'base-200': '#fdf8ee',
  'base-300': '#f0e6cc',           // золотистые бордеры
  'base-content': '#1a1200',       // очень тёмный тёплый

  info:    '#1d6fba', 'info-content': '#ffffff',
  success: '#166534', 'success-content': '#ffffff',
  warning: '#92400e', 'warning-content': '#ffffff',
  error:   '#991b1b', 'error-content':   '#ffffff',
} as const;

export const variantC_ember = {
  primary:           '#fbbf24',    // amber-300 — золото на тёмном
  'primary-content': '#1a0f00',

  secondary:         '#3b82f6',    // blue-500
  'secondary-content': '#ffffff',

  accent:            '#34d399',    // emerald-400
  'accent-content':  '#052e16',

  neutral:           '#fef9e7',
  'neutral-content': '#1a1200',

  'base-100': '#0c0a03',           // почти чёрный с золотым оттенком
  'base-200': '#171208',
  'base-300': '#241c0e',
  'base-content': '#fef9e7',       // кремово-золотой текст

  info:    '#60a5fa', 'info-content': '#0f1e2e',
  success: '#34d399', 'success-content': '#052e16',
  warning: '#fcd34d', 'warning-content': '#1a0f00',
  error:   '#fca5a5', 'error-content':   '#7f1d1d',
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// ВАРИАНТ D — "Fresh Market"
// Тил (бирюза) + Оранжевый — оригинально, свежо, запоминается
// Ощущение: современный маркетплейс, не похож ни на кого в СНГ
// Shopify-spirit но теплее и ближе к аудитории
// ─────────────────────────────────────────────────────────────────────────────

export const variantD_bloom = {
  primary:           '#0d9488',    // teal-600 — доверие + свежесть
  'primary-content': '#ffffff',

  secondary:         '#f97316',    // orange-500 — CTA кнопки
  'secondary-content': '#ffffff',

  accent:            '#7c3aed',    // violet-600 — редкий акцент (теги, featured)
  'accent-content':  '#ffffff',

  neutral:           '#1a2e2c',
  'neutral-content': '#f0fdfa',

  'base-100': '#faf8f4',           // тёплый кремовый
  'base-200': '#f0fdf9',           // лёгкий тил-тинт
  'base-300': '#ccfbf1',           // тил бордеры
  'base-content': '#134e4a',       // тёмный тил текст

  info:    '#0891b2', 'info-content': '#ffffff',
  success: '#059669', 'success-content': '#ffffff',
  warning: '#f59e0b', 'warning-content': '#1a0f00',
  error:   '#ef4444', 'error-content':   '#ffffff',
} as const;

export const variantD_ember = {
  primary:           '#f97316',    // оранжевый
  'primary-content': '#ffffff',

  secondary:         '#14b8a6',    // teal-500
  'secondary-content': '#ffffff',

  accent:            '#a78bfa',    // violet-400 — на тёмном выглядит мягко
  'accent-content':  '#1e0a3c',

  neutral:           '#e0fdf4',
  'neutral-content': '#134e4a',

  'base-100': '#0d0b08',           // тёплый уголь (Ember)
  'base-200': '#171310',
  'base-300': '#221c14',
  'base-content': '#fff8eb',       // тёплый кремовый текст

  info:    '#22d3ee', 'info-content': '#0c1a1f',
  success: '#10b981', 'success-content': '#ffffff',
  warning: '#fbbf24', 'warning-content': '#1a0f00',
  error:   '#f87171', 'error-content':   '#ffffff',
} as const;


// ─────────────────────────────────────────────────────────────────────────────
// АКТИВНАЯ ТЕМА — меняй здесь когда выберете
// ─────────────────────────────────────────────────────────────────────────────

export const bloomColors = variantD_bloom;  // ← СМЕНИТЬ на A/B/C/D
export const emberColors = variantD_ember;  // ← СМЕНИТЬ на A/B/C/D

// Алиас для обратной совместимости
export const colors = bloomColors;
export type ColorToken = keyof typeof bloomColors;
