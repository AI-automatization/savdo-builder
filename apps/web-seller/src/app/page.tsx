import type { Metadata } from 'next';
import { I18nProvider } from '@/lib/i18n';
import { getServerLocale } from '@/lib/i18n/server-locale';
import { LandingPage } from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'maxsavdo — магазин в Telegram за 5 минут',
  description: 'Создайте свой магазин в Telegram. Каталог, корзина, заказы и аналитика — без сайтостроения и комиссии с продаж.',
};

export default async function HomePage() {
  const locale = await getServerLocale();
  return (
    <I18nProvider initialLocale={locale}>
      <LandingPage />
    </I18nProvider>
  );
}
