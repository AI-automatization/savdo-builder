'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme/theme-provider';

type Props = {
  className?: string;
};

/**
 * Single-button light/dark toggle. Landing has no "system" option in the UI —
 * just an explicit switch — since the site defaults to dark and light mode is
 * a deliberate opt-in, not an OS-following default (see ThemeProvider).
 */
export function ThemeToggle({ className = '' }: Props) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? "Yorugʻ mavzuga oʻtish" : 'Qorongʻu mavzuga oʻtish';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-border text-brand-text transition-colors hover:border-brand-accent hover:text-brand-accent ${className}`}
    >
      <Sun
        size={16}
        className="absolute transition-all duration-300 ease-out"
        style={{
          transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0) scale(1)',
          opacity: isDark ? 0 : 1,
        }}
        aria-hidden
      />
      <Moon
        size={16}
        className="absolute transition-all duration-300 ease-out"
        style={{
          transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0)',
          opacity: isDark ? 1 : 0,
        }}
        aria-hidden
      />
    </button>
  );
}
