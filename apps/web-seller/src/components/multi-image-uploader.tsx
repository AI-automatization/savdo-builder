// apps/web-seller/src/components/multi-image-uploader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Camera, X, Star } from 'lucide-react';
import { uploadDirect } from '../lib/api/media.api';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX = 8;

export interface MultiImageItem {
  /** Uploaded mediaId — для новых после uploadDirect, для существующих — из product.images[i].id или mediaId. */
  mediaId: string;
  /** Preview URL — objectURL для свежих, или URL из storage для существующих. */
  previewUrl: string;
}

export interface MultiImageUploaderProps {
  value: MultiImageItem[];
  onChange: (next: MultiImageItem[]) => void;
  maxFiles?: number;
  /**
   * Разрешить смену порядка (drag) и выбор главного фото.
   * `false` для edit-страницы: backend не имеет PATCH-эндпоинта на reorder
   * (API-PRODUCT-IMAGES-PATCH-001), и перетаскивание там молча не сохранялось.
   */
  reorderable?: boolean;
}

export function MultiImageUploader({
  value,
  onChange,
  maxFiles = DEFAULT_MAX,
  reorderable = true,
}: MultiImageUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  // Blob-URL'ы, созданные этим компонентом (свежие фото). Освобождаем при удалении
  // и при размонтировании, иначе блобы висят в памяти всю сессию (утечка).
  const createdBlobs = useRef<Set<string>>(new Set());
  useEffect(
    () => () => {
      createdBlobs.current.forEach((url) => URL.revokeObjectURL(url));
      createdBlobs.current.clear();
    },
    [],
  );

  function describeError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 401) return t('uploader.multiError.sessionExpired');
      if (status === 413) return t('uploader.multiError.fileTooLarge');
      if (status === 415) return t('uploader.multiError.formatNotSupported');
      if (status === 503) return t('uploader.multiError.storageUnavailable');
      if (status && status >= 500) return t('uploader.multiError.serverError', { status: String(status) });
      return `${status ?? '?'}`;
    }
    return t('uploader.multiError.uploadFailed');
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      setError(t('uploader.maxPhotos', { max: String(maxFiles) }));
      return;
    }
    const toUpload = Array.from(files).slice(0, remaining);

    setError(null);
    setUploading(true);
    // `value` is a fixed snapshot for this call — accumulate locally and flush
    // via onChange after EACH successful upload (not just once at the end), so
    // a later file failing doesn't discard photos that already exist server-side.
    const uploaded: MultiImageItem[] = [];
    let lastError: unknown;
    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(t('uploader.onlyFormats'));
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(t('uploader.fileTooLargeNamed', { name: file.name }));
        continue;
      }
      try {
        const { mediaFileId } = await uploadDirect(file, 'product_image');
        const previewUrl = URL.createObjectURL(file);
        createdBlobs.current.add(previewUrl);
        uploaded.push({ mediaId: mediaFileId, previewUrl });
        onChange([...value, ...uploaded]);
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) setError(describeError(lastError));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(idx: number) {
    const removed = value[idx]?.previewUrl;
    if (removed && createdBlobs.current.has(removed)) {
      URL.revokeObjectURL(removed);
      createdBlobs.current.delete(removed);
    }
    onChange(value.filter((_, i) => i !== idx));
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
            draggable={reorderable}
            onDragStart={reorderable ? (e) => onDragStart(e, idx) : undefined}
            onDragOver={reorderable ? (e) => onDragOverItem(e, idx) : undefined}
            onDrop={reorderable ? (e) => onDropItem(e, idx) : undefined}
            onDragLeave={reorderable ? () => setDragOverIdx(null) : undefined}
            className={`relative aspect-square rounded-lg overflow-hidden ${reorderable ? 'cursor-move' : ''}`}
            style={{
              border: `2px solid ${dragOverIdx === idx ? colors.accent : colors.border}`,
              background: colors.surfaceMuted,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.previewUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            {idx === 0 ? (
              <div
                className="absolute top-1 left-1 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Star size={10} />
                {t('uploader.primaryLabel')}
              </div>
            ) : reorderable ? (
              <button
                type="button"
                onClick={() => makePrimary(idx)}
                className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
                aria-label={t('uploader.makePrimary')}
                title={t('uploader.makePrimary')}
              >
                <Star size={12} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
              aria-label={t('uploader.removePhoto')}
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
            aria-label={t('uploader.addPhotoBtn')}
          >
            <Camera size={20} />
            <span className="text-[10px] font-semibold">
              {uploading ? t('uploader.uploading') : t('uploader.addBtn')}
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
        {reorderable
          ? t('uploader.hintReorder', { max: String(maxFiles) })
          : t('uploader.hint', { max: String(maxFiles) })}
      </p>
    </div>
  );
}
