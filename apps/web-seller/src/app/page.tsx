import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import { getServerLocale } from '@/lib/i18n/server-locale';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'maxsavdo — магазин в Telegram, который выглядит дорого',
  description: 'Преврати Instagram в премиальную витрину с корзиной и заказами за 5 минут. Без комиссии с продаж. Закрытая бета.',
};

export default async function HomePage() {
  const locale = await getServerLocale();
  return (
    <I18nProvider initialLocale={locale}>
      <LandingPage />
    </I18nProvider>
  );
}
