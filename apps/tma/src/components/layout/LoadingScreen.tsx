import { gradientBg } from '@/lib/styles';
import { MaxsavdoMark } from '@/components/brand/MaxsavdoMark';

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: gradientBg, position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient background glow — Champagne Gold */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 48%, var(--tg-accent-bg) 0%, transparent 65%)',
        }}
      />

      {/* Brand mark orb */}
      <div
        className="logo-pulse"
        style={{
          width: 76, height: 76, borderRadius: 26,
          background: 'var(--tg-surface)',
          border: '1px solid var(--tg-accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <MaxsavdoMark size={44} />
      </div>

      {/* Brand text */}
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em',
          color: 'var(--tg-accent)', margin: 0,
        }}>
          maxsavdo
        </p>
        <p style={{ fontSize: 11, color: 'var(--tg-text-dim)', letterSpacing: '0.12em', marginTop: 3 }}>
          ЗАГРУЖАЕМ...
        </p>
      </div>

      {/* Loading dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--tg-accent)',
              animation: `fade-slide-in 0.6s ease-in-out ${i * 0.18}s infinite alternate both`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
