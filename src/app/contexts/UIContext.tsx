import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface UIState {
  isBalanceHidden: boolean;
  isOffline: boolean;
  notifications: number;
  pendingRewards: number;
}

interface UIContextType extends UIState {
  toggleBalanceHidden: () => void;
  setIsOffline: (offline: boolean) => void;
  setNotifications: (count: number) => void;
  setPendingRewards: (count: number) => void;
}

const UIContext = createContext<UIContextType | null>(null);

export { UIContext };

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UIState>({
    isBalanceHidden: false,
    isOffline: false,
    notifications: 3,
    pendingRewards: 2,
  });

  const toggleBalanceHidden = useCallback(() => {
    setState(s => ({ ...s, isBalanceHidden: !s.isBalanceHidden }));
  }, []);

  const setIsOffline = useCallback((isOffline: boolean) => {
    setState(s => ({ ...s, isOffline }));
  }, []);

  const setNotifications = useCallback((notifications: number) => {
    setState(s => ({ ...s, notifications }));
  }, []);

  const setPendingRewards = useCallback((pendingRewards: number) => {
    setState(s => ({ ...s, pendingRewards }));
  }, []);

  // Memoize context value to prevent unnecessary re-renders when parent re-renders
  const value = useMemo(
    () => ({
      ...state,
      toggleBalanceHidden,
      setIsOffline,
      setNotifications,
      setPendingRewards,
    }),
    [state, toggleBalanceHidden, setIsOffline, setNotifications, setPendingRewards]
  );

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIProvider');
  return ctx;
}