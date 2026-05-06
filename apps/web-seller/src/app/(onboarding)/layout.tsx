export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--onboarding-bg)" }}
    >
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: -200, right: -150, background: "var(--onboarding-orb-1)", filter: "blur(60px)" }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: -100, left: -100, background: "var(--onboarding-orb-2)", filter: "blur(48px)" }} />
      </div>
      <div className="relative w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
