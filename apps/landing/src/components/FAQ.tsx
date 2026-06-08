'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type FAQItem = {
  q: string;
  a: string;
};

export type FAQDict = {
  title: string;
  subtitle?: string;
  items: FAQItem[]; // 5-7
};

type FAQProps = {
  locale: Locale;
  dict: FAQDict;
};

export default function FAQ({ dict }: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="border-t border-brand-border bg-brand-bg py-20 lg:py-28"
    >
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
          {dict.items.map((item, idx) => {
            const open = openIdx === idx;
            const panelId = `faq-panel-${idx}`;
            const buttonId = `faq-button-${idx}`;

            return (
              <li
                key={item.q}
                className="rounded-xl border border-brand-border bg-brand-surface"
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
                      size={20}
                      aria-hidden
                      className={
                        'shrink-0 text-brand-muted transition-transform ' +
                        (open ? 'rotate-180 text-brand-accent' : '')
                      }
                    />
                  </button>
                </h3>

                {open ? (
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    className="border-t border-brand-border px-5 py-4 text-sm leading-relaxed text-brand-muted"
                  >
                    {item.a}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
