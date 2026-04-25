'use client';

import { useMemo, useState } from 'react';
import type { OptionGroup, ProductVariant } from 'types';
import {
  useProductVariants,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant,
} from '../hooks/use-products';
import { X, Check, Pencil, Trash2 } from 'lucide-react';
import { card, colors, inputStyle as inputBase } from '@/lib/styles';

const glass = card;

const fieldStyle: React.CSSProperties = {
  ...inputBase,
  borderRadius: '0.5rem',
  width:        '100%',
  padding:      '0.5rem 0.75rem',
  fontSize:     '0.8125rem',
};

const confirmBtn: React.CSSProperties = {
  flexShrink: 0,
  width: 28,
  height: 28,
  borderRadius: '0.375rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  background: colors.accentMuted,
  border: `1px solid ${colors.accentBorder}`,
  color: colors.accent,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cancelBtn: React.CSSProperties = {
  ...confirmBtn,
  background: colors.surfaceMuted,
  border: `1px solid ${colors.border}`,
  color: colors.textMuted,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number | null): string {
  if (price === null) return '—';
  const num = typeof price === 'number' ? price : Number(price);
  return (Number.isFinite(num) ? num : 0).toLocaleString('ru-RU') + ' сум';
}

/** Build "Размер: XL · Цвет: Красный" from a variant's options */
function describeOptions(variant: ProductVariant, optionGroups: OptionGroup[]): string | null {
  const ids = variant.optionValueIds ?? [];
  if (ids.length === 0 || optionGroups.length === 0) return null;
  const parts: string[] = [];
  for (const g of optionGroups) {
    const match = g.values.find((v) => ids.includes(v.id));
    if (match) parts.push(`${g.name}: ${match.value}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

// ── Inline form for add/edit ──────────────────────────────────────────────────

interface VariantForm {
  titleOverride: string;
  sku: string;
  priceOverride: string;
  stockQuantity: string;
  isActive: boolean;
  /** groupId → selected optionValueId (new variant only) */
  optionSelection: Record<string, string>;
}

function emptyForm(sku?: string): VariantForm {
  return {
    titleOverride: '',
    sku: sku ?? '',
    priceOverride: '',
    stockQuantity: '0',
    isActive: true,
    optionSelection: {},
  };
}

function variantToForm(v: ProductVariant): VariantForm {
  return {
    titleOverride: v.titleOverride ?? '',
    sku:           v.sku,
    priceOverride: v.priceOverride !== null ? String(v.priceOverride) : '',
    stockQuantity: String(v.stockQuantity),
    isActive:      v.isActive,
    optionSelection: {},
  };
}

interface InlineFormProps {
  initial: VariantForm;
  onSave: (f: VariantForm) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  /** Option groups rendered as selects. Empty array = no selects shown. */
  optionGroups: OptionGroup[];
  /** Hide option selects (edit mode — options are immutable after creation). */
  hideOptions: boolean;
}

function InlineVariantForm({
  initial,
  onSave,
  onCancel,
  saving,
  optionGroups,
  hideOptions,
}: InlineFormProps) {
  const [f, setF] = useState<VariantForm>(initial);

  const setField = <K extends keyof VariantForm>(k: K) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [k]: val as VariantForm[K] }));
  };

  const setOptionValue = (groupId: string, valueId: string) => {
    setF((prev) => ({
      ...prev,
      optionSelection: { ...prev.optionSelection, [groupId]: valueId },
    }));
  };

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onCancel();
  }

  // Every group must have a selected value before save is allowed (new variant)
  const allOptionsSelected =
    hideOptions ||
    optionGroups.length === 0 ||
    optionGroups.every((g) => {
      const picked = f.optionSelection[g.id];
      return picked && g.values.some((v) => v.id === picked);
    });

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 mt-1"
      style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
      onKeyDown={handleKeyDown}
    >
      {/* Option selectors (only when adding and product has option groups) */}
      {!hideOptions && optionGroups.length > 0 && (
        <div className="flex flex-col gap-2">
          {optionGroups.map((g) => {
            const hasValues = g.values.length > 0;
            return (
              <div key={g.id}>
                <label className="block text-xs mb-1" style={{ color: colors.textDim }}>
                  {g.name}
                </label>
                {hasValues ? (
                  <select
                    style={{ ...fieldStyle, appearance: 'none' } as React.CSSProperties}
                    value={f.optionSelection[g.id] ?? ''}
                    onChange={(e) => setOptionValue(g.id, e.target.value)}
                  >
                    <option value="" style={{ background: '#1a1d2e' }}>— выберите —</option>
                    {g.values.map((v) => (
                      <option key={v.id} value={v.id} style={{ background: '#1a1d2e' }}>
                        {v.value}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs" style={{ color: '#fbbf24' }}>
                    Добавьте значения в эту группу перед созданием варианта
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Row 1: title + sku */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.textDim }}>Название</label>
          <input
            style={fieldStyle}
            placeholder="Красный / XL"
            value={f.titleOverride}
            onChange={setField('titleOverride')}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.textDim }}>Артикул (SKU)</label>
          <input
            style={fieldStyle}
            placeholder="SKU-VAR-001"
            value={f.sku}
            onChange={setField('sku')}
          />
        </div>
      </div>

      {/* Row 2: price + stock */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.textDim }}>Цена (сум, пусто = базовая)</label>
          <input
            type="number"
            min={0}
            style={fieldStyle}
            placeholder="0"
            value={f.priceOverride}
            onChange={setField('priceOverride')}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: colors.textDim }}>Остаток</label>
          <input
            type="number"
            min={0}
            style={fieldStyle}
            placeholder="0"
            value={f.stockQuantity}
            onChange={setField('stockQuantity')}
          />
        </div>
      </div>

      {/* Row 3: active toggle + buttons */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-white">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={f.isActive}
            onChange={setField('isActive')}
          />
          <div
            className="relative w-9 h-5 rounded-full transition-all peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-4 after:w-4 after:transition-all after:bg-white"
            style={{ background: f.isActive ? colors.accent : colors.surfaceElevated, border: `1px solid ${f.isActive ? colors.accentBorder : colors.border}` }}
          />
          Активен
        </label>

        <div className="flex gap-2">
          <button type="button" style={cancelBtn} onClick={onCancel} title="Отмена"><X size={14} /></button>
          <button
            type="button"
            style={confirmBtn}
            disabled={saving || !f.sku.trim() || !allOptionsSelected}
            onClick={() => onSave(f)}
            title={allOptionsSelected ? 'Сохранить' : 'Выберите значение для каждой группы опций'}
          >
            {saving ? '…' : <Check size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  productId: string;
  productSku: string | null;
  optionGroups?: OptionGroup[];
}

export function ProductVariantsSection({ productId, productSku, optionGroups = [] }: Props) {
  const { data: variants = [], isLoading } = useProductVariants(productId);
  const create = useCreateVariant();
  const update = useUpdateVariant();
  const remove = useDeleteVariant();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding]       = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const hasOptions = optionGroups.length > 0;

  const variantLabel = useMemo(() => {
    return (v: ProductVariant): string => {
      const opts = describeOptions(v, optionGroups);
      if (v.titleOverride) return v.titleOverride;
      return opts ?? v.sku;
    };
  }, [optionGroups]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleAdd(f: VariantForm) {
    if (!f.sku.trim()) return;
    const optionValueIds = hasOptions
      ? Object.values(f.optionSelection).filter(Boolean)
      : undefined;

    // If seller left title empty but picked options, derive a human label
    // ("S · Красный") so buyer-side chips don't fall back to SKU.
    let title = f.titleOverride.trim();
    if (!title && optionValueIds && optionValueIds.length > 0) {
      const parts: string[] = [];
      for (const g of optionGroups) {
        const match = g.values.find((v) => optionValueIds.includes(v.id));
        if (match) parts.push(match.value);
      }
      if (parts.length > 0) title = parts.join(' · ');
    }

    await create.mutateAsync({
      productId,
      sku:           f.sku.trim(),
      titleOverride: title || undefined,
      priceOverride: f.priceOverride !== '' ? Number(f.priceOverride) : undefined,
      stockQuantity: Number(f.stockQuantity) || 0,
      isActive:      f.isActive,
      optionValueIds: optionValueIds && optionValueIds.length > 0 ? optionValueIds : undefined,
    });
    setAdding(false);
  }

  async function handleUpdate(variantId: string, f: VariantForm) {
    await update.mutateAsync({
      productId,
      variantId,
      sku:           f.sku.trim(),
      titleOverride: f.titleOverride.trim() || undefined,
      priceOverride: f.priceOverride !== '' ? Number(f.priceOverride) : undefined,
      stockQuantity: Number(f.stockQuantity) || 0,
      isActive:      f.isActive,
    });
    setEditingId(null);
  }

  async function handleDelete(variantId: string) {
    if (!confirm('Удалить вариант?')) return;
    setDeletingId(variantId);
    try {
      await remove.mutateAsync({ productId, variantId });
    } finally {
      setDeletingId(null);
    }
  }

  // Can't add a variant if any option group has no values yet
  const canAdd = !hasOptions || optionGroups.every((g) => g.values.length > 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4 mt-4" style={glass}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Варианты товара
        </p>
        {variants.length > 0 && (
          <span className="text-xs" style={{ color: colors.textDim }}>
            {variants.length} шт.
          </span>
        )}
      </div>

      {isLoading && (
        <p className="text-xs py-2" style={{ color: colors.textDim }}>Загрузка...</p>
      )}

      {!isLoading && variants.length === 0 && !adding && (
        <p className="text-xs py-1" style={{ color: colors.textDim }}>
          Нет вариантов. Добавьте, если товар продаётся в разных размерах, цветах и т.д.
        </p>
      )}

      {/* Variant rows */}
      {variants.map((v) => {
        const subLabel = describeOptions(v, optionGroups);
        return (
          <div key={v.id}>
            <div
              className="flex items-center gap-3 py-2"
              style={{ borderTop: `1px solid ${colors.divider}` }}
            >
              {/* Active dot */}
              <span
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: v.isActive ? colors.success : colors.surfaceElevated }}
              />

              {/* Name + stock */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">
                  {variantLabel(v)}
                </p>
                {subLabel && v.titleOverride && (
                  <p className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>
                    {subLabel}
                  </p>
                )}
                <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                  {formatPrice(v.priceOverride)} · склад: {v.stockQuantity}
                </p>
              </div>

              {/* Edit / Delete */}
              {editingId !== v.id && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    className="text-xs transition-opacity opacity-40 hover:opacity-80"
                    style={{ color: colors.accent }}
                    onClick={() => { setAdding(false); setEditingId(v.id); }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="text-xs transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
                    style={{ color: colors.danger }}
                    disabled={deletingId === v.id}
                    onClick={() => handleDelete(v.id)}
                  >
                    {deletingId === v.id ? '…' : <Trash2 size={14} />}
                  </button>
                </div>
              )}
            </div>

            {editingId === v.id && (
              <InlineVariantForm
                initial={variantToForm(v)}
                saving={update.isPending}
                onSave={(f) => handleUpdate(v.id, f)}
                onCancel={() => setEditingId(null)}
                optionGroups={optionGroups}
                hideOptions
              />
            )}
          </div>
        );
      })}

      {/* Add form */}
      {adding && (
        <InlineVariantForm
          initial={emptyForm(productSku ? `${productSku}-V${variants.length + 1}` : undefined)}
          saving={create.isPending}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
          optionGroups={optionGroups}
          hideOptions={false}
        />
      )}

      {/* Add button */}
      {!adding && (
        <button
          type="button"
          className="text-xs font-semibold transition-opacity hover:opacity-80 text-left mt-1 disabled:opacity-40"
          style={{ color: colors.accent }}
          disabled={!canAdd}
          onClick={() => { setEditingId(null); setAdding(true); }}
          title={!canAdd ? 'Сначала добавьте значения в группы опций' : undefined}
        >
          + Добавить вариант
        </button>
      )}
    </div>
  );
}
