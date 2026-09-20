/**
 * ══════════════════════════════════════════════════════════
 *  useActionToast Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for action toast hook (haptic + toast)
 *
 *  Run: npx vitest run src/app/__tests__/useActionToast.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActionToast } from '../hooks/useActionToast';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: Object.assign(
    vi.fn(),
    {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    }
  ),
}));

describe('useActionToast', () => {
  let vibrateSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

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

  describe('Return Value', () => {
    it('should return success function', () => {
      const { result } = renderHook(() => useActionToast());

      expect(typeof result.current.success).toBe('function');
    });

    it('should return error function', () => {
      const { result } = renderHook(() => useActionToast());

      expect(typeof result.current.error).toBe('function');
    });

    it('should return info function', () => {
      const { result } = renderHook(() => useActionToast());

      expect(typeof result.current.info).toBe('function');
    });

    it('should return warning function', () => {
      const { result } = renderHook(() => useActionToast());

      expect(typeof result.current.warning).toBe('function');
    });

    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useActionToast());

      const success1 = result.current.success;
      const error1 = result.current.error;

      rerender();

      const success2 = result.current.success;
      const error2 = result.current.error;

      expect(success2).toBe(success1);
      expect(error2).toBe(error1);
    });
  });

  describe('Success Toast', () => {
    it('should show success toast', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Đã sao chép');

      expect(toast.success).toHaveBeenCalledWith('Đã sao chép', {
        duration: 1500,
      });
    });

    it('should trigger light haptic by default', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Success message');

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should support custom haptic type', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Success message', { haptic: 'success' });

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Success message', { duration: 2000 });

      expect(toast.success).toHaveBeenCalledWith('Success message', {
        duration: 2000,
      });
    });

    it('should call haptic before toast', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Test');

      expect(vibrateSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Error Toast', () => {
    it('should show error toast', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Thao tác thất bại');

      expect(toast.error).toHaveBeenCalledWith('Thao tác thất bại', {
        duration: 2000,
      });
    });

    it('should trigger error haptic by default', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Error message');

      expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });

    it('should support custom haptic type', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Error message', { haptic: 'medium' });

      expect(vibrateSpy).toHaveBeenCalledWith(25);
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Error message', { duration: 3000 });

      expect(toast.error).toHaveBeenCalledWith('Error message', {
        duration: 3000,
      });
    });

    it('should use longer default duration than success', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Error');

      expect(toast.error).toHaveBeenCalledWith('Error', { duration: 2000 });
    });
  });

  describe('Info Toast', () => {
    it('should show info toast', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Đã thêm vào yêu thích');

      expect(toast).toHaveBeenCalledWith('Đã thêm vào yêu thích', {
        duration: 1500,
      });
    });

    it('should trigger selection haptic by default', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Info message');

      expect(vibrateSpy).toHaveBeenCalledWith(5);
    });

    it('should support custom haptic type', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Info message', { haptic: 'light' });

      expect(vibrateSpy).toHaveBeenCalledWith(10);
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Info message', { duration: 2500 });

      expect(toast).toHaveBeenCalledWith('Info message', { duration: 2500 });
    });
  });

  describe('Warning Toast', () => {
    it('should show warning toast', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Đã xóa quảng cáo');

      expect(toast.warning).toHaveBeenCalledWith('Đã xóa quảng cáo', {
        duration: 1800,
      });
    });

    it('should trigger medium haptic by default', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Warning message');

      expect(vibrateSpy).toHaveBeenCalledWith(25);
    });

    it('should support custom haptic type', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Warning message', { haptic: 'warning' });

      expect(vibrateSpy).toHaveBeenCalledWith([30, 50, 30]);
    });

    it('should support custom duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Warning message', { duration: 2200 });

      expect(toast.warning).toHaveBeenCalledWith('Warning message', {
        duration: 2200,
      });
    });
  });

  describe('Default Durations', () => {
    it('should use 1500ms for success', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Test');

      expect(toast.success).toHaveBeenCalledWith('Test', { duration: 1500 });
    });

    it('should use 2000ms for error', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Test');

      expect(toast.error).toHaveBeenCalledWith('Test', { duration: 2000 });
    });

    it('should use 1500ms for info', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Test');

      expect(toast).toHaveBeenCalledWith('Test', { duration: 1500 });
    });

    it('should use 1800ms for warning', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Test');

      expect(toast.warning).toHaveBeenCalledWith('Test', { duration: 1800 });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support copy to clipboard feedback', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Đã sao chép địa chỉ');

      expect(vibrateSpy).toHaveBeenCalledWith(10);
      expect(toast.success).toHaveBeenCalledWith('Đã sao chép địa chỉ', {
        duration: 1500,
      });
    });

    it('should support form validation error', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Vui lòng nhập số điện thoại');

      expect(vibrateSpy).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
      expect(toast.error).toHaveBeenCalledWith('Vui lòng nhập số điện thoại', {
        duration: 2000,
      });
    });

    it('should support favorite toggle', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Đã thêm vào yêu thích');

      expect(vibrateSpy).toHaveBeenCalledWith(5);
      expect(toast).toHaveBeenCalledWith('Đã thêm vào yêu thích', {
        duration: 1500,
      });
    });

    it('should support delete confirmation', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Đã xóa quảng cáo');

      expect(vibrateSpy).toHaveBeenCalledWith(25);
      expect(toast.warning).toHaveBeenCalledWith('Đã xóa quảng cáo', {
        duration: 1800,
      });
    });

    it('should support order submission success', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Đặt lệnh thành công', { haptic: 'success' });

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Haptic Options', () => {
    it('should support all haptic types for success', () => {
      const { result } = renderHook(() => useActionToast());

      const hapticTypes: Array<'light' | 'success' | 'medium' | 'selection' | 'error'> = [
        'light',
        'success',
        'medium',
        'selection',
        'error',
      ];

      hapticTypes.forEach((haptic) => {
        result.current.success('Test', { haptic });
        expect(vibrateSpy).toHaveBeenCalled();
      });
    });

    it('should support all haptic types for error', () => {
      const { result } = renderHook(() => useActionToast());

      const hapticTypes: Array<'light' | 'success' | 'medium' | 'selection' | 'error'> = [
        'light',
        'success',
        'medium',
        'selection',
        'error',
      ];

      hapticTypes.forEach((haptic) => {
        result.current.error('Test', { haptic });
        expect(vibrateSpy).toHaveBeenCalled();
      });
    });

    it('should support all haptic types for info', () => {
      const { result } = renderHook(() => useActionToast());

      const hapticTypes: Array<'light' | 'success' | 'medium' | 'selection' | 'error'> = [
        'light',
        'success',
        'medium',
        'selection',
        'error',
      ];

      hapticTypes.forEach((haptic) => {
        result.current.info('Test', { haptic });
        expect(vibrateSpy).toHaveBeenCalled();
      });
    });

    it('should support all haptic types for warning', () => {
      const { result } = renderHook(() => useActionToast());

      const hapticTypes: Array<'light' | 'success' | 'medium' | 'selection' | 'error'> = [
        'light',
        'success',
        'medium',
        'selection',
        'error',
      ];

      hapticTypes.forEach((haptic) => {
        result.current.warning('Test', { haptic });
        expect(vibrateSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Multiple Calls', () => {
    it('should handle sequential toast calls', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('First');
      result.current.error('Second');
      result.current.info('Third');

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid toast calls', () => {
      const { result } = renderHook(() => useActionToast());

      for (let i = 0; i < 10; i++) {
        result.current.success(`Message ${i}`);
      }

      expect(toast.success).toHaveBeenCalledTimes(10);
      expect(vibrateSpy).toHaveBeenCalledTimes(10);
    });

    it('should handle mixed toast types', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Success');
      result.current.error('Error');
      result.current.warning('Warning');
      result.current.info('Info');

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const { result } = renderHook(() => useActionToast());

      expect(() => {
        result.current.success('');
      }).not.toThrow();

      expect(toast.success).toHaveBeenCalledWith('', { duration: 1500 });
    });

    it('should handle very long message', () => {
      const { result } = renderHook(() => useActionToast());

      const longMessage = 'A'.repeat(1000);

      result.current.success(longMessage);

      expect(toast.success).toHaveBeenCalledWith(longMessage, {
        duration: 1500,
      });
    });

    it('should handle zero duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Test', { duration: 0 });

      expect(toast.success).toHaveBeenCalledWith('Test', { duration: 0 });
    });

    it('should handle very long duration', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Test', { duration: 10000 });

      expect(toast.success).toHaveBeenCalledWith('Test', { duration: 10000 });
    });

    it('should work when vibrate API is not available', () => {
      Object.defineProperty(navigator, 'vibrate', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const { result } = renderHook(() => useActionToast());

      expect(() => {
        result.current.success('Test');
      }).not.toThrow();

      expect(toast.success).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency calls', () => {
      const { result } = renderHook(() => useActionToast());

      for (let i = 0; i < 100; i++) {
        result.current.success('Test');
      }

      expect(toast.success).toHaveBeenCalledTimes(100);
      expect(vibrateSpy).toHaveBeenCalledTimes(100);
    });

    it('should maintain stable references across rerenders', () => {
      const { result, rerender } = renderHook(() => useActionToast());

      const success1 = result.current.success;
      const error1 = result.current.error;
      const info1 = result.current.info;
      const warning1 = result.current.warning;

      rerender();
      rerender();
      rerender();

      expect(result.current.success).toBe(success1);
      expect(result.current.error).toBe(error1);
      expect(result.current.info).toBe(info1);
      expect(result.current.warning).toBe(warning1);
    });
  });

  describe('Integration', () => {
    it('should integrate haptic and toast correctly', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Integration test');

      // Both haptic and toast should be called
      expect(vibrateSpy).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalled();
    });

    it('should pass correct parameters to toast', () => {
      const { result } = renderHook(() => useActionToast());

      const message = 'Test message';
      const duration = 3000;

      result.current.success(message, { duration });

      expect(toast.success).toHaveBeenCalledWith(message, { duration });
    });

    it('should trigger correct haptic pattern', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Test', { haptic: 'success' });

      expect(vibrateSpy).toHaveBeenCalledWith([15, 50, 15]);
    });
  });

  describe('Vietnamese Messages', () => {
    it('should support Vietnamese success messages', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.success('Đã sao chép địa chỉ');

      expect(toast.success).toHaveBeenCalledWith('Đã sao chép địa chỉ', {
        duration: 1500,
      });
    });

    it('should support Vietnamese error messages', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.error('Vui lòng nhập đầy đủ thông tin');

      expect(toast.error).toHaveBeenCalledWith(
        'Vui lòng nhập đầy đủ thông tin',
        { duration: 2000 }
      );
    });

    it('should support Vietnamese warning messages', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.warning('Đã xóa quảng cáo');

      expect(toast.warning).toHaveBeenCalledWith('Đã xóa quảng cáo', {
        duration: 1800,
      });
    });

    it('should support Vietnamese info messages', () => {
      const { result } = renderHook(() => useActionToast());

      result.current.info('Đã thêm vào yêu thích');

      expect(toast).toHaveBeenCalledWith('Đã thêm vào yêu thích', {
        duration: 1500,
      });
    });
  });
});
