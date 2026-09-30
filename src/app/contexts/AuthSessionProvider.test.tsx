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
const userEmail = 'user@example.com';

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

class FakeBroadcastChannel {
  private static readonly channels = new Set<FakeBroadcastChannel>();
  private readonly listeners = new Set<(event: MessageEvent) => void>();

  static get openChannelCount() {
    return FakeBroadcastChannel.channels.size;
  }

  static get activeListenerCount() {
    return [...FakeBroadcastChannel.channels].reduce(
      (count, channel) => count + channel.listeners.size,
      0,
    );
  }

  static reset() {
    for (const channel of FakeBroadcastChannel.channels) channel.close();
  }

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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function renderWithRemoteLogout(adapter: AuthAdapter) {
  FakeBroadcastChannel.reset();
  vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
  const provider = renderHook(() => useAuth(), {
    wrapper: ({ children }) => (
      <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>
    ),
  });
  const remoteTab = new FakeBroadcastChannel('vittrade:auth');

  return {
    result: provider.result,
    logoutFromOtherTab: () => act(() => remoteTab.postMessage({ type: 'logout' })),
    dispose: () => {
      remoteTab.close();
      provider.unmount();
      expect(FakeBroadcastChannel.openChannelCount).toBe(0);
      expect(FakeBroadcastChannel.activeListenerCount).toBe(0);
      vi.unstubAllGlobals();
    },
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
      await result.current.login(userEmail, 'secret');
      await result.current.verifyMfa({ contact: userEmail, code: '123456' });
      await result.current.beginMfaSetup();
      await result.current.confirmMfaSetup({ code: '654321' });
    });

    expect(loginSync).toHaveBeenCalledWith({ email: userEmail, password: 'secret' });
    expect(verifyMfa).toHaveBeenCalledWith({ contact: userEmail, code: '123456' });
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
      await result.current.signIn({ email: userEmail, password: 'secret' });
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
        email: userEmail,
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
      await result.current.signIn({ email: userEmail, password: 'secret' });
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
      await result.current.signIn({ email: userEmail, password: 'secret' });
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
        await result.current.signIn({ email: userEmail, password: 'wrong' });
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

  it('ignores a late refresh success after a remote logout', async () => {
    const refreshResult = deferred<AuthSession>();
    const provider = renderWithRemoteLogout(
      createAdapter({ initialSession: session, refresh: () => refreshResult.promise }),
    );

    try {
      let pendingRefresh!: Promise<AuthSession | null>;
      act(() => {
        pendingRefresh = provider.result.current.refreshSession();
      });
      expect(getAccessToken()).toBe(session.accessToken);

      provider.logoutFromOtherTab();
      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();

      await act(async () => {
        refreshResult.resolve(session);
        await pendingRefresh;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('ignores a late bootstrap session after a remote logout', async () => {
    const bootstrap = deferred<AuthSession | null>();
    const getSession = vi.fn(() => bootstrap.promise);
    const provider = renderWithRemoteLogout(createAdapter({ getSession }));

    try {
      expect(getSession).toHaveBeenCalledOnce();
      provider.logoutFromOtherTab();
      expect(provider.result.current.status).toBe('unauthenticated');

      await act(async () => {
        bootstrap.resolve(session);
        await bootstrap.promise;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('ignores a late password-login session after a remote logout', async () => {
    const loginResult = deferred<LoginResult>();
    const login = vi.fn(() => loginResult.promise);
    const provider = renderWithRemoteLogout(createAdapter({ initialSession: null, login }));

    try {
      let pendingLogin!: Promise<LoginResult>;
      act(() => {
        pendingLogin = provider.result.current.signIn({ email: userEmail, password: 'secret' });
      });
      provider.logoutFromOtherTab();

      await act(async () => {
        loginResult.resolve({ status: 'authenticated', session });
        await pendingLogin;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('ignores a late login-MFA verification session after a remote logout', async () => {
    const challengeResult: LoginResult = {
      status: 'mfa_required',
      challenge: {
        id: 'login-challenge-remote-logout',
        method: 'email',
        expiresAt: '2099-01-01T00:05:00.000Z',
      },
    };
    const verification = deferred<AuthSession>();
    const provider = renderWithRemoteLogout(
      createAdapter({
        initialSession: null,
        login: async () => challengeResult,
        verifyLoginMfa: () => verification.promise,
      }),
    );

    try {
      await act(async () => {
        await provider.result.current.signIn({ email: userEmail, password: 'secret' });
      });
      if (challengeResult.status !== 'mfa_required') throw new Error('Expected an MFA challenge');
      let pendingVerification!: Promise<AuthSession>;
      act(() => {
        pendingVerification = provider.result.current.verifyLoginMfa({
          challengeId: challengeResult.challenge.id,
          code: '123456',
        });
      });
      provider.logoutFromOtherTab();

      await act(async () => {
        verification.resolve(session);
        await pendingVerification;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('ignores a late authenticated MFA verification session after a remote logout', async () => {
    const verification = deferred<AuthSession>();
    const provider = renderWithRemoteLogout(
      createAdapter({ initialSession: session, verifyMfa: () => verification.promise }),
    );

    try {
      let pendingVerification!: Promise<AuthSession>;
      act(() => {
        pendingVerification = provider.result.current.verifyMfa({
          contact: userEmail,
          code: '123456',
        });
      });
      provider.logoutFromOtherTab();
      await act(async () => {
        verification.resolve(session);
        await pendingVerification;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('ignores a late MFA-setup confirmation session after a remote logout', async () => {
    const confirmation = deferred<AuthSession>();
    const provider = renderWithRemoteLogout(
      createAdapter({ initialSession: session, confirmMfaSetup: () => confirmation.promise }),
    );

    try {
      let pendingConfirmation!: Promise<AuthSession>;
      act(() => {
        pendingConfirmation = provider.result.current.confirmMfaSetup({ code: '123456' });
      });
      provider.logoutFromOtherTab();
      await act(async () => {
        confirmation.resolve(session);
        await pendingConfirmation;
      });

      expect(provider.result.current.isAuthenticated).toBe(false);
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
  });

  it('keeps a new login after remote logout when an older refresh succeeds', async () => {
    const oldRefresh = deferred<AuthSession>();
    const newSession: AuthSession = {
      ...session,
      user: { ...user, id: 'user-2', email: 'new@example.com' },
      accessToken: 'new-memory-only-token',
    };
    const login = vi.fn(async () => ({ status: 'authenticated' as const, session: newSession }));
    const provider = renderWithRemoteLogout(
      createAdapter({ initialSession: session, refresh: () => oldRefresh.promise, login }),
    );

    try {
      let pendingRefresh!: Promise<AuthSession | null>;
      act(() => {
        pendingRefresh = provider.result.current.refreshSession();
      });
      provider.logoutFromOtherTab();
      await act(async () => {
        await provider.result.current.signIn({ email: 'new@example.com', password: 'secret' });
      });

      await act(async () => {
        oldRefresh.resolve(session);
        await pendingRefresh;
      });

      expect(provider.result.current.user?.id).toBe('user-2');
      expect(provider.result.current.session?.accessToken).toBe('new-memory-only-token');
      expect(getAccessToken()).toBe('new-memory-only-token');
    } finally {
      provider.dispose();
    }
  });

  it('keeps a legacy synchronous login ahead of an older refresh response', async () => {
    const oldRefresh = deferred<AuthSession>();
    const newSession: AuthSession = {
      ...session,
      user: { ...user, id: 'user-2', email: 'new@example.com' },
      accessToken: 'new-memory-only-token',
    };
    const loginSync = vi.fn(() => newSession);
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <AuthSessionProvider
          adapter={createAdapter({
            initialSession: session,
            refresh: () => oldRefresh.promise,
            loginSync,
          })}
        >
          {children}
        </AuthSessionProvider>
      ),
    });

    let pendingRefresh!: Promise<AuthSession | null>;
    act(() => {
      pendingRefresh = result.current.refreshSession();
    });
    await act(async () => {
      await result.current.login('new@example.com', 'secret');
    });

    await act(async () => {
      oldRefresh.resolve(session);
      await pendingRefresh;
    });

    expect(loginSync).toHaveBeenCalledWith({ email: 'new@example.com', password: 'secret' });
    expect(result.current.user?.id).toBe('user-2');
    expect(result.current.session?.accessToken).toBe('new-memory-only-token');
    expect(getAccessToken()).toBe('new-memory-only-token');
  });

  it('keeps unauthenticated state when a refresh error arrives after remote logout', async () => {
    const oldRefresh = deferred<AuthSession>();
    const provider = renderWithRemoteLogout(
      createAdapter({ initialSession: session, refresh: () => oldRefresh.promise }),
    );

    try {
      let pendingRefresh!: Promise<AuthSession | null>;
      act(() => {
        pendingRefresh = provider.result.current.refreshSession();
      });
      provider.logoutFromOtherTab();

      await act(async () => {
        oldRefresh.reject(new Error('stale refresh failure'));
        await expect(pendingRefresh).resolves.toBeNull();
      });

      expect(provider.result.current.status).toBe('unauthenticated');
      expect(provider.result.current.error).toBeNull();
      expect(provider.result.current.session).toBeNull();
      expect(getAccessToken()).toBeNull();
    } finally {
      provider.dispose();
    }
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
    FakeBroadcastChannel.reset();
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthSessionProvider adapter={createAdapter({ initialSession: session })}>
        {children}
      </AuthSessionProvider>
    );
    const firstTab = renderHook(() => useAuth(), { wrapper });
    const secondTab = renderHook(() => useAuth(), { wrapper });

    try {
      await act(async () => {
        await firstTab.result.current.signOut();
      });

      await waitFor(() => expect(secondTab.result.current.isAuthenticated).toBe(false));
      expect(firstTab.result.current.isAuthenticated).toBe(false);
    } finally {
      firstTab.unmount();
      secondTab.unmount();
      expect(FakeBroadcastChannel.openChannelCount).toBe(0);
      expect(FakeBroadcastChannel.activeListenerCount).toBe(0);
      vi.unstubAllGlobals();
    }
  });
});
