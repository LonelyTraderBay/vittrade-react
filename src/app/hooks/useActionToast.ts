import { useCallback } from 'react';
import { toast } from 'sonner';
import { useHaptic } from './useHaptic';

/**
 * ══════════════════════════════════════════════════════════
 *  useActionToast — Haptic + Toast feedback for user actions
 * ══════════════════════════════════════════════════════════
 *  DRY wrapper that combines haptic feedback with sonner toast.
 *
 *  Replaces the pattern:
 *    hapticLight();
 *    toast.success('Đã sao chép', { duration: 1500 });
 *
 *  Usage:
 *    const actionToast = useActionToast();
 *    actionToast.success('Đã sao chép địa chỉ');
 *    actionToast.error('Thao tác thất bại');
 *    actionToast.warning('Đã xóa quảng cáo');
 *    actionToast.info('Đã thêm vào yêu thích');
 */

type HapticType = 'light' | 'success' | 'medium' | 'selection' | 'error';

interface ToastOptions {
  /** Haptic feedback type (default: 'light') */
  haptic?: HapticType;
  /** Toast duration in ms (default: 1500 for success, 2000 for error) */
  duration?: number;
}

export function useActionToast() {
  const { hapticLight, hapticSuccess, hapticMedium, hapticSelection, hapticError } = useHaptic();

  const fireHaptic = useCallback((type: HapticType) => {
    switch (type) {
      case 'success': hapticSuccess(); break;
      case 'medium': hapticMedium(); break;
      case 'selection': hapticSelection(); break;
      case 'error': hapticError(); break;
      default: hapticLight(); break;
    }
  }, [hapticLight, hapticSuccess, hapticMedium, hapticSelection, hapticError]);

  const success = useCallback((message: string, options?: ToastOptions) => {
    fireHaptic(options?.haptic ?? 'light');
    toast.success(message, { duration: options?.duration ?? 1500 });
  }, [fireHaptic]);

  const error = useCallback((message: string, options?: ToastOptions) => {
    fireHaptic(options?.haptic ?? 'error');
    toast.error(message, { duration: options?.duration ?? 2000 });
  }, [fireHaptic]);

  const info = useCallback((message: string, options?: ToastOptions) => {
    fireHaptic(options?.haptic ?? 'selection');
    toast(message, { duration: options?.duration ?? 1500 });
  }, [fireHaptic]);

  const warning = useCallback((message: string, options?: ToastOptions) => {
    fireHaptic(options?.haptic ?? 'medium');
    toast.warning(message, { duration: options?.duration ?? 1800 });
  }, [fireHaptic]);

  return { success, error, info, warning };
}