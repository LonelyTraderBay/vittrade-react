import { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';

/**
 * ══════════════════════════════════════════════════════════
 *  useGoBack — Reliable back navigation with guard
 * ══════════════════════════════════════════════════════════
 *
 *  Wraps navigate(-1) with a 300ms debounce guard to prevent:
 *  - Double-tap firing navigate(-1) twice
 *  - Re-render during touch cycle causing click to fire twice
 *  - AnimatePresence exit animation allowing duplicate navigation
 *
 *  Usage:
 *    const goBack = useGoBack();
 *    <button onClick={goBack}>Back</button>
 */
export function useGoBack() {
  const navigate = useNavigate();
  const navigatingRef = useRef(false);

  return useCallback(() => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    setTimeout(() => { navigatingRef.current = false; }, 300);
    navigate(-1);
  }, [navigate]);
}
