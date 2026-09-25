import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  AuthSession,
  LoginMfaVerificationRequest,
  LoginRequest,
  LoginResult,
  MfaSetupConfirmationRequest,
  MfaVerificationRequest,
} from './session-types';
import { AuthContext } from './auth-context';
import type { AuthAdapter, AuthContextValue } from './auth-context-types';
export type { AuthAdapter, AuthContextValue, AuthStatus } from './auth-context-types';
import { setAccessToken, setUnauthorizedHandler } from '../api/client';
import { captureException } from '../telemetry/telemetry';
const AUTH_CHANNEL_NAME = 'vittrade:auth';

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Authentication request failed');
}

function sessionState(session: AuthSession | null, error: Error | null = null) {
  const authenticated = Boolean(session?.user);
  return {
    status: error
      ? ('error' as const)
      : authenticated
        ? ('authenticated' as const)
        : ('unauthenticated' as const),
    isLoading: false,
    isAuthenticated: authenticated,
    user: session?.user ?? null,
    session,
    roles: session?.user.roles ?? [],
    permissions: session?.user.permissions ?? [],
    error,
  };
}

function broadcastLogout(): void {
  if (typeof BroadcastChannel === 'undefined') return;
  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  channel.postMessage({ type: 'logout' });
  channel.close();
}

interface AuthProviderProps {
  children: React.ReactNode;
  adapter: AuthAdapter;
}

export function AuthSessionProvider({ children, adapter }: AuthProviderProps) {
  const hasDeterministicInitialState = adapter.initialSession !== undefined;
  const [state, setState] = useState(() =>
    hasDeterministicInitialState
      ? sessionState(adapter.initialSession ?? null)
      : {
          ...sessionState(null),
          status: 'loading' as const,
          isLoading: true,
        },
  );
  const operationRef = useRef(0);

  const applySession = useCallback((session: AuthSession | null, error: Error | null = null) => {
    setAccessToken(session?.accessToken ?? null);
    setState(sessionState(session, error));
  }, []);

  useEffect(() => {
    if (hasDeterministicInitialState) {
      setAccessToken(adapter.initialSession?.accessToken ?? null);
      return;
    }

    let active = true;
    const operationId = ++operationRef.current;
    void adapter
      .getSession()
      .then((session) => {
        if (active && operationId === operationRef.current) applySession(session);
      })
      .catch((error: unknown) => {
        if (active && operationId === operationRef.current) {
          const normalized = toError(error);
          captureException(normalized, { area: 'auth', operation: 'getSession' });
          applySession(null, normalized);
        }
      });

    return () => {
      active = false;
    };
  }, [adapter, applySession, hasDeterministicInitialState]);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    const handleMessage = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === 'logout') applySession(null);
    };
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [applySession]);

  const signIn = useCallback(
    async (request: LoginRequest) => {
      const operationId = ++operationRef.current;
      setState((current) => ({ ...current, status: 'loading', isLoading: true, error: null }));
      try {
        const loginResult = await adapter.login(request);
        if (operationId === operationRef.current) {
          if (loginResult.status === 'authenticated') {
            applySession(loginResult.session);
          } else {
            applySession(null);
          }
        }
        return loginResult;
      } catch (error: unknown) {
        const normalized = toError(error);
        captureException(normalized, { area: 'auth', operation: 'login' });
        if (operationId === operationRef.current) applySession(null, normalized);
        throw normalized;
      }
    },
    [adapter, applySession],
  );

  const verifyLoginMfa = useCallback(
    async (request: LoginMfaVerificationRequest) => {
      const operationId = ++operationRef.current;
      if (!adapter.verifyLoginMfa) throw new Error('Login MFA verification is not configured');
      try {
        const session = await adapter.verifyLoginMfa(request);
        if (operationId === operationRef.current) applySession(session);
        return session;
      } catch (error: unknown) {
        const normalized = toError(error);
        captureException(normalized, { area: 'auth', operation: 'verifyLoginMfa' });
        if (operationId === operationRef.current) applySession(null, normalized);
        throw normalized;
      }
    },
    [adapter, applySession],
  );

  const verifyMfa = useCallback(
    async (request: MfaVerificationRequest) => {
      const operationId = ++operationRef.current;
      if (!adapter.verifyMfa) throw new Error('MFA verification is not configured');
      try {
        const session = await adapter.verifyMfa(request);
        if (operationId === operationRef.current) applySession(session);
        return session;
      } catch (error: unknown) {
        const normalized = toError(error);
        captureException(normalized, { area: 'auth', operation: 'verifyMfa' });
        if (operationId === operationRef.current) applySession(null, normalized);
        throw normalized;
      }
    },
    [adapter, applySession],
  );

  const confirmMfaSetup = useCallback(
    async (request: MfaSetupConfirmationRequest) => {
      const operationId = ++operationRef.current;
      if (!adapter.confirmMfaSetup) throw new Error('MFA setup is not configured');
      try {
        const session = await adapter.confirmMfaSetup(request);
        if (operationId === operationRef.current) applySession(session);
        return session;
      } catch (error: unknown) {
        const normalized = toError(error);
        captureException(normalized, { area: 'auth', operation: 'confirmMfaSetup' });
        throw normalized;
      }
    },
    [adapter, applySession],
  );

  const beginMfaSetup = useCallback(async () => {
    if (!adapter.beginMfaSetup) throw new Error('MFA setup is not configured');
    try {
      return await adapter.beginMfaSetup();
    } catch (error: unknown) {
      const normalized = toError(error);
      captureException(normalized, { area: 'auth', operation: 'beginMfaSetup' });
      throw normalized;
    }
  }, [adapter]);

  const signOut = useCallback(async () => {
    ++operationRef.current;
    // Clear local session before the network request so protected data is not usable while logout is pending.
    applySession(null);
    broadcastLogout();
    try {
      await adapter.logout();
    } catch (error: unknown) {
      captureException(toError(error), { area: 'auth', operation: 'logout' });
    }
  }, [adapter, applySession]);

  const refreshSession = useCallback(async () => {
    const operationId = ++operationRef.current;
    try {
      const session = await adapter.refresh();
      if (operationId === operationRef.current) applySession(session);
      return session;
    } catch (error: unknown) {
      const normalized = toError(error);
      captureException(normalized, { area: 'auth', operation: 'refresh' });
      if (operationId === operationRef.current) applySession(null, normalized);
      return null;
    }
  }, [adapter, applySession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void refreshSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [refreshSession]);

  useEffect(() => {
    if (!state.session?.accessTokenExpiresAt) return;
    const expiresAt = Date.parse(state.session.accessTokenExpiresAt);
    if (!Number.isFinite(expiresAt)) return;

    const refreshIn = Math.max(expiresAt - Date.now() - 60_000, 1_000);
    if (refreshIn > 2_147_483_647) return;
    const timer = window.setTimeout(() => {
      void refreshSession();
    }, refreshIn);
    return () => window.clearTimeout(timer);
  }, [refreshSession, state.session?.accessTokenExpiresAt]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn,
      verifyMfa,
      beginMfaSetup,
      confirmMfaSetup,
      verifyLoginMfa,
      login: (email, password) => {
        const request = { email, password };
        if (adapter.loginSync) {
          const session = adapter.loginSync(request);
          applySession(session);
          return Promise.resolve(session);
        }
        return signIn(request).then((loginResult: LoginResult) => {
          if (loginResult.status === 'mfa_required') {
            throw new Error('Multi-factor authentication is required to complete login');
          }
          return loginResult.session;
        });
      },
      signOut,
      logout: signOut,
      refreshSession,
      hasRole: (role) => state.roles.includes(role),
      hasPermission: (permission) => state.permissions.includes(permission),
    }),
    [
      adapter,
      applySession,
      beginMfaSetup,
      confirmMfaSetup,
      refreshSession,
      signIn,
      signOut,
      state,
      verifyMfa,
      verifyLoginMfa,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Backward-compatible name while feature slices migrate to AuthSessionProvider. */
export const AuthProvider = AuthSessionProvider;
