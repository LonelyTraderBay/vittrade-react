import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * ══════════════════════════════════════════════════════════
 *  useRefresh — Shared mock-refresh logic for PullToRefresh
 * ══════════════════════════════════════════════════════════
 *  Returns a stable `refresh()` async callback and
 *  `isRefreshing` state. Pass `refresh` directly to
 *  <PullToRefresh onRefresh={refresh}>.
 *
 *  Options:
 *    delay     — simulated network delay in ms (default: 800)
 *    onStart   — called when refresh begins (e.g. setIsLoading(true))
 *    onEnd     — called when refresh ends   (e.g. setIsLoading(false))
 *
 *  Returns:
 *    refresh            — async callback for PullToRefresh
 *    isRefreshing       — true while refreshing
 *    refreshCount       — total number of refreshes in this session
 *    lastRefreshedAt    — Date of last refresh (null if never)
 *    lastRefreshedLabel — Vietnamese relative time string, auto-updates
 *
 *  Usage:
 *    const { refresh, isRefreshing, lastRefreshedLabel } = useRefresh();
 *    <PullToRefresh onRefresh={refresh}>...</PullToRefresh>
 */

interface UseRefreshOptions {
  /** Simulated network delay in ms (default: 800) */
  delay?: number;
  /** Called when refresh begins */
  onStart?: () => void;
  /** Called when refresh ends */
  onEnd?: () => void;
}

/** Format relative time in Vietnamese */
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'Vừa cập nhật';
  if (diffSec < 60) return `${diffSec} giây trước`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  return `${diffHour} giờ trước`;
}

export function useRefresh(options: UseRefreshOptions = {}) {
  const { delay = 800 } = options;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [lastRefreshedLabel, setLastRefreshedLabel] = useState('');

  // Stable refs for callbacks to avoid re-creating `refresh`
  const onStartRef = useRef(options.onStart);
  const onEndRef = useRef(options.onEnd);
  onStartRef.current = options.onStart;
  onEndRef.current = options.onEnd;

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    onStartRef.current?.();
    await new Promise(r => setTimeout(r, delay));
    onEndRef.current?.();
    setIsRefreshing(false);
    setRefreshCount(c => c + 1);
    setLastRefreshedAt(new Date());
  }, [delay]);

  // Auto-update label every 30s
  useEffect(() => {
    if (!lastRefreshedAt) return;
    const update = () => setLastRefreshedLabel(formatRelativeTime(lastRefreshedAt));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [lastRefreshedAt]);

  return { refresh, isRefreshing, refreshCount, lastRefreshedAt, lastRefreshedLabel };
}
