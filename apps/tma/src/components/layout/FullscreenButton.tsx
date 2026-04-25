import { useEffect, useState } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';

// Десктопные платформы Telegram (не мобильные)
const DESKTOP_PLATFORMS = new Set(['tdesktop', 'macos', 'web', 'webk', 'webz', 'weba']);

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 6V1h5M15 6V1h-5M1 10v5h5M15 10v5h-5" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 1v5H1M10 1v5h5M6 15v-5H1M10 15v-5h5" />
    </svg>
  );
}

export function FullscreenButton() {
  const { tg } = useTelegram();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isDesktop = tg ? DESKTOP_PLATFORMS.has(tg.platform) : false;
  const supportsFullscreen = !!tg?.requestFullscreen;

  useEffect(() => {
    if (!tg || !supportsFullscreen) return;

    setIsFullscreen(tg.isFullscreen ?? false);

    const handler = () => setIsFullscreen(tg.isFullscreen ?? false);
    tg.onEvent?.('fullscreen_changed', handler);
    return () => tg.offEvent?.('fullscreen_changed', handler);
  }, [tg, supportsFullscreen]);

  if (!isDesktop || !supportsFullscreen) return null;

  const toggle = () => {
    if (!tg) return;
    tg.HapticFeedback.selectionChanged();
    if (isFullscreen) {
      tg.exitFullscreen?.();
    } else {
      tg.requestFullscreen?.();
    }
  };

  return (
    <button
      onClick={toggle}
      title={isFullscreen ? 'Свернуть' : 'На весь экран'}
      className="fixed bottom-[5.25rem] right-3 z-50 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.16)';
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.9)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.6)';
      }}
    >
      {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
    </button>
  );
}
