/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  AppContext Tests
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  Comprehensive tests for composed app context facade
 *
 *  Run: npx vitest run src/app/__tests__/AppContext.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppProvider } from '../contexts/AppContext';
import { useApp } from '../hooks/useApp';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { UIProvider } from '../contexts/UIContext';
import { TEST_AUTH_USER } from '@/test/fixtures/auth-user';
import { testAuthAdapter, testAuthSession } from '../../test/auth-test-adapter';
import { queryClient } from '@/shared/api/query-client';
import { useAuth } from '@/shared/session/useAuth';

const TestAppProvider = ({ children }: { children: ReactNode }) => (
  <AppProvider authAdapter={testAuthAdapter}>{children}</AppProvider>
);

describe('AppContext', () => {
  // Clean up document classes
  beforeEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light');
  });

  describe('Initial State', () => {
    it('should provide all auth properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });

    it('clears cached account data on account switch and sign out', async () => {
      const adapter = {
        initialSession: testAuthSession,
        async login() {
          return {
            status: 'authenticated' as const,
            session: {
              ...testAuthSession,
              user: { ...TEST_AUTH_USER, id: 'usr002', email: 'second@example.com' },
            },
          };
        },
        getSession: testAuthAdapter.getSession,
        logout: testAuthAdapter.logout,
        refresh: testAuthAdapter.refresh,
      };
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AppProvider authAdapter={adapter}>{children}</AppProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });
      queryClient.setQueryData(['wallet', 'assets'], { items: [{ id: 'private-asset' }] });
      queryClient.setQueryData(['market', 'watchlist', TEST_AUTH_USER.id], { items: [] });

      await act(async () =>
        result.current.signIn({ email: 'second@example.com', password: 'test' }),
      );

      expect(queryClient.getQueryData(['wallet', 'assets'])).toBeUndefined();
      expect(queryClient.getQueryData(['market', 'watchlist', TEST_AUTH_USER.id])).toBeUndefined();
      expect(result.current.user?.id).toBe('usr002');

      queryClient.setQueryData(['wallet', 'assets'], { items: [{ id: 'second-user-asset' }] });
      await act(async () => result.current.logout());
      expect(queryClient.getQueryData(['wallet', 'assets'])).toBeUndefined();
    });

    it('should provide all theme properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.theme).toBe('light');
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should provide all UI properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.isBalanceHidden).toBe(false);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.notifications).toBe(3);
      expect(typeof result.current.toggleBalanceHidden).toBe('function');
      expect(typeof result.current.setIsOffline).toBe('function');
    });

    it('should provide trading properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.selectedPair).toBe('BTC/USDT');
      expect(typeof result.current.setSelectedPair).toBe('function');
      expect(result.current.lastPriceUpdate).toBeInstanceOf(Date);
    });
  });

  describe('Auth Integration', () => {
    it('should allow login through useApp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // Logout first
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      // Login
      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
    });

    it('should allow logout through useApp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should reflect user profile correctly', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.user).toHaveProperty('id');
      expect(result.current.user).toHaveProperty('email');
      expect(result.current.user).toHaveProperty('fullName');
    });
  });

  describe('Theme Integration', () => {
    it('should allow theme changes through useApp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
    });

    it('should update document classes when theme changes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });

      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('should toggle between light and dark themes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.setTheme('light');
      });
      expect(result.current.theme).toBe('light');
    });
  });

  describe('UI Integration', () => {
    it('should toggle balance visibility through useApp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.isBalanceHidden).toBe(false);

      act(() => {
        result.current.toggleBalanceHidden();
      });

      expect(result.current.isBalanceHidden).toBe(true);
    });

    it('should set offline state through useApp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.isOffline).toBe(false);

      act(() => {
        result.current.setIsOffline(true);
      });

      expect(result.current.isOffline).toBe(true);
    });

    it('should update notifications count', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.notifications).toBe(3);
    });
  });

  describe('Trading Integration', () => {
    it('should have default trading pair BTC/USDT', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.selectedPair).toBe('BTC/USDT');
    });

    it('should allow changing selected trading pair', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.setSelectedPair('ETH/USDT');
      });

      expect(result.current.selectedPair).toBe('ETH/USDT');
    });

    it('should support multiple trading pair changes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.setSelectedPair('ETH/USDT');
      });
      expect(result.current.selectedPair).toBe('ETH/USDT');

      act(() => {
        result.current.setSelectedPair('BNB/USDT');
      });
      expect(result.current.selectedPair).toBe('BNB/USDT');

      act(() => {
        result.current.setSelectedPair('SOL/USDT');
      });
      expect(result.current.selectedPair).toBe('SOL/USDT');
    });

    it('should have lastPriceUpdate as Date object', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result.current.lastPriceUpdate).toBeInstanceOf(Date);
    });

    it('should have valid lastPriceUpdate timestamp', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      const timestamp = result.current.lastPriceUpdate.getTime();
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Combined State Updates', () => {
    it('should handle auth, theme, and UI changes together', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.logout();
        result.current.setTheme('dark');
        result.current.toggleBalanceHidden();
        result.current.setIsOffline(true);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.theme).toBe('dark');
      expect(result.current.isBalanceHidden).toBe(true);
      expect(result.current.isOffline).toBe(true);
    });

    it('should handle all state changes independently', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // Change theme
      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');
      expect(result.current.isAuthenticated).toBe(true); // Auth unchanged

      // Change trading pair
      act(() => {
        result.current.setSelectedPair('ETH/USDT');
      });
      expect(result.current.selectedPair).toBe('ETH/USDT');
      expect(result.current.theme).toBe('dark'); // Theme unchanged

      // Toggle balance
      act(() => {
        result.current.toggleBalanceHidden();
      });
      expect(result.current.isBalanceHidden).toBe(true);
      expect(result.current.selectedPair).toBe('ETH/USDT'); // Trading unchanged
    });

    it('should support complex app flows', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // User logs out
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      // Switches to dark theme
      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');

      // Logs back in
      act(() => {
        result.current.login('user@example.com', 'pass');
      });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.theme).toBe('dark'); // Theme persists

      // Changes trading pair
      act(() => {
        result.current.setSelectedPair('SOL/USDT');
      });
      expect(result.current.selectedPair).toBe('SOL/USDT');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useApp is used outside AppProvider', () => {
      // Provide the sub-contexts so their own guards do not fire first â€”
      // this isolates useApp's own "outside AppProvider" error.
      expect(() => {
        renderHook(() => useApp(), {
          wrapper: ({ children }) => (
            <ThemeProvider>
              <AuthProvider adapter={testAuthAdapter}>
                <UIProvider>{children}</UIProvider>
              </AuthProvider>
            </ThemeProvider>
          ),
        });
      }).toThrow('useApp must be used inside AppProvider');
    });
  });

  describe('Memoization', () => {
    it('should memoize return value', () => {
      const { result, rerender } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      const value1 = result.current;

      // Rerender without changes
      rerender();

      const value2 = result.current;

      // Should be same reference
      expect(value2).toBe(value1);
    });

    it('should update memoized value when state changes', () => {
      const { result, rerender } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      const value1 = result.current;

      act(() => {
        result.current.setTheme('dark');
      });

      rerender();

      const value2 = result.current;

      // Should be different reference
      expect(value2).not.toBe(value1);
      expect(value2.theme).toBe('dark');
      expect(value1.theme).toBe('light');
    });
  });

  describe('Type Safety', () => {
    it('should have correctly typed auth properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });

    it('should have correctly typed theme properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(['light', 'dark']).toContain(result.current.theme);
      expect(typeof result.current.setTheme).toBe('function');
    });

    it('should have correctly typed UI properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(typeof result.current.isBalanceHidden).toBe('boolean');
      expect(typeof result.current.isOffline).toBe('boolean');
      expect(typeof result.current.notifications).toBe('number');
    });

    it('should have correctly typed trading properties', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(typeof result.current.selectedPair).toBe('string');
      expect(typeof result.current.setSelectedPair).toBe('function');
      expect(result.current.lastPriceUpdate).toBeInstanceOf(Date);
    });
  });

  describe('Provider Composition', () => {
    it('should compose ThemeProvider, AuthProvider, UIProvider correctly', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // All contexts should be available
      expect(result.current.theme).toBeDefined();
      expect(result.current.isAuthenticated).toBeDefined();
      expect(result.current.isBalanceHidden).toBeDefined();
    });

    it('should apply theme class on mount', () => {
      renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(document.documentElement.classList.contains('light')).toBe(true);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should support typical app initialization', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // Check initial app state
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.theme).toBe('light');
      expect(result.current.selectedPair).toBe('BTC/USDT');
      expect(result.current.isOffline).toBe(false);
    });

    it('should support user session flow', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // User logs in
      act(() => {
        result.current.login('user@example.com', 'password');
      });
      expect(result.current.isAuthenticated).toBe(true);

      // User changes settings
      act(() => {
        result.current.setTheme('dark');
        result.current.toggleBalanceHidden();
      });
      expect(result.current.theme).toBe('dark');
      expect(result.current.isBalanceHidden).toBe(true);

      // User trades
      act(() => {
        result.current.setSelectedPair('ETH/USDT');
      });
      expect(result.current.selectedPair).toBe('ETH/USDT');

      // User logs out
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should support network status changes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // App goes offline
      act(() => {
        result.current.setIsOffline(true);
      });
      expect(result.current.isOffline).toBe(true);

      // App comes back online
      act(() => {
        result.current.setIsOffline(false);
      });
      expect(result.current.isOffline).toBe(false);
    });

    it('should support theme switching based on preferences', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // User prefers dark mode
      act(() => {
        result.current.setTheme('dark');
      });
      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.toggleBalanceHidden();
          result.current.setSelectedPair(`PAIR-${i}`);
        }
      });

      // Should settle on final values
      expect(result.current.isBalanceHidden).toBe(false); // Even number of toggles
      expect(result.current.selectedPair).toBe('PAIR-9');
    });

    it('should handle provider unmount and remount', () => {
      const { result, unmount } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        result.current.setTheme('dark');
        result.current.setSelectedPair('ETH/USDT');
      });

      expect(result.current.theme).toBe('dark');
      expect(result.current.selectedPair).toBe('ETH/USDT');

      unmount();

      // Remount - should reset to initial state
      const { result: result2 } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      expect(result2.current.theme).toBe('light');
      expect(result2.current.selectedPair).toBe('BTC/USDT');
    });

    it('should handle all trading pairs', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      const pairs = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'ADA/USDT'];

      pairs.forEach((pair) => {
        act(() => {
          result.current.setSelectedPair(pair);
        });
        expect(result.current.selectedPair).toBe(pair);
      });
    });
  });

  describe('Performance', () => {
    it('should not create new reference on unrelated rerenders', () => {
      const { result, rerender } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      const setThemeRef = result.current.setTheme;
      const setSelectedPairRef = result.current.setSelectedPair;

      rerender();

      expect(result.current.setTheme).toBe(setThemeRef);
      expect(result.current.setSelectedPair).toBe(setSelectedPairRef);
    });

    it('should handle high-frequency trading pair changes', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.setSelectedPair(`PAIR-${i % 10}`);
        }
      });

      expect(result.current.selectedPair).toBe('PAIR-9');
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with legacy code', () => {
      const { result } = renderHook(() => useApp(), {
        wrapper: TestAppProvider,
      });

      // Legacy code expects all these properties
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('theme');
      expect(result.current).toHaveProperty('setTheme');
      expect(result.current).toHaveProperty('isBalanceHidden');
      expect(result.current).toHaveProperty('toggleBalanceHidden');
      expect(result.current).toHaveProperty('selectedPair');
      expect(result.current).toHaveProperty('setSelectedPair');
    });
  });
});
