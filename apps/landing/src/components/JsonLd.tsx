import type { FC } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://maxsavdo.uz';

const TELEGRAM_BOT = 'https://t.me/savdo_builderBOT';
const TELEGRAM_CHANNEL = 'https://t.me/savdo_builderBOT/app';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'MaxSavdo',
  alternateName: 'savdo-builder',
  url: SITE_URL,
  logo: `${SITE_URL}/logo-maxsavdo.svg`,
  description:
    'Telegram store builder for Uzbek sellers — bot, storefront site and channel autoposting from one account.',
  foundingDate: '2026',
  areaServed: {
    '@type': 'Country',
    name: 'Uzbekistan',
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'hello@maxsavdo.uz',
      url: TELEGRAM_BOT,
      availableLanguage: ['uz', 'ru'],
    },
  ],
  sameAs: [TELEGRAM_BOT, TELEGRAM_CHANNEL],
};

export const JsonLd: FC = () => {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationSchema),
      }}
    />
  );
};

export default JsonLd;
