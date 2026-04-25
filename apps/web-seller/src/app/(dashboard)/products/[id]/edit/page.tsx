'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useSellerProduct, useUpdateProduct, useUpdateProductStatus, useDeleteProduct } from '../../../../../hooks/use-products';
import { useStoreCategories, useGlobalCategories } from '../../../../../hooks/use-seller';
import { ImageUploader } from '../../../../../components/image-uploader';
import { ProductStatus } from 'types';
import { ProductVariantsSection } from '../../../../../components/product-variants-section';
import { ProductOptionGroupsSection } from '../../../../../components/product-option-groups-section';
import { card, colors, inputStyle as inputBase } from '@/lib/styles';

// Keep these in sync with create/page.tsx. When this list grows, extract to
// lib/product-examples.ts and import in both pages.
const TITLE_EXAMPLES_BY_SLUG: Record<string, string> = {
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

const DESCRIPTION_EXAMPLES_BY_SLUG: Record<string, string> = {
  'clothing':    'Материал, состав, размерная сетка, страна производства...',
  'shoes':       'Материал верха и подошвы, сезон, страна производства...',
  'electronics': 'Характеристики, комплектация, гарантия...',
  'phones':      'Объём памяти, цвет, состояние, комплектация, гарантия...',
  'laptops':     'Процессор, ОЗУ, диск, экран, состояние...',
  'furniture':   'Материал, размеры, цвет, сборка...',
  'books':       'Автор, жанр, год, язык, состояние...',
};

// Категории, которые мы не продаём на платформе. Скрываем из dropdown'а
// до тех пор, пока Полат не уберёт их из seed'а на бэке
// (API-CATEGORY-SEED-CLEANUP-001). Полат засеял корневую `automotive`
// + детей `cars` / `cars_used` / `motorcycles` в global-categories-seed.ts.
const HIDDEN_CATEGORY_SLUGS = new Set([
  'automotive', 'cars', 'cars_used', 'motorcycles',
  'auto', 'automobiles',
]);
const HIDDEN_CATEGORY_NAME_RE = /(авто|мотоц|avtomo|mototsik)/i;
function isHiddenCategory(cat: { slug: string; name: string }): boolean {
  return HIDDEN_CATEGORY_SLUGS.has(cat.slug) || HIDDEN_CATEGORY_NAME_RE.test(cat.name);
}

function titlePlaceholder(categoryName?: string | null, slug?: string | null): string {
  if (slug && TITLE_EXAMPLES_BY_SLUG[slug]) return TITLE_EXAMPLES_BY_SLUG[slug];
  if (categoryName) return `Например: товар из категории «${categoryName}»`;
  return 'Название товара';
}

function descriptionPlaceholder(slug?: string | null): string {
  if (slug && DESCRIPTION_EXAMPLES_BY_SLUG[slug]) return DESCRIPTION_EXAMPLES_BY_SLUG[slug];
  return 'Подробное описание товара...';
}

const glass = card;

// ── Form types ────────────────────────────────────────────────────────────────

interface EditProductForm {
  title:            string;
  description:      string;
  basePrice:        number;
  sku:              string;
  isVisible:        boolean;
  globalCategoryId: string;
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

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-md ${className}`} style={{ background: colors.surfaceElevated }} />
  );
}

const STATUS_LABELS: Partial<Record<ProductStatus, string>> = {
  [ProductStatus.ACTIVE]:   "Активен",
  [ProductStatus.DRAFT]:    "Черновик",
  [ProductStatus.ARCHIVED]: "Архив",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const { data: product, isLoading, isError } = useSellerProduct(id);
  const update       = useUpdateProduct();
  const updateStatus = useUpdateProductStatus();
  const remove       = useDeleteProduct();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditProductForm>({
    defaultValues: { isVisible: true, basePrice: 0, globalCategoryId: '' },
  });

  const [mediaId, setMediaId] = useState<string | null>(null);
  const { data: categories = [] } = useStoreCategories();
  const { data: globalCategoriesRaw = [] } = useGlobalCategories();
  const globalCategories = useMemo(
    () => globalCategoriesRaw.filter((c) => !isHiddenCategory(c)),
    [globalCategoriesRaw],
  );
  const [storeCategoryId, setStoreCategoryId] = useState<string | null>(null);
  const initialCategoryIdRef = useRef<string | null>(null);

  const watchedCategoryId = watch('globalCategoryId');
  const pickedCategory = useMemo(
    () => globalCategories.find((c) => c.id === watchedCategoryId) ?? null,
    [globalCategories, watchedCategoryId],
  );
  const titleHint       = titlePlaceholder(pickedCategory?.name, pickedCategory?.slug);
  const descriptionHint = descriptionPlaceholder(pickedCategory?.slug);

  // Populate form once product loads
  useEffect(() => {
    if (product) {
      reset({
        title:            product.title,
        description:      product.description ?? '',
        basePrice:        product.basePrice,
        sku:              product.sku ?? '',
        isVisible:        product.isVisible,
        globalCategoryId: product.globalCategoryId ?? '',
      });
      setStoreCategoryId(product.storeCategoryId ?? null);
      initialCategoryIdRef.current = product.storeCategoryId ?? null;
    }
  }, [product, reset]);

  async function onSubmit(values: EditProductForm) {
    await update.mutateAsync({
      id,
      title:            values.title,
      description:      values.description || undefined,
      basePrice:        Number(values.basePrice),
      sku:              values.sku || undefined,
      isVisible:        values.isVisible,
      mediaId:          mediaId ?? undefined,
      storeCategoryId:  storeCategoryId ?? undefined,
      globalCategoryId: values.globalCategoryId || undefined,
    });
    router.push('/products');
  }

  async function handleStatusChange(status: ProductStatus) {
    await updateStatus.mutateAsync({ id, status });
    router.push('/products');
  }

  async function handleDelete() {
    if (!confirm('Удалить товар? Это действие нельзя отменить.')) return;
    await remove.mutateAsync(id);
    router.push('/products');
  }

  const inputStyle: React.CSSProperties = {
    ...inputBase,
    borderRadius: "0.5rem",
    width:        "100%",
    padding:      "0.625rem 0.875rem",
    fontSize:     "0.875rem",
  };

  const focusCls = "focus:ring-0 focus:outline-none";

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-xl flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="rounded-2xl p-6 flex flex-col gap-5" style={glass}>
          <Skeleton className="h-28" />
          <Skeleton className="h-24" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-8" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (isError || !product) {
    return (
      <div className="max-w-xl">
        <div className="rounded-2xl px-6 py-10 text-center" style={glass}>
          <p className="text-sm" style={{ color: "#f87171" }}>Товар не найден.</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-sm underline"
            style={{ color: "#A78BFA" }}
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  const isHiddenByAdmin = product.status === ProductStatus.HIDDEN_BY_ADMIN;

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
          style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Редактировать товар</h1>
          <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
            {STATUS_LABELS[product.status] ?? product.status}
          </p>
        </div>
      </div>

      {/* Admin-hidden banner */}
      {isHiddenByAdmin && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-sm"
          style={{ background: "rgba(251,191,36,.10)", border: "1px solid rgba(251,191,36,.25)", color: colors.warning }}
        >
          Этот товар скрыт администратором. Обратитесь в поддержку для разъяснений.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-2xl p-6 flex flex-col gap-5" style={glass}>

          {/* Photo */}
          <div>
            <Label>Фото товара</Label>
            <div style={{ width: 100, height: 100 }}>
              <ImageUploader
                value={mediaId}
                onChange={setMediaId}
                purpose="product_image"
                previewUrl={product?.mediaUrls?.[0] ?? null}
              />
            </div>
          </div>

          {/* Global category */}
          {globalCategories.length > 0 && (
            <div>
              <Label>Категория товара</Label>
              <select
                className={focusCls}
                style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
                {...register('globalCategoryId')}
              >
                <option value="" style={{ background: '#1a1d2e' }}>— Выберите категорию —</option>
                {globalCategories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#1a1d2e' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px]" style={{ color: colors.textDim }}>
                {pickedCategory
                  ? 'Товар покажется в этой категории и попадёт под её фильтры.'
                  : 'Выберите что продаёте: одежда, обувь, электроника, мебель, книги и т.д.'}
              </p>
            </div>
          )}

          {/* Store-local section */}
          {categories.length > 0 && (
            <div>
              <Label>Раздел магазина</Label>
              <select
                value={storeCategoryId ?? ''}
                onChange={(e) => setStoreCategoryId(e.target.value || null)}
                className={focusCls}
                style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
              >
                <option value="" style={{ background: '#1a1d2e' }}>— Без раздела —</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#1a1d2e' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label>Название <span style={{ color: "#f87171" }}>*</span></Label>
            <input
              className={focusCls}
              style={inputStyle}
              placeholder={titleHint}
              {...register('title', { required: 'Введите название товара' })}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Description */}
          <div>
            <Label>Описание</Label>
            <textarea
              className={focusCls}
              style={{ ...inputStyle, resize: "none", minHeight: 96 }}
              placeholder={descriptionHint}
              {...register('description')}
            />
          </div>

          {/* Price + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Цена (сум) <span style={{ color: "#f87171" }}>*</span></Label>
              <input
                type="number"
                min={0}
                className={focusCls}
                style={inputStyle}
                placeholder="0"
                {...register('basePrice', {
                  required: 'Укажите цену',
                  min: { value: 0, message: 'Цена не может быть отрицательной' },
                  valueAsNumber: true,
                })}
              />
              <FieldError message={errors.basePrice?.message} />
            </div>
            <div>
              <Label>Артикул (SKU)</Label>
              <input
                className={focusCls}
                style={inputStyle}
                placeholder="SKU-001"
                {...register('sku')}
              />
            </div>
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-white">Показывать в магазине</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                Покупатели смогут видеть товар
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled={isHiddenByAdmin} {...register('isVisible')} />
              <div
                className="w-11 h-6 rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-5 after:w-5 after:transition-all after:bg-white"
                style={{ background: colors.surfaceElevated, border: `1px solid ${colors.border}` }}
              >
                <style>{`input:checked + div { background: ${colors.accent}; border-color: ${colors.accentBorder}; }`}</style>
              </div>
            </label>
          </div>
        </div>

        {/* Error banner */}
        {update.isError && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: colors.danger }}
          >
            Не удалось сохранить изменения. Попробуйте ещё раз.
          </div>
        )}

        {/* Save / Cancel */}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!isDirty && storeCategoryId === initialCategoryIdRef.current && mediaId === null || isSubmitting || update.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
            style={{ background: colors.accent, color: colors.bg }}
          >
            {update.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>

      {/* Option groups */}
      <ProductOptionGroupsSection productId={id} optionGroups={product.optionGroups ?? []} />

      {/* Variants */}
      <ProductVariantsSection
        productId={id}
        productSku={product.sku}
        optionGroups={product.optionGroups ?? []}
      />

      {/* Status & danger actions */}
      {!isHiddenByAdmin && (
        <div className="mt-4 rounded-2xl p-5 flex flex-col gap-3" style={glass}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
            Статус товара
          </p>

          <div className="flex gap-2 flex-wrap">
            {product.status !== ProductStatus.ACTIVE && (
              <button
                onClick={() => handleStatusChange(ProductStatus.ACTIVE)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.25)", color: colors.success }}
              >
                Сделать активным
              </button>
            )}
            {product.status !== ProductStatus.DRAFT && (
              <button
                onClick={() => handleStatusChange(ProductStatus.DRAFT)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textMuted }}
              >
                В черновик
              </button>
            )}
            {product.status !== ProductStatus.ARCHIVED && (
              <button
                onClick={() => handleStatusChange(ProductStatus.ARCHIVED)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textDim }}
              >
                В архив
              </button>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: "0.75rem" }}>
            <button
              onClick={handleDelete}
              disabled={remove.isPending}
              className="text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: "#f87171" }}
            >
              {remove.isPending ? 'Удаление...' : 'Удалить товар'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
