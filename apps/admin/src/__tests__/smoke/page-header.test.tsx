import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PageHeader } from '../../components/admin/PageHeader'

// API-FRONTEND-TESTS-001 smoke: PageHeader — простейший компонент,
// зависит только от react-router (useNavigate для backTo).
describe('PageHeader (smoke)', () => {
  it('рендерит title и subtitle', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Пользователи" subtitle="Управление аккаунтами" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Пользователи' })).toBeInTheDocument()
    expect(screen.getByText('Управление аккаунтами')).toBeInTheDocument()
  })

  it('показывает count badge когда count > 0', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Заказы" count={42} />
      </MemoryRouter>,
    )
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('не показывает badge при count=0', () => {
    render(
      <MemoryRouter>
        <PageHeader title="Заказы" count={0} />
      </MemoryRouter>,
    )
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
