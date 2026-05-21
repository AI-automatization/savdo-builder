import type { Metadata } from 'next';
import { HelpContent } from '@/components/legal/HelpContent';

export const metadata: Metadata = {
  title: 'Помощь и частые вопросы — Savdo',
  description: 'Короткие ответы на самые частые вопросы покупателей Savdo: оформление заказа, оплата, доставка, возврат, связь с продавцом.',
};

export default function HelpPage() {
  return <HelpContent />;
}
