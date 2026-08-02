import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { BackButton } from './BackButton';
import { FullscreenButton } from './FullscreenButton';
import { InAppBackBar } from './InAppBackBar';
import { Sidebar, SIDEBAR_WIDTH } from './Sidebar';
import { ToastContainer } from '@/components/ui/Toast';
import { ConfirmContainer } from '@/components/ui/ConfirmModal';
import { useTelegram } from '@/providers/TelegramProvider';

interface Props {
  children: ReactNode;
  role: 'BUYER' | 'SELLER';
}

export function AppShell({ children, role }: Props) {
  const { viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 768;

  return (
    <div data-role={role} className="min-h-screen flex flex-col" style={{ background: 'var(--tg-bg-gradient)' }}>
      {/* Ambient depth layers (только тёмная тема + ТОЛЬКО десктоп).
          PERF-TMA-HEAT-001: на мобилке 3 слоя filter:blur поверх fixed inset-0 при скролле
          заставляли WebView перерастеризовывать GPU каждый кадр → телефон грелся. Ambient —
          чисто декоративный фон (не сигнал), поэтому на телефоне отключён полностью.
          Мягкость даём через сам radial-gradient (без filter:blur) — тот же вид, ноль
          per-frame рестеризации. Слой промотирован в свой composite-слой (translateZ). */}
      {isDesktop && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 overflow-hidden z-0 hidden dark:block"
          data-ambient
          style={{ transform: 'translateZ(0)' }}
        >
          <div className="absolute rounded-full" style={{
            width: 620, height: 620, top: -240, right: -180,
            background: 'radial-gradient(circle, var(--tg-accent-glow) 0%, transparent 72%)',
          }} />
          <div className="absolute rounded-full" style={{
            width: 420, height: 420, bottom: -140, left: -120,
            background: 'radial-gradient(circle, var(--tg-cyan-dim) 0%, transparent 74%)',
          }} />
        </div>
      )}

      <ToastContainer />
      <ConfirmContainer />
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
            className="relative z-10 flex-1 px-4 pb-20 min-w-0 overflow-x-hidden"
            style={{
              paddingTop: 'max(env(safe-area-inset-top, 0px), 16px)',
              paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
            }}
          >
            <FullscreenButton />
            <div className="w-full max-w-3xl mx-auto min-w-0">
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
