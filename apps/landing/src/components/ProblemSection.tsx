'use client';

import { AlertCircle, BarChartBig, MessageCircleQuestion, PackageX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReveal } from '@/hooks/useReveal';

export type ProblemDict = {
  title: string;
  body: string;
  items: Array<{ title: string; body: string }>;
};

type ProblemSectionProps = {
  dict: ProblemDict;
};

const ICONS: LucideIcon[] = [PackageX, MessageCircleQuestion, BarChartBig];

export default function ProblemSection({ dict }: ProblemSectionProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-brand-accent">
            <AlertCircle size={14} aria-hidden />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">{dict.title}</h2>
          <p className="mt-3 text-base text-brand-muted">{dict.body}</p>
        </div>

        <div ref={ref} className="reveal mt-10 grid gap-4 sm:grid-cols-3">
          {dict.items.map((item, idx) => {
            const Icon = ICONS[idx % ICONS.length];
            return (
              <div key={item.title} className="card-glass flex flex-col p-6">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <Icon size={20} style={{ color: '#f87171' }} aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-brand-text">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
