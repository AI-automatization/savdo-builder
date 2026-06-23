import { Check } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type PricingPlan = {
  id: 'trial' | 'basic' | 'pro';
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  badge?: string;
};

export type PricingDict = {
  title: string;
  subtitle?: string;
  plans: PricingPlan[]; // expect 3, order: trial, basic, pro
};

type PricingProps = {
  locale: Locale;
  dict: PricingDict;
};

const BOT_URL = 'https://t.me/maxsavdo_bot';

export default function Pricing({ dict }: PricingProps) {
  return (
    <section
      id="pricing"
      className="border-t border-brand-border bg-brand-bg py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {dict.plans.map((plan) => {
            const highlight = plan.id === 'basic';
            return (
              <li
                key={plan.id}
                className={
                  'relative flex flex-col rounded-2xl border p-7 ' +
                  (highlight
                    ? 'border-brand-accent bg-brand-surface shadow-[0_20px_60px_-20px_rgba(232,165,82,0.35)]'
                    : 'border-brand-border bg-brand-surface')
                }
              >
                {plan.badge ? (
                  <span
                    className={
                      'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ' +
                      (highlight
                        ? 'bg-brand-accent text-brand-bg'
                        : 'bg-brand-bg text-brand-muted border border-brand-border')
                    }
                  >
                    {plan.badge}
                  </span>
                ) : null}

                <h3 className="text-lg font-semibold text-brand-text">
                  {plan.name}
                </h3>
                <p className="mt-1 text-sm text-brand-muted">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-brand-text">
                    {plan.price}
                  </span>
                  <span className="text-sm text-brand-muted">{plan.period}</span>
                </div>

                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-brand-text"
                    >
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-brand-accent"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    'mt-8 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold transition-colors ' +
                    (highlight
                      ? 'bg-brand-accent text-brand-bg hover:bg-brand-accentHover'
                      : 'border border-brand-border bg-brand-bg text-brand-text hover:border-brand-accent')
                  }
                >
                  {plan.cta}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
