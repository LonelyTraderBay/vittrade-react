import { act, renderHook } from '@testing-library/react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnlineStatus } from './useOnlineStatus';
import { usePullToRefresh } from './usePullToRefresh';
import { useScrollPosition } from './useScrollPosition';

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useOnlineStatus', () => {
  it('has a safe server-rendered fallback without browser globals', () => {
    function StatusProbe() {
      const { isOnline } = useOnlineStatus();
      return <output>{isOnline ? 'online' : 'offline'}</output>;
    }
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('navigator', undefined);
    try {
      expect(renderToString(<StatusProbe />)).toBe('<output>online</output>');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not restart recovery for duplicate online events', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOnlineStatus());
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current.isReconnecting).toBe(false);
    act(() => window.dispatchEvent(new Event('offline')));
    act(() => window.dispatchEvent(new Event('online')));
    act(() => vi.advanceTimersByTime(1000));
    act(() => window.dispatchEvent(new Event('online')));
    expect(vi.getTimerCount()).toBe(1);
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.isReconnecting).toBe(false);
  });

  it('tracks browser offline and reconnect events for three seconds', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOnlineStatus());

    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current.isOnline).toBe(false);
    expect(result.current.isReconnecting).toBe(false);

    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isReconnecting).toBe(true);

    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.isReconnecting).toBe(false);
  });

  it('supports demo toggles and clears the reconnect timer on unmount', () => {
    vi.useFakeTimers();
    const { result, unmount } = renderHook(() => useOnlineStatus());

    act(() => {
      result.current.simulateOffline();
      result.current.simulateOnline();
    });
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isReconnecting).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('starts the reconnect window from the latest recovery and cancels it while offline', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useOnlineStatus());
    act(() => window.dispatchEvent(new Event('offline')));
    act(() => window.dispatchEvent(new Event('online')));
    act(() => vi.advanceTimersByTime(1000));
    act(() => window.dispatchEvent(new Event('offline')));
    expect(result.current.isReconnecting).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    act(() => window.dispatchEvent(new Event('online')));
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.isReconnecting).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.isReconnecting).toBe(false);
  });

  it('recognizes recovery when mounted while the browser is offline', () => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(false);
    act(() => window.dispatchEvent(new Event('online')));
    expect(result.current.isReconnecting).toBe(true);
  });
});

describe('useScrollPosition', () => {
  it('coalesces queued frames and recovers when the element disappears before the frame', () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
      frames.push(callback),
    );
    const element = document.createElement('div');
    const ref: { current: HTMLElement | null } = { current: element };
    const { result } = renderHook(() => useScrollPosition(ref));
    act(() => {
      element.dispatchEvent(new Event('scroll'));
      element.dispatchEvent(new Event('scroll'));
    });
    expect(frames).toHaveLength(1);
    ref.current = null;
    act(() => frames.shift()!(0));
    expect(result.current.scrollY).toBe(0);
    act(() => result.current.scrollToTop());
    ref.current = element;
    element.scrollTop = 25;
    act(() => element.dispatchEvent(new Event('scroll')));
    expect(frames).toHaveLength(1);
    act(() => frames.shift()!(0));
    expect(result.current.scrollY).toBe(25);
  });

  it('keeps its initial state when no element ref is available', () => {
    const { result } = renderHook(() => useScrollPosition());
    act(() => result.current.scrollToTop());
    expect(result.current).toMatchObject({ scrollY: 0, isAtTop: true, showScrollTop: false });
  });

  it('tracks direction, edges, and the scroll-to-top threshold', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    const element = document.createElement('div');
    Object.defineProperties(element, {
      scrollTop: { configurable: true, writable: true, value: 0 },
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 400 },
    });
    const ref = { current: element };
    const { result, unmount } = renderHook(() => useScrollPosition(ref));

    element.scrollTop = 400;
    act(() => element.dispatchEvent(new Event('scroll')));
    expect(result.current).toMatchObject({
      scrollY: 400,
      isScrollingDown: true,
      isAtTop: false,
      isAtBottom: false,
      showScrollTop: true,
    });

    element.scrollTop = 995;
    act(() => element.dispatchEvent(new Event('scroll')));
    expect(result.current.isAtBottom).toBe(true);

    element.scrollTop = 0;
    act(() => element.dispatchEvent(new Event('scroll')));
    expect(result.current).toMatchObject({
      isScrollingDown: false,
      isAtTop: true,
      isAtBottom: false,
      showScrollTop: false,
    });
    unmount();
  });

  it('scrolls its element smoothly to the top', () => {
    const element = document.createElement('div');
    element.scrollTo = vi.fn();
    const { result } = renderHook(() => useScrollPosition({ current: element }));

    act(() => result.current.scrollToTop());
    expect(element.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('reads the current reduced-motion preference for each scroll action', () => {
    let reduce = true;
    const matchMedia = vi.fn(() => ({ matches: reduce }));
    vi.stubGlobal('matchMedia', matchMedia);
    const element = document.createElement('div');
    element.scrollTo = vi.fn();
    const { result } = renderHook(() => useScrollPosition({ current: element }));

    act(() => result.current.scrollToTop());
    expect(element.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    reduce = false;
    act(() => result.current.scrollToTop());
    expect(element.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
  });
});

describe('usePullToRefresh', () => {
  function touchEvent(clientY: number, scrollTop = 0) {
    return {
      currentTarget: {
        closest: () => ({ scrollTop }),
      },
      touches: [{ clientY }],
    } as unknown as ReactTouchEvent;
  }

  it('resets a visible pull when reversed or released below its threshold', async () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));
    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(150)));
    expect(result.current.isPulling).toBe(true);
    act(() => result.current.handlers.onTouchMove(touchEvent(80)));
    expect(result.current.isPulling).toBe(false);
    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(150)));
    await act(async () => result.current.handlers.onTouchEnd());
    expect(result.current).toMatchObject({
      pullDistance: 0,
      isPulling: false,
      isRefreshing: false,
    });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('keeps the minimum loading window and blocks another gesture while refreshing', async () => {
    vi.useFakeTimers();
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, minLoadingTime: 800 }));
    const start = touchEvent(100);
    start.currentTarget.closest = () => null;
    act(() => result.current.handlers.onTouchStart(start));
    act(() => result.current.handlers.onTouchMove(touchEvent(400)));
    let completion: Promise<void>;
    await act(async () => {
      completion = result.current.handlers.onTouchEnd();
    });
    expect(result.current.isRefreshing).toBe(true);
    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(500)));
    await act(async () => result.current.handlers.onTouchEnd());
    expect(onRefresh).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(799));
    expect(result.current.isRefreshing).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(1);
      await completion!;
    });
    expect(result.current).toMatchObject({
      isRefreshing: false,
      pullDistance: 0,
      isPulling: false,
    });
  });

  it('ignores scrolled containers and taps inside the ten-pixel dead zone', async () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    act(() => result.current.handlers.onTouchStart(touchEvent(100, 10)));
    act(() => result.current.handlers.onTouchMove(touchEvent(200, 10)));
    await act(async () => result.current.handlers.onTouchEnd());
    expect(result.current.isPulling).toBe(false);

    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(105)));
    await act(async () => result.current.handlers.onTouchEnd());
    expect(result.current).toMatchObject({ pullDistance: 0, isPulling: false, progress: 0 });
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('resists and caps a pull, then resets after a rejected refresh', async () => {
    const onRefresh = vi.fn().mockRejectedValue(new Error('temporary failure'));
    const { result } = renderHook(() =>
      usePullToRefresh({ onRefresh, threshold: 72, maxPull: 120, minLoadingTime: 0 }),
    );

    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(400)));
    expect(result.current).toMatchObject({ pullDistance: 120, isPulling: true, progress: 1 });

    await act(async () => result.current.handlers.onTouchEnd());
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({
      pullDistance: 0,
      isPulling: false,
      isRefreshing: false,
      progress: 0,
    });
  });

  it('cancels a pull when the gesture moves upward', () => {
    const { result } = renderHook(() => usePullToRefresh({ onRefresh: vi.fn() }));

    act(() => result.current.handlers.onTouchStart(touchEvent(100)));
    act(() => result.current.handlers.onTouchMove(touchEvent(80)));
    expect(result.current).toMatchObject({ pullDistance: 0, isPulling: false, progress: 0 });
  });
});
