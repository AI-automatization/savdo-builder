// TMA-FRONTEND-TESTS-001 smoke: проверяет что setup.ts корректно полифилит
// window.Telegram.WebApp. Это infrastructure-тест: если он падает — все
// остальные TMA-тесты тоже падают (страницы лезут в Telegram SDK без guard'ов).

describe('window.Telegram.WebApp stub (infrastructure)', () => {
  it('Telegram.WebApp существует на window', () => {
    expect(window.Telegram).toBeDefined()
    expect(window.Telegram?.WebApp).toBeDefined()
  })

  it('MainButton имеет API show/hide/setText/enable/disable/onClick', () => {
    const mb = window.Telegram!.WebApp.MainButton
    expect(typeof mb.show).toBe('function')
    expect(typeof mb.hide).toBe('function')
    expect(typeof mb.setText).toBe('function')
    expect(typeof mb.enable).toBe('function')
    expect(typeof mb.disable).toBe('function')
    expect(typeof mb.onClick).toBe('function')
  })

  it('BackButton имеет API show/hide/onClick', () => {
    const bb = window.Telegram!.WebApp.BackButton
    expect(typeof bb.show).toBe('function')
    expect(typeof bb.hide).toBe('function')
    expect(typeof bb.onClick).toBe('function')
  })

  it('HapticFeedback имеет impactOccurred/notificationOccurred/selectionChanged', () => {
    const hf = window.Telegram!.WebApp.HapticFeedback
    expect(typeof hf.impactOccurred).toBe('function')
    expect(typeof hf.notificationOccurred).toBe('function')
    expect(typeof hf.selectionChanged).toBe('function')
  })

  it('initData пустая → isTelegramEnv() === false (web-fallback режим)', () => {
    expect(window.Telegram!.WebApp.initData).toBe('')
    expect(window.Telegram!.WebApp.initDataUnsafe).toEqual({})
  })
})
