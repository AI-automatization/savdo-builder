import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiUpload, ApiError } from '@/lib/api';
import { CategoryModal } from '@/components/ui/CategoryModal';
import { useTelegram } from '@/providers/TelegramProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ImageCropper } from '@/components/ui/ImageCropper';
import { Select } from '@/components/ui/Select';
import { showToast } from '@/components/ui/Toast';
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
  slug?: string;
  nameRu: string;
  parentId?: string | null;
  level?: number;
  isLeaf?: boolean;
  iconEmoji?: string | null;
}

interface CategoryFilter {
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'text' | 'number' | 'select' | 'boolean' | 'color' | 'multi_select';
  options: string[] | null;
  unit?: string | null;
  isRequired?: boolean;
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

  // Фото — массив (TMA-MULTI-PHOTO-001). До 8 штук, первое = primary.
  const fileRef                         = useRef<HTMLInputElement>(null);
  const [photoFiles, setPhotoFiles]     = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [cropSrc, setCropSrc]           = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const MAX_PHOTOS = 8;

  // Категории
  const [categories, setCategories]           = useState<StoreCategory[]>([]);
  const [storeCategoryId, setStoreCategoryId] = useState<string>('');
  const [globalCategories, setGlobalCategories]   = useState<GlobalCategory[]>([]);
  const [globalCategoryId, setGlobalCategoryId]   = useState<string>('');
  const [categoryFilters, setCategoryFilters] = useState<CategoryFilter[]>([]);
  const [attrValues, setAttrValues] = useState<Record<string, string | boolean>>({});
  // TMA-DYNAMIC-VARIANT-FILTERS-001: multi_select поля категории формируют
  // ProductOptionGroup + ProductVariant matrix. Map: filterKey → { selectedValues, stockByValue }.
  const [variantOptions, setVariantOptions] = useState<Record<string, { selected: string[]; stock: Record<string, number> }>>({});
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

  const catsAbortRef = useRef<AbortController | null>(null);
  const filtersAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    catsAbortRef.current?.abort();
    const ac = new AbortController();
    catsAbortRef.current = ac;
    api<StoreCategory[]>('/seller/categories', { signal: ac.signal })
      .then((c) => { if (!ac.signal.aborted) setCategories(c); })
      .catch((err: unknown) => {
        if (ac.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
        showToast('Не удалось загрузить разделы магазина', 'error');
      });
    // Используем дерево с level/isLeaf/iconEmoji для cascade-modal
    api<GlobalCategory[]>('/storefront/categories/tree', { signal: ac.signal })
      .then((c) => { if (!ac.signal.aborted) setGlobalCategories(c); })
      .catch(() => {
        if (ac.signal.aborted) return;
        // Fallback: если эндпоинта нет (старая api версия) — обычный flat список
        api<GlobalCategory[]>('/storefront/categories', { signal: ac.signal })
          .then((c) => { if (!ac.signal.aborted) setGlobalCategories(c); })
          .catch((err: unknown) => {
            if (ac.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
            showToast('Не удалось загрузить категории', 'error');
          });
      });
    return () => ac.abort();
  }, []);

  // При выборе типа товара — загружаем характеристики этой категории
  useEffect(() => {
    filtersAbortRef.current?.abort();
    if (!globalCategoryId) {
      setCategoryFilters([]);
      setAttrValues({});
      setVariantOptions({});
      return;
    }
    const cat = globalCategories.find((c) => c.id === globalCategoryId);
    if (!cat?.slug) return;
    const ac = new AbortController();
    filtersAbortRef.current = ac;
    api<CategoryFilter[]>(`/storefront/categories/${cat.slug}/filters`, { signal: ac.signal })
      .then((f) => { if (!ac.signal.aborted) setCategoryFilters(f); })
      .catch(() => { if (!ac.signal.aborted) setCategoryFilters([]); });
    return () => ac.abort();
  }, [globalCategoryId, globalCategories]);

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

  // Категория имеет multi_select поля → они сами формируют варианты с
  // запасом per option. Хардкод-toggle "Товар с размерами" в этом случае
  // скрыт чтобы не дублировать (TMA-DYNAMIC-VARIANT-FILTERS-001).
  const multiSelectFilters = categoryFilters.filter((f) => f.fieldType === 'multi_select');
  const hasDynamicVariants = multiSelectFilters.some(
    (f) => (variantOptions[f.key]?.selected.length ?? 0) > 0,
  );

  // Required-характеристики типа товара должны быть заполнены
  const missingRequiredFilters = categoryFilters
    .filter((f) => f.isRequired)
    .filter((f) => {
      if (f.fieldType === 'boolean') return false; // boolean всегда есть
      if (f.fieldType === 'multi_select') {
        return (variantOptions[f.key]?.selected.length ?? 0) === 0;
      }
      const v = attrValues[f.key];
      return v === undefined || v === '' || v === null;
    });

  const isValid = title.trim().length >= 2 && Number(price) > 0 &&
    !!globalCategoryId &&
    missingRequiredFilters.length === 0 &&
    (hasDynamicVariants || !hasSizes || sizes.length > 0);

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
    if (photoFiles.length >= MAX_PHOTOS) {
      setError(`Максимум ${MAX_PHOTOS} фото на товар`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = (croppedFile: File) => {
    setCropSrc('');
    setPhotoFiles((prev) => [...prev, croppedFile]);
    const url = URL.createObjectURL(croppedFile);
    setPhotoPreviews((prev) => [...prev, url]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photoFiles.length) return;
    setPhotoFiles((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setPhotoPreviews((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  // Загружает одно фото и возвращает mediaFileId (для batch upload в submit).
  const uploadPhoto = async (file: File, idx: number): Promise<string> => {
    setUploadingIndex(idx);
    setUploadProgress(0);
    const form = new FormData();
    form.append('file', file);
    form.append('purpose', 'product_image');
    const { mediaFileId } = await apiUpload<{ mediaFileId: string; url: string }>(
      '/media/upload',
      form,
      setUploadProgress,
    );
    return mediaFileId;
  };

  const uploadPhotosForProduct = async (pid: string): Promise<void> => {
    setPhotoUploading(true);
    try {
      for (let i = 0; i < photoFiles.length; i++) {
        try {
          const mediaId = await uploadPhoto(photoFiles[i], i);
          // POST в /seller/products/:id/images — первое фото primary.
          await api(`/seller/products/${pid}/images`, {
            method: 'POST',
            body: { mediaId, isPrimary: i === 0, sortOrder: i },
          });
        } catch (err) {
          // TMA-PHOTO-UPLOAD-DIAG-001: показываем конкретную причину фейла
          // (storage unavailable / mime not allowed / size too big / 502).
          // Раньше генерик «Не удалось» — продавец не знал что делать.
          const reason = err instanceof Error ? err.message : 'неизвестная ошибка';
          throw new Error(`Фото #${i + 1}: ${reason}`);
        }
      }
    } finally {
      setPhotoUploading(false);
      setUploadingIndex(-1);
    }
  };

  const handleSave = async (publish: boolean) => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      // 1. Создать товар
      // Собираем характеристики (только заполненные значения)
      const filledAttrs: Record<string, string | boolean | number> = {};
      for (const [k, v] of Object.entries(attrValues)) {
        if (v === '' || v === null || v === undefined) continue;
        filledAttrs[k] = v;
      }
      const product = await api<{ id: string }>('/seller/products', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
          ...(storeCategoryId ? { storeCategoryId } : {}),
          ...(globalCategoryId ? { globalCategoryId } : {}),
          ...(Object.keys(filledAttrs).length > 0 ? { attributesJson: filledAttrs } : {}),
        },
      });
      const pid = product.id;
      const sku = slugify(title);

      if (hasDynamicVariants) {
        // 2а. Динамические варианты из multi_select полей категории
        // (TMA-DYNAMIC-VARIANT-FILTERS-001). Поддерживаем несколько групп
        // (если категория имеет 2+ multi_select — Размер × Цвет = matrix).
        const activeGroups = multiSelectFilters
          .filter((f) => (variantOptions[f.key]?.selected.length ?? 0) > 0);

        // Создаём группы и значения параллельно (для одной группы — порядок
        // сохраняется через sortOrder).
        const groupValueMap: Record<string, { groupId: string; valueIds: Record<string, string> }> = {};
        for (let g = 0; g < activeGroups.length; g++) {
          const f = activeGroups[g];
          const group = await api<{ id: string }>(`/seller/products/${pid}/option-groups`, {
            method: 'POST',
            body: { name: f.nameRu, code: f.key, sortOrder: g },
          });
          const valueIds: Record<string, string> = {};
          const sel = variantOptions[f.key].selected;
          for (let i = 0; i < sel.length; i++) {
            const opt = sel[i];
            const val = await api<{ id: string }>(`/seller/products/${pid}/option-groups/${group.id}/values`, {
              method: 'POST',
              body: { value: opt, code: opt, sortOrder: i },
            });
            valueIds[opt] = val.id;
          }
          groupValueMap[f.key] = { groupId: group.id, valueIds };
        }

        // Cartesian product: создаём по варианту на каждую комбинацию.
        // Для одной группы — стандарт (один опшн на вариант).
        // Для двух групп — каждая комбинация делит общий stock пополам поровну
        // как fallback (точная matrix-разбивка stock — отдельная UI задача).
        function cartesian(keys: string[]): string[][] {
          if (keys.length === 0) return [[]];
          const [first, ...rest] = keys;
          const sub = cartesian(rest);
          return variantOptions[first].selected.flatMap((v) =>
            sub.map((tail) => [v, ...tail]),
          );
        }
        const groupKeys = activeGroups.map((f) => f.key);
        const combinations = cartesian(groupKeys);

        for (let i = 0; i < combinations.length; i++) {
          const combo = combinations[i];
          // stock: для одной группы берём stock конкретной option; для нескольких
          // распределяем equally — продавец потом доуточнит в EditProductPage.
          const stockQuantity = combo.length === 1
            ? (variantOptions[activeGroups[0].key].stock[combo[0]] ?? 0)
            : Math.floor(
                combo.reduce((sum, v, idx) => sum + (variantOptions[activeGroups[idx].key].stock[v] ?? 0), 0)
                / combo.length,
              );
          const optionValueIds = combo.map((v, idx) => groupValueMap[activeGroups[idx].key].valueIds[v]);
          const variantSku = `${sku}-${combo.join('-')}`;
          await api(`/seller/products/${pid}/variants`, {
            method: 'POST',
            body: { sku: variantSku, stockQuantity, optionValueIds },
          });
        }
      } else if (hasSizes && sizes.length > 0) {
        // 2а (legacy). Хардкод-блок "Товар с размерами" — fallback если в
        // категории нет multi_select. Будет удалён после миграции seed на
        // CategoryFilter с multi_select для всех категорий с размерами.
        const group = await api<{ id: string }>(`/seller/products/${pid}/option-groups`, {
          method: 'POST',
          body: { name: 'Размер', code: 'size', sortOrder: 0 },
        });
        const gid = group.id;
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
        // 2б. Простой вариант без вариативности
        await api(`/seller/products/${pid}/variants`, {
          method: 'POST',
          body: { sku, stockQuantity: Math.max(0, Number(stock) || 0) },
        });
      }

      // 3. Сохранить атрибуты. Если часть упала — товар уже создан,
      // не блокируем UX, переводим в редактор для retry.
      const failedAttrs: string[] = [];
      for (let i = 0; i < attrs.length; i++) {
        const a = attrs[i];
        if (a.name.trim() && a.value.trim()) {
          try {
            await api(`/seller/products/${pid}/attributes`, {
              method: 'POST',
              body: { name: a.name.trim(), value: a.value.trim(), sortOrder: i },
            });
          } catch {
            failedAttrs.push(a.name.trim());
          }
        }
      }
      if (failedAttrs.length > 0) {
        showToast(`⚠️ Не сохранились характеристики: ${failedAttrs.join(', ')}. Добавьте в редакторе.`);
      }

      // 4. Загрузить фото (TMA-MULTI-PHOTO-001: массив, не одно). Ошибка
      // фото не отменяет товар — переход в редактор для retry.
      if (photoFiles.length > 0) {
        try {
          await uploadPhotosForProduct(pid);
        } catch (photoErr: unknown) {
          const isStorageDown = photoErr instanceof ApiError && photoErr.status === 503;
          // TMA-PHOTO-UPLOAD-DIAG-001: настоящий error.message теперь
          // включает причину (см. uploadPhotosForProduct).
          const detail = photoErr instanceof Error ? photoErr.message : 'часть фото не загружена';
          tg?.HapticFeedback.notificationOccurred('warning');
          navigate(`/seller/products/${pid}/edit`, {
            state: {
              photoError: isStorageDown
                ? 'Загрузка фото временно недоступна — попробуйте позже'
                : `${detail}. Попробуйте добавить здесь.`,
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
    
      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
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
            leafOnly
          />
        )}

        {/* Динамические характеристики из CategoryFilter */}
        {globalCategoryId && categoryFilters.length > 0 && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Характеристики этого типа
            </label>
            {categoryFilters.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {f.nameRu}
                  {f.unit && <span style={{ color: 'rgba(255,255,255,0.35)' }}> ({f.unit})</span>}
                  {f.isRequired && <span style={{ color: '#f87171' }}> *</span>}
                </label>
                {f.fieldType === 'select' && f.options ? (
                  <Select
                    value={String(attrValues[f.key] ?? '')}
                    onChange={(v) => setAttrValues((prev) => ({ ...prev, [f.key]: v }))}
                    options={f.options.map((opt) => ({
                      value: opt,
                      label: f.unit ? `${opt} ${f.unit}` : opt,
                    }))}
                    placeholder="— выберите —"
                    clearable={!f.isRequired}
                    ariaLabel={f.nameRu}
                  />
                ) : f.fieldType === 'boolean' ? (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(attrValues[f.key])}
                      onChange={(e) => setAttrValues((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                    />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.70)' }}>Да</span>
                  </label>
                ) : f.fieldType === 'number' ? (
                  <input
                    type="number"
                    value={String(attrValues[f.key] ?? '')}
                    onChange={(e) => setAttrValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.unit ? `например 32 ${f.unit}` : ''}
                    style={{ ...inputStyle, padding: '10px 14px', fontSize: 13 }}
                  />
                ) : f.fieldType === 'multi_select' && f.options ? (
                  // Несколько значений = варианты товара. Показываем chips-выбор +
                  // под ним блок «Остаток по {nameRu}» с input на каждое выбранное.
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Отметьте все варианты которые есть в наличии
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.options.map((opt) => {
                        const cur = variantOptions[f.key];
                        const active = cur?.selected.includes(opt) ?? false;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setVariantOptions((prev) => {
                                const cur = prev[f.key] ?? { selected: [], stock: {} };
                                const isOn = cur.selected.includes(opt);
                                const nextSel = isOn
                                  ? cur.selected.filter((s) => s !== opt)
                                  : [...cur.selected, opt];
                                const nextStock = { ...cur.stock };
                                if (isOn) delete nextStock[opt]; else nextStock[opt] ??= 0;
                                return { ...prev, [f.key]: { selected: nextSel, stock: nextStock } };
                              });
                            }}
                            style={{
                              minHeight: 36,
                              padding: '6px 12px',
                              borderRadius: 10,
                              border: `1px solid ${active ? 'rgba(167,139,250,0.50)' : 'rgba(255,255,255,0.12)'}`,
                              background: active ? 'rgba(167,139,250,0.20)' : 'rgba(255,255,255,0.05)',
                              color: active ? '#A855F7' : 'rgba(255,255,255,0.70)',
                              fontSize: 13,
                              fontWeight: active ? 600 : 500,
                              cursor: 'pointer',
                            }}
                          >
                            {opt}{f.unit ? ` ${f.unit}` : ''}
                          </button>
                        );
                      })}
                    </div>
                    {(variantOptions[f.key]?.selected.length ?? 0) > 0 && (
                      <div className="flex flex-col gap-1.5 mt-1 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          Остаток по {f.nameRu.toLowerCase()}
                        </p>
                        {variantOptions[f.key].selected.map((opt) => (
                          <div key={opt} className="flex items-center gap-2">
                            <div
                              className="flex items-center justify-center text-xs font-bold shrink-0"
                              style={{
                                minWidth: 44, height: 36, padding: '0 8px', borderRadius: 8,
                                background: 'rgba(167,139,250,0.15)',
                                border: '1px solid rgba(167,139,250,0.25)',
                                color: '#A855F7',
                              }}
                            >
                              {opt}{f.unit ? ` ${f.unit}` : ''}
                            </div>
                            <input
                              inputMode="numeric"
                              value={variantOptions[f.key].stock[opt] || ''}
                              onChange={(e) => {
                                const n = Math.max(0, Number(e.target.value) || 0);
                                setVariantOptions((prev) => ({
                                  ...prev,
                                  [f.key]: {
                                    ...prev[f.key],
                                    stock: { ...prev[f.key].stock, [opt]: n },
                                  },
                                }));
                              }}
                              placeholder="0"
                              style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                            />
                            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>шт</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    value={String(attrValues[f.key] ?? '')}
                    onChange={(e) => setAttrValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder=""
                    style={{ ...inputStyle, padding: '10px 14px', fontSize: 13 }}
                  />
                )}
              </div>
            ))}
          </GlassCard>
        )}

        {/* Дополнительные характеристики (свободная форма) */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Доп. характеристики
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

        {/* Фото товара (TMA-MULTI-PHOTO-001) — массив до 8 шт, первое = главное */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Фото товара {photoPreviews.length > 0 && (
                <span style={{ color: 'rgba(167,139,250,0.65)' }}>· {photoPreviews.length}/{MAX_PHOTOS}</span>
              )}
            </p>
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photoPreviews.map((preview, idx) => (
                <div
                  key={preview}
                  style={{
                    position: 'relative',
                    aspectRatio: '1/1',
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: idx === 0 ? '2px solid rgba(168,85,247,0.55)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <img
                    src={preview}
                    alt={`фото ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  {idx === 0 && (
                    <span
                      style={{
                        position: 'absolute', top: 4, left: 4,
                        background: 'rgba(168,85,247,0.85)', color: '#fff',
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, letterSpacing: 0.3,
                      }}
                    >
                      ГЛАВНОЕ
                    </span>
                  )}
                  {photoUploading && uploadingIndex === idx && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.55)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: 4,
                    }}>
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{uploadProgress}%</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label="Удалить"
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 24, height: 24, borderRadius: 12,
                      background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.18)',
                      color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                  {photoPreviews.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 4, left: 4, display: 'flex', gap: 3 }}>
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, idx - 1)}
                        disabled={idx === 0}
                        aria-label="Влево"
                        style={{
                          width: 22, height: 22, borderRadius: 11,
                          background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.85)', fontSize: 11, padding: 0,
                          opacity: idx === 0 ? 0.4 : 1, cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(idx, idx + 1)}
                        disabled={idx === photoPreviews.length - 1}
                        aria-label="Вправо"
                        style={{
                          width: 22, height: 22, borderRadius: 11,
                          background: 'rgba(0,0,0,0.62)', border: '1px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.85)', fontSize: 11, padding: 0,
                          opacity: idx === photoPreviews.length - 1 ? 0.4 : 1,
                          cursor: idx === photoPreviews.length - 1 ? 'not-allowed' : 'pointer',
                        }}
                      >
                        ▶
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {photoPreviews.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
              style={{
                border: '1px dashed rgba(167,139,250,0.30)',
                borderRadius: 12,
                padding: photoPreviews.length === 0 ? '20px 0' : '14px 0',
                background: 'rgba(167,139,250,0.05)',
                cursor: photoUploading ? 'wait' : 'pointer',
                width: '100%',
                opacity: photoUploading ? 0.6 : 1,
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(167,139,250,0.80)' }}>
                {photoPreviews.length === 0 ? '📷 Добавить фото' : '➕ Добавить ещё фото'}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                JPG, PNG, WEBP · до {MAX_PHOTOS} шт
              </p>
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

        {/* Остаток / размеры. Показываем только если категория НЕ предоставляет
            multi_select-фильтры (тогда варианты строятся динамически выше). */}
        {multiSelectFilters.length === 0 && (
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
        )}

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
    
    </>
  );
}
