// apps/web-seller/src/components/variants-matrix-builder.tsx
'use client';

import { useMemo } from 'react';
import { colors, inputStyle as inputBase } from '@/lib/styles';
import type { StorefrontCategoryFilter } from '../lib/api/storefront.api';

const cellInputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.4rem 0.6rem',
  fontSize: '0.8125rem',
  borderRadius: '0.375rem',
};

export interface VariantCell {
  stockQuantity: number;
  priceOverride?: number;
}

export interface VariantsMatrixBuilderProps {
  filters: StorefrontCategoryFilter[];
  selection: Record<string, string[]>;          // filterKey → selected values
  onChangeSelection: (next: Record<string, string[]>) => void;
  variants: Record<string, VariantCell>;        // composite label → cell
  onChangeVariants: (next: Record<string, VariantCell>) => void;
}

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((tup) => arr.map((item) => [...tup, item])),
    [[]],
  );
}

export function VariantsMatrixBuilder({
  filters,
  selection,
  onChangeSelection,
  variants,
  onChangeVariants,
}: VariantsMatrixBuilderProps) {
  const multiFilters = useMemo(
    () => filters.filter((f) => f.fieldType === 'multi_select'),
    [filters],
  );

  const labels = useMemo(() => {
    if (multiFilters.length === 0) return [];
    const arrays = multiFilters.map((f) => selection[f.key] ?? []);
    if (arrays.some((a) => a.length === 0)) return [];
    return cartesian(arrays).map((tuple) => tuple.join(' / '));
  }, [multiFilters, selection]);

  if (multiFilters.length === 0) return null;

  function toggleValue(filterKey: string, val: string) {
    const current = selection[filterKey] ?? [];
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onChangeSelection({ ...selection, [filterKey]: next });
  }

  function setVariantField(label: string, field: keyof VariantCell, value: number) {
    const prev = variants[label] ?? { stockQuantity: 0 };
    onChangeVariants({ ...variants, [label]: { ...prev, [field]: value } });
  }

  return (
    <div className="flex flex-col gap-4">
      {multiFilters.map((f) => (
        <div key={f.key}>
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            {f.nameRu}
            {f.unit && (
              <span className="ml-1" style={{ color: colors.textDim }}>
                ({f.unit})
              </span>
            )}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(f.options ?? []).map((opt) => {
              const selected = (selection[f.key] ?? []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleValue(f.key, opt)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: selected ? colors.accent : colors.surface,
                    color: selected ? colors.accentTextOnBg : colors.textPrimary,
                    border: `1px solid ${selected ? colors.accent : colors.border}`,
                    cursor: 'pointer',
                  }}
                  aria-pressed={selected}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {labels.length > 0 && (
        <div>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            Варианты ({labels.length})
          </p>
          <div className="flex flex-col gap-2">
            {labels.map((label) => {
              const cell = variants[label] ?? { stockQuantity: 0 };
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="flex-1 text-xs font-medium px-3 py-2 rounded-md truncate"
                    style={{
                      background: colors.surfaceMuted,
                      color: colors.textPrimary,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    {label}
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min={0}
                      placeholder="Склад"
                      value={cell.stockQuantity || ''}
                      onChange={(e) =>
                        setVariantField(label, 'stockQuantity', Number(e.target.value) || 0)
                      }
                      style={cellInputStyle}
                    />
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      min={0}
                      placeholder="Цена опц."
                      value={cell.priceOverride ?? ''}
                      onChange={(e) =>
                        setVariantField(
                          label,
                          'priceOverride',
                          Number(e.target.value) || 0,
                        )
                      }
                      style={cellInputStyle}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px]" style={{ color: colors.textDim }}>
            Склад — сколько штук в наличии. Цена опц. — переопределяет базовую цену для этого варианта (оставь пусто чтобы использовать базовую).
          </p>
        </div>
      )}
    </div>
  );
}
