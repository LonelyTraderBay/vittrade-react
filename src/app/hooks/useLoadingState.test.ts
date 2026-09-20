import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingState } from './useLoadingState';

/**
 * ══════════════════════════════════════════════════════════
 *  useLoadingState Hook Tests
 * ══════════════════════════════════════════════════════════
 *  Tests the loading state management hook
 *
 *  Fake timers are used throughout, so all timer advances and
 *  the state updates they trigger are wrapped in act() and
 *  asserted synchronously (waitFor would never poll under
 *  fake timers).
 */

describe('useLoadingState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading State', () => {
    it('should start with isLoading as true', () => {
      const { result } = renderHook(() => useLoadingState());
      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after default delay (500ms)', () => {
      const { result } = renderHook(() => useLoadingState());

      expect(result.current.isLoading).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should respect custom initialDelay', () => {
      const { result } = renderHook(() => useLoadingState({ initialDelay: 1000 }));

      expect(result.current.isLoading).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function', () => {
      const { result } = renderHook(() => useLoadingState());
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should set isLoading to true when refresh is called', () => {
      const { result } = renderHook(() => useLoadingState());

      // Wait for initial load to complete
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after refresh delay', async () => {
      const { result } = renderHook(() => useLoadingState({ refreshDelay: 800 }));

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });
      expect(result.current.isLoading).toBe(true);

      // Wait for refresh to complete
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should track refresh count', async () => {
      const { result } = renderHook(() => useLoadingState());

      // Initial count should be 0
      expect(result.current.refreshCount).toBe(0);

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // First refresh
      act(() => {
        result.current.refresh();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });
      expect(result.current.refreshCount).toBe(1);

      // Second refresh
      act(() => {
        result.current.refresh();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });
      expect(result.current.refreshCount).toBe(2);
    });
  });

  describe('Load Only Mode', () => {
    it('should not trigger loading state on refresh when loadOnly is true', () => {
      const { result } = renderHook(() => useLoadingState({ loadOnly: true }));

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Trigger refresh - should NOT set isLoading to true in loadOnly mode
      act(() => {
        result.current.refresh();
      });

      // isLoading should remain false
      expect(result.current.isLoading).toBe(false);
    });

    it('should still track refresh count in loadOnly mode', async () => {
      const { result } = renderHook(() => useLoadingState({ loadOnly: true }));

      expect(result.current.refreshCount).toBe(0);

      act(() => {
        result.current.refresh();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(result.current.refreshCount).toBe(1);
    });
  });

  describe('Last Refreshed Timestamp', () => {
    it('should provide lastRefreshedAt after refresh', async () => {
      const { result } = renderHook(() => useLoadingState());

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Initially null
      expect(result.current.lastRefreshedAt).toBeNull();

      // Trigger refresh
      const beforeRefresh = Date.now();
      act(() => {
        result.current.refresh();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(result.current.lastRefreshedAt).toBeInstanceOf(Date);
      const refreshedAtMs = result.current.lastRefreshedAt?.getTime() ?? Number.NaN;
      expect(refreshedAtMs).toBeGreaterThanOrEqual(beforeRefresh);
    });

    it('should provide formatted lastRefreshedLabel', async () => {
      const { result } = renderHook(() => useLoadingState());

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(typeof result.current.lastRefreshedLabel).toBe('string');
      expect(result.current.lastRefreshedLabel).toBeTruthy();
    });
  });

  describe('SetLoading Function', () => {
    it('should provide setIsLoading function', () => {
      const { result } = renderHook(() => useLoadingState());
      expect(typeof result.current.setIsLoading).toBe('function');
    });

    it('should allow manual control of loading state', () => {
      const { result } = renderHook(() => useLoadingState());

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Manually set loading to true
      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      // Manually set loading to false
      act(() => {
        result.current.setIsLoading(false);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const { unmount } = renderHook(() => useLoadingState());

      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      unmount();

      // Verify cleanup was called
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('Custom Delays', () => {
    it('should respect custom refreshDelay', async () => {
      const { result } = renderHook(() => useLoadingState({ refreshDelay: 1500 }));

      // Wait for initial load
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.isLoading).toBe(false);

      // Trigger refresh
      act(() => {
        result.current.refresh();
      });
      expect(result.current.isLoading).toBe(true);

      // Wait partial delay - should still be loading
      act(() => {
        vi.advanceTimersByTime(800);
      });
      expect(result.current.isLoading).toBe(true);

      // Wait remaining delay - should finish
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
      });
      expect(result.current.isLoading).toBe(false);
    });
  });
});
