/**
 * Enterprise Fintech — Haptic Feedback Utility
 * Sử dụng Vibration API cho mobile devices
 * Fallback silently trên desktop/browsers không hỗ trợ
 */

import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 15], // double tap — order thành công
  error: [50, 30, 50, 30, 50], // triple pulse — lỗi validation
  warning: [30, 50, 30], // alert feel
  selection: 5, // tab switch, toggle
};

function vibrate(pattern: number | number[]) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Silently fail — desktop/restricted browsers
  }
}

export function useHaptic() {
  // Memoized so consumers get stable identities across renders
  // (haptic has no reactive dependencies — patterns are module constants).
  const haptic = useCallback((type: HapticPattern = 'light') => {
    vibrate(PATTERNS[type]);
  }, []);

  const hapticLight = useCallback(() => haptic('light'), [haptic]);
  const hapticMedium = useCallback(() => haptic('medium'), [haptic]);
  const hapticHeavy = useCallback(() => haptic('heavy'), [haptic]);
  const hapticSuccess = useCallback(() => haptic('success'), [haptic]);
  const hapticError = useCallback(() => haptic('error'), [haptic]);
  const hapticWarning = useCallback(() => haptic('warning'), [haptic]);
  const hapticSelection = useCallback(() => haptic('selection'), [haptic]);

  return {
    haptic,
    hapticLight,
    hapticMedium,
    hapticHeavy,
    hapticSuccess,
    hapticError,
    hapticWarning,
    hapticSelection,
  };
}
