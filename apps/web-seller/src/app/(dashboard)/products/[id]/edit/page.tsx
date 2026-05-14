'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useSellerProduct, useUpdateProduct, useUpdateProductStatus, useDeleteProduct, productKeys } from '../../../../../hooks/use-products';
import { useStoreCategories, useGlobalCategories } from '../../../../../hooks/use-seller';
import { MultiImageUploader, type MultiImageItem } from '../../../../../components/multi-image-uploader';
import { ProductAttributesSection, type AttributeItem } from '../../../../../components/product-attributes-section';
import {
  addProductImage,
  deleteProductImage,
  createProductAttribute,
  deleteProductAttribute,
} from '../../../../../lib/api/products.api';
import { ProductStatus } from 'types';
import type { ProductDisplayType } from 'types';
import { ProductVariantsSection } from '../../../../../components/product-variants-section';
import { ProductOptionGroupsSection } from '../../../../../components/product-option-groups-section';
import { DisplayTypeSelector } from '../../../../../components/display-type-selector';
import { ConfirmModal } from '../../../../../components/confirm-modal';
import { Select } from '../../../../../components/select';
import { titlePlaceholder, descriptionPlaceholder } from '../../../../../lib/product-examples';
import { card, colors, dangerTint, inputStyle as inputBase } from '@/lib/styles';

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

const glass = card;

// ── Form types ────────────────────────────────────────────────────────────────

interface EditProductForm {
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
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditProductForm>({
    defaultValues: { isVisible: true, basePrice: 0, globalCategoryId: '', displayType: 'SINGLE' },
  });

  const displayType = watch('displayType');

  const queryClient = useQueryClient();
  const [images, setImages] = useState<MultiImageItem[]>([]);
  // Map mediaId → ProductImage.id для удаления существующих фото.
  const imageIdMapRef = useRef<Map<string, string>>(new Map());
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);

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
  const titleHint       = titlePlaceholder(pickedCategory?.nameRu, pickedCategory?.slug);
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
        displayType:      product.displayType ?? 'SINGLE',
      });
      setStoreCategoryId(product.storeCategoryId ?? null);
      initialCategoryIdRef.current = product.storeCategoryId ?? null;

      // Init multi-image state from product.images (mediaUrls для URL, raw images
      // через cast для доступа к id/mediaId — типы в packages/types минимальны,
      // фактический API возвращает полную форму).
      type RawImage = { id: string; mediaId: string; url?: string };
      const rawImages = (product as unknown as { images?: RawImage[] }).images ?? [];
      const items: MultiImageItem[] = rawImages.map((img, i) => ({
        mediaId: img.mediaId ?? img.id,
        previewUrl: img.url ?? product.mediaUrls?.[i] ?? '',
      }));
      setImages(items);

      const map = new Map<string, string>();
      for (const img of rawImages) {
        const key = img.mediaId ?? img.id;
        map.set(key, img.id);
      }
      imageIdMapRef.current = map;

      // Init attributes
      const items2: AttributeItem[] = (product.attributes ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }));
      setAttributes(items2);
    }
  }, [product, reset]);

  async function handleImagesChange(next: MultiImageItem[]) {
    const prev = images;
    setImages(next);

    const prevIds = new Set(prev.map((i) => i.mediaId));
    const nextIds = new Set(next.map((i) => i.mediaId));

    // Added (есть в next, нет в prev) — POST на сервер
    const added = next.filter((i) => !prevIds.has(i.mediaId));
    for (const item of added) {
      try {
        const created = await addProductImage(id, {
          mediaId:   item.mediaId,
          isPrimary: next.findIndex((i) => i.mediaId === item.mediaId) === 0,
          sortOrder: next.findIndex((i) => i.mediaId === item.mediaId),
        });
        // Сохранить id новой ProductImage для возможного будущего удаления.
        imageIdMapRef.current.set(item.mediaId, created.id);
      } catch (err) {
        console.error(`add image failed`, err);
      }
    }

    // Removed (есть в prev, нет в next) — DELETE на сервер
    const removed = prev.filter((i) => !nextIds.has(i.mediaId));
    for (const item of removed) {
      const productImageId = imageIdMapRef.current.get(item.mediaId);
      if (!productImageId) continue;
      try {
        await deleteProductImage(id, productImageId);
        imageIdMapRef.current.delete(item.mediaId);
      } catch (err) {
        console.error(`delete image failed`, err);
      }
    }

    // Reorder не поддерживается backend'ом — порядок останется как в product.images
    // (по sortOrder при POST). API-PRODUCT-IMAGES-PATCH-001 в backlog.

    queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  }

  async function handleAttributesChange(next: AttributeItem[]) {
    const prev = attributes;
    setAttributes(next);

    const prevById = new Map(prev.filter((a) => a.id).map((a) => [a.id!, a]));
    const nextIds = new Set(next.filter((a) => a.id).map((a) => a.id!));

    // Removed (был с id, теперь нет)
    const removedIds = Array.from(prevById.keys()).filter((aid) => !nextIds.has(aid));
    for (const aid of removedIds) {
      try { await deleteProductAttribute(id, aid); }
      catch (err) { console.error(`delete attribute failed`, err); }
    }

    // Added (нет id, есть непустые name+value)
    const added = next.filter((a) => !a.id && a.name.trim() && a.value.trim());
    for (let i = 0; i < added.length; i++) {
      const a = added[i];
      try {
        await createProductAttribute(id, {
          name: a.name.trim(),
          value: a.value.trim(),
          sortOrder: next.indexOf(a),
        });
      } catch (err) { console.error(`create attribute failed`, err); }
    }

    queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  }

  async function onSubmit(values: EditProductForm) {
    await update.mutateAsync({
      id,
      title:            values.title,
      description:      values.description || undefined,
      basePrice:        Number(values.basePrice),
      sku:              values.sku || undefined,
      isVisible:        values.isVisible,
      // mediaId здесь не нужен — фото управляются через handleImagesChange (POST/DELETE).
      storeCategoryId:  storeCategoryId ?? undefined,
      globalCategoryId: values.globalCategoryId || undefined,
      displayType:      values.displayType,
    });
    router.push('/products');
  }

  async function handleStatusChange(status: ProductStatus) {
    await updateStatus.mutateAsync({ id, status });
    router.push('/products');
  }

  const [confirmDelete, setConfirmDelete] = useState(false);

  async function performDelete() {
    await remove.mutateAsync(id);
    setConfirmDelete(false);
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
        <div className="rounded-xl p-6 flex flex-col gap-5" style={glass}>
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
        <div className="rounded-xl px-6 py-10 text-center" style={glass}>
          <p className="text-sm" style={{ color: colors.danger }}>Товар не найден.</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-sm underline"
            style={{ color: colors.accent }}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: colors.textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>Редактировать товар</h1>
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
        <div className="rounded-xl p-6 flex flex-col gap-5" style={glass}>

          {/* Photos */}
          <div>
            <Label>Фото товара</Label>
            <MultiImageUploader value={images} onChange={handleImagesChange} maxFiles={8} />
          </div>

          {/* Display type */}
          <div>
            <Label>Как показывать товар на витрине</Label>
            <DisplayTypeSelector
              value={displayType}
              onChange={(v) => setValue('displayType', v, { shouldDirty: true })}
            />
          </div>

          {/* Global category */}
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

          {/* Title */}
          <div>
            <Label>Название <span style={{ color: colors.danger }}>*</span></Label>
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
              <Label>Цена (сум) <span style={{ color: colors.danger }}>*</span></Label>
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
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Показывать в магазине</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                Покупатели смогут видеть товар
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" disabled={isHiddenByAdmin} {...register('isVisible')} />
              <div
                className="w-11 h-6 rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-5 after:w-5 after:transition-all"
                style={{ background: colors.surfaceElevated, border: `1px solid ${colors.border}` }}
              >
                <style>{`
                  input:checked + div { background: ${colors.accent}; border-color: ${colors.accentBorder}; }
                  input + div::after { background: ${colors.textMuted}; }
                  input:checked + div::after { background: ${colors.bg}; }
                `}</style>
              </div>
            </label>
          </div>
        </div>

        {/* Error banner */}
        {update.isError && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: dangerTint(0.12), border: `1px solid ${dangerTint(0.25)}`, color: colors.danger }}
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
            disabled={(!isDirty && storeCategoryId === initialCategoryIdRef.current) || isSubmitting || update.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
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

      {/* Attributes (free-form key/value) */}
      <div className="mt-4 rounded-xl p-5 flex flex-col gap-3" style={glass}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
          Характеристики
        </p>
        <ProductAttributesSection value={attributes} onChange={handleAttributesChange} />
      </div>

      {/* Status & danger actions */}
      {!isHiddenByAdmin && (
        <div className="mt-4 rounded-xl p-5 flex flex-col gap-3" style={glass}>
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
              onClick={() => setConfirmDelete(true)}
              disabled={remove.isPending}
              className="text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: colors.danger }}
            >
              {remove.isPending ? 'Удаление...' : 'Удалить товар'}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        title="Удалить товар?"
        message="Это действие нельзя отменить."
        confirmLabel="Удалить"
        danger
        loading={remove.isPending}
        onConfirm={performDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
