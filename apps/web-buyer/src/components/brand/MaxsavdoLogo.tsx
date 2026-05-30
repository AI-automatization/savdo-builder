/**
 * maxsavdo brand mark — inline SVG монограмма "M" с bag-handle, по brand-book v2.
 *
 * Mark = монограмма (без текста); wordmark = mark + текст "maxsavdo".
 * Левая половина M использует `var(--color-text-primary)` → автоматически
 * адаптируется к light/dark theme (black на light, white на dark).
 * Правая половина + handle = Champagne Gold (#C9A876).
 *
 * Это inline-приближение для немедленного rollout. Когда Полат закроет
 * BRAND-LOGO-SVG-CREATE-001 (vectorize JPG → точный SVG), заменим внутренности
 * `<MaxsavdoMark/>` на финальные path-данные — API компонента не сломается.
 */

type Props = {
  /** Размер mark'а в пикселях (mark — квадрат). Default 32. */
  size?: number;
  /** Доп. классы для wrapper'а. */
  className?: string;
  /** Показать wordmark "maxsavdo" рядом с mark'ом. Default false. */
  withWordmark?: boolean;
};

const GOLD = '#C9A876';

export function MaxsavdoLogo({ size = 32, className = '', withWordmark = false }: Props) {
  if (withWordmark) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <MaxsavdoMark size={size} />
        <span
          className="font-bold tracking-tight leading-none"
          style={{ color: GOLD, fontSize: size * 0.62 }}
        >
          maxsavdo
        </span>
      </span>
    );
  }
  return <MaxsavdoMark size={size} className={className} />;
}

// Реальная векторизация знака brand-book (logo-app-icon.jpg): силуэт обведён по
// пикселям (canvas color-threshold → marching-squares контуры → RDP-упрощение).
// Две заливки: WHITE_D — левая «N»-форма (нога + диагональ), theme-adaptive
// (var(--color-text-primary): чёрная на light, белая на dark); GOLD_D — правая
// половина M + полукруглая ручка-сумка, Champagne Gold. fill-rule=evenodd.
// При смене знака меняем только эти d-строки — API компонента стабилен.
const WHITE_D =
  'M 45.8 8 L 53.9 8.3 L 58.1 10.1 L 62 13.4 L 53.9 8.9 L 48.5 8.3 L 41.3 10.1 L 34.4 15.2 L 38.9 10.7 L 45.5 8.3 Z M 11 26 L 14.3 25.7 L 18.5 28.7 L 83 91.4 L 65.3 91.1 L 21.5 49.1 L 21.2 92 L 17.3 92.3 L 11.9 89.9 L 9.2 87.2 L 8 83.6 L 8 30.8 L 9.2 27.2 L 10.7 26.3 Z M 84.2 26 L 88.1 26.9 L 91.4 31.4 L 91.1 64.7 L 90.8 34.4 L 90.2 30.8 L 88.7 31.1 L 86.9 28.7 L 83.9 28.7 L 83.9 29.9 L 81.5 29.9 L 80.9 28.7 L 79.7 29.3 L 79.1 31.1 L 74.9 33.5 L 53.6 52.4 L 79.1 28.1 L 83.9 26.3 Z';
const GOLD_D =
  'M 48.2 8.6 L 53.9 8.9 L 62 14 L 66.2 22.4 L 66.8 28.4 L 65.3 29.9 L 62.6 28.4 L 62 21.2 L 59.6 17 L 55.1 13.1 L 50.9 11.9 L 46.7 11.9 L 41.3 14.3 L 37.4 18.2 L 35 23 L 35 29 L 32.3 29.9 L 30.8 28.4 L 31.4 21.8 L 34.4 15.8 L 41.3 10.1 L 47.9 8.9 Z M 87.2 28.4 L 88.7 31.1 L 90.2 30.8 L 90.8 34.4 L 90.8 64.4 L 92 82.4 L 90.2 87.2 L 86.3 89.9 L 78.2 81.8 L 77.6 49.4 L 76.7 48.5 L 74.3 50.3 L 61.1 62.9 L 59.3 62.9 L 51.2 54.8 L 74.9 33.5 L 79.1 31.1 L 79.7 29.3 L 80.9 28.7 L 81.5 29.9 L 83.9 29.9 L 83.9 28.7 L 86.9 28.7 Z';

function MaxsavdoMark({ size, className = '' }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="maxsavdo"
    >
      {/* Left "N" form — theme-adaptive (black on light, white on dark) */}
      <path d={WHITE_D} fill="var(--color-text-primary)" fillRule="evenodd" />
      {/* Right M-half + bag handle — Champagne Gold */}
      <path d={GOLD_D} fill={GOLD} fillRule="evenodd" />
    </svg>
  );
}
