import type { ReactNode, ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, className = '', ...rest }: Props) {
  const base = 'px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity active:opacity-70 disabled:opacity-40';
  const variants = {
    primary: 'text-white',
    ghost: 'text-white/60 border border-white/10',
  };
  const bg = variant === 'primary'
    ? { background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }
    : {};

  return (
    <button className={`${base} ${variants[variant]} ${className}`} style={bg} {...rest}>
      {children}
    </button>
  );
}
