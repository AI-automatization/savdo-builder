export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0d2e 50%, #0d1a2e 100%)" }}
    >
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -200, right: -150, background: "radial-gradient(circle, rgba(167,139,250,.12) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, left: -100, background: "radial-gradient(circle, rgba(34,197,94,.08) 0%, transparent 70%)", filter: "blur(48px)" }} />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
