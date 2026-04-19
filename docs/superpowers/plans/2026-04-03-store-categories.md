# Store Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add store category CRUD to settings page and a category selector to product create/edit forms.

**Architecture:** Three modified files, no new files. `StoreCategoriesSection` component added inline to `settings/page.tsx`. Category `<select>` added to both product forms using existing `useStoreCategories` hook (same pattern as `mediaId` state already in both forms). All hooks already exist in `use-seller.ts`.

**Tech Stack:** Next.js 16, React, TypeScript, TanStack Query, existing `use-seller` hooks, inline glass styles matching the rest of the dashboard.

---

## File Map

| Action | File | What changes |
|--------|------|--------------|
| Modify | `apps/web-seller/src/app/(dashboard)/settings/page.tsx` | Add `StoreCategoriesSection` component + render between Магазин and Профиль |
| Modify | `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` | Add category select below Description |
| Modify | `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` | Add category select, populate from `product.storeCategoryId` |

---

## Task 1: StoreCategoriesSection in settings/page.tsx

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/settings/page.tsx`

Hook signatures (already in `apps/web-seller/src/hooks/use-seller.ts`):
- `useStoreCategories()` → `{ data: StoreCategory[], isLoading }`
- `useCreateStoreCategory()` → `mutateAsync({ name: string, sortOrder?: number })`
- `useUpdateStoreCategory()` → `mutateAsync({ id: string, name?: string })`
- `useDeleteStoreCategory()` → `mutateAsync(id: string)`

`StoreCategory` type (from `packages/types/src/api/stores.ts`):
```ts
interface StoreCategory { id: string; storeId: string; name: string; sortOrder: number; }
```

- [ ] **Step 1: Add imports**

In `settings/page.tsx`, update the first import line:

```typescript
import { useEffect, useState } from 'react';
```
becomes:
```typescript
import { useEffect, useRef, useState } from 'react';
```

Add after the existing `use-seller` import:
```typescript
import type { StoreCategory } from 'types';
import {
  useStore, useUpdateStore, useSellerProfile, useUpdateSellerProfile,
  useStoreCategories, useCreateStoreCategory, useUpdateStoreCategory, useDeleteStoreCategory,
} from '@/hooks/use-seller';
```

Replace the old single import line:
```typescript
import { useStore, useUpdateStore, useSellerProfile, useUpdateSellerProfile } from '@/hooks/use-seller';
```

- [ ] **Step 2: Add StoreCategoriesSection component**

Add the full component before the `// ── Store Settings Form` comment line:

```tsx
// ── Store Categories Section ───────────────────────────────────────────────────

function StoreCategoriesSection() {
  const { data: categories = [], isLoading } = useStoreCategories();
  const create = useCreateStoreCategory();
  const update = useUpdateStoreCategory();
  const remove = useDeleteStoreCategory();

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editValue, setEditValue]   = useState('');
  const [adding, setAdding]         = useState(false);
  const [newValue, setNewValue]     = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  // ── Edit ──────────────────────────────────────────────────────────────────

  function startEdit(cat: StoreCategory) {
    setEditingId(cat.id);
    setEditValue(cat.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: string) {
    const name = editValue.trim();
    if (!name) { cancelEdit(); return; }
    await update.mutateAsync({ id, name });
    cancelEdit();
  }

  // ── Add ───────────────────────────────────────────────────────────────────

  function startAdd() {
    setAdding(true);
    setNewValue('');
    // Focus handled via useEffect below
  }

  function cancelAdd() {
    setAdding(false);
    setNewValue('');
  }

  async function saveAdd() {
    const name = newValue.trim();
    if (!name) { cancelAdd(); return; }
    await create.mutateAsync({ name, sortOrder: categories.length + 1 });
    cancelAdd();
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await remove.mutateAsync(id);
    } catch {
      setDeleteError('Нельзя удалить категорию, к которой привязаны товары.');
    }
  }

  // Focus new input when adding
  useEffect(() => {
    if (adding) newInputRef.current?.focus();
  }, [adding]);

  // ── Shared styles ─────────────────────────────────────────────────────────

  const rowInputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: '1px solid rgba(167,139,250,0.50)',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
  };

  const confirmBtn: React.CSSProperties = {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 7,
    color: '#34d399',
    background: 'rgba(52,211,153,0.12)',
    border: '1px solid rgba(52,211,153,0.20)',
    cursor: 'pointer',
  };

  const cancelBtn: React.CSSProperties = {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 7,
    color: 'rgba(255,255,255,0.40)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    cursor: 'pointer',
  };

  const rowBorder = { borderBottom: '1px solid rgba(255,255,255,0.06)' };

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-3.5 w-44 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-2">
          {[140, 100, 160].map((w, i) => (
            <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: w }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Section title="Категории магазина">
      {/* Empty state */}
      {categories.length === 0 && !adding && (
        <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Категории помогают покупателям ориентироваться в вашем магазине.
        </p>
      )}

      {/* Category list */}
      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-2 py-1.5" style={rowBorder}>
          {editingId === cat.id ? (
            <>
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  saveEdit(cat.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                style={rowInputStyle}
              />
              <button type="button" style={confirmBtn} onClick={() => saveEdit(cat.id)}>✓</button>
              <button
                type="button"
                style={cancelBtn}
                onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <span
                className="flex-1 text-sm text-white cursor-pointer transition-colors hover:text-purple-300"
                onClick={() => startEdit(cat)}
              >
                {cat.name}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={remove.isPending}
                className="text-xs transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
                style={{ color: '#f87171' }}
                aria-label="Удалить"
              >
                🗑
              </button>
            </>
          )}
        </div>
      ))}

      {/* New category row */}
      {adding && (
        <div className="flex items-center gap-2 py-1.5" style={rowBorder}>
          <input
            ref={newInputRef}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  saveAdd();
              if (e.key === 'Escape') cancelAdd();
            }}
            placeholder="Название категории"
            style={{ ...rowInputStyle, flex: 1 }}
          />
          <button type="button" style={confirmBtn} onClick={saveAdd}
            disabled={create.isPending}>
            {create.isPending ? '...' : '✓'}
          </button>
          <button
            type="button"
            style={cancelBtn}
            onMouseDown={(e) => { e.preventDefault(); cancelAdd(); }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete error */}
      {deleteError && (
        <p className="text-xs mt-1" style={{ color: 'rgba(248,113,113,.80)' }}>{deleteError}</p>
      )}

      {/* Add button */}
      {!adding && (
        <button
          type="button"
          onClick={startAdd}
          className="mt-1 text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: '#A78BFA' }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Добавить категорию
        </button>
      )}
    </Section>
  );
}
```

- [ ] **Step 3: Render StoreCategoriesSection in SettingsPage**

Find `SettingsPage` at the bottom of `settings/page.tsx`:

```tsx
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-bold text-white">Настройки</h1>
      <StoreSettingsSection />
      <ProfileSettingsSection />
    </div>
  );
}
```

Replace with:

```tsx
export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-bold text-white">Настройки</h1>
      <StoreSettingsSection />
      <StoreCategoriesSection />
      <ProfileSettingsSection />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/marti/Desktop/savdo
git add apps/web-seller/src/app/\(dashboard\)/settings/page.tsx
git commit -m "feat(web-seller): store categories CRUD in settings"
```

---

## Task 2: Category select in product create form

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/products/create/page.tsx`

- [ ] **Step 1: Add useStoreCategories import**

At the top of `create/page.tsx`, add `useStoreCategories` to the existing hooks import:

```typescript
import { useCreateProduct } from '../../../../hooks/use-products';
import { useStoreCategories } from '../../../../hooks/use-seller';
```

- [ ] **Step 2: Add storeCategoryId state and fetch categories**

Inside `CreateProductPage`, after the `const [mediaId, setMediaId]` line:

```typescript
const { data: categories = [] } = useStoreCategories();
const [storeCategoryId, setStoreCategoryId] = useState<string | null>(null);
```

- [ ] **Step 3: Pass storeCategoryId in onSubmit**

Update `onSubmit`:

```typescript
async function onSubmit(values: CreateProductForm) {
  const product = await create.mutateAsync({
    title:           values.title,
    description:     values.description || undefined,
    basePrice:       Number(values.basePrice),
    sku:             values.sku || undefined,
    isVisible:       values.isVisible,
    mediaId:         mediaId ?? undefined,
    storeCategoryId: storeCategoryId ?? undefined,
  });
  track.productCreated(product.storeId, product.id);
  router.push('/products');
}
```

- [ ] **Step 4: Add select after Description field**

In the JSX, find the Description `<div>` block (the one with `<textarea>`). Add the category select immediately after it, before the Price+SKU grid:

```tsx
{/* Category */}
{categories.length > 0 && (
  <div>
    <Label>Категория</Label>
    <select
      value={storeCategoryId ?? ''}
      onChange={(e) => setStoreCategoryId(e.target.value || null)}
      className={inputFocusClass}
      style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
    >
      <option value="" style={{ background: '#1a1d2e' }}>— Без категории —</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id} style={{ background: '#1a1d2e' }}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/app/\(dashboard\)/products/create/page.tsx
git commit -m "feat(web-seller): category select in product create form"
```

---

## Task 3: Category select in product edit form

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Add useStoreCategories import**

In `edit/page.tsx`, add `useStoreCategories` import after the existing products hook import:

```typescript
import { useSellerProduct, useUpdateProduct, useUpdateProductStatus, useDeleteProduct } from '../../../../../hooks/use-products';
import { useStoreCategories } from '../../../../../hooks/use-seller';
import { ImageUploader } from '../../../../../components/image-uploader';
```

- [ ] **Step 2: Add storeCategoryId state and fetch**

Inside `EditProductPage`, after the `const [mediaId, setMediaId]` line:

```typescript
const { data: categories = [] } = useStoreCategories();
const [storeCategoryId, setStoreCategoryId] = useState<string | null>(null);
```

- [ ] **Step 3: Populate storeCategoryId when product loads**

Inside the existing `useEffect` that populates the form, add `storeCategoryId` initialization:

```typescript
useEffect(() => {
  if (product) {
    reset({
      title:       product.title,
      description: product.description ?? '',
      basePrice:   product.basePrice,
      sku:         product.sku ?? '',
      isVisible:   product.isVisible,
    });
    setStoreCategoryId(product.storeCategoryId ?? null);
  }
}, [product, reset]);
```

- [ ] **Step 4: Pass storeCategoryId in onSubmit**

Update `onSubmit`:

```typescript
async function onSubmit(values: EditProductForm) {
  await update.mutateAsync({
    id,
    title:           values.title,
    description:     values.description || undefined,
    basePrice:       Number(values.basePrice),
    sku:             values.sku || undefined,
    isVisible:       values.isVisible,
    mediaId:         mediaId ?? undefined,
    storeCategoryId: storeCategoryId ?? undefined,
  });
  router.push('/products');
}
```

- [ ] **Step 5: Add select after the Photo block**

In the JSX form card, find the `{/* Photo */}` block. Add the category select immediately after it:

```tsx
{/* Category */}
{categories.length > 0 && (
  <div>
    <Label>Категория</Label>
    <select
      value={storeCategoryId ?? ''}
      onChange={(e) => setStoreCategoryId(e.target.value || null)}
      className={focusCls}
      style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
    >
      <option value="" style={{ background: '#1a1d2e' }}>— Без категории —</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id} style={{ background: '#1a1d2e' }}>
          {cat.name}
        </option>
      ))}
    </select>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web-seller/src/app/\(dashboard\)/products/\[id\]/edit/page.tsx
git commit -m "feat(web-seller): category select in product edit form"
```

---

## Task 4: TypeScript check + analiz

**Files:**
- Modify: `analiz/done.md`
- Modify: `analiz/tasks.md`

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/web-seller && npx tsc --noEmit
```

Expected: 0 errors. If errors appear, fix before continuing.

- [ ] **Step 2: Update analiz/done.md**

Add at the top of `analiz/done.md` under existing session header (or new one):

```markdown
### ✅ [WEB-033] Store categories CRUD + product category selector
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — StoreCategoriesSection (inline CRUD)
  - `apps/web-seller/src/app/(dashboard)/products/create/page.tsx` — storeCategoryId select
  - `apps/web-seller/src/app/(dashboard)/products/[id]/edit/page.tsx` — storeCategoryId select + populate
- **Что сделано:** CRUD категорий магазина в настройках (inline edit, add, delete с error handling). Category select в формах создания и редактирования товара. `tsc --noEmit` — 0 ошибок.
```

- [ ] **Step 3: Remove WEB-033 from tasks.md if added, commit**

```bash
cd C:/Users/marti/Desktop/savdo
git add analiz/done.md analiz/tasks.md
git commit -m "chore: mark WEB-033 done in analiz"
```
