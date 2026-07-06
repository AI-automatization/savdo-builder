'use client';

import { colors } from '@/lib/styles';
import type { StoresCatalogItem } from '@/lib/api/storefront.api';
import { useTranslation } from '@/lib/i18n';

export type StoresSortKey = 'top' | 'rating';

export interface StoresFiltersState {
  city: string | 'all';
  verifiedOnly: boolean;
  sort: StoresSortKey;
}

export function StoresFilters({
  stores,
  value,
  onChange,
}: {
  stores: StoresCatalogItem[];
  value: StoresFiltersState;
  onChange: (next: StoresFiltersState) => void;
}) {
  const cities = Array.from(
    new Set(stores.map((s) => s.city).filter((c): c is string => !!c)),
  ).sort();
  const { t } = useTranslation();

  const SORT_LABELS: Record<StoresSortKey, string> = {
    top: t('catalog.sort.top'),
    rating: t('catalog.sort.rating'),
  };

  const selectStyle: React.CSSProperties = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.textBody,
    borderRadius: '0.5rem',
    padding: '0.4rem 0.75rem',
    fontSize: '0.8125rem',
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select
        value={value.city}
        onChange={(e) => onChange({ ...value, city: e.target.value })}
        style={selectStyle}
        aria-label={t('catalog.stores.cityLabel')}
      >
        <option value="all">{t('catalog.stores.allCities')}</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => onChange({ ...value, verifiedOnly: !value.verifiedOnly })}
        style={{
          ...selectStyle,
          background: value.verifiedOnly ? colors.brand : colors.surface,
          color: value.verifiedOnly ? colors.brandTextOnBg : colors.textBody,
          borderColor: value.verifiedOnly ? colors.brand : colors.border,
          fontWeight: 600,
          cursor: 'pointer',
        }}
        aria-pressed={value.verifiedOnly}
      >
        {t('catalog.stores.verifiedOnly')}
      </button>

      <select
        value={value.sort}
        onChange={(e) =>
          onChange({ ...value, sort: e.target.value as StoresSortKey })
        }
        style={selectStyle}
        aria-label={t('catalog.sort.label')}
      >
        {(Object.keys(SORT_LABELS) as StoresSortKey[]).map((k) => (
          <option key={k} value={k}>
            {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  );
}
