import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { AuthSession, AuthUser, LoginResult } from '@/shared/session/session-types';
import { AuthSessionProvider } from './AuthContext';
import { useAuth } from '@/shared/session/useAuth';
import type { AuthAdapter } from './AuthContext';
import { getAccessToken, setAccessToken } from '@/shared/api/client';

const user: AuthUser = {
  id: 'user-1',
  email: 'user@example.com',
  fullName: 'Production User',
  roles: ['trader'],
  permissions: ['trade:read', 'trade:write'],
  kycStatus: 'verified',
};

const session: AuthSession = {
  user,
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'memory-only-token',
};

function createAdapter(overrides: Partial<AuthAdapter> = {}): AuthAdapter {
  return {
    async login() {
      return { status: 'authenticated', session };
    },
    async getSession() {
      return null;
    },
    async logout() {},
    async refresh() {
      return session;
    },
    ...overrides,
  };
}

describe('AuthSessionProvider', () => {
  it('starts unauthenticated when the server has no session', async () => {
    const adapter = createAdapter();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('hydrates a session and exposes role/permission checks', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={createAdapter({ initialSession: session })}>
          {children}
        </AuthSessionProvider>
      ),
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasRole('trader')).toBe(true);
    expect(result.current.hasPermission('trade:write')).toBe(true);
    expect(result.current.hasPermission('admin:write')).toBe(false);
  });

  it('normalizes an unavailable server session as an authentication error', async () => {
    const adapter = createAdapter({
      getSession: async () => {
        throw 'session endpoint unavailable';
      },
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toEqual(new Error('Authentication request failed'));
  });

  it('supports legacy synchronous login together with MFA setup and verification', async () => {
    const challenge = {
      secret: 'TEST-SECRET',
      qrCodeUrl: 'data:image/svg+xml,<svg/>',
      backupCodes: ['TEST-001'],
    };
    const loginSync = vi.fn(() => session);
    const verifyMfa = vi.fn(async () => session);
    const beginMfaSetup = vi.fn(async () => challenge);
    const confirmMfaSetup = vi.fn(async () => session);
    const adapter = createAdapter({
      initialSession: null,
      loginSync,
      verifyMfa,
      beginMfaSetup,
      confirmMfaSetup,
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await act(async () => {
      await result.current.login(user.email, 'secret');
      await result.current.verifyMfa({ contact: user.email, code: '123456' });
      await result.current.beginMfaSetup();
      await result.current.confirmMfaSetup({ code: '654321' });
    });

    expect(loginSync).toHaveBeenCalledWith({ email: user.email, password: 'secret' });
    expect(verifyMfa).toHaveBeenCalledWith({ contact: user.email, code: '123456' });
    expect(beginMfaSetup).toHaveBeenCalledOnce();
    expect(confirmMfaSetup).toHaveBeenCalledWith({ code: '654321' });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('signs in through the adapter and stores the token only in memory', async () => {
    const adapter = createAdapter();
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.signIn({ email: user.email, password: 'secret' });
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.session?.accessToken).toBe('memory-only-token');
  });

  it('keeps the app unauthenticated when login returns an MFA challenge', async () => {
    const challengeResult: LoginResult = {
      status: 'mfa_required',
      challenge: {
        id: 'login-challenge-001',
        method: 'totp',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    };
    const adapter = createAdapter({
      initialSession: null,
      login: async () => challengeResult,
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    setAccessToken('stale-access-token');
    let loginResult: LoginResult | undefined;
    await act(async () => {
      loginResult = await result.current.signIn({
        email: user.email,
        password: 'secret',
      });
    });

    expect(loginResult).toEqual(challengeResult);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.roles).toEqual([]);
    expect(result.current.permissions).toEqual([]);
    expect(getAccessToken()).toBeNull();
  });

  it('creates a session only after login MFA challenge verification succeeds', async () => {
    const challengeResult: LoginResult = {
      status: 'mfa_required',
      challenge: {
        id: 'login-challenge-001',
        method: 'totp',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    };
    const verifyLoginMfa = vi.fn(async () => session);
    const adapter = createAdapter({
      initialSession: null,
      login: async () => challengeResult,
      verifyLoginMfa,
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.signIn({ email: user.email, password: 'secret' });
    });
    expect(result.current.isAuthenticated).toBe(false);

    let verifiedSession: AuthSession | undefined;
    await act(async () => {
      verifiedSession = await result.current.verifyLoginMfa({
        challengeId: 'login-challenge-001',
        code: '123456',
      });
    });

    expect(verifyLoginMfa).toHaveBeenCalledWith({
      challengeId: 'login-challenge-001',
      code: '123456',
    });
    expect(verifiedSession).toEqual(session);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.session).toEqual(session);
    expect(getAccessToken()).toBe(session.accessToken);
  });

  it('does not authenticate when login MFA challenge verification fails', async () => {
    const challengeResult: LoginResult = {
      status: 'mfa_required',
      challenge: {
        id: 'login-challenge-001',
        method: 'sms',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    };
    const adapter = createAdapter({
      initialSession: null,
      login: async () => challengeResult,
      verifyLoginMfa: vi.fn().mockRejectedValue(new Error('invalid code')),
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    await act(async () => {
      await result.current.signIn({ email: user.email, password: 'secret' });
    });
    await act(async () => {
      await expect(
        result.current.verifyLoginMfa({ challengeId: 'login-challenge-001', code: '000000' }),
      ).rejects.toThrow('invalid code');
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('surfaces login failures and clears the session', async () => {
    const error = new Error('invalid credentials');
    const adapter = createAdapter({
      login: vi.fn().mockRejectedValue(error),
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    let rejected: unknown;
    await act(async () => {
      try {
        await result.current.signIn({ email: user.email, password: 'wrong' });
      } catch (error: unknown) {
        rejected = error;
      }
    });

    expect(rejected).toEqual(error);
    expect(result.current.isAuthenticated).toBe(false);
    await waitFor(() => expect(result.current.error).toEqual(error));
  });

  it('refreshes the session and signs out immediately before the network completes', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const adapter = createAdapter({ initialSession: session, logout });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await act(async () => {
      await result.current.refreshSession();
    });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(logout).toHaveBeenCalledOnce();
  });

  it('clears local auth even when logout fails and returns null after refresh errors', async () => {
    const logout = vi.fn().mockRejectedValue(new Error('logout endpoint unavailable'));
    const refresh = vi.fn().mockRejectedValue('refresh endpoint unavailable');
    const adapter = createAdapter({ initialSession: session, logout, refresh });
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
      ),
    });

    await act(async () => {
      await result.current.signOut();
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(logout).toHaveBeenCalledOnce();

    let refreshed: AuthSession | null | undefined;
    await act(async () => {
      refreshed = await result.current.refreshSession();
    });
    expect(refreshed).toBeNull();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toEqual(new Error('Authentication request failed'));
  });

  it('refreshes the session before access-token expiry and clears expired sessions', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const refresh = vi.fn().mockResolvedValue(null);
    const adapter = createAdapter({
      initialSession: {
        ...session,
        accessTokenExpiresAt: '2026-01-01T00:01:01.000Z',
      },
      refresh,
    });

    try {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => (
          <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
        ),
      });

      expect(result.current.isAuthenticated).toBe(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_001);
      });

      expect(refresh).toHaveBeenCalledOnce();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.status).toBe('unauthenticated');
    } finally {
      vi.useRealTimers();
    }
  });

  it('propagates logout to another tab through BroadcastChannel', async () => {
    class FakeBroadcastChannel {
      private static readonly channels = new Set<FakeBroadcastChannel>();
      private readonly listeners = new Set<(event: MessageEvent) => void>();

      constructor(public readonly name: string) {
        FakeBroadcastChannel.channels.add(this);
      }

      addEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
        if (typeof listener === 'function') {
          this.listeners.add(listener as (event: MessageEvent) => void);
        }
      }

      removeEventListener(_type: string, listener: EventListenerOrEventListenerObject) {
        if (typeof listener === 'function') {
          this.listeners.delete(listener as (event: MessageEvent) => void);
        }
      }

      postMessage(data: unknown) {
        for (const channel of FakeBroadcastChannel.channels) {
          if (channel === this || channel.name !== this.name) continue;
          const event = new MessageEvent('message', { data });
          for (const listener of channel.listeners) listener(event);
        }
      }

      close() {
        FakeBroadcastChannel.channels.delete(this);
        this.listeners.clear();
      }
    }

    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthSessionProvider adapter={createAdapter({ initialSession: session })}>
        {children}
      </AuthSessionProvider>
    );
    const firstTab = renderHook(() => useAuth(), { wrapper });
    const secondTab = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await firstTab.result.current.signOut();
    });

    await waitFor(() => expect(secondTab.result.current.isAuthenticated).toBe(false));
    expect(firstTab.result.current.isAuthenticated).toBe(false);
    firstTab.unmount();
    secondTab.unmount();
    vi.unstubAllGlobals();
  });
});
