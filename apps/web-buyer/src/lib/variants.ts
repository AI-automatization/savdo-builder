import type { OptionGroup, ProductVariant } from 'types';

/**
 * Backend currently returns variant.optionValues[] (junction records) while
 * packages/types declares optionValueIds: string[]. Handle both shapes.
 * See analiz/logs.md [API-VAR-001].
 */
export function getVariantOptionValueIds(variant: ProductVariant): string[] {
  if (Array.isArray(variant.optionValueIds) && variant.optionValueIds.length > 0) {
    return variant.optionValueIds;
  }
  const junction = (variant as unknown as { optionValues?: Array<{ optionValueId: string }> })
    .optionValues;
  if (Array.isArray(junction)) return junction.map((j) => j.optionValueId).filter(Boolean);
  return [];
}

/** Selection map: groupId → selected optionValueId */
export type OptionSelection = Record<string, string>;

/** True when a value of every group has been picked. */
export function isSelectionComplete(
  selection: OptionSelection,
  optionGroups: OptionGroup[],
): boolean {
  if (optionGroups.length === 0) return false;
  return optionGroups.every((g) => !!selection[g.id]);
}

/** Find the single variant whose option values exactly match the full selection. */
export function findVariantBySelection(
  variants: ProductVariant[],
  selection: OptionSelection,
  optionGroups: OptionGroup[],
): ProductVariant | null {
  if (!isSelectionComplete(selection, optionGroups)) return null;
  const wantedIds = new Set(Object.values(selection));

  for (const v of variants) {
    const ids = getVariantOptionValueIds(v);
    if (ids.length !== wantedIds.size) continue;
    if (ids.every((id) => wantedIds.has(id))) return v;
  }
  return null;
}

/**
 * Decide if a value chip should be enabled: at least one active variant
 * contains this value AND is compatible with values already picked in OTHER
 * groups (same group picks are overridable, so we ignore the current group's
 * current pick). Stock > 0 required — sold-out combinations stay clickable
 * but show "Нет в наличии" below.
 */
export function isValueAvailable(
  valueId: string,
  groupId: string,
  variants: ProductVariant[],
  selection: OptionSelection,
  optionGroups: OptionGroup[],
): boolean {
  // Required picks from other groups (not the current one)
  const requiredIds = new Set(
    Object.entries(selection)
      .filter(([gid, vid]) => gid !== groupId && !!vid)
      .map(([, vid]) => vid),
  );

  return variants.some((v) => {
    if (!v.isActive) return false;
    const ids = new Set(getVariantOptionValueIds(v));
    if (!ids.has(valueId)) return false;
    for (const req of requiredIds) if (!ids.has(req)) return false;
    return true;
  });
}

/** Compose human label "S · Красный" from a selection. */
export function labelFromSelection(
  selection: OptionSelection,
  optionGroups: OptionGroup[],
): string | null {
  const parts: string[] = [];
  for (const g of optionGroups) {
    const vid = selection[g.id];
    if (!vid) continue;
    const match = g.values.find((v) => v.id === vid);
    if (match) parts.push(match.value);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/** Try to seed selection from a default variant (e.g. the first in-stock one). */
export function initialSelectionFromVariants(
  variants: ProductVariant[],
  optionGroups: OptionGroup[],
): OptionSelection {
  const active = variants.filter((v) => v.isActive && v.stockQuantity > 0);
  const candidate = active[0] ?? variants.find((v) => v.isActive) ?? null;
  if (!candidate) return {};

  const ids = new Set(getVariantOptionValueIds(candidate));
  const sel: OptionSelection = {};
  for (const g of optionGroups) {
    const match = g.values.find((v) => ids.has(v.id));
    if (match) sel[g.id] = match.id;
  }
  return sel;
}
