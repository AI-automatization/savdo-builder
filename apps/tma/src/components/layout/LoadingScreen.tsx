import { gradientBg } from '@/lib/styles';

export function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: gradientBg, position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient background glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 48%, rgba(168,85,247,0.07) 0%, transparent 65%)',
        }}
      />

      {/* Logo orb */}
      <div
        className="logo-pulse"
        style={{
          width: 76, height: 76, borderRadius: 26,
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38,
        }}
      >
        🛒
      </div>

      {/* Brand text */}
      <div style={{ textAlign: 'center' }}>
        <p className="text-gradient" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Savdo
        </p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em', marginTop: 3 }}>
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
              background: 'rgba(168,85,247,0.50)',
              animation: `fade-slide-in 0.6s ease-in-out ${i * 0.18}s infinite alternate both`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
