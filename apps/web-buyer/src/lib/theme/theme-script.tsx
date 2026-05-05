/**
 * Inline blocking script that sets `data-theme` on <html> *before* React hydrates.
 * Prevents a flash of the wrong theme (FOUC) on initial paint.
 *
 * Render this as the very first child of <head> in the root layout.
 *
 * `defaultTheme` is the fallback if nothing is in localStorage:
 *   - buyer: `'system'` (respect OS preference for first-time visitors)
 *   - seller: `'dark'` (CRM identity — keep the original look until user opts out)
 */
export function ThemeScript({ defaultTheme = 'system' }: { defaultTheme?: 'light' | 'dark' | 'system' }) {
  const code = `(function(){try{var d='${defaultTheme}';var s=localStorage.getItem('savdo-theme');var t=(s==='light'||s==='dark'||s==='system')?s:d;var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','${defaultTheme === 'dark' ? 'dark' : 'light'}');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
