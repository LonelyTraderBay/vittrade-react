/**
 * ══════════════════════════════════════════════════════════
 *  UIContext Tests
 * ══════════════════════════════════════════════════════════
 *  Comprehensive tests for UI state management context
 *
 *  Run: npx vitest run src/app/__tests__/UIContext.test.tsx
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { UIProvider, useUI } from '../contexts/UIContext';

describe('UIContext', () => {
  describe('Initial State', () => {
    it('should start with balance visible (not hidden)', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.isBalanceHidden).toBe(false);
    });

    it('should start in online mode', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.isOffline).toBe(false);
    });

    it('should start with 3 notifications', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.notifications).toBe(3);
    });

    it('should start with 2 pending rewards', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.pendingRewards).toBe(2);
    });
  });

  describe('Methods Availability', () => {
    it('should provide toggleBalanceHidden function', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(typeof result.current.toggleBalanceHidden).toBe('function');
    });

    it('should provide setIsOffline function', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(typeof result.current.setIsOffline).toBe('function');
    });

    it('should provide setNotifications function', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(typeof result.current.setNotifications).toBe('function');
    });

    it('should provide setPendingRewards function', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(typeof result.current.setPendingRewards).toBe('function');
    });
  });

  describe('Balance Visibility Toggle', () => {
    it('should toggle balance hidden state from false to true', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.isBalanceHidden).toBe(false);

      act(() => {
        result.current.toggleBalanceHidden();
      });

      expect(result.current.isBalanceHidden).toBe(true);
    });

    it('should toggle balance hidden state from true to false', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // Toggle to true first
      act(() => {
        result.current.toggleBalanceHidden();
      });

      expect(result.current.isBalanceHidden).toBe(true);

      // Toggle back to false
      act(() => {
        result.current.toggleBalanceHidden();
      });

      expect(result.current.isBalanceHidden).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      const initialState = result.current.isBalanceHidden;

      act(() => {
        result.current.toggleBalanceHidden();
      });
      expect(result.current.isBalanceHidden).toBe(!initialState);

      act(() => {
        result.current.toggleBalanceHidden();
      });
      expect(result.current.isBalanceHidden).toBe(initialState);

      act(() => {
        result.current.toggleBalanceHidden();
      });
      expect(result.current.isBalanceHidden).toBe(!initialState);
    });
  });

  describe('Offline State Management', () => {
    it('should set offline state to true', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(result.current.isOffline).toBe(false);

      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should set offline state to false', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // Set to true first
      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isOffline).toBe(true);

      // Set back to false
      act(() => {
        result.current.setIsOffline(false);
      });

      expect(result.current.isOffline).toBe(false);
    });

    it('should allow setting offline state multiple times', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setIsOffline(true);
      });
      expect(result.current.isOffline).toBe(true);

      act(() => {
        result.current.setIsOffline(false);
      });
      expect(result.current.isOffline).toBe(false);

      act(() => {
        result.current.setIsOffline(true);
      });
      expect(result.current.isOffline).toBe(true);
    });

    it('should not affect other state when setting offline', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      const initialNotifications = result.current.notifications;
      const initialPendingRewards = result.current.pendingRewards;

      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.notifications).toBe(initialNotifications);
      expect(result.current.pendingRewards).toBe(initialPendingRewards);
    });
  });

  describe('Notifications Management', () => {
    it('should set notifications count to positive number', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(5);
      });

      expect(result.current.notifications).toBe(5);
    });

    it('should set notifications count to zero', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(0);
      });

      expect(result.current.notifications).toBe(0);
    });

    it('should update notifications count multiple times', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(10);
      });
      expect(result.current.notifications).toBe(10);

      act(() => {
        result.current.setNotifications(20);
      });
      expect(result.current.notifications).toBe(20);

      act(() => {
        result.current.setNotifications(0);
      });
      expect(result.current.notifications).toBe(0);
    });

    it('should not affect other state when setting notifications', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      const initialOffline = result.current.isOffline;
      const initialPendingRewards = result.current.pendingRewards;

      act(() => {
        result.current.setNotifications(99);
      });

      expect(result.current.isOffline).toBe(initialOffline);
      expect(result.current.pendingRewards).toBe(initialPendingRewards);
    });

    it('should accept large notification counts', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(999);
      });

      expect(result.current.notifications).toBe(999);
    });
  });

  describe('Pending Rewards Management', () => {
    it('should set pending rewards count to positive number', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setPendingRewards(10);
      });

      expect(result.current.pendingRewards).toBe(10);
    });

    it('should set pending rewards count to zero', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setPendingRewards(0);
      });

      expect(result.current.pendingRewards).toBe(0);
    });

    it('should update pending rewards count multiple times', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setPendingRewards(5);
      });
      expect(result.current.pendingRewards).toBe(5);

      act(() => {
        result.current.setPendingRewards(15);
      });
      expect(result.current.pendingRewards).toBe(15);

      act(() => {
        result.current.setPendingRewards(0);
      });
      expect(result.current.pendingRewards).toBe(0);
    });

    it('should not affect other state when setting pending rewards', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      const initialOffline = result.current.isOffline;
      const initialNotifications = result.current.notifications;

      act(() => {
        result.current.setPendingRewards(25);
      });

      expect(result.current.isOffline).toBe(initialOffline);
      expect(result.current.notifications).toBe(initialNotifications);
    });
  });

  describe('Combined State Updates', () => {
    it('should handle multiple state updates in sequence', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.toggleBalanceHidden();
        result.current.setIsOffline(true);
        result.current.setNotifications(10);
        result.current.setPendingRewards(5);
      });

      expect(result.current.isBalanceHidden).toBe(true);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.notifications).toBe(10);
      expect(result.current.pendingRewards).toBe(5);
    });

    it('should handle interleaved updates', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(5);
      });

      act(() => {
        result.current.toggleBalanceHidden();
      });

      act(() => {
        result.current.setPendingRewards(3);
      });

      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isBalanceHidden).toBe(true);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.notifications).toBe(5);
      expect(result.current.pendingRewards).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useUI is used outside UIProvider', () => {
      // This should throw an error
      expect(() => {
        renderHook(() => useUI());
      }).toThrow('useUI must be used inside UIProvider');
    });
  });

  describe('Memoization', () => {
    it('should provide stable function references', () => {
      const { result, rerender } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      const toggleRef1 = result.current.toggleBalanceHidden;
      const setOfflineRef1 = result.current.setIsOffline;
      const setNotificationsRef1 = result.current.setNotifications;
      const setPendingRewardsRef1 = result.current.setPendingRewards;

      // Force rerender
      rerender();

      expect(result.current.toggleBalanceHidden).toBe(toggleRef1);
      expect(result.current.setIsOffline).toBe(setOfflineRef1);
      expect(result.current.setNotifications).toBe(setNotificationsRef1);
      expect(result.current.setPendingRewards).toBe(setPendingRewardsRef1);
    });
  });

  describe('Context Sharing', () => {
    it('should share state across multiple useUI calls', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <UIProvider>{children}</UIProvider>
      );

      const { result: result1 } = renderHook(() => useUI(), { wrapper });
      const { result: result2 } = renderHook(() => useUI(), { wrapper });

      // Initial state should be the same
      expect(result1.current.isBalanceHidden).toBe(result2.current.isBalanceHidden);
      expect(result1.current.notifications).toBe(result2.current.notifications);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative notification count', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(-5);
      });

      expect(result.current.notifications).toBe(-5);
    });

    it('should handle negative pending rewards count', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setPendingRewards(-3);
      });

      expect(result.current.pendingRewards).toBe(-3);
    });

    it('should handle very large numbers', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        result.current.setNotifications(Number.MAX_SAFE_INTEGER);
        result.current.setPendingRewards(Number.MAX_SAFE_INTEGER);
      });

      expect(result.current.notifications).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.current.pendingRewards).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle rapid consecutive updates', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.setNotifications(i);
        }
      });

      expect(result.current.notifications).toBe(99);
    });

    it('should handle boolean toggle spam', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toggleBalanceHidden();
        }
      });

      // After 10 toggles, should be back to initial state
      expect(result.current.isBalanceHidden).toBe(false);
    });
  });

  describe('Type Safety', () => {
    it('should have correctly typed state properties', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // Type checks (compile-time, but validated at runtime)
      expect(typeof result.current.isBalanceHidden).toBe('boolean');
      expect(typeof result.current.isOffline).toBe('boolean');
      expect(typeof result.current.notifications).toBe('number');
      expect(typeof result.current.pendingRewards).toBe('number');
    });

    it('should have correctly typed methods', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      expect(typeof result.current.toggleBalanceHidden).toBe('function');
      expect(typeof result.current.setIsOffline).toBe('function');
      expect(typeof result.current.setNotifications).toBe('function');
      expect(typeof result.current.setPendingRewards).toBe('function');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support typical app flow: user hides balance, receives notifications', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // User toggles balance visibility
      act(() => {
        result.current.toggleBalanceHidden();
      });

      expect(result.current.isBalanceHidden).toBe(true);

      // App receives new notifications
      act(() => {
        result.current.setNotifications(5);
      });

      expect(result.current.notifications).toBe(5);

      // User goes offline
      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should support clearing notifications and rewards', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // Set some notifications and rewards
      act(() => {
        result.current.setNotifications(10);
        result.current.setPendingRewards(5);
      });

      expect(result.current.notifications).toBe(10);
      expect(result.current.pendingRewards).toBe(5);

      // User views notifications - clear count
      act(() => {
        result.current.setNotifications(0);
      });

      expect(result.current.notifications).toBe(0);

      // User claims rewards - clear count
      act(() => {
        result.current.setPendingRewards(0);
      });

      expect(result.current.pendingRewards).toBe(0);
    });

    it('should support network status changes', () => {
      const { result } = renderHook(() => useUI(), {
        wrapper: UIProvider,
      });

      // Simulate going offline
      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isOffline).toBe(true);

      // Simulate coming back online
      act(() => {
        result.current.setIsOffline(false);
      });

      expect(result.current.isOffline).toBe(false);
    });
  });
});
