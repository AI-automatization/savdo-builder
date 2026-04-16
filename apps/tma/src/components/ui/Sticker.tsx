import Lottie from 'lottie-react';
import { useState, useEffect, memo } from 'react';

/**
 * Animated stickers via Google Noto Animated Emoji CDN.
 * Falls back to plain text emoji if loading fails or emoji is unknown.
 * Style is very close to Apple iOS emoji animations.
 */

// Unicode codepoints for Google Noto Animated Emoji CDN
const EMOJI_MAP: Record<string, string> = {
  '🛒': '1f6d2',
  '🏪': '1f3ea',
  '📦': '1f4e6',
  '⚠️': '26a0_fe0f',
  '✅': '2705',
  '❌': '274c',
  '📋': '1f4cb',
  '🔔': '1f514',
  '🛍️': '1f6cd_fe0f',
  '🛍': '1f6cd_fe0f',
  '🏠': '1f3e0',
  '💳': '1f4b3',
  '📢': '1f4e2',
  '📍': '1f4cd',
  '🔗': '1f517',
  '✏️': '270f_fe0f',
  '🎉': '1f389',
  '🚀': '1f680',
  '💫': '1f4ab',
  '🎁': '1f381',
  '💰': '1f4b0',
  '📱': '1f4f1',
  '🔒': '1f512',
  '⭐': '2b50',
  '🌟': '1f31f',
  '🏷️': '1f3f7_fe0f',
  '🖼️': '1f5bc_fe0f',
  '🔑': '1f511',
  '📬': '1f4ec',
  '📭': '1f4ed',
  '📮': '1f4ee',
  '🧾': '1f9fe',
  '💡': '1f4a1',
  '🎯': '1f3af',
  '📊': '1f4ca',
  '🛠️': '1f6e0_fe0f',
  '🤝': '1f91d',
  '👋': '1f44b',
  '🙏': '1f64f',
};

const CDN = 'https://fonts.gstatic.com/s/e/notoemoji/latest';

// Simple cache so the same animation isn't fetched twice
const cache = new Map<string, object>();

interface StickerProps {
  emoji: string;
  size?: number;
  loop?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Sticker = memo(function Sticker({
  emoji,
  size = 32,
  loop = true,
  className,
  style,
}: StickerProps) {
  const codepoint = EMOJI_MAP[emoji];
  const [animationData, setAnimationData] = useState<object | null>(
    codepoint && cache.has(codepoint) ? cache.get(codepoint)! : null,
  );
  const [failed, setFailed] = useState(!codepoint);

  useEffect(() => {
    if (!codepoint || cache.has(codepoint)) return;
    let cancelled = false;

    fetch(`${CDN}/${codepoint}/lottie.json`)
      .then((r) => {
        if (!r.ok) throw new Error('not ok');
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        cache.set(codepoint, data);
        setAnimationData(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => { cancelled = true; };
  }, [codepoint]);

  // Fallback: text emoji
  if (failed) {
    return (
      <span style={{ fontSize: size * 0.85, lineHeight: 1, ...style }} className={className}>
        {emoji}
      </span>
    );
  }

  // Loading: invisible placeholder (preserves layout)
  if (!animationData) {
    return (
      <span style={{ display: 'inline-block', width: size, height: size, ...style }} className={className} />
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay
      style={{ width: size, height: size, ...style }}
      className={className}
    />
  );
});
