'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { HOMEPAGE_FAQ_COUNT } from '@/lib/i18n';

export type Locale = 'uz' | 'ru';

export type FAQItem = {
  q: string;
  a: string;
};

export type FAQDict = {
  title: string;
  subtitle?: string;
  allLabel?: string;
  items: FAQItem[];
};

type FAQProps = {
  locale: Locale;
  dict: FAQDict;
};

export default function FAQ({ locale, dict }: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  // The homepage shows a subset and links to the full set on /faq. Two reasons:
  // the section stays scannable, and /faq gets a real internal link instead of
  // depending on the sitemap alone for discovery.
  const shown = dict.items.slice(0, HOMEPAGE_FAQ_COUNT);
  const hasMore = dict.items.length > shown.length;
  const faqHref = locale === 'uz' ? '/faq' : '/ru/faq';

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            {dict.title}
          </h2>
          {dict.subtitle ? (
            <p className="mt-4 text-base text-brand-muted">{dict.subtitle}</p>
          ) : null}
        </div>

        <ul className="mt-12 flex flex-col gap-3">
          {shown.map((item, idx) => {
            const open = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            const buttonId = `faq-button-${idx}`;

            return (
              <li
                key={item.q}
                className={open ? 'card-glass-highlight' : 'card-glass'}
                style={{ overflow: 'hidden' }}
              >
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenIdx(open ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-medium text-brand-text"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      size={18}
                      aria-hidden
                      style={{ color: open ? '#E8A552' : '#A0A0A0', flexShrink: 0, transition: 'transform 0.2s, color 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                </h3>

                {open ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="px-5 pb-4 pt-0 text-sm leading-relaxed text-brand-muted"
                    style={{ borderTop: '1px solid rgba(232,165,82,0.15)' }}
                  >
                    {item.a}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>

        {hasMore && dict.allLabel ? (
          <div className="mt-8 text-center">
            <Link
              href={faqHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent"
            >
              {dict.allLabel}
              <ArrowRight size={15} aria-hidden />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
