/**
 * maxsavdo brand mark — реальный знак из brand-book (logo-app-icon.jpg), без подложки.
 *
 * Две версии знака, переключаются по теме (без тёмной плашки):
 *  - `maxsavdo-mark.png`       — бел.+золото, показывается на ТЁМНОЙ теме;
 *  - `maxsavdo-mark-light.png` — тёмн.+золото (белая половина перекрашена в тёмный),
 *                                показывается на СВЕТЛОЙ теме (иначе белая часть сольётся).
 * Знак вырезан из brand-book JPG с прозрачным фоном (canvas). Переключение —
 * CSS-классами под `[data-theme="dark"]` (display задаётся ТОЛЬКО в CSS, см. globals.css,
 * иначе inline-style перебьёт класс).
 *
 * wordmark = знак + текст "maxsavdo" (Champagne Gold).
 * Дубль файла web-seller/src/components/brand/MaxsavdoLogo.tsx (packages/ui пуст).
 */

type Props = {
  /** Высота знака в пикселях. Default 32. */
  size?: number;
  /** Доп. классы для wrapper'а. */
  className?: string;
  /** Показать wordmark "maxsavdo" рядом со знаком. Default false. */
  withWordmark?: boolean;
};

const GOLD = '#C9A876';
const MARK_DARK = '/brand/maxsavdo-mark.png'; // white+gold → dark theme
const MARK_LIGHT = '/brand/maxsavdo-mark-light.png'; // dark+gold → light theme

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

function MaxsavdoMark({ size, className = '' }: { size: number; className?: string }) {
  const imgStyle = { height: size, width: 'auto' as const };
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ height: size, flexShrink: 0 }}
      role="img"
      aria-label="maxsavdo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="maxsavdo-mark-on-light" src={MARK_LIGHT} alt="" aria-hidden="true" style={imgStyle} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="maxsavdo-mark-on-dark" src={MARK_DARK} alt="" aria-hidden="true" style={imgStyle} />
    </span>
  );
}
