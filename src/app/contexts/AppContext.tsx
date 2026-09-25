import React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { AuthSessionProvider } from './AuthContext';
import type { AuthAdapter } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import { UIProvider } from './UIContext';
import { TradingContext } from './trading-context';
import { queryClient } from '@/shared/api/query-client';
import { useAuth } from '@/shared/session/useAuth';

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

/**
 * AppProvider — wraps all 3 context providers + trading state
 */
export function AppProvider({
  children,
  authAdapter,
}: {
  children: React.ReactNode;
  authAdapter?: AuthAdapter;
}) {
  return (
    <ThemeProvider>
      <AuthSessionProvider adapter={authAdapter}>
        <UIProvider>
          <SessionQueryCacheBoundary>
            <TradingBridge>{children}</TradingBridge>
          </SessionQueryCacheBoundary>
        </UIProvider>
      </AuthSessionProvider>
    </ThemeProvider>
  );
}

function SessionQueryCacheBoundary({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const previousUserId = useRef(user?.id ?? null);

  useLayoutEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserId.current !== currentUserId) queryClient.clear();
    previousUserId.current = currentUserId;
  }, [user?.id]);

  return children;
}

// Internal: trading state that doesn't warrant its own context yet
function TradingBridge({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = React.useState('BTC/USDT');
  const [lastPriceUpdate] = React.useState(() => new Date());

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(
    () => ({ selectedPair, setSelectedPair, lastPriceUpdate }),
    [selectedPair, setSelectedPair, lastPriceUpdate],
  );

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
}
