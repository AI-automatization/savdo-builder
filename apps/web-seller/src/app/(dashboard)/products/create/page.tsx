'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateProduct } from '../../../../hooks/use-products';
import { useStoreCategories, useGlobalCategories } from '../../../../hooks/use-seller';
import { track } from '../../../../lib/analytics';
import { ImageUploader } from '../../../../components/image-uploader';

// Example titles keyed by global-category slug. Unknown slugs fall back to
// a neutral "товар категории: {name}" hint — so new categories auto-work
// without a code change.
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
// (API-CATEGORY-SEED-CLEANUP-001).
const HIDDEN_CATEGORY_SLUGS = new Set(['cars', 'auto', 'automobiles']);
const HIDDEN_CATEGORY_NAME_RE = /авто/i;
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

// ── Glass tokens ──────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.07)",
  backdropFilter:       "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border:               "1px solid rgba(255,255,255,0.11)",
} as const;

// ── Form types ────────────────────────────────────────────────────────────────

interface CreateProductForm {
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
    <span className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
      {children}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{message}</p>;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CreateProductPage() {
  const router  = useRouter();
  const create  = useCreateProduct();

  const [mediaId, setMediaId] = useState<string | null>(null);

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
    formState: { errors, isSubmitting },
  } = useForm<CreateProductForm>({
    defaultValues: { isVisible: true, basePrice: 0, globalCategoryId: '' },
  });

  const watchedCategoryId = watch('globalCategoryId');
  const pickedCategory = useMemo(
    () => globalCategories.find((c) => c.id === watchedCategoryId) ?? null,
    [globalCategories, watchedCategoryId],
  );
  const titleHint       = titlePlaceholder(pickedCategory?.name, pickedCategory?.slug);
  const descriptionHint = descriptionPlaceholder(pickedCategory?.slug);

  async function onSubmit(values: CreateProductForm) {
    const product = await create.mutateAsync({
      title:            values.title,
      description:      values.description || undefined,
      basePrice:        Number(values.basePrice),
      sku:              values.sku || undefined,
      isVisible:        values.isVisible,
      mediaId:          mediaId ?? undefined,
      storeCategoryId:  storeCategoryId ?? undefined,
      globalCategoryId: values.globalCategoryId || undefined,
    });
    track.productCreated(product.storeId, product.id);
    router.push('/products');
  }

  const inputStyle = {
    background:   "rgba(255,255,255,0.06)",
    border:       "1px solid rgba(255,255,255,0.13)",
    color:        "#fff",
    borderRadius: "0.75rem",
    outline:      "none",
    width:        "100%",
    padding:      "0.625rem 0.875rem",
    fontSize:     "0.875rem",
  } as const;

  const inputFocusClass = "focus:ring-0 focus:outline-none";

  return (
    <div className="max-w-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)" }}
          aria-label="Назад"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Новый товар</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Заполните основную информацию</p>
        </div>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-2xl p-6 flex flex-col gap-5" style={glass}>

          {/* Photo + main fields row */}
          <div className="flex items-start gap-4">
            <div style={{ width: 100, height: 100, flexShrink: 0 }}>
              <ImageUploader
                value={mediaId}
                onChange={setMediaId}
                purpose="product_image"
              />
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {/* Title */}
              <div>
                <Label>Название <span style={{ color: "#f87171" }}>*</span></Label>
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
                  <Label>Цена (сум) <span style={{ color: "#f87171" }}>*</span></Label>
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
          </div>

          {/* Global category — drives placeholders + future filter UX */}
          {globalCategories.length > 0 && (
            <div>
              <Label>Категория товара</Label>
              <select
                className={inputFocusClass}
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
              <p className="mt-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>
                {pickedCategory
                  ? 'Покупателю товар появится в этой категории и попадёт под её фильтры.'
                  : 'Можно выбрать любую — одежда, обувь, электроника, мебель, книги и т.д. От выбора зависит, где товар увидят покупатели.'}
              </p>
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

          {/* Store category — optional sub-grouping inside the seller's own store */}
          {categories.length > 0 && (
            <div>
              <Label>Раздел магазина</Label>
              <select
                value={storeCategoryId ?? ''}
                onChange={(e) => setStoreCategoryId(e.target.value || null)}
                className={inputFocusClass}
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

          {/* Visible toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-white">Показывать в магазине</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Покупатели смогут видеть товар
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" {...register('isVisible')} />
              <div
                className="w-11 h-6 rounded-full transition-all peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-5 after:w-5 after:transition-all after:bg-white"
                style={{
                  background: "rgba(255,255,255,0.15)",
                }}
              >
                <style>{`
                  input:checked + div { background: linear-gradient(135deg, #7C3AED, #A78BFA); }
                `}</style>
              </div>
            </label>
          </div>
        </div>

        {/* Error banner */}
        {create.isError && (
          <div
            className="mt-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}
          >
            Не удалось создать товар. Попробуйте ещё раз.
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={isSubmitting || create.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
          >
            {create.isPending ? 'Создание...' : 'Создать товар'}
          </button>
        </div>
      </form>
    </div>
  );
}
