import { render, screen } from '@testing-library/react'
import { Badge } from '../../components/ui/Badge'

// TMA-FRONTEND-TESTS-001 smoke: Badge статус-чип. Чистая функция от props,
// без router/api/auth. Маппинг status → ru-label.

describe('Badge (smoke)', () => {
  it('рендерит ru-label для PENDING', () => {
    render(<Badge status="PENDING" />)
    expect(screen.getByText('Обрабатывается')).toBeInTheDocument()
  })

  it('рендерит ru-label для DELIVERED', () => {
    render(<Badge status="DELIVERED" />)
    expect(screen.getByText('Доставлен')).toBeInTheDocument()
  })

  it('неизвестный status → отдаёт сам статус как fallback-label', () => {
    render(<Badge status="UNKNOWN_STATUS_XYZ" />)
    expect(screen.getByText('UNKNOWN_STATUS_XYZ')).toBeInTheDocument()
  })
})
