import React, { useRef, useEffect, useMemo } from 'react';

/**
 * ══════════════════════════════════════════════════════════
 *  useFadeInTab — Enterprise Zero-Flash Tab Transition Hook
 * ══════════════════════════════════════════════════════════
 *
 *  Replaces AnimatePresence-based tab content animation with
 *  a single CSS @keyframes injection. Provides:
 *
 *  - `tabStyle(skipOnMount?)` — returns inline style for tab panels
 *  - `StyleTag` — JSX element to inject once per page
 *
 *  WHY: AnimatePresence + motion.div inside PageTransition's
 *  own AnimatePresence causes double-animation deadlock where
 *  inner content stays at opacity:0 for 300-560ms (white flash).
 *
 *  This hook uses a single CSS @keyframes (GPU-composited,
 *  no JS overhead) with mount-awareness to skip animation
 *  on initial page render (where PageTransition already animates).
 *
 *  @param animationName - Unique keyframe name (default: 'fadeInTab')
 *  @param duration - Animation duration in ms (default: 180)
 *
 *  @example
 *  const { tabStyle, StyleTag } = useFadeInTab();
 *
 *  return (
 *    <div>
 *      {tab === 'FAQ' && <div style={tabStyle()}>...</div>}
 *      {tab === 'Guide' && <div style={tabStyle()}>...</div>}
 *      {StyleTag}
 *    </div>
 *  );
 */

interface UseFadeInTabOptions {
  /** Unique keyframe name to avoid collisions between pages */
  animationName?: string;
  /** Duration in ms */
  duration?: number;
  /** translateY distance in px */
  translateY?: number;
}

interface UseFadeInTabReturn {
  /**
   * Returns inline style object for a tab panel.
   * @param skipOnMount - If true, skips animation on first render (default: true)
   */
  tabStyle: (skipOnMount?: boolean) => React.CSSProperties;
  /**
   * CSS <style> element to render once in the component.
   * Injects the @keyframes rule.
   */
  StyleTag: React.ReactElement;
}

const injectedKeyframes = new Set<string>();

export function useFadeInTab(options?: UseFadeInTabOptions): UseFadeInTabReturn {
  const {
    animationName = 'fadeInTab',
    duration = 180,
    translateY = 4,
  } = options ?? {};

  const hasMounted = useRef(false);

  useEffect(() => {
    // Mark as mounted after first render frame
    hasMounted.current = true;
  }, []);

  const tabStyle = useMemo(() => {
    return (skipOnMount: boolean = true): React.CSSProperties => {
      // On initial page mount, PageTransition already handles the entrance animation.
      // Adding another animation here causes a stacking delay → white flash.
      if (skipOnMount && !hasMounted.current) {
        return { willChange: 'opacity, transform' };
      }
      return {
        animation: `${animationName} ${duration}ms ease-out`,
        willChange: 'opacity, transform',
      };
    };
  }, [animationName, duration]);

  // Inject keyframes only once per animation name globally
  const StyleTag = useMemo(() => {
    const cssRule = `
@keyframes ${animationName} {
  from { opacity: 0; transform: translateY(${translateY}px); }
  to { opacity: 1; transform: translateY(0); }
}`;

    // SSR-safe: always render the style tag, but deduplicate in the set
    if (!injectedKeyframes.has(animationName)) {
      injectedKeyframes.add(animationName);
    }

    // Using a <style> element with a stable key
    return React.createElement('style', {
      key: `fadeInTab-${animationName}`,
      dangerouslySetInnerHTML: { __html: cssRule },
    }) as React.ReactElement;
  }, [animationName, translateY]);

  return { tabStyle, StyleTag };
}