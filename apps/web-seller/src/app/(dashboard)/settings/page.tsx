'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStore, useUpdateStore, useSellerProfile, useUpdateSellerProfile, useStoreCategories, useCreateStoreCategory, useUpdateStoreCategory, useDeleteStoreCategory } from '@/hooks/use-seller';
import type { StoreCategory } from 'types';
import { ImageUploader } from '@/components/image-uploader';

const glass = {
  background: 'rgba(255,255,255,0.08)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.13)',
} as const;

const inputBase =
  'h-10 px-3.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 w-full';

const inputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  '--tw-ring-color': 'rgba(167,139,250,0.50)',
} as React.CSSProperties;

const errorStyle = { color: 'rgba(248,113,113,.85)' } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={glass}>
      <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <div className="px-5 py-4 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.38)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}

function SavedBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg" style={{ background: 'rgba(52,211,153,0.15)', color: 'rgba(52,211,153,.90)' }}>
      Сохранено
    </span>
  );
}

function StoreCategoriesSection() {
  const { data: categories = [], isLoading } = useStoreCategories();
  const create = useCreateStoreCategory();
  const update = useUpdateStoreCategory();
  const remove = useDeleteStoreCategory();

  const [editingId, setEditingId]     = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [adding, setAdding]           = useState(false);
  const [newValue, setNewValue]       = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  function startEdit(cat: StoreCategory) {
    setEditingId(cat.id);
    setEditValue(cat.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function saveEdit(id: string) {
    const name = editValue.trim();
    if (!name) { cancelEdit(); return; }
    await update.mutateAsync({ id, name });
    cancelEdit();
  }

  function startAdd() {
    setAdding(true);
    setNewValue('');
  }

  function cancelAdd() {
    setAdding(false);
    setNewValue('');
  }

  async function saveAdd() {
    const name = newValue.trim();
    if (!name) { cancelAdd(); return; }
    await create.mutateAsync({ name, sortOrder: categories.length + 1 });
    cancelAdd();
  }

  async function handleDelete(id: string) {
    setDeleteError(null);
    try {
      await remove.mutateAsync(id);
    } catch {
      setDeleteError('Нельзя удалить категорию, к которой привязаны товары.');
    }
  }

  useEffect(() => {
    if (adding) newInputRef.current?.focus();
  }, [adding]);

  const rowInputStyle: React.CSSProperties = {
    flex: 1,
    background: 'transparent',
    border: '1px solid rgba(167,139,250,0.50)',
    borderRadius: 8,
    padding: '4px 8px',
    fontSize: 13,
    color: '#fff',
    outline: 'none',
  };

  const confirmBtn: React.CSSProperties = {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 7,
    color: '#34d399',
    background: 'rgba(52,211,153,0.12)',
    border: '1px solid rgba(52,211,153,0.20)',
    cursor: 'pointer',
  };

  const cancelBtn: React.CSSProperties = {
    fontSize: 12,
    padding: '3px 8px',
    borderRadius: 7,
    color: 'rgba(255,255,255,0.40)',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    cursor: 'pointer',
  };

  const rowBorder = { borderBottom: '1px solid rgba(255,255,255,0.06)' };

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-3.5 w-44 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-2">
          {[140, 100, 160].map((w, i) => (
            <div key={i} className="h-8 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: w }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Категории магазина">
      {categories.length === 0 && !adding && (
        <p className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Категории помогают покупателям ориентироваться в вашем магазине.
        </p>
      )}

      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-2 py-1.5" style={rowBorder}>
          {editingId === cat.id ? (
            <>
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  saveEdit(cat.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                style={rowInputStyle}
              />
              <button type="button" style={confirmBtn} onClick={() => saveEdit(cat.id)}>✓</button>
              <button
                type="button"
                style={cancelBtn}
                onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <span
                className="flex-1 text-sm text-white cursor-pointer transition-colors hover:text-purple-300"
                onClick={() => startEdit(cat)}
              >
                {cat.name}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(cat.id)}
                disabled={remove.isPending}
                className="text-xs transition-opacity opacity-30 hover:opacity-70 disabled:opacity-20"
                style={{ color: '#f87171' }}
                aria-label="Удалить"
              >
                🗑
              </button>
            </>
          )}
        </div>
      ))}

      {adding && (
        <div className="flex items-center gap-2 py-1.5" style={rowBorder}>
          <input
            ref={newInputRef}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  saveAdd();
              if (e.key === 'Escape') cancelAdd();
            }}
            placeholder="Название категории"
            style={rowInputStyle}
          />
          <button
            type="button"
            style={confirmBtn}
            onClick={saveAdd}
            disabled={create.isPending}
          >
            {create.isPending ? '...' : '✓'}
          </button>
          <button
            type="button"
            style={cancelBtn}
            onMouseDown={(e) => { e.preventDefault(); cancelAdd(); }}
          >
            ✕
          </button>
        </div>
      )}

      {deleteError && (
        <p className="text-xs mt-1" style={{ color: 'rgba(248,113,113,.80)' }}>{deleteError}</p>
      )}

      {!adding && (
        <button
          type="button"
          onClick={startAdd}
          className="mt-1 text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: '#A78BFA' }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Добавить категорию
        </button>
      )}
    </Section>
  );
}

// ── Store Settings Form ────────────────────────────────────────────────────────

type StoreFormValues = {
  name: string;
  description: string;
  city: string;
  region: string;
  telegramContactLink: string;
};

function StoreSettingsSection() {
  const { data: store, isLoading } = useStore();
  const updateStore = useUpdateStore();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<StoreFormValues>();
  const [logoMediaId, setLogoMediaId]   = useState<string | null>(null);
  const [coverMediaId, setCoverMediaId] = useState<string | null>(null);

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        description: store.description ?? '',
        city: store.city,
        region: store.region ?? '',
        telegramContactLink: store.telegramContactLink ?? '',
      });
    }
  }, [store, reset]);

  async function onSubmit(values: StoreFormValues) {
    await updateStore.mutateAsync({
      name:                values.name,
      description:         values.description || undefined,
      city:                values.city,
      region:              values.region || undefined,
      telegramContactLink: values.telegramContactLink || undefined,
      logoMediaId:         logoMediaId ?? undefined,
      coverMediaId:        coverMediaId ?? undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    reset(values);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-3.5 w-36 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[80, 120, 60].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Магазин">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Cover */}
        <Field label="Обложка магазина">
          <ImageUploader
            value={coverMediaId}
            onChange={setCoverMediaId}
            purpose="store_banner"
            previewUrl={store?.coverUrl ?? null}
            aspectRatio="3/1"
          />
        </Field>

        {/* Logo */}
        <Field label="Логотип">
          <div style={{ width: 72, height: 72 }}>
            <ImageUploader
              value={logoMediaId}
              onChange={setLogoMediaId}
              purpose="store_logo"
              previewUrl={store?.logoUrl ?? null}
            />
          </div>
        </Field>

        <Field label="Название магазина" error={errors.name?.message}>
          <input
            {...register('name', { required: 'Обязательное поле', minLength: { value: 2, message: 'Минимум 2 символа' }, maxLength: { value: 255, message: 'Максимум 255 символов' } })}
            className={inputBase}
            style={inputStyle}
            placeholder="Nike Uzbekistan"
          />
        </Field>

        <Field label="Описание" error={errors.description?.message}>
          <textarea
            {...register('description', { maxLength: { value: 2000, message: 'Максимум 2000 символов' } })}
            rows={3}
            className="px-3.5 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 resize-none w-full"
            style={inputStyle}
            placeholder="Расскажите о вашем магазине..."
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Город" error={errors.city?.message}>
            <input
              {...register('city', { required: 'Обязательное поле', minLength: { value: 2, message: 'Минимум 2 символа' } })}
              className={inputBase}
              style={inputStyle}
              placeholder="Ташкент"
            />
          </Field>

          <Field label="Регион" error={errors.region?.message}>
            <input
              {...register('region', { maxLength: { value: 100, message: 'Максимум 100 символов' } })}
              className={inputBase}
              style={inputStyle}
              placeholder="Ташкентская область"
            />
          </Field>
        </div>

        <Field label="Telegram-контакт" error={errors.telegramContactLink?.message}>
          <input
            {...register('telegramContactLink')}
            className={inputBase}
            style={inputStyle}
            placeholder="https://t.me/yourstore"
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!isDirty || updateStore.isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 16px rgba(167,139,250,.30)' }}
          >
            {updateStore.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
          <SavedBadge show={saved} />
          {updateStore.isError && (
            <span className="text-xs" style={errorStyle}>Ошибка сохранения</span>
          )}
        </div>
      </form>
    </Section>
  );
}

// ── Profile Settings Form ──────────────────────────────────────────────────────

type ProfileFormValues = {
  fullName: string;
  telegramUsername: string;
  languageCode: 'ru' | 'uz';
};

function ProfileSettingsSection() {
  const { data: profile, isLoading } = useSellerProfile();
  const updateProfile = useUpdateSellerProfile();
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<ProfileFormValues>();

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName,
        telegramUsername: profile.telegramUsername ?? '',
        languageCode: profile.languageCode,
      });
    }
  }, [profile, reset]);

  async function onSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync({
      fullName: values.fullName,
      telegramUsername: values.telegramUsername || undefined,
      languageCode: values.languageCode,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    reset(values);
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl overflow-hidden" style={glass}>
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="h-3.5 w-28 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.12)' }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[100, 80].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, background: 'rgba(255,255,255,0.08)' }} />
              <div className="h-10 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Профиль продавца">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Имя / название компании" error={errors.fullName?.message}>
          <input
            {...register('fullName', { required: 'Обязательное поле' })}
            className={inputBase}
            style={inputStyle}
            placeholder="Алишер Каримов"
          />
        </Field>

        <Field label="Telegram username" error={errors.telegramUsername?.message}>
          <input
            {...register('telegramUsername', {
              pattern: { value: /^(@[a-zA-Z0-9_]{3,32})?$/, message: 'Формат: @username (3–32 символа)' },
            })}
            className={inputBase}
            style={inputStyle}
            placeholder="@yourhandle"
          />
        </Field>

        <Field label="Язык интерфейса" error={errors.languageCode?.message}>
          <select
            {...register('languageCode')}
            className={inputBase}
            style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties}
          >
            <option value="ru" style={{ background: '#1a1a2e' }}>Русский</option>
            <option value="uz" style={{ background: '#1a1a2e' }}>O&apos;zbekcha</option>
          </select>
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!isDirty || updateProfile.isPending}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 16px rgba(167,139,250,.30)' }}
          >
            {updateProfile.isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
          <SavedBadge show={saved} />
          {updateProfile.isError && (
            <span className="text-xs" style={errorStyle}>Ошибка сохранения</span>
          )}
        </div>
      </form>
    </Section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-xl">
      <h1 className="text-xl font-bold text-white">Настройки</h1>
      <StoreSettingsSection />
      <StoreCategoriesSection />
      <ProfileSettingsSection />
    </div>
  );
}
