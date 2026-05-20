import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nProvider, useTranslation } from '../../lib/i18n'
import { TelegramProvider } from '../../providers/TelegramProvider'

// TMA-FRONTEND-TESTS-001 smoke: i18n provider возвращает русские строки
// по умолчанию и переключается на uz через setLocale(). I18nProvider читает
// useTelegram() для language_code → оборачиваем в TelegramProvider. В тестах
// initData стуба пустая, поэтому detectInitialLocale падает в DEFAULT_LOCALE='ru'.

describe('i18n (smoke)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TelegramProvider>
      <I18nProvider>{children}</I18nProvider>
    </TelegramProvider>
  )

  it('отдаёт ru-перевод по умолчанию', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('ru')
    expect(result.current.t('nav.cart')).toBe('Корзина')
  })

  it('переключается на uz через setLocale', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLocale('uz'))
    expect(result.current.locale).toBe('uz')
    expect(result.current.t('nav.cart')).toBe('Savat')
  })

  it('возвращает ключ если перевод не найден (fallback)', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.t('totally.unknown.key')).toBe('totally.unknown.key')
  })
})
