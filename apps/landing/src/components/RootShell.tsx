import { inter } from "@/lib/fonts";
import { organizationJsonLd } from "@/lib/jsonld";
import Analytics from "@/components/Analytics";
import { ThemeScript } from "@/lib/theme/theme-script";
import { ThemeProvider } from "@/lib/theme/theme-provider";

type RootShellProps = {
  /** BCP-47 tag for <html lang>. Must match the hreflang of the route. */
  lang: "uz" | "ru";
  children: React.ReactNode;
};

/**
 * The single <html>/<body> shell, shared by the two root layouts.
 *
 * Why two root layouts at all: `lang` has to differ between `/` (uz) and `/ru`,
 * and only a root layout may render <html>. A nested `ru/layout.tsx` cannot
 * override it — that is why /ru used to be served as lang="uz" while its own
 * hreflang claimed "ru". Route groups `(uz)` / `(ru)` give each locale its own
 * root layout without changing the URLs.
 */
export default function RootShell({ lang, children }: RootShellProps) {
  return (
    <html lang={lang} className={inter.variable}>
      <head>
        {/* Must run before hydration to avoid a flash of the wrong theme —
            see lib/theme/theme-script.tsx. Default stays 'dark' so first
            paint (crawlers included) is unchanged from the pre-light-mode site. */}
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <ThemeProvider defaultTheme="dark">
          {/* Ambient amber orbs — Azim base, Polat colors */}
          <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
            <div className="absolute rounded-full" style={{ width: 640, height: 640, top: -200, right: -160, background: "radial-gradient(circle, rgba(232,165,82,0.18) 0%, transparent 65%)", filter: "blur(60px)" }} />
            <div className="absolute rounded-full" style={{ width: 420, height: 420, bottom: 80, left: -110, background: "radial-gradient(circle, rgba(212,146,46,0.13) 0%, transparent 65%)", filter: "blur(50px)" }} />
            <div className="absolute rounded-full" style={{ width: 340, height: 340, top: "45%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(232,165,82,0.08) 0%, transparent 65%)", filter: "blur(44px)" }} />
            <div className="absolute rounded-full" style={{ width: 240, height: 240, bottom: 280, right: 80, background: "radial-gradient(circle, rgba(255,190,100,0.10) 0%, transparent 65%)", filter: "blur(34px)" }} />
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            {children}
          </div>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
