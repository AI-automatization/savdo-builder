// apps/web-buyer/src/components/store/VerifiedBadge.tsx
'use client';

import { Check } from 'lucide-react';
import { Tooltip } from '@/components/tooltip';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = { sm: 12, md: 14, lg: 16 };

interface Props {
  size?: Size;
  /** Если true — без tooltip wrapper (для использования внутри Link). */
  bare?: boolean;
}

export function VerifiedBadge({ size = 'md', bare = false }: Props) {
  const px = SIZE_PX[size];
  const { t } = useTranslation();
  const node = (
    <span
      aria-label={t('store.verifiedLabel')}
      className="inline-grid place-items-center rounded-full align-middle"
      style={{
        width: px,
        height: px,
        background: colors.success,
        color: colors.brandTextOnBg,
      }}
    >
      <Check size={Math.max(8, px - 4)} strokeWidth={3} />
    </span>
  );
  if (bare) return node;
  return <Tooltip label={t('store.verifiedLabel')}>{node}</Tooltip>;
}
