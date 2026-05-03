import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { BackButton } from './BackButton';
import { FullscreenButton } from './FullscreenButton';
import { InAppBackBar } from './InAppBackBar';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { gradientBg, COLORS } from '@/lib/styles';
import { useTelegram } from '@/providers/TelegramProvider';

interface Props {
  children: ReactNode;
  role: 'BUYER' | 'SELLER';
}

export function AppShell({ children, role }: Props) {
  const { viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 768;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: gradientBg }}>
      {/* Ambient depth layers */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute rounded-full" style={{
          width: 480, height: 480, top: -180, right: -120,
          background: `radial-gradient(circle, ${COLORS.orchidGlow} 0%, transparent 68%)`,
          filter: 'blur(72px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 320, height: 320, bottom: -100, left: -80,
          background: `radial-gradient(circle, ${COLORS.cyanDim} 0%, transparent 70%)`,
          filter: 'blur(56px)',
        }} />
        <div className="absolute rounded-full" style={{
          width: 260, height: 260, top: '40%', left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(13,17,32,0.60) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
      </div>

      <ToastContainer />
      <BackButton />

      {isDesktop ? (
        /* ── Desktop: sidebar + wide content ── */
        <>
          <Sidebar role={role} />
          <div
            className="relative z-10 flex-1 px-8 pb-8"
            style={{
              marginLeft: SIDEBAR_WIDTH,
              paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)',
              paddingRight: 'max(96px, env(safe-area-inset-right, 0px))',
            }}
          >
            <FullscreenButton />
            <div className="w-full max-w-screen-2xl mx-auto">
              <InAppBackBar />
              {children}
            </div>
          </div>
        </>
      ) : (
        /* ── Mobile: content + bottom nav ── */
        <>
          <div
            className="relative z-10 flex-1 px-4 pb-20"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
              paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
            }}
          >
            <FullscreenButton />
            <div className="w-full max-w-3xl mx-auto">
              <InAppBackBar />
              {children}
            </div>
          </div>
          <BottomNav role={role} />
        </>
      )}
    </div>
  );
}
