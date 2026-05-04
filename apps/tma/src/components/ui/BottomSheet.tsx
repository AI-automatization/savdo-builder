import type { ReactNode } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';

interface Props {
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ onClose, children, title }: Props) {
  const { viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 1024;

  if (isDesktop) {
    return (
      <div
        className="fixed inset-0 z-[9999]flex items-center justify-center px-6"
        style={{ background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="flex flex-col rounded-3xl"
          style={{
            background: 'linear-gradient(160deg, #13111f 0%, #1a1635 100%)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.50), 0 0 0 1px rgba(168,85,247,0.06)',
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
    );
  }

  return (
    <div
      className="fixed inset-0 z-[9999]flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(6px)' }}
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
}
