import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { USER_PROFILE } from '../data/mockData';

interface AuthState {
  isAuthenticated: boolean;
  user: typeof USER_PROFILE | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => void;
  logout: () => void;
}

const defaultAuth: AuthContextType = {
  isAuthenticated: true,
  user: USER_PROFILE,
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuth);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: true,
    user: USER_PROFILE,
  });

  const login = useCallback((_email: string, _password: string) => {
    setState({ isAuthenticated: true, user: USER_PROFILE });
  }, []);

  const logout = useCallback(() => {
    setState({ isAuthenticated: false, user: null });
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ ...state, login, logout }),
    [state, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}