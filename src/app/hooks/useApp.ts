import { useContext, useMemo } from 'react';
import type { AuthSession, AuthUser } from '@/features/auth/api/auth-api';
import { useAuth } from '@/shared/session/useAuth';
import { TradingContext } from '../contexts/trading-context';
import { useTheme } from '@/shared/theme/useTheme';
import { useUI } from './useUI';

interface AppContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isBalanceHidden: boolean;
  isOffline: boolean;
  notifications: number;
  toggleBalanceHidden: () => void;
  setIsOffline: (offline: boolean) => void;
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  lastPriceUpdate: Date;
}

export function useApp(): AppContextValue {
  const auth = useAuth();
  const theme = useTheme();
  const ui = useUI();
  const trading = useContext(TradingContext);
  if (!trading) throw new Error('useApp must be used inside AppProvider');

  return useMemo(() => ({ ...auth, ...theme, ...ui, ...trading }), [auth, theme, ui, trading]);
}
