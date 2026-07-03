import { useState, useEffect, type CSSProperties } from 'react';
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

  // TMA-PRODUCTIMAGE-STALE-ERROR-005: сбрасываем ошибку при смене src — иначе в
  // галерее (ProductPage свайп) после одного битого фото все следующие валидные
  // тоже показывали заглушку (errored оставался true на том же инстансе).
  useEffect(() => { setErrored(false); }, [src]);

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
