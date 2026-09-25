import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteScroll } from './useInfiniteScroll';

afterEach(() => vi.useRealTimers());

describe('useInfiniteScroll', () => {
  it('shows data that arrives after the initial loading delay has finished', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ data }) => useInfiniteScroll({ data, pageSize: 2, loadDelay: 100 }),
      { initialProps: { data: [] as number[] } },
    );

    act(() => vi.advanceTimersByTime(100));
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.items).toEqual([]);

    rerender({ data: [1, 2, 3] });

    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.visibleCount).toBe(2);
    expect(result.current.hasMore).toBe(true);
  });

  it('loads the next batch when requested', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useInfiniteScroll({ data: [1, 2, 3], pageSize: 2, loadDelay: 100 }),
    );

    act(() => vi.advanceTimersByTime(100));
    expect(result.current.items).toEqual([1, 2]);

    act(() => result.current.loadMore());
    expect(result.current.isLoadingMore).toBe(true);
    act(() => vi.advanceTimersByTime(100));

    expect(result.current.items).toEqual([1, 2, 3]);
    expect(result.current.visibleCount).toBe(3);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
  });
});
