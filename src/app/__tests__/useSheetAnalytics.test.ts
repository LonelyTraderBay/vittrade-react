/**
 * ══════════════════════════════════════════════════════════
 *  useSheetAnalytics Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for sheet analytics hook
 *
 *  Run: npx vitest run src/app/__tests__/useSheetAnalytics.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSheetAnalytics } from '../hooks/useSheetAnalytics';
import {
  trackSheetOpen,
  getSheetEventLog,
  clearSheetEventLog,
} from '../utils/sheetAnalytics';

describe('useSheetAnalytics', () => {
  beforeEach(() => {
    clearSheetEventLog();
  });

  afterEach(() => {
    clearSheetEventLog();
  });

  describe('Return Value', () => {
    it('should return onAfterOpen callback', () => {
      const { result } = renderHook(() => useSheetAnalytics('test-sheet'));

      expect(result.current).toHaveProperty('onAfterOpen');
      expect(typeof result.current.onAfterOpen).toBe('function');
    });

    it('should provide stable onAfterOpen reference', () => {
      const { result, rerender } = renderHook(() =>
        useSheetAnalytics('test-sheet')
      );

      const callback1 = result.current.onAfterOpen;

      rerender();

      const callback2 = result.current.onAfterOpen;

      expect(callback2).toBe(callback1);
    });
  });

  describe('Sheet Tracking', () => {
    it('should track sheet open when callback is called', () => {
      const { result } = renderHook(() => useSheetAnalytics('modal-confirm'));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].sheetName).toBe('modal-confirm');
    });

    it('should track multiple sheet opens', () => {
      const { result } = renderHook(() => useSheetAnalytics('modal-confirm'));

      result.current.onAfterOpen();
      result.current.onAfterOpen();
      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(3);
    });

    it('should track different sheet names', () => {
      const { result: result1 } = renderHook(() =>
        useSheetAnalytics('sheet-1')
      );
      const { result: result2 } = renderHook(() =>
        useSheetAnalytics('sheet-2')
      );

      result1.current.onAfterOpen();
      result2.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(2);
      expect(log[0].sheetName).toBe('sheet-1');
      expect(log[1].sheetName).toBe('sheet-2');
    });
  });

  describe('Event Data', () => {
    it('should record timestamp in event', () => {
      const { result } = renderHook(() => useSheetAnalytics('test-sheet'));

      const before = Date.now();
      result.current.onAfterOpen();
      const after = Date.now();

      const log = getSheetEventLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });

    it('should record ISO date in event', () => {
      const { result } = renderHook(() => useSheetAnalytics('test-sheet'));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].isoDate).toBeDefined();
      expect(typeof log[0].isoDate).toBe('string');
      expect(log[0].isoDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should record sheet name correctly', () => {
      const sheetName = 'p2p-order-confirm';
      const { result } = renderHook(() => useSheetAnalytics(sheetName));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe(sheetName);
    });
  });

  describe('Callback Stability', () => {
    it('should not recreate callback when sheetName is stable', () => {
      const { result, rerender } = renderHook(() =>
        useSheetAnalytics('stable-sheet')
      );

      const callback1 = result.current.onAfterOpen;

      rerender();
      rerender();
      rerender();

      const callback2 = result.current.onAfterOpen;

      expect(callback2).toBe(callback1);
    });

    it('should recreate callback when sheetName changes', () => {
      const { result, rerender } = renderHook(
        ({ name }) => useSheetAnalytics(name),
        { initialProps: { name: 'sheet-1' } }
      );

      const callback1 = result.current.onAfterOpen;

      rerender({ name: 'sheet-2' });

      const callback2 = result.current.onAfterOpen;

      expect(callback2).not.toBe(callback1);
    });

    it('should track correct sheet after name change', () => {
      const { result, rerender } = renderHook(
        ({ name }) => useSheetAnalytics(name),
        { initialProps: { name: 'sheet-1' } }
      );

      result.current.onAfterOpen();

      rerender({ name: 'sheet-2' });

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(2);
      expect(log[0].sheetName).toBe('sheet-1');
      expect(log[1].sheetName).toBe('sheet-2');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support BottomSheetV2 integration', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('p2p-payment-method')
      );

      // Simulate BottomSheetV2 opening
      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].sheetName).toBe('p2p-payment-method');
    });

    it('should track P2P chat image upload sheet', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('p2p-chat-image-upload')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('p2p-chat-image-upload');
    });

    it('should track wallet withdrawal confirmation', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('wallet-withdraw-confirm')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('wallet-withdraw-confirm');
    });

    it('should track trading order confirmation', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('trade-order-confirm')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('trade-order-confirm');
    });

    it('should support multiple sheets in same session', () => {
      const sheet1 = renderHook(() =>
        useSheetAnalytics('profile-settings')
      );
      const sheet2 = renderHook(() =>
        useSheetAnalytics('profile-security')
      );
      const sheet3 = renderHook(() => useSheetAnalytics('profile-kyc'));

      sheet1.result.current.onAfterOpen();
      sheet2.result.current.onAfterOpen();
      sheet3.result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(3);
      expect(log.map((e) => e.sheetName)).toEqual([
        'profile-settings',
        'profile-security',
        'profile-kyc',
      ]);
    });
  });

  describe('Event Log Management', () => {
    it('should append to existing log', () => {
      // Track directly via utility
      trackSheetOpen('manual-event');

      // Track via hook
      const { result } = renderHook(() => useSheetAnalytics('hook-event'));
      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(2);
      expect(log[0].sheetName).toBe('manual-event');
      expect(log[1].sheetName).toBe('hook-event');
    });

    it('should clear log correctly', () => {
      const { result } = renderHook(() => useSheetAnalytics('test-sheet'));

      result.current.onAfterOpen();
      expect(getSheetEventLog()).toHaveLength(1);

      clearSheetEventLog();
      expect(getSheetEventLog()).toHaveLength(0);
    });

    it('should track new events after clearing', () => {
      const { result } = renderHook(() => useSheetAnalytics('test-sheet'));

      result.current.onAfterOpen();
      clearSheetEventLog();

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(1);
    });
  });

  describe('Naming Conventions', () => {
    it('should support kebab-case names', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('my-custom-sheet')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('my-custom-sheet');
    });

    it('should support module-action-detail naming', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('p2p-order-pin-confirm')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('p2p-order-pin-confirm');
    });

    it('should support descriptive names', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('wallet-network-selector')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('wallet-network-selector');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sheet name', () => {
      const { result } = renderHook(() => useSheetAnalytics(''));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(1);
      expect(log[0].sheetName).toBe('');
    });

    it('should handle very long sheet names', () => {
      const longName = 'a'.repeat(1000);
      const { result } = renderHook(() => useSheetAnalytics(longName));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe(longName);
    });

    it('should handle special characters in name', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('sheet@#$%^&*()')
      );

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log[0].sheetName).toBe('sheet@#$%^&*()');
    });

    it('should handle rapid consecutive calls', () => {
      const { result } = renderHook(() => useSheetAnalytics('rapid-sheet'));

      for (let i = 0; i < 10; i++) {
        result.current.onAfterOpen();
      }

      const log = getSheetEventLog();
      expect(log).toHaveLength(10);
    });

    it('should handle unmount without calling callback', () => {
      const { unmount } = renderHook(() =>
        useSheetAnalytics('unmounted-sheet')
      );

      expect(() => unmount()).not.toThrow();

      const log = getSheetEventLog();
      expect(log).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency tracking', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('perf-test-sheet')
      );

      for (let i = 0; i < 100; i++) {
        result.current.onAfterOpen();
      }

      const log = getSheetEventLog();
      expect(log).toHaveLength(100);
    });

    it('should maintain correct timestamps in bulk tracking', () => {
      const { result } = renderHook(() =>
        useSheetAnalytics('timestamp-test')
      );

      const timestamps: number[] = [];

      for (let i = 0; i < 10; i++) {
        result.current.onAfterOpen();
        timestamps.push(Date.now());
      }

      const log = getSheetEventLog();

      for (let i = 0; i < log.length; i++) {
        expect(log[i].timestamp).toBeLessThanOrEqual(timestamps[i]);
      }
    });

    it('should handle many different sheet instances', () => {
      const hooks = [];

      for (let i = 0; i < 20; i++) {
        hooks.push(renderHook(() => useSheetAnalytics(`sheet-${i}`)));
      }

      hooks.forEach((hook, i) => {
        hook.result.current.onAfterOpen();
      });

      const log = getSheetEventLog();
      expect(log).toHaveLength(20);
    });
  });

  describe('Integration with Analytics Utility', () => {
    it('should use trackSheetOpen utility correctly', () => {
      const { result } = renderHook(() => useSheetAnalytics('integration-test'));

      result.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log).toHaveLength(1);

      const event = log[0];
      expect(event).toHaveProperty('sheetName');
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('isoDate');
    });

    it('should maintain event ordering with mixed tracking', () => {
      trackSheetOpen('manual-1');

      const { result: hook1 } = renderHook(() => useSheetAnalytics('hook-1'));
      hook1.current.onAfterOpen();

      trackSheetOpen('manual-2');

      const { result: hook2 } = renderHook(() => useSheetAnalytics('hook-2'));
      hook2.current.onAfterOpen();

      const log = getSheetEventLog();
      expect(log.map((e) => e.sheetName)).toEqual([
        'manual-1',
        'hook-1',
        'manual-2',
        'hook-2',
      ]);
    });
  });
});
