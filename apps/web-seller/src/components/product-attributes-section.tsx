// apps/web-seller/src/components/product-attributes-section.tsx
'use client';

import { Plus, X } from 'lucide-react';
import { colors, inputStyle as inputBase } from '@/lib/styles';

const inputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderRadius: '0.5rem',
};

export interface AttributeItem {
  /** undefined для новых (ещё не отправленных), id для существующих. */
  id?: string;
  name: string;
  value: string;
}

export interface ProductAttributesSectionProps {
  value: AttributeItem[];
  onChange: (next: AttributeItem[]) => void;
}

export function ProductAttributesSection({
  value,
  onChange,
}: ProductAttributesSectionProps) {
  function update(idx: number, field: 'name' | 'value', v: string) {
    onChange(value.map((a, i) => (i === idx ? { ...a, [field]: v } : a)));
  }
  function add() {
    onChange([...value, { name: '', value: '' }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && (
        <p className="text-xs" style={{ color: colors.textDim }}>
          Добавьте характеристики товара: Гарантия, Производитель, Материал и т.д.
        </p>
      )}
      {value.map((attr, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Название (Гарантия)"
            value={attr.name}
            onChange={(e) => update(idx, 'name', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="text"
            placeholder="Значение (12 месяцев)"
            value={attr.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
            style={{
              background: colors.surfaceMuted,
              border: `1px solid ${colors.border}`,
              color: colors.danger,
            }}
            aria-label="Удалить характеристику"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: colors.accentMuted,
          color: colors.accent,
          border: `1px solid ${colors.accentBorder}`,
        }}
      >
        <Plus size={12} />
        Добавить характеристику
      </button>
    </div>
  );
}
