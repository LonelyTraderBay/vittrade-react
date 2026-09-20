import { useState, useEffect, useRef } from 'react';

/**
 * Hook for animating number counters with easing
 * TIER 3.5 — Animated Platform Statistics
 */
export function useAnimatedCounter(
  endValue: number,
  duration: number = 1200,
  startOnMount: boolean = true
): number {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!startOnMount) {
      setCount(endValue);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setCount(Math.floor(endValue * easeOutCubic));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [endValue, duration, startOnMount]);

  return count;
}
