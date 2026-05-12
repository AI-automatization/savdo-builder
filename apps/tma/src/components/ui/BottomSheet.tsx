import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTelegram } from '@/providers/TelegramProvider';
import { SIDEBAR_WIDTH } from '@/components/layout/Sidebar';

interface Props {
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

/**
 * Polat 07.05: BottomSheet ВСЕГДА рендерится через React Portal в document.body.
 * Без портала modal contained родительским containing block — `backdrop-filter: blur`
 * в GlassCard, transform/will-change в анимациях, всё это ломает `position: fixed`.
 * Portal вырывает modal из дерева → fixed становится viewport-relative как должно быть.
 */
export function BottomSheet({ onClose, children, title }: Props) {
  const { viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 1024;
  // На desktop sidebar всегда виден (220px слева) — модалки должны его уважать.
  const desktopOffset = (viewportWidth ?? 0) >= 768 ? { left: SIDEBAR_WIDTH } : {};

  if (typeof document === 'undefined') return null;

  const content = isDesktop ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)', ...desktopOffset }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-3xl"
        style={{
          background: 'linear-gradient(160deg, #13111f 0%, #1a1635 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.50), 0 0 0 1px var(--tg-accent-bg)',
          width: 'min(720px, 100%)',
          maxHeight: '88vh',
          overflow: 'hidden',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>{title}</span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' }}
              aria-label="Закрыть"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  ) : (
    <div
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)', ...desktopOffset }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col rounded-t-3xl"
        style={{
          background: 'linear-gradient(160deg, #13111f 0%, #1a1635 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{title}</span>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
