/**
 * ══════════════════════════════════════════════════════════
 *  useHaptic Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for haptic feedback hook
 *
 *  Run: npx vitest run src/app/__tests__/useHaptic.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHaptic } from '../hooks/useHaptic';

describe('useHaptic', () => {
  let vibrateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock navigator.vibrate
    vibrateSpy = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      configurable: true,
      value: vibrateSpy,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Hook Return Value', () => {
    it('should return haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      expect(typeof result.current.haptic).toBe('function');
    });

    it('should return convenience functions', () => {
      const { result } = renderHook(() => useHaptic());

      expect(typeof result.current.hapticLight).toBe('function');
      expect(typeof result.current.hapticMedium).toBe('function');
      expect(typeof result.current.hapticHeavy).toBe('function');
      expect(typeof result.current.hapticSuccess).toBe('function');
      expect(typeof result.current.hapticError).toBe('function');
      expect(typeof result.current.hapticWarning).toBe('function');
      expect(typeof result.current.hapticSelection).toBe('function');
    });

    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useHaptic());

      const haptic1 = result.current.haptic;
      const hapticLight1 = result.current.hapticLight;

      rerender();

      const haptic2 = result.current.haptic;
      const hapticLight2 = result.current.hapticLight;

      expect(haptic2).toBe(haptic1);
      expect(hapticLight2).toBe(hapticLight1);
    });
  });

  describe('Light Haptic', () => {
    it('should trigger light haptic with correct pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticLight();

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should trigger light haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('light');

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should use light as default pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic();

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });
  });

  describe('Medium Haptic', () => {
    it('should trigger medium haptic with correct pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticMedium();

      expect(vibrateSpy).toHaveBeenCalledWith(25);
    });

    it('should trigger medium haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('medium');

      expect(vibrateSpy).toHaveBeenCalledWith(25);
    });
  });

  describe('Heavy Haptic', () => {
    it('should trigger heavy haptic with correct pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticHeavy();

      expect(vibrateSpy).toHaveBeenCalledWith(50);
    });

    it('should trigger heavy haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('heavy');

      expect(vibrateSpy).toHaveBeenCalledWith(50);
    });
  });

  describe('Success Haptic', () => {
    it('should trigger success haptic with double-tap pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticSuccess();

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
    });

    it('should trigger success haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('success');

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
    });
  });

  describe('Error Haptic', () => {
    it('should trigger error haptic with triple-pulse pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticError();

      expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });

    it('should trigger error haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('error');

      expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });
  });

  describe('Warning Haptic', () => {
    it('should trigger warning haptic with alert pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticWarning();

      expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 30]);
    });

    it('should trigger warning haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('warning');

      expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 30]);
    });
  });

  describe('Selection Haptic', () => {
    it('should trigger selection haptic with subtle pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticSelection();

      expect(vibrateSpy).toHaveBeenCalledWith(5);
    });

    it('should trigger selection haptic via generic haptic function', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.haptic('selection');

      expect(vibrateSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('Browser Compatibility', () => {
    it('should not throw when vibrate API is not available', () => {
      // Remove vibrate from navigator
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useHaptic());

      expect(() => {
        result.current.hapticLight();
        result.current.hapticMedium();
        result.current.hapticHeavy();
      }).not.toThrow();
    });

    it('should handle vibrate API errors silently', () => {
      const errorSpy = vi.fn(() => {
        throw new Error('Vibrate not supported');
      });

      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: errorSpy,
      });

      const { result } = renderHook(() => useHaptic());

      expect(() => {
        result.current.hapticLight();
      }).not.toThrow();
    });

    it('should work when vibrate returns false', () => {
      const falseSpy = vi.fn(() => false);

      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: falseSpy,
      });

      const { result } = renderHook(() => useHaptic());

      expect(() => {
        result.current.hapticLight();
      }).not.toThrow();

      expect(falseSpy).toHaveBeenCalled();
    });
  });

  describe('Multiple Calls', () => {
    it('should handle multiple haptic calls in sequence', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticLight();
      result.current.hapticMedium();
      result.current.hapticHeavy();

      expect(vibrateSpy).toHaveBeenCalledTimes(3);
      expect(vibrateSpy).toHaveBeenNthCalledWith(1, 10);
      expect(vibrateSpy).toHaveBeenNthCalledWith(2, 25);
      expect(vibrateSpy).toHaveBeenNthCalledWith(3, 50);
    });

    it('should handle rapid haptic calls', () => {
      const { result } = renderHook(() => useHaptic());

      for (let i = 0; i < 10; i++) {
        result.current.hapticSelection();
      }

      expect(vibrateSpy).toHaveBeenCalledTimes(10);
    });

    it('should handle all haptic types in one flow', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticLight();
      result.current.hapticMedium();
      result.current.hapticHeavy();
      result.current.hapticSuccess();
      result.current.hapticError();
      result.current.hapticWarning();
      result.current.hapticSelection();

      expect(vibrateSpy).toHaveBeenCalledTimes(7);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support button tap feedback', () => {
      const { result } = renderHook(() => useHaptic());

      // User taps button
      result.current.hapticLight();

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should support form submission success', () => {
      const { result } = renderHook(() => useHaptic());

      // Form submitted successfully
      result.current.hapticSuccess();

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
    });

    it('should support validation error feedback', () => {
      const { result } = renderHook(() => useHaptic());

      // Validation error occurred
      result.current.hapticError();

      expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });

    it('should support tab switching feedback', () => {
      const { result } = renderHook(() => useHaptic());

      // User switches tabs
      result.current.hapticSelection();

      expect(vibrateSpy).toHaveBeenCalledWith(5);
    });

    it('should support delete confirmation feedback', () => {
      const { result } = renderHook(() => useHaptic());

      // User confirms deletion
      result.current.hapticWarning();

      expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 30]);
    });

    it('should support drag and drop feedback', () => {
      const { result } = renderHook(() => useHaptic());

      // Item picked up
      result.current.hapticMedium();

      // Item dropped
      result.current.hapticLight();

      expect(vibrateSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Pattern Verification', () => {
    it('should use correct light pattern for subtle feedback', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticLight();

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should use correct medium pattern for moderate feedback', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticMedium();

      expect(vibrateSpy).toHaveBeenCalledWith(25);
    });

    it('should use correct heavy pattern for strong feedback', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticHeavy();

      expect(vibrateSpy).toHaveBeenCalledWith(50);
    });

    it('should use correct success pattern (double tap)', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticSuccess();

      const pattern = vibrateSpy.mock.calls[0][0];
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern).toHaveLength(3);
    });

    it('should use correct error pattern (triple pulse)', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticError();

      const pattern = vibrateSpy.mock.calls[0][0];
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern).toHaveLength(5);
    });

    it('should use correct warning pattern', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticWarning();

      const pattern = vibrateSpy.mock.calls[0][0];
      expect(Array.isArray(pattern)).toBe(true);
      expect(pattern).toHaveLength(3);
    });

    it('should use correct selection pattern (very subtle)', () => {
      const { result } = renderHook(() => useHaptic());

      result.current.hapticSelection();

      expect(vibrateSpy).toHaveBeenCalledWith(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle hook being unmounted during vibration', () => {
      const { result, unmount } = renderHook(() => useHaptic());

      result.current.hapticSuccess();

      expect(() => unmount()).not.toThrow();
    });

    it('should work after re-mounting hook', () => {
      const { result, unmount } = renderHook(() => useHaptic());

      result.current.hapticLight();
      expect(vibrateSpy).toHaveBeenCalledTimes(1);

      unmount();

      const { result: result2 } = renderHook(() => useHaptic());

      result2.current.hapticMedium();
      expect(vibrateSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle null navigator', () => {
      const originalNavigator = global.navigator;

      Object.defineProperty(global, 'navigator', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useHaptic());

      expect(() => {
        result.current.hapticLight();
      }).not.toThrow();

      Object.defineProperty(global, 'navigator', {
        writable: true,
        configurable: true,
        value: originalNavigator,
      });
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency haptic calls', () => {
      const { result } = renderHook(() => useHaptic());

      for (let i = 0; i < 100; i++) {
        result.current.hapticSelection();
      }

      expect(vibrateSpy).toHaveBeenCalledTimes(100);
    });

    it('should not create new function references on re-render', () => {
      const { result, rerender } = renderHook(() => useHaptic());

      const hapticLight1 = result.current.hapticLight;
      const hapticSuccess1 = result.current.hapticSuccess;

      rerender();

      const hapticLight2 = result.current.hapticLight;
      const hapticSuccess2 = result.current.hapticSuccess;

      expect(hapticLight2).toBe(hapticLight1);
      expect(hapticSuccess2).toBe(hapticSuccess1);
    });
  });
});
