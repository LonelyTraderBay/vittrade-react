import { useEffect, useState } from 'react';
import { useRefresh } from '@/shared/hooks/useRefresh';

interface UseLoadingStateOptions {
  initialDelay?: number;
  refreshDelay?: number;
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

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), initialDelay);
    return () => clearTimeout(timeout);
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
