/**
 * Inline blocking script that sets `data-theme` on <html> *before* React hydrates.
 * Prevents a flash of the wrong theme (FOUC) on initial paint.
 *
 * Render this as the very first child of <head> in the root layout.
 * Seller defaults to `'dark'` — preserves the original CRM identity.
 */
export function ThemeScript({ defaultTheme = 'dark' }: { defaultTheme?: 'light' | 'dark' | 'system' }) {
  const code = `(function(){try{var d='${defaultTheme}';var s=localStorage.getItem('savdo-theme');var t=(s==='light'||s==='dark'||s==='system')?s:d;var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','${defaultTheme === 'light' ? 'light' : 'dark'}');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
