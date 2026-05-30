/**
 * maxsavdo brand mark — реальный знак из brand-book (logo-app-icon.jpg).
 *
 * Знак = глянцевый 3D-знак из brand-book, вырезанный с прозрачным фоном
 * (`public/brand/maxsavdo-mark.png`), помещённый на тёмную скруглённую плашку
 * (мини app-icon badge). Плашка делает знак тема-независимым: на светлой странице
 * это премиальный тёмный badge, на тёмной — плашка сливается, виден сам знак.
 * Так знак 1:1 совпадает с brand-book в любой теме (флэт-вектор так не умеет —
 * оригинал глянцевый 3D-рендер).
 *
 * wordmark = знак + текст "maxsavdo" (Champagne Gold).
 * Дубль файла web-buyer/src/components/brand/MaxsavdoLogo.tsx (packages/ui пуст).
 */

type Props = {
  /** Размер плашки в пикселях (квадрат). Default 32. */
  size?: number;
  /** Доп. классы для wrapper'а. */
  className?: string;
  /** Показать wordmark "maxsavdo" рядом со знаком. Default false. */
  withWordmark?: boolean;
};

const GOLD = '#C9A876';
const MARK_SRC = '/brand/maxsavdo-mark.png';

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
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        background: '#0A0A0A',
        borderRadius: Math.round(size * 0.26),
        flexShrink: 0,
        overflow: 'hidden',
      }}
      role="img"
      aria-label="maxsavdo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MARK_SRC}
        alt="maxsavdo"
        style={{ width: size * 0.78, height: 'auto', display: 'block' }}
      />
    </span>
  );
}
