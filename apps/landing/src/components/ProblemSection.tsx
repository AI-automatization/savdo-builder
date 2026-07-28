import { PackageX, MessageCircleQuestion, BarChartBig } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ProblemItem = {
  title: string;
  body: string;
};

export type ProblemDict = {
  title: string;
  subtitle?: string;
  items: ProblemItem[];
};

type ProblemSectionProps = {
  locale: 'uz' | 'ru';
  dict: ProblemDict;
};

const ICONS: LucideIcon[] = [PackageX, MessageCircleQuestion, BarChartBig];

export default function ProblemSection({ dict }: ProblemSectionProps) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle && (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          )}
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {dict.items.map((item, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <li key={item.title} className="card-glass-dim flex flex-col p-6">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(232,165,82,0.10)',
                    border: '1px solid rgba(232,165,82,0.22)',
                  }}
                >
                  <Icon size={22} style={{ color: '#E8A552' }} aria-hidden />
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
