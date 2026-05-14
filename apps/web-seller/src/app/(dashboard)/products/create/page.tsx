'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';
import { useCreateProduct } from '../../../../hooks/use-products';
import { useStoreCategories, useGlobalCategories } from '../../../../hooks/use-seller';
import { track } from '../../../../lib/analytics';
import { MultiImageUploader, type MultiImageItem } from '../../../../components/multi-image-uploader';
import { ProductAttributesSection, type AttributeItem } from '../../../../components/product-attributes-section';
import { CategoryFiltersSection, type FilterValue } from '../../../../components/category-filters-section';
import { VariantsMatrixBuilder, type VariantCell } from '../../../../components/variants-matrix-builder';
import { Select } from '../../../../components/select';
import { DisplayTypeSelector } from '../../../../components/display-type-selector';
import { titlePlaceholder, descriptionPlaceholder } from '../../../../lib/product-examples';
import { addProductImage, createProductAttribute, createVariant } from '../../../../lib/api/products.api';
import { createOptionGroup, createOptionValue } from '../../../../lib/api/product-options.api';
import { useCategoryFilters } from '../../../../hooks/use-category-filters';
import type { ProductDisplayType } from 'types';

// Категории, которые мы не продаём на платформе. Скрываем из dropdown'а
// до тех пор, пока Полат не уберёт их из seed'а на бэке
// (API-CATEGORY-SEED-CLEANUP-001). Полат засеял корневую `automotive`
// + детей `cars` / `cars_used` / `motorcycles` в global-categories-seed.ts.
const HIDDEN_CATEGORY_SLUGS = new Set([
  'automotive', 'cars', 'cars_used', 'motorcycles',
  'auto', 'automobiles',
]);
const HIDDEN_CATEGORY_NAME_RE = /(авто|мотоц|avtomo|mototsik)/i;
function isHiddenCategory(cat: { slug: string; nameRu: string }): boolean {
  return HIDDEN_CATEGORY_SLUGS.has(cat.slug) || HIDDEN_CATEGORY_NAME_RE.test(cat.nameRu);
}

import { card, colors, dangerTint, inputStyle as inputBase } from '@/lib/styles';

// ── Form types ────────────────────────────────────────────────────────────────

interface CreateProductForm {
  title:            string;
  description:      string;
  basePrice:        number;
  sku:              string;
  isVisible:        boolean;
  globalCategoryId: string;
  displayType:      ProductDisplayType;
}

// ── Field components ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-semibold mb-1.5" style={{ color: colors.textMuted }}>
      {children}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs" style={{ color: colors.danger }}>{message}</p>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const router  = useRouter();
  const create  = useCreateProduct();

  const [images, setImages] = useState<MultiImageItem[]>([]);
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
  const [variantSelection, setVariantSelection] = useState<Record<string, string[]>>({});
  const [variantCells, setVariantCells] = useState<Record<string, VariantCell>>({});

  const { data: categories = [] } = useStoreCategories();
  const { data: globalCategoriesRaw = [] } = useGlobalCategories();
  const globalCategories = useMemo(
    () => globalCategoriesRaw.filter((c) => !isHiddenCategory(c)),
    [globalCategoriesRaw],
  );
  const [storeCategoryId, setStoreCategoryId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({
    defaultValues: { isVisible: true, basePrice: 0, globalCategoryId: '', displayType: 'SINGLE' },
  });

  const displayType = watch('displayType');

  const watchedCategoryId = watch('globalCategoryId');
  const pickedCategory = useMemo(
    () => globalCategories.find((c) => c.id === watchedCategoryId) ?? null,
    [globalCategories, watchedCategoryId],
  );
  const titleHint       = titlePlaceholder(pickedCategory?.nameRu, pickedCategory?.slug);
  const descriptionHint = descriptionPlaceholder(pickedCategory?.slug);

  // Подгружаем фильтры выбранной категории.
  const filtersQuery = useCategoryFilters(pickedCategory?.slug ?? null);
  const categoryFilters = filtersQuery.data ?? [];

  async function onSubmit(values: CreateProductForm) {
    const product = await create.mutateAsync({
      title:            values.title,
      description:      values.description || undefined,
      basePrice:        Number(values.basePrice),
      sku:              values.sku || undefined,
      isVisible:        values.isVisible,
      // mediaId больше не передаём — фото идут отдельным POST после product create
      storeCategoryId:  storeCategoryId ?? undefined,
      globalCategoryId: values.globalCategoryId || undefined,
      displayType:      values.displayType,
    });

    const productId = product.id;

    // Parallel: фото + атрибуты. Не валим product create если что-то упало.
    const photoPromises = images.map((img, idx) =>
      addProductImage(productId, {
        mediaId: img.mediaId,
        isPrimary: idx === 0,
        sortOrder: idx,
      }).catch((err) => {
        console.error(`Image #${idx} failed`, err);
        return null;
      }),
    );

    // Free-form attributes + category filter values (как attributes).
    const freeAttrs = attributes
      .filter((a) => a.name.trim() && a.value.trim())
      .map((a, idx) => ({ name: a.name.trim(), value: a.value.trim(), sortOrder: idx }));

    const filterAttrs = Object.entries(filterValues)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined && v !== false)
      .map(([key, value], idx) => {
        const filter = categoryFilters.find((f) => f.key === key);
        return {
          name: filter?.nameRu ?? key,
          value: typeof value === 'boolean' ? (value ? 'Да' : 'Нет') : String(value),
          sortOrder: 100 + idx,
        };
      });

    const attrPromises = [...freeAttrs, ...filterAttrs].map((a) =>
      createProductAttribute(productId, a).catch((err) => {
        console.error(`Attribute "${a.name}" failed`, err);
        return null;
      }),
    );

    await Promise.all([...photoPromises, ...attrPromises]);

    // Option groups + variants matrix (только multi_select фильтры с ≥1 выбранным значением).
    const multiFilters = categoryFilters.filter(
      (f) => f.fieldType === 'multi_select' && (variantSelection[f.key]?.length ?? 0) > 0,
    );

    if (multiFilters.length > 0) {
      // Generate code-friendly slug from arbitrary value.
      const toCode = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') ||
        `v${Date.now()}`;

      const groupsByKey: Record<string, { groupId: string; valueIdMap: Record<string, string> }> = {};
      for (let i = 0; i < multiFilters.length; i++) {
        const f = multiFilters[i];
        const selectedVals = variantSelection[f.key]!;
        try {
          const group = await createOptionGroup(productId, {
            name: f.nameRu,
            code: f.key,
            sortOrder: i,
          });
          const valueIdMap: Record<string, string> = {};
          for (let j = 0; j < selectedVals.length; j++) {
            const val = selectedVals[j];
            try {
              const created = await createOptionValue(productId, group.id, {
                value: val,
                code: toCode(val),
                sortOrder: j,
              });
              valueIdMap[val] = created.id;
            } catch (err) {
              console.error(`Option value "${val}" failed`, err);
            }
          }
          groupsByKey[f.key] = { groupId: group.id, valueIdMap };
        } catch (err) {
          console.error(`Option group "${f.nameRu}" failed`, err);
        }
      }

      // Создаём варианты по матрице.
      const baseSku = (values.sku || `P-${productId.slice(0, 6)}`).toUpperCase();
      for (const [label, cell] of Object.entries(variantCells)) {
        const parts = label.split(' / ');
        const optionValueIds: string[] = [];
        let okay = true;
        for (let i = 0; i < multiFilters.length; i++) {
          const f = multiFilters[i];
          const map = groupsByKey[f.key]?.valueIdMap;
          const id = map?.[parts[i]];
          if (!id) { okay = false; break; }
          optionValueIds.push(id);
        }
        if (!okay) continue;

        const sku = `${baseSku}-${parts.map((p) => toCode(p)).join('-')}`;
        try {
          await createVariant(productId, {
            sku,
            stockQuantity: cell.stockQuantity,
            priceOverride: cell.priceOverride && cell.priceOverride > 0 ? cell.priceOverride : undefined,
            optionValueIds,
          });
        } catch (err) {
          console.error(`Variant "${label}" failed`, err);
        }
      }
    }

    track.productCreated(product.storeId, product.id);
    router.push('/products');
  }

  const inputStyle: React.CSSProperties = {
    ...inputBase,
    borderRadius: "0.5rem",
    width:        "100%",
    padding:      "0.625rem 0.875rem",
    fontSize:     "0.875rem",
  };

  const inputFocusClass = "focus:ring-0 focus:outline-none";

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-md transition-opacity hover:opacity-80"
          style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: colors.textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Новый товар</h1>
          <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>Заполните основную информацию</p>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-xl p-6 flex flex-col gap-5" style={card}>

          {/* Main fields */}
          <div className="flex flex-col gap-4">
            {/* Title */}
            <div>
              <Label>Название <span style={{ color: colors.danger }}>*</span></Label>
              <input
                className={inputFocusClass}
                style={inputStyle}
                placeholder={titleHint}
                {...register('title', { required: 'Введите название товара' })}
              />
              <FieldError message={errors.title?.message} />
            </div>

            {/* Price + SKU row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Цена (сум) <span style={{ color: colors.danger }}>*</span></Label>
                <input
                  type="number"
                  min={1}
                  className={inputFocusClass}
                  style={inputStyle}
                  placeholder="10 000"
                  {...register('basePrice', {
                    required: 'Укажите цену',
                    min: { value: 1, message: 'Цена должна быть больше 0' },
                    valueAsNumber: true,
                  })}
                />
                <FieldError message={errors.basePrice?.message} />
              </div>
              <div>
                <Label>Артикул (SKU)</Label>
                <input
                  className={inputFocusClass}
                  style={inputStyle}
                  placeholder="SKU-001"
                  {...register('sku')}
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <Label>Фото товара</Label>
            <MultiImageUploader value={images} onChange={setImages} maxFiles={8} />
          </div>

          {/* Display type — how product photos render on storefront card */}
          <div>
            <Label>Как показывать товар на витрине</Label>
            <DisplayTypeSelector
              value={displayType}
              onChange={(v) => setValue('displayType', v, { shouldDirty: true })}
            />
          </div>

          {/* Global category — drives placeholders + future filter UX */}
          {globalCategories.length > 0 && (
            <div>
              <Label>Категория товара</Label>
              <input type="hidden" {...register('globalCategoryId')} />
              <Select
                value={watchedCategoryId ?? ''}
                onChange={(v) => setValue('globalCategoryId', v, { shouldValidate: true, shouldDirty: true })}
                options={globalCategories.map((c) => ({ value: c.id, label: c.nameRu }))}
                placeholder="— Выберите категорию —"
                searchPlaceholder="Поиск категории…"
                clearable
                ariaLabel="Категория товара"
              />
              {pickedCategory ? (
                <div
                  className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md"
                  style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
                >
                  <Check size={14} style={{ color: colors.accent, flexShrink: 0 }} />
                  <span className="text-xs flex-1" style={{ color: colors.textPrimary }}>
                    Товар появится у покупателей в категории{' '}
                    <strong style={{ color: colors.accent }}>«{pickedCategory.nameRu}»</strong>{' '}
                    и попадёт под её фильтры.
                  </span>
                </div>
              ) : (
                <p className="mt-1.5 text-[11px]" style={{ color: colors.textDim }}>
                  Можно выбрать любую — одежда, обувь, электроника, мебель, книги и т.д. От выбора
                  зависит, где товар увидят покупатели.
                </p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Описание</Label>
            <textarea
              className={inputFocusClass}
              style={{ ...inputStyle, resize: "none", minHeight: 96 }}
              placeholder={descriptionHint}
              {...register('description')}
            />
          </div>

          {/* Dynamic category filters — после выбора категории */}
          {pickedCategory && filtersQuery.isLoading && (
            <p className="text-xs" style={{ color: colors.textDim }}>
              Загружаем характеристики категории…
            </p>
          )}
          {pickedCategory && categoryFilters.length > 0 && (
            <>
              <div>
                <Label>Характеристики «{pickedCategory.nameRu}»</Label>
                <CategoryFiltersSection
                  filters={categoryFilters}
                  values={filterValues}
                  onChange={setFilterValues}
                />
              </div>

              {/* Variants matrix — только если у категории есть multi_select фильтры */}
              {categoryFilters.some((f) => f.fieldType === 'multi_select') && (
                <div>
                  <Label>Варианты товара (опц.)</Label>
                  <VariantsMatrixBuilder
                    filters={categoryFilters}
                    selection={variantSelection}
                    onChangeSelection={setVariantSelection}
                    variants={variantCells}
                    onChangeVariants={setVariantCells}
                  />
                </div>
              )}
            </>
          )}

          {/* Store category — optional sub-grouping inside the seller's own store */}
          {categories.length > 0 && (
            <div>
              <Label>Раздел магазина</Label>
              <Select
                value={storeCategoryId ?? ''}
                onChange={(v) => setStoreCategoryId(v || null)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="— Без раздела —"
                searchPlaceholder="Поиск раздела…"
                clearable
                searchable={categories.length > 6}
                ariaLabel="Раздел магазина"
              />
            </div>
          )}

          {/* Attributes (free-form key/value) */}
          <div>
            <Label>Характеристики</Label>
            <ProductAttributesSection value={attributes} onChange={setAttributes} />
          </div>

          {/* Visible toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Показывать в магазине</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                Покупатели смогут видеть товар
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('isVisible')} />
              <div
                className="w-11 h-6 rounded-full transition-colors peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-5 after:w-5 after:transition-transform"
                style={{
                  background: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <style>{`
                  .peer:checked + div { background: ${colors.accent}; border-color: ${colors.accentBorder}; }
                  .peer + div::after { background: ${colors.textMuted}; }
                  .peer:checked + div::after { background: ${colors.bg}; }
                `}</style>
              </div>
            </label>
          </div>
        </div>

        {/* Error banner */}
        {create.isError && (
          <div
            className="mt-4 px-4 py-3 rounded-md text-sm"
            style={{ background: dangerTint(0.12), border: `1px solid ${dangerTint(0.25)}`, color: colors.danger }}
          >
            Не удалось создать товар. Попробуйте ещё раз.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors hover:opacity-80"
            style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || create.isPending}
            className="flex-1 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {create.isPending ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}
