# UZ-локализация web-buyer + web-seller — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Дать web-buyer и web-seller узбекскую локализацию (латиница) с клиентским переключателем языка RU/UZ, зеркаля обкатанную i18n-инфраструктуру `apps/admin`.

**Architecture:** В каждой аппе создаётся `src/lib/i18n/` — React Context (`I18nProvider`) + плоский словарь `ru.ts`/`uz.ts` в `dot.notation` + хук `useTranslation()`. `ru.ts` — single source of truth, fallback-цепочка `uz → ru → key`. Захардкоженный русский текст в JSX заменяется вызовами `t('key')` волнами. Server Components (только `metadata`-экспорты) — вне scope.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + React Context. Ноль новых зависимостей.

**Спека:** `docs/superpowers/specs/2026-05-16-uz-localization-web-design.md` (тикет `MARKETING-LOCALIZATION-UZ-001`).

---

## Важные ограничения проекта (переопределяют дефолты skill'а)

- **`pnpm build` и `pnpm dev` запрещены** — ПК Азима зависает на сборке монорепо. Верификация каждой задачи: `npx tsc --noEmit` в каталоге аппы + проверка на Railway-URL после push.
- **Frontend-тестов нет** (тикет `API-FRONTEND-TESTS-001` — отдельный). Test-runner в web-buyer/web-seller не настроен, ставить его — вне scope. Поэтому вместо TDD-тестов критерий каждой задачи — чистый `tsc --noEmit` + регрессия RU (при `locale='ru'` текст идентичен текущему).
- **Деплой через service-ветки.** web-buyer коммитится в ветку `web-buyer`, web-seller — в ветку `web-seller`. НЕ в `main`.
- **Зона:** только `apps/web-buyer` и `apps/web-seller`. `packages/*`, `apps/api`, `apps/admin`, `apps/tma` не трогать.

---

## File Structure

**web-buyer — новые файлы:**
- `apps/web-buyer/src/lib/i18n/types.ts` — `Locale`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `Translations`.
- `apps/web-buyer/src/lib/i18n/ru.ts` — русский словарь (source of truth).
- `apps/web-buyer/src/lib/i18n/uz.ts` — узбекский словарь.
- `apps/web-buyer/src/lib/i18n/I18nProvider.tsx` — Context + `useTranslation` + `interpolate`.
- `apps/web-buyer/src/lib/i18n/index.ts` — barrel-экспорт.
- `apps/web-buyer/src/components/language-toggle.tsx` — сегментированный тумблер RU/UZ.

**web-buyer — модифицируемые:**
- `apps/web-buyer/src/app/layout.tsx` — монтирование `I18nProvider` в провайдер-стек.
- `apps/web-buyer/src/app/(shop)/profile/page.tsx` — вставка `LanguageToggle`.
- ~40 файлов JSX волнами 1–5 (Tasks 3–7) — замена строк на `t()`.

**web-seller — новые файлы:** зеркально (`src/lib/i18n/*`, `src/components/language-toggle.tsx`).

**web-seller — модифицируемые:**
- `apps/web-seller/src/app/layout.tsx` — монтирование `I18nProvider`.
- `apps/web-seller/src/app/(dashboard)/settings/page.tsx` — вставка `LanguageToggle`.
- ~25 файлов JSX волнами 6–8 (Tasks 10–12).

**Соглашения по ключам** (из спеки §6): namespace по фиче — `checkout.*`, `cart.*`, `orders.*`, `nav.*`; общие кнопки — `common.*` (`common.save`, `common.cancel`, `common.back`). Повторяющиеся строки — только в `common.*`, не дублировать. Плейсхолдеры — `{name}`, `{count}`. Плюрализацию не вводим (YAGNI).

---

## Task 1: web-buyer — i18n инфраструктура

**Files:**
- Create: `apps/web-buyer/src/lib/i18n/types.ts`
- Create: `apps/web-buyer/src/lib/i18n/ru.ts`
- Create: `apps/web-buyer/src/lib/i18n/uz.ts`
- Create: `apps/web-buyer/src/lib/i18n/I18nProvider.tsx`
- Create: `apps/web-buyer/src/lib/i18n/index.ts`
- Modify: `apps/web-buyer/src/app/layout.tsx`

- [ ] **Step 1: Создать `types.ts`**

```ts
// MARKETING-LOCALIZATION-UZ-001 (web-buyer) — i18n базовые типы.
// Зеркалит apps/admin/src/lib/i18n/types.ts. `uz` — латиница.

export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * Translation dictionary — плоский key-value, ключи в dot.notation.
 * Значения могут содержать плейсхолдеры {name}. ru.ts — source of truth.
 */
export type Translations = Record<string, string>;
```

- [ ] **Step 2: Создать `ru.ts` с seed-словарём `common.*`**

```ts
// MARKETING-LOCALIZATION-UZ-001 (web-buyer) — русский словарь.
// Source of truth: ключ обязан существовать здесь. Волны 1-5 дополняют файл.
import type { Translations } from './types';

export const ru: Translations = {
  // common — общие кнопки и подписи, переиспользуются везде
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.back': 'Назад',
  'common.close': 'Закрыть',
  'common.delete': 'Удалить',
  'common.edit': 'Изменить',
  'common.loading': 'Загрузка…',
  'common.retry': 'Повторить',
  'common.error': 'Что-то пошло не так',
  'common.empty': 'Ничего не найдено',
  // settings — секция настроек в /profile
  'settings.title': 'Настройки',
  'settings.language': 'Язык интерфейса',
};
```

- [ ] **Step 3: Создать `uz.ts` с переводом seed-словаря**

```ts
// MARKETING-LOCALIZATION-UZ-001 (web-buyer) — узбекский словарь (латиница).
// Пропущенный ключ → fallback на ru.ts. Волны 1-5 дополняют файл.
import type { Translations } from './types';

export const uz: Translations = {
  'common.save': 'Saqlash',
  'common.cancel': 'Bekor qilish',
  'common.back': 'Orqaga',
  'common.close': 'Yopish',
  'common.delete': "O'chirish",
  'common.edit': 'Tahrirlash',
  'common.loading': 'Yuklanmoqda…',
  'common.retry': 'Qayta urinish',
  'common.error': 'Nimadir xato ketdi',
  'common.empty': 'Hech narsa topilmadi',
  'settings.title': 'Sozlamalar',
  'settings.language': 'Interfeys tili',
};
```

- [ ] **Step 4: Создать `I18nProvider.tsx`**

Это точная копия `apps/admin/src/lib/i18n/I18nProvider.tsx` с двумя отличиями: добавлена директива `'use client'` (web-buyer — Next.js, layout это Server Component) и `STORAGE_KEY = 'savdo_buyer_locale'`.

```tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { ru } from './ru';
import { uz } from './uz';
import type { Locale, Translations } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

// MARKETING-LOCALIZATION-UZ-001 (web-buyer). Зеркалит admin I18nProvider.
// Локаль: localStorage → navigator.language → дефолт 'ru'.

const STORAGE_KEY = 'savdo_buyer_locale';

const DICTS: Record<Locale, Translations> = { ru, uz };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export const useTranslation = () => useContext(Ctx);

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // localStorage может быть недоступен
  }
  try {
    if (navigator.language?.toLowerCase().startsWith('uz')) return 'uz';
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

/** Шаблонная подстановка {name} → vars.name. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const v = vars[key];
    return v != null ? String(v) : match;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Детект на клиенте после mount — избегаем hydration mismatch
  // (сервер всегда рендерит DEFAULT_LOCALE).
  useEffect(() => {
    setLocaleState(detectInitialLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale];
      const raw = dict[key] ?? ru[key] ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
```

> **Почему детект в `useEffect`, а не в `useState`-инициализаторе (как у admin):** admin — чистый Vite SPA без SSR. web-buyer рендерится на сервере — `localStorage`/`navigator` там недоступны, а инициализатор, читающий их, дал бы hydration mismatch. Сервер и первый клиентский рендер дают `DEFAULT_LOCALE`, реальная локаль применяется эффектом сразу после mount.

- [ ] **Step 5: Создать `index.ts`**

```ts
export { I18nProvider, useTranslation } from './I18nProvider';
export type { Locale } from './types';
export { SUPPORTED_LOCALES, DEFAULT_LOCALE } from './types';
```

- [ ] **Step 6: Смонтировать `I18nProvider` в `layout.tsx`**

В `apps/web-buyer/src/app/layout.tsx` добавить импорт рядом с остальными провайдерами:

```tsx
import { I18nProvider } from "../lib/i18n";
```

И обернуть `{children}` внутри `ThemeProvider` (стек `QueryProvider → AuthProvider → ThemeProvider → I18nProvider → children`):

```tsx
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="system">
              <I18nProvider>
                {children}
              </I18nProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
```

`<html lang="ru">` оставить статикой — реальный `lang` ставит провайдер эффектом.

- [ ] **Step 7: Верификация — `tsc --noEmit`**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок. `pnpm build` НЕ запускать.

- [ ] **Step 8: Commit**

```bash
git add apps/web-buyer/src/lib/i18n apps/web-buyer/src/app/layout.tsx
git commit -m "feat(web-buyer): i18n infrastructure — I18nProvider + ru/uz dicts (MARKETING-LOCALIZATION-UZ-001)"
```

---

## Task 2: web-buyer — переключатель языка `LanguageToggle`

**Files:**
- Create: `apps/web-buyer/src/components/language-toggle.tsx`
- Modify: `apps/web-buyer/src/app/(shop)/profile/page.tsx`

- [ ] **Step 1: Создать `language-toggle.tsx`**

Сегментированный тумблер RU/UZ, визуально в духе `theme-toggle.tsx` (токены из `@/lib/styles`).

```tsx
'use client';

import { useTranslation, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { colors } from '@/lib/styles';

const LABELS: Record<Locale, string> = { ru: 'RU', uz: 'UZ' };

/**
 * Сегментированный переключатель локали RU | UZ.
 * Смена мгновенная (Context re-render), сохраняется в localStorage.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="group"
      aria-label={t('settings.language')}
      className={`inline-flex rounded-full p-0.5 ${className}`}
      style={{ border: `1px solid ${colors.border}`, background: colors.surfaceMuted }}
    >
      {SUPPORTED_LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            className="h-7 min-w-[42px] rounded-full px-3 text-xs font-semibold transition-colors"
            style={{
              background: active ? colors.brand : 'transparent',
              color: active ? '#fff' : colors.textMuted,
            }}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
```

> Если `colors` в `apps/web-buyer/src/lib/styles.ts` не экспортирует `border` / `surfaceMuted` / `brand` / `textMuted` — открыть файл и подставить фактические имена токенов (theme-toggle.tsx использует именно эти, так что они есть).

- [ ] **Step 2: Вставить `LanguageToggle` в `/profile`**

Открыть `apps/web-buyer/src/app/(shop)/profile/page.tsx`. Добавить импорт:

```tsx
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from '@/lib/i18n';
```

В JSX добавить строку настроек языка — отдельным блоком в списке меню профиля (рядом с пунктами «Заказы», «Избранное» и т.п.). Блок: подпись слева, `<LanguageToggle />` справа.

```tsx
{/* MARKETING-LOCALIZATION-UZ-001 — переключатель языка */}
<div
  className="flex items-center justify-between rounded-xl px-4 py-3"
  style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
>
  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
    {t('settings.language')}
  </span>
  <LanguageToggle />
</div>
```

Получить `t` в компоненте страницы: `const { t } = useTranslation();` (страница уже `'use client'` — проверить директиву в начале файла, она там есть).

- [ ] **Step 3: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add apps/web-buyer/src/components/language-toggle.tsx apps/web-buyer/src/app/(shop)/profile/page.tsx
git commit -m "feat(web-buyer): RU/UZ language toggle in /profile (MARKETING-LOCALIZATION-UZ-001)"
```

---

## Метод для волн извлечения строк (Tasks 3–7, 10–12)

Каждая волна — механическое извлечение. Для **каждого** файла волны:

1. Добавить в компонент (если ещё нет): `import { useTranslation } from '@/lib/i18n';` и внутри — `const { t } = useTranslation();`. Компонент должен быть `'use client'` — почти все страницы обеих апп уже client (см. спеку §2). Если файл — Server Component (есть `export const metadata` или нет `'use client'` и используются хуки) — текст в `metadata` НЕ трогать (вне scope, спека §1).
2. Найти каждую захардкоженную русскую строку в JSX (видимый текст, `placeholder`, `aria-label`, `title`, `alt`, строковые литералы в `toast`/`alert`).
3. Для каждой строки: выбрать ключ в `dot.notation` по namespace волны → добавить пару в `ru.ts` (значение = текущий русский текст 1-в-1) и в `uz.ts` (узбекский перевод, латиница) → заменить строку в JSX на `t('key')`.
4. Повторяющиеся строки («Сохранить», «Отмена», «Назад», «Загрузка…») — использовать существующий `common.*`, новый ключ не плодить.
5. Строки с переменными — параметризовать: `t('orders.count', { count })` вместо конкатенации.

**Worked example** (паттерн для всех волн). Было:

```tsx
<h1 className="text-2xl">Корзина</h1>
<button onClick={clear}>Очистить</button>
<p>Товаров: {items.length}</p>
```

`ru.ts` += `'cart.title': 'Корзина'`, `'cart.clear': 'Очистить'`, `'cart.count': 'Товаров: {count}'`.
`uz.ts` += `'cart.title': 'Savatcha'`, `'cart.clear': 'Tozalash'`, `'cart.count': 'Mahsulotlar: {count}'`.
Стало:

```tsx
<h1 className="text-2xl">{t('cart.title')}</h1>
<button onClick={clear}>{t('cart.clear')}</button>
<p>{t('cart.count', { count: items.length })}</p>
```

**Done-критерий волны:** в файлах волны не осталось захардкоженного русского в JSX; каждый новый ключ есть и в `ru.ts`, и в `uz.ts`; `npx tsc --noEmit` чист; при `locale='ru'` UI идентичен исходному (регрессия RU — критерий полноты извлечения).

**Узбекские переводы:** генерирует исполнитель плана, латиница; Азим ревьюит после push. Сомнительные/доменные термины — оставить в `uz.ts` лучший вариант и пометить строкой-комментарием `// REVIEW` рядом.

---

## Task 3: web-buyer Wave 1 — Storefront + каталог

**Files (Modify):**
- `apps/web-buyer/src/app/(shop)/page.tsx`
- `apps/web-buyer/src/app/(shop)/[slug]/page.tsx`
- `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`
- Все файлы в `apps/web-buyer/src/components/home/`
- Все файлы в `apps/web-buyer/src/components/store/`
- Все файлы в `apps/web-buyer/src/components/catalog/` (если каталог существует)
- `apps/web-buyer/src/lib/i18n/ru.ts`, `apps/web-buyer/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки по методу выше**

Namespace: `home.*` (homepage/storefront), `store.*` (страница магазина `[slug]`), `product.*` (детальная товара), `catalog.*` (каталог/поиск). Пройти каждый файл списка, применить шаги 1–5 метода.

- [ ] **Step 2: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-buyer/src
git commit -m "feat(web-buyer): UZ i18n wave 1 — storefront + catalog (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-buyer
```

После push — проверить Railway-URL ветки `web-buyer`: переключить язык в `/profile`, открыть главную / магазин / товар.

---

## Task 4: web-buyer Wave 2 — Orders / chats / profile / notifications / wishlist

**Files (Modify):**
- Все файлы в `apps/web-buyer/src/app/(shop)/orders/`
- Все файлы в `apps/web-buyer/src/app/(shop)/chats/`
- `apps/web-buyer/src/app/(shop)/profile/page.tsx` (оставшиеся строки, кроме уже сделанного toggle'а)
- Все файлы в `apps/web-buyer/src/app/(shop)/notifications/`
- Все файлы в `apps/web-buyer/src/app/(shop)/wishlist/`
- Все файлы в `apps/web-buyer/src/components/chat/`
- `apps/web-buyer/src/lib/i18n/ru.ts`, `apps/web-buyer/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки**

Namespace: `orders.*`, `chat.*`, `profile.*`, `notifications.*`, `wishlist.*`. Статусы заказов — ключи `orders.status.<STATUS>` (RU-лейблы канонизированы тикетом `STATUS-LABEL-CANONICAL-SHIPPED-001`: SHIPPED = «В пути» / «Yoʻlda»).

- [ ] **Step 2: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-buyer/src
git commit -m "feat(web-buyer): UZ i18n wave 2 — orders/chats/profile/notifications/wishlist (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-buyer
```

---

## Task 5: web-buyer Wave 3 — Cart / checkout

**Files (Modify):**
- Все файлы в `apps/web-buyer/src/app/(minimal)/cart/`
- Все файлы в `apps/web-buyer/src/app/(minimal)/checkout/`
- `apps/web-buyer/src/lib/i18n/ru.ts`, `apps/web-buyer/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки**

Namespace: `cart.*`, `checkout.*`. В checkout есть локальная функция `OtpGate` — её строки тоже извлечь (`checkout.otp.*`). Режимы доставки — `checkout.delivery.delivery` / `checkout.delivery.pickup`. Способы оплаты и бейдж «Скоро» — `checkout.payment.*`.

- [ ] **Step 2: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-buyer/src
git commit -m "feat(web-buyer): UZ i18n wave 3 — cart + checkout (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-buyer
```

---

## Task 6: web-buyer Wave 4 — Статические страницы

**Files (Modify):**
- `apps/web-buyer/src/app/.../offer/` (публичная оферта)
- `apps/web-buyer/src/app/.../privacy/`
- `apps/web-buyer/src/app/.../terms/`
- `apps/web-buyer/src/app/.../refund/`
- `apps/web-buyer/src/lib/i18n/ru.ts`, `apps/web-buyer/src/lib/i18n/uz.ts`

> Точные пути найти: `git ls-files apps/web-buyer | grep -E 'offer|privacy|terms|refund'`. Страницы созданы тикетом `PUBLIC-OFFER-PAGES`.

- [ ] **Step 1: Извлечь строки**

Namespace: `legal.offer.*`, `legal.privacy.*`, `legal.terms.*`, `legal.refund.*`. Это длинные юридические тексты — ключи на абзац/заголовок (`legal.offer.section1.title`, `legal.offer.section1.body`). Узбекский перевод юр-текста — пометить `// REVIEW` для проверки Азимом (юридическая точность важна).

- [ ] **Step 2: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-buyer/src
git commit -m "feat(web-buyer): UZ i18n wave 4 — static legal pages (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-buyer
```

---

## Task 7: web-buyer Wave 5 — Shared компоненты

**Files (Modify):**
- `apps/web-buyer/src/components/layout/Header.tsx`
- `apps/web-buyer/src/components/layout/BottomNavBar.tsx`
- Любые оставшиеся shared-компоненты в `apps/web-buyer/src/components/` с захардкоженным RU
- `apps/web-buyer/src/lib/i18n/ru.ts`, `apps/web-buyer/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки**

Namespace: `nav.*` (пункты навигации, `aria-label` BottomNavBar — там `aria-current` + лейблы), `common.*` для оставшихся общих. Финальный проход: `git grep -nP '[А-Яа-яЁё]' apps/web-buyer/src/components apps/web-buyer/src/app -- '*.tsx'` — увидеть оставшийся кириллический текст; всё в JSX (не комментарии, не `metadata`) должно уйти в `t()`.

- [ ] **Step 2: Верификация**

Run: `cd apps/web-buyer && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-buyer/src
git commit -m "feat(web-buyer): UZ i18n wave 5 — shared layout components (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-buyer
```

После этой задачи web-buyer полностью локализован — пройти полный флоу на Railway-URL: каталог → товар → корзина → checkout, переключив UZ.

---

## Task 8: web-seller — i18n инфраструктура

**Files:**
- Create: `apps/web-seller/src/lib/i18n/types.ts`
- Create: `apps/web-seller/src/lib/i18n/ru.ts`
- Create: `apps/web-seller/src/lib/i18n/uz.ts`
- Create: `apps/web-seller/src/lib/i18n/I18nProvider.tsx`
- Create: `apps/web-seller/src/lib/i18n/index.ts`
- Modify: `apps/web-seller/src/app/layout.tsx`

- [ ] **Step 1: Скопировать инфраструктуру из web-buyer**

`types.ts`, `ru.ts`, `uz.ts`, `index.ts` — идентичны файлам из Task 1 (Steps 1–3, 5). `ru.ts`/`uz.ts` — тот же seed `common.*` + `settings.*`.

`I18nProvider.tsx` — идентичен Task 1 Step 4, **кроме одной строки**:

```ts
const STORAGE_KEY = 'savdo_seller_locale';
```

(изоляция от `savdo_buyer_locale` и `savdo_admin_locale`).

- [ ] **Step 2: Смонтировать в `layout.tsx`**

В `apps/web-seller/src/app/layout.tsx` добавить импорт:

```tsx
import { I18nProvider } from "../lib/i18n";
```

Обернуть `{children}` внутри `ThemeProvider`:

```tsx
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="dark">
              <I18nProvider>
                {children}
              </I18nProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
```

- [ ] **Step 3: Верификация**

Run: `cd apps/web-seller && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/lib/i18n apps/web-seller/src/app/layout.tsx
git commit -m "feat(web-seller): i18n infrastructure — I18nProvider + ru/uz dicts (MARKETING-LOCALIZATION-UZ-001)"
```

---

## Task 9: web-seller — переключатель языка `LanguageToggle`

**Files:**
- Create: `apps/web-seller/src/components/language-toggle.tsx`
- Modify: `apps/web-seller/src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Создать `language-toggle.tsx`**

Идентичен Task 2 Step 1, но импорт токенов — из `apps/web-seller/src/lib/styles.ts`. Открыть этот файл и подтвердить имена токенов (`border`, `surfaceMuted`, `brand`, `textMuted`); если отличаются — подставить фактические. Структура компонента та же.

- [ ] **Step 2: Вставить `LanguageToggle` в `/settings`**

> **Важно — не путать с существующим полем.** В `settings/page.tsx:467` уже есть `<Field label="Язык интерфейса">` с `name="languageCode"` — это **серверное** поле профиля магазина (`profile.languageCode`, уходит в backend). Новый `LanguageToggle` — **клиентский** UI-locale (localStorage), это другая сущность. Не заменять серверное поле; добавить toggle отдельным блоком.

Добавить импорт в `settings/page.tsx`:

```tsx
import { LanguageToggle } from '@/components/language-toggle';
import { useTranslation } from '@/lib/i18n';
```

Вставить блок в секцию настроек (рядом с заголовком «Настройки», `settings/page.tsx:618`):

```tsx
{/* MARKETING-LOCALIZATION-UZ-001 — переключатель языка интерфейса (клиентский) */}
<div
  className="flex items-center justify-between rounded-xl px-4 py-3"
  style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
>
  <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
    {t('settings.language')}
  </span>
  <LanguageToggle />
</div>
```

`const { t } = useTranslation();` — внутри компонента страницы.

- [ ] **Step 3: Верификация**

Run: `cd apps/web-seller && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/components/language-toggle.tsx apps/web-seller/src/app/(dashboard)/settings/page.tsx
git commit -m "feat(web-seller): RU/UZ language toggle in /settings (MARKETING-LOCALIZATION-UZ-001)"
```

---

## Task 10: web-seller Wave 6 — Auth / onboarding

**Files (Modify):**
- Все файлы в `apps/web-seller/src/app/(auth)/login/`
- Все файлы в `apps/web-seller/src/app/(onboarding)/onboarding/`
- `apps/web-seller/src/lib/i18n/ru.ts`, `apps/web-seller/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки** (метод выше)

Namespace: `auth.*` (login, OTP), `onboarding.*` (шаги онбординга, progress-bar). OTP-копирайт уже выверен тикетом `WS-DESIGN-WAVE-4` — переносить его 1-в-1 в ключи.

- [ ] **Step 2: Верификация**

Run: `cd apps/web-seller && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-seller/src
git commit -m "feat(web-seller): UZ i18n wave 6 — auth + onboarding (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-seller
```

---

## Task 11: web-seller Wave 7 — Dashboard-страницы

**Files (Modify):**
- Все файлы в `apps/web-seller/src/app/(dashboard)/dashboard/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/orders/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/products/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/analytics/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/chat/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/notifications/`
- Все файлы в `apps/web-seller/src/app/(dashboard)/profile/`
- `apps/web-seller/src/app/(dashboard)/settings/page.tsx` (оставшиеся строки кроме toggle'а)
- Все файлы в `apps/web-seller/src/app/(dashboard)/store/categories/`
- `apps/web-seller/src/lib/i18n/ru.ts`, `apps/web-seller/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки**

Namespace по странице: `dashboard.*`, `orders.*`, `products.*`, `analytics.*`, `chat.*`, `notifications.*`, `profile.*`, `settings.*`, `categories.*`. Статусы заказов — `orders.status.<STATUS>` (канон из `STATUS-LABEL-CANONICAL-SHIPPED-001`). Большая волна — допустимо коммитить и пушить под-частями (по странице), сохраняя `tsc` чистым на каждом коммите.

- [ ] **Step 2: Верификация**

Run: `cd apps/web-seller && npx tsc --noEmit`
Expected: 0 ошибок.

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-seller/src
git commit -m "feat(web-seller): UZ i18n wave 7 — dashboard pages (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-seller
```

---

## Task 12: web-seller Wave 8 — Shared компоненты

**Files (Modify):**
- `apps/web-seller/src/app/(dashboard)/layout.tsx`
- Оставшиеся shared-компоненты в `apps/web-seller/src/components/` с захардкоженным RU (sidebar/nav, `confirm-modal.tsx`, `Select`, и т.п.)
- `apps/web-seller/src/lib/i18n/ru.ts`, `apps/web-seller/src/lib/i18n/uz.ts`

- [ ] **Step 1: Извлечь строки**

Namespace: `nav.*`, `common.*`. Финальный проход: `git grep -nP '[А-Яа-яЁё]' apps/web-seller/src -- '*.tsx'` — оставшийся кириллический JSX-текст (не комментарии, не `metadata`) уйти в `t()`.

- [ ] **Step 2: Верификация финальная**

Run: `cd apps/web-seller && npx tsc --noEmit`
Expected: 0 ошибок.

Дополнительно — проверка полноты обеих апп: `git grep -nP '>[^<]*[А-Яа-яЁё]' apps/web-buyer/src apps/web-seller/src -- '*.tsx'` не должен показывать видимый русский текст между тегами (кроме `metadata`-блоков вне scope).

- [ ] **Step 3: Commit + push**

```bash
git add apps/web-seller/src
git commit -m "feat(web-seller): UZ i18n wave 8 — shared components (MARKETING-LOCALIZATION-UZ-001)"
git push origin HEAD:web-seller
```

---

## Финал — обновить трекинг

- [ ] Перенести `MARKETING-LOCALIZATION-UZ-001` из `analiz/tasks.md` в `analiz/done.md` по формату из `CLAUDE.md` (важность 🟡, дата, файлы, что сделано).
- [ ] Ручная проверка на Railway-URL обеих веток: переключить UZ в profile/settings, пройти ключевые флоу; убедиться что выбор сохраняется между сессиями (reload). Регрессия RU: вернуть RU — UI идентичен исходному.
- [ ] Сообщить Азиму, что `uz.ts` готовы к ревью переводов (особенно строки с `// REVIEW` — юр-тексты Wave 4).

---

## Self-Review (выполнено автором плана)

**Spec coverage:** §3 инфраструктура → Tasks 1, 8. §4 переключатель → Tasks 2, 9. §5 волны 1–5 web-buyer → Tasks 3–7; волны 6–8 web-seller → Tasks 10–12. §6 соглашения по ключам → блок «Метод для волн» + namespace в каждой волне. §7 верификация → `tsc --noEmit` + Railway-проверка в каждой задаче, регрессия RU в done-критерии. §8 критерий готовности → финальные grep-проверки в Tasks 11–12 + блок «Финал». §1 вне scope (metadata/SEO, форматирование чисел, API-тексты) → явно исключено в методе («metadata НЕ трогать»). ✅ Все разделы спеки покрыты.

**Placeholder scan:** волны извлечения строк по своей природе охватывают десятки файлов с сотнями строк — поэтапно перечислить каждую строку нереально и сделало бы план хуже. Вместо «TODO» дан исполнимый **метод** (5 шагов) + worked example с реальным before→after + точный список файлов + namespace на волну + grep-команды для проверки полноты. Это корректная гранулярность для механической широкой задачи, а не placeholder.

**Type consistency:** `Locale`, `Translations`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `useTranslation`, `I18nProvider`, `LanguageToggle`, `t(key, vars?)` — имена консистентны во всех задачах. `STORAGE_KEY` отличается осознанно (`savdo_buyer_locale` / `savdo_seller_locale`) и это явно отмечено в Task 8.
