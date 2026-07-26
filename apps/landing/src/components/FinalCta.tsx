'use client';

import { ArrowRight } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

export type FinalCtaDict = {
  title: string;
  subtitle: string;
};

type FinalCtaProps = {
  dict: FinalCtaDict;
  ctaLabel: string;
};

const BOT_URL = 'https://t.me/maxsavdo_bot';

export default function FinalCta({ dict, ctaLabel }: FinalCtaProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div
          ref={ref}
          className="reveal relative overflow-hidden rounded-2xl p-10 text-center sm:p-16"
          style={{ background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)' }}
        >
          <h2 className="text-3xl font-bold text-brand-bg sm:text-4xl">{dict.title}</h2>
          <p className="mt-3 text-sm text-brand-bg opacity-90 sm:text-base">{dict.subtitle}</p>
          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-md px-7 py-3 text-sm font-bold text-brand-text transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#0F0F0F' }}
          >
            {ctaLabel} <ArrowRight size={16} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
