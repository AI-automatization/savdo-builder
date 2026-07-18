import { Bot, Globe, Megaphone } from 'lucide-react';

export type HeroDict = {
  badge?: string;
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

type HeroProps = {
  locale: 'uz' | 'ru';
  dict: HeroDict;
};

const BOT_URL = 'https://t.me/maxsavdo_bot';
const TMA_URL = 'https://t.me/maxsavdo_bot/app';

const MOCKUP = {
  uz: { bot: 'Telegram-bot', site: 'Sayt-vitrina', channel: 'TG-kanal' },
  ru: { bot: 'Telegram-бот', site: 'Сайт-витрина', channel: 'TG-канал' },
};

export default function Hero({ locale, dict }: HeroProps) {
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
        </div>

        {/* Right column — glass phone mockup */}
        <div className="relative flex items-center justify-center">
          <PhoneMockup labels={MOCKUP[locale]} />
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ labels }: { labels: { bot: string; site: string; channel: string } }) {
  const channels = [
    { icon: Bot, label: labels.bot, tag: '@savdo_builderBOT' },
    { icon: Globe, label: labels.site, tag: 'maxsavdo.uz/shop' },
    { icon: Megaphone, label: labels.channel, tag: 't.me/shop' },
  ];

  return (
    <div
      className="relative h-[500px] w-[268px] rounded-[44px] p-3"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(232,165,82,0.22)',
        boxShadow: '0 32px 80px -20px rgba(232,165,82,0.18), 0 0 0 1px rgba(255,255,255,0.04)',
      }}
    >
      {/* notch */}
      <div
        aria-hidden
        className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full"
        style={{ background: 'rgba(15,15,15,0.80)' }}
      />
      <div
        className="flex h-full flex-col gap-3 overflow-hidden rounded-[34px] p-5 pt-10"
        style={{ background: 'rgba(15,15,15,0.60)' }}
      >
        <div className="text-[10px] uppercase tracking-widest text-brand-muted opacity-60">
          MaxSavdo
        </div>
        {channels.map(({ icon: Icon, label, tag }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(232,165,82,0.15)',
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ background: 'rgba(232,165,82,0.15)', border: '1px solid rgba(232,165,82,0.25)' }}
            >
              <Icon size={18} style={{ color: '#E8A552' }} aria-hidden />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-brand-text">{label}</div>
              <div className="truncate text-xs text-brand-muted">{tag}</div>
            </div>
          </div>
        ))}
        <div
          className="mt-auto rounded-xl p-3 text-center text-xs font-semibold"
          style={{
            background: 'rgba(232,165,82,0.12)',
            border: '1px solid rgba(232,165,82,0.30)',
            color: '#E8A552',
          }}
        >
          1 akkaunt = 3 kanal
        </div>
      </div>
    </div>
  );
}
