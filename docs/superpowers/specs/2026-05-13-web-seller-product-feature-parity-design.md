# Web-Seller Product Feature Parity with TMA — Design

**Date:** 2026-05-13
**Domain:** `apps/web-seller`
**Owner:** Азим
**Drives:** Полат сильно развил TMA AddProduct/EditProduct, web-seller отстал. Нужен функциональный паритет (не визуальный — дизайн остаётся текущий Liquid Authority).

---

## 1. Problem

`apps/web-seller` `products/create` и `products/[id]/edit` отстают от TMA `seller/AddProductPage` и `seller/EditProductPage` по функционалу:

| Функция | TMA | Web-Seller |
|---------|-----|-----------|
| Multi-photo upload (≤8 + reorder + primary) | ✅ | ❌ single |
| Free-form attributes (key/value pairs) | ✅ | ❌ |
| Dynamic filters per category (text/number/select/boolean) | ✅ | ❌ |
| Multi_select category filter → variants matrix | ✅ | ❌ (manual только) |
| Per-variant stock editor | ✅ | ⚠ partial (через ProductVariantsSection, без UI для edit stock) |
| MainButton publish | ✅ TG-only | n/a |
| Store category в форме | ✅ | ❌ |
| Cropper фото | ✅ (touch) | — (desktop, не нужен) |

Seller'у который пользуется TMA, а потом заходит в web-seller, бросается в глаза разница — невозможно повторить то же самое создание товара. Цель: **функциональный паритет**, дизайн web-seller остаётся как есть (Liquid Authority).

---

## 2. Goals & Non-Goals

### Goals (5 фич — в скоупе)

1. **Multi-photo upload** в create и edit (≤8 фото, drag-reorder, primary marker, delete)
2. **Free-form attributes** в create и edit (динамические key/value пары, +/− строк)
3. **Dynamic filters per category** в create — после выбора global category подгружаются её фильтры (`text/number/select/boolean`) и предлагаются seller'у. Сохраняются как `ProductAttribute`.
4. **Variants matrix из multi_select фильтров** — если у выбранной категории есть `multi_select` фильтры (типа `Размер`, `Цвет`), seller выбирает несколько значений → автогенерируется матрица (Размер S × Цвет красный = 1 вариант), на каждый — stock + опц. price override. Bulk-create через `/option-groups` + `/values` + `/variants`.
5. **Per-variant stock editor** в edit — компактный inline editor: input + кнопка `Сохранить` per variant, шлёт `POST /seller/products/:id/variants/:vid/stock` с `delta`.

### Non-Goals

- **Image cropper** — он нужен TMA для touch-кропа на мобиле; web-seller desktop-first, native file picker достаточно
- **Store category** в форме — без полноценного CRUD UI для store-категорий бесполезен. Запишем как `WEB-SELLER-STORE-CATEGORIES-CRUD-001` для будущего
- **MainButton publish** — Telegram WebApp специфика, не применима к web
- **Полный визуальный редизайн** — все компоненты остаются на текущей дизайн-системе (`colors`, `card`, `inputStyle`)
- **Backend изменения** — все endpoints уже существуют. Бэк трогать не нужно.

---

## 3. Design

### 3.1 Architecture overview

```
apps/web-seller/src/
├── components/
│   ├── multi-image-uploader.tsx        NEW   (Phase 1)
│   ├── product-attributes-section.tsx  NEW   (Phase 1)
│   ├── category-filters-section.tsx    NEW   (Phase 2)
│   ├── variants-matrix-builder.tsx     NEW   (Phase 2)
│   ├── product-variants-section.tsx    EDIT  (Phase 3 — добавить stock editor)
│   ├── image-uploader.tsx              keep  (используется для логотипа магазина)
│   └── product-option-groups-section.tsx keep (используется в edit)
├── hooks/
│   ├── use-products.ts                 EDIT  (новые мутации)
│   └── use-category-filters.ts         NEW   (Phase 2)
├── lib/api/
│   ├── products.api.ts                 EDIT  (image/attribute/bulk-variants endpoints)
│   └── storefront.api.ts               EDIT  (getCategoryFilters)
└── app/(dashboard)/products/
    ├── create/page.tsx                 EDIT  (Phase 1+2+3 — replace image, add attr/filter/variants UI)
    └── [id]/edit/page.tsx              EDIT  (Phase 1+2+3)
```

Фазы делаем в одной ветке `web-seller`, коммиты per-feature, push в конце каждой фазы (Railway деплоит инкрементально).

### 3.2 Phase 1 — Multi-photo + Attributes (foundational)

#### 3.2.1 `<MultiImageUploader />` компонент

API:
```tsx
<MultiImageUploader
  value={imageIds}              // string[] — uploaded mediaIds (no order сэмплируется через order)
  onChange={(ids) => setImageIds(ids)}
  maxFiles={8}
  purpose="PRODUCT_PHOTO"
/>
```

Поведение:
- Каждый загруженный файл сразу POST'ит на `/media/upload` (uploadDirect) → получаем `mediaId`
- Лимит 8 — кнопка `+ Добавить фото` скрывается при достижении
- Drag-reorder через native `draggable` + `onDragOver/onDrop` (без библиотек)
- Первое в массиве = primary (визуальный badge `★`)
- Удаление фото — × на превью
- Размер каждой превьюшки ~96×96, grid 4 cols (`grid-cols-4 sm:grid-cols-6`)
- Ошибка upload (как в текущем `ImageUploader.describeUploadError`) рендерится под grid

Контракт сохранения:
- В **create** flow: после `POST /seller/products` → batch `POST /seller/products/:id/images` для каждого `mediaId` с `{ mediaId, isPrimary: index === 0 }`
- В **edit** flow: загруженные новые фото добавляются сразу через `POST /seller/products/:id/images`; удалённые — через `DELETE /seller/products/:id/images/:imageId`. Reorder — через `PATCH /seller/products/:id/images/:imageId` с `{ sortOrder }` (если endpoint есть, иначе delete+create на reorder; см. ниже).

**Backend check (риск):** нужно подтвердить что есть `PATCH .../images/:imageId` для reorder и `isPrimary` re-flag. Если нет — Phase 1 шипает MVP: reorder только локально в create, а в edit reorder через delete+recreate (визуальная анимация прыгает). Если PATCH есть — гладко.

#### 3.2.2 `<ProductAttributesSection />` компонент

API:
```tsx
<ProductAttributesSection
  value={attributes}                                    // { name, value }[]
  onChange={(next) => setAttributes(next)}
/>
```

UI:
- Список строк, каждая = inline `[name input] [value input] [× remove]`
- Кнопка `+ Добавить характеристику` снизу
- Empty state: «Добавьте характеристики товара (Гарантия, Производитель, Материал…)»

Сохранение:
- В create: после `POST /seller/products` → for each attr `POST /seller/products/:id/attributes`
- В edit: при `setAttributes` шлём diff через mutations (add/update/delete)

### 3.3 Phase 2 — Dynamic filters + Variants matrix

#### 3.3.1 `useCategoryFilters(slug?: string)` hook

```ts
export function useCategoryFilters(slug: string | null) {
  return useQuery({
    queryKey: ['storefront', 'category-filters', slug],
    queryFn: () => getCategoryFilters(slug!),
    enabled: !!slug,
    staleTime: 10 * 60_000,
  });
}
```

Где `getCategoryFilters(slug)` шлёт `GET /storefront/categories/:slug/filters` и возвращает `StorefrontCategoryFilter[]`.

#### 3.3.2 `<CategoryFiltersSection />` компонент

Рендерит **не-multi_select** фильтры как обычные input/select:
- `text` → `<input type="text">`
- `number` → `<input type="number" step>` + `unit` если есть
- `select` → `<select>` с `options[]`
- `boolean` → toggle / checkbox

API:
```tsx
<CategoryFiltersSection
  filters={filters}                  // StorefrontCategoryFilter[] фильтрованные кроме multi_select
  values={filterValues}              // Record<string, string | boolean | number>
  onChange={(next) => setFilterValues(next)}
/>
```

Сохранение: каждое заполненное значение → `POST /seller/products/:id/attributes` с `{ name: filter.nameRu, value: String(value) }`. (Filters effectively превращаются в attributes.)

#### 3.3.3 `<VariantsMatrixBuilder />` компонент

Рендерит **multi_select** фильтры как chips для выбора значений:
- Каждый multi_select фильтр (например, `Размер`) → строка с chip'ами `[S] [M] [L] [XL]` — multi-select
- После выбора ≥1 значения в ≥1 фильтре — рендерит **матрицу вариантов**:
  - Декартово произведение выбранных значений (например, Размер `[M, L]` × Цвет `[красный, синий]` = 4 варианта)
  - Для каждого — строка `[label: "M / красный"] [stock input] [price override input (опц.)]`
- Если выбран только 1 фильтр (например, только Размер) → 1D список вариантов
- Если не выбран ни один — матрица скрыта, у товара 1 вариант с общим stock (введённым на основной форме)

API:
```tsx
<VariantsMatrixBuilder
  multiSelectFilters={filters}        // только те у которых fieldType==='multi_select'
  selection={selection}               // Record<filterKey, string[]>
  onChangeSelection={(s) => setSelection(s)}
  variants={variantsByLabel}          // Record<label, { stock: number; priceOverride?: number }>
  onChangeVariants={(v) => setVariants(v)}
/>
```

Сохранение (только в **create**):
- После `POST /seller/products` → для каждого filter в selection:
  - `POST /seller/products/:id/option-groups` `{ name: filter.nameRu, code: filter.key, sortOrder }`
  - Для каждого selected value: `POST /option-groups/:groupId/values` `{ value, sortOrder }`
- Затем для каждой ячейки матрицы:
  - `POST /seller/products/:id/variants` `{ optionValueIds: [...], stockQuantity, priceOverride? }`

В **edit** flow — отдельный existing `ProductVariantsSection` / `ProductOptionGroupsSection` остаётся как есть (Phase 3 расширяет stock editor). VariantsMatrixBuilder используется только при create.

### 3.4 Phase 3 — Per-variant stock editor

Расширение существующего `ProductVariantsSection` (`apps/web-seller/src/components/product-variants-section.tsx`):
- Добавить inline `<input type="number">` для stock + `Сохранить` кнопку per row
- При нажатии — `useAdjustStock` (уже существует) с `delta = newValue - current`
- Optimistic update: setQueryData мгновенно меняет stock в кэше, на error — rollback
- Скелетон строки на pending

### 3.5 Data flow — Create Product (final wiring)

```
1. Form state:
   { title, description, basePrice, sku, isVisible, displayType,
     globalCategoryId, globalCategorySlug,
     imageIds: string[],
     attributes: { name, value }[],
     filterValues: Record<key, value>,   // non-multi_select
     selection: Record<key, string[]>,   // multi_select
     variants: Record<label, { stock, priceOverride? }> }

2. User selects global category → useCategoryFilters fires
3. Render CategoryFiltersSection + VariantsMatrixBuilder с подгруженными filters

4. На submit:
   a. POST /seller/products → product
   b. parallel:
      - imageIds.forEach → POST /seller/products/:id/images
      - attributes ∪ flattened filterValues → POST /seller/products/:id/attributes
      - selection → POST option-groups + values → POST variants matrix
   c. router.push(/products)
```

Ошибка любого шага после product create — оставляем product как DRAFT, показываем banner с retry-ссылкой на /edit.

---

## 4. State & Hooks (новые)

| Hook | Описание |
|------|----------|
| `useCategoryFilters(slug)` | GET `/storefront/categories/:slug/filters`, stale 10min |
| `useUploadProductImage(productId)` | mutation: POST `/seller/products/:id/images` |
| `useDeleteProductImage(productId)` | mutation: DELETE `/seller/products/:id/images/:imageId` |
| `useReorderProductImages(productId)` | mutation: PATCH `/seller/products/:id/images/:imageId` (если backend поддерживает; иначе fallback) |
| `useCreateAttribute(productId)` | mutation: POST `/seller/products/:id/attributes` |
| `useDeleteAttribute(productId)` | mutation: DELETE `/seller/products/:id/attributes/:attrId` |

Все мутации invalidate `productKeys.detail(productId)` для синхронизации.

---

## 5. Validation & Edge Cases

| Case | Behavior |
|------|----------|
| 0 фото | Allowed (product без фото показывается placeholder'ом) |
| >8 фото | Кнопка add скрывается, drag нового файла → error toast |
| Drag-reorder при едит | Optimistic UI; на server error — rollback |
| Multi_select selection пустой | Матрица скрыта; product создаётся с 1 default variant и общим stock из формы |
| Attribute с пустым name или value | Не сохраняется (silent skip) |
| Filter с unit (`см`, `кг`) | Unit рендерится справа от input серым text-xs |
| Category без filters | CategoryFiltersSection и VariantsMatrixBuilder не рендерятся |
| Change category после ввода filter values | Спросить confirm modal (значения текущей категории потеряются) |
| Variants matrix collision (same labels) | Backend rejects 409 — toast «такая комбинация уже есть» |

---

## 6. Risks

1. **`PATCH /seller/products/:id/images/:imageId` для reorder/primary** — нужно подтвердить что endpoint есть. Если нет — добавить в `analiz/tasks.md` для Полата, edit reorder делать через delete+recreate (на UX не критично, но прыгает).
2. **VariantsMatrixBuilder в edit-flow** — сложная синхронизация (existing option groups vs new selection). Делаем только в **create** flow, edit оставляем существующему ProductOptionGroupsSection / ProductVariantsSection. Это компромисс: после первого create variants редактируются через старый UI, который менее удобен. Документируем как known limitation, отдельная задача потом.
3. **Backend `/seller/products/:id/attributes` shape** — TMA шлёт `{ name, value }`. Подтвердить идентичную схему через grep TMA.
4. **packages/types** — `StorefrontCategoryFilter` уже в web-buyer `storefront.api.ts` как local interface. Поднять в `packages/types` отдельной задачей (или дублировать local в web-seller — short-term).

---

## 7. Out of Scope (future)

- Store-категории CRUD (`WEB-SELLER-STORE-CATEGORIES-CRUD-001`)
- Edit-flow для VariantsMatrixBuilder (re-build matrix существующего product)
- Drag-reorder для attributes (sortOrder через mouse)
- Bulk-create variants endpoint от Полата (сейчас отдельные POST per variant — N round-trips на большой матрице)
- Photo cropper в desktop (если seller хочет резать — пусть кропает в Photoshop)
