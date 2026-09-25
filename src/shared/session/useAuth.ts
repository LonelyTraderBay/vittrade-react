import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextValue } from './auth-context-types';

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
