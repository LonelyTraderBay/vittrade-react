import React from 'react';
import { AuthSessionProvider as SharedAuthSessionProvider } from '@/shared/session/AuthContext';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import { apiClient } from '@/shared/api/app-client';
import { createAuthApi } from '@/features/auth/api/auth-api';

const productionAuthAdapter: AuthAdapter = createAuthApi(apiClient);

interface AppAuthSessionProviderProps {
  children: React.ReactNode;
  adapter?: AuthAdapter;
}

/** App composition adapter; the shared session boundary itself has no feature dependency. */
export function AuthSessionProvider({ children, adapter }: AppAuthSessionProviderProps) {
  return (
    <SharedAuthSessionProvider adapter={adapter ?? productionAuthAdapter}>
      {children}
    </SharedAuthSessionProvider>
  );
}

export function AuthProvider({ children, adapter }: AppAuthSessionProviderProps) {
  return <AuthSessionProvider adapter={adapter}>{children}</AuthSessionProvider>;
}
export type {
  AuthAdapter,
  AuthContextValue,
  AuthStatus,
} from '@/shared/session/auth-context-types';
