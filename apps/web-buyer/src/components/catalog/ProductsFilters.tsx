'use client';

import { useGlobalCategoriesTree } from '@/hooks/use-storefront';
import { colors } from '@/lib/styles';

export type ProductsSortKey = 'new' | 'price_asc' | 'price_desc';

const SORT_LABELS: Record<ProductsSortKey, string> = {
  new: 'Новые',
  price_asc: 'Дешевле',
  price_desc: 'Дороже',
};

export function ProductsFilters({
  categorySlug,
  sort,
  onChangeCategory,
  onChangeSort,
}: {
  categorySlug: string | null;
  sort: ProductsSortKey;
  onChangeCategory: (slug: string | null) => void;
  onChangeSort: (s: ProductsSortKey) => void;
}) {
  const { data: tree } = useGlobalCategoriesTree();
  const rootCategories = tree ?? [];

  return (
    <div className="mb-5">
      {/* Category chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        <ChipButton
          active={!categorySlug}
          onClick={() => onChangeCategory(null)}
          label="Все"
        />
        {rootCategories.map((c) => (
          <ChipButton
            key={c.id}
            active={categorySlug === c.slug}
            onClick={() => onChangeCategory(c.slug)}
            label={c.nameRu}
            icon={c.iconEmoji}
          />
        ))}
      </div>

      {/* Sort */}
      <select
        value={sort}
        onChange={(e) => onChangeSort(e.target.value as ProductsSortKey)}
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.textBody,
          borderRadius: '0.5rem',
          padding: '0.4rem 0.75rem',
          fontSize: '0.8125rem',
        }}
        aria-label="Сортировка"
      >
        {(Object.keys(SORT_LABELS) as ProductsSortKey[]).map((k) => (
          <option key={k} value={k}>
            Сортировка: {SORT_LABELS[k]}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
      style={{
        background: active ? colors.brand : colors.surface,
        color: active ? colors.brandTextOnBg : colors.textBody,
        border: `1px solid ${active ? colors.brand : colors.border}`,
        cursor: 'pointer',
      }}
      aria-pressed={active}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
