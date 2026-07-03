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
import { ProductStatus } from '@/lib/enums';
import type { ProductDisplayType } from 'types';
import { ProductVariantsSection } from '../../../../../components/product-variants-section';
import { ProductOptionGroupsSection } from '../../../../../components/product-option-groups-section';
import { DisplayTypeSelector } from '../../../../../components/display-type-selector';
import { ConfirmModal } from '../../../../../components/confirm-modal';
import { Select } from '../../../../../components/select';
import { titlePlaceholder, descriptionPlaceholder } from '../../../../../lib/product-examples';
import { card, colors, dangerTint, inputStyle as inputBase } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useTranslation();
  const router  = useRouter();

  const STATUS_LABELS: Partial<Record<ProductStatus, string>> = {
    [ProductStatus.ACTIVE]:   t('products.status.ACTIVE'),
    [ProductStatus.DRAFT]:    t('products.status.DRAFT'),
    [ProductStatus.ARCHIVED]: t('products.status.ARCHIVED'),
  };

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
  const [imageError, setImageError] = useState<string | null>(null);
  // Map mediaId → ProductImage.id для удаления существующих фото.
  const imageIdMapRef = useRef<Map<string, string>>(new Map());
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  // Дебаунс серверной синхронизации атрибутов + защита от наслаивания POST'ов.
  const attrSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attrSyncing = useRef(false);
  const syncedAttrsRef = useRef<AttributeItem[]>([]);

  const { data: categories = [] } = useStoreCategories();
  const { data: globalCategoriesRaw = [] } = useGlobalCategories();
  const globalCategories = globalCategoriesRaw;
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

      // Init multi-image state from product.images (ProductImageRef[] из
      // packages/types — API-PRODUCT-IMAGES-FULL-SHAPE-001). На seller detail
      // endpoint id/mediaId всегда заполнены; в типе они optional ради лёгких
      // feed-ответов, поэтому ниже идут ?? / guard.
      const rawImages = product.images ?? [];
      const items: MultiImageItem[] = rawImages.map((img, i) => ({
        mediaId: img.mediaId ?? img.id ?? '',
        previewUrl: img.url ?? product.mediaUrls?.[i] ?? '',
      }));
      setImages(items);

      const map = new Map<string, string>();
      for (const img of rawImages) {
        const key = img.mediaId ?? img.id;
        if (key && img.id) map.set(key, img.id);
      }
      imageIdMapRef.current = map;

      // Init attributes
      const items2: AttributeItem[] = (product.attributes ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }));
      setAttributes(items2);
      syncedAttrsRef.current = items2;
    }
  }, [product, reset]);

  // Снять отложенный attr-sync при размонтировании.
  useEffect(() => () => {
    if (attrSyncTimer.current) clearTimeout(attrSyncTimer.current);
  }, []);

  async function handleImagesChange(next: MultiImageItem[]) {
    const prev = images;
    setImages(next);
    setImageError(null);

    const prevIds = new Set(prev.map((i) => i.mediaId));
    const nextIds = new Set(next.map((i) => i.mediaId));

    // Фото, чьи серверные операции упали — нужно откатить из UI, иначе
    // продавец думает что фото сохранено/удалено, а на сервере иначе.
    const failedAdds = new Set<string>();
    const failedRemovals: MultiImageItem[] = [];

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
        failedAdds.add(item.mediaId);
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
        failedRemovals.push(item);
      }
    }

    // Reorder не поддерживается backend'ом — порядок останется как в product.images
    // (по sortOrder при POST). API-PRODUCT-IMAGES-PATCH-001 в backlog.

    // Сверяем UI с реальностью сервера: убираем фото с упавшим add,
    // возвращаем фото с упавшим delete.
    if (failedAdds.size > 0 || failedRemovals.length > 0) {
      setImages((cur) => {
        const reconciled = cur.filter((i) => !failedAdds.has(i.mediaId));
        for (const item of failedRemovals) {
          if (!reconciled.some((i) => i.mediaId === item.mediaId)) {
            reconciled.push(item);
          }
        }
        return reconciled;
      });
      setImageError(t('products.edit.errorImages'));
    }

    queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
  }

  function handleAttributesChange(next: AttributeItem[]) {
    // Локальное состояние — сразу, ввод отзывчив.
    setAttributes(next);
    // Серверная синхронизация — дебаунс 700мс. Раньше POST летел на КАЖДЫЙ
    // символ: созданный атрибут не получал id обратно → следующий keystroke
    // снова видел его как «added» → дубли в БД.
    if (attrSyncTimer.current) clearTimeout(attrSyncTimer.current);
    attrSyncTimer.current = setTimeout(() => { void syncAttributes(next); }, 700);
  }

  async function syncAttributes(target: AttributeItem[]) {
    // Не наслаиваем проходы — иначе тот же «added» создастся дважды.
    if (attrSyncing.current) {
      if (attrSyncTimer.current) clearTimeout(attrSyncTimer.current);
      attrSyncTimer.current = setTimeout(() => { void syncAttributes(target); }, 700);
      return;
    }
    attrSyncing.current = true;
    try {
      const synced = syncedAttrsRef.current;
      const targetIds = new Set(target.filter((a) => a.id).map((a) => a.id!));

      // Removed — был с id в синхронизированном состоянии, отсутствует в target
      const removed = synced.filter((a) => a.id && !targetIds.has(a.id));
      for (const a of removed) {
        try { await deleteProductAttribute(id, a.id!); }
        catch (err) { console.error('delete attribute failed', err); }
      }

      // Added — без id, оба поля непустые
      const added = target.filter((a) => !a.id && a.name.trim() && a.value.trim());
      for (const a of added) {
        try {
          const created = await createProductAttribute(id, {
            name: a.name.trim(),
            value: a.value.trim(),
            sortOrder: target.indexOf(a),
          });
          // Записать id обратно — иначе следующий проход создаст дубль.
          a.id = created.id;
          setAttributes((cur) => cur.map((x) => (x === a ? { ...x, id: created.id } : x)));
        } catch (err) { console.error('create attribute failed', err); }
      }

      // Зафиксировать новое синхронизированное состояние (только то, что на сервере).
      syncedAttrsRef.current = target.filter((a) => a.id);
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
    } finally {
      attrSyncing.current = false;
    }
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
    try {
      await updateStatus.mutateAsync({ id, status });
      router.push('/products');
    } catch {
      // Rejected transition (e.g. DRAFT -> ARCHIVED isn't allowed) — surfaced
      // via updateStatus.isError below instead of failing silently.
    }
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
          <p className="text-sm" style={{ color: colors.danger }}>{t('products.edit.notFound')}</p>
          <button
            onClick={() => router.push('/products')}
            className="mt-4 text-sm underline"
            style={{ color: colors.accent }}
          >
            {t('products.edit.backToList')}
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
          aria-label={t('common.back')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: colors.textPrimary }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: colors.textPrimary }}>{t('products.edit.title')}</h1>
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
          {t('products.edit.hiddenByAdmin')}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-xl p-6 flex flex-col gap-5" style={glass}>

          {/* Photos */}
          <div>
            <Label>{t('products.edit.labelPhotos')}</Label>
            <MultiImageUploader
              value={images}
              onChange={handleImagesChange}
              maxFiles={8}
              reorderable={false}
            />
            {imageError && (
              <p className="mt-2 text-xs" style={{ color: colors.danger }}>
                {imageError}
              </p>
            )}
          </div>

          {/* Display type */}
          <div>
            <Label>{t('products.edit.labelDisplayType')}</Label>
            <DisplayTypeSelector
              value={displayType}
              onChange={(v) => setValue('displayType', v, { shouldDirty: true })}
            />
          </div>

          {/* Global category */}
          {globalCategories.length > 0 && (
            <div>
              <Label>{t('products.edit.labelGlobalCategory')}</Label>
              <input type="hidden" {...register('globalCategoryId')} />
              <Select
                value={watchedCategoryId ?? ''}
                onChange={(v) => setValue('globalCategoryId', v, { shouldValidate: true, shouldDirty: true })}
                options={globalCategories.map((c) => ({ value: c.id, label: c.nameRu }))}
                placeholder={t('products.edit.categoryPlaceholder')}
                searchPlaceholder={t('products.edit.categorySearchPlaceholder')}
                clearable
                ariaLabel={t('products.edit.labelGlobalCategory')}
              />
              <p className="mt-1.5 text-[11px]" style={{ color: colors.textDim }}>
                {pickedCategory
                  ? t('products.edit.categoryWithHint')
                  : t('products.edit.categoryWithoutHint')}
              </p>
            </div>
          )}

          {/* Store-local section */}
          {categories.length > 0 && (
            <div>
              <Label>{t('products.edit.labelStoreSection')}</Label>
              <Select
                value={storeCategoryId ?? ''}
                onChange={(v) => setStoreCategoryId(v || null)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder={t('products.edit.sectionPlaceholder')}
                searchPlaceholder={t('products.edit.sectionSearchPlaceholder')}
                clearable
                searchable={categories.length > 6}
                ariaLabel={t('products.edit.labelStoreSection')}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <Label>{t('products.edit.labelName')} <span style={{ color: colors.danger }}>*</span></Label>
            <input
              className={focusCls}
              style={inputStyle}
              placeholder={titleHint}
              {...register('title', { required: t('products.edit.requiredName') })}
            />
            <FieldError message={errors.title?.message} />
          </div>

          {/* Description */}
          <div>
            <Label>{t('products.edit.labelDescription')}</Label>
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
              <Label>{t('products.edit.labelPrice')} <span style={{ color: colors.danger }}>*</span></Label>
              <input
                type="number"
                min={0}
                className={focusCls}
                style={inputStyle}
                placeholder="0"
                {...register('basePrice', {
                  required: t('products.edit.requiredPrice'),
                  min: { value: 0, message: t('products.edit.priceMin') },
                  valueAsNumber: true,
                })}
              />
              <FieldError message={errors.basePrice?.message} />
            </div>
            <div>
              <Label>{t('products.edit.labelSku')}</Label>
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
              <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{t('products.edit.labelVisibility')}</p>
              <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>
                {t('products.edit.visibilityHint')}
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
            {t('products.edit.errorSave')}
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
            {t('products.edit.cancelBtn')}
          </button>
          <button
            type="submit"
            disabled={(!isDirty && storeCategoryId === initialCategoryIdRef.current) || isSubmitting || update.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {update.isPending ? t('products.edit.saving') : t('products.edit.saveBtn')}
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
          {t('products.edit.labelAttributes')}
        </p>
        <ProductAttributesSection value={attributes} onChange={handleAttributesChange} />
      </div>

      {/* Status & danger actions */}
      {!isHiddenByAdmin && (
        <div className="mt-4 rounded-xl p-5 flex flex-col gap-3" style={glass}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
            {t('products.edit.labelStatus')}
          </p>

          <div className="flex gap-2 flex-wrap">
            {product.status !== ProductStatus.ACTIVE && (
              <button
                onClick={() => handleStatusChange(ProductStatus.ACTIVE)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(52,211,153,.15)", border: "1px solid rgba(52,211,153,.25)", color: colors.success }}
              >
                {t('products.edit.makeActive')}
              </button>
            )}
            {/* DRAFT and ARCHIVED are only reachable from ACTIVE per the backend's
                allowed-transitions table (DRAFT:[ACTIVE], ACTIVE:[ARCHIVED,DRAFT],
                ARCHIVED:[ACTIVE]) — showing these for the wrong source status let
                the seller trigger a 422 with no explanation. */}
            {product.status === ProductStatus.ACTIVE && (
              <button
                onClick={() => handleStatusChange(ProductStatus.DRAFT)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textMuted }}
              >
                {t('products.edit.toDraft')}
              </button>
            )}
            {product.status === ProductStatus.ACTIVE && (
              <button
                onClick={() => handleStatusChange(ProductStatus.ARCHIVED)}
                disabled={updateStatus.isPending}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}`, color: colors.textDim }}
              >
                {t('products.edit.toArchive')}
              </button>
            )}
          </div>

          {updateStatus.isError && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{ background: dangerTint(0.12), border: `1px solid ${dangerTint(0.25)}`, color: colors.danger }}
            >
              {t('products.edit.errorStatus')}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${colors.divider}`, paddingTop: "0.75rem" }}>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={remove.isPending}
              className="text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ color: colors.danger }}
            >
              {remove.isPending ? t('products.edit.deleting') : t('products.edit.deleteBtn')}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        title={t('products.edit.deleteConfirmTitle')}
        message={t('products.edit.deleteConfirmMsg')}
        confirmLabel={t('products.edit.deleteConfirmLabel')}
        danger
        loading={remove.isPending}
        onConfirm={performDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
