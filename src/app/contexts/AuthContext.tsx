import React from 'react';
import { AuthSessionProvider as SharedAuthSessionProvider } from '@/shared/session/AuthContext';
import type { AuthAdapter } from '@/shared/session/auth-context-types';
import { authApi } from '@/features/auth/api/auth-api-instance';

const productionAuthAdapter: AuthAdapter = authApi;

interface AppAuthSessionProviderProps {
  children: React.ReactNode;
  adapter?: AuthAdapter;
  onIdentityChange?: () => void;
}

/** App composition adapter; the shared session boundary itself has no feature dependency. */
export function AuthSessionProvider({
  children,
  adapter,
  onIdentityChange,
}: AppAuthSessionProviderProps) {
  return (
    <SharedAuthSessionProvider
      adapter={adapter ?? productionAuthAdapter}
      onIdentityChange={onIdentityChange}
    >
      {children}
    </SharedAuthSessionProvider>
  );
}

export function AuthProvider({ children, adapter, onIdentityChange }: AppAuthSessionProviderProps) {
  return (
    <AuthSessionProvider adapter={adapter} onIdentityChange={onIdentityChange}>
      {children}
    </AuthSessionProvider>
  );
}
export type {
  AuthAdapter,
  AuthContextValue,
  AuthStatus,
} from '@/shared/session/auth-context-types';
