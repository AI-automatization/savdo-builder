import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useTelegram } from '@/providers/TelegramProvider';
import { SIDEBAR_WIDTH } from '@/components/layout/Sidebar';

interface Props {
  imageSrc: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

async function getCroppedFile(src: string, crop: Area): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = src;
  });

  const canvas = document.createElement('canvas');
  const SIZE = 800;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, SIZE, SIZE);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob!], 'photo.jpg', { type: 'image/jpeg' })),
      'image/jpeg',
      0.92,
    );
  });
}

export function ImageCropper({ imageSrc, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  // На desktop оставляем sidebar 220px видимым — cropper не перекрывает навигацию.
  const { viewportWidth } = useTelegram();
  const leftOffset = (viewportWidth ?? 0) >= 768 ? SIDEBAR_WIDTH : 0;

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedArea(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    setProcessing(true);
    try {
      const file = await getCroppedFile(imageSrc, croppedArea);
      onConfirm(file);
    } finally {
      setProcessing(false);
    }
  };

  if (typeof document === 'undefined') return null;

  // Polat 07.05: portal в body — backdrop-filter в GlassCard ломает fixed.
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: leftOffset,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          background: 'rgba(0,0,0,0.55)',
          borderBottom: '1px solid var(--tg-border-soft)',
        }}
      >
        <button
          onClick={onCancel}
          aria-label="Отменить кадрирование"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 44,
            minHeight: 44,
            padding: '8px 14px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.18)',
            border: '1px solid rgba(239,68,68,0.45)',
            color: '#fca5a5',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ✕ Отменить
        </button>
        <p style={{ color: 'var(--tg-text-primary)', fontSize: 15, fontWeight: 700, margin: 0, textAlign: 'center', flex: 1 }}>
          Кадрировать фото
        </p>
        {/* Spacer для симметрии (равен ширине Отменить ~110px) */}
        <div style={{ width: 110, flexShrink: 0 }} />
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', color: 'var(--tg-text-muted)', fontSize: 12, margin: '0 0 8px', flexShrink: 0 }}>
        Перетащите и масштабируйте
      </p>

      {/* Crop area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: { background: 'transparent' },
            cropAreaStyle: {
              border: '2px solid var(--tg-accent)',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            },
          }}
        />
      </div>

      {/* Zoom slider */}
      <div style={{ padding: '12px 32px 8px', flexShrink: 0 }}>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--tg-accent)' }}
        />
      </div>

      {/* Confirm button */}
      <div style={{ padding: '8px 20px 32px', flexShrink: 0 }}>
        <button
          onClick={handleConfirm}
          disabled={processing}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            background: processing ? 'var(--tg-accent-dim)' : 'var(--tg-accent)',
            border: 'none',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: processing ? 'wait' : 'pointer',
          }}
        >
          {processing ? 'Обработка...' : '✂️ Применить кадрирование'}
        </button>
      </div>
    </div>,
    document.body,
  );
}
