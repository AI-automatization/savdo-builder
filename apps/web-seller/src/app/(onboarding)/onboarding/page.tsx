'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useCreateStore, useSubmitStore, useStore } from '../../../hooks/use-seller';
import { useUpdateSellerProfile } from '../../../hooks/use-seller';
import { useCreateProduct } from '../../../hooks/use-products';
import { useAuth } from '../../../lib/auth/context';
import { applySeller } from '../../../lib/api/seller.api';
import { track } from '../../../lib/analytics';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

const glass = {
  background:           "rgba(255,255,255,0.07)",
  backdropFilter:       "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border:               "1px solid rgba(255,255,255,0.11)",
} as const;

const inputStyle = {
  background:   "rgba(255,255,255,0.06)",
  border:       "1px solid rgba(255,255,255,0.13)",
  color:        "#fff",
  borderRadius: "0.75rem",
  outline:      "none",
  width:        "100%",
  padding:      "0.625rem 0.875rem",
  fontSize:     "0.875rem",
} as const;

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
      {children}{required && <span style={{ color: "#f87171" }}> *</span>}
    </span>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs" style={{ color: "#f87171" }}>{message}</p>;
}

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      className="px-4 py-3 rounded-xl text-sm"
      style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.25)", color: "#fca5a5" }}
    >
      {message}
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Магазин" },
  { label: "Контакты" },
  { label: "Товар" },
  { label: "Готово" },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const done    = i < step;
        const active  = i === step;
        return (
          <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
              style={{
                background: done
                  ? "linear-gradient(135deg, #7C3AED, #A78BFA)"
                  : active
                    ? "rgba(167,139,250,.20)"
                    : "rgba(255,255,255,0.08)",
                border: active ? "1px solid rgba(167,139,250,.60)" : "1px solid transparent",
                color: done ? "#fff" : active ? "#A78BFA" : "rgba(255,255,255,0.25)",
              }}
            >
              {done ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: active ? "#A78BFA" : "rgba(255,255,255,0.25)" }}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px mx-1"
                style={{ background: done ? "rgba(167,139,250,.50)" : "rgba(255,255,255,0.08)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Store name + slug ─────────────────────────────────────────────────

interface Step1Data { name: string; slug: string }

function Step1({ onNext }: { onNext: (data: Step1Data) => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Step1Data>();
  const name = watch('name', '');

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue('name', e.target.value);
    setValue('slug', toSlug(e.target.value));
  }

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Создайте магазин</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          Придумайте название — покупатели увидят его первым
        </p>
      </div>

      <div>
        <Label required>Название магазина</Label>
        <input
          className="focus:outline-none"
          style={inputStyle}
          placeholder="Texno Shop"
          {...register('name', {
            required: 'Введите название магазина',
            minLength: { value: 2, message: 'Минимум 2 символа' },
            maxLength: { value: 255, message: 'Максимум 255 символов' },
            onChange: handleNameChange,
          })}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label>Адрес магазина</Label>
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.13)" }}>
          <span
            className="px-3 py-[0.625rem] text-sm flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", borderRight: "1px solid rgba(255,255,255,0.10)" }}
          >
            savdo.uz/
          </span>
          <input
            className="flex-1 px-3 py-[0.625rem] text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
            placeholder="texno-shop"
            {...register('slug', {
              required: 'Укажите адрес',
              pattern: { value: /^[a-z0-9-]+$/, message: 'Только строчные буквы, цифры и дефис' },
              minLength: { value: 2, message: 'Минимум 2 символа' },
              maxLength: { value: 60, message: 'Максимум 60 символов' },
            })}
          />
        </div>
        <FieldError message={errors.slug?.message} />
        {name && !errors.slug && (
          <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
            savdo.uz/{watch('slug')}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
      >
        Далее →
      </button>
    </form>
  );
}

// ── Step 2: Telegram + city ───────────────────────────────────────────────────

interface Step2Data {
  telegramUsername: string;
  city: string;
  telegramContactLink: string;
}

function Step2({
  onNext,
  onBack,
  isLoading,
  error,
}: {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step2Data>();

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Контакты</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          Покупатели свяжутся с вами через Telegram
        </p>
      </div>

      <div>
        <Label required>Telegram username</Label>
        <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.13)" }}>
          <span
            className="px-3 py-[0.625rem] text-sm flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.35)", borderRight: "1px solid rgba(255,255,255,0.10)" }}
          >
            @
          </span>
          <input
            className="flex-1 px-3 py-[0.625rem] text-sm focus:outline-none"
            style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}
            placeholder="texnoshop"
            {...register('telegramUsername', {
              required: 'Введите Telegram username',
              pattern: {
                value: /^@?[a-zA-Z0-9_]{3,32}$/,
                message: 'Только буквы, цифры и _. От 3 до 32 символов',
              },
            })}
          />
        </div>
        <FieldError message={errors.telegramUsername?.message} />
      </div>

      <div>
        <Label required>Telegram-ссылка для покупателей</Label>
        <input
          className="focus:outline-none"
          style={inputStyle}
          placeholder="https://t.me/texnoshop"
          {...register('telegramContactLink', {
            required: 'Введите ссылку',
            pattern: {
              value: /^https:\/\/t\.me\/.+/,
              message: 'Должна начинаться с https://t.me/',
            },
          })}
        />
        <FieldError message={errors.telegramContactLink?.message} />
        <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          Ссылка на ваш канал, группу или личный чат
        </p>
      </div>

      <div>
        <Label required>Город</Label>
        <input
          className="focus:outline-none"
          style={inputStyle}
          placeholder="Ташкент"
          {...register('city', {
            required: 'Укажите город',
            minLength: { value: 2, message: 'Минимум 2 символа' },
          })}
        />
        <FieldError message={errors.city?.message} />
      </div>

      <ErrorBanner message={error} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
        >
          ← Назад
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          {isLoading ? 'Создание...' : 'Далее →'}
        </button>
      </div>
    </form>
  );
}

// ── Step 3: First product ─────────────────────────────────────────────────────

interface Step3Data {
  title: string;
  basePrice: number;
}

function Step3({
  onNext,
  onSkip,
  onBack,
  isLoading,
  error,
}: {
  onNext: (data: Step3Data) => void;
  onSkip: () => void;
  onBack: () => void;
  isLoading: boolean;
  error?: string;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step3Data>({ defaultValues: { basePrice: 0 } });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Первый товар</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          Добавьте хотя бы один товар, чтобы магазин выглядел живым
        </p>
      </div>

      <div>
        <Label required>Название товара</Label>
        <input
          className="focus:outline-none"
          style={inputStyle}
          placeholder="Например: iPhone 15 Pro"
          {...register('title', { required: 'Введите название' })}
        />
        <FieldError message={errors.title?.message} />
      </div>

      <div>
        <Label required>Цена (сум)</Label>
        <input
          type="number"
          min={1}
          className="focus:outline-none"
          style={inputStyle}
          placeholder="0"
          {...register('basePrice', {
            required: 'Укажите цену',
            min: { value: 1, message: 'Цена должна быть больше 0' },
            valueAsNumber: true,
          })}
        />
        <FieldError message={errors.basePrice?.message} />
      </div>

      <ErrorBanner message={error} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}
        >
          ← Назад
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          {isLoading ? 'Сохранение...' : 'Далее →'}
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-center transition-opacity hover:opacity-80"
        style={{ color: "rgba(255,255,255,0.28)" }}
      >
        Пропустить, добавлю позже
      </button>
    </form>
  );
}

// ── Step 4: Submit for review ─────────────────────────────────────────────────

function Step4({
  storeName,
  onSubmit,
  onSkip,
  isLoading,
  error,
}: {
  storeName: string;
  onSubmit: () => void;
  onSkip: () => void;
  isLoading: boolean;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 8px 24px rgba(167,139,250,.40)" }}
        >
          🚀
        </div>
        <h1 className="text-xl font-bold text-white mb-1">Почти готово!</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
          Отправьте магазин <span style={{ color: "#A78BFA" }}>{storeName}</span> на проверку — после одобрения он станет доступен покупателям
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-2xl p-4 flex flex-col gap-2" style={glass}>
        {[
          { label: "Аккаунт создан", done: true },
          { label: "Магазин настроен", done: true },
          { label: "Контакты добавлены", done: true },
        ].map(({ label, done }) => (
          <div key={label} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: done ? "rgba(52,211,153,.20)" : "rgba(255,255,255,0.06)", border: done ? "1px solid rgba(52,211,153,.40)" : "1px solid rgba(255,255,255,0.10)" }}
            >
              {done && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth={2.5} className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
            <span className="text-sm" style={{ color: done ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.35)" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />

      <div className="flex flex-col gap-3">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 16px rgba(167,139,250,.35)" }}
        >
          {isLoading ? 'Отправка...' : 'Отправить на проверку'}
        </button>
        <button
          onClick={onSkip}
          className="text-xs text-center transition-opacity hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.28)" }}
        >
          Сделаю позже, перейти в дашборд
        </button>
      </div>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router      = useRouter();
  const { isAuthenticated, user, login } = useAuth();
  const { data: store, isLoading: storeLoading } = useStore({ enabled: user?.role === 'SELLER' });
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string>();
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [storeName, setStoreName] = useState('');

  const createStore      = useCreateStore();
  const updateProfile    = useUpdateSellerProfile();
  const createProduct    = useCreateProduct();
  const submitStore      = useSubmitStore();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!storeLoading && store) router.replace('/dashboard');
  }, [storeLoading, store, router]);

  if (!isAuthenticated || (!storeLoading && store)) return null;

  // ── Handlers ──

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setStoreName(data.name);
    setStep(1);
  }

  async function handleStep2(data: Step2Data) {
    if (!step1Data) return;
    setError(undefined);
    try {
      // Если пользователь ещё BUYER — сначала делаем upgrade до SELLER и получаем новые токены
      if (user && user.role !== 'SELLER') {
        const applied = await applySeller();
        login(applied.accessToken, applied.refreshToken, applied.user);
      }

      // Normalise telegram username
      const telegramUsername = data.telegramUsername.startsWith('@')
        ? data.telegramUsername
        : `@${data.telegramUsername}`;

      const [store] = await Promise.all([
        createStore.mutateAsync({
          name:                step1Data.name,
          slug:                step1Data.slug,
          city:                data.city,
          telegramContactLink: data.telegramContactLink,
        }),
        updateProfile.mutateAsync({ telegramUsername }),
      ]);
      track.storeCreated(store.id, store.slug);
      track.sellerProfileCompleted(store.id);
      setStep(2);
    } catch {
      setError('Не удалось создать магазин. Попробуйте ещё раз.');
    }
  }

  async function handleStep3(data: Step3Data) {
    setError(undefined);
    try {
      const product = await createProduct.mutateAsync({
        title:     data.title,
        basePrice: Number(data.basePrice),
        isVisible: true,
      });
      // store.id is in query cache after step 2
      track.firstProductCreated(product.storeId, product.id);
      setStep(3);
    } catch {
      setError('Не удалось сохранить товар.');
    }
  }

  async function handleSubmit() {
    setError(undefined);
    try {
      const store = await submitStore.mutateAsync();
      track.storeSubmittedForReview(store.id);
      router.push('/dashboard');
    } catch {
      setError('Не удалось отправить на проверку.');
    }
  }

  function toDashboard() {
    router.push('/dashboard');
  }

  // ── Render ──

  return (
    <div className="rounded-3xl p-7" style={glass}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-6">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 14px rgba(167,139,250,.40)" }}
        >
          🛒
        </div>
        <span className="text-base font-bold" style={{ color: "#A78BFA" }}>Savdo</span>
      </div>

      <ProgressBar step={step} />

      {step === 0 && <Step1 onNext={handleStep1} />}

      {step === 1 && (
        <Step2
          onNext={handleStep2}
          onBack={() => setStep(0)}
          isLoading={createStore.isPending || updateProfile.isPending}
          error={error}
        />
      )}

      {step === 2 && (
        <Step3
          onNext={handleStep3}
          onSkip={() => setStep(3)}
          onBack={() => setStep(1)}
          isLoading={createProduct.isPending}
          error={error}
        />
      )}

      {step === 3 && (
        <Step4
          storeName={storeName}
          onSubmit={handleSubmit}
          onSkip={toDashboard}
          isLoading={submitStore.isPending}
          error={error}
        />
      )}
    </div>
  );
}
