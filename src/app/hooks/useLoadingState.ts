import { useState, useEffect } from 'react';
import { useRefresh } from './useRefresh';

/**
 * ══════════════════════════════════════════════════════════
 *  useLoadingState — Shared initial-load + refresh pattern
 * ══════════════════════════════════════════════════════════
 *  DRY hook that combines:
 *    1. `isLoading` state (true initially)
 *    2. `useEffect` timer to simulate initial load
 *    3. `useRefresh(onStart/onEnd)` wired to isLoading (optional)
 *
 *  Mode A — With PullToRefresh (default):
 *    const { isLoading, isRefreshing, refresh, lastRefreshedLabel, refreshCount } = useLoadingState();
 *    <PullToRefresh onRefresh={refresh} ...>
 *
 *  Mode B — Without PullToRefresh (loadOnly: true):
 *    const { isLoading } = useLoadingState({ loadOnly: true });
 *    {isLoading ? <Skeleton /> : <Content />}
 */

interface UseLoadingStateOptions {
  /** Simulated initial load delay in ms (default: 500) */
  initialDelay?: number;
  /** Simulated refresh network delay in ms (default: 800) */
  refreshDelay?: number;
  /** If true, skip useRefresh entirely — only provide isLoading + timer (default: false) */
  loadOnly?: boolean;
}

export function useLoadingState(options: UseLoadingStateOptions = {}) {
  const { initialDelay = 500, refreshDelay = 800, loadOnly = false } = options;
  const [isLoading, setIsLoading] = useState(true);

  const refreshResult = useRefresh({
    delay: refreshDelay,
    onStart: loadOnly ? undefined : () => setIsLoading(true),
    onEnd: loadOnly ? undefined : () => setIsLoading(false),
  });

  // Simulate initial data load
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), initialDelay);
    return () => clearTimeout(t);
  }, [initialDelay]);

  return {
    isLoading,
    setIsLoading,
    isRefreshing: refreshResult.isRefreshing,
    refresh: refreshResult.refresh,
    refreshCount: refreshResult.refreshCount,
    lastRefreshedAt: refreshResult.lastRefreshedAt,
    lastRefreshedLabel: refreshResult.lastRefreshedLabel,
  };
}
