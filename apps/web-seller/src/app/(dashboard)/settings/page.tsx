'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Link from 'next/link';
import { useStore, useUpdateStore, useSellerProfile, useUpdateSellerProfile, useStoreCategories } from '@/hooks/use-seller';
import { ChevronRight } from 'lucide-react';
import { useNotifPreferences, useUpdateNotifPreferences } from '@/hooks/use-notifications';
import type { Store } from 'types';
import { ImageUploader } from '@/components/image-uploader';
import { Select, type SelectOption } from '@/components/select';
import { card, colors, inputStyle as inputStyleBase } from '@/lib/styles';

// Backend returns deliverySettings nested in Store response (not yet in shared types)
type StoreWithDelivery = Store & {
  deliverySettings?: {
    deliveryFeeType: 'fixed' | 'manual' | 'none';
    fixedDeliveryFee: number;
  } | null;
};

const inputBase =
  'h-10 px-3.5 rounded-md text-sm focus:outline-none focus:ring-2 w-full';

const inputStyle = {
  ...inputStyleBase,
  '--tw-ring-color': colors.accentBorder,
} as React.CSSProperties;

const errorStyle = { color: colors.danger } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg overflow-hidden" style={card}>
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}>
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{title}</p>
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
      <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: colors.textDim }}>
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
    <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ background: 'rgba(52,211,153,0.15)', color: colors.success, border: '1px solid rgba(52,211,153,0.30)' }}>
      Сохранено
    </span>
  );
}

function StoreCategoriesSection() {
  const { data: categories = [], isLoading } = useStoreCategories();
  const count = categories.length;

  return (
    <Section title="Категории магазина">
      <Link
        href="/store/categories"
        className="flex items-center gap-3 -mx-1 px-3 py-2.5 rounded-lg transition-colors row-hoverable"
        style={{ color: colors.textPrimary }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Управление категориями</p>
          <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
            {isLoading
              ? 'Загрузка…'
              : count === 0
                ? 'Группируйте товары на витрине магазина'
                : `${count} ${count === 1 ? 'категория' : count < 5 ? 'категории' : 'категорий'} — открыть для редактирования`}
          </p>
        </div>
        <ChevronRight size={16} aria-hidden="true" style={{ color: colors.textDim }} />
      </Link>
    </Section>
  );
}

// ── Delivery Settings Form ─────────────────────────────────────────────────────

type DeliveryFormValues = {
  deliveryFeeType: 'fixed' | 'manual' | 'none';
  deliveryFeeAmount: string;
};

function DeliverySettingsSection() {
  const { data: store, isLoading } = useStore();
  const updateStore = useUpdateStore();
  const [saved, setSaved] = useState(false);

  const storeWithDelivery = store as StoreWithDelivery | undefined;
  const currentType = storeWithDelivery?.deliverySettings?.deliveryFeeType ?? 'none';
  const currentAmount = storeWithDelivery?.deliverySettings?.fixedDeliveryFee ?? 0;

  const { register, handleSubmit, reset, watch, control, formState: { isDirty } } = useForm<DeliveryFormValues>();
  const feeType = watch('deliveryFeeType');

  useEffect(() => {
    if (storeWithDelivery) {
      reset({
        deliveryFeeType: currentType,
        deliveryFeeAmount: currentAmount > 0 ? String(currentAmount) : '',
      });
    }
  }, [storeWithDelivery?.id, currentType, currentAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(values: DeliveryFormValues) {
    await updateStore.mutateAsync({
      deliveryFeeType: values.deliveryFeeType,
      deliveryFeeAmount: values.deliveryFeeType === 'fixed' ? Number(values.deliveryFeeAmount) || 0 : undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    reset(values);
  }

  const FEE_TYPE_LABELS: Record<string, string> = {
    none:   'Бесплатно',
    fixed:  'Фиксированная сумма',
    manual: 'Договорная',
  };

  const feeTypeOptions: SelectOption[] = useMemo(
    () => Object.entries(FEE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (isLoading) {
    return (
      <div className="rounded-lg overflow-hidden" style={card}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}>
          <div className="h-3.5 w-32 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[100, 80].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, background: colors.surfaceElevated }} />
              <div className="h-10 rounded-md animate-pulse" style={{ background: colors.surfaceElevated }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Доставка">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Стоимость доставки">
          <Controller
            name="deliveryFeeType"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? 'none'}
                onChange={(v) => field.onChange(v as DeliveryFormValues['deliveryFeeType'])}
                options={feeTypeOptions}
                searchable={false}
                ariaLabel="Тип стоимости доставки"
              />
            )}
          />
        </Field>

        {feeType === 'fixed' && (
          <Field label="Сумма доставки (сум)">
            <input
              {...register('deliveryFeeAmount', {
                pattern: { value: /^\d+$/, message: 'Только целые числа' },
              })}
              type="number"
              min={0}
              className={inputBase}
              style={inputStyle}
              placeholder="15000"
            />
          </Field>
        )}

        {feeType === 'manual' && (
          <p className="text-xs" style={{ color: colors.textMuted }}>
            Сумма доставки обсуждается с покупателем индивидуально.
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!isDirty || updateStore.isPending}
            className="px-5 py-2.5 rounded-md text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
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
      <div className="rounded-lg overflow-hidden" style={card}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}>
          <div className="h-3.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[80, 120, 60].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, background: colors.surfaceElevated }} />
              <div className="h-10 rounded-md animate-pulse" style={{ background: colors.surfaceElevated }} />
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
            className="px-3.5 py-2.5 rounded-md text-sm focus:outline-none focus:ring-2 resize-none w-full"
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
            className="px-5 py-2.5 rounded-md text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
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

  const { register, handleSubmit, reset, control, formState: { errors, isDirty } } = useForm<ProfileFormValues>();

  const languageOptions: SelectOption[] = useMemo(
    () => [
      { value: 'ru', label: 'Русский' },
      { value: 'uz', label: "O'zbekcha" },
    ],
    [],
  );

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
      <div className="rounded-lg overflow-hidden" style={card}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}>
          <div className="h-3.5 w-28 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[100, 80].map((w, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 rounded-full animate-pulse" style={{ width: w, background: colors.surfaceElevated }} />
              <div className="h-10 rounded-md animate-pulse" style={{ background: colors.surfaceElevated }} />
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
          <Controller
            name="languageCode"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? 'ru'}
                onChange={(v) => field.onChange(v as ProfileFormValues['languageCode'])}
                options={languageOptions}
                searchable={false}
                ariaLabel="Язык интерфейса"
              />
            )}
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!isDirty || updateProfile.isPending}
            className="px-5 py-2.5 rounded-md text-sm font-semibold disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
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

// ── Notification Preferences Section ──────────────────────────────────────────

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: colors.textDim }}>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="relative flex-shrink-0 rounded-full transition-colors disabled:opacity-40"
        style={{
          width: 40,
          height: 22,
          background: checked ? colors.accent : colors.surfaceElevated,
          border: `1px solid ${colors.border}`,
        }}
      >
        <span
          className="absolute top-[2px] rounded-full transition-transform"
          style={{
            width: 16,
            height: 16,
            background: checked ? colors.bg : colors.textMuted,
            left: 2,
            transform: checked ? 'translateX(18px)' : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
}

function NotifPreferencesSection() {
  const { data: prefs, isLoading } = useNotifPreferences();
  const update = useUpdateNotifPreferences();
  const [saved, setSaved] = useState(false);

  async function toggle(key: 'telegramEnabled' | 'webPushEnabled' | 'mobilePushEnabled', value: boolean) {
    await update.mutateAsync({ [key]: value });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="rounded-lg overflow-hidden" style={card}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}>
          <div className="h-3.5 w-40 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col gap-1.5">
                <div className="h-3.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
                <div className="h-2.5 w-52 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
              </div>
              <div className="w-10 h-[22px] rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Уведомления">
      <ToggleRow
        label="Telegram-уведомления"
        description="Новые заказы и изменения статусов — в ваш Telegram"
        checked={prefs?.telegramEnabled ?? false}
        disabled={update.isPending}
        onChange={(v) => toggle('telegramEnabled', v)}
      />
      <ToggleRow
        label="Push в браузере"
        description="Уведомления на этом устройстве даже если вкладка закрыта"
        checked={prefs?.webPushEnabled ?? false}
        disabled={update.isPending}
        onChange={(v) => toggle('webPushEnabled', v)}
      />
      <ToggleRow
        label="Push в мобильном"
        description="Уведомления в Telegram-приложении продавца"
        checked={prefs?.mobilePushEnabled ?? false}
        disabled={update.isPending}
        onChange={(v) => toggle('mobilePushEnabled', v)}
      />
      {saved && (
        <p className="text-xs" style={{ color: colors.success }}>Сохранено</p>
      )}
      {update.isError && (
        <p className="text-xs" style={errorStyle}>Ошибка сохранения</p>
      )}
    </Section>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>Настройки</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <StoreSettingsSection />
          <ProfileSettingsSection />
        </div>
        <div className="flex flex-col gap-5 min-w-0">
          <DeliverySettingsSection />
          <StoreCategoriesSection />
          <NotifPreferencesSection />
        </div>
      </div>
    </div>
  );
}
