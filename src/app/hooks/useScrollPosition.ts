import { useState, useEffect, useCallback, useRef } from 'react';

interface ScrollPositionState {
  scrollY: number;
  isScrollingDown: boolean;
  isAtTop: boolean;
  isAtBottom: boolean;
  /** true khi đã scroll qua 300px — dùng cho ScrollToTop FAB */
  showScrollTop: boolean;
}

/**
 * Hook theo dõi scroll position của element ref
 * Nếu không truyền ref, theo dõi scroll container gần nhất
 */
export function useScrollPosition(scrollRef?: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<ScrollPositionState>({
    scrollY: 0,
    isScrollingDown: false,
    isAtTop: true,
    isAtBottom: false,
    showScrollTop: false,
  });

  const prevScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const el = scrollRef?.current;
      if (!el) {
        ticking.current = false;
        return;
      }

      const scrollY = el.scrollTop;
      const isScrollingDown = scrollY > prevScrollY.current;
      const isAtTop = scrollY <= 5;
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 5;
      const showScrollTop = scrollY > 300;

      prevScrollY.current = scrollY;

      setState({ scrollY, isScrollingDown, isAtTop, isAtBottom, showScrollTop });
      ticking.current = false;
    });
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef?.current;
    if (!el) return;

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, handleScroll]);

  const scrollToTop = useCallback(() => {
    const el = scrollRef?.current;
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [scrollRef]);

  return { ...state, scrollToTop };
}
