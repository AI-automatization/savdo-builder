import type { Metadata } from 'next';
import { TermsContent } from '@/components/legal/TermsContent';

export const metadata: Metadata = {
  title: 'Условия использования — maxsavdo',
  description: 'Правила и условия использования платформы maxsavdo для покупателей и продавцов.',
};

export default function TermsPage() {
  return <TermsContent />;
}
