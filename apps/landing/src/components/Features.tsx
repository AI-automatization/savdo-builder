import {
  Globe,
  Megaphone,
  ShoppingBag,
  BarChart3,
  Wallet,
  LayoutDashboard,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type FeatureItem = {
  title: string;
  body: string;
};

export type FeaturesDict = {
  title: string;
  body?: string;
  subtitle?: string;
  items: FeatureItem[];
};

type FeaturesProps = {
  locale: Locale;
  dict: FeaturesDict;
};

const ICONS: LucideIcon[] = [
  Globe,
  Megaphone,
  ShoppingBag,
  BarChart3,
  Wallet,
  LayoutDashboard,
];

export default function Features({ dict }: FeaturesProps) {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {(dict.subtitle || dict.body) ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle ?? dict.body}</p>
          ) : null}
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dict.items.map((item, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <li
                key={item.title}
                className="card-glass group flex flex-col p-5 transition-all hover:border-brand-accent/40"
                style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(232,165,82,0.12)',
                    border: '1px solid rgba(232,165,82,0.25)',
                  }}
                >
                  <Icon size={20} style={{ color: '#E8A552' }} aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-brand-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
