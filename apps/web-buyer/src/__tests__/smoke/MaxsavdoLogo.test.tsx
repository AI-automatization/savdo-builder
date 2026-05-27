// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): MaxsavdoLogo render.
// Защищает brand mark от случайного повреждения SVG-геометрии (handle,
// clipPath, gold color). Когда Полат заменит inline-приближение на
// финальный path из BRAND-LOGO-SVG-CREATE-001 — обновить ожидаемые d-атрибуты.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';

describe('MaxsavdoLogo', () => {
  it('рендерит SVG с role="img" и aria-label="maxsavdo"', () => {
    const { container } = render(<MaxsavdoLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('maxsavdo');
  });

  it('по умолчанию рендерит mark без wordmark', () => {
    const { container } = render(<MaxsavdoLogo />);
    expect(container.textContent).not.toContain('maxsavdo');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('withWordmark=true добавляет текст "maxsavdo" рядом с mark', () => {
    const { container } = render(<MaxsavdoLogo withWordmark />);
    expect(container.textContent).toContain('maxsavdo');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('size прокидывается в width/height SVG', () => {
    const { container } = render(<MaxsavdoLogo size={64} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('содержит bag-handle path (Q-curve над буквой M)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const handle = container.querySelector('svg path[d^="M 35 22 Q"]');
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute('stroke')).toBe('#C9A876'); // Champagne Gold
  });

  it('правая половина M залита Champagne Gold #C9A876', () => {
    const { container } = render(<MaxsavdoLogo />);
    const texts = container.querySelectorAll('svg text');
    expect(texts.length).toBe(2); // left + right half
    const goldText = Array.from(texts).find(
      (t) => t.getAttribute('fill') === '#C9A876',
    );
    expect(goldText).not.toBeUndefined();
    expect(goldText?.textContent).toBe('M');
  });

  it('левая половина M использует CSS-переменную text-primary (theme-aware)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const texts = container.querySelectorAll('svg text');
    const themedText = Array.from(texts).find(
      (t) => t.getAttribute('fill') === 'var(--color-text-primary)',
    );
    expect(themedText).not.toBeUndefined();
    expect(themedText?.textContent).toBe('M');
  });
});
