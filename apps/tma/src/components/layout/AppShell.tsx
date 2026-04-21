import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { BackButton } from './BackButton';
import { ToastContainer } from '@/components/ui/Toast';
import { gradientBg, COLORS } from '@/lib/styles';

interface Props {
  children: ReactNode;
  role: 'BUYER' | 'SELLER';
}

export function AppShell({ children, role }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: gradientBg }}>
      {/* Ambient depth layers — Cyber Orchid + Arctic Cyan */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        {/* Top-right: Cyber Orchid */}
        <div className="absolute rounded-full" style={{
          width: 480, height: 480, top: -180, right: -120,
          background: `radial-gradient(circle, ${COLORS.orchidGlow} 0%, transparent 68%)`,
          filter: 'blur(72px)',
        }} />
        {/* Bottom-left: Arctic Cyan */}
        <div className="absolute rounded-full" style={{
          width: 320, height: 320, bottom: -100, left: -80,
          background: `radial-gradient(circle, ${COLORS.cyanDim} 0%, transparent 70%)`,
          filter: 'blur(56px)',
        }} />
        {/* Center subtle: navy depth */}
        <div className="absolute rounded-full" style={{
          width: 260, height: 260, top: '40%', left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(13,17,32,0.60) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <ToastContainer />
      <BackButton />
      <div className="relative z-10 flex-1 px-4 pt-4 pb-20">
        {children}
      </div>
      <BottomNav role={role} />
    </div>
  );
}
