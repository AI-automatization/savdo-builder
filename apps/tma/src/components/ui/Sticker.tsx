import { memo } from 'react';

interface StickerProps {
  emoji: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Sticker = memo(function Sticker({ emoji, size = 32, className, style }: StickerProps) {
  return (
    <span
      style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-block', ...style }}
      className={className}
      role="img"
    >
      {emoji}
    </span>
  );
});
