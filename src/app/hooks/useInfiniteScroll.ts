import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  /** Full data array */
  data: T[];
  /** Items per page/batch */
  pageSize?: number;
  /** Simulated loading delay (ms) — 0 for instant */
  loadDelay?: number;
  /** Pixel threshold from bottom to trigger load more */
  threshold?: number;
  /** External key to force reset (e.g. filter state stringified) */
  resetKey?: string;
}

interface UseInfiniteScrollResult<T> {
  /** Currently visible items */
  items: T[];
  /** Is loading more items */
  isLoadingMore: boolean;
  /** Is doing initial load */
  isInitialLoading: boolean;
  /** Has more items to load */
  hasMore: boolean;
  /** Total items count */
  totalCount: number;
  /** Visible items count */
  visibleCount: number;
  /** Sentinel ref — attach to a div at bottom of list */
  sentinelRef: React.RefCallback<HTMLDivElement>;
  /** Manual load more trigger */
  loadMore: () => void;
}

/**
 * Enterprise Fintech — Infinite Scroll Hook
 * Intersection Observer based — no scroll event listeners
 * Auto-resets when `resetKey` changes
 */
export function useInfiniteScroll<T>({
  data,
  pageSize = 10,
  loadDelay = 400,
  threshold = 100,
  resetKey = '',
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [visibleCount, setVisibleCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);
  const dataLengthRef = useRef(data.length);
  dataLengthRef.current = data.length;

  const totalCount = data.length;
  const hasMore = visibleCount < totalCount;

  // Reset & initial load whenever resetKey or data identity changes significantly
  useEffect(() => {
    setIsInitialLoading(true);
    setIsLoadingMore(false);
    setVisibleCount(0);
    loadingRef.current = false;

    const timer = setTimeout(() => {
      setVisibleCount(Math.min(pageSize, dataLengthRef.current));
      setIsInitialLoading(false);
    }, loadDelay);

    return () => clearTimeout(timer);
  }, [resetKey, pageSize, loadDelay]);

  // Load more function
  const loadMore = useCallback(() => {
    if (loadingRef.current || isInitialLoading) return;
    // Check hasMore using ref for latest data length
    if (visibleCount >= dataLengthRef.current) return;

    loadingRef.current = true;
    setIsLoadingMore(true);

    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + pageSize, dataLengthRef.current));
      setIsLoadingMore(false);
      loadingRef.current = false;
    }, loadDelay);
  }, [isInitialLoading, visibleCount, pageSize, loadDelay]);

  // Intersection Observer setup
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            loadMore();
          }
        },
        {
          rootMargin: `0px 0px ${threshold}px 0px`,
          threshold: 0,
        }
      );

      observerRef.current.observe(node);
    },
    [loadMore, threshold]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const items = data.slice(0, visibleCount);

  return {
    items,
    isLoadingMore,
    isInitialLoading,
    hasMore,
    totalCount,
    visibleCount,
    sentinelRef,
    loadMore,
  };
}
