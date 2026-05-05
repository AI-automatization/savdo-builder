import type { ReactNode, CSSProperties } from 'react';
import { glass } from '@/lib/styles';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onPointerEnter?: () => void;
}

export function GlassCard({ children, className = '', style, onClick, onPointerEnter }: Props) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`w-full text-left glass-shimmer transition-all active:scale-[0.985] active:opacity-75 ${onClick ? 'glass-card-interactive' : ''} ${className}`}
      style={{ ...glass, ...style }}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
    >
      {children}
    </Tag>
  );
}
