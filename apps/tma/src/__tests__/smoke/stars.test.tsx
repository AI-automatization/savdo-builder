import { render, screen, fireEvent } from '@testing-library/react'
import { Stars } from '../../components/ui/Stars'

// TMA-FRONTEND-TESTS-001 smoke: Stars — чистый презентационный компонент.
// Без navigation, без API, без auth. Идеальный кандидат на smoke.

describe('Stars (smoke)', () => {
  it('рендерит 5 звёзд', () => {
    render(<Stars value={3} />)
    const group = screen.getByLabelText('Рейтинг')
    expect(group).toBeInTheDocument()
    expect(group.querySelectorAll('span').length).toBe(5)
  })

  it('read-only режим: без role=radiogroup, без onChange', () => {
    render(<Stars value={4} />)
    // role у обёртки не задан — берём по aria-label.
    const wrap = screen.getByLabelText('Рейтинг')
    expect(wrap.getAttribute('role')).toBeNull()
  })

  it('interactive: onChange срабатывает по клику на звезду', () => {
    const onChange = vi.fn()
    render(<Stars value={0} onChange={onChange} />)
    const group = screen.getByRole('radiogroup', { name: 'Рейтинг' })
    const stars = group.querySelectorAll('[role="radio"]')
    expect(stars.length).toBe(5)
    fireEvent.click(stars[2])
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
