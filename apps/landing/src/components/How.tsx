import { MessageSquare, PackagePlus, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type HowStep = {
  n?: string;
  title: string;
  body: string;
};

export type HowDict = {
  title: string;
  body?: string;
  steps: HowStep[];
};

type HowProps = {
  locale: Locale;
  dict: HowDict;
};

const ICONS: [LucideIcon, LucideIcon, LucideIcon] = [MessageSquare, PackagePlus, Rocket];

export default function How({ dict }: HowProps) {
  return (
    <section id="how" className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {dict.title}
        </h2>
        {dict.body && (
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-brand-muted">
            {dict.body}
          </p>
        )}

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {dict.steps.map((step, idx) => {
            const Icon = ICONS[idx];
            return (
              <li
                key={step.title}
                className="card-glass relative flex flex-col p-6"
              >
                <span
                  aria-hidden
                  className="absolute right-5 top-5 text-5xl font-bold leading-none"
                  style={{ color: 'rgba(232,165,82,0.15)' }}
                >
                  {idx + 1}
                </span>

                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(232,165,82,0.12)',
                    border: '1px solid rgba(232,165,82,0.28)',
                  }}
                >
                  <Icon size={22} style={{ color: '#E8A552' }} aria-hidden />
                </div>

                <h3 className="mt-5 text-base font-semibold text-brand-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
