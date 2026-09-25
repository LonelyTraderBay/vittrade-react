import { createContext } from 'react';

export interface TradingContextValue {
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  lastPriceUpdate: Date;
}

export const TradingContext = createContext<TradingContextValue | null>(null);
