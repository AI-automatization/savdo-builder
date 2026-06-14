import { Bot, Globe, Megaphone } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type HeroDict = {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  mockup: {
    bot: string;
    site: string;
    channel: string;
  };
};

type HeroProps = {
  locale: Locale;
  dict: HeroDict;
};

const BOT_URL = 'https://t.me/savdo_builderBOT';
const TMA_URL = 'https://t.me/savdo_builderBOT/app';

export default function Hero({ dict }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(232,165,82,0.18),transparent_70%)]"
      />

      <div className="mx-auto grid w-full max-w-content gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28 lg:px-8">
        {/* Copy column */}
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-brand-text sm:text-5xl lg:text-[56px]">
            {dict.title}
          </h1>

          <p className="mt-6 max-w-xl text-base text-brand-muted sm:text-lg">
            {dict.subtitle}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-brand-accent px-6 py-3 text-base font-semibold text-brand-bg transition-colors hover:bg-brand-accentHover"
            >
              {dict.ctaPrimary}
            </a>
            <a
              href={TMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg border border-brand-border bg-brand-surface px-6 py-3 text-base font-semibold text-brand-text transition-colors hover:border-brand-accent"
            >
              {dict.ctaSecondary}
            </a>
          </div>
        </div>

        {/* Mockup column */}
        <div className="relative flex items-center justify-center">
          <PhoneMockup labels={dict.mockup} />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({
  labels,
}: {
  labels: HeroDict['mockup'];
}) {
  const channels = [
    { icon: Bot, label: labels.bot, tag: '@bot' },
    { icon: Globe, label: labels.site, tag: 'maxsavdo.uz/shop' },
    { icon: Megaphone, label: labels.channel, tag: 't.me/shop' },
  ];

  return (
    <div className="relative h-[520px] w-[280px] rounded-[44px] border border-brand-border bg-brand-surface p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
      {/* Notch */}
      <div
        aria-hidden
        className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-brand-bg"
      />
      <div className="flex h-full flex-col gap-3 overflow-hidden rounded-[34px] bg-brand-bg p-5 pt-10">
        <div className="text-[10px] uppercase tracking-widest text-brand-muted">
          MaxSavdo
        </div>

        {channels.map(({ icon: Icon, label, tag }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
              <Icon size={20} aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-brand-text">
                {label}
              </div>
              <div className="truncate text-xs text-brand-muted">{tag}</div>
            </div>
          </div>
        ))}

        <div className="mt-auto rounded-xl border border-brand-accent/40 bg-brand-accent/10 p-3 text-center text-xs text-brand-accent">
          1 = 3
        </div>
      </div>
    </div>
  );
}
