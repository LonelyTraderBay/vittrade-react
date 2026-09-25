import { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContext, unauthenticatedValue } from './auth-context';

describe('unauthenticated auth context fallback', () => {
  it('exposes the unauthenticated state and the same value through its context', () => {
    const { result } = renderHook(() => useContext(AuthContext));
    expect(result.current).toBe(unauthenticatedValue);
    expect(result.current).toMatchObject({
      status: 'unauthenticated',
      isLoading: false,
      isAuthenticated: false,
      user: null,
      session: null,
      roles: [],
      permissions: [],
      error: null,
    });
  });

  it('rejects authentication operations when the provider is missing', async () => {
    await expect(
      unauthenticatedValue.signIn({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow('AuthProvider is missing');
    await expect(
      unauthenticatedValue.verifyMfa({ contact: 'user@example.com', code: '123456' }),
    ).rejects.toThrow('AuthProvider is missing');
    await expect(unauthenticatedValue.beginMfaSetup()).rejects.toThrow('AuthProvider is missing');
    await expect(unauthenticatedValue.confirmMfaSetup({ code: '123456' })).rejects.toThrow(
      'AuthProvider is missing',
    );
    await expect(unauthenticatedValue.login('user@example.com', 'secret')).rejects.toThrow(
      'AuthProvider is missing',
    );
  });

  it('keeps read-only and sign-out fallback operations safe', async () => {
    await expect(unauthenticatedValue.signOut()).resolves.toBeUndefined();
    await expect(unauthenticatedValue.logout()).resolves.toBeUndefined();
    await expect(unauthenticatedValue.refreshSession()).resolves.toBeNull();
    expect(unauthenticatedValue.hasRole('admin')).toBe(false);
    expect(unauthenticatedValue.hasPermission('wallet:read')).toBe(false);
  });
});
