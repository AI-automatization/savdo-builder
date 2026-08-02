import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { I18nProvider } from '../../lib/i18n'
import { ImpersonationProvider } from '../../lib/impersonation'
import DashboardLayout from '../../layouts/DashboardLayout'

// API-FRONTEND-TESTS-001 smoke: DashboardLayout рендерит sidebar с навигацией.
// CommandPalette мокается — он подтягивает cmdk + api search debounce, который
// в smoke-тесте не нужен.
vi.mock('../../components/admin/CommandPalette', () => ({
  CommandPalette: () => null,
}))

// api.ts — мок чтобы не было реальных fetch при возможных side-effects.
vi.mock('../../lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue({}), post: vi.fn().mockResolvedValue({}) },
  auth: {
    getAccess: () => null,
    getRefresh: () => null,
    setTokens: vi.fn(),
    clear: vi.fn(),
  },
}))

describe('DashboardLayout (smoke)', () => {
  it('рендерит навигационные ссылки sidebar-а', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <I18nProvider>
          <ImpersonationProvider>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route path="dashboard" element={<div>page</div>} />
              </Route>
            </Routes>
          </ImpersonationProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    // Базовые навигационные ссылки (ru locale).
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Пользователи/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Магазины/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Заказы/ })).toBeInTheDocument()
  })

  it('показывает logout-кнопку и логотип maxsavdo', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <I18nProvider>
          <ImpersonationProvider>
            <Routes>
              <Route path="/" element={<DashboardLayout />}>
                <Route path="dashboard" element={<div>page</div>} />
              </Route>
            </Routes>
          </ImpersonationProvider>
        </I18nProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('maxsavdo')).toBeInTheDocument()
    expect(screen.getByLabelText(/Выйти/i)).toBeInTheDocument()
  })
})
