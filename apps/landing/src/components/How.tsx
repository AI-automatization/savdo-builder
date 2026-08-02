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

const ACCENT = '#E8A552';
const ACCENT_DIM = 'rgba(232,165,82,0.35)';
const SURFACE = 'rgba(255,255,255,0.05)';
const BORDER = 'rgba(232,165,82,0.18)';

/** Step 1 — logging in via the bot: a chat bubble confirming with a check. */
function LoginIllustration() {
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
      <rect x="1" y="1" width="198" height="108" rx="14" fill={SURFACE} stroke={BORDER} />
      <rect x="20" y="24" width="100" height="26" rx="13" fill="rgba(232,165,82,0.10)" stroke={ACCENT_DIM} />
      <circle cx="34" cy="37" r="6" fill={ACCENT} opacity="0.8" />
      <rect x="46" y="32" width="58" height="4" rx="2" fill={ACCENT} opacity="0.5" />
      <rect x="46" y="40" width="38" height="4" rx="2" fill={ACCENT} opacity="0.3" />
      <rect x="80" y="58" width="100" height="26" rx="13" fill="rgba(52,211,153,0.10)" stroke="rgba(52,211,153,0.35)" />
      <circle cx="164" cy="71" r="10" fill="rgba(52,211,153,0.18)" stroke="rgba(52,211,153,0.5)" />
      <path d="M160 71l3 3 6-7" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="92" y="65" width="50" height="4" rx="2" fill="#34d399" opacity="0.6" />
    </svg>
  );
}

/** Step 2 — setting up the store: a product card mock (photo + name + price). */
function SetupIllustration() {
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
      <rect x="1" y="1" width="198" height="108" rx="14" fill={SURFACE} stroke={BORDER} />
      <rect x="20" y="20" width="52" height="52" rx="10" fill="rgba(232,165,82,0.12)" stroke={ACCENT_DIM} />
      <path d="M34 56l8-10 6 6 10-12 10 16" stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <circle cx="42" cy="32" r="4" fill={ACCENT} opacity="0.6" />
      <rect x="86" y="24" width="94" height="6" rx="3" fill={ACCENT} opacity="0.55" />
      <rect x="86" y="38" width="66" height="5" rx="2.5" fill="rgba(255,255,255,0.25)" />
      <rect x="86" y="50" width="40" height="14" rx="7" fill="rgba(232,165,82,0.15)" stroke={ACCENT_DIM} />
      <rect x="94" y="55" width="24" height="4" rx="2" fill={ACCENT} opacity="0.7" />
      <rect x="20" y="86" width="160" height="10" rx="5" fill="rgba(255,255,255,0.06)" />
      <rect x="20" y="86" width="96" height="10" rx="5" fill={ACCENT} opacity="0.4" />
    </svg>
  );
}

/** Step 3 — three sales channels converging into one order. */
function ChannelsIllustration() {
  const nodes = [
    { cx: 34, cy: 24 },
    { cx: 34, cy: 55 },
    { cx: 34, cy: 86 },
  ];
  return (
    <svg viewBox="0 0 200 110" className="h-full w-full" aria-hidden>
      <rect x="1" y="1" width="198" height="108" rx="14" fill={SURFACE} stroke={BORDER} />
      {nodes.map((n, i) => (
        <path key={i} d={`M${n.cx + 14} ${n.cy} C ${n.cx + 60} ${n.cy}, ${n.cx + 60} 55, ${n.cx + 110} 55`} stroke={ACCENT_DIM} strokeWidth="1.5" fill="none" />
      ))}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.cx} cy={n.cy} r="13" fill="rgba(232,165,82,0.12)" stroke={ACCENT_DIM} />
      ))}
      <circle cx="158" cy="55" r="18" fill="rgba(232,165,82,0.16)" stroke={ACCENT} />
      <path d="M150 55l6 6 10-12" stroke={ACCENT} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ILLUSTRATIONS = [LoginIllustration, SetupIllustration, ChannelsIllustration];

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
            const Illustration = ILLUSTRATIONS[idx];
            return (
              <li
                key={step.title}
                className="card-glass relative flex flex-col overflow-hidden"
              >
                <div className="h-28 w-full border-b" style={{ borderColor: BORDER }}>
                  <Illustration />
                </div>

                <div className="relative flex flex-col p-6">
                  <span
                    aria-hidden
                    className="absolute right-5 top-5 text-5xl font-bold leading-none"
                    style={{ color: 'rgba(232,165,82,0.15)' }}
                  >
                    {idx + 1}
                  </span>

                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(232,165,82,0.12)', border: `1px solid ${ACCENT_DIM}` }}
                  >
                    <Icon size={22} style={{ color: ACCENT }} aria-hidden />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-brand-text">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
