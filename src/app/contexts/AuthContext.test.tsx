import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { useAuth } from '@/shared/session/useAuth';
import { TEST_AUTH_USER } from '@/test/fixtures/auth-user';
import { testAuthAdapter } from '../../test/auth-test-adapter';

const TestAuthProvider = ({ children }: { children: ReactNode }) => (
  <AuthProvider adapter={testAuthAdapter}>{children}</AuthProvider>
);

/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  AuthContext Tests
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  Tests authentication state management
 */

describe('AuthContext', () => {
  describe('Initial State', () => {
    it('should start with authenticated state and user profile', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
    });

    it('should provide login function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      expect(typeof result.current.login).toBe('function');
    });

    it('should provide logout function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('Login Functionality', () => {
    it('should set authenticated state on login', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      // First logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      // Then login
      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
    });

    it('should accept any credentials (mock mode)', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.login('any@email.com', 'any-password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
    });
  });

  describe('Logout Functionality', () => {
    it('should clear authenticated state on logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).not.toBeNull();

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should allow login after logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      // Logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);

      // Login again
      act(() => {
        result.current.login('test@example.com', 'password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(TEST_AUTH_USER);
    });
  });

  describe('User Profile', () => {
    it('should provide complete user profile when authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      expect(result.current.user).toHaveProperty('id');
      expect(result.current.user).toHaveProperty('email');
      expect(result.current.user).toHaveProperty('fullName');
      expect(result.current.user).toHaveProperty('kycStatus');
      expect(result.current.user).toHaveProperty('has2FA');
    });

    it('should have null user when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Context Sharing', () => {
    it('should share auth state across multiple useAuth calls', () => {
      // Two consumers of ONE provider â€” separate renderHook calls would
      // mount separate providers with independent state.
      const { result } = renderHook(() => ({ first: useAuth(), second: useAuth() }), {
        wrapper: TestAuthProvider,
      });

      // Both should start authenticated
      expect(result.current.first.isAuthenticated).toBe(true);
      expect(result.current.second.isAuthenticated).toBe(true);

      // Logout from first consumer
      act(() => {
        result.current.first.logout();
      });

      // Both should now be logged out
      expect(result.current.first.isAuthenticated).toBe(false);
      expect(result.current.second.isAuthenticated).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should not recreate login/logout functions on re-render', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      const initialLogin = result.current.login;
      const initialLogout = result.current.logout;

      // Trigger re-render
      rerender();

      expect(result.current.login).toBe(initialLogin);
      expect(result.current.logout).toBe(initialLogout);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple consecutive logins', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      act(() => {
        result.current.login('user1@test.com', 'pass1');
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.login('user2@test.com', 'pass2');
      });
      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.login('user3@test.com', 'pass3');
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle multiple consecutive logouts', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);

      // Logout again (should be idempotent)
      act(() => {
        result.current.logout();
      });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should handle empty string credentials', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: TestAuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.login('', '');
      });

      // Should still authenticate in mock mode
      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
