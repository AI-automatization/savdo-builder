import type { Metadata } from 'next';
import { RefundContent } from '@/components/legal/RefundContent';

export const metadata: Metadata = {
  title: 'Возврат и обмен — Savdo',
  description: 'Условия возврата и обмена товаров, приобретённых через платформу Savdo.',
};

export default function RefundPage() {
  return <RefundContent />;
}
