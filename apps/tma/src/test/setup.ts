// TMA-FRONTEND-TESTS-001: глобальный setup для vitest.
// jest-dom расширяет expect матчерами вроде toBeInTheDocument().
import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom не реализует matchMedia — нужен для любых компонентов читающих
// prefers-color-scheme (ThemeProvider, темизация TG).
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

// Полифилл window.Telegram.WebApp — критично для TMA.
// Множество страниц/компонентов читают MainButton/BackButton/HapticFeedback
// напрямую без проверки на null (особенно ErrorBoundary). Без stub-объекта
// тесты упадут на стадии импорта/рендера. См. src/lib/telegram.ts для контракта.
if (typeof window !== 'undefined' && !window.Telegram) {
  const noop = () => {}
  const button = () => ({
    isVisible: false,
    isActive: true,
    text: '',
    color: '#A855F7',
    textColor: '#FFFFFF',
    isProgressVisible: false,
    show: vi.fn(),
    hide: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    showProgress: vi.fn(),
    hideProgress: vi.fn(),
    setText: vi.fn(),
    onClick: vi.fn(),
    offClick: vi.fn(),
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).Telegram = {
    WebApp: {
      // initData пустая чтобы isTelegramEnv() возвращал false и провайдеры
      // не пытались дернуть real Telegram-bridge. UI рендерится в web-fallback.
      initData: '',
      initDataUnsafe: {},
      version: '7.0',
      platform: 'tdesktop',
      colorScheme: 'dark',
      themeParams: {},
      isExpanded: true,
      viewportHeight: 800,
      viewportStableHeight: 800,
      ready: noop,
      expand: noop,
      close: noop,
      onEvent: noop,
      offEvent: noop,
      openTelegramLink: noop,
      openLink: noop,
      BackButton: button(),
      MainButton: button(),
      HapticFeedback: {
        impactOccurred: vi.fn(),
        notificationOccurred: vi.fn(),
        selectionChanged: vi.fn(),
      },
    },
  }
}
