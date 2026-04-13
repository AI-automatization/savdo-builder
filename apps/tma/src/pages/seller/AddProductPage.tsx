import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { glass } from '@/lib/styles';

interface SizeRow {
  label: string;
  stock: number;
}

function slugify(text: string) {
  return text.trim().toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/gi, '-').slice(0, 20);
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error('Upload failed'));
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

export default function AddProductPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [stock, setStock]             = useState('0');

  // Размеры
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes]       = useState<SizeRow[]>([
    { label: 'S', stock: 0 },
    { label: 'M', stock: 0 },
    { label: 'L', stock: 0 },
  ]);
  const [sizeInput, setSizeInput] = useState('');

  // Фото
  const fileRef               = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile]     = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate('/seller/products'));
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(() => navigate('/seller/products')); };
  }, [navigate, tg]);

  const inputStyle = {
    ...glass,
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
  } as const;

  const isValid = title.trim().length >= 2 && Number(price) > 0 &&
    (!hasSizes || sizes.length > 0);

  const addSize = () => {
    const label = sizeInput.trim().toUpperCase();
    if (!label) return;
    if (sizes.find((s) => s.label === label)) return;
    setSizes((prev) => [...prev, { label, stock: 0 }]);
    setSizeInput('');
  };

  const removeSize = (label: string) => {
    setSizes((prev) => prev.filter((s) => s.label !== label));
  };

  const updateSizeStock = (label: string, val: string) => {
    setSizes((prev) =>
      prev.map((s) => s.label === label ? { ...s, stock: Math.max(0, Number(val) || 0) } : s),
    );
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setUploadProgress(0);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadPhotoForProduct = async (pid: string, file: File): Promise<void> => {
    setPhotoUploading(true);
    setUploadProgress(0);
    try {
      // 1. Запросить presigned URL
      const { mediaFileId, uploadUrl } = await api<{ mediaFileId: string; uploadUrl: string; objectKey: string }>(
        '/media/upload-url',
        {
          method: 'POST',
          body: { purpose: 'product_image', mimeType: file.type, sizeBytes: file.size },
        },
      );

      // 2. Загрузить напрямую в R2 с прогрессом
      await uploadWithProgress(uploadUrl, file, setUploadProgress);

      // 3. Подтвердить загрузку
      await api(`/media/${mediaFileId}/confirm`, { method: 'POST' });

      // 4. Прикрепить к товару
      await api(`/seller/products/${pid}/images`, {
        method: 'POST',
        body: { mediaId: mediaFileId },
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      // 1. Создать товар
      const product = await api<{ id: string }>('/seller/products', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
        },
      });
      const pid = product.id;
      const sku = slugify(title);

      if (hasSizes && sizes.length > 0) {
        // 2а. Создать группу "Размер"
        const group = await api<{ id: string }>(`/seller/products/${pid}/option-groups`, {
          method: 'POST',
          body: { name: 'Размер', code: 'size', sortOrder: 0 },
        });
        const gid = group.id;

        // 2б. Создать значения и варианты
        for (let i = 0; i < sizes.length; i++) {
          const sz = sizes[i];
          const val = await api<{ id: string }>(`/seller/products/${pid}/option-groups/${gid}/values`, {
            method: 'POST',
            body: { value: sz.label, code: sz.label, sortOrder: i },
          });
          await api(`/seller/products/${pid}/variants`, {
            method: 'POST',
            body: {
              sku: `${sku}-${sz.label}`,
              stockQuantity: sz.stock,
              optionValueIds: [val.id],
            },
          });
        }
      } else {
        // 2б. Простой вариант без размеров
        await api(`/seller/products/${pid}/variants`, {
          method: 'POST',
          body: { sku, stockQuantity: Math.max(0, Number(stock) || 0) },
        });
      }

      // 3. Загрузить фото если выбрано (отдельный try — ошибка фото не отменяет товар)
      if (photoFile) {
        try {
          await uploadPhotoForProduct(pid, photoFile);
        } catch (photoErr: unknown) {
          const isStorageDown = photoErr instanceof ApiError && photoErr.status === 503;
          setError(
            isStorageDown
              ? 'Товар создан. Загрузка фото временно недоступна — добавьте фото позже.'
              : 'Товар создан, но фото не загружено. Попробуйте добавить его позже.',
          );
          tg?.HapticFeedback.notificationOccurred('warning');
          navigate('/seller/products');
          return;
        }
      }

      // 4. Публикация
      if (publish) {
        await api(`/seller/products/${pid}/status`, {
          method: 'PATCH',
          body: { status: 'ACTIVE' },
        });
      }

      tg?.HapticFeedback.notificationOccurred('success');
      navigate('/seller/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка при создании товара';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Новый товар
        </h1>

        {/* Основная информация */}
        <GlassCard className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Название *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Футболка белая"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Цена (сум) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50000"
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
        </GlassCard>

        {/* Фото товара */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Фото товара
          </p>

          {photoPreview ? (
            <div className="flex items-start gap-3">
              <img
                src={photoPreview}
                alt="preview"
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
              />
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {photoFile?.name}
                </p>
                {photoUploading && (
                  <div className="flex flex-col gap-1">
                    <div
                      style={{
                        height: 4, borderRadius: 4,
                        background: 'rgba(255,255,255,0.10)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${uploadProgress}%`,
                          background: 'linear-gradient(90deg, #7C3AED, #A78BFA)',
                          transition: 'width 0.2s',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.70)' }}>
                      {uploadProgress}%
                    </p>
                  </div>
                )}
                <button
                  onClick={removePhoto}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                >
                  <span className="text-xs" style={{ color: 'rgba(248,113,113,0.65)' }}>✕ Удалить</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                border: '1px dashed rgba(167,139,250,0.30)',
                borderRadius: 12,
                padding: '20px 0',
                background: 'rgba(167,139,250,0.05)',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(167,139,250,0.70)' }}>📷 Выбрать фото</p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>JPG, PNG, WEBP</p>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={pickPhoto}
          />
        </GlassCard>

        {/* Остаток / размеры */}
        <GlassCard className="p-4 flex flex-col gap-4">
          {/* Переключатель размеров */}
          <button
            onClick={() => setHasSizes((v) => !v)}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Товар с размерами
              </p>
              <p className="text-[11px] text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {hasSizes ? 'Задать остаток по каждому размеру' : 'S / M / L / XL и т.д.'}
              </p>
            </div>
            <div
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: hasSizes ? '#7C3AED' : 'rgba(255,255,255,0.12)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: hasSizes ? 21 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </button>

          {hasSizes ? (
            <div className="flex flex-col gap-3">
              {sizes.map((sz) => (
                <div key={sz.label} className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'rgba(167,139,250,0.15)',
                      border: '1px solid rgba(167,139,250,0.25)',
                      color: '#A78BFA',
                    }}
                  >
                    {sz.label}
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={sz.stock}
                    onChange={(e) => updateSizeStock(sz.label, e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                  />
                  <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>шт</span>
                  <button
                    onClick={() => removeSize(sz.label)}
                    style={{ color: 'rgba(248,113,113,0.60)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSize()}
                  placeholder="XL / 42 / One size"
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <button
                  onClick={addSize}
                  disabled={!sizeInput.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(167,139,250,0.30)',
                    background: 'rgba(167,139,250,0.12)',
                    color: '#A78BFA',
                    fontSize: 13,
                    cursor: sizeInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: sizeInput.trim() ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                >
                  + Добавить
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Количество в наличии
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }}>шт</span>
              </div>
            </div>
          )}
        </GlassCard>

        {error && (
          <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleSave(true)}
            disabled={!isValid || saving || photoUploading}
            className="w-full"
          >
            {saving ? 'Сохранение...' : '▶ Создать и опубликовать'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSave(false)}
            disabled={!isValid || saving || photoUploading}
            className="w-full"
          >
            Создать как черновик
          </Button>
        </div>

        <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          При публикации товар автоматически появится в привязанном Telegram-канале
        </p>
      </div>
    </AppShell>
  );
}
