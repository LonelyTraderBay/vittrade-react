import React, { useRef, useMemo, useCallback } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * ══════════════════════════════════════════════════════════
 *  Enterprise Page Transition — Direction-aware, Zero-flash
 * ══════════════════════════════════════════════════════════
 *  - PUSH  (forward)  → slide-in from right
 *  - POP   (backward) → slide-in from left
 *  - REPLACE          → crossfade only
 *  - Root tabs (/home, /markets, /wallet, /profile) → fade only
 *
 *  Performance optimizations:
 *  - Duration: 180ms (enterprise-fast, vs iOS 280ms)
 *  - Initial opacity: 0.5 (content partially visible immediately)
 *  - willChange: auto (no persistent GPU layer)
 *  - onAnimationComplete: force opacity=1 as safety net
 *  - AnimatePresence initial={false} to skip mount animation
 */

const ROOT_TABS = ['/home', '/markets', '/wallet', '/profile', '/trade'];

/** Compute depth of a path (number of meaningful segments) */
function pathDepth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

/** Enterprise transition duration — fast enough to feel instant */
const TRANSITION_DURATION = 0.18;

/** Minimal slide distance for perceived movement without layout shift */
const SLIDE_X = 48;

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const navType = useNavigationType();
  const prevPathRef = useRef(location.pathname);
  const motionRef = useRef<HTMLDivElement>(null);

  const isRootTab = ROOT_TABS.some(
    r => location.pathname === r || location.pathname === `/r${r}`
  );

  const prevDepth = useRef(pathDepth(location.pathname));

  const direction = useMemo(() => {
    if (isRootTab) return 'fade';
    if (navType === 'REPLACE') return 'fade';
    if (navType === 'POP') return 'back';
    return 'forward';
  }, [navType, isRootTab]);

  React.useEffect(() => {
    prevPathRef.current = location.pathname;
    prevDepth.current = pathDepth(location.pathname);
  }, [location.pathname]);

  // Animation variants — higher initial opacity = less perceived flash
  const variants = useMemo(() => {
    if (direction === 'fade') {
      return {
        initial: { opacity: 0.5, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -2 },
      };
    }
    if (direction === 'forward') {
      return {
        initial: { opacity: 0.4, x: SLIDE_X },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };
    }
    // back
    return {
      initial: { opacity: 0.4, x: -SLIDE_X },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 24 },
    };
  }, [direction]);

  // Safety net: force opacity=1 after animation completes
  const handleAnimationComplete = useCallback(() => {
    if (motionRef.current) {
      motionRef.current.style.opacity = '1';
      motionRef.current.style.transform = 'none';
    }
  }, []);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        ref={motionRef}
        key={location.key}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={{
          duration: TRANSITION_DURATION,
          ease: [0.32, 0.72, 0, 1],
        }}
        style={{ minHeight: '100%', willChange: 'auto' }}
        onAnimationComplete={handleAnimationComplete}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
