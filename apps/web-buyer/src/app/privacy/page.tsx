import type { Metadata } from 'next';
import { PrivacyContent } from '@/components/legal/PrivacyContent';

export const metadata: Metadata = {
  title: 'Политика конфиденциальности — maxsavdo',
  description: 'Как maxsavdo собирает, хранит и обрабатывает персональные данные пользователей.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
