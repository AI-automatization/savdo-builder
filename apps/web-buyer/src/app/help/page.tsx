import type { Metadata } from 'next';
import { HelpContent } from '@/components/legal/HelpContent';
import { ru } from '@/lib/i18n/ru';

export const metadata: Metadata = {
  title: 'Помощь и частые вопросы — maxsavdo',
  description: 'Короткие ответы на самые частые вопросы покупателей maxsavdo: оформление заказа, оплата, доставка, возврат, связь с продавцом.',
};

const FAQ_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;

function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_KEYS.map((key) => ({
      '@type': 'Question',
      name: ru[`legal.help.${key}.q`],
      acceptedAnswer: {
        '@type': 'Answer',
        text: ru[`legal.help.${key}.a`],
      },
    })),
  };
}

export default function HelpPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd()) }}
      />
      <HelpContent />
    </>
  );
}
