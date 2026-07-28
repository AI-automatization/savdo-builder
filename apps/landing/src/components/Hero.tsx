import { Search, LayoutGrid, ShoppingBag, User, Heart, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type HeroDict = {
  badge?: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  niches: string;
  metrics: Array<{ value: string; label: string }>;
};

export type MockDict = {
  products: [string, string, string, string];
  categories: [string, string, string, string];
  nav: { catalog: string; search: string; cart: string; profile: string };
  productsLabel: string;
  searchPlaceholder: string;
  sectionLabel: string;
  sortLabel: string;
};

type HeroProps = {
  locale: 'uz' | 'ru';
  dict: HeroDict;
  mock: MockDict;
};

const BOT_URL = 'https://t.me/savdo_builderBOT';
const TMA_URL = 'https://t.me/savdo_builderBOT/app';

const PRODUCT_IMAGES = ['/landing/p-bag.jpg', '/landing/p-watch.jpg', '/landing/p-heels.jpg', '/landing/p-perfume.jpg'];

export default function Hero({ dict, mock }: HeroProps) {
  const mockProducts = mock.products.map((name, i) => ({
    name,
    img: PRODUCT_IMAGES[i],
    price: ['1 290 000', '2 400 000', '890 000', '1 150 000'][i],
    old: i === 0 ? '1 690 000' : null,
    off: i === 0 ? '-23%' : null,
    rating: ['4.9', '4.8', '5.0', '4.7'][i],
  }));

  const navItems: Array<{ icon: LucideIcon; label: string; active: boolean; badge: number }> = [
    { icon: LayoutGrid, label: mock.nav.catalog, active: true, badge: 0 },
    { icon: Search, label: mock.nav.search, active: false, badge: 0 },
    { icon: ShoppingBag, label: mock.nav.cart, active: false, badge: 2 },
    { icon: User, label: mock.nav.profile, active: false, badge: 0 },
  ];

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
      <div className="mx-auto grid w-full max-w-content gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left column */}
        <div className="flex flex-col justify-center">
          {dict.badge && (
            <div
              className="mb-5 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-brand-accent"
              style={{
                background: 'rgba(232,165,82,0.10)',
                border: '1px solid rgba(232,165,82,0.22)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: '#E8A552', boxShadow: '0 0 6px rgba(232,165,82,0.7)' }}
              />
              {dict.badge}
            </div>
          )}

          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-[54px]">
            {dict.title}
          </h1>

          <p className="mt-5 max-w-xl text-base text-brand-muted sm:text-lg">
            {dict.subtitle}
          </p>

          <p className="mt-3 text-xs font-medium tracking-wide text-brand-accent sm:text-sm">
            {dict.niches}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-brand-bg transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)',
                boxShadow: '0 8px 28px rgba(232,165,82,0.38)',
              }}
            >
              {dict.ctaPrimary}
            </a>
            <a
              href={TMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-semibold text-brand-text transition-all hover:border-brand-accent"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(232,165,82,0.20)',
              }}
            >
              {dict.ctaSecondary}
            </a>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8">
            {dict.metrics.map((m) => (
              <div key={m.label} className="flex flex-col">
                <span className="text-2xl font-bold text-brand-accent sm:text-3xl">{m.value}</span>
                <span className="mt-1 text-xs text-brand-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — storefront phone mockup */}
        <div className="relative flex items-center justify-center">
          <PhoneMockup mock={mock} mockProducts={mockProducts} navItems={navItems} />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({
  mock,
  mockProducts,
  navItems,
}: {
  mock: MockDict;
  mockProducts: Array<{ name: string; img: string; price: string; old: string | null; off: string | null; rating: string }>;
  navItems: Array<{ icon: LucideIcon; label: string; active: boolean; badge: number }>;
}) {
  return (
    <div
      className="relative h-[520px] w-[268px] rounded-[2.5rem] p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(232,165,82,0.22)',
        boxShadow: '0 32px 80px -20px rgba(232,165,82,0.18), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="flex h-full flex-col overflow-hidden rounded-[2rem]"
        style={{ background: 'rgba(15,15,15,0.90)' }}
      >
        {/* store header card */}
        <div
          className="mx-2.5 mt-2.5 mb-2 rounded-2xl p-2.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.25)', color: '#E8A552' }}
            >
              A
            </div>
            <div className="min-w-0 flex-1">
              <span className="truncate text-[13px] font-bold text-brand-text">Atelier Nur</span>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-brand-text">
                  <Star size={8} fill="#E8A552" style={{ color: '#E8A552' }} /> 4.9
                </span>
                <span className="text-brand-muted">·</span>
                <span className="text-[8px] text-brand-muted">128 {mock.productsLabel}</span>
              </div>
            </div>
          </div>
        </div>

        {/* search */}
        <div
          className="mx-2.5 mb-2 flex h-7 items-center gap-1.5 rounded-lg px-2"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.15)' }}
        >
          <Search size={11} className="text-brand-muted" />
          <span className="text-[8px] text-brand-muted">{mock.searchPlaceholder}</span>
        </div>

        {/* category chips */}
        <div className="flex gap-1.5 overflow-hidden px-2.5">
          {mock.categories.map((c, i) => (
            <span
              key={c}
              className="whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-semibold"
              style={
                i === 0
                  ? { background: '#E8A552', color: '#0F0F0F' }
                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.15)', color: '#A0A0A0' }
              }
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-2.5 mb-1.5 flex items-center justify-between px-2.5">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-brand-muted">
            {mock.sectionLabel} · 128
          </span>
          <span className="text-[8px] text-brand-accent">{mock.sortLabel}</span>
        </div>

        {/* product grid */}
        <div className="flex-1 overflow-hidden px-2.5">
          <div className="grid grid-cols-2 gap-2">
            {mockProducts.map((p) => (
              <div
                key={p.name}
                className="flex flex-col overflow-hidden rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,165,82,0.15)' }}
              >
                <div className="relative" style={{ aspectRatio: '1/1' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover" />
                  {p.off && (
                    <span
                      className="absolute left-1 top-1 rounded px-1 py-0.5 text-[7px] font-bold"
                      style={{ background: '#E8A552', color: '#0F0F0F' }}
                    >
                      {p.off}
                    </span>
                  )}
                  <span
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: 'rgba(0,0,0,0.4)' }}
                  >
                    <Heart size={9} className="text-white" />
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
                      <span className="truncate text-[9px] font-bold text-brand-accent">{p.price}</span>
                    </div>
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[12px] font-bold leading-none"
                      style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.25)', color: '#E8A552' }}
                    >
                      +
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* bottom nav */}
        <div
          className="mt-auto flex items-stretch justify-around px-1 pb-2 pt-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(232,165,82,0.15)' }}
        >
          {navItems.map(({ icon: Icon, label, active, badge }) => (
            <div
              key={label}
              className="relative flex flex-col items-center gap-0.5"
              style={{ color: active ? '#E8A552' : '#A0A0A0' }}
            >
              <Icon size={14} />
              <span className="text-[7px] font-medium">{label}</span>
              {badge > 0 && (
                <span
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
    </div>
  );
}
