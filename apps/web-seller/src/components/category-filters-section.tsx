// apps/web-seller/src/components/category-filters-section.tsx
'use client';

import { colors, inputStyle as inputBase } from '@/lib/styles';
import type { StorefrontCategoryFilter } from '../lib/api/storefront.api';

const inputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderRadius: '0.5rem',
};

export type FilterValue = string | number | boolean;

export interface CategoryFiltersSectionProps {
  filters: StorefrontCategoryFilter[];
  values: Record<string, FilterValue>;
  onChange: (next: Record<string, FilterValue>) => void;
}

export function CategoryFiltersSection({
  filters,
  values,
  onChange,
}: CategoryFiltersSectionProps) {
  // multi_select обрабатывает VariantsMatrixBuilder отдельно.
  const simpleFilters = filters.filter((f) => f.fieldType !== 'multi_select');

  if (simpleFilters.length === 0) return null;

  function setField(key: string, value: FilterValue) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3">
      {simpleFilters.map((f) => (
        <div key={f.key}>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: colors.textMuted }}
          >
            {f.nameRu}
            {f.isRequired && <span style={{ color: colors.danger }}> *</span>}
            {f.unit && (
              <span className="ml-1" style={{ color: colors.textDim }}>
                ({f.unit})
              </span>
            )}
          </label>

          {f.fieldType === 'text' && (
            <input
              type="text"
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={inputStyle}
            />
          )}

          {f.fieldType === 'number' && (
            <input
              type="number"
              value={(values[f.key] as number | undefined) ?? ''}
              onChange={(e) => setField(f.key, Number(e.target.value) || 0)}
              style={inputStyle}
            />
          )}

          {f.fieldType === 'select' && f.options && (
            <select
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={inputStyle}
            >
              <option value="">— Выберите —</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}

          {f.fieldType === 'boolean' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={!!values[f.key]}
                onChange={(e) => setField(f.key, e.target.checked)}
              />
              <span style={{ color: colors.textPrimary }}>Да</span>
            </label>
          )}

          {/* Color: рендерим как select из options (тоже строки) */}
          {f.fieldType === 'color' && f.options && (
            <select
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={inputStyle}
            >
              <option value="">— Выберите —</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
