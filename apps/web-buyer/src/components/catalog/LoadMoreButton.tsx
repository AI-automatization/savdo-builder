'use client';

import { colors } from '@/lib/styles';

export function LoadMoreButton({
  onClick,
  isLoading,
  hasMore,
}: {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center mt-8">
      <button
        type="button"
        onClick={onClick}
        disabled={isLoading}
        className="px-6 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          color: colors.textBody,
        }}
      >
        {isLoading ? 'Загрузка…' : 'Загрузить ещё'}
      </button>
    </div>
  );
}
