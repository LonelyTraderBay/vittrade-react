import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInfiniteScroll } from './useInfiniteScroll';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useInfiniteScroll', () => {
  it('ignores early, duplicate and exhausted loads and detaches its observer', () => {
    vi.useFakeTimers();
    const observers: {
      notify: IntersectionObserverCallback;
      observe: ReturnType<typeof vi.fn>;
      disconnect: ReturnType<typeof vi.fn>;
    }[] = [];
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
        constructor(notify: IntersectionObserverCallback) {
          observers.push({ notify, observe: this.observe, disconnect: this.disconnect });
        }
      },
    );
    const { result, unmount } = renderHook(() =>
      useInfiniteScroll({ data: [1, 2, 3, 4], pageSize: 2, loadDelay: 100 }),
    );
    act(() => result.current.loadMore());
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(100));
    const node = document.createElement('div');
    result.current.sentinelRef(node);
    expect(observers[0].observe).toHaveBeenCalledWith(node);
    const notify = (index: number, isIntersecting: boolean) =>
      observers[index].notify(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    act(() => notify(0, false));
    expect(result.current.isLoadingMore).toBe(false);
    act(() => {
      notify(0, true);
      notify(0, true);
    });
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.items).toEqual([1, 2, 3, 4]);
    result.current.sentinelRef(null);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    result.current.sentinelRef(node);
    act(() => notify(1, true));
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.isLoadingMore).toBe(false);
    unmount();
    expect(observers[1].disconnect).toHaveBeenCalledOnce();
  });

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

  it('cancels a pending batch when the filter resets', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ resetKey }) =>
        useInfiniteScroll({ data: [1, 2, 3, 4], pageSize: 2, loadDelay: 100, resetKey }),
      { initialProps: { resetKey: 'all' } },
    );
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.loadMore());
    act(() => vi.advanceTimersByTime(50));
    rerender({ resetKey: 'filtered' });
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.isInitialLoading).toBe(true);
    expect(result.current.items).toEqual([]);
    act(() => vi.advanceTimersByTime(50));
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it('releases a pending batch timer on unmount', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() =>
      useInfiniteScroll({ data: [1, 2, 3, 4], pageSize: 2, loadDelay: 100 }),
    );
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.loadMore());
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
