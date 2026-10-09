import React, { useState, useCallback, useMemo } from 'react';
import { useUnreadNotificationsCount } from '@/features/support/model/support-queries';
import { UIContext, type UIContextValue, type UIState } from './ui-context';

export function UIProvider({ children }: { children: React.ReactNode }) {
  const notifications = useUnreadNotificationsCount();
  const [state, setState] = useState<UIState>({
    isBalanceHidden: false,
    isOffline: false,
    pendingRewards: 2,
  });

  const toggleBalanceHidden = useCallback(() => {
    setState((s) => ({ ...s, isBalanceHidden: !s.isBalanceHidden }));
  }, []);

  const setIsOffline = useCallback((isOffline: boolean) => {
    setState((s) => ({ ...s, isOffline }));
  }, []);

  const setPendingRewards = useCallback((pendingRewards: number) => {
    setState((s) => ({ ...s, pendingRewards }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders when parent re-renders
  const value = useMemo<UIContextValue>(
    () => ({
      ...state,
      notifications,
      toggleBalanceHidden,
      setIsOffline,
      setPendingRewards,
    }),
    [state, notifications, toggleBalanceHidden, setIsOffline, setPendingRewards],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
