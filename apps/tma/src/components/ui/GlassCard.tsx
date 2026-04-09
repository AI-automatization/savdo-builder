import type { ReactNode, CSSProperties } from 'react';
import { glass } from '@/lib/styles';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function GlassCard({ children, className = '', style, onClick }: Props) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={`w-full text-left transition-opacity active:opacity-70 ${className}`}
      style={{ ...glass, ...style }}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
