import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiUpload, ApiError } from '@/lib/api';
import { CategoryModal } from '@/components/ui/CategoryModal';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { glass } from '@/lib/styles';

interface SizeRow {
  label: string;
  stock: number;
}

interface StoreCategory {
  id: string;
  name: string;
}

interface GlobalCategory {
  id: string;
  nameRu: string;
  parentId?: string | null;
}

interface AttrRow {
  id: string;
  name: string;
  value: string;
}

function slugify(text: string) {
  return text.trim().toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/gi, '-').slice(0, 20);
}


export default function AddProductPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [stock, setStock]             = useState('');

  // Размеры
  const [hasSizes, setHasSizes] = useState(false);
  const [sizes, setSizes]       = useState<SizeRow[]>([
    { label: 'S', stock: 0 },
    { label: 'M', stock: 0 },
    { label: 'L', stock: 0 },
  ]);
  const [sizeInput, setSizeInput] = useState('');

  // Фото
  const fileRef                         = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile]       = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [cropSrc, setCropSrc]           = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Категории
  const [categories, setCategories]           = useState<StoreCategory[]>([]);
  const [storeCategoryId, setStoreCategoryId] = useState<string>('');
  const [globalCategories, setGlobalCategories]   = useState<GlobalCategory[]>([]);
  const [globalCategoryId, setGlobalCategoryId]   = useState<string>('');
  const [attrs, setAttrs] = useState<AttrRow[]>([]);
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');

  const [showStoreCatModal, setShowStoreCatModal] = useState(false);
  const [showGlobalCatModal, setShowGlobalCatModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate('/seller/products'));
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(() => navigate('/seller/products')); };
  }, [navigate, tg]);

  useEffect(() => {
    api<StoreCategory[]>('/seller/categories').then(setCategories).catch(() => {});
    api<GlobalCategory[]>('/storefront/categories').then(setGlobalCategories).catch(() => {});
  }, []);

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
    !!globalCategoryId &&
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
    if (fileRef.current) fileRef.current.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedFile: File) => {
    setCropSrc('');
    setPhotoFile(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    setPhotoPreview(url);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setCropSrc('');
    setUploadProgress(0);
    setPhotoUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadPhotoForProduct = async (pid: string, file: File): Promise<void> => {
    setPhotoUploading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', 'product_image');
      const { mediaFileId } = await apiUpload<{ mediaFileId: string; url: string }>(
        '/media/upload',
        form,
        setUploadProgress,
      );
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
          ...(storeCategoryId ? { storeCategoryId } : {}),
          ...(globalCategoryId ? { globalCategoryId } : {}),
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

      // 3. Сохранить атрибуты
      for (let i = 0; i < attrs.length; i++) {
        const a = attrs[i];
        if (a.name.trim() && a.value.trim()) {
          await api(`/seller/products/${pid}/attributes`, {
            method: 'POST',
            body: { name: a.name.trim(), value: a.value.trim(), sortOrder: i },
          }).catch(() => {});
        }
      }

      // 4. Загрузить фото если выбрано (отдельный try — ошибка фото не отменяет товар)
      if (photoFile) {
        try {
          await uploadPhotoForProduct(pid, photoFile);
        } catch (photoErr: unknown) {
          const isStorageDown = photoErr instanceof ApiError && photoErr.status === 503;
          tg?.HapticFeedback.notificationOccurred('warning');
          // Показываем ошибку фото и переходим в редактор товара
          // чтобы пользователь мог попробовать загрузить фото там
          navigate(`/seller/products/${pid}/edit`, {
            state: {
              photoError: isStorageDown
                ? 'Загрузка фото временно недоступна — попробуйте позже'
                : 'Фото не загружено — попробуйте добавить здесь',
            },
          });
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
    <>
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(''); }}
        />
      )}
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

        {/* Категория магазина */}
        {categories.length > 0 && (
          <GlassCard className="p-4 flex flex-col gap-2">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Категория магазина
            </label>
            <button
              onClick={() => setShowStoreCatModal(true)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all active:opacity-70"
              style={{
                background: storeCategoryId ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${storeCategoryId ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.12)'}`,
                color: storeCategoryId ? '#A855F7' : 'rgba(255,255,255,0.40)',
              }}
            >
              <span>{categories.find((c) => c.id === storeCategoryId)?.name ?? 'Выберите категорию...'}</span>
              <span style={{ fontSize: 12, opacity: 0.5 }}>▼</span>
            </button>
          </GlassCard>
        )}

        {/* Тип товара (GlobalCategory) — обязательно */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Тип товара <span style={{ color: '#f87171' }}>*</span>
          </label>
          <button
            onClick={() => setShowGlobalCatModal(true)}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all active:opacity-70"
            style={{
              background: globalCategoryId ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${globalCategoryId ? 'rgba(6,182,212,0.40)' : 'rgba(239,68,68,0.35)'}`,
              color: globalCategoryId ? '#22D3EE' : 'rgba(255,255,255,0.40)',
            }}
          >
            <span>{globalCategories.find((c) => c.id === globalCategoryId)?.nameRu ?? 'Выберите тип товара...'}</span>
            <span style={{ fontSize: 12, opacity: 0.5 }}>▼</span>
          </button>
          {!globalCategoryId && (
            <p className="text-xs" style={{ color: 'rgba(239,68,68,0.80)' }}>Необходимо выбрать тип товара</p>
          )}
        </GlassCard>

        {showStoreCatModal && (
          <CategoryModal
            title="Категория магазина"
            items={categories.map((c) => ({ id: c.id, nameRu: c.name }))}
            selectedId={storeCategoryId || null}
            onSelect={(id) => setStoreCategoryId(id ?? '')}
            onClose={() => setShowStoreCatModal(false)}
          />
        )}
        {showGlobalCatModal && (
          <CategoryModal
            title="Тип товара"
            items={globalCategories}
            selectedId={globalCategoryId || null}
            onSelect={(id) => setGlobalCategoryId(id ?? '')}
            onClose={() => setShowGlobalCatModal(false)}
          />
        )}

        {/* Характеристики товара */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Характеристики
          </label>
          {attrs.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <span className="text-xs flex-1 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <b>{a.name}</b>: {a.value}
              </span>
              <button
                onClick={() => setAttrs((prev) => prev.filter((x) => x.id !== a.id))}
                style={{ color: 'rgba(248,113,113,0.65)', fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              placeholder="Материал"
              style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
            />
            <input
              value={attrValue}
              onChange={(e) => setAttrValue(e.target.value)}
              placeholder="Хлопок"
              style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
            />
            <button
              onClick={() => {
                if (!attrName.trim() || !attrValue.trim()) return;
                setAttrs((prev) => [...prev, { id: Date.now().toString(), name: attrName.trim(), value: attrValue.trim() }]);
                setAttrName('');
                setAttrValue('');
              }}
              style={{
                padding: '8px 12px', borderRadius: 10,
                border: '1px solid rgba(167,139,250,0.30)',
                background: 'rgba(167,139,250,0.12)',
                color: '#A855F7', fontSize: 18, cursor: 'pointer', flexShrink: 0,
              }}
            >
              +
            </button>
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
                          background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
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
                      color: '#A855F7',
                    }}
                  >
                    {sz.label}
                  </div>
                  <input
                    inputMode="numeric"
                    value={sz.stock || ''}
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
                    color: '#A855F7',
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
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/^0+(?=\d)/, ''))}
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
    </>
  );
}
