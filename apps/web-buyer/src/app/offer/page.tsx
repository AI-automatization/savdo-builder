import type { Metadata } from 'next';
import { OfferContent } from '@/components/legal/OfferContent';

export const metadata: Metadata = {
  title: 'Публичная оферта — maxsavdo',
  description: 'Публичная оферта на оказание услуг платформы maxsavdo.',
};

export default function OfferPage() {
  return <OfferContent />;
}
