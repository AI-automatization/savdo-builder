'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme, type Theme } from '@/lib/theme/theme-provider';
import { colors } from '@/lib/styles';

interface Props {
  className?: string;
  /** Show an outline ring on focus / hover. Defaults to true. */
  bordered?: boolean;
  /** Render a 3-state popover (Light / Dark / System) instead of plain toggle. Defaults to true. */
  withMenu?: boolean;
}

/**
 * Single-button theme toggle with smooth Sun ↔ Moon swap.
 * - Click          → toggle light ↔ dark
 * - Right-click /
 *   long-press      → open menu with Light / Dark / System options
 *
 * Aligns with `liquid-authority.md`: minimal, no neon, transition 200ms.
 */
export function ThemeToggle({ className = '', bordered = true, withMenu = true }: Props) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = isDark ? 'Включить светлую тему' : 'Включить тёмную тему';

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        onContextMenu={withMenu ? (e) => { e.preventDefault(); setOpen(v => !v); } : undefined}
        aria-label={label}
        title={label}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{
          border: bordered ? `1px solid ${colors.border}` : 'none',
          background: 'transparent',
          color: colors.textPrimary,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceMuted; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Sun — visible in light mode */}
        <Sun
          size={16}
          className="absolute transition-all duration-300 ease-out"
          style={{
            transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0) scale(1)',
            opacity: isDark ? 0 : 1,
          }}
        />
        {/* Moon — visible in dark mode */}
        <Moon
          size={16}
          className="absolute transition-all duration-300 ease-out"
          style={{
            transform: isDark ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0)',
            opacity: isDark ? 1 : 0,
          }}
        />
      </button>

      {withMenu && open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[160px] rounded-xl p-1 text-sm shadow-lg"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
          }}
        >
          <MenuItem icon={<Sun size={14} />} label="Светлая"   active={theme === 'light'}  onClick={() => { setTheme('light');  setOpen(false); }} />
          <MenuItem icon={<Moon size={14} />} label="Тёмная"    active={theme === 'dark'}   onClick={() => { setTheme('dark');   setOpen(false); }} />
          <MenuItem icon={<Monitor size={14} />} label="Как в системе" active={theme === 'system'} onClick={() => { setTheme('system'); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={active}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
      style={{
        background: active ? colors.accentMuted : 'transparent',
        color: active ? colors.accent : colors.textPrimary,
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = colors.surfaceMuted; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ color: active ? colors.accent : colors.textMuted }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {active && <span className="text-[10px] font-bold uppercase tracking-wider">●</span>}
    </button>
  );
}
