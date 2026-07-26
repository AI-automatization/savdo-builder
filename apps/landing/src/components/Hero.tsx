'use client';

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Heart,
  Star,
  Search,
  LayoutGrid,
  ShoppingBag,
  User,
  Bell,
  Check,
  Zap,
} from 'lucide-react';
import { useMotionEligible } from '@/hooks/useMotionEligible';
import { useMouseParallax } from '@/hooks/useMouseParallax';

export type Locale = 'uz' | 'ru';

export type HeroDict = {
  badge?: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  metrics: Array<{ value: string; label: string }>;
};

type HeroProps = {
  locale: Locale;
  dict: HeroDict;
};

gsap.registerPlugin(ScrollTrigger);
// Mobile address-bar show/hide fires resize events that can otherwise trigger
// expensive full ScrollTrigger recalculations mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true });

const BOT_URL = 'https://t.me/maxsavdo_bot';
const TMA_URL = 'https://t.me/maxsavdo_bot/app';

// Supplementary phase 2/3 captions for the scroll story — restate what
// Features already says, not new claims. Kept file-local (not in the central
// Dict) since they're presentation detail for this one component, matching
// how this file already keeps small locale-keyed constants (e.g. the old
// PhoneMockup labels) separate from the shared i18n dictionary.
const PHASES: Record<Locale, Array<{ badge: string; title: string; subtitle: string }>> = {
  uz: [
    { badge: 'KATALOG', title: 'Mahsulot qoʻshing — xaridor darhol koʻradi', subtitle: 'Rasm yukladingiz — vitrina shu zahoti yangilanadi.' },
    { badge: 'BUYURTMALAR', title: 'Buyurtma va chat — bevosita Telegram’da', subtitle: 'Xaridor bilan yozishmalar, bildirishnomalar — 24/7.' },
  ],
  ru: [
    { badge: 'КАТАЛОГ', title: 'Добавьте товар — покупатель увидит сразу', subtitle: 'Загрузили фото — витрина обновилась в ту же секунду.' },
    { badge: 'ЗАКАЗЫ', title: 'Заказ и чат — прямо в Telegram', subtitle: 'Переписка с покупателем и уведомления — 24/7.' },
  ],
};

const CHIPS: Record<Locale, [string, string]> = {
  uz: ['0% komissiya', '5 daqiqada tayyor'],
  ru: ['0% комиссии', 'Готово за 5 минут'],
};

const MOCK = {
  uz: {
    storeName: 'Atelier Nur',
    rating: '4.9',
    reviews: '214',
    productsCount: '128 mahsulot',
    searchPlaceholder: 'Qidirish...',
    categories: ['Barchasi', 'Sumkalar', 'Soatlar', 'Poyabzal'],
    newLabel: 'Yangi · 128',
    sortLabel: 'Saralash',
    products: [
      { name: 'Atelier sumka', price: '1 290 000', old: '1 690 000', off: '-23%', rating: '4.9', img: '/landing/p-bag.jpg' },
      { name: 'Klassik soat', price: '2 400 000', old: null, off: null, rating: '4.8', img: '/landing/p-watch.jpg' },
      { name: 'Charm poyabzal', price: '890 000', old: null, off: null, rating: '5.0', img: '/landing/p-heels.jpg' },
      { name: 'Fransuz atir', price: '1 150 000', old: null, off: null, rating: '4.7', img: '/landing/p-perfume.jpg' },
    ],
    cartToastTitle: 'Savatga qoʻshildi',
    cartToastSubtitle: 'Klassik soat · 2 400 000 soʻm',
    orderToastTitle: 'Yangi buyurtma #1049',
    orderToastSubtitle: '1 290 000 soʻm · toʻlov qabul qilindi',
    nav: [
      { icon: LayoutGrid, label: 'Katalog', badge: 0 },
      { icon: Search, label: 'Qidiruv', badge: 0 },
      { icon: ShoppingBag, label: 'Savat', badge: 2 },
      { icon: User, label: 'Profil', badge: 0 },
    ],
  },
  ru: {
    storeName: 'Atelier Nur',
    rating: '4.9',
    reviews: '214',
    productsCount: '128 товаров',
    searchPlaceholder: 'Поиск...',
    categories: ['Все', 'Сумки', 'Часы', 'Обувь'],
    newLabel: 'Новое · 128',
    sortLabel: 'Сортировка',
    products: [
      { name: 'Сумка Atelier', price: '1 290 000', old: '1 690 000', off: '-23%', rating: '4.9', img: '/landing/p-bag.jpg' },
      { name: 'Классические часы', price: '2 400 000', old: null, off: null, rating: '4.8', img: '/landing/p-watch.jpg' },
      { name: 'Кожаные туфли', price: '890 000', old: null, off: null, rating: '5.0', img: '/landing/p-heels.jpg' },
      { name: 'Французские духи', price: '1 150 000', old: null, off: null, rating: '4.7', img: '/landing/p-perfume.jpg' },
    ],
    cartToastTitle: 'Добавлено в корзину',
    cartToastSubtitle: 'Классические часы · 2 400 000 сум',
    orderToastTitle: 'Новый заказ #1049',
    orderToastSubtitle: '1 290 000 сум · оплата получена',
    nav: [
      { icon: LayoutGrid, label: 'Каталог', badge: 0 },
      { icon: Search, label: 'Поиск', badge: 0 },
      { icon: ShoppingBag, label: 'Корзина', badge: 2 },
      { icon: User, label: 'Профиль', badge: 0 },
    ],
  },
} satisfies Record<Locale, unknown>;

function PhoneScreen({ locale }: { locale: Locale }) {
  const m = MOCK[locale];
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem]" style={{ background: '#0F0F0F' }}>
      {/* header card */}
      <div className="mx-2.5 mb-2 mt-2.5 rounded-2xl p-2.5" style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}>
        <div className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.28)', color: '#E8A552' }}
          >
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-[13px] font-bold text-brand-text">{m.storeName}</span>
              <span
                className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                style={{ background: 'rgba(37,99,235,0.20)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.45)' }}
              >
                ✓
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-brand-text">
                <Star size={8} fill="#E8A552" style={{ color: '#E8A552' }} /> {m.rating}
                <span className="font-normal text-brand-muted">({m.reviews})</span>
              </span>
              <span className="text-brand-muted">·</span>
              <span className="text-[8px] text-brand-muted">{m.productsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* search */}
      <div className="mx-2.5 mb-2 flex h-7 items-center gap-1.5 rounded-lg px-2" style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}>
        <Search size={11} className="text-brand-muted" />
        <span className="text-[8px] text-brand-muted">{m.searchPlaceholder}</span>
      </div>

      {/* category chips */}
      <div className="flex gap-1.5 overflow-hidden px-2.5">
        {m.categories.map((c, i) => (
          <span
            key={c}
            className="whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-semibold"
            style={
              i === 0
                ? { background: '#E8A552', color: '#0F0F0F' }
                : { background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)', color: '#A0A0A0' }
            }
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mb-1.5 mt-2.5 flex items-center justify-between px-2.5">
        <span className="text-[8px] font-semibold uppercase tracking-wider text-brand-muted">{m.newLabel}</span>
        <span className="text-[8px]" style={{ color: '#E8A552' }}>{m.sortLabel}</span>
      </div>

      {/* product grid */}
      <div className="relative flex-1 overflow-hidden px-2.5">
        <div className="grid grid-cols-2 content-start gap-2">
          {m.products.map((p) => (
            <div key={p.name} className="flex flex-col overflow-hidden rounded-xl" style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}>
              <div className="relative" style={{ aspectRatio: '1/1' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                {p.off && (
                  <span className="absolute left-1 top-1 rounded px-1 py-0.5 text-[7px] font-bold" style={{ background: '#E8A552', color: '#0F0F0F' }}>
                    {p.off}
                  </span>
                )}
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <Heart size={9} style={{ color: '#fff' }} />
                </span>
              </div>
              <div className="flex flex-col gap-1 px-1.5 py-1.5">
                <span className="truncate text-[9px] font-semibold leading-tight text-brand-text">{p.name}</span>
                <span className="inline-flex items-center gap-0.5 text-[7px] text-brand-muted">
                  <Star size={7} fill="#E8A552" style={{ color: '#E8A552' }} /> {p.rating}
                </span>
                <div className="flex items-end justify-between gap-1">
                  <div className="flex min-w-0 flex-col leading-none">
                    {p.old && <span className="truncate text-[7px] text-brand-muted line-through">{p.old}</span>}
                    <span className="truncate text-[9px] font-bold" style={{ color: '#E8A552' }}>{p.price}</span>
                  </div>
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[12px] font-bold leading-none"
                    style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.28)', color: '#E8A552' }}
                  >
                    +
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* state B overlay: "added to cart" toast */}
        <div
          data-layer="cart-toast"
          className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl px-2.5 py-2 opacity-0"
          style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(232,165,82,0.15)', color: '#E8A552' }}>
            <Check size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-bold text-brand-text">{m.cartToastTitle}</div>
            <div className="truncate text-[7px] text-brand-muted">{m.cartToastSubtitle}</div>
          </div>
        </div>

        {/* state C overlay: order notification */}
        <div
          data-layer="order-toast"
          className="absolute left-2 right-2 top-2 flex items-center gap-2 rounded-xl px-2.5 py-2 opacity-0"
          style={{ background: '#1A1A1A', border: '1px solid rgba(96,165,250,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(96,165,250,0.18)', color: '#60a5fa' }}>
            <Bell size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-bold text-brand-text">{m.orderToastTitle}</div>
            <div className="truncate text-[7px] text-brand-muted">{m.orderToastSubtitle}</div>
          </div>
        </div>
      </div>

      {/* bottom nav */}
      <div className="mt-auto flex items-stretch justify-around px-1 pb-2 pt-1.5" style={{ background: '#1A1A1A', borderTop: '1px solid rgba(232,165,82,0.14)' }}>
        {m.nav.map(({ icon: Icon, label, badge }, i) => (
          <div key={label} className="relative flex flex-col items-center gap-0.5" style={{ color: i === 0 ? '#E8A552' : '#A0A0A0' }}>
            <Icon size={14} />
            <span className="text-[7px] font-medium">{label}</span>
            {badge > 0 && (
              <span
                data-layer="cart-badge"
                className="absolute -top-1 right-1 flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[7px] font-bold opacity-0"
                style={{ background: '#E8A552', color: '#0F0F0F' }}
              >
                {badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Small glass stat chips floating around the hero phone. Parallax translate
// (JS, via ref) lives on the outer wrapper; the idle float (CSS keyframe)
// lives on the inner one — two elements because a single node can't have
// both a per-frame JS transform and a @keyframes transform without one
// clobbering the other every tick.
function FloatingChip({ children, depth, floatClass, style }: { children: ReactNode; depth: number; floatClass: string; style?: CSSProperties }) {
  const outerRef = useRef<HTMLDivElement>(null);
  useMouseParallax(({ x, y }) => {
    const el = outerRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${(x * depth).toFixed(1)}px, ${(y * depth).toFixed(1)}px, 0)`;
  });
  return (
    <div ref={outerRef} className="absolute" style={{ willChange: 'transform', ...style }}>
      <div className={`card-glass ${floatClass} flex items-center gap-2 rounded-2xl px-3.5 py-2`}>{children}</div>
    </div>
  );
}

export default function Hero({ locale, dict }: HeroProps) {
  const pinned = useMotionEligible(1024);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const sparkleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const phaseTextRefs = useRef<(HTMLDivElement | null)[]>([]);

  const phases = [{ badge: dict.badge ?? '', title: dict.title, subtitle: dict.subtitle }, ...PHASES[locale]];
  const chips = CHIPS[locale];

  // Product images load async; if they land after ScrollTrigger's initial
  // measurement, pin start/end offsets can go stale and the scrub starts
  // feeling "stuck". One refresh once everything has settled fixes it.
  useEffect(() => {
    if (!pinned) return;
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const images = Array.from(document.querySelectorAll('img'));
    images.forEach((img) => {
      if (!img.complete) img.addEventListener('load', refresh, { once: true });
    });
    return () => {
      window.removeEventListener('load', refresh);
      images.forEach((img) => img.removeEventListener('load', refresh));
    };
  }, [pinned]);

  useLayoutEffect(() => {
    if (!pinned) return;
    const ctx = gsap.context(() => {
      const phone = phoneRef.current!;
      const root = sectionRef.current!;
      const cartToast = root.querySelector('[data-layer="cart-toast"]');
      const cartBadge = root.querySelector('[data-layer="cart-badge"]');
      const orderToast = root.querySelector('[data-layer="order-toast"]');

      gsap.set(phone, { transformPerspective: 1400, transformStyle: 'preserve-3d', willChange: 'transform, opacity' });
      gsap.set([glowRef.current, shadowRef.current], { willChange: 'opacity' });
      gsap.set(shineRef.current, { willChange: 'transform, opacity' });
      gsap.set(phaseTextRefs.current, { opacity: 0, y: 16 });
      gsap.set(phaseTextRefs.current[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.4,
          pin: pinRef.current,
          anticipatePin: 1,
          onLeave: () => {
            gsap.set(phone, { clearProps: 'transform' });
            phone.classList.add('ms-floaty-idle');
          },
          onEnterBack: () => {
            phone.classList.remove('ms-floaty-idle');
          },
        },
      });

      // Phase 1 — flies in from off-canvas, tumbling into view.
      // No `filter` in this tween: animating blur every scrub tick forces the
      // browser to re-rasterize the whole phone each frame and is the #1 cause
      // of scroll jank/hangs — opacity+transform alone stay compositor-only.
      tl.fromTo(
        phone,
        { xPercent: 26, yPercent: 18, rotateY: -130, rotateX: 26, rotateZ: -12, scale: 0.42, opacity: 0 },
        { xPercent: 0, yPercent: 0, rotateY: -22, rotateX: 12, rotateZ: -3, scale: 0.88, opacity: 1, duration: 3, ease: 'power2.out' },
        0
      )
        // Phase 2 — turns in 3D space to face the viewer, catalog screen settles in
        .to(phone, { rotateY: 8, rotateX: 4, rotateZ: 0, scale: 1.08, duration: 3, ease: 'sine.inOut' }, 3)
        // Phase 3 — settles to resting hero pose
        .to(phone, { rotateY: 0, rotateX: 0, rotateZ: 0, scale: 1, duration: 2.2, ease: 'power3.out' }, 6);

      // Ambient glow breathes bigger as the phone approaches.
      // Opacity-only on a blurred element (never its transform/scale) — scaling
      // a blurred layer forces a re-blur at new bounds every tick, which is
      // exactly the kind of animation that hangs under software rendering.
      tl.fromTo(glowRef.current, { opacity: 0.12 }, { opacity: 0.55, duration: 8, ease: 'none' }, 0);

      // Ground shadow appears once the phone "lands" — opacity only, same reason.
      tl.fromTo(shadowRef.current, { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 6);

      // Shine sweep across the glass, timed with the turn
      tl.fromTo(shineRef.current, { xPercent: -140, opacity: 0 }, { xPercent: 220, opacity: 1, duration: 5, ease: 'power1.inOut' }, 1).to(
        shineRef.current,
        { opacity: 0, duration: 0.6 },
        5.6
      );

      // Text phase crossfade — 3 headline blocks synced to the 3 acts
      const textBlocks = phaseTextRefs.current;
      tl.to(textBlocks[0], { opacity: 0, y: -14, duration: 0.8 }, 2.4)
        .fromTo(textBlocks[1], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 2.6)
        .to(textBlocks[1], { opacity: 0, y: -14, duration: 0.8 }, 5.4)
        .fromTo(textBlocks[2], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 5.6);

      // Screen state B — "added to cart" toast + badge pop, mid-turn
      if (cartToast && cartBadge) {
        tl.to(cartToast, { opacity: 1, duration: 0.5 }, 3.4).to(cartBadge, { opacity: 1, duration: 0.3 }, 3.5).to(cartToast, { opacity: 0, duration: 0.5 }, 5.3);
      }

      // Screen state C — incoming order notification, near rest
      if (orderToast) {
        tl.to(orderToast, { opacity: 1, y: 0, duration: 0.6 }, 6.2).to(orderToast, { opacity: 0, duration: 0.6 }, 7.8);
      }

      // Sparkle burst once the phone settles into its final pose
      const sparkles = sparkleRefs.current.filter(Boolean) as HTMLSpanElement[];
      tl.fromTo(sparkles, { opacity: 0, scale: 0, y: 0 }, { opacity: 1, scale: 1, y: -22, duration: 0.9, stagger: 0.12, ease: 'power2.out' }, 6.4).to(
        sparkles,
        { opacity: 0, duration: 0.6 },
        7.2
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [pinned, locale]);

  if (!pinned) {
    return (
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div
          aria-hidden
          className="ms-glow pointer-events-none absolute left-1/2 top-[30%] h-[360px] w-[600px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: '#E8A552' }}
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 text-center">
          {dict.badge && (
            <span
              className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-accent"
              style={{ background: 'rgba(232,165,82,0.10)', border: '1px solid rgba(232,165,82,0.22)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E8A552', boxShadow: '0 0 6px rgba(232,165,82,0.7)' }} />
              {dict.badge}
            </span>
          )}
          <h1 className="text-3xl font-bold leading-tight text-brand-text sm:text-4xl">{dict.title}</h1>
          <p className="max-w-md text-base leading-relaxed text-brand-muted">{dict.subtitle}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-brand-bg transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)', boxShadow: '0 8px 28px rgba(232,165,82,0.38)' }}
            >
              {dict.ctaPrimary}
            </a>
            <a
              href={TMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-brand-text transition-all hover:border-brand-accent"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.20)' }}
            >
              {dict.ctaSecondary}
            </a>
          </div>
          <div className="mt-2 grid w-full max-w-md grid-cols-3 gap-4 sm:gap-8">
            {dict.metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center">
                <span className="text-2xl font-bold sm:text-3xl" style={{ color: '#E8A552' }}>{m.value}</span>
                <span className="mt-1 text-xs text-brand-muted">{m.label}</span>
              </div>
            ))}
          </div>
          <div className="ms-floaty-idle relative mt-6 h-[480px] w-[240px] rounded-[2.5rem] p-3" style={{ border: '7px solid rgba(232,165,82,0.42)', background: '#1A1A1A', boxShadow: '0 30px 80px rgba(232,165,82,0.25)' }}>
            <PhoneScreen locale={locale} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div ref={sectionRef} className="relative" style={{ height: '350vh' }}>
      <div ref={pinRef} className="relative flex h-screen w-full items-center overflow-hidden">
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute left-[62%] top-[30%] h-[520px] w-[820px] rounded-full blur-3xl"
          style={{ background: '#E8A552', opacity: 0.12 }}
        />
        <div className="relative mx-auto grid w-full max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-2">
          {/* left: crossfading copy */}
          <div className="relative flex min-h-[270px] flex-col items-center gap-5 text-center lg:items-start lg:text-left">
            {phases.map((p, i) => (
              <div
                key={i}
                ref={(el) => {
                  phaseTextRefs.current[i] = el;
                }}
                className="pointer-events-none absolute inset-0 flex flex-col items-center gap-5 text-center lg:items-start lg:text-left"
              >
                {p.badge && (
                  <span
                    className="inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-accent"
                    style={{ background: 'rgba(232,165,82,0.10)', border: '1px solid rgba(232,165,82,0.22)' }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#E8A552', boxShadow: '0 0 6px rgba(232,165,82,0.7)' }} />
                    {p.badge}
                  </span>
                )}
                <h2 className="max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-brand-text sm:text-4xl">{p.title}</h2>
                <p className="max-w-lg text-base leading-relaxed text-brand-muted sm:text-lg">{p.subtitle}</p>
              </div>
            ))}
            {/* static CTA + metrics, always visible below the crossfading block */}
            <div className="mt-[260px] flex flex-col items-center gap-6 sm:mt-[280px] lg:items-start">
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-brand-bg transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)', boxShadow: '0 8px 28px rgba(232,165,82,0.38)' }}
                >
                  {dict.ctaPrimary}
                </a>
                <a
                  href={TMA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-brand-text transition-all hover:border-brand-accent"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.20)' }}
                >
                  {dict.ctaSecondary}
                </a>
              </div>
              <div className="grid w-full max-w-md grid-cols-3 gap-4 sm:gap-8">
                {dict.metrics.map((m) => (
                  <div key={m.label} className="flex flex-col items-center lg:items-start">
                    <span className="text-2xl font-bold sm:text-3xl" style={{ color: '#E8A552' }}>{m.value}</span>
                    <span className="mt-1 text-xs text-brand-muted">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right: the phone, animated in 3D space */}
          <div className="relative hidden justify-center lg:flex" style={{ perspective: 1400 }}>
            <div
              ref={shadowRef}
              aria-hidden
              className="absolute bottom-[6%] h-9 w-[220px] rounded-full blur-2xl"
              style={{ background: 'rgba(0,0,0,0.55)', opacity: 0 }}
            />
            <div ref={phoneRef} className="relative h-[520px] w-[260px] rounded-[2.5rem] p-3" style={{ border: '7px solid rgba(232,165,82,0.42)', background: '#1A1A1A', boxShadow: '0 30px 80px rgba(232,165,82,0.28)' }}>
              <PhoneScreen locale={locale} />
              <div
                ref={shineRef}
                aria-hidden
                className="pointer-events-none absolute inset-3 overflow-hidden rounded-[2rem]"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)', opacity: 0 }}
              />
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    sparkleRefs.current[i] = el;
                  }}
                  className="absolute h-1.5 w-1.5 rounded-full"
                  style={{ background: '#E8A552', boxShadow: '0 0 8px 2px #E8A552', top: `${18 + i * 22}%`, left: i % 2 === 0 ? '-6%' : '104%', opacity: 0 }}
                />
              ))}
            </div>

            <FloatingChip depth={-14} floatClass="ms-floaty-2" style={{ top: '8%', left: '-8%' }}>
              <Check size={14} style={{ color: '#34d399' }} />
              <span className="whitespace-nowrap text-xs font-semibold text-brand-text">{chips[0]}</span>
            </FloatingChip>
            <FloatingChip depth={18} floatClass="ms-floaty-3" style={{ bottom: '10%', right: '-6%' }}>
              <Zap size={14} style={{ color: '#E8A552' }} />
              <span className="whitespace-nowrap text-xs font-semibold text-brand-text">{chips[1]}</span>
            </FloatingChip>
          </div>
        </div>
      </div>
    </div>
  );
}
