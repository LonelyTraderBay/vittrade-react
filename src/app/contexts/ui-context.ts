import { createContext } from 'react';

export interface UIState {
  isBalanceHidden: boolean;
  isOffline: boolean;
  pendingRewards: number;
}

export interface UIContextValue extends UIState {
  notifications: number;
  toggleBalanceHidden: () => void;
  setIsOffline: (offline: boolean) => void;
  setPendingRewards: (count: number) => void;
}

export const UIContext = createContext<UIContextValue | null>(null);
