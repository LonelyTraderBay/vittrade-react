import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthSessionProvider } from './AuthContext';
import { useAuth } from '@/shared/session/useAuth';

const { getSession } = vi.hoisted(() => ({
  getSession: vi.fn(async () => null),
}));

vi.mock('@/features/auth/api/auth-api-instance', () => ({
  authApi: {
    getSession,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

describe('app AuthSessionProvider default adapter', () => {
  it('uses the production adapter when no adapter is supplied', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthSessionProvider>{children}</AuthSessionProvider>,
    });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

    expect(getSession).toHaveBeenCalledOnce();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
