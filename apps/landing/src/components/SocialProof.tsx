import { Sparkles } from 'lucide-react';

export type SocialProofDict = {
  statValue: string;
  statLabel: string;
  betaTitle: string;
  betaDesc: string;
};

type SocialProofProps = {
  locale: 'uz' | 'ru';
  dict: SocialProofDict;
};

export default function SocialProof({ dict }: SocialProofProps) {
  return (
    <section className="py-8">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="card-glass flex flex-col items-center gap-6 p-6 sm:flex-row sm:justify-between sm:p-8">
          <div className="text-center sm:text-left">
            <div className="text-3xl font-bold text-brand-accent sm:text-4xl">
              {dict.statValue}
            </div>
            <div className="mt-1 text-sm text-brand-muted">{dict.statLabel}</div>
          </div>

          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: 'rgba(232,165,82,0.10)',
              border: '1px solid rgba(232,165,82,0.22)',
            }}
          >
            <Sparkles size={20} style={{ color: '#E8A552' }} aria-hidden />
            <div>
              <div className="text-sm font-semibold text-brand-text">{dict.betaTitle}</div>
              <div className="text-xs text-brand-muted">{dict.betaDesc}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
