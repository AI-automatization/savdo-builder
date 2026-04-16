// apps/web-seller/src/components/image-uploader.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadDirect } from '../lib/api/media.api';
import type { MediaPurpose } from '../lib/api/media.api';
import { AlertTriangle, Camera, X } from 'lucide-react';

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
        <AlertTriangle size={28} style={{ color: 'rgba(248,113,113,.85)' }} />
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

  if (displayUrl) {
    return (
      <div style={{ ...base, border: '2px solid rgba(167,139,250,.25)', background: '#1a1d2e' }} onClick={() => inputRef.current?.click()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button
          type="button"
          onClick={handleRemove}
          style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'rgba(255,255,255,.85)', cursor: 'pointer' }}
        >
          <X size={14} />
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
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={20} style={{ color: '#A78BFA' }} /></div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,.38)', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>Добавить<br />фото</span>
      <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={handleChange} />
    </div>
  );
}
