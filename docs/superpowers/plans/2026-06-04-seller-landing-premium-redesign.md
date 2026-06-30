# Seller Landing — Premium Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переработать существующий лендинг `web-seller` в премиум-версию, которая сильнее qlay.uz: премиум-моушн, секция «Витрины», новая тарифная лестница (Free / Pro 149k / Studio 399k), мягко-нишевый копирайт.

**Architecture:** Лендинг уже существует (`apps/web-seller/src/app/page.tsx` → `components/landing/*`, i18n RU/UZ cookie-based). Это РЕВИЗИЯ: правим копирайт (i18n), добавляем моушн-фундамент (CSS + `useReveal` хук на IntersectionObserver), новую секцию `Showcase`, перерабатываем `Hero` и `Pricing`. Server Components где можно; client только для интерактива и моушна. Никаких JS-анимационных библиотек — только CSS `transform`/`opacity`.

**Tech Stack:** Next.js (App Router) + TypeScript + Tailwind + существующие токены `@/lib/styles` (`colors.*`) + lucide-react. i18n — собственный словарь `@/lib/i18n`.

**Verification model:** Визуальная работа без unit-тестов. Каждая задача проверяется: (1) `pnpm --filter web-seller build` / `tsc` зелёный, (2) визуально в dev (`pnpm --filter web-seller dev`), (3) финально — Lighthouse LCP < 2.5s на эмуляции 3G. Это явный осознанный выбор, не пропуск тестов.

**Спека:** `docs/superpowers/specs/2026-06-04-seller-landing-premium-redesign-design.md`
**Цены:** `docs/business/pricing-rationale-v2-2026-06-04.md`

---

### Task 1: i18n — премиум-копирайт + новые ключи (тарифы/витрины/период)

**Files:**
- Modify: `apps/web-seller/src/lib/i18n/ru.ts` (source of truth по набору ключей)
- Modify: `apps/web-seller/src/lib/i18n/uz.ts` (зеркало — tsc заставит совпасть)

- [ ] **Step 1: Обновить премиум-копирайт и добавить ключи в `ru.ts`**

Заменить значения hero/why/pricing и добавить новые блоки. Ключевые изменения (остальные строки оставить):

```ts
  // hero — премиум, мягкая ниша
  'hero.badge': 'Закрытая бета · первые продавцы уже здесь',
  'hero.title': 'Магазин, который выглядит дорого',
  'hero.subtitle': 'Преврати Instagram в витрину с корзиной и заказами — за 5 минут. Без комиссии: все деньги твои.',
  // showcase (НОВОЕ)
  'showcase.title': 'Так выглядит твой магазин',
  'showcase.subtitle': 'Настоящие витрины на maxsavdo — премиальные, быстрые, твои.',
  'showcase.cta': 'Открыть магазин',
  // pricing — новая лестница с ценами + founding
  'pricing.title': 'Сейчас — бесплатно для первых',
  'pricing.subtitle': 'Закрытая бета. Ранняя цена закрепляется за тобой навсегда.',
  'pricing.ladder.title': 'Простые планы под рост',
  'pricing.tier.free': 'Free',
  'pricing.tier.free.desc': 'Старт и первые продажи',
  'pricing.tier.free.feat': '20 товаров · витрина · базовые заказы',
  'pricing.tier.pro': 'Pro',
  'pricing.tier.pro.desc': 'Для растущего бренда',
  'pricing.tier.pro.feat': '∞ товаров · свой домен · AI-подача · аналитика · без бейджа',
  'pricing.tier.studio': 'Studio',
  'pricing.tier.studio.desc': 'Несколько магазинов и команда',
  'pricing.tier.studio.feat': 'всё из Pro · мульти-стор · команда · приоритет',
  'pricing.perMonth': '/мес',
  'pricing.free': 'бесплатно',
  'pricing.foundingNote': 'Сейчас бесплатно для первых · −25% при оплате за год',
  // faq — обновить про оплату и добавить отмену
  'faq.4.a': 'Онлайн-оплату (Click/Payme) подключим на следующем этапе. Сейчас заказ оформляется в магазине, оплату принимаешь удобным способом — и без всякой комиссии.',
  'faq.6.q': 'Что будет после беты?',
  'faq.6.a': 'Появятся платные планы, но ранняя цена закрепится за первыми продавцами. Не оплатишь — магазин просто встанет на паузу (Free), товары сохранятся.',
```

Заменить `pricing.tier.business*` ключи на `pricing.tier.studio*` (Business → Studio). Удалить устаревший `pricing.soon` если больше не используется (проверить grep — он использовался только в Pricing.tsx, который перепишем в Task 5).

- [ ] **Step 2: Зеркалить все ключи в `uz.ts` (UZ латиница, нативно)**

```ts
  'hero.title': 'Qimmat ko‘rinadigan do‘kon',
  'hero.subtitle': 'Instagram’ingizni 5 daqiqada savatcha va buyurtmali vitrinaga aylantiring. Komissiyasiz — barcha pul sizniki.',
  'showcase.title': 'Do‘koningiz mana shunday ko‘rinadi',
  'showcase.subtitle': 'maxsavdo’dagi haqiqiy vitrinalar — premium, tez, sizniki.',
  'showcase.cta': 'Do‘konni ochish',
  'pricing.title': 'Hozir — birinchilar uchun bepul',
  'pricing.subtitle': 'Yopiq beta. Erta narx siz uchun abadiy mustahkamlanadi.',
  'pricing.ladder.title': 'O‘sish uchun oddiy rejalar',
  'pricing.tier.free.desc': 'Boshlash va birinchi sotuvlar',
  'pricing.tier.free.feat': '20 mahsulot · vitrina · oddiy buyurtmalar',
  'pricing.tier.pro.desc': 'O‘sayotgan brend uchun',
  'pricing.tier.pro.feat': '∞ mahsulot · o‘z domeni · AI · analitika · belgisiz',
  'pricing.tier.studio': 'Studio',
  'pricing.tier.studio.desc': 'Bir nechta do‘kon va jamoa',
  'pricing.tier.studio.feat': 'Pro’dagi hammasi · multi-do‘kon · jamoa · ustuvor',
  'pricing.perMonth': '/oy',
  'pricing.free': 'bepul',
  'pricing.foundingNote': 'Hozir birinchilar uchun bepul · yillik to‘lovda −25%',
  'faq.4.a': 'Onlayn to‘lovni (Click/Payme) keyingi bosqichda ulaymiz. Hozir buyurtma do‘konda rasmiylashtiriladi, to‘lovni qulay tarzda qabul qilasiz — komissiyasiz.',
  'faq.6.q': 'Betadan keyin nima bo‘ladi?',
  'faq.6.a': 'Pullik rejalar paydo bo‘ladi, lekin erta narx birinchilar uchun saqlanadi. To‘lamasangiz — do‘kon Free’da pauzaga o‘tadi, mahsulotlar saqlanadi.',
```

(Остальные новые/изменённые ключи перевести по аналогии — UZ латиница, без машинного перевода.)

- [ ] **Step 3: Verify build (i18n зеркальность)**

Run: `pnpm --filter web-seller exec tsc --noEmit`
Expected: PASS. Если ключ есть в ru.ts но нет в uz.ts (или наоборот) — tsc упадёт на типе словаря. Добить недостающие.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/lib/i18n/ru.ts apps/web-seller/src/lib/i18n/uz.ts
git commit -m "feat(web-seller): landing i18n — premium copy + Studio tier + showcase + period keys"
```

---

### Task 2: Моушн-фундамент (CSS-анимации + useReveal хук)

**Files:**
- Modify: `apps/web-seller/src/app/globals.css` (добавить keyframes + reveal-классы; подтвердить путь — если globals в другом месте, найти через `grep -r "@tailwind" apps/web-seller/src`)
- Create: `apps/web-seller/src/lib/landing/use-reveal.ts`

- [ ] **Step 1: Добавить CSS в globals.css**

```css
/* ===== Landing premium motion (CSS-only, GPU: opacity/transform) ===== */
@keyframes ms-glow {
  0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: .45; }
  50%      { transform: translate(-50%, -50%) scale(1.2);  opacity: .7;  }
}
@keyframes ms-floaty {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-12px); }
}
.ms-glow   { animation: ms-glow 5s ease-in-out infinite; }
.ms-floaty { animation: ms-floaty 4s ease-in-out infinite; }

/* Reveal-on-scroll */
.reveal { opacity: 0; transform: translateY(20px); transition: opacity .7s ease, transform .7s ease; }
.reveal.is-visible { opacity: 1; transform: none; }
.reveal-delay-1 { transition-delay: .12s; }
.reveal-delay-2 { transition-delay: .24s; }
.reveal-delay-3 { transition-delay: .36s; }

/* Respect reduced motion + слабые устройства */
@media (prefers-reduced-motion: reduce) {
  .ms-glow, .ms-floaty { animation: none; }
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

- [ ] **Step 2: Создать `use-reveal.ts`**

```ts
'use client';

import { useEffect, useRef } from 'react';

// Добавляет класс is-visible когда элемент входит в вьюпорт (один раз).
// Если prefers-reduced-motion — сразу видим (через CSS), observer всё равно безвреден.
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}
```

- [ ] **Step 3: Verify**

Run: `pnpm --filter web-seller exec tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/app/globals.css apps/web-seller/src/lib/landing/use-reveal.ts
git commit -m "feat(web-seller): landing premium motion foundation (reveal hook + CSS keyframes)"
```

---

### Task 3: Hero — премиум-моушн + мок телефона + новый копирайт

**Files:**
- Modify: `apps/web-seller/src/components/landing/Hero.tsx`

- [ ] **Step 1: Переписать Hero**

Добавить: дышащий glow (`.ms-glow`), парящий мок телефона справа на desktop (`.ms-floaty`), ступенчатый reveal заголовка/подзага/CTA. Сохранить существующие `useTranslation`, `useAuth`, `demoStoreUrl`, `landingTrack`, `colors`, плашки-метрики.

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
      <div aria-hidden className="ms-glow pointer-events-none absolute top-[30%] left-1/2 h-[420px] w-[720px] rounded-full blur-3xl" style={{ background: colors.accent }} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        {/* left: copy */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <span className="reveal text-xs font-medium px-3 py-1 rounded-full" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
            {t('hero.badge')}
          </span>
          <h1 className="reveal reveal-delay-1 max-w-xl text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight" style={{ color: colors.textPrimary }}>
            {t('hero.title')}
          </h1>
          <p className="reveal reveal-delay-2 max-w-lg text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
            {t('hero.subtitle')}
          </p>
          <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center gap-3 mt-2">
            <Link
              href={isAuthenticated ? '/dashboard' : '/login'}
              onClick={() => landingTrack('landing_cta_clicked', { place: 'hero' })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
            >
              {t('cta.createFree')} <ArrowRight size={16} />
            </Link>
            {demo && (
              <a href={demo} target="_blank" rel="noopener noreferrer"
                onClick={() => landingTrack('demo_store_opened')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-colors hover:opacity-80"
                style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary }}>
                {t('cta.demo')} <ArrowRight size={16} />
              </a>
            )}
          </div>
          <div className="reveal reveal-delay-3 mt-6 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-md">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start">
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: colors.accent }}>{m.v}</span>
                <span className="text-xs mt-1" style={{ color: colors.textMuted }}>{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right: floating phone mockup */}
        <div className="hidden lg:flex justify-center">
          <div className="ms-floaty relative w-[260px] h-[520px] rounded-[2.5rem] p-3" style={{ border: `2px solid ${colors.accentBorder}`, background: colors.surface, boxShadow: `0 30px 80px ${colors.accentMuted}` }}>
            <div className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col" style={{ background: colors.bg }}>
              <div className="h-28" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBorder})` }} />
              <div className="p-3 grid grid-cols-2 gap-2">
                {[0,1,2,3].map((i) => (
                  <div key={i} className="rounded-lg" style={{ aspectRatio: '3/4', background: colors.surface, border: `1px solid ${colors.border}` }} />
                ))}
              </div>
              <div className="mt-auto m-3 h-10 rounded-md" style={{ background: colors.accent }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

> Примечание: мок телефона — CSS-плейсхолдер (быстро, без внешних картинок). Если позже захотим реальный скриншот storefront — заменить внутренность на `next/image` с `priority`. Пока приоритет LCP → без тяжёлой картинки.

- [ ] **Step 2: Verify** — `pnpm --filter web-seller exec tsc --noEmit` → PASS; визуально проверить hero в dev (glow дышит, телефон парит, на mobile телефон скрыт).

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/components/landing/Hero.tsx
git commit -m "feat(web-seller): premium hero — glow + floating phone mockup + reveal copy"
```

---

### Task 4: Секция «Витрины» (Showcase) — env-helper + компонент + врезка

**Files:**
- Create: `apps/web-seller/src/lib/landing/showcase.ts`
- Create: `apps/web-seller/src/components/landing/Showcase.tsx`
- Modify: `apps/web-seller/src/components/landing/LandingPage.tsx` (вставить `<Showcase />` после `<HowItWorks />`)

- [ ] **Step 1: env-helper `showcase.ts`**

```ts
import { buyerStoreUrl } from '@/lib/buyer-url';

export interface ShowcaseStore { slug: string; url: string; }

// Список витрин для секции showcase из env (slug через запятую).
// Пусто → [] → секция не рендерится (никаких мёртвых ссылок в проде).
export function showcaseStores(): ShowcaseStore[] {
  const raw = process.env.NEXT_PUBLIC_SHOWCASE_SLUGS?.trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
    .map((slug) => ({ slug, url: buyerStoreUrl(slug) }));
}
```

- [ ] **Step 2: Компонент `Showcase.tsx`**

```tsx
'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { showcaseStores } from '@/lib/landing/showcase';
import { useReveal } from '@/lib/landing/use-reveal';
import { landingTrack } from '@/lib/landing/analytics';
import { ArrowUpRight } from 'lucide-react';

export function Showcase() {
  const { t } = useTranslation();
  const stores = showcaseStores();
  const ref = useReveal<HTMLDivElement>();
  if (stores.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div ref={ref} className="reveal text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('showcase.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('showcase.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <a key={s.slug} href={s.url} target="_blank" rel="noopener noreferrer"
            onClick={() => landingTrack('showcase_store_opened', { slug: s.slug })}
            className="group reveal rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
            <div className="h-44" style={{ background: `linear-gradient(135deg, ${colors.accentMuted}, ${colors.surface})` }} />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{s.slug}</span>
              <ArrowUpRight size={16} style={{ color: colors.accent }} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
```

> `showcase_store_opened` — новый analytics-эвент. Если `landingTrack` типизирован union-ом эвентов, добавить его в тип (см. `@/lib/landing/analytics`). Если строковый — править не нужно.

- [ ] **Step 3: Врезать в `LandingPage.tsx`**

Добавить импорт `import { Showcase } from './Showcase';` и вставить `<Showcase />` между `<HowItWorks />` и `<WhyUs />`.

- [ ] **Step 4: Verify** — `tsc --noEmit` PASS. Без env-переменной секция не рендерится (проверить: dev без `NEXT_PUBLIC_SHOWCASE_SLUGS` → секции нет; с `NEXT_PUBLIC_SHOWCASE_SLUGS=test-store` → карточка есть).

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/lib/landing/showcase.ts apps/web-seller/src/components/landing/Showcase.tsx apps/web-seller/src/components/landing/LandingPage.tsx
git commit -m "feat(web-seller): landing showcase section (real storefronts gallery, env-gated)"
```

---

### Task 5: Тарифы — новая лестница Free / Pro 149k / Studio 399k + founding

**Files:**
- Modify: `apps/web-seller/src/components/landing/Pricing.tsx`

- [ ] **Step 1: Переписать Pricing**

Сохранить founding-баннер (верхний accent-блок) и CTA. Заменить тизер-лестницу «без цифр» на 3 карточки с ценами и фичами; Pro подсвечен; внизу — founding/период-нота.

```tsx
'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';
import { landingTrack } from '@/lib/landing/analytics';

export function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ref = useReveal<HTMLDivElement>();
  const tiers = [
    { name: t('pricing.tier.free'),   desc: t('pricing.tier.free.desc'),   feat: t('pricing.tier.free.feat'),   price: t('pricing.free'), highlight: false },
    { name: t('pricing.tier.pro'),    desc: t('pricing.tier.pro.desc'),    feat: t('pricing.tier.pro.feat'),    price: '149 000', highlight: true },
    { name: t('pricing.tier.studio'), desc: t('pricing.tier.studio.desc'), feat: t('pricing.tier.studio.feat'), price: '399 000', highlight: false },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}>
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('pricing.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('pricing.subtitle')}</p>
        <Link href={isAuthenticated ? '/dashboard' : '/login'}
          onClick={() => landingTrack('landing_cta_clicked', { place: 'pricing' })}
          className="inline-flex mt-6 px-7 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}>
          {t('pricing.cta')}
        </Link>
      </div>

      <p className="text-center text-sm font-medium mt-12 mb-6" style={{ color: colors.textMuted }}>{t('pricing.ladder.title')}</p>
      <div ref={ref} className="reveal grid gap-4 sm:grid-cols-3">
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-xl p-6 flex flex-col" style={{ background: colors.surface, border: `1px solid ${tier.highlight ? colors.accentBorder : colors.border}`, boxShadow: tier.highlight ? `0 20px 50px ${colors.accentMuted}` : 'none' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{tier.name}</h3>
              {tier.highlight && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: colors.accent, color: colors.accentTextOnBg }}>★</span>}
            </div>
            <p className="text-xs mt-1 mb-3" style={{ color: colors.textMuted }}>{tier.desc}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: tier.price === t('pricing.free') ? colors.accent : colors.textPrimary }}>{tier.price}</span>
              {tier.price !== t('pricing.free') && <span className="text-xs" style={{ color: colors.textMuted }}>{t('pricing.perMonth')}</span>}
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: colors.textMuted }}>{tier.feat}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs mt-6" style={{ color: colors.textDim }}>{t('pricing.foundingNote')}</p>
    </section>
  );
}
```

- [ ] **Step 2: Verify** — `tsc --noEmit` PASS; визуально: 3 карточки, Pro подсвечен с тенью, цены 149 000/399 000, Free = «бесплатно», нота снизу.

- [ ] **Step 3: Commit**

```bash
git add apps/web-seller/src/components/landing/Pricing.tsx
git commit -m "feat(web-seller): landing pricing ladder — Free / Pro 149k / Studio 399k + founding note"
```

---

### Task 6: Reveal-моушн по остальным секциям + WhyUs/Features под премиум-тон

**Files:**
- Modify: `apps/web-seller/src/components/landing/ProblemSection.tsx`
- Modify: `apps/web-seller/src/components/landing/HowItWorks.tsx`
- Modify: `apps/web-seller/src/components/landing/WhyUs.tsx`
- Modify: `apps/web-seller/src/components/landing/Features.tsx`
- Modify: `apps/web-seller/src/components/landing/FinalCta.tsx`

- [ ] **Step 1: Прочитать каждый файл** перед правкой (узнать текущую разметку — компоненты ещё не читались в этом плане).

Run: открыть все 5 файлов, найти корневой `<section>` и сетку карточек.

- [ ] **Step 2: В каждом компоненте добавить reveal**

Паттерн (применить к корневому контейнеру секции и/или к сетке карточек):
1. Импорт: `import { useReveal } from '@/lib/landing/use-reveal';`
2. В теле: `const ref = useReveal<HTMLDivElement>();`
3. На контейнере заголовка/сетки: добавить `ref={ref}` и className `reveal` (для staggered карточек — навесить `reveal reveal-delay-1/2/3` на отдельные карточки по индексу, но достаточно одного reveal на блок, чтобы не усложнять).

Пример для сетки из 3 карточек:
```tsx
const ref = useReveal<HTMLDivElement>();
// ...
<div ref={ref} className="reveal grid ...">
  {items.map((it, i) => ( <div key={i} className={`... ${['','reveal-delay-1','reveal-delay-2'][i] ?? ''}`}> ... </div> ))}
</div>
```
> Если компонент — Server Component (нет `'use client'`), добавить `'use client'` сверху (useReveal требует клиента). Проверить: эти секции, скорее всего, уже client (используют useTranslation). Если так — просто добавить хук.

- [ ] **Step 3: Verify** — `tsc --noEmit` PASS; визуально проскроллить лендинг: секции плавно появляются; при системном reduced-motion (вкл. в ОС) — появляются сразу без анимации.

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/components/landing/ProblemSection.tsx apps/web-seller/src/components/landing/HowItWorks.tsx apps/web-seller/src/components/landing/WhyUs.tsx apps/web-seller/src/components/landing/Features.tsx apps/web-seller/src/components/landing/FinalCta.tsx
git commit -m "feat(web-seller): reveal-on-scroll motion across landing sections"
```

---

### Task 7: Финальная проверка — build + LCP + метаданные

**Files:**
- Modify: `apps/web-seller/src/app/page.tsx` (обновить metadata под новый заголовок)
- Modify: `apps/web-seller/.env.example` (документировать `NEXT_PUBLIC_SHOWCASE_SLUGS`)

- [ ] **Step 1: Обновить metadata в `page.tsx`**

```tsx
export const metadata: Metadata = {
  title: 'maxsavdo — магазин в Telegram, который выглядит дорого',
  description: 'Преврати Instagram в премиальную витрину с корзиной и заказами за 5 минут. Без комиссии с продаж. Закрытая бета.',
};
```

- [ ] **Step 2: Документировать env**

Добавить в `apps/web-seller/.env.example`:
```
# Витрины для секции showcase на лендинге (slug магазинов через запятую). Пусто → секция скрыта.
NEXT_PUBLIC_SHOWCASE_SLUGS=
```

- [ ] **Step 3: Полный build**

Run: `pnpm --filter web-seller build`
Expected: PASS (без ошибок типов и сборки). Особое внимание — barrel `@/lib/i18n` не должен тянуть server-only в client (инцидент `0d63fa5`): сборка поймает, если регресс.

- [ ] **Step 4: LCP-проверка (ручная)**

Run: `pnpm --filter web-seller dev`, открыть `/`, Lighthouse (mobile, эмуляция Slow 3G).
Expected: LCP < 2.5s. Если выше — проверить, что нет тяжёлых картинок и анимации только transform/opacity.

- [ ] **Step 5: Commit**

```bash
git add apps/web-seller/src/app/page.tsx apps/web-seller/.env.example
git commit -m "chore(web-seller): landing metadata + document NEXT_PUBLIC_SHOWCASE_SLUGS"
```

---

## Self-Review notes

- **Spec coverage:** §3 моушн → Task 2/3/6; §4 секции (вкл. 🆕 Витрины) → Task 4; тарифы → Task 5; копирайт/i18n → Task 1; DoF metadata/env/LCP → Task 7. ✅
- **Tier rename:** `pricing.tier.business*` → `pricing.tier.studio*` согласован между Task 1 (ключи) и Task 5 (использование). Хелпер `studio`, цена 399 000 — едины.
- **Хук:** `useReveal` определён в Task 2, используется в Task 4/5/6 — сигнатура `useReveal<HTMLDivElement>()` возвращает `ref` — единообразно.
- **Analytics:** `showcase_store_opened` — новый эвент (Task 4 Step 2 отмечает проверку типа `landingTrack`).
- **Известный риск:** barrel client/server (Task 7 Step 3 ловит сборкой).
