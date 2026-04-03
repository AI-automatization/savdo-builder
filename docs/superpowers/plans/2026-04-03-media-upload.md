# Media Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add image upload to product create/edit forms and store settings (logo + cover) using presigned R2 upload flow.

**Architecture:** Shared `ImageUploader` component handles the full upload flow (get presigned URL → PUT to R2 via XHR for progress → confirm). Parent forms manage the resulting `mediaId` in their own state and include it in API calls. Two new files (API layer + component), four modified files.

**Tech Stack:** Next.js 16, React, TypeScript, XHR (for upload progress), existing `apiClient` (axios), Tailwind + inline glass styles.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web-seller/src/lib/api/media.api.ts` | `getUploadUrl`, `confirmUpload` |
| Create | `apps/web-seller/src/components/image-uploader.tsx` | Reusable click-to-upload component |
| Modify | `apps/web-seller/src/lib/api/products.api.ts` | Add `mediaId?: string` to create/update |
| Modify | `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` | Add ImageUploader, pass mediaId |
| Modify | `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` | Add ImageUploader with previewUrl |
| Modify | `apps/web-seller/src/app/(dashboard)/settings/page.tsx` | Add logo + cover uploaders |

---

## Task 1: Media API layer

**Files:**
- Create: `apps/web-seller/src/lib/api/media.api.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web-seller/src/lib/api/media.api.ts
import { apiClient } from './client';

export type MediaPurpose = 'product_image' | 'store_logo' | 'store_banner';

export interface UploadUrlResponse {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface ConfirmedMedia {
  id: string;
  url: string;
  mimeType: string;
  purpose: MediaPurpose;
  status: 'CONFIRMED';
  confirmedAt: string;
}

export async function getUploadUrl(
  mimeType: string,
  purpose: MediaPurpose,
  sizeBytes: number,
): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<UploadUrlResponse>('/media/upload-url', {
    mimeType,
    purpose,
    sizeBytes,
  });
  return data;
}

export async function confirmUpload(mediaId: string): Promise<ConfirmedMedia> {
  const { data } = await apiClient.post<ConfirmedMedia>(`/media/${mediaId}/confirm`);
  return data;
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/marti/Desktop/savdo
git add apps/web-seller/src/lib/api/media.api.ts
git commit -m "feat(web-seller): media API layer (upload-url + confirm)"
```

---

## Task 2: ImageUploader component

**Files:**
- Create: `apps/web-seller/src/components/image-uploader.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/web-seller/src/components/image-uploader.tsx
'use client';

import { useRef, useState } from 'react';
import { getUploadUrl, confirmUpload } from '../lib/api/media.api';
import type { MediaPurpose } from '../lib/api/media.api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ImageUploaderProps {
  value: string | null;
  onChange: (mediaId: string | null) => void;
  purpose: MediaPurpose;
  previewUrl?: string | null;
  aspectRatio?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ImageUploader({
  value,
  onChange,
  purpose,
  previewUrl,
  aspectRatio = '1',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview ?? previewUrl ?? null;
  const hasImage = value !== null || displayUrl !== null;

  async function handleFile(file: File) {
    setError(null);

    // Validate
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Формат не поддерживается. Используйте JPG, PNG или WebP.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Файл слишком большой. Максимум 10 МБ.');
      return;
    }

    try {
      setProgress(0);

      // 1. Get presigned URL
      const { mediaId, uploadUrl } = await getUploadUrl(file.type, purpose, file.size);

      // 2. Upload to R2
      await uploadWithProgress(uploadUrl, file, setProgress);

      // 3. Confirm
      await confirmUpload(mediaId);

      // 4. Set local preview + notify parent
      setLocalPreview(URL.createObjectURL(file));
      setProgress(null);
      onChange(mediaId);
    } catch {
      setProgress(null);
      setError('Не удалось загрузить фото. Попробуйте снова.');
    }
  }

  function handleRemove(e: React.MouseEvent) {
    e.stopPropagation();
    setLocalPreview(null);
    setError(null);
    onChange(null);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-selected after remove
    e.target.value = '';
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  const base: React.CSSProperties = {
    aspectRatio,
    borderRadius: 16,
    overflow: 'hidden',
    cursor: progress !== null ? 'default' : 'pointer',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div
        style={{ ...base, background: 'rgba(248,113,113,.08)', border: '2px dashed rgba(248,113,113,.50)', gap: 8, padding: 16 }}
        onClick={() => { setError(null); inputRef.current?.click(); }}
      >
        <span style={{ fontSize: 28 }}>⚠️</span>
        <span style={{ fontSize: 11, color: 'rgba(248,113,113,.85)', textAlign: 'center', lineHeight: 1.4 }}>{error}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(248,113,113,.85)', background: 'rgba(248,113,113,.12)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, padding: '4px 10px' }}>
          Попробовать снова
        </span>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
      </div>
    );
  }

  if (progress !== null) {
    return (
      <div style={{ ...base, background: 'rgba(255,255,255,.06)', border: '2px dashed rgba(167,139,250,.40)', gap: 10 }}>
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(167,139,250,.20)', borderTopColor: '#A78BFA', borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#A78BFA' }}>{progress}%</span>
        <div style={{ width: '80%', height: 4, background: 'rgba(167,139,250,.2)', borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#A78BFA', borderRadius: 2, transition: 'width .1s' }} />
        </div>
      </div>
    );
  }

  if (hasImage && displayUrl) {
    return (
      <div style={{ ...base, border: '2px solid rgba(167,139,250,.25)', background: '#1a1d2e' }} onClick={() => inputRef.current?.click()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button
          type="button"
          onClick={handleRemove}
          style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(255,255,255,.85)', cursor: 'pointer' }}
        >
          ✕
        </button>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, background: 'rgba(255,255,255,.06)', border: '2px dashed rgba(255,255,255,.18)', gap: 8 }}
      onClick={() => inputRef.current?.click()}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>Добавить<br />фото</span>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/components/image-uploader.tsx
git commit -m "feat(web-seller): ImageUploader component with R2 presigned flow"
```

---

## Task 3: Add mediaId to products API

**Files:**
- Modify: `apps/web-seller/src/lib/api/products.api.ts`

- [ ] **Step 1: Add `mediaId` to `createProduct` data type**

Find the `createProduct` function (around line 20). Add `mediaId?: string` to the data parameter:

```typescript
export async function createProduct(data: {
  title: string;
  description?: string;
  basePrice: number;
  currencyCode?: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
  isVisible?: boolean;
  sku?: string;
  mediaId?: string;
}): Promise<ProductListItem> {
  const res = await apiClient.post<ProductListItem>('/seller/products', data);
  return res.data;
}
```

- [ ] **Step 2: Add `mediaId` to `updateProduct` data type**

Find the `updateProduct` function (around line 34). Add `mediaId?: string`:

```typescript
export async function updateProduct(
  id: string,
  data: {
    title?: string;
    description?: string;
    basePrice?: number;
    isVisible?: boolean;
    sku?: string;
    globalCategoryId?: string;
    storeCategoryId?: string;
    mediaId?: string;
  },
): Promise<ProductListItem> {
  const res = await apiClient.patch<ProductListItem>(`/seller/products/${id}`, data);
  return res.data;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/lib/api/products.api.ts
git commit -m "feat(web-seller): add mediaId to product create/update API"
```

---

## Task 4: Product create form — add image uploader

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`

- [ ] **Step 1: Add import and mediaId state**

After the existing imports at the top, add:

```typescript
import { useState } from 'react';
import { ImageUploader } from '../../../../components/image-uploader';
```

Inside `CreateProductPage` component, after the `useForm` call, add:

```typescript
const [mediaId, setMediaId] = useState<string | null>(null);
```

- [ ] **Step 2: Add ImageUploader inside the form card, before the title field**

Find the `<form>` → `<div className="rounded-2xl p-6 flex flex-col gap-5" style={glass}>` block. Add the uploader as the first child (flex row wrapping uploader + title/price):

Replace the opening of the form card content:
```tsx
{/* Image + main fields row */}
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
        placeholder="Например: Кроссовки Nike Air Max"
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
          min={0}
          className={inputFocusClass}
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
          className={inputFocusClass}
          style={inputStyle}
          placeholder="SKU-001"
          {...register('sku')}
        />
      </div>
    </div>
  </div>
</div>

{/* Description — below the row */}
<div>
  <Label>Описание</Label>
  <textarea
    className={inputFocusClass}
    style={{ ...inputStyle, resize: "none", minHeight: 96 }}
    placeholder="Подробное описание товара..."
    {...register('description')}
  />
</div>
```

Note: Remove the original standalone Title, Description, and Price+SKU blocks that are now inside the new layout above. Keep only the Visible toggle and the Actions below.

- [ ] **Step 3: Pass mediaId to createProduct in onSubmit**

Update `onSubmit`:

```typescript
async function onSubmit(values: CreateProductForm) {
  const product = await create.mutateAsync({
    title:       values.title,
    description: values.description || undefined,
    basePrice:   Number(values.basePrice),
    sku:         values.sku || undefined,
    isVisible:   values.isVisible,
    mediaId:     mediaId ?? undefined,
  });
  track.productCreated(product.storeId, product.id);
  router.push('/products');
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/app/(dashboard)/products/create/page.tsx
git commit -m "feat(web-seller): image upload in product create form"
```

---

## Task 5: Product edit form — add image uploader

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Add import and mediaId state**

The file already has `import { use, useEffect } from 'react';` — update it to include `useState`:

```typescript
import { use, useEffect, useState } from 'react';
```

Then add the ImageUploader import after the existing imports:

```typescript
import { ImageUploader } from '../../../../../components/image-uploader';
```

Inside `EditProductPage`, after the `useForm` call, add:

```typescript
const [mediaId, setMediaId] = useState<string | null>(null);
```

- [ ] **Step 2: Add ImageUploader to the form**

In the form card (the `<div className="rounded-2xl p-6 flex flex-col gap-5" style={glass}>` block), add as first child:

```tsx
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
```

- [ ] **Step 3: Pass mediaId to updateProduct in onSubmit**

Update `onSubmit`:

```typescript
async function onSubmit(values: EditProductForm) {
  await update.mutateAsync({
    id,
    title:       values.title,
    description: values.description || undefined,
    basePrice:   Number(values.basePrice),
    sku:         values.sku || undefined,
    isVisible:   values.isVisible,
    mediaId:     mediaId ?? undefined,
  });
  router.push('/products');
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx
git commit -m "feat(web-seller): image upload in product edit form"
```

---

## Task 6: Settings — logo and cover uploaders

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Add import**

At the top of the file, after existing imports:

```typescript
import { ImageUploader } from '@/components/image-uploader';
```

- [ ] **Step 2: Add logoMediaId and coverMediaId to StoreFormValues**

Update the `StoreFormValues` type:

```typescript
type StoreFormValues = {
  name: string;
  description: string;
  city: string;
  region: string;
  telegramContactLink: string;
};
```

Add two `useState` hooks inside `StoreSettingsSection`, after the `useForm` call:

```typescript
const [logoMediaId, setLogoMediaId]   = useState<string | null>(null);
const [coverMediaId, setCoverMediaId] = useState<string | null>(null);
```

- [ ] **Step 3: Add uploaders to StoreSettingsSection form, before the name field**

Inside the `<Section title="Магазин">` form, add as first child before `<Field label="Название магазина"`:

```tsx
{/* Cover */}
<Field label="Обложка магазина">
  <ImageUploader
    value={coverMediaId}
    onChange={setCoverMediaId}
    purpose="store_banner"
    previewUrl={store?.coverUrl ?? null}
    aspectRatio="3/1"
  />
</Field>

{/* Logo */}
<Field label="Логотип">
  <div style={{ width: 72, height: 72 }}>
    <ImageUploader
      value={logoMediaId}
      onChange={setLogoMediaId}
      purpose="store_logo"
      previewUrl={store?.logoUrl ?? null}
    />
  </div>
</Field>
```

- [ ] **Step 4: Pass mediaIds to updateStore in onSubmit**

Update `onSubmit` in `StoreSettingsSection`:

```typescript
async function onSubmit(values: StoreFormValues) {
  await updateStore.mutateAsync({
    name:                values.name,
    description:         values.description || undefined,
    city:                values.city,
    region:              values.region || undefined,
    telegramContactLink: values.telegramContactLink || undefined,
    logoMediaId:         logoMediaId ?? undefined,
    coverMediaId:        coverMediaId ?? undefined,
  });
  setSaved(true);
  setTimeout(() => setSaved(false), 3000);
  reset(values);
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(web-seller): logo and cover upload in store settings"
```

---

## Task 7: TypeScript check + analiz

**Files:**
- Modify: `analiz/done.md`

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/web-seller && npx tsc --noEmit
```

Expected: 0 errors. If errors appear, read them and fix before continuing.

- [ ] **Step 2: Update analiz/done.md**

Add entry at top of `analiz/done.md` under a new `## 2026-04-03 (сессия 3)` section (or append to existing):

```markdown
### ✅ [WEB-032] Media upload — product photo + store logo/cover
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/media.api.ts` (новый)
  - `apps/web-seller/src/components/image-uploader.tsx` (новый)
  - `apps/web-seller/src/lib/api/products.api.ts`
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx`
- **Что сделано:** ImageUploader компонент с presigned URL флоу (XHR для progress). Фото товара в create/edit. Logo + cover в настройках магазина.
```

- [ ] **Step 3: Commit**

```bash
git add analiz/done.md
git commit -m "chore: mark WEB-032 done in analiz"
```
