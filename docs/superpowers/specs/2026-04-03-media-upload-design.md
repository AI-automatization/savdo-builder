# Media Upload Design — web-seller

**Date:** 2026-04-03
**Domain:** apps/web-seller
**Owner:** Азим

---

## Goal

Add image upload to product create/edit forms (1 photo per product) and store settings (logo + cover). Reusable `ImageUploader` component with presigned URL flow via Cloudflare R2.

---

## Decisions

| Question | Decision |
|----------|----------|
| Photos per product | 1 (main photo only, MVP) |
| Upload UX | Click-to-upload zone (no drag & drop) |
| Component | Reusable `ImageUploader` in `src/components/` |
| Formats | jpeg, png, webp |
| Max size | 10 MB (enforced client-side before request) |

---

## Upload Flow

```
User clicks zone → file picker → file selected
  → validate (type + size) client-side
  → POST /api/v1/media/upload-url { mimeType, purpose, sizeBytes }
  → PUT presignedUrl (file binary, Content-Type header)
  → POST /api/v1/media/:id/confirm
  → onChange(mediaId)  ← passed to parent form
```

---

## API (already implemented)

| Endpoint | Use |
|----------|-----|
| `POST /api/v1/media/upload-url` | Get presigned URL + mediaId |
| `PUT <presignedUrl>` | Upload file directly to R2 (axios, not apiClient) |
| `POST /api/v1/media/:id/confirm` | Confirm upload, get public URL |

Request for upload-url:
```json
{ "mimeType": "image/jpeg", "purpose": "product_image", "sizeBytes": 524288 }
```

Response:
```json
{ "mediaId": "uuid", "uploadUrl": "https://r2...", "expiresAt": "..." }
```

Confirm response:
```json
{ "id": "uuid", "url": "https://cdn...", "status": "CONFIRMED" }
```

---

## ImageUploader Component

**File:** `src/components/image-uploader.tsx`

**Props:**
```typescript
interface ImageUploaderProps {
  value: string | null;           // current mediaId
  onChange: (mediaId: string | null) => void;
  purpose: 'product_image' | 'store_logo' | 'store_banner';
  previewUrl?: string | null;     // existing image URL (from API)
  aspectRatio?: string;           // CSS aspect-ratio, default '1'
}
```

**States:**
- **Empty** — dashed border zone, camera icon, "Добавить фото"
- **Uploading** — spinner + progress % (from xhr upload progress)
- **Done** — image preview, ✕ button (sets value to null, clears preview)
- **Error** — red dashed border, error message, "Попробовать снова"

**Validation (before upload):**
- Allowed types: `image/jpeg`, `image/png`, `image/webp`
- Max size: 10 MB (10 × 1024 × 1024 bytes)
- Error messages in Russian

**Upload progress:** Use `XMLHttpRequest` for PUT to R2 (fetch doesn't support progress). Track `xhr.upload.onprogress`.

**Delete:** Clears local state only (no DELETE API call in UI — mediaId simply not sent in form).

---

## Where Used

| Place | Purpose | Field sent in form |
|-------|---------|--------------------|
| `/products/create` | `product_image` | `mediaId` added to POST body |
| `/products/:id/edit` | `product_image` | `mediaId` added to PATCH body, `previewUrl` from `product.mediaUrl` |
| Settings → Магазин | `store_logo` | `logoMediaId` in PATCH /seller/store |
| Settings → Магазин | `store_banner` | `coverMediaId` in PATCH /seller/store |

---

## Layout

**Product create/edit:** uploader 100×100px, positioned left of title+price fields (flex row).

**Settings logo:** 72×72px square, inline with label "Логотип".

**Settings cover:** full width, `aspect-ratio: 3/1`, above logo row.

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/api/media.api.ts` | `getUploadUrl`, `confirmUpload` |
| `src/components/image-uploader.tsx` | Reusable upload component |

## Modified Files

| File | Change |
|------|--------|
| `src/app/(dashboard)/products/create/page.tsx` | Add ImageUploader, send mediaId |
| `src/app/(dashboard)/products/[id]/edit/page.tsx` | Add ImageUploader, previewUrl, send mediaId |
| `src/app/(dashboard)/settings/page.tsx` | Add 2 ImageUploaders (logo + cover) in StoreSettingsSection |

---

## Out of Scope

- Multiple photos per product — LATER
- Drag & drop — LATER
- DELETE /media/:id call from UI — not needed (just don't send mediaId)
- Image cropping — REJECTED for MVP
- File size shown in UI — YAGNI
