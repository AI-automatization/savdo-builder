import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nProvider, useTranslation } from '../../lib/i18n'

// API-FRONTEND-TESTS-001 smoke: i18n provider возвращает русские строки
// по умолчанию и переключается на uz через setLocale().
describe('i18n (smoke)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  )

  it('отдаёт ru-перевод по умолчанию', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.locale).toBe('ru')
    expect(result.current.t('nav.users')).toBe('Пользователи')
  })

  it('переключается на uz через setLocale', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    act(() => result.current.setLocale('uz'))
    expect(result.current.locale).toBe('uz')
    expect(result.current.t('nav.users')).toBe('Foydalanuvchilar')
  })

  it('возвращает ключ если перевод не найден', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.t('totally.unknown.key')).toBe('totally.unknown.key')
  })
})
