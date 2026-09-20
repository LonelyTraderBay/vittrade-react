/**
 * ══════════════════════════════════════════════════════════
 *  useRefresh Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for pull-to-refresh hook
 *
 *  Run: npx vitest run src/app/__tests__/useRefresh.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRefresh } from '../hooks/useRefresh';

describe('useRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should have isRefreshing false initially', () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.isRefreshing).toBe(false);
    });

    it('should have refreshCount 0 initially', () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.refreshCount).toBe(0);
    });

    it('should have lastRefreshedAt null initially', () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.lastRefreshedAt).toBeNull();
    });

    it('should have empty lastRefreshedLabel initially', () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.lastRefreshedLabel).toBe('');
    });

    it('should provide refresh function', () => {
      const { result } = renderHook(() => useRefresh());

      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Refresh Function', () => {
    it('should set isRefreshing to true during refresh', async () => {
      const { result } = renderHook(() => useRefresh());

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(result.current.isRefreshing).toBe(false);
    });

    it('should increment refreshCount after refresh', async () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.refreshCount).toBe(0);

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(result.current.refreshCount).toBe(1);
    });

    it('should set lastRefreshedAt after refresh', async () => {
      const { result } = renderHook(() => useRefresh());

      expect(result.current.lastRefreshedAt).toBeNull();

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(result.current.lastRefreshedAt).toBeInstanceOf(Date);
    });

    it('should handle multiple refreshes', async () => {
      const { result } = renderHook(() => useRefresh());

      // First refresh
      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });
      expect(result.current.refreshCount).toBe(1);

      // Second refresh
      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });
      expect(result.current.refreshCount).toBe(2);

      // Third refresh
      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });
      expect(result.current.refreshCount).toBe(3);
    });
  });

  describe('Custom Delay', () => {
    it('should use default delay of 800ms', async () => {
      const { result } = renderHook(() => useRefresh());

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(799);
      });
      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should respect custom delay', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 1000 }));

      act(() => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(999);
      });
      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should support fast refresh with short delay', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 100 }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(100);
        await p;
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.refreshCount).toBe(1);
    });
  });

  describe('Callbacks', () => {
    it('should call onStart when refresh begins', async () => {
      const onStart = vi.fn();
      const { result } = renderHook(() => useRefresh({ onStart }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('should call onEnd when refresh completes', async () => {
      const onEnd = vi.fn();
      const { result } = renderHook(() => useRefresh({ onEnd }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(onEnd).toHaveBeenCalledTimes(1);
    });

    it('should call onStart before onEnd', async () => {
      const calls: string[] = [];
      const onStart = vi.fn(() => calls.push('start'));
      const onEnd = vi.fn(() => calls.push('end'));

      const { result } = renderHook(() => useRefresh({ onStart, onEnd }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(calls).toEqual(['start', 'end']);
    });

    it('should call callbacks multiple times for multiple refreshes', async () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const { result } = renderHook(() => useRefresh({ onStart, onEnd }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(onStart).toHaveBeenCalledTimes(2);
      expect(onEnd).toHaveBeenCalledTimes(2);
    });

    it('should work without callbacks', async () => {
      const { result } = renderHook(() => useRefresh());

      await expect(
        (async () => {
          await act(async () => {
            const p = result.current.refresh();
            await vi.advanceTimersByTimeAsync(800);
            await p;
          });
        })(),
      ).resolves.not.toThrow();
    });
  });

  describe('Relative Time Label', () => {
    it('should show "Vừa cập nhật" for recent refresh (< 10s)', async () => {
      vi.useRealTimers();
      const { result } = renderHook(() => useRefresh());

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.lastRefreshedLabel).toBe('Vừa cập nhật');
      });
    });

    it('should show seconds for 10-59 seconds ago', async () => {
      const { result } = renderHook(() => useRefresh());

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      expect(result.current.lastRefreshedLabel).toBe('Vừa cập nhật');

      // Advance 30 seconds: label should switch to a seconds-based string
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(result.current.lastRefreshedLabel).toBe('30 giây trước');
    });

    it('should update label automatically after 30 seconds', async () => {
      const { result } = renderHook(() => useRefresh());

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(800);
        await p;
      });

      const initialLabel = result.current.lastRefreshedLabel;
      expect(initialLabel).toBe('Vừa cập nhật');

      // Wait for auto-update interval (fires 30s after lastRefreshedAt)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(result.current.lastRefreshedLabel).toBe('30 giây trước');
    });
  });

  describe('Stability', () => {
    it('should provide stable refresh function reference', () => {
      const { result, rerender } = renderHook(() => useRefresh());

      const refresh1 = result.current.refresh;

      rerender();

      const refresh2 = result.current.refresh;

      expect(refresh2).toBe(refresh1);
    });

    it('should update refresh function when delay changes', () => {
      const { result, rerender } = renderHook(({ delay }) => useRefresh({ delay }), {
        initialProps: { delay: 800 },
      });

      const refresh1 = result.current.refresh;

      rerender({ delay: 1000 });

      const refresh2 = result.current.refresh;

      // Should be different reference when delay changes
      expect(refresh2).not.toBe(refresh1);
    });

    it('should not recreate refresh when callbacks change', () => {
      const { result, rerender } = renderHook(({ onStart }) => useRefresh({ onStart }), {
        initialProps: { onStart: vi.fn() },
      });

      const refresh1 = result.current.refresh;

      rerender({ onStart: vi.fn() });

      const refresh2 = result.current.refresh;

      // Should be same reference (callbacks use refs)
      expect(refresh2).toBe(refresh1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support typical pull-to-refresh flow', async () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const { result } = renderHook(() => useRefresh({ delay: 800, onStart, onEnd }));

      // User pulls to refresh
      await act(async () => {
        result.current.refresh();
      });

      expect(result.current.isRefreshing).toBe(true);
      expect(onStart).toHaveBeenCalled();

      // Wait for refresh to complete
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(onEnd).toHaveBeenCalled();
      expect(result.current.refreshCount).toBe(1);
    });

    it('should handle rapid refreshes', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 100 }));

      await act(async () => {
        result.current.refresh();
        await vi.advanceTimersByTimeAsync(100);

        result.current.refresh();
        await vi.advanceTimersByTimeAsync(100);

        result.current.refresh();
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.refreshCount).toBe(3);
    });

    it('should work with loading state management', async () => {
      let isLoading = false;

      const { result } = renderHook(() =>
        useRefresh({
          onStart: () => {
            isLoading = true;
          },
          onEnd: () => {
            isLoading = false;
          },
        }),
      );

      expect(isLoading).toBe(false);

      act(() => {
        result.current.refresh();
      });

      expect(isLoading).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });

      expect(isLoading).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 0 }));

      await act(async () => {
        const p = result.current.refresh();
        await vi.advanceTimersByTimeAsync(0);
        await p;
      });

      expect(result.current.isRefreshing).toBe(false);
      expect(result.current.refreshCount).toBe(1);
    });

    it('should handle very long delay', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 5000 }));

      act(() => {
        result.current.refresh();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(4999);
      });
      expect(result.current.isRefreshing).toBe(true);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should handle concurrent refresh calls', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 500 }));

      // Start multiple refreshes
      act(() => {
        result.current.refresh();
        result.current.refresh();
        result.current.refresh();
      });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(500);
      });

      // All should complete
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should cleanup interval on unmount', () => {
      vi.useRealTimers();
      const { unmount } = renderHook(() => useRefresh());

      // Should not throw or leak intervals
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency refreshes', async () => {
      const { result } = renderHook(() => useRefresh({ delay: 50 }));

      for (let i = 0; i < 20; i++) {
        await act(async () => {
          const p = result.current.refresh();
          await vi.advanceTimersByTimeAsync(50);
          await p;
        });
      }

      expect(result.current.refreshCount).toBe(20);
    });

    it('should maintain correct state across many refreshes', async () => {
      const onStart = vi.fn();
      const onEnd = vi.fn();
      const { result } = renderHook(() => useRefresh({ delay: 100, onStart, onEnd }));

      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        await act(async () => {
          const p = result.current.refresh();
          await vi.advanceTimersByTimeAsync(100);
          await p;
        });
      }

      expect(result.current.refreshCount).toBe(iterations);
      expect(onStart).toHaveBeenCalledTimes(iterations);
      expect(onEnd).toHaveBeenCalledTimes(iterations);
    });
  });
});
