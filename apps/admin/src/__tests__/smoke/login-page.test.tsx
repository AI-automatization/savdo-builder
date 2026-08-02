import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../../lib/i18n'
import LoginPage from '../../pages/LoginPage'

// API-FRONTEND-TESTS-001 smoke: LoginPage рендерится без падений на step 1
// (phone). lib/api мокается — реальные fetch не нужны для рендер-теста.
vi.mock('../../lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({}),
    post: vi.fn().mockResolvedValue({}),
  },
  auth: {
    getAccess: () => null,
    getRefresh: () => null,
    setTokens: vi.fn(),
    clear: vi.fn(),
  },
}))

describe('LoginPage (smoke)', () => {
  it('рендерит phone input и кнопку получения кода', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <LoginPage />
        </I18nProvider>
      </MemoryRouter>,
    )

    // Phone input — placeholder из компонента
    const phoneInput = screen.getByPlaceholderText('+998901234567')
    expect(phoneInput).toBeInTheDocument()
    expect(phoneInput).toHaveValue('+998')

    // Кнопка "Получить код" (ru) или "Kod olish" (uz). По умолчанию ru.
    expect(screen.getByRole('button', { name: /Получить код/i })).toBeInTheDocument()
  })

  it('показывает заголовок maxsavdo Admin', () => {
    render(
      <MemoryRouter>
        <I18nProvider>
          <LoginPage />
        </I18nProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /maxsavdo Admin/i })).toBeInTheDocument()
  })
})
