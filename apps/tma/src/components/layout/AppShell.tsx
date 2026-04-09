import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { BackButton } from './BackButton';
import { gradientBg } from '@/lib/styles';

interface Props {
  children: ReactNode;
  role: 'BUYER' | 'SELLER';
}

export function AppShell({ children, role }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: gradientBg }}>
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          className="absolute rounded-full"
          style={{
            width: 400, height: 400, top: -150, right: -100,
            background: 'radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 300, height: 300, bottom: -80, left: -80,
            background: 'radial-gradient(circle, rgba(34,197,94,.10) 0%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />
      </div>

      <BackButton />
      <div className="relative z-10 flex-1 px-4 pt-4 pb-20">
        {children}
      </div>
      <BottomNav role={role} />
    </div>
  );
}
