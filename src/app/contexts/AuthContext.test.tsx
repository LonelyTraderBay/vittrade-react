import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { USER_PROFILE } from '../data/mockData';

/**
 * ══════════════════════════════════════════════════════════
 *  AuthContext Tests
 * ══════════════════════════════════════════════════════════
 *  Tests authentication state management
 */

describe('AuthContext', () => {
  describe('Initial State', () => {
    it('should start with authenticated state and user profile', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(USER_PROFILE);
    });

    it('should provide login function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(typeof result.current.login).toBe('function');
    });

    it('should provide logout function', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('Login Functionality', () => {
    it('should set authenticated state on login', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
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
      expect(result.current.user).toEqual(USER_PROFILE);
    });

    it('should accept any credentials (mock mode)', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.login('any@email.com', 'any-password');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(USER_PROFILE);
    });
  });

  describe('Logout Functionality', () => {
    it('should clear authenticated state on logout', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
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
        wrapper: AuthProvider,
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
      expect(result.current.user).toEqual(USER_PROFILE);
    });
  });

  describe('User Profile', () => {
    it('should provide complete user profile when authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.user).toHaveProperty('id');
      expect(result.current.user).toHaveProperty('email');
      expect(result.current.user).toHaveProperty('fullName');
      expect(result.current.user).toHaveProperty('kycStatus');
      expect(result.current.user).toHaveProperty('has2FA');
    });

    it('should have null user when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Context Sharing', () => {
    it('should share auth state across multiple useAuth calls', () => {
      const { result: result1 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });
      const { result: result2 } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Both should start authenticated
      expect(result1.current.isAuthenticated).toBe(true);
      expect(result2.current.isAuthenticated).toBe(true);

      // Logout from first hook
      act(() => {
        result1.current.logout();
      });

      // Both should now be logged out
      expect(result1.current.isAuthenticated).toBe(false);
      expect(result2.current.isAuthenticated).toBe(false);
    });
  });

  describe('Memoization', () => {
    it('should not recreate login/logout functions on re-render', () => {
      const { result, rerender } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
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
        wrapper: AuthProvider,
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
        wrapper: AuthProvider,
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
        wrapper: AuthProvider,
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
