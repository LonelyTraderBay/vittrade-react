/**
 * ══════════════════════════════════════════════════════════
 *  useScrollLock Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for scroll lock hook
 *
 *  Run: npx vitest run src/app/__tests__/useScrollLock.test.ts
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollLock } from '../hooks/useScrollLock';

describe('useScrollLock', () => {
  let scrollElement: HTMLDivElement;

  beforeEach(() => {
    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';

    // Create scroll element
    scrollElement = document.createElement('div');
    scrollElement.setAttribute('data-pull-scroll', '');
    document.body.appendChild(scrollElement);

    // Reset scroll position
    window.scrollTo(0, 0);
  });

  afterEach(() => {
    // Cleanup
    if (scrollElement && scrollElement.parentNode) {
      scrollElement.parentNode.removeChild(scrollElement);
    }

    // Reset body styles
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
  });

  describe('Basic Locking', () => {
    it('should lock scroll when isLocked is true', () => {
      renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
    });

    it('should not lock scroll when isLocked is false', () => {
      renderHook(() => useScrollLock(false));

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.width).toBe('');
    });

    it('should unlock scroll when isLocked changes to false', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.width).toBe('');
    });

    it('should lock scroll when isLocked changes to true', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      expect(document.body.style.overflow).toBe('');

      rerender({ locked: true });

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
    });
  });

  describe('Scroll Element Locking', () => {
    it('should lock pull-scroll element when locked', () => {
      renderHook(() => useScrollLock(true));

      expect(scrollElement.style.overflowY).toBe('hidden');
      expect(scrollElement.style.touchAction).toBe('none');
    });

    it('should unlock pull-scroll element when unlocked', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(scrollElement.style.overflowY).toBe('hidden');

      rerender({ locked: false });

      expect(scrollElement.style.overflowY).toBe('');
      expect(scrollElement.style.touchAction).toBe('');
    });

    it('should work without pull-scroll element', () => {
      scrollElement.remove();

      expect(() => {
        renderHook(() => useScrollLock(true));
      }).not.toThrow();

      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Scroll Position Preservation', () => {
    it('should save and restore scroll position', () => {
      // Set initial scroll position
      window.scrollTo(0, 100);

      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      // Lock scroll
      rerender({ locked: true });

      expect(document.body.style.top).toBe('-100px');

      // Unlock scroll
      rerender({ locked: false });

      // Position should be restored (note: window.scrollTo is mocked in tests)
      expect(document.body.style.top).toBe('');
    });

    it('should handle zero scroll position', () => {
      window.scrollTo(0, 0);

      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.top).toBe('-0px');

      rerender({ locked: false });

      expect(document.body.style.top).toBe('');
    });
  });

  describe('Nested Locks', () => {
    it('should support multiple concurrent locks', () => {
      const { unmount: unmount1 } = renderHook(() => useScrollLock(true));
      const { unmount: unmount2 } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      // Unmount first lock
      unmount1();

      // Should still be locked (second lock active)
      expect(document.body.style.overflow).toBe('hidden');

      // Unmount second lock
      unmount2();

      // Should now be unlocked
      expect(document.body.style.overflow).toBe('');
    });

    it('should handle three nested locks', () => {
      const { unmount: unmount1 } = renderHook(() => useScrollLock(true));
      const { unmount: unmount2 } = renderHook(() => useScrollLock(true));
      const { unmount: unmount3 } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      unmount1();
      expect(document.body.style.overflow).toBe('hidden');

      unmount2();
      expect(document.body.style.overflow).toBe('hidden');

      unmount3();
      expect(document.body.style.overflow).toBe('');
    });

    it('should unlock when last lock is removed', () => {
      const { unmount: unmount1 } = renderHook(() => useScrollLock(true));
      const { unmount: unmount2 } = renderHook(() => useScrollLock(true));
      const { unmount: unmount3 } = renderHook(() => useScrollLock(true));

      unmount2();
      unmount1();
      expect(document.body.style.overflow).toBe('hidden');

      unmount3();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Unmount Behavior', () => {
    it('should unlock on unmount', () => {
      const { unmount } = renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });

    it('should not throw on unmount when not locked', () => {
      const { unmount } = renderHook(() => useScrollLock(false));

      expect(() => unmount()).not.toThrow();
    });

    it('should restore scroll position on unmount', () => {
      window.scrollTo(0, 200);

      const { unmount } = renderHook(() => useScrollLock(true));

      expect(document.body.style.top).toBe('-200px');

      unmount();

      expect(document.body.style.top).toBe('');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support modal opening and closing', () => {
      const { rerender } = renderHook(
        ({ isOpen }) => useScrollLock(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Modal opens
      rerender({ isOpen: true });
      expect(document.body.style.overflow).toBe('hidden');

      // Modal closes
      rerender({ isOpen: false });
      expect(document.body.style.overflow).toBe('');
    });

    it('should support bottom sheet opening', () => {
      const { rerender } = renderHook(
        ({ isOpen }) => useScrollLock(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Sheet opens
      rerender({ isOpen: true });

      expect(document.body.style.overflow).toBe('hidden');
      expect(scrollElement.style.overflowY).toBe('hidden');
      expect(scrollElement.style.touchAction).toBe('none');
    });

    it('should support stacked modals', () => {
      // First modal opens
      const { rerender: rerender1 } = renderHook(
        ({ isOpen }) => useScrollLock(isOpen),
        { initialProps: { isOpen: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      // Second modal opens
      const { rerender: rerender2 } = renderHook(
        ({ isOpen }) => useScrollLock(isOpen),
        { initialProps: { isOpen: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      // Second modal closes
      rerender2({ isOpen: false });

      // Should still be locked (first modal open)
      expect(document.body.style.overflow).toBe('hidden');

      // First modal closes
      rerender1({ isOpen: false });

      // Now unlocked
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid lock/unlock cycles', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      for (let i = 0; i < 10; i++) {
        rerender({ locked: true });
        rerender({ locked: false });
      }

      expect(document.body.style.overflow).toBe('');
    });

    it('should handle multiple rerenders with same lock state', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      rerender({ locked: true });
      rerender({ locked: true });
      rerender({ locked: true });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should handle missing scroll element gracefully', () => {
      if (scrollElement.parentNode) {
        scrollElement.parentNode.removeChild(scrollElement);
      }

      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender({ locked: false });

      expect(document.body.style.overflow).toBe('');
    });

    it('should handle large scroll positions', () => {
      window.scrollTo(0, 10000);

      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      expect(document.body.style.top).toBe('-10000px');

      rerender({ locked: false });

      expect(document.body.style.top).toBe('');
    });
  });

  describe('Style Management', () => {
    it('should set all required body styles when locked', () => {
      renderHook(() => useScrollLock(true));

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
      expect(document.body.style.width).toBe('100%');
      expect(document.body.style.top).toMatch(/^-\d+px$/);
    });

    it('should clear all body styles when unlocked', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      rerender({ locked: false });

      expect(document.body.style.overflow).toBe('');
      expect(document.body.style.position).toBe('');
      expect(document.body.style.width).toBe('');
      expect(document.body.style.top).toBe('');
    });

    it('should set scroll element styles when locked', () => {
      renderHook(() => useScrollLock(true));

      expect(scrollElement.style.overflowY).toBe('hidden');
      expect(scrollElement.style.touchAction).toBe('none');
    });

    it('should clear scroll element styles when unlocked', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: true } }
      );

      rerender({ locked: false });

      expect(scrollElement.style.overflowY).toBe('');
      expect(scrollElement.style.touchAction).toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency lock state changes', () => {
      const { rerender } = renderHook(
        ({ locked }) => useScrollLock(locked),
        { initialProps: { locked: false } }
      );

      for (let i = 0; i < 100; i++) {
        rerender({ locked: i % 2 === 0 });
      }

      expect(document.body.style.overflow).toBe('');
    });

    it('should handle many concurrent locks', () => {
      const hooks = [];

      for (let i = 0; i < 10; i++) {
        hooks.push(renderHook(() => useScrollLock(true)));
      }

      expect(document.body.style.overflow).toBe('hidden');

      hooks.forEach((hook) => hook.unmount());

      expect(document.body.style.overflow).toBe('');
    });
  });
});
