import { MessageSquare, PackagePlus, Rocket } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type HowStep = {
  title: string;
  body: string;
};

export type HowDict = {
  title: string;
  steps: [HowStep, HowStep, HowStep];
};

type HowProps = {
  locale: Locale;
  dict: HowDict;
};

const ICONS: [LucideIcon, LucideIcon, LucideIcon] = [
  MessageSquare,
  PackagePlus,
  Rocket,
];

export default function How({ dict }: HowProps) {
  return (
    <section id="how" className="bg-brand-bg py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {dict.title}
        </h2>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {dict.steps.map((step, idx) => {
            const Icon = ICONS[idx];
            return (
              <li
                key={step.title}
                className="relative flex flex-col rounded-2xl border border-brand-border bg-brand-surface p-7"
              >
                <span
                  aria-hidden
                  className="absolute right-6 top-6 text-5xl font-bold leading-none text-brand-accent/20"
                >
                  {idx + 1}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
                  <Icon size={24} aria-hidden />
                </div>

                <h3 className="mt-5 text-lg font-semibold text-brand-text">
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
