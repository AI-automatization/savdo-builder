import { useEffect, useRef } from 'react';

export type ParallaxPoint = { x: number; y: number };

/**
 * Tracks normalized pointer position (-1..1 on each axis, 0 = viewport
 * center) in a ref and calls `onMove` at most once per animation frame.
 * Ref-based (not state) so consumers can drive GSAP transforms directly
 * without triggering React re-renders on every mousemove.
 */
export function useMouseParallax(onMove: (point: ParallaxPoint) => void, enabled = true) {
  const frame = useRef<number | null>(null);
  const latest = useRef<ParallaxPoint>({ x: 0, y: 0 });
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!enabled) return;

    const handlePointerMove = (e: PointerEvent) => {
      latest.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        onMoveRef.current(latest.current);
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);
}
