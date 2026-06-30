# Seller Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Публичный продающий лендинг продавца на `web-seller` `/` (RU+UZ, Dark-Luxury), объясняющий продукт холодному продавцу и отстраивающий нас от qlay.uz.

**Architecture:** Лендинг живёт на корневом роуте `web-seller`. Весь копирайтинг (RU + UZ-латиница) — в словарях `lib/i18n/{ru,uz}.ts`; секции — тонкие client-компоненты, читающие `t(key)`. Паритет ключей RU/UZ гарантируется типом `Translations = Record<keyof typeof ru, string>` (ловит `tsc`). Initial locale читается на сервере из cookie → отдаётся в client `I18nProvider` (хороший LCP, без flash, мгновенный toggle). Цвета — существующие токены `colors.*` (золото = `colors.accent`), работают в dark/light.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind + inline-токены `colors.*` · lucide-react · next/image. Без новых зависимостей.

**Verification model:** web-seller не имеет unit-раннера. Проверка каждого шага = `pnpm --filter web-seller build` (typecheck ловит контрактные ошибки и пропуски i18n-ключей) + `pnpm --filter web-seller lint`. Финальная визуальная верификация — dev-сервер + Playwright (desktop/mobile × dark/light × RU/UZ).

**Design source of truth:** `docs/design/maxsavdo-design-v2.md` (Dark Luxury: золото точечно, одна CTA на экран, 8px-grid, Inter, Lucide 16/18/20, контраст AA). Спека: `docs/superpowers/specs/2026-06-03-seller-landing-page-design.md`.

---

## File Structure

```
apps/web-seller/src/
  lib/i18n/
    types.ts            # Locale, SUPPORTED_LOCALES, DEFAULT_LOCALE, Translations type
    ru.ts               # русский словарь landing.* (source of truth для ключей)
    uz.ts               # узбекский (латиница) — типизирован Record<keyof typeof ru,string>
    I18nProvider.tsx    # client-провайдер (initialLocale из cookie, cookie-persist)
    server-locale.ts    # серверный helper: читает cookie 'ms_locale'
    index.ts            # реэкспорты
  lib/landing/
    demo-store.ts       # demoStoreUrl(): NEXT_PUBLIC_DEMO_STORE_SLUG → buyerStoreUrl | null
    analytics.ts        # landingTrack(event) — безопасный no-op врапер
  components/landing/
    LangToggle.tsx          # client — RU/UZ переключатель (cookie + context)
    LandingHeader.tsx       # client — sticky, nav, lang+theme, auth-aware CTA
    Hero.tsx                # client
    ProblemSection.tsx      # client
    HowItWorks.tsx          # client
    WhyUs.tsx               # client
    Features.tsx            # client
    Pricing.tsx             # client (beta-режим, без цифр)
    Faq.tsx                 # client — аккордеон
    FinalCta.tsx            # client
    LandingFooter.tsx       # client
    LandingPage.tsx         # client — компонует все секции
  app/page.tsx              # MODIFY: было redirect → стало server-обёртка лендинга
  .env.example              # ADD NEXT_PUBLIC_DEMO_STORE_SLUG=test-store
```

Файлы, которые **НЕ** трогаем: `middleware.ts` (root `/` им не блокируется — редирект был только в `app/page.tsx`), `(dashboard)/*`, `(auth)/*`, `(onboarding)/*`, `lib/styles.ts`, `globals.css`.

---

## Task 1: i18n foundation (types + provider, без Telegram-зависимости)

**Files:**
- Create: `apps/web-seller/src/lib/i18n/types.ts`
- Create: `apps/web-seller/src/lib/i18n/ru.ts`
- Create: `apps/web-seller/src/lib/i18n/uz.ts`
- Create: `apps/web-seller/src/lib/i18n/I18nProvider.tsx`
- Create: `apps/web-seller/src/lib/i18n/server-locale.ts`
- Create: `apps/web-seller/src/lib/i18n/index.ts`

- [ ] **Step 1: Создать `types.ts`**

```ts
// i18n базовые типы для web-seller landing.
// UZ = латиница (соглашение проекта, как в apps/tma).
export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';
export const LOCALE_COOKIE = 'ms_locale';

// Паритет ключей enforced на уровне типа: uz.ts типизируется как
// Record<keyof typeof ru, string> в самом uz.ts (см. Task 1 Step 3),
// поэтому пропуск ключа в uz → ошибка tsc. Здесь — структурный тип словаря.
export type Dict = Record<string, string>;
```

- [ ] **Step 2: Создать `ru.ts` (вся копирайт-копия лендинга, RU)**

```ts
// Русский словарь лендинга — source of truth по набору ключей.
// При добавлении ключа обязательно зеркалить в uz.ts (tsc заставит).
export const ru = {
  // header
  'nav.how': 'Как работает',
  'nav.features': 'Возможности',
  'nav.pricing': 'Тарифы',
  'nav.faq': 'FAQ',
  'nav.login': 'Войти',
  'nav.dashboard': 'В кабинет',
  'cta.create': 'Создать магазин',
  'cta.createFree': 'Создать бесплатно',
  'cta.demo': 'Посмотреть демо-магазин',
  'cta.start': 'Начать бесплатно',

  // hero
  'hero.title': 'Магазин в Telegram за 5 минут',
  'hero.subtitle': 'Клиенты сами выбирают товар и оформляют заказ. Хватит отвечать на сотни сообщений «цена?» и собирать заказы вручную в переписке.',
  'hero.badge': 'Закрытая бета · первые продавцы уже здесь',
  'hero.metric1.value': '5 мин',
  'hero.metric1.label': 'на запуск',
  'hero.metric2.value': '0%',
  'hero.metric2.label': 'комиссии с продаж',
  'hero.metric3.value': '24/7',
  'hero.metric3.label': 'магазин работает',

  // problem
  'problem.title': 'Продаёте в директе или сторис?',
  'problem.subtitle': 'Знакомо. И каждый день вы теряете на этом деньги.',
  'problem.1.title': 'Заказы теряются',
  'problem.1.body': 'Договорённости тонут в переписке, путаются адреса и суммы, часть заказов просто забывается.',
  'problem.2.title': 'Сотни сообщений «цена?»',
  'problem.2.body': 'Вы вручную отвечаете одно и то же, вместо того чтобы клиент сам всё увидел в каталоге.',
  'problem.3.title': 'Ноль аналитики и checkout',
  'problem.3.body': 'Не видно, что продаётся, нет корзины и нормального оформления заказа.',

  // how it works
  'how.title': 'Как это работает',
  'how.subtitle': 'Три шага — и магазин готов принимать заказы.',
  'how.1.title': 'Создайте магазин',
  'how.1.body': 'Регистрация за минуту по номеру телефона. Без сайтостроения и кода.',
  'how.2.title': 'Добавьте товары',
  'how.2.body': 'Фото, цена, описание, варианты. Каталог как у больших магазинов.',
  'how.3.title': 'Делитесь ссылкой',
  'how.3.body': 'Одна ссылка для Telegram, Instagram, сторис. Клиент открывает и заказывает сам.',

  // why us
  'why.title': 'Почему maxsavdo, а не то, что есть сейчас',
  'why.col.feature': '',
  'why.col.us': 'maxsavdo',
  'why.col.dm': 'Директ / сторис',
  'why.col.mp': 'Маркетплейс',
  'why.col.builder': 'Tilda / Shopify',
  'why.row1': 'Корзина и checkout',
  'why.row2': 'Свой бренд и витрина',
  'why.row3': 'Без комиссии с продаж',
  'why.row4': 'Нативно в Telegram',
  'why.row5': 'Запуск за минуты',
  'why.yes': 'Да',
  'why.no': 'Нет',
  'why.commission': '15% комиссия',
  'why.expensive': '$30+/мес',
  'why.note': 'Маркетплейс берёт ~15% с каждой продажи. Конструкторы сайтов — от $30/мес и не Telegram-native. maxsavdo — подписка вместо комиссии, нативно там, откуда уже приходят клиенты.',

  // features
  'features.title': 'Всё для продаж — из коробки',
  'features.1.title': 'Каталог с вариантами',
  'features.1.body': 'Фото, цены, размеры и цвета, остатки на складе.',
  'features.2.title': 'Корзина и оформление',
  'features.2.body': 'Клиент собирает заказ сам, как в нормальном интернет-магазине.',
  'features.3.title': 'Заказы и статусы',
  'features.3.body': 'Все заказы в одном месте, со статусами и историей.',
  'features.4.title': 'Аналитика продаж',
  'features.4.body': 'Видно, что и сколько продаётся — без таблиц вручную.',
  'features.5.title': 'Чат с покупателем',
  'features.5.body': 'Вопросы по заказу — прямо внутри, не теряются в личке.',
  'features.6.title': 'Нативно в Telegram',
  'features.6.body': 'Магазин открывается там, где уже сидят ваши клиенты.',

  // pricing
  'pricing.title': 'Сейчас — бесплатно',
  'pricing.subtitle': 'Закрытая бета. Ранняя цена фиксируется для первых продавцов.',
  'pricing.cta': 'Начать бесплатно',
  'pricing.ladder.title': 'А дальше — простые планы под рост',
  'pricing.tier.free': 'Free',
  'pricing.tier.free.desc': 'Старт и первые продажи',
  'pricing.tier.pro': 'Pro',
  'pricing.tier.pro.desc': 'Для активных магазинов',
  'pricing.tier.business': 'Business',
  'pricing.tier.business.desc': 'Несколько магазинов, API',
  'pricing.soon': 'скоро',

  // faq
  'faq.title': 'Частые вопросы',
  'faq.1.q': 'Нужен ли свой Telegram-бот?',
  'faq.1.a': 'Нет. Магазин работает по обычной ссылке — отдельный бот настраивать не нужно.',
  'faq.2.q': 'Сколько это стоит?',
  'faq.2.a': 'Сейчас, в закрытой бете, — бесплатно. Первые продавцы фиксируют раннюю цену на будущее.',
  'faq.3.q': 'Чем это лучше Uzum или Olcha?',
  'faq.3.a': 'Маркетплейс берёт ~15% с каждой продажи и не даёт своего бренда. У вас — собственная витрина, свои клиенты и без комиссии с продаж.',
  'faq.4.q': 'А как же оплата?',
  'faq.4.a': 'Онлайн-оплата (Click/Payme) подключим на следующем этапе. Сейчас заказ оформляется в магазине, оплату принимаете удобным вам способом.',
  'faq.5.q': 'Я уже продаю в Telegram. Сложно перейти?',
  'faq.5.a': 'Нет. Добавляете товары, получаете ссылку и делитесь ею вместо ручных переписок — клиенты те же.',

  // final cta
  'final.title': 'Запустите магазин за 5 минут',
  'final.subtitle': 'Бесплатно, пока идёт бета. Без сайтостроения и комиссий.',

  // footer
  'footer.tagline': 'Магазин в Telegram для продавцов Узбекистана.',
  'footer.product': 'Продукт',
  'footer.legal': 'Документы',
  'footer.offer': 'Публичная оферта',
  'footer.privacy': 'Политика конфиденциальности',
  'footer.terms': 'Условия использования',
  'footer.contact': 'Связаться',
  'footer.rights': '© 2026 maxsavdo',
} as const;

export type RuKey = keyof typeof ru;
```

- [ ] **Step 3: Создать `uz.ts` (узбекская латиница; тип заставляет покрыть все ключи)**

```ts
import type { ru } from './ru';

// Каждый ключ из ru ОБЯЗАН присутствовать — Record<keyof typeof ru, string>.
// Пропустишь ключ → ошибка tsc при build. Это наш «тест паритета».
export const uz: Record<keyof typeof ru, string> = {
  'nav.how': 'Qanday ishlaydi',
  'nav.features': 'Imkoniyatlar',
  'nav.pricing': 'Tariflar',
  'nav.faq': 'Savol-javob',
  'nav.login': 'Kirish',
  'nav.dashboard': 'Kabinetga',
  'cta.create': 'Do‘kon yaratish',
  'cta.createFree': 'Bepul yaratish',
  'cta.demo': 'Demo do‘konni ko‘rish',
  'cta.start': 'Bepul boshlash',

  'hero.title': 'Telegram’da do‘kon — 5 daqiqada',
  'hero.subtitle': 'Mijozlar mahsulotni o‘zi tanlab, buyurtma beradi. Yuzlab «narxi?» degan xabarlarga javob berish va buyurtmalarni qo‘lda yig‘ish shart emas.',
  'hero.badge': 'Yopiq beta · birinchi sotuvchilar allaqachon shu yerda',
  'hero.metric1.value': '5 daqiqa',
  'hero.metric1.label': 'ishga tushirish',
  'hero.metric2.value': '0%',
  'hero.metric2.label': 'sotuvdan komissiya',
  'hero.metric3.value': '24/7',
  'hero.metric3.label': 'do‘kon ishlaydi',

  'problem.title': 'Direct yoki storiesda sotyapsizmi?',
  'problem.subtitle': 'Tanish holat. Va har kuni shu tufayli pul yo‘qotyapsiz.',
  'problem.1.title': 'Buyurtmalar yo‘qoladi',
  'problem.1.body': 'Kelishuvlar yozishmalarda cho‘kib ketadi, manzil va summalar chalkashadi, ba’zi buyurtmalar shunchaki unutiladi.',
  'problem.2.title': 'Yuzlab «narxi?» xabarlari',
  'problem.2.body': 'Mijoz katalogda o‘zi ko‘rishi mumkin bo‘lgan narsani siz qo‘lda qayta-qayta yozasiz.',
  'problem.3.title': 'Tahlil va checkout yo‘q',
  'problem.3.body': 'Nima sotilayotgani ko‘rinmaydi, savatcha va normal buyurtma rasmiylashtirish yo‘q.',

  'how.title': 'Bu qanday ishlaydi',
  'how.subtitle': 'Uch qadam — va do‘kon buyurtma qabul qilishga tayyor.',
  'how.1.title': 'Do‘kon yarating',
  'how.1.body': 'Telefon raqami orqali bir daqiqada ro‘yxatdan o‘tish. Sayt qurish va kod yozish shart emas.',
  'how.2.title': 'Mahsulot qo‘shing',
  'how.2.body': 'Rasm, narx, tavsif, variantlar. Katta do‘konlardagidek katalog.',
  'how.3.title': 'Havola bilan ulashing',
  'how.3.body': 'Telegram, Instagram va stories uchun bitta havola. Mijoz ochib, o‘zi buyurtma beradi.',

  'why.title': 'Nega maxsavdo, hozirgisidan ko‘ra',
  'why.col.feature': '',
  'why.col.us': 'maxsavdo',
  'why.col.dm': 'Direct / stories',
  'why.col.mp': 'Marketplace',
  'why.col.builder': 'Tilda / Shopify',
  'why.row1': 'Savatcha va checkout',
  'why.row2': 'O‘z brendi va vitrinasi',
  'why.row3': 'Sotuvdan komissiyasiz',
  'why.row4': 'Telegram ichida',
  'why.row5': 'Bir necha daqiqada ishga tushirish',
  'why.yes': 'Ha',
  'why.no': 'Yo‘q',
  'why.commission': '15% komissiya',
  'why.expensive': '$30+/oy',
  'why.note': 'Marketplace har sotuvdan ~15% oladi. Sayt konstruktorlari — oyiga $30+ va Telegram-native emas. maxsavdo — komissiya o‘rniga obuna, mijozlar allaqachon keladigan joyda.',

  'features.title': 'Sotuv uchun hammasi — qutidan',
  'features.1.title': 'Variantli katalog',
  'features.1.body': 'Rasm, narx, o‘lcham va rang, ombordagi qoldiq.',
  'features.2.title': 'Savatcha va rasmiylashtirish',
  'features.2.body': 'Mijoz buyurtmani o‘zi yig‘adi, oddiy internet-do‘kondagidek.',
  'features.3.title': 'Buyurtma va statuslar',
  'features.3.body': 'Barcha buyurtmalar bir joyda, status va tarix bilan.',
  'features.4.title': 'Sotuv tahlili',
  'features.4.body': 'Nima va qancha sotilayotgani ko‘rinadi — qo‘lda jadvalsiz.',
  'features.5.title': 'Mijoz bilan chat',
  'features.5.body': 'Buyurtma bo‘yicha savollar shu yerda, lichkada yo‘qolmaydi.',
  'features.6.title': 'Telegram ichida',
  'features.6.body': 'Do‘kon mijozlaringiz allaqachon o‘tirgan joyda ochiladi.',

  'pricing.title': 'Hozir — bepul',
  'pricing.subtitle': 'Yopiq beta. Birinchi sotuvchilar uchun erta narx mustahkamlanadi.',
  'pricing.cta': 'Bepul boshlash',
  'pricing.ladder.title': 'Keyin — o‘sish uchun oddiy rejalar',
  'pricing.tier.free': 'Free',
  'pricing.tier.free.desc': 'Start va birinchi sotuvlar',
  'pricing.tier.pro': 'Pro',
  'pricing.tier.pro.desc': 'Faol do‘konlar uchun',
  'pricing.tier.business': 'Business',
  'pricing.tier.business.desc': 'Bir nechta do‘kon, API',
  'pricing.soon': 'tez orada',

  'faq.title': 'Ko‘p so‘raladigan savollar',
  'faq.1.q': 'O‘z Telegram-botim kerakmi?',
  'faq.1.a': 'Yo‘q. Do‘kon oddiy havola orqali ishlaydi — alohida bot sozlash shart emas.',
  'faq.2.q': 'Bu qancha turadi?',
  'faq.2.a': 'Hozir, yopiq betada, — bepul. Birinchi sotuvchilar kelajak uchun erta narxni mustahkamlaydi.',
  'faq.3.q': 'Uzum yoki Olchadan nimasi yaxshi?',
  'faq.3.a': 'Marketplace har sotuvdan ~15% oladi va o‘z brendingizni bermaydi. Sizda — shaxsiy vitrina, o‘z mijozlaringiz va sotuvdan komissiyasiz.',
  'faq.4.q': 'To‘lov-chi?',
  'faq.4.a': 'Onlayn to‘lov (Click/Payme) keyingi bosqichda ulanadi. Hozir buyurtma do‘konda rasmiylashtiriladi, to‘lovni o‘zingizga qulay tarzda qabul qilasiz.',
  'faq.5.q': 'Men allaqachon Telegram’da sotaman. O‘tish qiyinmi?',
  'faq.5.a': 'Yo‘q. Mahsulot qo‘shasiz, havola olasiz va qo‘lda yozishmalar o‘rniga uni ulashasiz — mijozlar o‘sha-o‘sha.',

  'final.title': 'Do‘koningizni 5 daqiqada ishga tushiring',
  'final.subtitle': 'Beta davomida bepul. Sayt qurishsiz va komissiyasiz.',

  'footer.tagline': 'O‘zbekiston sotuvchilari uchun Telegram’dagi do‘kon.',
  'footer.product': 'Mahsulot',
  'footer.legal': 'Hujjatlar',
  'footer.offer': 'Ommaviy oferta',
  'footer.privacy': 'Maxfiylik siyosati',
  'footer.terms': 'Foydalanish shartlari',
  'footer.contact': 'Bog‘lanish',
  'footer.rights': '© 2026 maxsavdo',
};
```

- [ ] **Step 4: Создать `I18nProvider.tsx` (client; initialLocale из cookie, без Telegram)**

```tsx
'use client';

import { createContext, useContext, useCallback, useMemo, useState, useEffect, type ReactNode } from 'react';
import { ru } from './ru';
import { uz } from './uz';
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from './types';

const DICTS: Record<Locale, Record<string, string>> = { ru, uz };

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

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

export function I18nProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    if (!SUPPORTED_LOCALES.includes(l)) return;
    setLocaleState(l);
    // cookie на год, доступна серверу при следующем рендере
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale];
      return interpolate(dict[key] ?? ru[key as keyof typeof ru] ?? key, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
```

- [ ] **Step 5: Создать `server-locale.ts` (читает cookie на сервере)**

```ts
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, SUPPORTED_LOCALES, type Locale } from './types';

// Next.js 16: cookies() — async (правило проекта: await обязательно).
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return SUPPORTED_LOCALES.includes(raw as Locale) ? (raw as Locale) : DEFAULT_LOCALE;
}
```

- [ ] **Step 6: Создать `index.ts`**

```ts
export { I18nProvider, useTranslation } from './I18nProvider';
export { getServerLocale } from './server-locale';
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './types';
```

- [ ] **Step 7: Verify build (typecheck ловит паритет ключей)**

Run: `pnpm --filter web-seller build`
Expected: компиляция проходит. Если в `uz.ts` не хватает ключа — ошибка `Property '...' is missing in type` (это и есть проверка паритета).

- [ ] **Step 8: Commit**

```bash
git add apps/web-seller/src/lib/i18n
git commit -m "feat(web-seller): i18n foundation for landing (RU+UZ, cookie-based)"
```

---

## Task 2: Demo-store + analytics утилиты

**Files:**
- Create: `apps/web-seller/src/lib/landing/demo-store.ts`
- Create: `apps/web-seller/src/lib/landing/analytics.ts`
- Modify: `apps/web-seller/.env.example`

- [ ] **Step 1: Создать `demo-store.ts`**

```ts
import { buyerStoreUrl } from '@/lib/buyer-url';

// Демо-магазин для CTA «Посмотреть демо». Если slug не задан в env —
// возвращаем null, и кнопка не рендерится (никаких мёртвых ссылок в проде).
export function demoStoreUrl(): string | null {
  const slug = process.env.NEXT_PUBLIC_DEMO_STORE_SLUG?.trim();
  if (!slug) return null;
  return buyerStoreUrl(slug);
}
```

- [ ] **Step 2: Создать `analytics.ts` (безопасный no-op врапер)**

```ts
// Лёгкий трекер событий лендинга. Если внешний аналитический слой не
// подключён — тихо ничего не делает (не роняет лендинг). Когда появится
// gtag/dataLayer/Plausible — расширяется в одном месте.
type LandingEvent = 'landing_viewed' | 'landing_cta_clicked' | 'demo_store_opened';

export function landingTrack(event: LandingEvent, props?: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...props });
  } catch {
    /* analytics никогда не должен ломать UI */
  }
}
```

- [ ] **Step 3: Добавить env-переменную в `.env.example`**

Найди в `apps/web-seller/.env.example` строку `NEXT_PUBLIC_BUYER_URL=...` и добавь ПОД ней:

```
# Slug магазина-витрины для кнопки «Посмотреть демо» на лендинге.
# Если пусто — кнопка демо не показывается. В dev есть сид-магазин 'test-store'.
NEXT_PUBLIC_DEMO_STORE_SLUG=test-store
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит.

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/lib/landing apps/web-seller/.env.example
git commit -m "feat(web-seller): demo-store + analytics helpers for landing"
```

---

## Task 3: LangToggle + LandingHeader

**Files:**
- Create: `apps/web-seller/src/components/landing/LangToggle.tsx`
- Create: `apps/web-seller/src/components/landing/LandingHeader.tsx`

- [ ] **Step 1: Создать `LangToggle.tsx`**

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

// Компактный сегмент RU / UZ. Активный язык — золотым акцентом.
export function LangToggle() {
  const { locale, setLocale } = useTranslation();
  const opts: { code: 'ru' | 'uz'; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'uz', label: 'UZ' },
  ];
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5"
      style={{ border: `1px solid ${colors.border}`, background: colors.surface }}
      role="group"
      aria-label="Язык / Til"
    >
      {opts.map((o) => {
        const active = locale === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLocale(o.code)}
            aria-pressed={active}
            className="px-2.5 py-1 text-xs font-semibold rounded-full transition-colors"
            style={{
              background: active ? colors.accent : 'transparent',
              color: active ? colors.accentTextOnBg : colors.textMuted,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Создать `LandingHeader.tsx`** (sticky; auth-aware CTA; мобильное меню)

```tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LangToggle } from './LangToggle';
import { landingTrack } from '@/lib/landing/analytics';

const ANCHORS = [
  { href: '#how', key: 'nav.how' },
  { href: '#features', key: 'nav.features' },
  { href: '#pricing', key: 'nav.pricing' },
  { href: '#faq', key: 'nav.faq' },
] as const;

export function LandingHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primaryHref = isAuthenticated ? '/dashboard' : '/login';
  const primaryLabel = isAuthenticated ? t('nav.dashboard') : t('cta.create');

  return (
    <header
      className="sticky top-0 z-50 transition-colors"
      style={{
        background: scrolled ? colors.surface : 'transparent',
        borderBottom: `1px solid ${scrolled ? colors.border : 'transparent'}`,
        backdropFilter: scrolled ? 'saturate(120%) blur(8px)' : 'none',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="maxsavdo">
          <MaxsavdoLogo size={32} />
          <span className="text-lg font-bold tracking-tight" style={{ color: colors.accent }}>maxsavdo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} className="text-sm transition-colors hover:opacity-80" style={{ color: colors.textMuted }}>
              {t(a.key)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {!isAuthenticated && (
            <Link href="/login" className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:opacity-80" style={{ color: colors.textPrimary }}>
              {t('nav.login')}
            </Link>
          )}
          <Link
            href={primaryHref}
            onClick={() => landingTrack('landing_cta_clicked', { place: 'header' })}
            className="text-sm font-bold px-4 py-2 rounded-md transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {primaryLabel}
          </Link>
        </div>

        <button type="button" className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md" aria-label="Меню" style={{ color: colors.textPrimary }} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3" style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} onClick={() => setOpen(false)} className="text-sm py-1" style={{ color: colors.textMuted }}>
              {t(a.key)}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <LangToggle />
            <ThemeToggle />
          </div>
          <Link href={primaryHref} onClick={() => { setOpen(false); landingTrack('landing_cta_clicked', { place: 'mobile-menu' }); }} className="text-sm font-bold px-4 py-2.5 rounded-md text-center" style={{ background: colors.accent, color: colors.accentTextOnBg }}>
            {primaryLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: Sanity-check импортов auth.** Открой `apps/web-seller/src/lib/auth/context.tsx` и убедись, что `useAuth()` экспортирует `isAuthenticated`. Если поле называется иначе (напр. `user`), замени `const { isAuthenticated } = useAuth()` на `const { user } = useAuth(); const isAuthenticated = !!user;` и используй его. Не выдумывай — сверься с фактическим API.

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит (страница ещё не подключает Header — это ок, компонент просто компилируется).

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/components/landing/LangToggle.tsx apps/web-seller/src/components/landing/LandingHeader.tsx
git commit -m "feat(web-seller): landing header + lang toggle"
```

---

## Task 4: Презентационные секции (Hero, Problem, HowItWorks)

**Files:**
- Create: `apps/web-seller/src/components/landing/Hero.tsx`
- Create: `apps/web-seller/src/components/landing/ProblemSection.tsx`
- Create: `apps/web-seller/src/components/landing/HowItWorks.tsx`

- [ ] **Step 1: Создать `Hero.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { demoStoreUrl } from '@/lib/landing/demo-store';
import { landingTrack } from '@/lib/landing/analytics';

export function Hero() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const demo = demoStoreUrl();
  const metrics = [
    { v: t('hero.metric1.value'), l: t('hero.metric1.label') },
    { v: t('hero.metric2.value'), l: t('hero.metric2.label') },
    { v: t('hero.metric3.value'), l: t('hero.metric3.label') },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Точечный золотой glow — premium-акцент, не перебор */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full opacity-[0.12] blur-3xl" style={{ background: colors.accent }} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center gap-6">
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
          {t('hero.badge')}
        </span>
        <h1 className="max-w-3xl text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight" style={{ color: colors.textPrimary }}>
          {t('hero.title')}
        </h1>
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            onClick={() => landingTrack('landing_cta_clicked', { place: 'hero' })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {t('cta.createFree')} <ArrowRight size={16} />
          </Link>
          {demo && (
            <a
              href={demo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => landingTrack('demo_store_opened')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-colors hover:opacity-80"
              style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              {t('cta.demo')} <ArrowRight size={16} />
            </a>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-lg">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: colors.accent }}>{m.v}</span>
              <span className="text-xs mt-1" style={{ color: colors.textMuted }}>{m.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Создать `ProblemSection.tsx`**

```tsx
'use client';

import { PackageX, MessageCircleQuestion, BarChartBig } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export function ProblemSection() {
  const { t } = useTranslation();
  const items = [
    { icon: PackageX, title: t('problem.1.title'), body: t('problem.1.body') },
    { icon: MessageCircleQuestion, title: t('problem.2.title'), body: t('problem.2.body') },
    { icon: BarChartBig, title: t('problem.3.title'), body: t('problem.3.body') },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{t('problem.title')}</h2>
        <p className="mt-2 text-sm sm:text-base" style={{ color: colors.textMuted }}>{t('problem.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="rounded-xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: colors.surfaceMuted }}>
                <Icon size={20} style={{ color: colors.danger }} />
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: colors.textPrimary }}>{it.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Создать `HowItWorks.tsx`**

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    { n: '1', title: t('how.1.title'), body: t('how.1.body') },
    { n: '2', title: t('how.2.title'), body: t('how.2.body') },
    { n: '3', title: t('how.3.title'), body: t('how.3.body') },
  ];
  return (
    <section id="how" className="scroll-mt-20" style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{t('how.title')}</h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: colors.textMuted }}>{t('how.subtitle')}</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4" style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}>
                {s.n}
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: colors.textPrimary }}>{s.title}</h3>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: colors.textMuted }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит.

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/components/landing/Hero.tsx apps/web-seller/src/components/landing/ProblemSection.tsx apps/web-seller/src/components/landing/HowItWorks.tsx
git commit -m "feat(web-seller): landing hero, problem, how-it-works sections"
```

---

## Task 5: WhyUs (сравнительная таблица) + Features

**Files:**
- Create: `apps/web-seller/src/components/landing/WhyUs.tsx`
- Create: `apps/web-seller/src/components/landing/Features.tsx`

- [ ] **Step 1: Создать `WhyUs.tsx`**

```tsx
'use client';

import { Check, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

type Cell = 'yes' | 'no' | 'commission' | 'expensive';

export function WhyUs() {
  const { t } = useTranslation();
  const cols = [t('why.col.feature'), t('why.col.us'), t('why.col.dm'), t('why.col.mp'), t('why.col.builder')];
  // [фича, us, директ, маркетплейс, конструктор]
  const rows: { label: string; cells: Cell[] }[] = [
    { label: t('why.row1'), cells: ['yes', 'no', 'yes', 'yes'] },
    { label: t('why.row2'), cells: ['yes', 'no', 'no', 'yes'] },
    { label: t('why.row3'), cells: ['yes', 'yes', 'commission', 'yes'] },
    { label: t('why.row4'), cells: ['yes', 'yes', 'no', 'no'] },
    { label: t('why.row5'), cells: ['yes', 'yes', 'no', 'expensive'] },
  ];

  const renderCell = (c: Cell, isUs: boolean) => {
    if (c === 'yes') return <Check size={18} style={{ color: isUs ? colors.accent : colors.success }} className="mx-auto" aria-label={t('why.yes')} />;
    if (c === 'no') return <X size={18} style={{ color: colors.textDim }} className="mx-auto" aria-label={t('why.no')} />;
    if (c === 'commission') return <span className="text-xs" style={{ color: colors.warning }}>{t('why.commission')}</span>;
    return <span className="text-xs" style={{ color: colors.warning }}>{t('why.expensive')}</span>;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('why.title')}</h2>
      <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.border}` }}>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr style={{ background: colors.surface }}>
              {cols.map((c, i) => (
                <th key={i} className="px-4 py-3 text-center font-semibold" style={{ color: i === 1 ? colors.accent : colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <td className="px-4 py-3 font-medium text-left" style={{ color: colors.textPrimary }}>{r.label}</td>
                {r.cells.map((c, ci) => (
                  <td key={ci} className="px-4 py-3 text-center" style={{ background: ci === 0 ? colors.accentMuted : 'transparent' }}>
                    {renderCell(c, ci === 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-center max-w-2xl mx-auto" style={{ color: colors.textMuted }}>{t('why.note')}</p>
    </section>
  );
}
```

- [ ] **Step 2: Создать `Features.tsx`**

```tsx
'use client';

import { LayoutGrid, ShoppingCart, ClipboardList, LineChart, MessagesSquare, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export function Features() {
  const { t } = useTranslation();
  const items = [
    { icon: LayoutGrid, title: t('features.1.title'), body: t('features.1.body') },
    { icon: ShoppingCart, title: t('features.2.title'), body: t('features.2.body') },
    { icon: ClipboardList, title: t('features.3.title'), body: t('features.3.body') },
    { icon: LineChart, title: t('features.4.title'), body: t('features.4.body') },
    { icon: MessagesSquare, title: t('features.5.title'), body: t('features.5.body') },
    { icon: Send, title: t('features.6.title'), body: t('features.6.body') },
  ];
  return (
    <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('features.title')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="rounded-xl p-6 transition-transform hover:-translate-y-0.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: colors.accentMuted }}>
                <Icon size={20} style={{ color: colors.accent }} />
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: colors.textPrimary }}>{it.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/components/landing/WhyUs.tsx apps/web-seller/src/components/landing/Features.tsx
git commit -m "feat(web-seller): landing why-us comparison + features grid"
```

---

## Task 6: Pricing (beta) + Faq (аккордеон)

**Files:**
- Create: `apps/web-seller/src/components/landing/Pricing.tsx`
- Create: `apps/web-seller/src/components/landing/Faq.tsx`

- [ ] **Step 1: Создать `Pricing.tsx`** (крупный beta-блок + тизер лестницы без цифр)

```tsx
'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const tiers = [
    { name: t('pricing.tier.free'), desc: t('pricing.tier.free.desc'), price: '0', highlight: false },
    { name: t('pricing.tier.pro'), desc: t('pricing.tier.pro.desc'), price: t('pricing.soon'), highlight: true },
    { name: t('pricing.tier.business'), desc: t('pricing.tier.business.desc'), price: t('pricing.soon'), highlight: false },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      {/* Главный beta-блок */}
      <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}>
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('pricing.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('pricing.subtitle')}</p>
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          onClick={() => landingTrack('landing_cta_clicked', { place: 'pricing' })}
          className="inline-flex mt-6 px-7 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          {t('pricing.cta')}
        </Link>
      </div>

      {/* Тизер лестницы — без цифр */}
      <p className="text-center text-sm font-medium mt-12 mb-6" style={{ color: colors.textMuted }}>{t('pricing.ladder.title')}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-xl p-6 flex flex-col" style={{ background: colors.surface, border: `1px solid ${tier.highlight ? colors.accentBorder : colors.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{tier.name}</h3>
              {tier.highlight && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: colors.accent, color: colors.accentTextOnBg }}>★</span>}
            </div>
            <p className="text-xs mt-1 mb-3" style={{ color: colors.textMuted }}>{tier.desc}</p>
            <div className="text-lg font-bold" style={{ color: tier.price === '0' ? colors.accent : colors.textDim }}>
              {tier.price === '0' ? `0 ${'сум'}` : tier.price}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

> Примечание: «сум» в Free-тире намеренно литералом (валюта не локализуется в RU/UZ Latin одинаково — «сум»/«so‘m»). Если нужна локализация — добавь ключ `pricing.currency` в оба словаря и подставь `t('pricing.currency')`. Для беты литерал допустим.

- [ ] **Step 2: Создать `Faq.tsx`** (аккордеон на `<details>` — нулевой JS, доступно)

```tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export function Faq() {
  const { t } = useTranslation();
  const items = [1, 2, 3, 4, 5].map((n) => ({ q: t(`faq.${n}.q`), a: t(`faq.${n}.a`) }));
  return (
    <section id="faq" className="scroll-mt-20" style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('faq.title')}</h2>
        <div className="flex flex-col gap-3">
          {items.map((it, i) => (
            <details key={i} className="group rounded-xl px-5 py-4" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
              <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {it.q}
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" style={{ color: colors.textMuted }} />
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/components/landing/Pricing.tsx apps/web-seller/src/components/landing/Faq.tsx
git commit -m "feat(web-seller): landing pricing (beta) + faq accordion"
```

---

## Task 7: FinalCta + LandingFooter + LandingPage (компоновка) + подключение к роуту

**Files:**
- Create: `apps/web-seller/src/components/landing/FinalCta.tsx`
- Create: `apps/web-seller/src/components/landing/LandingFooter.tsx`
- Create: `apps/web-seller/src/components/landing/LandingPage.tsx`
- Modify: `apps/web-seller/src/app/page.tsx`

- [ ] **Step 1: Создать `FinalCta.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function FinalCta() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-2xl p-10 sm:p-16 text-center" style={{ background: colors.accent }}>
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.accentTextOnBg }}>{t('final.title')}</h2>
        <p className="mt-3 text-sm sm:text-base opacity-90" style={{ color: colors.accentTextOnBg }}>{t('final.subtitle')}</p>
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          onClick={() => landingTrack('landing_cta_clicked', { place: 'final' })}
          className="inline-flex items-center gap-2 mt-7 px-7 py-3 rounded-md text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: colors.bg, color: colors.textPrimary }}
        >
          {t('cta.createFree')} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Создать `LandingFooter.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';
import { buyerStoreUrl } from '@/lib/buyer-url';
import { LangToggle } from './LangToggle';

// Legal-страницы (оферта/политика/условия) живут в web-buyer.
function buyerLink(path: string) {
  // buyerStoreUrl ожидает slug; для legal — собираем origin вручную.
  return buyerStoreUrl('').replace(/\/$/, '') + path;
}

export function LandingFooter() {
  const { t } = useTranslation();
  return (
    <footer style={{ background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-3">
            <MaxsavdoLogo size={28} />
            <span className="text-base font-bold" style={{ color: colors.accent }}>maxsavdo</span>
          </Link>
          <p className="text-xs max-w-xs" style={{ color: colors.textMuted }}>{t('footer.tagline')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>{t('footer.legal')}</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li><a href={buyerLink('/offer')} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.offer')}</a></li>
            <li><a href={buyerLink('/privacy')} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.privacy')}</a></li>
            <li><a href={buyerLink('/terms')} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.terms')}</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>{t('footer.contact')}</p>
          <a href="https://t.me/savdo_builderBOT" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: colors.info }}>
            <Send size={16} /> @savdo_builderBOT
          </a>
          <div className="mt-4"><LangToggle /></div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs" style={{ color: colors.textDim, borderTop: `1px solid ${colors.border}` }}>
        {t('footer.rights')}
      </div>
    </footer>
  );
}
```

> Примечание по `buyerLink`: `buyerStoreUrl('')` даёт `<origin>/`. Если по факту хелпер ведёт себя иначе — используй `process.env.NEXT_PUBLIC_BUYER_URL` напрямую. Сверься с `apps/web-seller/src/lib/buyer-url.ts` (уже прочитан в исследовании).

- [ ] **Step 3: Создать `LandingPage.tsx` (компоновка всех секций)**

```tsx
'use client';

import { useEffect } from 'react';
import { LandingHeader } from './LandingHeader';
import { Hero } from './Hero';
import { ProblemSection } from './ProblemSection';
import { HowItWorks } from './HowItWorks';
import { WhyUs } from './WhyUs';
import { Features } from './Features';
import { Pricing } from './Pricing';
import { Faq } from './Faq';
import { FinalCta } from './FinalCta';
import { LandingFooter } from './LandingFooter';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function LandingPage() {
  useEffect(() => { landingTrack('landing_viewed'); }, []);
  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <LandingHeader />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <WhyUs />
        <Features />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 4: Заменить `app/page.tsx`** (было `redirect("/dashboard")`)

Полностью замени содержимое `apps/web-seller/src/app/page.tsx` на:

```tsx
import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import { getServerLocale } from '@/lib/i18n/server-locale';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'maxsavdo — магазин в Telegram за 5 минут',
  description: 'Создайте свой магазин в Telegram. Каталог, корзина, заказы и аналитика — без сайтостроения и комиссии с продаж.',
};

export default async function HomePage() {
  const locale = await getServerLocale();
  return (
    <I18nProvider initialLocale={locale}>
      <LandingPage />
    </I18nProvider>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `pnpm --filter web-seller build`
Expected: проходит, `/` собирается как страница лендинга (не редирект).

- [ ] **Step 6: Commit**

```bash
git add apps/web-seller/src/components/landing/FinalCta.tsx apps/web-seller/src/components/landing/LandingFooter.tsx apps/web-seller/src/components/landing/LandingPage.tsx apps/web-seller/src/app/page.tsx
git commit -m "feat(web-seller): assemble landing page on root route"
```

---

## Task 8: Визуальная верификация + полировка

**Files:** правки по результатам (любые `components/landing/*`).

- [ ] **Step 1: Запустить dev-сервер**

Run (фон): `pnpm --filter web-seller dev`
Дождись `Ready` на `http://localhost:3000` (или порт из вывода).

- [ ] **Step 2: Снять скриншоты во всех комбинациях через Playwright**

Для каждой комбинации: язык RU/UZ (переключатель в шапке), тема dark/light (переключатель), ширина 1440 (desktop) и 390 (mobile). Навигация: `http://localhost:3000/`.
Снять full-page скриншот в каждой. Минимум проверить: dark+RU+desktop, dark+RU+mobile, light+RU+desktop, dark+UZ+desktop.

- [ ] **Step 3: Чек-лист соответствия дизайн-системе** (по `docs/design/maxsavdo-design-v2.md`)

Проверить на скриншотах:
- Золото (`accent`) — точечно: одна главная CTA-доминанта на экран, не «золотая каша».
- Контраст текста AA в обеих темах (особенно `textMuted` на `surface`).
- 8px-grid: отступы кратны 4 (gap/padding).
- Hero читается без скролла; метрики не ломаются на mobile (grid-cols-3).
- Сравнительная таблица скроллится по горизонтали на mobile, не ломает layout.
- FAQ `<details>` раскрывается, шеврон поворачивается.
- Переключение RU↔UZ меняет ВСЕ тексты мгновенно, без перезагрузки; нет «сырых» ключей (напр. `hero.title` вместо текста — значит ключ потерян).
- Демо-кнопка: при заданном `NEXT_PUBLIC_DEMO_STORE_SLUG` ведёт на `<buyer>/test-store`; без него — отсутствует.

- [ ] **Step 4: Исправить найденное** инлайн в соответствующих компонентах (spacing, контраст, переносы строк, мобильные брейки). После каждой правки — `pnpm --filter web-seller build`.

- [ ] **Step 5: Финальная проверка lint + build**

Run: `pnpm --filter web-seller lint`
Expected: без ошибок.
Run: `pnpm --filter web-seller build`
Expected: проходит.

- [ ] **Step 6: Commit полировки**

```bash
git add apps/web-seller/src/components/landing
git commit -m "fix(web-seller): landing visual polish — spacing, contrast, mobile"
```

---

## Self-Review (выполнено автором плана)

**Spec coverage:**
- §3 Архитектура (root `/` = лендинг, auth-aware CTA) → Task 7 Step 4 + Task 3.
- §4 Язык RU+UZ (паттерн TMA, cookie, латиница) → Task 1.
- §5 Визуал Dark Luxury (токены, золотой glow, одна CTA) → Tasks 4–7 + чек Task 8.
- §6 Все 10 секций → Tasks 3–7 (header, hero, problem, how, why, features, pricing, faq, final, footer).
- §7 Демо-магазин (env, скрытие) + соцпруф (badge) + тарифы без цифр → Task 2 + Hero badge + Pricing.
- §8 Отстройка от qlay (no-commission в WhyUs, скорость, демо) → WhyUs + Hero.
- §9 Файлы + env + аналитика → структура + Task 2.

**Placeholder scan:** копирайт RU+UZ задан полностью в Task 1; код секций полный; нет TBD. Два явных «Примечания» (currency-литерал, buyerLink) — это осознанные допущения с инструкцией сверки, не заглушки.

**Type consistency:** `t(key)` использует строковые ключи, существующие в `ru.ts`; `Locale='ru'|'uz'` единообразно; `colors.*` — только токены web-seller (`accent/accentTextOnBg/accentMuted/accentBorder/textPrimary/textMuted/textDim/surface/surfaceMuted/border/bg/danger/warning/success/info`), сверены с `lib/styles.ts`. `useAuth().isAuthenticated` помечен для сверки в Task 3 Step 3 (с фоллбэком).

**Открытые сверки для исполнителя (не блокеры, есть фоллбэк):** (1) `useAuth` API; (2) поведение `buyerStoreUrl('')` для legal-ссылок.
