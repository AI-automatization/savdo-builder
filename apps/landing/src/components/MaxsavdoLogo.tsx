/**
 * Inline mark, mirroring public/logo-maxsavdo.svg (keep both in sync if the
 * artwork changes — see BRAND-LOGO-SVG-CREATE-001 in docs/brand/maxsavdo-brand-v2.md).
 * Inlined (rather than <Image src=".../logo-maxsavdo.svg">) specifically so the
 * left "ink" half of the M can theme with the page: `var(--color-text)` is
 * near-white on the dark default and near-black under [data-theme="light"],
 * matching every other themed color. Loading the file as an <img>/<Image>
 * would freeze it as a static asset — no page CSS variable can reach inside it.
 * The gold half/handle stay literal — accent gold is constant across themes.
 */
export function MaxsavdoLogo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="MaxSavdo">
      <defs>
        <clipPath id="ms-clip-left">
          <rect x="0" y="0" width="50" height="100" />
        </clipPath>
        <clipPath id="ms-clip-right">
          <rect x="50" y="0" width="50" height="100" />
        </clipPath>
      </defs>
      <path d="M 35 22 Q 50 4 65 22" stroke="#C9A876" strokeWidth="5" fill="none" strokeLinecap="round" />
      <text x="50" y="92" textAnchor="middle" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontWeight={900} fontSize={100} fill="var(--color-text)" clipPath="url(#ms-clip-left)">M</text>
      <text x="50" y="92" textAnchor="middle" fontFamily="Inter, system-ui, -apple-system, sans-serif" fontWeight={900} fontSize={100} fill="#C9A876" clipPath="url(#ms-clip-right)">M</text>
    </svg>
  );
}
