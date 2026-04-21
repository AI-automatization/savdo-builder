import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function BottomSheet({ onClose, children, title }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
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
        {/* Drag handle */}
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

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
