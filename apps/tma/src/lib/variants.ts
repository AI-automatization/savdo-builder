// Minimal shapes mirroring packages/types (TMA doesn't depend on the types package).

export interface OptionValueMin {
  id: string;
  value: string;
}

export interface OptionGroupMin {
  id: string;
  name: string;
  values: OptionValueMin[];
}

export interface VariantMin {
  id: string;
  titleOverride: string | null;
  priceOverride: number | null;
  stockQuantity: number;
  isActive?: boolean;
  optionValueIds?: string[];
}

export type OptionSelection = Record<string, string>;

export function isSelectionComplete(
  selection: OptionSelection,
  optionGroups: OptionGroupMin[],
): boolean {
  if (optionGroups.length === 0) return false;
  return optionGroups.every((g) => !!selection[g.id]);
}

export function findVariantBySelection(
  variants: VariantMin[],
  selection: OptionSelection,
  optionGroups: OptionGroupMin[],
): VariantMin | null {
  if (!isSelectionComplete(selection, optionGroups)) return null;
  const wantedIds = new Set(Object.values(selection));

  for (const v of variants) {
    const ids = v.optionValueIds ?? [];
    if (ids.length !== wantedIds.size) continue;
    if (ids.every((id) => wantedIds.has(id))) return v;
  }
  return null;
}

export function isValueAvailable(
  valueId: string,
  groupId: string,
  variants: VariantMin[],
  selection: OptionSelection,
): boolean {
  const requiredIds = new Set(
    Object.entries(selection)
      .filter(([gid, vid]) => gid !== groupId && !!vid)
      .map(([, vid]) => vid),
  );

  return variants.some((v) => {
    if (v.isActive === false) return false;
    const ids = new Set(v.optionValueIds ?? []);
    if (!ids.has(valueId)) return false;
    for (const req of requiredIds) if (!ids.has(req)) return false;
    return true;
  });
}

export function initialSelectionFromVariants(
  variants: VariantMin[],
  optionGroups: OptionGroupMin[],
): OptionSelection {
  const active = variants.filter((v) => v.isActive !== false && v.stockQuantity > 0);
  const candidate = active[0] ?? variants.find((v) => v.isActive !== false) ?? null;
  if (!candidate) return {};

  const ids = new Set(candidate.optionValueIds ?? []);
  const sel: OptionSelection = {};
  for (const g of optionGroups) {
    const match = g.values.find((v) => ids.has(v.id));
    if (match) sel[g.id] = match.id;
  }
  return sel;
}
