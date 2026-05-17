import type { Metadata } from 'next';
import { PrivacyContent } from '@/components/legal/PrivacyContent';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — Savdo',
  description: 'Как Savdo собирает, хранит и обрабатывает персональные данные пользователей.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
