import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onCancel}
          style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.55)', fontSize: 14, cursor: 'pointer', padding: 0 }}
        >
          Отмена
        </button>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 600, margin: 0 }}>
          Кадрировать фото
        </p>
        <div style={{ width: 52 }} />
      </div>

      {/* Hint */}
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: '0 0 8px', flexShrink: 0 }}>
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
              border: '2px solid #A78BFA',
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
          style={{ width: '100%', accentColor: '#A78BFA' }}
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
            background: processing ? 'rgba(124,58,237,0.40)' : 'linear-gradient(135deg,#7C3AED,#A78BFA)',
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
    </div>
  );
}
