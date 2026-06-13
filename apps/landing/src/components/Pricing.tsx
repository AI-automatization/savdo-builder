import { Check } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type PricingPlan = {
  id: 'free' | 'pro' | 'studio';
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

export type PricingDict = {
  title: string;
  subtitle?: string;
  plans: PricingPlan[];
};

type PricingProps = {
  locale: Locale;
  dict: PricingDict;
};

const BOT_URL = 'https://t.me/savdo_builderBOT';

export default function Pricing({ dict }: PricingProps) {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {dict.plans.map((plan) => {
            const highlight = plan.highlight === true;
            return (
              <li
                key={plan.id}
                className={highlight ? 'card-glass-highlight relative flex flex-col p-7' : 'card-glass relative flex flex-col p-7'}
              >
                {highlight && (
                  <div
                    className="absolute -top-px inset-x-6 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(232,165,82,0.6), transparent)' }}
                  />
                )}

                <h3 className="text-lg font-semibold text-brand-text">{plan.name}</h3>
                <p className="mt-1 text-sm text-brand-muted">{plan.tagline}</p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight text-brand-text">
                    {plan.price}
                  </span>
                  <span className="text-sm text-brand-muted">{plan.period}</span>
                </div>

                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-brand-text">
                      <Check size={15} className="mt-0.5 shrink-0" style={{ color: '#E8A552' }} aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-all"
                  style={
                    highlight
                      ? {
                          background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)',
                          color: '#0F0F0F',
                          boxShadow: '0 6px 20px rgba(232,165,82,0.30)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(232,165,82,0.20)',
                          color: '#F5F5F5',
                        }
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
