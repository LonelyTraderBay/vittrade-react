import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile-s' | 'mobile-l' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  'mobile-s': 0,
  'mobile-l': 376,
  'tablet': 768,
  'desktop': 1024,
} as const;

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS['mobile-l']) return 'mobile-l';
  return 'mobile-s';
}

export function useBreakpoint() {
  const [bp, setBp] = useState<Breakpoint>(() => getBreakpoint(window.innerWidth));
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      setWidth(w);
      setBp(getBreakpoint(w));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    bp,
    width,
    isMobile: bp === 'mobile-s' || bp === 'mobile-l',
    isTablet: bp === 'tablet',
    isDesktop: bp === 'desktop',
  };
}
