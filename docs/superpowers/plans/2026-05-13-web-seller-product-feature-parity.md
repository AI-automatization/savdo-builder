# Web-Seller Product Feature Parity — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Принести в `apps/web-seller` create/edit-product функции, которые есть у TMA: multi-photo, free-form attributes, dynamic category filters, variants matrix, per-variant stock editor.

**Architecture:** Точечные дополнения в существующих pages + новые компоненты. Backend готов (бэк не трогаем). Дизайн — текущий Liquid Authority. 3 фазы в одной ветке `web-seller`, push после каждой фазы для инкрементального деплоя.

**Tech Stack:** Next.js 16, TanStack Query v5, React Hook Form (existing), TypeScript, существующий design system + tokens.

**Spec:** `docs/superpowers/specs/2026-05-13-web-seller-product-feature-parity-design.md`

**Environment:**
- Azim не запускает `pnpm dev` / `pnpm build` локально. Верификация через Railway CI после push.
- 0 frontend tests. TDD неприменим — заменяем на «read-after-edit + grep + after-deploy smoke».
- Все коммиты на ветке `web-seller`. Phase 1/2/3 → 3 push'а → 3 деплоя.

---

## File Structure

```
apps/web-seller/src/
├── components/
│   ├── multi-image-uploader.tsx        NEW   Phase 1
│   ├── product-attributes-section.tsx  NEW   Phase 1
│   ├── category-filters-section.tsx    NEW   Phase 2
│   ├── variants-matrix-builder.tsx     NEW   Phase 2
│   └── product-variants-section.tsx    EDIT  Phase 3
├── hooks/
│   ├── use-products.ts                 EDIT  Phase 1+2+3 (new mutations)
│   └── use-category-filters.ts         NEW   Phase 2
├── lib/api/
│   ├── products.api.ts                 EDIT  Phase 1 (images, attributes)
│   └── storefront.api.ts               EDIT  Phase 2 (getCategoryFilters)
└── app/(dashboard)/products/
    ├── create/page.tsx                 EDIT  Phase 1+2
    └── [id]/edit/page.tsx              EDIT  Phase 1
```

---

## Phase 1: Multi-photo + Free-form attributes

### Task 1: Verify backend endpoints

- [ ] **Step 1: Confirm `/seller/products/:id/images` POST contract**

```bash
grep -n "POST.*products.*images\|@Post.*products.*images\|addProductImage" apps/api/src/modules/products/ -r
```

Expected: endpoint accepts `{ mediaId: string, isPrimary?: boolean }` and returns `ProductImage { id, url, isPrimary, sortOrder }`. Если signature другой — адаптировать.

- [ ] **Step 2: Confirm `/seller/products/:id/attributes` POST + DELETE**

```bash
grep -n "POST.*products.*attributes\|@Post.*products.*attributes\|@Delete.*attributes" apps/api/src/modules/products/ -r
```

Expected: POST `{ name, value, sortOrder? }` → ProductAttribute. DELETE by `attributeId` → 204.

- [ ] **Step 3: Check PATCH endpoint для reorder/primary images**

```bash
grep -rn "@Patch.*products.*images\|reorderImage\|updateImage" apps/api/src/modules/products/
```

Если есть `PATCH /seller/products/:id/images/:imageId` — Phase 1 поддерживает reorder gracefully. Если нет — записать в `analiz/tasks.md` как `API-PRODUCT-IMAGES-PATCH-001` для Полата, edit reorder делать через delete+recreate (UX чуть прыгает, но работает).

- [ ] **Step 4: Commit verification notes**

Не нужно — это read-only. Если найдены gaps → добавить в analiz/tasks.md в конце Phase 1.

---

### Task 2: Extend `products.api.ts` с image + attribute helpers

**File:** `apps/web-seller/src/lib/api/products.api.ts`

- [ ] **Step 1: Add image upload helpers**

В конец файла:

```ts
// ── Product images ──────────────────────────────────────────────────────────

export interface ProductImageItem {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export async function addProductImage(
  productId: string,
  data: { mediaId: string; isPrimary?: boolean; sortOrder?: number },
): Promise<ProductImageItem> {
  const res = await apiClient.post<ProductImageItem>(
    `/seller/products/${productId}/images`,
    data,
  );
  return res.data;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/images/${imageId}`);
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  data: { isPrimary?: boolean; sortOrder?: number },
): Promise<ProductImageItem> {
  const res = await apiClient.patch<ProductImageItem>(
    `/seller/products/${productId}/images/${imageId}`,
    data,
  );
  return res.data;
}
```

- [ ] **Step 2: Add attribute helpers**

```ts
// ── Product attributes (free-form key/value) ────────────────────────────────

export async function getProductAttributes(productId: string) {
  const res = await apiClient.get<import('types').ProductAttribute[]>(
    `/seller/products/${productId}/attributes`,
  );
  return res.data;
}

export async function createProductAttribute(
  productId: string,
  data: { name: string; value: string; sortOrder?: number },
): Promise<import('types').ProductAttribute> {
  const res = await apiClient.post<import('types').ProductAttribute>(
    `/seller/products/${productId}/attributes`,
    data,
  );
  return res.data;
}

export async function deleteProductAttribute(
  productId: string,
  attributeId: string,
): Promise<void> {
  await apiClient.delete(
    `/seller/products/${productId}/attributes/${attributeId}`,
  );
}
```

- [ ] **Step 3: Verify `apiClient.delete` returns proper shape**

```bash
grep -n "apiClient.delete\|delete<" apps/web-seller/src/lib/api/client.ts
```

Expected: `apiClient.delete(url)` returns `Promise<AxiosResponse>` (стандартный axios). OK.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/lib/api/products.api.ts
git commit -m "feat(web-seller): API helpers для product images + attributes

addProductImage/deleteProductImage/updateProductImage
getProductAttributes/createProductAttribute/deleteProductAttribute"
```

---

### Task 3: `<MultiImageUploader />` component

**File:** Create `apps/web-seller/src/components/multi-image-uploader.tsx`

- [ ] **Step 1: Create component skeleton**

```tsx
'use client';

import { useRef, useState } from 'react';
import axios from 'axios';
import { Camera, X, Star } from 'lucide-react';
import { uploadDirect } from '../lib/api/media.api';
import { colors } from '@/lib/styles';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX = 8;

export interface MultiImageItem {
  /** Уже загруженный image (есть mediaId). Для новых файлов — после upload. */
  mediaId: string;
  /** Preview URL — objectURL для свежих или url из storage для существующих. */
  previewUrl: string;
}

export interface MultiImageUploaderProps {
  value: MultiImageItem[];
  onChange: (next: MultiImageItem[]) => void;
  maxFiles?: number;
}

function describeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return 'Сессия истекла';
    if (status === 413) return 'Файл слишком большой';
    if (status === 415) return 'Формат не поддерживается';
    if (status === 503) return 'Хранилище недоступно';
    if (status && status >= 500) return `Ошибка сервера ${status}`;
    return `Ошибка ${status ?? '?'}`;
  }
  return 'Не удалось загрузить';
}

export function MultiImageUploader({
  value,
  onChange,
  maxFiles = DEFAULT_MAX,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      setError(`Максимум ${maxFiles} фото`);
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);

    setError(null);
    setUploading(true);
    try {
      const uploaded: MultiImageItem[] = [];
      for (const file of toUpload) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError('Только JPG/PNG/WebP');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`Файл «${file.name}» больше 10 MB`);
          continue;
        }
        const mediaId = await uploadDirect(file, 'PRODUCT_PHOTO');
        const previewUrl = URL.createObjectURL(file);
        uploaded.push({ mediaId, previewUrl });
      }
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
    } catch (err) {
      setError(describeError(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeAt(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  }

  function makePrimary(idx: number) {
    if (idx === 0) return;
    const next = [...value];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOverItem(e: React.DragEvent, idx: number) {
    e.preventDefault();
    setDragOverIdx(idx);
  }
  function onDropItem(e: React.DragEvent, dropIdx: number) {
    e.preventDefault();
    setDragOverIdx(null);
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(fromIdx) || fromIdx === dropIdx) return;
    const next = [...value];
    const [item] = next.splice(fromIdx, 1);
    next.splice(dropIdx, 0, item);
    onChange(next);
  }

  const canAddMore = value.length < maxFiles;

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {value.map((item, idx) => (
          <div
            key={item.mediaId}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOverItem(e, idx)}
            onDrop={(e) => onDropItem(e, idx)}
            onDragLeave={() => setDragOverIdx(null)}
            className="relative aspect-square rounded-lg overflow-hidden cursor-move"
            style={{
              border: `2px solid ${dragOverIdx === idx ? colors.accent : colors.border}`,
              background: colors.surfaceMuted,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt={`Фото ${idx + 1}`}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <div
                className="absolute top-1 left-1 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Star size={10} />
                Главное
              </div>
            )}
            {idx !== 0 && (
              <button
                type="button"
                onClick={() => makePrimary(idx)}
                className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                aria-label="Сделать главным"
                title="Сделать главным"
              >
                <Star size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
              aria-label="Удалить фото"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg flex flex-col items-center justify-center gap-1 transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              background: colors.surfaceMuted,
              border: `2px dashed ${colors.border}`,
              color: colors.textMuted,
            }}
            aria-label="Добавить фото"
          >
            <Camera size={20} />
            <span className="text-[10px] font-semibold">
              {uploading ? 'Загрузка…' : '+ Добавить'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
      />

      {error && (
        <p className="mt-2 text-xs" style={{ color: colors.danger }}>
          {error}
        </p>
      )}
      <p className="mt-2 text-xs" style={{ color: colors.textDim }}>
        До {maxFiles} фото · Первое — главное (видно в каталоге) · Перетащи чтобы поменять порядок
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify `uploadDirect` exists и принимает purpose**

```bash
grep -n "export.*uploadDirect\|MediaPurpose\|PRODUCT_PHOTO" apps/web-seller/src/lib/api/media.api.ts
```

Expected: `uploadDirect(file: File, purpose: MediaPurpose): Promise<string>` где `string` это `mediaId`. Если signature другой — адаптировать handleFiles.

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/components/multi-image-uploader.tsx
git commit -m "feat(web-seller): MultiImageUploader (≤8 фото + drag-reorder + primary)"
```

---

### Task 4: `<ProductAttributesSection />` component

**File:** Create `apps/web-seller/src/components/product-attributes-section.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client';

import { Plus, X } from 'lucide-react';
import { colors, inputStyle as inputBase } from '@/lib/styles';

const inputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderRadius: '0.5rem',
};

export interface AttributeItem {
  /** undefined для новых (ещё не отправленных на сервер), id для существующих. */
  id?: string;
  name: string;
  value: string;
}

export interface ProductAttributesSectionProps {
  value: AttributeItem[];
  onChange: (next: AttributeItem[]) => void;
}

export function ProductAttributesSection({
  value,
  onChange,
}: ProductAttributesSectionProps) {
  function update(idx: number, field: 'name' | 'value', v: string) {
    const next = value.map((a, i) => (i === idx ? { ...a, [field]: v } : a));
    onChange(next);
  }
  function add() {
    onChange([...value, { name: '', value: '' }]);
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && (
        <p className="text-xs" style={{ color: colors.textDim }}>
          Добавьте характеристики (Гарантия, Производитель, Материал…)
        </p>
      )}
      {value.map((attr, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Название (Гарантия)"
            value={attr.name}
            onChange={(e) => update(idx, 'name', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <input
            type="text"
            placeholder="Значение (12 месяцев)"
            value={attr.value}
            onChange={(e) => update(idx, 'value', e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => remove(idx)}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              background: colors.surfaceMuted,
              border: `1px solid ${colors.border}`,
              color: colors.danger,
            }}
            aria-label="Удалить характеристику"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: colors.accentMuted,
          color: colors.accent,
          border: `1px solid ${colors.accentBorder}`,
        }}
      >
        <Plus size={12} />
        Добавить характеристику
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/components/product-attributes-section.tsx
git commit -m "feat(web-seller): ProductAttributesSection — free-form key/value pairs"
```

---

### Task 5: Wire MultiImageUploader + ProductAttributesSection in CreateProductPage

**File:** Modify `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`

- [ ] **Step 1: Read current CreateProductPage**

```bash
cat "apps/web-seller/src/app/(dashboard)/products/create/page.tsx" | head -100
```

Идентифицировать:
- Где сейчас вызывается `ImageUploader` (single) — заменить на `MultiImageUploader`
- Где `createProduct.mutateAsync` — после ответа добавить parallel POSTs для images + attributes

- [ ] **Step 2: Replace ImageUploader → MultiImageUploader**

Найти `<ImageUploader ... />` в JSX и заменить на:

```tsx
<MultiImageUploader
  value={images}
  onChange={setImages}
  maxFiles={8}
/>
```

Удалить из импортов `ImageUploader` (если не используется в другом месте этого файла), добавить:

```tsx
import { MultiImageUploader, type MultiImageItem } from '@/components/multi-image-uploader';
```

Заменить state:

```tsx
// Было: const [mediaId, setMediaId] = useState<string | null>(null);
// Стало:
const [images, setImages] = useState<MultiImageItem[]>([]);
```

- [ ] **Step 3: Add attributes state + section**

В начало компонента (рядом с другими useState):

```tsx
import { ProductAttributesSection, type AttributeItem } from '@/components/product-attributes-section';
// ...
const [attributes, setAttributes] = useState<AttributeItem[]>([]);
```

В JSX, после characteristics section (или перед submit button):

```tsx
<div className="flex flex-col gap-2">
  <label className="text-xs font-semibold" style={{ color: colors.textMuted }}>
    Характеристики
  </label>
  <ProductAttributesSection value={attributes} onChange={setAttributes} />
</div>
```

- [ ] **Step 4: Update submit handler**

Найти `const product = await createProduct.mutateAsync({...})`. После неё добавить:

```tsx
const productId = product.id;

// Batch parallel: photos + attributes
const photoPromises = images.map((img, idx) =>
  addProductImage(productId, {
    mediaId: img.mediaId,
    isPrimary: idx === 0,
    sortOrder: idx,
  }).catch((err) => {
    console.error(`Image ${idx} failed`, err);
    return null;
  }),
);

const validAttrs = attributes.filter((a) => a.name.trim() && a.value.trim());
const attrPromises = validAttrs.map((a, idx) =>
  createProductAttribute(productId, {
    name: a.name.trim(),
    value: a.value.trim(),
    sortOrder: idx,
  }).catch((err) => {
    console.error(`Attribute ${a.name} failed`, err);
    return null;
  }),
);

await Promise.all([...photoPromises, ...attrPromises]);
```

Добавить импорты:

```tsx
import { addProductImage, createProductAttribute } from '@/lib/api/products.api';
```

- [ ] **Step 5: Remove `mediaId` field from createProduct payload (если есть)**

Если `createProduct.mutateAsync({ ... mediaId: ..., ... })` — убрать `mediaId` (теперь идёт отдельным POST после product create). Если backend `POST /seller/products` уже не принимал mediaId — этот шаг no-op.

- [ ] **Step 6: Commit**

```bash
git add "apps/web-seller/src/app/(dashboard)/products/create/page.tsx"
git commit -m "feat(web-seller): CreateProduct — multi-photo + free-form attributes

После createProduct.mutateAsync — parallel POST на /images (с isPrimary
для первого) и /attributes (только non-empty pairs)."
```

---

### Task 6: Wire MultiImageUploader + ProductAttributesSection in EditProductPage

**File:** Modify `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Replace single ImageUploader → MultiImageUploader**

Найти `<ImageUploader ... />` в JSX (line ~253). Заменить на:

```tsx
<MultiImageUploader
  value={imageItems}
  onChange={handleImagesChange}
  maxFiles={8}
/>
```

Импорт `MultiImageUploader` + `MultiImageItem`.

- [ ] **Step 2: Initialize imageItems from product.images**

После того как product загружен (useSellerProduct):

```tsx
const [imageItems, setImageItems] = useState<MultiImageItem[]>([]);
const [originalImages, setOriginalImages] = useState<{ id: string; mediaId: string }[]>([]);

useEffect(() => {
  if (!product) return;
  const items: MultiImageItem[] = (product.images ?? []).map((img) => ({
    mediaId: img.mediaId ?? img.id,  // Зависит от shape — verify через тип
    previewUrl: img.url,
  }));
  setImageItems(items);
  setOriginalImages((product.images ?? []).map((i) => ({ id: i.id, mediaId: i.mediaId ?? i.id })));
}, [product]);
```

**Pre-check:** Узнать shape `Product.images[]` в `packages/types`:

```bash
grep -A 5 "interface ProductImage\|images:.*ProductImage" packages/types/src/api/products.ts
```

Адаптировать field-маппинг в map() под фактическую структуру.

- [ ] **Step 3: handleImagesChange — diff и API calls**

```tsx
async function handleImagesChange(next: MultiImageItem[]) {
  setImageItems(next);

  // Сравниваем со старым состоянием для нового state vs prev imageItems:
  // Используем functional update; но проще — посчитать diff через mediaId set.
  const prevMediaIds = new Set(imageItems.map((i) => i.mediaId));
  const nextMediaIds = new Set(next.map((i) => i.mediaId));

  // Added (есть в next, нет в prev):
  const added = next.filter((i) => !prevMediaIds.has(i.mediaId));
  // Removed (есть в prev, нет в next):
  const removed = imageItems.filter((i) => !nextMediaIds.has(i.mediaId));

  // Перенесённые/reorder — обрабатываем через sortOrder PATCH (если supported)
  // или игнорируем reorder локально (только визуально).

  for (const item of added) {
    try {
      await addProductImage(product!.id, {
        mediaId: item.mediaId,
        isPrimary: next.indexOf(item) === 0,
        sortOrder: next.indexOf(item),
      });
    } catch (err) {
      console.error('add image failed', err);
    }
  }

  for (const item of removed) {
    const orig = originalImages.find((o) => o.mediaId === item.mediaId);
    if (!orig) continue;
    try {
      await deleteProductImage(product!.id, orig.id);
    } catch (err) {
      console.error('delete image failed', err);
    }
  }

  // Refresh product detail to get authoritative images list
  queryClient.invalidateQueries({ queryKey: productKeys.detail(product!.id) });
}
```

Импорт `useQueryClient`, `productKeys`, `addProductImage`, `deleteProductImage`.

- [ ] **Step 4: Add attributes section**

После variants section добавить:

```tsx
<div className="flex flex-col gap-3">
  <h2 className="text-lg font-bold" style={{ color: colors.textPrimary }}>
    Характеристики
  </h2>
  <ProductAttributesSection
    value={attributeItems}
    onChange={handleAttributesChange}
  />
</div>
```

State:

```tsx
const [attributeItems, setAttributeItems] = useState<AttributeItem[]>([]);
useEffect(() => {
  if (!product) return;
  setAttributeItems(
    (product.attributes ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      value: a.value,
    })),
  );
}, [product]);
```

Diff handler:

```tsx
async function handleAttributesChange(next: AttributeItem[]) {
  setAttributeItems(next);

  const prevIds = new Set(attributeItems.filter((a) => a.id).map((a) => a.id!));
  const nextIds = new Set(next.filter((a) => a.id).map((a) => a.id!));

  // Removed (был с id, теперь нет):
  const removed = Array.from(prevIds).filter((id) => !nextIds.has(id));
  for (const attrId of removed) {
    try { await deleteProductAttribute(product!.id, attrId); }
    catch (err) { console.error('delete attribute failed', err); }
  }

  // Added (нет id, есть name+value):
  const added = next.filter((a) => !a.id && a.name.trim() && a.value.trim());
  for (const attr of added) {
    try {
      await createProductAttribute(product!.id, {
        name: attr.name.trim(),
        value: attr.value.trim(),
      });
    } catch (err) { console.error('create attribute failed', err); }
  }

  queryClient.invalidateQueries({ queryKey: productKeys.detail(product!.id) });
}
```

- [ ] **Step 5: Commit**

```bash
git add "apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx"
git commit -m "feat(web-seller): EditProduct — multi-photo + attributes sync

Diff против previous state, parallel POST/DELETE на /images и /attributes."
```

---

### Task 7: Push Phase 1 → деплой

- [ ] **Step 1: Push**

```bash
git push origin web-seller
```

- [ ] **Step 2: Wait ~3 min Railway deploy**

- [ ] **Step 3: Smoke-test instructions для Azim**

Открыть `seller.savdo.uz/products/create`:
- Загрузить 3 фото подряд → видны все 3, первое с `★ Главное` badge
- Drag второе на первое место → меняются ролями (первое становится «Главное»)
- Удалить третье через × → остаётся 2
- Заполнить title/price/category
- Добавить 2 характеристики (Гарантия / 12 мес, Бренд / Apple)
- Submit → товар создан, в /products видна карточка с первым фото
- Открыть товар через `/products/[id]/edit` → видны 2 фото + 2 характеристики

---

## Phase 2: Dynamic filters + Variants matrix

### Task 8: Storefront API — `getCategoryFilters`

**File:** `apps/web-seller/src/lib/api/storefront.api.ts` (create if missing) or extend seller.api.ts

- [ ] **Step 1: Check if file exists, decide path**

```bash
ls apps/web-seller/src/lib/api/storefront.api.ts 2>/dev/null && echo exists || echo missing
```

If missing — create:

```ts
import { apiClient } from './client';

export interface StorefrontCategoryFilter {
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'select' | 'number' | 'text' | 'boolean' | 'multi_select' | 'color' | string;
  options: string[] | null;
  unit: string | null;
  sortOrder: number;
  isRequired?: boolean;
}

export async function getCategoryFilters(
  slug: string,
): Promise<StorefrontCategoryFilter[]> {
  const res = await apiClient.get<StorefrontCategoryFilter[]>(
    `/storefront/categories/${slug}/filters`,
  );
  return res.data;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/lib/api/storefront.api.ts
git commit -m "feat(web-seller): getCategoryFilters API helper"
```

---

### Task 9: `useCategoryFilters` hook

**File:** Create `apps/web-seller/src/hooks/use-category-filters.ts`

- [ ] **Step 1: Create hook**

```ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategoryFilters } from '../lib/api/storefront.api';

export function useCategoryFilters(slug: string | null) {
  return useQuery({
    queryKey: ['storefront', 'category-filters', slug],
    queryFn: () => getCategoryFilters(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/hooks/use-category-filters.ts
git commit -m "feat(web-seller): useCategoryFilters hook (cached 10min)"
```

---

### Task 10: `<CategoryFiltersSection />` (non-multi_select filters)

**File:** Create `apps/web-seller/src/components/category-filters-section.tsx`

- [ ] **Step 1: Create component**

```tsx
'use client';

import { colors, inputStyle as inputBase } from '@/lib/styles';
import type { StorefrontCategoryFilter } from '../lib/api/storefront.api';

const inputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.5rem 0.75rem',
  fontSize: '0.8125rem',
  borderRadius: '0.5rem',
};

export type FilterValue = string | number | boolean;

export interface CategoryFiltersSectionProps {
  filters: StorefrontCategoryFilter[];
  values: Record<string, FilterValue>;
  onChange: (next: Record<string, FilterValue>) => void;
}

export function CategoryFiltersSection({
  filters,
  values,
  onChange,
}: CategoryFiltersSectionProps) {
  // Filter out multi_select — those handled by VariantsMatrixBuilder
  const simpleFilters = filters.filter((f) => f.fieldType !== 'multi_select');

  if (simpleFilters.length === 0) return null;

  function setField(key: string, value: FilterValue) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="flex flex-col gap-3">
      {simpleFilters.map((f) => (
        <div key={f.key}>
          <label
            className="block text-xs font-semibold mb-1.5"
            style={{ color: colors.textMuted }}
          >
            {f.nameRu}
            {f.isRequired && <span style={{ color: colors.danger }}> *</span>}
            {f.unit && (
              <span className="ml-1" style={{ color: colors.textDim }}>
                ({f.unit})
              </span>
            )}
          </label>

          {f.fieldType === 'text' && (
            <input
              type="text"
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={inputStyle}
            />
          )}
          {f.fieldType === 'number' && (
            <input
              type="number"
              value={(values[f.key] as number | undefined) ?? ''}
              onChange={(e) => setField(f.key, Number(e.target.value) || 0)}
              style={inputStyle}
            />
          )}
          {f.fieldType === 'select' && f.options && (
            <select
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              style={inputStyle}
            >
              <option value="">— Выберите —</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {f.fieldType === 'boolean' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!values[f.key]}
                onChange={(e) => setField(f.key, e.target.checked)}
              />
              <span style={{ color: colors.textPrimary }}>{f.nameRu}</span>
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/components/category-filters-section.tsx
git commit -m "feat(web-seller): CategoryFiltersSection (text/number/select/boolean)"
```

---

### Task 11: `<VariantsMatrixBuilder />` (multi_select → matrix)

**File:** Create `apps/web-seller/src/components/variants-matrix-builder.tsx`

- [ ] **Step 1: Create component (substantial — ~250 LOC)**

```tsx
'use client';

import { useMemo } from 'react';
import { colors, inputStyle as inputBase } from '@/lib/styles';
import type { StorefrontCategoryFilter } from '../lib/api/storefront.api';

const inputStyle: React.CSSProperties = {
  ...inputBase,
  width: '100%',
  padding: '0.4rem 0.6rem',
  fontSize: '0.8125rem',
  borderRadius: '0.375rem',
};

export interface VariantCell {
  stockQuantity: number;
  priceOverride?: number;
}

export interface VariantsMatrixBuilderProps {
  filters: StorefrontCategoryFilter[];
  selection: Record<string, string[]>;          // filterKey → selected values
  onChangeSelection: (next: Record<string, string[]>) => void;
  variants: Record<string, VariantCell>;        // composite label → cell
  onChangeVariants: (next: Record<string, VariantCell>) => void;
}

const multiSelectOf = (filters: StorefrontCategoryFilter[]) =>
  filters.filter((f) => f.fieldType === 'multi_select');

function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>(
    (acc, arr) => acc.flatMap((tup) => arr.map((item) => [...tup, item])),
    [[]],
  );
}

export function VariantsMatrixBuilder({
  filters,
  selection,
  onChangeSelection,
  variants,
  onChangeVariants,
}: VariantsMatrixBuilderProps) {
  const multiFilters = useMemo(() => multiSelectOf(filters), [filters]);
  if (multiFilters.length === 0) return null;

  const labels = useMemo(() => {
    const arrays = multiFilters.map((f) => selection[f.key] ?? []);
    if (arrays.some((a) => a.length === 0)) return [];
    const combos = cartesian(arrays);
    return combos.map((tuple) => tuple.join(' / '));
  }, [multiFilters, selection]);

  function toggleValue(filterKey: string, val: string) {
    const current = selection[filterKey] ?? [];
    const next = current.includes(val)
      ? current.filter((v) => v !== val)
      : [...current, val];
    onChangeSelection({ ...selection, [filterKey]: next });
  }

  function setVariantField(label: string, field: keyof VariantCell, value: number) {
    const prev = variants[label] ?? { stockQuantity: 0 };
    onChangeVariants({ ...variants, [label]: { ...prev, [field]: value } });
  }

  return (
    <div className="flex flex-col gap-4">
      {multiFilters.map((f) => (
        <div key={f.key}>
          <label
            className="block text-xs font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            {f.nameRu}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(f.options ?? []).map((opt) => {
              const selected = (selection[f.key] ?? []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleValue(f.key, opt)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: selected ? colors.accent : colors.surface,
                    color: selected ? colors.accentTextOnBg : colors.textBody ?? colors.textPrimary,
                    border: `1px solid ${selected ? colors.accent : colors.border}`,
                  }}
                  aria-pressed={selected}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {labels.length > 0 && (
        <div>
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: colors.textMuted }}
          >
            Варианты ({labels.length})
          </p>
          <div className="flex flex-col gap-2">
            {labels.map((label) => {
              const cell = variants[label] ?? { stockQuantity: 0 };
              return (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="flex-1 text-sm font-medium px-3 py-2 rounded-md"
                    style={{
                      background: colors.surfaceMuted,
                      color: colors.textPrimary,
                    }}
                  >
                    {label}
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      placeholder="Склад"
                      value={cell.stockQuantity || ''}
                      onChange={(e) =>
                        setVariantField(label, 'stockQuantity', Number(e.target.value) || 0)
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      min={0}
                      placeholder="Цена опц."
                      value={cell.priceOverride ?? ''}
                      onChange={(e) =>
                        setVariantField(label, 'priceOverride', Number(e.target.value) || 0)
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/components/variants-matrix-builder.tsx
git commit -m "feat(web-seller): VariantsMatrixBuilder (multi_select → matrix)"
```

---

### Task 12: Wire dynamic filters + matrix into CreateProductPage

**File:** Modify `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`

- [ ] **Step 1: Add state**

```tsx
import { useCategoryFilters } from '@/hooks/use-category-filters';
import { CategoryFiltersSection, type FilterValue } from '@/components/category-filters-section';
import { VariantsMatrixBuilder, type VariantCell } from '@/components/variants-matrix-builder';

// state:
const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
const [variantSelection, setVariantSelection] = useState<Record<string, string[]>>({});
const [variantCells, setVariantCells] = useState<Record<string, VariantCell>>({});
```

- [ ] **Step 2: Wire useCategoryFilters from selected category**

Найти где seller выбирает категорию — получить её slug:

```tsx
// Слепок: useGlobalCategories возвращает массив { id, slug, nameRu, ... }
const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
const filtersQuery = useCategoryFilters(selectedCategory?.slug ?? null);
const filters = filtersQuery.data ?? [];
```

- [ ] **Step 3: Render sections after category select**

```tsx
{selectedCategory && filters.length > 0 && (
  <>
    <div>
      <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>
        Характеристики категории
      </h3>
      <CategoryFiltersSection
        filters={filters}
        values={filterValues}
        onChange={setFilterValues}
      />
    </div>

    <div>
      <h3 className="text-sm font-bold mb-2" style={{ color: colors.textPrimary }}>
        Варианты товара
      </h3>
      <VariantsMatrixBuilder
        filters={filters}
        selection={variantSelection}
        onChangeSelection={setVariantSelection}
        variants={variantCells}
        onChangeVariants={setVariantCells}
      />
    </div>
  </>
)}
```

- [ ] **Step 4: Submit — POST filter values как attributes + POST option-groups + variants**

После `createProduct.mutateAsync(...)`:

```tsx
const productId = product.id;

// Filter values → attributes
const filterAttrs = Object.entries(filterValues)
  .filter(([, v]) => v !== '' && v !== false && v !== null && v !== undefined)
  .map(([key, value], idx) => {
    const filter = filters.find((f) => f.key === key);
    return {
      name: filter?.nameRu ?? key,
      value: String(value),
      sortOrder: idx,
    };
  });

await Promise.all([
  ...photoPromises,    // из Phase 1
  ...filterAttrs.map((a) => createProductAttribute(productId, a).catch(() => null)),
  ...validAttrs.map((a, i) => createProductAttribute(productId, { ...a, sortOrder: 100 + i }).catch(() => null)),
]);

// Option groups + variants matrix
const multiFilters = filters.filter((f) => f.fieldType === 'multi_select');
const groupIdByKey: Record<string, { groupId: string; valueIdMap: Record<string, string> }> = {};

for (let i = 0; i < multiFilters.length; i++) {
  const f = multiFilters[i];
  const selected = variantSelection[f.key] ?? [];
  if (selected.length === 0) continue;

  const group = await createOptionGroup(productId, {
    name: f.nameRu,
    code: f.key,
    sortOrder: i,
  });

  const valueIdMap: Record<string, string> = {};
  for (let j = 0; j < selected.length; j++) {
    const val = selected[j];
    const created = await createOptionValue(productId, group.id, {
      value: val,
      sortOrder: j,
    });
    valueIdMap[val] = created.id;
  }
  groupIdByKey[f.key] = { groupId: group.id, valueIdMap };
}

// Создаём varianты
for (const [label, cell] of Object.entries(variantCells)) {
  // label is "S / красный" — нужно разбить и найти optionValueIds
  const parts = label.split(' / ');
  const optionValueIds: string[] = [];
  let i = 0;
  for (const f of multiFilters) {
    const val = parts[i++];
    const map = groupIdByKey[f.key]?.valueIdMap ?? {};
    if (map[val]) optionValueIds.push(map[val]);
  }
  if (optionValueIds.length === 0) continue;

  await createVariant(productId, {
    optionValueIds,
    stockQuantity: cell.stockQuantity,
    priceOverride: cell.priceOverride ?? null,
  }).catch(() => null);
}
```

Импорты:
```tsx
import { createOptionGroup, createOptionValue } from '@/lib/api/product-options.api';
import { createVariant } from '@/lib/api/products.api';
```

- [ ] **Step 5: Verify createOptionGroup signature**

```bash
grep -n "createOptionGroup\|createOptionValue" apps/web-seller/src/lib/api/product-options.api.ts
```

Адаптировать field-names под фактический API helper.

- [ ] **Step 6: Commit**

```bash
git add "apps/web-seller/src/app/(dashboard)/products/create/page.tsx"
git commit -m "feat(web-seller): CreateProduct — category filters + variants matrix

После category select подгружаются её filters. Non-multi_select → attribute
сохранения. Multi_select → bulk create option-groups + values + variants matrix."
```

---

### Task 13: Push Phase 2 → деплой

- [ ] **Step 1: Push + smoke**

```bash
git push origin web-seller
```

Smoke (для Azim):
- Выбрать категорию которая имеет фильтры (например, «Обувь» с фильтрами `Размер`, `Цвет`, `Материал`)
- Заполнить характеристики (текст/select/number/bool)
- Выбрать multi_select значения (Размер: S, M, L; Цвет: красный, синий) → видна матрица 6 вариантов
- Заполнить stock для каждого
- Submit → товар + все 6 вариантов созданы (видны в `/products/[id]/edit`)

---

## Phase 3: Per-variant stock editor

### Task 14: Inline stock editor in `ProductVariantsSection`

**File:** Modify `apps/web-seller/src/components/product-variants-section.tsx`

- [ ] **Step 1: Add inline stock input on each existing variant row**

Найти место рендера variant row (там где сейчас отображается `склад: {v.stockQuantity}`):

```tsx
// Было:
<span>склад: {v.stockQuantity}</span>

// Стало:
<InlineStockEditor
  variantId={v.id}
  productId={productId}
  current={Number(v.stockQuantity)}
/>
```

- [ ] **Step 2: Create InlineStockEditor (внутри того же файла или отдельно)**

```tsx
function InlineStockEditor({
  variantId,
  productId,
  current,
}: {
  variantId: string;
  productId: string;
  current: number;
}) {
  const [draft, setDraft] = useState(String(current));
  const adjustStock = useAdjustStock();
  const dirty = Number(draft) !== current;

  async function save() {
    const delta = Number(draft) - current;
    if (delta === 0) return;
    await adjustStock.mutateAsync({
      productId,
      variantId,
      delta,
      reason: 'manual',
    });
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-16 px-2 py-1 text-xs"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.25rem',
          color: colors.textPrimary,
        }}
      />
      {dirty && (
        <button
          type="button"
          onClick={save}
          disabled={adjustStock.isPending}
          className="px-2 py-1 rounded text-[10px] font-bold disabled:opacity-60"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          {adjustStock.isPending ? '…' : '✓'}
        </button>
      )}
    </div>
  );
}
```

Импорт `useAdjustStock` (уже есть в use-products.ts).

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/components/product-variants-section.tsx
git commit -m "feat(web-seller): inline per-variant stock editor

Каждый variant имеет input + ✓ кнопку для сохранения нового stock через adjustStock."
```

---

### Task 15: Push Phase 3 + update analiz

- [ ] **Step 1: Push**

```bash
git push origin web-seller
```

- [ ] **Step 2: Update analiz/done.md и tasks.md (на main)**

```bash
git checkout main && git pull origin main --rebase
```

В `analiz/done.md` добавить:

```markdown
### ✅ [WEB-SELLER-PRODUCT-PARITY-001] Multi-photo + attributes + filters + variants matrix + stock editor
- **Важность:** 🟠 P1
- **Дата:** 13.05.2026 (3 фазы за день)
- **Ветка:** web-seller
- **Файлы:**
  - components/multi-image-uploader.tsx (NEW)
  - components/product-attributes-section.tsx (NEW)
  - components/category-filters-section.tsx (NEW)
  - components/variants-matrix-builder.tsx (NEW)
  - components/product-variants-section.tsx (EDIT — inline stock editor)
  - app/(dashboard)/products/create/page.tsx (EDIT)
  - app/(dashboard)/products/[id]/edit/page.tsx (EDIT)
  - lib/api/products.api.ts (EDIT — image + attribute helpers)
  - lib/api/storefront.api.ts (NEW — getCategoryFilters)
  - hooks/use-category-filters.ts (NEW)
- **Что сделано:** функциональный паритет web-seller create/edit-product с TMA (без визуального копирования). Multi-photo (≤8 + drag-reorder + primary), free-form attributes, dynamic category filters + variants matrix из multi_select, inline per-variant stock editor.
```

В `analiz/tasks.md` добавить под Marketing:

```markdown
- [x] **`WEB-SELLER-PRODUCT-PARITY-001`** ✅ 13.05.2026 — функциональный паритет с TMA. См. done.md.
```

И если есть gaps от Task 1 (например, отсутствует PATCH images endpoint):

```markdown
- [ ] **`API-PRODUCT-IMAGES-PATCH-001`** 🟢 P3 (Полат) — `PATCH /seller/products/:id/images/:imageId` для reorder/primary без delete-recreate.
```

- [ ] **Step 3: Commit + push main**

```bash
git add analiz/done.md analiz/tasks.md
git commit -m "docs(analiz): WEB-SELLER-PRODUCT-PARITY-001 закрыт (3 фазы)"
git push origin main
```

---

## Self-Review

**1. Spec coverage:**
- §3.2 Phase 1 (multi-photo + attributes) — Tasks 2-7 ✓
- §3.3 Phase 2 (filters + matrix) — Tasks 8-13 ✓
- §3.4 Phase 3 (stock editor) — Tasks 14-15 ✓
- §6 Risks (PATCH endpoint) — Task 1 Step 3 verifies ✓

**2. Placeholder scan:**
- ❌ Found: Task 5 Step 1 says "Read current CreateProductPage" without showing what to change exactly. Acceptable — need to see actual file first.
- ❌ Task 6 Step 2 has fallback `img.mediaId ?? img.id` — uncertainty about exact field. Verify-step is included.
- Каждый шаг даёт код или конкретную команду.

**3. Type consistency:**
- `MultiImageItem { mediaId, previewUrl }` — used in Task 3, 5, 6 — consistent
- `AttributeItem { id?, name, value }` — Task 4, 5, 6 — consistent
- `FilterValue = string | number | boolean` — Task 10, 12 — consistent
- `VariantCell { stockQuantity, priceOverride? }` — Task 11, 12 — consistent

**4. Branch strategy:**
- Все фазы на ветке `web-seller`
- Push после каждой фазы (после Task 7, 13, 15) для инкрементального деплоя
- Task 15 закрывается на main с обновлением analiz/

**5. Risks addressed:**
- PATCH images endpoint — verify в Task 1, fallback зафиксирован в Task 6 (delete+recreate)
- Type shape product.images — verify в Task 6 Step 2
- createOptionGroup signature — verify в Task 12 Step 5
- uploadDirect signature — verify в Task 3 Step 2

---

## Execution Notes

- Phase 1 (Tasks 2-7) → push → smoke. ~3-4 часа работы.
- Phase 2 (Tasks 8-13) → push → smoke. ~4-5 часов работы.
- Phase 3 (Tasks 14-15) → push → smoke. ~1 час.

Между фазами можно делать паузу — каждая шипит работающий incremental progress.
