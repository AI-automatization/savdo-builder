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
    <section id="features" className="border-t border-brand-border bg-brand-bg py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dict.items.map((item, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <li
                key={item.title}
                className="group flex flex-col rounded-2xl border border-brand-border bg-brand-surface p-6 transition-colors hover:border-brand-accent/60"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
                  <Icon size={22} aria-hidden />
                </div>
                <h3 className="mt-5 text-base font-semibold text-brand-text">
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
