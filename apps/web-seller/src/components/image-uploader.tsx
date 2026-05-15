// apps/web-seller/src/components/image-uploader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { uploadDirect } from '../lib/api/media.api';
import type { MediaPurpose } from '../lib/api/media.api';
import { AlertTriangle, Camera, X } from 'lucide-react';
import { colors, dangerTint } from '@/lib/styles';

function describeUploadError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const serverMsg = (err.response?.data as { message?: string } | undefined)?.message;

    if (status === 401) return 'Сессия истекла. Войдите заново.';
    if (status === 403) return 'Нет прав на загрузку фото.';
    if (status === 413) return 'Файл слишком большой для сервера.';
    if (status === 415) return 'Формат не поддерживается сервером.';
    if (status === 503) return 'Хранилище фото отключено на сервере.';
    if (status && status >= 500) return `Сервер вернул ${status}. Попробуйте позже.`;
    if (!err.response) return 'Нет связи с сервером.';
    return serverMsg ?? `Ошибка загрузки (${status ?? '?'}).`;
  }
  return 'Не удалось загрузить фото. Попробуйте снова.';
}

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

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

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

      // Single request: multipart upload → stored in Telegram
      const { mediaFileId } = await uploadDirect(file, purpose, setProgress);

      // Set local preview + notify parent
      setLocalPreview(URL.createObjectURL(file));
      setProgress(null);
      onChange(mediaFileId);
    } catch (err) {
      console.error('[ImageUploader] upload failed', err);
      setProgress(null);
      setError(describeUploadError(err));
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
        style={{ ...base, background: dangerTint(0.08), border: `2px dashed ${dangerTint(0.5)}`, gap: 8, padding: 16 }}
        onClick={() => { setError(null); inputRef.current?.click(); }}
      >
        <AlertTriangle size={28} style={{ color: colors.danger }} />
        <span style={{ fontSize: 11, color: colors.danger, textAlign: 'center', lineHeight: 1.4 }}>{error}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: colors.danger, background: dangerTint(0.12), border: `1px solid ${dangerTint(0.25)}`, borderRadius: 6, padding: '4px 10px' }}>
          Попробовать снова
        </span>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
      </div>
    );
  }

  if (progress !== null) {
    return (
      <div style={{ ...base, background: colors.surfaceSunken, border: `2px dashed ${colors.accentBorder}`, gap: 10 }}>
        <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width: 32, height: 32, border: `3px solid ${colors.accentMuted}`, borderTopColor: colors.accent, borderRadius: '50%', animation: 'sp .8s linear infinite' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>{progress}%</span>
        <div style={{ width: '80%', height: 4, background: colors.accentMuted, borderRadius: 2 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: colors.accent, borderRadius: 2, transition: 'width .1s' }} />
        </div>
      </div>
    );
  }

  if (displayUrl) {
    return (
      <div style={{ ...base, border: `2px solid ${colors.accentBorder}`, background: colors.surface }} onClick={() => inputRef.current?.click()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Удалить фото"
          style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, background: 'rgba(0,0,0,.65)', border: `1px solid ${colors.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: colors.textPrimary, cursor: 'pointer' }}
        >
          <X size={14} aria-hidden="true" />
        </button>
        <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
      </div>
    );
  }

  return (
    <div
      style={{ ...base, background: colors.surfaceSunken, border: `2px dashed ${colors.border}`, gap: 8 }}
      onClick={() => inputRef.current?.click()}
    >
      <div style={{ width: 40, height: 40, borderRadius: 8, background: colors.accentMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={20} style={{ color: colors.accent }} /></div>
      <span style={{ fontSize: 12, color: colors.textDim, fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>Добавить<br />фото</span>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
    </div>
  );
}
