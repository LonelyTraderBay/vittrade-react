import { createContext } from 'react';
import type { AuthContextValue } from './auth-context-types';

export const unauthenticatedValue: AuthContextValue = {
  status: 'unauthenticated',
  isLoading: false,
  isAuthenticated: false,
  user: null,
  session: null,
  roles: [],
  permissions: [],
  error: null,
  signIn: async () => {
    throw new Error('AuthProvider is missing');
  },
  verifyMfa: async () => {
    throw new Error('AuthProvider is missing');
  },
  verifyLoginMfa: async () => {
    throw new Error('AuthProvider is missing');
  },
  beginMfaSetup: async () => {
    throw new Error('AuthProvider is missing');
  },
  confirmMfaSetup: async () => {
    throw new Error('AuthProvider is missing');
  },
  login: async () => {
    throw new Error('AuthProvider is missing');
  },
  signOut: async () => {},
  logout: async () => {},
  refreshSession: async () => null,
  hasRole: () => false,
  hasPermission: () => false,
};

export const AuthContext = createContext<AuthContextValue>(unauthenticatedValue);
