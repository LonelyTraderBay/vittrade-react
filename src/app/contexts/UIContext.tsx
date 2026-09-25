import React, { useState, useCallback, useMemo } from 'react';
import { UIContext, type UIContextValue, type UIState } from './ui-context';

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UIState>({
    isBalanceHidden: false,
    isOffline: false,
    notifications: 3,
    pendingRewards: 2,
  });

  const toggleBalanceHidden = useCallback(() => {
    setState((s) => ({ ...s, isBalanceHidden: !s.isBalanceHidden }));
  }, []);

  const setIsOffline = useCallback((isOffline: boolean) => {
    setState((s) => ({ ...s, isOffline }));
  }, []);

  const setNotifications = useCallback((notifications: number) => {
    setState((s) => ({ ...s, notifications }));
  }, []);

  const setPendingRewards = useCallback((pendingRewards: number) => {
    setState((s) => ({ ...s, pendingRewards }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders when parent re-renders
  const value = useMemo<UIContextValue>(
    () => ({
      ...state,
      toggleBalanceHidden,
      setIsOffline,
      setNotifications,
      setPendingRewards,
    }),
    [state, toggleBalanceHidden, setIsOffline, setNotifications, setPendingRewards],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
