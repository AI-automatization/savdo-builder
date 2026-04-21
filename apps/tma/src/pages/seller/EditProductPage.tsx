import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { api, apiUpload, getToken, ApiError } from '@/lib/api';
import { CategoryModal } from '@/components/ui/CategoryModal';
import { getImageUrl } from '@/lib/imageUrl';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { glass } from '@/lib/styles';

interface Variant {
  id: string;
  sku: string;
  stockQuantity: number;
  isActive: boolean;
  optionValueIds: string[];
}

interface OptionGroupValue {
  id: string;
  value: string;
}

interface OptionGroup {
  id: string;
  name: string;
  values: OptionGroupValue[];
}

interface ProductImage {
  id: string;
  sortOrder: number;
  isPrimary: boolean;
  media: { id: string; objectKey: string; mimeType: string };
}

interface StoreCategory {
  id: string;
  name: string;
}

interface GlobalCategory {
  id: string;
  nameRu: string;
}

interface ProductAttr {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';
  storeCategoryId?: string | null;
  globalCategoryId?: string | null;
  variants?: Variant[];
  images?: ProductImage[];
  optionGroups?: OptionGroup[];
}


export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { tg } = useTelegram();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  // Stock editing
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [stockSaving, setStockSaving] = useState<string | null>(null);

  // Photo upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string>('');

  // Категории
  const [categories, setCategories]               = useState<StoreCategory[]>([]);
  const [storeCategoryId, setStoreCategoryId]     = useState<string>('');
  const [globalCategories, setGlobalCategories]   = useState<GlobalCategory[]>([]);
  const [globalCategoryId, setGlobalCategoryId]   = useState<string>('');
  const [attrs, setAttrs] = useState<ProductAttr[]>([]);
  const [attrName, setAttrName] = useState('');
  const [attrValue, setAttrValue] = useState('');
  const [attrSaving, setAttrSaving] = useState(false);
  const [showStoreCatModal, setShowStoreCatModal] = useState(false);
  const [showGlobalCatModal, setShowGlobalCatModal] = useState(false);

  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const p = await api<Product>(`/seller/products/${id}`);
      setProduct(p);
      setTitle(p.title);
      setDescription(p.description ?? '');
      setPrice(String(p.basePrice));
      setStoreCategoryId(p.storeCategoryId ?? '');
      setGlobalCategoryId(p.globalCategoryId ?? '');
      if (p.variants) {
        const initial: Record<string, string> = {};
        for (const v of p.variants) initial[v.id] = v.stockQuantity === 0 ? '' : String(v.stockQuantity);
        setStockEdits(initial);
      }
      // Load attributes
      api<ProductAttr[]>(`/seller/products/${id}/attributes`).then(setAttrs).catch(() => {});
    } catch {
      setLoadError('Не удалось загрузить товар');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    tg?.BackButton.show();
    const goBack = () => navigate('/seller/products');
    tg?.BackButton.onClick(goBack);
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [load, navigate, tg]);

  useEffect(() => {
    api<StoreCategory[]>('/seller/categories').then(setCategories).catch(() => {});
    api<GlobalCategory[]>('/storefront/categories').then(setGlobalCategories).catch(() => {});
  }, []);

  // Показать ошибку фото переданную из AddProductPage
  useEffect(() => {
    const photoError = (location.state as { photoError?: string } | null)?.photoError;
    if (photoError) {
      showToast(`⚠️ ${photoError}`);
      // Очищаем state чтобы toast не показывался при повторном рендере
      window.history.replaceState({}, '');
    }
  }, [location.state]);

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

  const isValid = title.trim().length >= 2 && Number(price) > 0;

  const handleStockSave = async (variant: Variant) => {
    if (!id) return;
    const newQty = Math.max(0, Number(stockEdits[variant.id]) || 0);
    const delta = newQty - variant.stockQuantity;
    if (delta === 0) return;
    setStockSaving(variant.id);
    try {
      await api(`/seller/products/${id}/variants/${variant.id}/stock`, {
        method: 'POST',
        body: { delta, reason: 'Ручная корректировка в TMA' },
      });
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              variants: prev.variants?.map((v) =>
                v.id === variant.id ? { ...v, stockQuantity: newQty } : v,
              ),
            }
          : prev,
      );
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Остаток обновлён');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Ошибка обновления остатка');
    } finally {
      setStockSaving(null);
    }
  };

  const addAttr = async () => {
    if (!attrName.trim() || !attrValue.trim() || !id) return;
    setAttrSaving(true);
    try {
      const created = await api<ProductAttr>(`/seller/products/${id}/attributes`, {
        method: 'POST',
        body: { name: attrName.trim(), value: attrValue.trim(), sortOrder: attrs.length },
      });
      setAttrs((prev) => [...prev, created]);
      setAttrName('');
      setAttrValue('');
    } catch {
      showToast('❌ Ошибка добавления');
    } finally {
      setAttrSaving(false);
    }
  };

  const deleteAttr = async (attrId: string) => {
    if (!id) return;
    await api(`/seller/products/${id}/attributes/${attrId}`, { method: 'DELETE' }).catch(() => {});
    setAttrs((prev) => prev.filter((a) => a.id !== attrId));
  };

  const handleSave = async () => {
    if (!isValid || !id) return;
    setSaving(true);
    setError('');
    try {
      await api(`/seller/products/${id}`, {
        method: 'PATCH',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
          storeCategoryId: storeCategoryId || null,
          globalCategoryId: globalCategoryId || null,
        },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Сохранено');
      setProduct((prev) =>
        prev ? { ...prev, title: title.trim(), description: description.trim() || null, basePrice: Number(price), storeCategoryId: storeCategoryId || null } : prev,
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') => {
    if (!id) return;
    setStatusChanging(true);
    setError('');
    try {
      await api(`/seller/products/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setProduct((prev) => prev ? { ...prev, status: newStatus } : prev);
      showToast(
        newStatus === 'ARCHIVED' ? '📦 Товар архивирован'
        : newStatus === 'ACTIVE' ? '✅ Товар опубликован'
        : '📝 Товар переведён в черновик',
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка смены статуса';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError('');
    try {
      const token = getToken();
      const BASE = (import.meta.env.VITE_API_URL as string) ?? '';
      const res = await fetch(`${BASE}/api/v1/seller/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Ошибка удаления' }));
        throw new Error(err.message ?? 'Ошибка удаления');
      }
      tg?.HapticFeedback.notificationOccurred('success');
      navigate('/seller/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка удаления';
      setError(msg);
      setShowDeleteConfirm(false);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    if (fileRef.current) fileRef.current.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async (croppedFile: File) => {
    setCropSrc('');
    if (!id) return;
    setPhotoUploading(true);
    setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', croppedFile);
      form.append('purpose', 'product_image');
      const { mediaFileId } = await apiUpload<{ mediaFileId: string; url: string }>(
        '/media/upload',
        form,
        setUploadProgress,
      );
      const newImage = await api<ProductImage>(`/seller/products/${id}/images`, {
        method: 'POST',
        body: { mediaId: mediaFileId },
      });
      setProduct((prev) =>
        prev ? { ...prev, images: [...(prev.images ?? []), newImage] } : prev,
      );
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Фото добавлено');
    } catch (e: unknown) {
      tg?.HapticFeedback.notificationOccurred('error');
      if (e instanceof ApiError && e.status === 503) {
        showToast('⚠️ Telegram Storage не настроен — добавьте TELEGRAM_STORAGE_CHANNEL_ID в Railway');
      } else {
        showToast('❌ Ошибка загрузки фото');
      }
    } finally {
      setPhotoUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeletePhoto = async (imageId: string) => {
    if (!id) return;
    setDeletingImageId(imageId);
    try {
      await api(`/seller/products/${id}/images/${imageId}`, { method: 'DELETE' });
      setProduct((prev) =>
        prev ? { ...prev, images: prev.images?.filter((img) => img.id !== imageId) } : prev,
      );
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('🗑 Фото удалено');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Ошибка удаления фото');
    } finally {
      setDeletingImageId(null);
    }
  };

  return (
    <>
      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc('')}
        />
      )}
    <AppShell role="SELLER">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.30)',
            color: '#34d399',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 14,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
            whiteSpace: 'nowrap',
          }}
        >
          {toast}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.70)',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              ...glass,
              background: 'rgba(20,10,40,0.95)',
              padding: 24,
              borderRadius: 20,
              width: '100%',
              maxWidth: 340,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold mb-2" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Удалить товар?
            </p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              «{product?.title}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: '1px solid rgba(248,113,113,0.30)',
                  background: 'rgba(248,113,113,0.12)',
                  color: '#f87171',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'wait' : 'pointer',
                }}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Редактировать товар
        </h1>

        {loading && <div className="flex justify-center py-10"><Spinner size={32} /></div>}

        {!loading && loadError && (
          <GlassCard className="p-4 text-center">
            <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 14 }}>{loadError}</p>
            <Button variant="ghost" className="mt-3" onClick={load}>Повторить</Button>
          </GlassCard>
        )}

        {!loading && !loadError && product && (
          <>
            {/* Предупреждение: скрыт администратором */}
            {product.status === 'HIDDEN_BY_ADMIN' && (
              <div
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <span style={{ fontSize: 18, lineHeight: 1.4 }}>🚫</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#f87171' }}>Товар скрыт администратором</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(248,113,113,0.65)' }}>
                    Товар не виден покупателям. Вы можете отредактировать его данные или удалить.
                  </p>
                </div>
              </div>
            )}

            {/* Основная информация */}
            <GlassCard className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Название *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название товара"
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

              {error && (
                <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 13 }}>{error}</p>
              )}
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

            {/* Тип товара (GlobalCategory) */}
            {globalCategories.length > 0 && (
              <GlassCard className="p-4 flex flex-col gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Тип товара
                </label>
                <button
                  onClick={() => setShowGlobalCatModal(true)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all active:opacity-70"
                  style={{
                    background: globalCategoryId ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${globalCategoryId ? 'rgba(6,182,212,0.40)' : 'rgba(255,255,255,0.12)'}`,
                    color: globalCategoryId ? '#22D3EE' : 'rgba(255,255,255,0.40)',
                  }}
                >
                  <span>{globalCategories.find((c) => c.id === globalCategoryId)?.nameRu ?? 'Выберите тип...'}</span>
                  <span style={{ fontSize: 12, opacity: 0.5 }}>▼</span>
                </button>
              </GlassCard>
            )}

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

            {/* Характеристики */}
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
                    onClick={() => deleteAttr(a.id)}
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
                  onKeyDown={(e) => e.key === 'Enter' && addAttr()}
                  placeholder="Материал"
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <input
                  value={attrValue}
                  onChange={(e) => setAttrValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAttr()}
                  placeholder="Хлопок"
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <button
                  onClick={addAttr}
                  disabled={!attrName.trim() || !attrValue.trim() || attrSaving}
                  style={{
                    padding: '8px 12px', borderRadius: 10,
                    border: '1px solid rgba(167,139,250,0.30)',
                    background: 'rgba(167,139,250,0.12)',
                    color: '#A855F7', fontSize: 18, cursor: 'pointer', flexShrink: 0,
                    opacity: (!attrName.trim() || !attrValue.trim()) ? 0.5 : 1,
                  }}
                >
                  +
                </button>
              </div>
            </GlassCard>

            {/* Фото */}
            <GlassCard className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Фото товара
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={photoUploading}
                  style={{
                    fontSize: 12,
                    color: '#A855F7',
                    background: 'none',
                    border: 'none',
                    cursor: photoUploading ? 'wait' : 'pointer',
                    opacity: photoUploading ? 0.5 : 1,
                  }}
                >
                  {photoUploading ? `${uploadProgress}% загрузка...` : '+ Добавить'}
                </button>
              </div>

              {/* Прогресс бар при загрузке */}
              {photoUploading && (
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.10)', overflow: 'hidden' }}>
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
              )}

              {/* Grid фотографий */}
              {(product.images?.length ?? 0) > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.images!.map((img) => {
                    const url = getImageUrl(img.media.objectKey, img.media.id);
                    return (
                      <div key={img.id} style={{ position: 'relative', width: 72, height: 72 }}>
                        {url ? (
                          <img
                            src={url}
                            alt=""
                            style={{
                              width: 72,
                              height: 72,
                              objectFit: 'cover',
                              borderRadius: 10,
                              border: img.isPrimary
                                ? '2px solid #A855F7'
                                : '2px solid rgba(255,255,255,0.10)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 72,
                              height: 72,
                              borderRadius: 10,
                              background: 'rgba(255,255,255,0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 20,
                            }}
                          >
                            🖼
                          </div>
                        )}
                        {img.isPrimary && (
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              background: 'rgba(124,58,237,0.85)',
                              color: '#fff',
                              fontSize: 8,
                              fontWeight: 700,
                              padding: '1px 4px',
                              borderRadius: 4,
                            }}
                          >
                            MAIN
                          </span>
                        )}
                        <button
                          onClick={() => handleDeletePhoto(img.id)}
                          disabled={deletingImageId === img.id}
                          style={{
                            position: 'absolute',
                            top: -4,
                            right: -4,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'rgba(248,113,113,0.90)',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 9,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                          }}
                        >
                          {deletingImageId === img.id ? '…' : '✕'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '1px dashed rgba(167,139,250,0.30)',
                    borderRadius: 12,
                    padding: '16px 0',
                    background: 'rgba(167,139,250,0.05)',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  <p className="text-sm" style={{ color: 'rgba(167,139,250,0.70)' }}>📷 Добавить фото</p>
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAddPhoto}
              />
            </GlassCard>

            {/* Остаток по вариантам */}
            {product.variants && product.variants.length > 0 && (
              <GlassCard className="p-4 flex flex-col gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Остаток на складе
                </p>
                {product.variants.map((v) => {
                  const allValues = (product.optionGroups ?? []).flatMap((g) => g.values);
                  const label = v.optionValueIds.length > 0
                    ? v.optionValueIds
                        .map((vid) => allValues.find((val) => val.id === vid)?.value ?? vid)
                        .join(' / ')
                    : 'Без размера';
                  return (
                    <div key={v.id} className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center text-xs font-bold shrink-0"
                        style={{
                          minWidth: 44, height: 36, borderRadius: 8, padding: '0 8px',
                          background: 'rgba(167,139,250,0.12)',
                          border: '1px solid rgba(167,139,250,0.20)',
                          color: '#A855F7',
                        }}
                      >
                        {label}
                      </div>
                      <input
                        inputMode="numeric"
                        value={stockEdits[v.id] ?? (v.stockQuantity === 0 ? '' : String(v.stockQuantity))}
                        onChange={(e) =>
                          setStockEdits((prev) => ({
                            ...prev,
                            [v.id]: e.target.value.replace(/^0+(?=\d)/, ''),
                          }))
                        }
                        placeholder="0"
                        style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                      />
                      <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>шт</span>
                      <button
                        onClick={() => handleStockSave(v)}
                        disabled={stockSaving === v.id || stockEdits[v.id] === String(v.stockQuantity)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(52,211,153,0.25)',
                          background: 'rgba(52,211,153,0.10)',
                          color: '#34d399',
                          fontSize: 12,
                          cursor: 'pointer',
                          opacity: stockEdits[v.id] === String(v.stockQuantity) ? 0.4 : 1,
                          flexShrink: 0,
                        }}
                      >
                        {stockSaving === v.id ? '...' : '✓'}
                      </button>
                    </div>
                  );
                })}
              </GlassCard>
            )}

            <Button onClick={handleSave} disabled={!isValid || saving} className="w-full">
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />

            {product.status !== 'HIDDEN_BY_ADMIN' && (
              <div className="flex flex-col gap-2">
                {product.status === 'ACTIVE' && (
                  <Button variant="ghost" className="w-full" disabled={statusChanging} onClick={() => handleStatusChange('ARCHIVED')}>
                    {statusChanging ? '...' : '📦 Архивировать'}
                  </Button>
                )}
                {product.status === 'DRAFT' && (
                  <Button className="w-full" disabled={statusChanging} onClick={() => handleStatusChange('ACTIVE')}>
                    {statusChanging ? '...' : '▶ Опубликовать'}
                  </Button>
                )}
                {product.status === 'ARCHIVED' && (
                  <Button variant="ghost" className="w-full" disabled={statusChanging} onClick={() => handleStatusChange('DRAFT')}>
                    {statusChanging ? '...' : '📝 Восстановить в черновик'}
                  </Button>
                )}
              </div>
            )}

            {(product.status === 'DRAFT' || product.status === 'ARCHIVED' || product.status === 'HIDDEN_BY_ADMIN') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: 'rgba(248,113,113,0.70)',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '12px 0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Удалить товар
              </button>
            )}
          </>
        )}
      </div>
    </AppShell>
    </>
  );
}
