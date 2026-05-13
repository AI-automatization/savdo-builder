// apps/web-seller/src/components/multi-image-uploader.tsx
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
  /** Uploaded mediaId — для новых после uploadDirect, для существующих — из product.images[i].id или mediaId. */
  mediaId: string;
  /** Preview URL — objectURL для свежих, или URL из storage для существующих. */
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
          setError('Только JPG / PNG / WebP');
          continue;
        }
        if (file.size > MAX_BYTES) {
          setError(`Файл «${file.name}» больше 10 MB`);
          continue;
        }
        const { mediaFileId } = await uploadDirect(file, 'product_image');
        const previewUrl = URL.createObjectURL(file);
        uploaded.push({ mediaId: mediaFileId, previewUrl });
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
            {idx === 0 ? (
              <div
                className="absolute top-1 left-1 px-1.5 py-0.5 rounded flex items-center gap-1 text-[10px] font-bold"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Star size={10} />
                Главное
              </div>
            ) : (
              <button
                type="button"
                onClick={() => makePrimary(idx)}
                className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
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
        До {maxFiles} фото · Первое — главное · Перетащи чтобы поменять порядок
      </p>
    </div>
  );
}
