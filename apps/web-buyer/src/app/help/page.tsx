import type { Metadata } from 'next';
import { HelpContent } from '@/components/legal/HelpContent';

export const metadata: Metadata = {
  title: 'Помощь и частые вопросы — maxsavdo',
  description: 'Короткие ответы на самые частые вопросы покупателей maxsavdo: оформление заказа, оплата, доставка, возврат, связь с продавцом.',
};

export default function HelpPage() {
  return <HelpContent />;
}
