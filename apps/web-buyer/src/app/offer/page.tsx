import type { Metadata } from 'next';
import { OfferContent } from '@/components/legal/OfferContent';

export const metadata: Metadata = {
  title: 'Публичная оферта — Savdo',
  description: 'Публичная оферта на оказание услуг платформы Savdo.',
};

export default function OfferPage() {
  return <OfferContent />;
}
