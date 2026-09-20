import { useState, useRef, useCallback } from 'react';

interface PullToRefreshOptions {
  /** Callback khi user pull đủ threshold và thả tay */
  onRefresh: () => Promise<void> | void;
  /** Khoảng cách kéo tối thiểu để trigger (px) */
  threshold?: number;
  /** Khoảng cách kéo tối đa (px) */
  maxPull?: number;
  /** Thời gian minimum hiển thị loading (ms) */
  minLoadingTime?: number;
}

interface PullToRefreshState {
  pullDistance: number;
  isPulling: boolean;
  isRefreshing: boolean;
  /** 0-1 progress đến threshold */
  progress: number;
}

const IDLE_STATE: PullToRefreshState = {
  pullDistance: 0,
  isPulling: false,
  isRefreshing: false,
  progress: 0,
};

export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  maxPull = 120,
  minLoadingTime = 800,
}: PullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>(IDLE_STATE);

  const startY = useRef(0);
  const currentY = useRef(0);
  const pulling = useRef(false);
  /** true once user has moved past the dead zone (10px) */
  const activated = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Chỉ activate khi scroll ở top
    const scrollContainer = (e.currentTarget as HTMLElement).closest('[data-pull-scroll]') as HTMLElement | null;
    const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
    if (scrollTop > 5) return;

    startY.current = e.touches[0].clientY;
    pulling.current = true;
    activated.current = false;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || state.isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const delta = currentY.current - startY.current;

    // Dead zone: require 10px vertical movement before any state changes.
    // This prevents re-renders during simple taps/clicks on buttons.
    if (!activated.current) {
      if (Math.abs(delta) < 10) return;
      activated.current = true;
    }

    if (delta < 0) {
      pulling.current = false;
      activated.current = false;
      setState(s => s.isPulling ? IDLE_STATE : s);
      return;
    }

    // Resistance curve — kéo càng xa càng nặng
    const resistance = 0.4;
    const distance = Math.min(delta * resistance, maxPull);
    const progress = Math.min(distance / threshold, 1);

    setState(s => ({
      ...s,
      pullDistance: distance,
      isPulling: true,
      progress,
    }));
  }, [state.isRefreshing, threshold, maxPull]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    // If we never passed the dead zone (simple tap), skip setState entirely.
    // This is critical: unnecessary setState during tap → re-render → swallows click event.
    if (!activated.current) {
      activated.current = false;
      return;
    }
    activated.current = false;

    if (state.pullDistance >= threshold && !state.isRefreshing) {
      setState(s => ({ ...s, isRefreshing: true, pullDistance: threshold * 0.6, progress: 1 }));

      const startTime = Date.now();
      try {
        await onRefresh();
      } catch { /* ignore */ }

      // Đảm bảo loading hiển thị tối thiểu minLoadingTime
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise(r => setTimeout(r, minLoadingTime - elapsed));
      }

      setState(IDLE_STATE);
    } else {
      setState(IDLE_STATE);
    }
  }, [state.pullDistance, state.isRefreshing, threshold, minLoadingTime, onRefresh]);

  return {
    ...state,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
