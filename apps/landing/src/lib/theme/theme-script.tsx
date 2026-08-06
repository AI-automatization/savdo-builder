/**
 * Inline blocking script that sets `data-theme` on <html> *before* React hydrates.
 * Prevents a flash of the wrong theme (FOUC) on initial paint.
 *
 * Render this inside <head>, as early as possible.
 *
 * `defaultTheme` is the fallback if nothing is in localStorage — landing
 * defaults to `'dark'` (not `'system'`) so a first-time visitor and every
 * crawler see the exact same first paint as before light mode existed.
 */
export function ThemeScript({ defaultTheme = 'dark' }: { defaultTheme?: 'light' | 'dark' | 'system' }) {
  const code = `(function(){try{var d='${defaultTheme}';var s=localStorage.getItem('savdo-theme');var t=(s==='light'||s==='dark'||s==='system')?s:d;var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','${defaultTheme === 'light' ? 'light' : 'dark'}');}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
