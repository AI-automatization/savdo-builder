// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest часть, web-buyer): глобальный setup.
import '@testing-library/jest-dom/vitest';

// jsdom не реализует matchMedia — нужен компонентам, которые читают prefers-color-scheme.
if (typeof window !== 'undefined' && !window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
