import { useState, type CSSProperties } from 'react';
import { ImagePlaceholder, type PlaceholderVariant } from './ImagePlaceholder';

interface Props {
  src?: string | null;
  alt?: string;
  /** Что показать если src пусто или картинка не загрузилась. */
  emptyVariant?: PlaceholderVariant;  // src отсутствует
  errorVariant?: PlaceholderVariant;  // src был, но загрузка упала
  hideLabel?: boolean;
  className?: string;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
}

/**
 * Универсальный <img> с graceful fallback на ImagePlaceholder.
 * Использовать везде где раньше был эмодзи 📦/🛍/💬.
 */
export function ProductImage({
  src,
  alt,
  emptyVariant = 'product-empty',
  errorVariant = 'load-failed',
  hideLabel,
  className,
  style,
  imgStyle,
}: Props) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <ImagePlaceholder
        variant={!src ? emptyVariant : errorVariant}
        hideLabel={hideLabel}
        className={className}
        style={style}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? ''}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imgStyle, ...style }}
      onError={() => setErrored(true)}
    />
  );
}
