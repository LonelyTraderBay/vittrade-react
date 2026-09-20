import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ══════════════════════════════════════════════════════════
 *  useSessionTimeout — Inactivity-based session lock
 * ══════════════════════════════════════════════════════════
 *
 *  Tracks user activity (touch, mouse, keyboard, scroll).
 *  After `timeout` ms of inactivity → triggers `onTimeout`.
 *  Shows warning `warningBefore` ms before actual timeout.
 *
 *  For prototype: configurable timeout (default 5 min).
 *  Production: should integrate with actual token refresh.
 *
 *  USAGE:
 *  ─────────────────────────────────────────────────────────
 *  const { isWarning, remainingSeconds, resetTimer } = useSessionTimeout({
 *    timeout: 5 * 60 * 1000,       // 5 min
 *    warningBefore: 60 * 1000,      // warn 60s before
 *    onTimeout: () => setShowSessionExpired(true),
 *    enabled: isAuthenticated,
 *  });
 */

interface UseSessionTimeoutOptions {
  /** Timeout duration in ms (default: 5 min) */
  timeout?: number;
  /** Show warning this many ms before timeout (default: 60s) */
  warningBefore?: number;
  /** Called when session times out */
  onTimeout?: () => void;
  /** Called when warning phase starts */
  onWarning?: () => void;
  /** Enable/disable (default: true) */
  enabled?: boolean;
}

interface SessionTimeoutState {
  /** Warning phase active (countdown visible) */
  isWarning: boolean;
  /** Seconds remaining until timeout (0 when not warning) */
  remainingSeconds: number;
  /** Whether session has timed out */
  isTimedOut: boolean;
  /** Reset the timer (e.g., after re-auth) */
  resetTimer: () => void;
  /** Manually extend session */
  extendSession: () => void;
}

const ACTIVITY_EVENTS = [
  'mousedown', 'mousemove', 'keydown', 'scroll',
  'touchstart', 'touchmove', 'click', 'wheel',
] as const;

const DEFAULT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const DEFAULT_WARNING = 60 * 1000;      // 60 seconds

export function useSessionTimeout({
  timeout = DEFAULT_TIMEOUT,
  warningBefore = DEFAULT_WARNING,
  onTimeout,
  onWarning,
  enabled = true,
}: UseSessionTimeoutOptions = {}): SessionTimeoutState {
  const [isWarning, setIsWarning] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  onTimeoutRef.current = onTimeout;
  onWarningRef.current = onWarning;

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    lastActivityRef.current = Date.now();
    setIsWarning(false);
    setRemainingSeconds(0);

    // Warning timer
    const warningDelay = Math.max(0, timeout - warningBefore);
    warningRef.current = setTimeout(() => {
      setIsWarning(true);
      onWarningRef.current?.();

      // Start countdown
      const warningStart = Date.now();
      const warningDuration = warningBefore / 1000;
      setRemainingSeconds(Math.ceil(warningDuration));

      countdownRef.current = setInterval(() => {
        const elapsed = (Date.now() - warningStart) / 1000;
        const remaining = Math.max(0, Math.ceil(warningDuration - elapsed));
        setRemainingSeconds(remaining);
        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 1000);
    }, warningDelay);

    // Actual timeout
    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      setIsTimedOut(true);
      setIsWarning(false);
      setRemainingSeconds(0);
      onTimeoutRef.current?.();
    }, timeout);
  }, [timeout, warningBefore, clearAllTimers]);

  const resetTimer = useCallback(() => {
    setIsTimedOut(false);
    setIsWarning(false);
    setRemainingSeconds(0);
    if (enabled) startTimers();
  }, [enabled, startTimers]);

  const extendSession = useCallback(() => {
    if (!isTimedOut) {
      startTimers();
    }
  }, [isTimedOut, startTimers]);

  // Activity listener — only reset if not in warning phase
  useEffect(() => {
    if (!enabled || isTimedOut) return;

    const handleActivity = () => {
      const now = Date.now();
      // Throttle: only reset if at least 5s since last reset
      if (now - lastActivityRef.current > 5000 && !isWarning) {
        startTimers();
      }
    };

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    startTimers();

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearAllTimers();
    };
  }, [enabled, isTimedOut, isWarning, startTimers, clearAllTimers]);

  return {
    isWarning,
    remainingSeconds,
    isTimedOut,
    resetTimer,
    extendSession,
  };
}
