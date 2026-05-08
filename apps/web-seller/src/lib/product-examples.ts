/**
 * Product form placeholders by global-category slug. Used by create/edit
 * product pages в apps/web-seller. Unknown slugs fall back to neutral hints —
 * новые категории auto-work без code change.
 *
 * Раньше дублировалось verbatim в обоих файлах (`create/page.tsx` +
 * `[id]/edit/page.tsx`). Вынесено отдельным модулем 08.05.2026 как часть
 * WS-DESIGN-WAVE-6.
 */

export const TITLE_EXAMPLES_BY_SLUG: Record<string, string> = {
  'electronics':   'Например: iPhone 15 Pro 128 GB',
  'phones':        'Например: iPhone 15 Pro 128 GB',
  'smartphones':   'Например: Samsung Galaxy S24',
  'laptops':       'Например: MacBook Pro 14 M3',
  'computers':     'Например: ПК i7 / 32GB RAM / RTX 4070',
  'tv':            'Например: Samsung Smart TV 55"',
  'audio':         'Например: AirPods Pro 2',
  'cameras':       'Например: Canon EOS R50',
  'appliances':    'Например: Стиральная машина Bosch 7кг',
  'clothing':      'Например: Футболка Nike, размер M',
  'shoes':         'Например: Кроссовки Nike Air Max 90',
  'bags':          'Например: Сумка через плечо, кожа',
  'accessories':   'Например: Часы Casio G-Shock',
  'furniture':     'Например: Офисное кресло с сеткой',
  'beds':          'Например: Кровать двуспальная 160×200',
  'books':         'Например: Мастер и Маргарита, Булгаков',
  'bicycles':      'Например: Велосипед Trek Marlin 7',
  'outdoor':       'Например: Палатка 3-местная',
  'toys':          'Например: LEGO Classic 11019',
  'beauty':        'Например: Крем для лица Nivea 50ml',
};

export const DESCRIPTION_EXAMPLES_BY_SLUG: Record<string, string> = {
  'clothing':    'Материал, состав, размерная сетка, страна производства...',
  'shoes':       'Материал верха и подошвы, сезон, страна производства...',
  'electronics': 'Характеристики, комплектация, гарантия...',
  'phones':      'Объём памяти, цвет, состояние, комплектация, гарантия...',
  'laptops':     'Процессор, ОЗУ, диск, экран, состояние...',
  'furniture':   'Материал, размеры, цвет, сборка...',
  'books':       'Автор, жанр, год, язык, состояние...',
};

export function titlePlaceholder(categoryName?: string | null, slug?: string | null): string {
  if (slug && TITLE_EXAMPLES_BY_SLUG[slug]) return TITLE_EXAMPLES_BY_SLUG[slug];
  if (categoryName) return `Например: товар из категории «${categoryName}»`;
  return 'Название товара';
}

export function descriptionPlaceholder(slug?: string | null): string {
  if (slug && DESCRIPTION_EXAMPLES_BY_SLUG[slug]) return DESCRIPTION_EXAMPLES_BY_SLUG[slug];
  return 'Подробное описание товара...';
}
