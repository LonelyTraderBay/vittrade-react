/**
 * Enterprise Fintech — Haptic Feedback Utility
 * Sử dụng Vibration API cho mobile devices
 * Fallback silently trên desktop/browsers không hỗ trợ
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [15, 50, 15],     // double tap — order thành công
  error: [50, 30, 50, 30, 50], // triple pulse — lỗi validation
  warning: [30, 50, 30],     // alert feel
  selection: 5,              // tab switch, toggle
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
  const haptic = (type: HapticPattern = 'light') => {
    vibrate(PATTERNS[type]);
  };

  return {
    haptic,
    hapticLight: () => haptic('light'),
    hapticMedium: () => haptic('medium'),
    hapticHeavy: () => haptic('heavy'),
    hapticSuccess: () => haptic('success'),
    hapticError: () => haptic('error'),
    hapticWarning: () => haptic('warning'),
    hapticSelection: () => haptic('selection'),
  };
}
