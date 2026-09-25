import { useEffect } from 'react';

/**
 * useScrollLock — Locks the app's scroll container ([data-pull-scroll])
 * AND document.body when any overlay/bottom-sheet/modal is open.
 *
 * Features:
 * - Global counter → nested sheets work correctly
 * - Saves/restores scroll position (body fixed trick)
 *
 * @param isLocked - true when a modal/bottom-sheet is visible
 */

let scrollLockCount = 0;
let savedScrollY = 0;

function applyLock() {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    savedScrollY = window.scrollY;
    const scrollEl = document.querySelector('[data-pull-scroll]') as HTMLElement | null;

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${savedScrollY}px`;

    if (scrollEl) {
      scrollEl.style.overflowY = 'hidden';
      scrollEl.style.touchAction = 'none';
    }
  }
}

function releaseLock() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    const scrollEl = document.querySelector('[data-pull-scroll]') as HTMLElement | null;

    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);

    if (scrollEl) {
      scrollEl.style.overflowY = '';
      scrollEl.style.touchAction = '';
    }
  }
}

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      applyLock();
      return () => releaseLock();
    }
  }, [isLocked]);
}
