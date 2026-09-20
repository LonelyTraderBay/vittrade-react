import React, { createContext, useContext } from 'react';
import { USER_PROFILE } from '../data/mockData';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { UIProvider, useUI } from './UIContext';

/**
 * ══════════════════════════════════════════════════════════
 *  AppContext — Backward-compatible facade
 * ══════════════════════════════════════════════════════════
 *
 *  Composes AuthContext + ThemeContext + UIContext into a single
 *  useApp() hook for backward compatibility.
 *
 *  NEW CODE should use useAuth(), useTheme(), useUI() directly
 *  to minimize re-renders. Legacy useApp() still works.
 *
 *  Architecture:
 *  - AuthContext: isAuthenticated, user, login, logout
 *  - ThemeContext: theme, setTheme
 *  - UIContext: isBalanceHidden, isOffline, notifications
 *  - TradingContext (selectedPair, lastPriceUpdate) moved to useApp facade
 */

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  user: typeof USER_PROFILE | null;
  login: (email: string, password: string) => void;
  logout: () => void;
  // Theme
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  // UI
  isBalanceHidden: boolean;
  isOffline: boolean;
  notifications: number;
  toggleBalanceHidden: () => void;
  setIsOffline: (offline: boolean) => void;
  // Trading (kept local for now)
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  lastPriceUpdate: Date;
}

/**
 * AppProvider — wraps all 3 context providers + trading state
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UIProvider>
          <TradingBridge>
            {children}
          </TradingBridge>
        </UIProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Internal: trading state that doesn't warrant its own context yet
const TradingContext = createContext<{
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  lastPriceUpdate: Date;
} | null>(null);

function TradingBridge({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = React.useState('BTC/USDT');
  const [lastPriceUpdate] = React.useState(() => new Date());

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({ selectedPair, setSelectedPair, lastPriceUpdate }),
    [selectedPair, setSelectedPair, lastPriceUpdate]
  );

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

/**
 * useApp() — backward-compatible facade
 * Composes all 3 contexts into one return object.
 * PERF NOTE: changes in ANY sub-context will trigger re-render.
 * For perf-sensitive components, use useAuth/useTheme/useUI directly.
 */
export function useApp(): AppContextType {
  const auth = useAuth();
  const theme = useTheme();
  const ui = useUI();
  const trading = useContext(TradingContext);
  if (!trading) throw new Error('useApp must be used inside AppProvider');

  // Memoize return object to prevent creating new reference on each call
  return React.useMemo(
    () => ({
      ...auth,
      ...theme,
      ...ui,
      ...trading,
    }),
    [auth, theme, ui, trading]
  );
}