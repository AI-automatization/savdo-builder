// API-FRONTEND-TESTS-001: глобальный setup для vitest.
// jest-dom расширяет expect матчерами вроде toBeInTheDocument().
import '@testing-library/jest-dom/vitest'

// jsdom не реализует matchMedia — нужен для LoginPage/DashboardLayout
// (getInitialDark читает prefers-color-scheme).
if (typeof window !== 'undefined' && !window.matchMedia) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
