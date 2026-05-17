import type { Metadata } from 'next';
import { TermsContent } from '@/components/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Условия использования — Savdo',
  description: 'Правила и условия использования платформы Savdo для покупателей и продавцов.',
};

export default function TermsPage() {
  return <TermsContent />;
}
