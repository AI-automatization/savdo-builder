import { useEffect, useState } from 'react';

/**
 * True when the viewport is at least `minWidth` wide AND the user has not
 * requested reduced motion. Shared gate for anything JS-animation-heavy
 * (pinned scroll timelines, idle float loops) so none of it ships to phones
 * or to users who opted out of motion.
 */
export function useMotionEligible(minWidth = 1024) {
  const [eligible, setEligible] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mqWidth = window.matchMedia(`(min-width: ${minWidth}px)`);
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setEligible(mqWidth.matches && !mqMotion.matches);
    update();
    mqWidth.addEventListener('change', update);
    mqMotion.addEventListener('change', update);
    return () => {
      mqWidth.removeEventListener('change', update);
      mqMotion.removeEventListener('change', update);
    };
  }, [minWidth]);

  return eligible;
}
