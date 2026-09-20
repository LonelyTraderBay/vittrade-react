import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLoadingState } from './useLoadingState';

/**
 * ══════════════════════════════════════════════════════════
 *  useLoadingState Hook Tests
 * ══════════════════════════════════════════════════════════
 *  Tests the loading state management hook
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

    it('should set isLoading to false after default delay (500ms)', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      expect(result.current.isLoading).toBe(true);
      
      vi.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should respect custom initialDelay', async () => {
      const { result } = renderHook(() => 
        useLoadingState({ initialDelay: 1000 })
      );
      
      expect(result.current.isLoading).toBe(true);
      
      vi.advanceTimersByTime(500);
      expect(result.current.isLoading).toBe(true);
      
      vi.advanceTimersByTime(500);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide refresh function', () => {
      const { result } = renderHook(() => useLoadingState());
      expect(typeof result.current.refresh).toBe('function');
    });

    it('should set isLoading to true when refresh is called', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Wait for initial load to complete
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Trigger refresh
      result.current.refresh();
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should set isLoading to false after refresh delay', async () => {
      const { result } = renderHook(() => 
        useLoadingState({ refreshDelay: 800 })
      );
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Trigger refresh
      result.current.refresh();
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      // Wait for refresh to complete
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should track refresh count', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Initial count should be 0
      expect(result.current.refreshCount).toBe(0);
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // First refresh
      result.current.refresh();
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.refreshCount).toBe(1);
      });
      
      // Second refresh
      result.current.refresh();
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.refreshCount).toBe(2);
      });
    });
  });

  describe('Load Only Mode', () => {
    it('should not trigger loading state on refresh when loadOnly is true', async () => {
      const { result } = renderHook(() => 
        useLoadingState({ loadOnly: true })
      );
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Trigger refresh - should NOT set isLoading to true in loadOnly mode
      result.current.refresh();
      
      // isLoading should remain false
      expect(result.current.isLoading).toBe(false);
    });

    it('should still track refresh count in loadOnly mode', async () => {
      const { result } = renderHook(() => 
        useLoadingState({ loadOnly: true })
      );
      
      expect(result.current.refreshCount).toBe(0);
      
      result.current.refresh();
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.refreshCount).toBe(1);
      });
    });
  });

  describe('Last Refreshed Timestamp', () => {
    it('should provide lastRefreshedAt after refresh', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Initially null
      expect(result.current.lastRefreshedAt).toBeNull();
      
      // Trigger refresh
      const beforeRefresh = Date.now();
      result.current.refresh();
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.lastRefreshedAt).not.toBeNull();
        expect(result.current.lastRefreshedAt).toBeGreaterThanOrEqual(beforeRefresh);
      });
    });

    it('should provide formatted lastRefreshedLabel', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Trigger refresh
      result.current.refresh();
      vi.advanceTimersByTime(800);
      
      await waitFor(() => {
        expect(result.current.lastRefreshedLabel).toBeTruthy();
        expect(typeof result.current.lastRefreshedLabel).toBe('string');
      });
    });
  });

  describe('SetLoading Function', () => {
    it('should provide setIsLoading function', () => {
      const { result } = renderHook(() => useLoadingState());
      expect(typeof result.current.setIsLoading).toBe('function');
    });

    it('should allow manual control of loading state', async () => {
      const { result } = renderHook(() => useLoadingState());
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Manually set loading to true
      result.current.setIsLoading(true);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      // Manually set loading to false
      result.current.setIsLoading(false);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
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
      const { result } = renderHook(() => 
        useLoadingState({ refreshDelay: 1500 })
      );
      
      // Wait for initial load
      vi.advanceTimersByTime(500);
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Trigger refresh
      result.current.refresh();
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
      
      // Wait partial delay - should still be loading
      vi.advanceTimersByTime(800);
      expect(result.current.isLoading).toBe(true);
      
      // Wait remaining delay - should finish
      vi.advanceTimersByTime(700);
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
