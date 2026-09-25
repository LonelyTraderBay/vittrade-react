import { createContext } from 'react';

export interface UIState {
  isBalanceHidden: boolean;
  isOffline: boolean;
  notifications: number;
  pendingRewards: number;
}

export interface UIContextValue extends UIState {
  toggleBalanceHidden: () => void;
  setIsOffline: (offline: boolean) => void;
  setNotifications: (count: number) => void;
  setPendingRewards: (count: number) => void;
}

export const UIContext = createContext<UIContextValue | null>(null);
