'use client';

import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type Ref } from 'react';
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
  MousePointer2,
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

// Which product the demo adds to the cart. It has to agree with
// `cartToastProduct` / `cartToastPrice` below (both locales name the watch) — the
// tile's button, the flying thumbnail, the badge and the toast are one story, and
// a mismatch reads as a bug.
const CART_ADDED_INDEX = 5;

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
      { name: 'Kechki sumka', price: '1 450 000', old: null, off: null, rating: '4.8', img: '/landing/p-bag.jpg' },
      { name: 'Oltin soat', price: '3 200 000', old: null, off: null, rating: '5.0', img: '/landing/p-watch.jpg' },
      { name: 'Baland poshna', price: '1 090 000', old: '1 280 000', off: '-15%', rating: '4.6', img: '/landing/p-heels.jpg' },
      { name: 'Sharq atiri', price: '780 000', old: null, off: null, rating: '4.9', img: '/landing/p-perfume.jpg' },
    ],
    cartToastTitle: 'Savatga qoʻshildi',
    // Product and price are separate so the price can land as its own beat at the
    // end of the loop — "then the price appears" is the point of the sequence.
    cartToastProduct: 'Oltin soat',
    cartToastPrice: '3 200 000 soʻm',
    orderToastTitle: 'Yangi buyurtma #1049',
    orderToastSubtitle: '1 290 000 soʻm · toʻlov qabul qilindi',
    cartTitle: 'Savat',
    cartQty: '1 dona',
    cartDeliveryLabel: 'Yetkazib berish',
    cartDeliveryValue: 'Toshkent · bugun',
    cartTotalLabel: 'Jami',
    cartConfirm: 'Buyurtmani tasdiqlash',
    cartNote: 'Komissiyasiz · toʻlov sotuvchiga',
    successTitle: 'Muvaffaqiyatli qabul qilindi',
    successSubtitle: 'Buyurtma #1049 · sotuvchi tez orada bogʻlanadi',
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
      { name: 'Вечерняя сумка', price: '1 450 000', old: null, off: null, rating: '4.8', img: '/landing/p-bag.jpg' },
      { name: 'Золотые часы', price: '3 200 000', old: null, off: null, rating: '5.0', img: '/landing/p-watch.jpg' },
      { name: 'Туфли на шпильке', price: '1 090 000', old: '1 280 000', off: '-15%', rating: '4.6', img: '/landing/p-heels.jpg' },
      { name: 'Восточный парфюм', price: '780 000', old: null, off: null, rating: '4.9', img: '/landing/p-perfume.jpg' },
    ],
    cartToastTitle: 'Добавлено в корзину',
    cartToastProduct: 'Золотые часы',
    cartToastPrice: '3 200 000 сум',
    orderToastTitle: 'Новый заказ #1049',
    orderToastSubtitle: '1 290 000 сум · оплата получена',
    cartTitle: 'Корзина',
    cartQty: '1 шт',
    cartDeliveryLabel: 'Доставка',
    cartDeliveryValue: 'Ташкент · сегодня',
    cartTotalLabel: 'Итого',
    cartConfirm: 'Подтвердить заказ',
    cartNote: 'Без комиссии · оплата продавцу',
    successTitle: 'Успешно принято',
    successSubtitle: 'Заказ #1049 · продавец скоро свяжется',
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
    <div
      data-layer="phone-screen"
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem]"
      style={{ background: '#0F0F0F' }}
    >
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

      {/* Three stacked views the loop swaps between: catalog → cart → success.
          One container so all three share the same box and the bottom nav below
          stays put, the way it would in the real mini-app. */}
      <div data-layer="views" className="relative flex-1 overflow-hidden">
      <div data-layer="view-catalog" className="absolute inset-0 flex flex-col">
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
        <div data-layer="grid" className="grid grid-cols-2 content-start gap-2">
          {m.products.map((p, pi) => (
            <div
              key={p.name}
              // The loop scrolls this tile into the middle of the visible catalog
              // before picking it, so it has to be measurable.
              data-layer={pi === CART_ADDED_INDEX ? 'target-tile' : undefined}
              className="flex flex-col overflow-hidden rounded-xl"
              style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}
            >
              <div className="relative" style={{ aspectRatio: '1/1' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {/* Intrinsic size (all four tiles are 400x400) so the browser can
                    reserve the box before the file lands — the container sizes the
                    image, but without these the row still reflows on slow networks. */}
                <img src={p.img} alt={p.name} width={400} height={400} className="h-full w-full object-cover" />
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
                  {pi === CART_ADDED_INDEX ? (
                    // Two stacked states rather than one conditional node, so the
                    // loop can cross-fade "+" into "✓" with GSAP instead of forcing
                    // a React re-render 12 times a minute. The resting state is the
                    // added one: with no GSAP (mobile / reduced motion) the tile,
                    // toast and badge still agree.
                    <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                      <span
                        data-layer="add-btn-plus"
                        className="absolute inset-0 flex items-center justify-center rounded-md text-[12px] font-bold leading-none opacity-0"
                        style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.28)', color: '#E8A552' }}
                      >
                        +
                      </span>
                      <span
                        data-layer="add-btn-check"
                        className="absolute inset-0 flex items-center justify-center rounded-md leading-none"
                        style={{ background: '#E8A552', border: '1px solid #E8A552', color: '#0F0F0F' }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </span>
                  ) : (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[12px] font-bold leading-none"
                      style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.28)', color: '#E8A552' }}
                    >
                      +
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* "added to cart" toast — part of the resting state, not a scroll beat.
            It used to fade in only between scroll positions 3.4 and 5.3, which
            meant the phone showed a plain catalog on load and the mobile/reduced
            -motion hero (no GSAP at all) never showed it once. The add-to-cart
            moment is the single most product-specific thing in this mockup, so
            it is now simply always on. */}
        <div
          data-layer="cart-toast"
          className="absolute bottom-2 left-2 right-2 flex items-center gap-2 rounded-xl px-2.5 py-2"
          style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.35)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(232,165,82,0.15)', color: '#E8A552' }}>
            <Check size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-bold text-brand-text">{m.cartToastTitle}</div>
            <div className="truncate text-[7px] text-brand-muted">{m.cartToastProduct}</div>
          </div>
          <span
            data-layer="cart-price"
            className="shrink-0 whitespace-nowrap text-[9px] font-bold"
            style={{ color: '#E8A552' }}
          >
            {m.cartToastPrice}
          </span>
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
      </div>

      {/* Cart view — the loop opens it after the item lands, then confirms. */}
      <div data-layer="view-cart" className="absolute inset-0 flex flex-col px-2.5 opacity-0">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold text-brand-text">{m.cartTitle}</span>
          <span className="text-[8px] text-brand-muted">{m.cartQty}</span>
        </div>

        <div className="flex items-center gap-2 rounded-xl p-2" style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}>
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.products[CART_ADDED_INDEX].img} alt="" width={400} height={400} className="h-full w-full object-cover" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[9px] font-semibold text-brand-text">{m.cartToastProduct}</div>
            <div className="text-[7px] text-brand-muted">{m.cartQty}</div>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[9px] font-bold" style={{ color: '#E8A552' }}>
            {m.cartToastPrice}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5 rounded-xl p-2" style={{ background: '#1A1A1A', border: '1px solid rgba(232,165,82,0.14)' }}>
          <div className="flex items-center justify-between text-[8px] text-brand-muted">
            <span>{m.cartDeliveryLabel}</span>
            <span>{m.cartDeliveryValue}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-semibold text-brand-text">{m.cartTotalLabel}</span>
            <span className="whitespace-nowrap text-[11px] font-bold" style={{ color: '#E8A552' }}>{m.cartToastPrice}</span>
          </div>
        </div>

        {/* A span, not a button: this is a picture of a button inside a decorative
            mock. A real <button> here would be focusable and announced as an
            actionable control that does nothing. */}
        <div className="mb-1.5 mt-auto flex items-center justify-center gap-1 text-[7px] text-brand-muted">
          <Check size={8} style={{ color: '#34d399' }} />
          {m.cartNote}
        </div>

        <span
          data-layer="confirm-btn"
          className="mb-2 flex h-8 items-center justify-center rounded-xl text-[10px] font-bold"
          style={{ background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)', color: '#0F0F0F' }}
        >
          {m.cartConfirm}
        </span>
      </div>

      {/* Success view — the last beat of the loop. */}
      <div data-layer="view-success" className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-5 text-center opacity-0">
        <span
          data-layer="success-mark"
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: 'rgba(52,211,153,0.16)', border: '1px solid rgba(52,211,153,0.45)', color: '#34d399' }}
        >
          <Check size={28} strokeWidth={3} />
        </span>
        <div className="text-[11px] font-bold leading-snug text-brand-text">{m.successTitle}</div>
        <div className="text-[8px] leading-relaxed text-brand-muted">{m.successSubtitle}</div>
      </div>
      </div>

      {/* The demo pointer. Decorative only — it exists so the loop can show a tap
          landing on a specific control rather than things changing on their own. */}
      <span
        data-layer="cursor"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 opacity-0"
        style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.7))' }}
      >
        <MousePointer2 size={17} fill="#ffffff" style={{ color: '#ffffff' }} strokeWidth={1.25} />
        <span
          data-layer="cursor-ring"
          className="absolute h-6 w-6 rounded-full opacity-0"
          style={{ left: -4, top: -3, border: '2px solid #E8A552' }}
        />
      </span>

      {/* The thumbnail that flies from the tile's button to the cart tab. It sits
          on the screen root rather than inside the product grid because that grid
          clips its overflow and the trip ends down in the bottom nav. Hidden until
          the loop drives it, and absent entirely without motion. */}
      <span
        data-layer="fly-item"
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-6 w-6 overflow-hidden rounded-md opacity-0"
        style={{ border: '1px solid rgba(232,165,82,0.55)' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.products[CART_ADDED_INDEX].img} alt="" width={400} height={400} className="h-full w-full object-cover" />
      </span>

      {/* bottom nav */}
      <div className="mt-auto flex items-stretch justify-around px-1 pb-2 pt-1.5" style={{ background: '#1A1A1A', borderTop: '1px solid rgba(232,165,82,0.14)' }}>
        {m.nav.map(({ icon: Icon, label, badge }, i) => (
          <div
            key={label}
            // The cart tab is the flight's destination; the loop measures it.
            data-layer={i === 0 ? 'catalog-nav' : badge > 0 ? 'cart-nav' : undefined}
            className="relative flex flex-col items-center gap-0.5"
            style={{ color: i === 0 ? '#E8A552' : '#A0A0A0' }}
          >
            <Icon size={14} />
            <span className="text-[7px] font-medium">{label}</span>
            {badge > 0 && (
              <span
                data-layer="cart-badge"
                className="absolute -top-1 right-1 flex h-3 min-w-3 items-center justify-center rounded-full px-0.5 text-[7px] font-bold"
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

// The hero phone box. Same styling both branches used inline before — kept in
// one place now so the pinned and the reduced-motion hero can't drift apart.
// Colours are unchanged; `className` is where the motion classes go.
//
// Sizing: the desktop frame tops out at 300x616 rather than the old 260x520. The
// phone is the only picture of the product on this page, and at 520px it filled
// ~71% of the hero's height — qlay.uz, the closest competitor, runs theirs at
// 320x656, ~95%, and it reads as the subject of the page instead of an inset.
// Below lg the old 240x480 stands: 300px wide does not fit a 360px phone.
//
// 616px is a ceiling, not a fixed height. It only fits when there is room for it:
// the hero box is the viewport minus the sticky header, and the frame also needs
// clearance underneath or its 80px-blur drop shadow gets cut off by the pin
// container's overflow:hidden. Hence min() against the viewport, with the aspect
// ratio (300/616 = 0.487) driving the width so the frame never distorts. On a
// 1366x768 laptop this lands ~570px instead of overflowing the fold by ~90px.
function PhoneFrame({ locale, className = '', ref }: { locale: Locale; className?: string; ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className={`relative h-[480px] w-[240px] rounded-[2.5rem] p-3 lg:h-[min(616px,calc(100vh_-_11rem))] lg:w-auto lg:aspect-[300/616] ${className}`}
      style={{ border: '7px solid rgba(232,165,82,0.42)', background: '#1A1A1A', boxShadow: '0 30px 80px rgba(232,165,82,0.28)' }}
    >
      <PhoneScreen locale={locale} />
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
      const orderToast = root.querySelector('[data-layer="order-toast"]');

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
        },
      });

      // The phone is deliberately NOT on the scroll timeline. It used to fly in
      // from off-canvas (rotateY -130°, scale 0.42, opacity 0) and only became
      // readable ~600px down the scroll — so the first thing a visitor saw was
      // an empty right half of the hero. It now arrives once, on load, and then
      // just breathes; it looks the same at any scroll position. The glass shine
      // sweep and the sparkle burst went with it: both were punctuation for a
      // landing that no longer happens.
      //
      // Why GSAP and not a CSS keyframe: pinning re-inserts this subtree into
      // ScrollTrigger's pin-spacer on every refresh() — a late-loading product
      // image or any window resize — and a re-inserted node restarts its CSS
      // animations, which replayed the whole fly-in mid-session. GSAP tweens
      // are unaffected by the node moving.
      gsap.from(phone, { opacity: 0, x: 40, y: 10, scale: 0.97, duration: 0.8, ease: 'power3.out' });
      // Idle float: slower and shorter than the chips' 4.5s/-10px loop. At 520px
      // tall the same wobble that reads as "floating" on a small chip reads as
      // drift, so no rotation either.
      gsap.to(phone, { y: -9, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.8 });

      // Text phase crossfade — 3 headline blocks synced to the 3 acts
      const textBlocks = phaseTextRefs.current;
      tl.to(textBlocks[0], { opacity: 0, y: -14, duration: 0.8 }, 2.4)
        .fromTo(textBlocks[1], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 2.6)
        .to(textBlocks[1], { opacity: 0, y: -14, duration: 0.8 }, 5.4)
        .fromTo(textBlocks[2], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 5.6);

      // ── In-phone demo loop ──────────────────────────────────────
      // A whole purchase, on repeat: browse the catalog, the pointer taps "+" on a
      // product that was off-screen, it flies into the cart, the cart tab opens,
      // confirm gets tapped, the order is accepted. Then reset and run again, forever.
      //
      // Its own timeline, deliberately not the scroll one: it has to keep playing at
      // any scroll position, including before the visitor scrolls at all. That is the
      // point — the phone reads as a short looping clip of the product rather than
      // something you have to scroll to trigger.
      //
      // The pointer matters more than it looks. Without it the screens appear to
      // change on their own, which reads as a prerecorded video; with it, every
      // change is visibly caused by a tap.
      const screen = root.querySelector('[data-layer="phone-screen"]');
      const grid = root.querySelector<HTMLElement>('[data-layer="grid"]');
      const targetTile = root.querySelector('[data-layer="target-tile"]');
      const plusBtn = root.querySelector('[data-layer="add-btn-plus"]');
      const checkBtn = root.querySelector('[data-layer="add-btn-check"]');
      const flyItem = root.querySelector('[data-layer="fly-item"]');
      const cursor = root.querySelector('[data-layer="cursor"]');
      const cursorRing = root.querySelector('[data-layer="cursor-ring"]');
      const catalogNav = root.querySelector('[data-layer="catalog-nav"]');
      const cartNav = root.querySelector('[data-layer="cart-nav"]');
      const cartToast = root.querySelector('[data-layer="cart-toast"]');
      const cartBadge = root.querySelector('[data-layer="cart-badge"]');
      const cartPrice = root.querySelector('[data-layer="cart-price"]');
      const viewCatalog = root.querySelector('[data-layer="view-catalog"]');
      const viewCart = root.querySelector('[data-layer="view-cart"]');
      const viewSuccess = root.querySelector('[data-layer="view-success"]');
      const confirmBtn = root.querySelector('[data-layer="confirm-btn"]');
      const successMark = root.querySelector('[data-layer="success-mark"]');

      const allPresent = [screen, grid, targetTile, plusBtn, checkBtn, flyItem, cursor,
        cursorRing, catalogNav, cartNav, cartToast, cartBadge, cartPrice, viewCatalog,
        viewCart, viewSuccess, confirmBtn, successMark].every(Boolean);

      if (screen && grid && targetTile && plusBtn && cartNav && confirmBtn && allPresent) {
        const FLY_HALF = 12; // fly-item is h-6 w-6
        const gridViewport = grid.parentElement!;
        const ACCENT = '#E8A552';
        const MUTED = '#A0A0A0';

        // Everything is measured, never hardcoded: the phone height is clamped
        // against the viewport, so the scroll distance, the flight and every pointer
        // destination all change with the window.
        const centerIn = (el: Element) => {
          const s = screen.getBoundingClientRect();
          const r = el.getBoundingClientRect();
          return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
        };
        // The pointer hotspot is its top-left tip, so it sits slightly up and left of
        // a control centre rather than centred on it.
        const pointAt = (el: Element) => {
          const c = centerIn(el);
          return { x: c.x - 3, y: c.y - 4 };
        };

        // How far to scroll the grid so the picked tile sits mid-catalog. Reading the
        // tile offset against the grid box makes this independent of whatever
        // translate the grid currently carries.
        const scrollToTarget = () => {
          const g = grid.getBoundingClientRect();
          const v = gridViewport.getBoundingClientRect();
          const t = targetTile.getBoundingClientRect();
          const wanted = t.top - g.top - (v.height / 2 - t.height / 2);
          const maxScroll = Math.max(0, g.height - v.height);
          return -Math.min(Math.max(wanted, 0), maxScroll);
        };

        // One tap: the pointer dips while a ring pulses out of it.
        const addTap = (tl: gsap.core.Timeline) => {
          tl.to(cursor, { scale: 0.82, duration: 0.09, ease: 'power2.in' })
            .set(cursorRing, { opacity: 1, scale: 0.35 })
            .to(cursorRing, { scale: 1.6, opacity: 0, duration: 0.44, ease: 'power2.out' }, '<')
            .to(cursor, { scale: 1, duration: 0.14, ease: 'power2.out' }, '<0.02');
        };

        const loop = gsap.timeline({
          repeat: -1,
          repeatDelay: 0.8,
          // Function-based values are cached after their first render; without this a
          // resize would leave the scroll and every pointer move aiming at stale spots.
          onRepeat: () => loop.invalidate(),
        });

        // resting frame: catalog, top of the list, nothing added
        loop
          .set(grid, { y: 0 })
          .set(viewCatalog, { opacity: 1 })
          .set([viewCart, viewSuccess], { opacity: 0 })
          .set(catalogNav, { color: ACCENT })
          .set(cartNav, { color: MUTED, scale: 1 })
          .set(plusBtn, { opacity: 1, scale: 1 })
          .set(checkBtn, { opacity: 0, scale: 0.6 })
          .set(cartBadge, { opacity: 0, scale: 0.4 })
          .set(cartToast, { opacity: 0, y: 14 })
          .set(cartPrice, { opacity: 0, x: 8 })
          .set(flyItem, { opacity: 0, scale: 1 })
          .set(confirmBtn, { scale: 1 })
          .set(successMark, { scale: 0.5, opacity: 0 })
          .set(cursor, {
            opacity: 0,
            scale: 1,
            x: () => centerIn(gridViewport).x,
            y: () => centerIn(gridViewport).y + 70,
          })
          // 1 — let the first screenful register before anything moves
          .to({}, { duration: 0.7 })
          // 2 — browse: scroll the rest of the catalog into view
          .to(grid, { y: () => scrollToTarget(), duration: 1.4, ease: 'power2.inOut' })
          // 3 — the pointer arrives on the chosen product
          .to(cursor, { opacity: 1, duration: 0.25 }, '-=0.55')
          .to(cursor, {
            x: () => pointAt(plusBtn).x,
            y: () => pointAt(plusBtn).y,
            duration: 0.7,
            ease: 'power2.inOut',
          }, '<')
          .to({}, { duration: 0.2 });

        // 4 — tap "+"
        addTap(loop);

        loop
          .to(plusBtn, { scale: 0.78, duration: 0.1, ease: 'power2.in' }, '<')
          .to(plusBtn, { scale: 1, duration: 0.14, ease: 'power2.out' })
          // 5 — the item leaves the tile for the cart tab
          .set(flyItem, {
            opacity: 1,
            x: () => centerIn(plusBtn).x - FLY_HALF,
            y: () => centerIn(plusBtn).y - FLY_HALF,
          })
          .to(flyItem, {
            x: () => centerIn(cartNav).x - FLY_HALF,
            y: () => centerIn(cartNav).y - FLY_HALF,
            scale: 0.45,
            duration: 0.6,
            ease: 'power2.inOut',
          })
          .to(flyItem, { opacity: 0, duration: 0.1 })
          // 6 — it lands: cart tab kicks, badge pops, the button becomes a check
          .to(cartNav, { scale: 1.16, duration: 0.13, yoyo: true, repeat: 1, ease: 'power2.out' }, '<')
          .to(cartBadge, { opacity: 1, scale: 1, duration: 0.24, ease: 'back.out(3)' }, '<')
          .to(plusBtn, { opacity: 0, duration: 0.15 }, '<')
          .to(checkBtn, { opacity: 1, scale: 1, duration: 0.22, ease: 'back.out(2)' }, '<')
          // 7 — the receipt, price last
          .to(cartToast, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' }, '+=0.1')
          .to(cartPrice, { opacity: 1, x: 0, duration: 0.28, ease: 'back.out(2.4)' }, '+=0.12')
          .to({}, { duration: 1.4 })
          .to(cartToast, { opacity: 0, y: 10, duration: 0.3, ease: 'power2.in' })
          // 8 — the pointer heads for the cart tab
          .to(cursor, {
            x: () => pointAt(cartNav).x,
            y: () => pointAt(cartNav).y,
            duration: 0.6,
            ease: 'power2.inOut',
          }, '-=0.15');

        // 9 — tap the cart tab
        addTap(loop);

        loop
          // 10 — the cart opens and the active tab moves with it
          .to(viewCatalog, { opacity: 0, duration: 0.28, ease: 'power2.in' }, '<0.1')
          .to(viewCart, { opacity: 1, duration: 0.32, ease: 'power2.out' }, '<0.12')
          .to(catalogNav, { color: MUTED, duration: 0.25 }, '<')
          .to(cartNav, { color: ACCENT, duration: 0.25 }, '<')
          // 11 — time to read the cart
          .to({}, { duration: 1.3 })
          // 12 — the pointer moves down to confirm
          .to(cursor, {
            x: () => pointAt(confirmBtn).x,
            y: () => pointAt(confirmBtn).y,
            duration: 0.6,
            ease: 'power2.inOut',
          })
          .to({}, { duration: 0.15 });

        // 13 — tap confirm
        addTap(loop);

        loop
          .to(confirmBtn, { scale: 0.96, duration: 0.1, ease: 'power2.in' }, '<')
          .to(confirmBtn, { scale: 1, duration: 0.14, ease: 'power2.out' })
          // 14 — order accepted
          .to(viewCart, { opacity: 0, duration: 0.3, ease: 'power2.in' })
          .to(viewSuccess, { opacity: 1, duration: 0.34, ease: 'power2.out' }, '<0.1')
          .to(successMark, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(2.2)' }, '<0.05')
          .to(cursor, { opacity: 0, duration: 0.3 }, '<')
          // 15 — hold the good news long enough to read it
          .to({}, { duration: 2.3 })
          // 16 — reset for the next pass
          .to(viewSuccess, { opacity: 0, duration: 0.35, ease: 'power2.in' })
          .to(viewCatalog, { opacity: 1, duration: 0.35, ease: 'power2.out' }, '<0.1')
          .to(catalogNav, { color: ACCENT, duration: 0.3 }, '<')
          .to(cartNav, { color: MUTED, duration: 0.3 }, '<')
          .to(cartBadge, { opacity: 0, duration: 0.25 }, '<')
          .to(checkBtn, { opacity: 0, duration: 0.2 }, '<')
          .to(plusBtn, { opacity: 1, duration: 0.2 }, '<')
          .to(grid, { y: 0, duration: 0.9, ease: 'power2.inOut' }, '<');
      }

      // The cart toast and badge are no longer driven by the scroll timeline —
      // they belong to the loop above. Scroll only brings in the order
      // notification now.

      // Screen state C — incoming order notification, near rest
      if (orderToast) {
        tl.to(orderToast, { opacity: 1, y: 0, duration: 0.6 }, 6.2).to(orderToast, { opacity: 0, duration: 0.6 }, 7.8);
      }
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
              href="#how"
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
          <PhoneFrame locale={locale} className="ms-phone-enter mt-6" />
        </div>
      </section>
    );
  }

  return (
    <div ref={sectionRef} className="relative" style={{ height: '350vh' }}>
      {/* The site header is `sticky`, so it occupies 4rem of layout above this
          box and a full 100vh here spans [4rem, 100vh+4rem] — always hanging 4rem
          past the fold, which clipped the phone's bottom edge and its whole drop
          shadow, and mis-centred everything by half the header height.
          The correction is padding, not height: ScrollTrigger writes an inline
          `height` onto the element it pins, so a height class here gets silently
          overwritten the moment pinning kicks in. `pb-16` shrinks the content box
          instead, which ScrollTrigger leaves alone, and `items-center` then centres
          against the actually-visible region. */}
      <div ref={pinRef} className="relative flex h-screen w-full items-center overflow-hidden pb-16">
        <div
          aria-hidden
          className="ms-glow pointer-events-none absolute left-[62%] top-[30%] h-[520px] w-[820px] rounded-full blur-3xl"
          style={{ background: '#E8A552', opacity: 0.12 }}
        />
        <div className="relative mx-auto grid w-full max-w-content gap-10 px-4 sm:px-6 lg:grid-cols-2">
          {/* left: crossfading copy */}
          <div className="relative flex min-h-[270px] flex-col items-center gap-5 text-center lg:items-start lg:justify-center lg:text-left">
            {/* Reserved box for the crossfading copy. The three phases stack on top of
                each other, so they have to be absolute — scoping them here instead of
                to the whole column is what lets the column centre itself. Its height
                is the tallest phase (badge + two-line headline + three-line body). */}
            <div className="relative w-full min-h-[248px] sm:min-h-[268px]">
            {phases.map((p, i) => {
              // Phase 0 carries dict.title — the page's real headline — so it is the h1
              // that crawlers see in the SSR markup; the later crossfade copy stays h2.
              const Heading = i === 0 ? 'h1' : 'h2';
              return (
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
                  <Heading className="max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-brand-text sm:text-4xl">{p.title}</Heading>
                  <p className="max-w-lg text-base leading-relaxed text-brand-muted sm:text-lg">{p.subtitle}</p>
                </div>
              );
            })}
            </div>

            {/* static CTA + metrics, always visible below the crossfading block */}
            <div className="flex flex-col items-center gap-6 lg:items-start">
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
                  href="#how"
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

          {/* right: the phone — at rest, on the shared idle float loop */}
          <div className="relative hidden justify-center lg:flex">
            <div
              aria-hidden
              className="absolute bottom-[6%] h-9 w-[260px] rounded-full blur-2xl"
              style={{ background: 'rgba(0,0,0,0.55)' }}
            />
            <PhoneFrame locale={locale} ref={phoneRef} />

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
