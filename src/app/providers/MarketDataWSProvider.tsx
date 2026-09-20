/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET DATA WEBSOCKET MOCK PROVIDER
 * ══════════════════════════════════════════════════════════════════
 *  Simulates real-time market data streams for:
 *  - Liquidations feed
 *  - Open Interest updates
 *  - Long/Short ratio changes
 *  - Funding rate updates
 *  - Top trader positions
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

export interface Liquidation {
  id: string;
  timestamp: number;
  pair: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  exchange?: string;
}

export interface OpenInterestData {
  current: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface LongShortRatioData {
  longPct: number;
  shortPct: number;
  longAccounts: number;
  shortAccounts: number;
  longVolume: number;
  shortVolume: number;
  timestamp: number;
}

export interface TopTraderData {
  longPct: number;
  shortPct: number;
  change24h: number;
  timestamp: number;
}

export interface FundingRateData {
  rate: number;
  avgRate: number;
  nextFundingIn: number; // seconds
  timestamp: number;
}

interface MarketDataWSContextValue {
  // Liquidations
  recentLiquidations: Liquidation[];
  subscribeLiquidations: (callback: (liq: Liquidation) => void) => () => void;
  
  // Open Interest
  openInterest: OpenInterestData | null;
  subscribeOpenInterest: (callback: (data: OpenInterestData) => void) => () => void;
  
  // Long/Short Ratio
  longShortRatio: LongShortRatioData | null;
  subscribeLongShortRatio: (callback: (data: LongShortRatioData) => void) => () => void;
  
  // Top Traders
  topTraders: TopTraderData | null;
  subscribeTopTraders: (callback: (data: TopTraderData) => void) => () => void;
  
  // Funding Rate
  fundingRate: FundingRateData | null;
  subscribeFundingRate: (callback: (data: FundingRateData) => void) => () => void;
  
  // Connection status
  isConnected: boolean;
}

const MarketDataWSContext = createContext<MarketDataWSContextValue | null>(null);

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA GENERATORS
   ═══════════════════════════════════════════════════════════════ */

const PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'];
const PRICES = {
  'BTC/USDT': 67543,
  'ETH/USDT': 3245,
  'SOL/USDT': 145,
  'BNB/USDT': 425,
  'ADA/USDT': 0.58,
};

function generateLiquidation(): Liquidation {
  const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
  const basePrice = PRICES[pair];
  const side: 'long' | 'short' = Math.random() > 0.55 ? 'long' : 'short';
  
  // Size distribution: mostly small, occasional whales
  const sizeRandom = Math.random();
  let size: number;
  if (sizeRandom > 0.95) {
    // 5% chance: whale liquidation ($500K - $2M)
    size = 500000 + Math.random() * 1500000;
  } else if (sizeRandom > 0.80) {
    // 15% chance: large ($50K - $500K)
    size = 50000 + Math.random() * 450000;
  } else {
    // 80% chance: normal retail ($1K - $50K)
    size = 1000 + Math.random() * 49000;
  }
  
  return {
    id: `liq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    pair,
    side,
    size,
    price: basePrice + (Math.random() - 0.5) * basePrice * 0.02,
    exchange: 'Binance',
  };
}

function generateOpenInterest(previous: OpenInterestData | null): OpenInterestData {
  const base = previous?.current || 25680000000;
  // OI changes -2% to +2% per update
  const change = (Math.random() - 0.5) * base * 0.04;
  const newCurrent = Math.max(20000000000, base + change);
  
  return {
    current: newCurrent,
    change24h: change,
    change24hPct: (change / base) * 100,
    high24h: Math.max(previous?.high24h || newCurrent, newCurrent),
    low24h: Math.min(previous?.low24h || newCurrent, newCurrent),
    timestamp: Date.now(),
  };
}

function generateLongShortRatio(previous: LongShortRatioData | null): LongShortRatioData {
  const baseLongPct = previous?.longPct || 62.5;
  // Ratio shifts -1% to +1%
  const shift = (Math.random() - 0.5) * 2;
  const newLongPct = Math.max(30, Math.min(70, baseLongPct + shift));
  const newShortPct = 100 - newLongPct;
  
  return {
    longPct: newLongPct,
    shortPct: newShortPct,
    longAccounts: Math.floor(120000 + Math.random() * 10000),
    shortAccounts: Math.floor(70000 + Math.random() * 10000),
    longVolume: 17000000000 + Math.random() * 3000000000,
    shortVolume: 10000000000 + Math.random() * 3000000000,
    timestamp: Date.now(),
  };
}

function generateTopTraders(previous: TopTraderData | null): TopTraderData {
  const baseLongPct = previous?.longPct || 58.3;
  const shift = (Math.random() - 0.5) * 1.5;
  const newLongPct = Math.max(35, Math.min(65, baseLongPct + shift));
  
  return {
    longPct: newLongPct,
    shortPct: 100 - newLongPct,
    change24h: shift,
    timestamp: Date.now(),
  };
}

function generateFundingRate(previous: FundingRateData | null): FundingRateData {
  // Funding rate typically -0.03% to +0.03%
  const baseRate = previous?.rate || 0.0001;
  const change = (Math.random() - 0.5) * 0.00005;
  const newRate = Math.max(-0.0003, Math.min(0.0003, baseRate + change));
  
  return {
    rate: newRate,
    avgRate: 0.0001,
    nextFundingIn: 7200 - ((Date.now() / 1000) % 7200), // 2h cycle
    timestamp: Date.now(),
  };
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface MarketDataWSProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function MarketDataWSProvider({
  children,
  autoConnect = true,
}: MarketDataWSProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [recentLiquidations, setRecentLiquidations] = useState<Liquidation[]>([]);
  const [openInterest, setOpenInterest] = useState<OpenInterestData | null>(null);
  const [longShortRatio, setLongShortRatio] = useState<LongShortRatioData | null>(null);
  const [topTraders, setTopTraders] = useState<TopTraderData | null>(null);
  const [fundingRate, setFundingRate] = useState<FundingRateData | null>(null);

  // Subscriber refs
  const liqSubscribers = useRef<Set<(liq: Liquidation) => void>>(new Set());
  const oiSubscribers = useRef<Set<(data: OpenInterestData) => void>>(new Set());
  const lsrSubscribers = useRef<Set<(data: LongShortRatioData) => void>>(new Set());
  const ttSubscribers = useRef<Set<(data: TopTraderData) => void>>(new Set());
  const frSubscribers = useRef<Set<(data: FundingRateData) => void>>(new Set());

  // Interval refs
  const intervalsRef = useRef<{
    liquidations?: NodeJS.Timeout;
    openInterest?: NodeJS.Timeout;
    longShortRatio?: NodeJS.Timeout;
    topTraders?: NodeJS.Timeout;
    fundingRate?: NodeJS.Timeout;
  }>({});

  /* ─────────────────────────────────────────────────────────────
     LIQUIDATIONS STREAM (every 2-10 seconds)
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isConnected) return;

    const streamLiquidations = () => {
      const newLiq = generateLiquidation();
      
      // Update state
      setRecentLiquidations(prev => {
        const updated = [newLiq, ...prev].slice(0, 50);
        return updated;
      });
      
      // Notify subscribers
      liqSubscribers.current.forEach(callback => callback(newLiq));
      
      // Schedule next liquidation (2-10 seconds)
      const delay = 2000 + Math.random() * 8000;
      intervalsRef.current.liquidations = setTimeout(streamLiquidations, delay);
    };

    streamLiquidations();

    return () => {
      if (intervalsRef.current.liquidations) {
        clearTimeout(intervalsRef.current.liquidations);
      }
    };
  }, [isConnected]);

  /* ─────────────────────────────────────────────────────────────
     OPEN INTEREST (every 5 minutes)
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isConnected) return;

    // Initial data
    setOpenInterest(generateOpenInterest(null));

    intervalsRef.current.openInterest = setInterval(() => {
      const newData = generateOpenInterest(openInterest);
      setOpenInterest(newData);
      oiSubscribers.current.forEach(callback => callback(newData));
    }, 5 * 60 * 1000); // 5 minutes

    return () => {
      if (intervalsRef.current.openInterest) {
        clearInterval(intervalsRef.current.openInterest);
      }
    };
  }, [isConnected, openInterest]);

  /* ─────────────────────────────────────────────────────────────
     LONG/SHORT RATIO (every 15 seconds)
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isConnected) return;

    setLongShortRatio(generateLongShortRatio(null));

    intervalsRef.current.longShortRatio = setInterval(() => {
      const newData = generateLongShortRatio(longShortRatio);
      setLongShortRatio(newData);
      lsrSubscribers.current.forEach(callback => callback(newData));
    }, 15 * 1000); // 15 seconds

    return () => {
      if (intervalsRef.current.longShortRatio) {
        clearInterval(intervalsRef.current.longShortRatio);
      }
    };
  }, [isConnected, longShortRatio]);

  /* ─────────────────────────────────────────────────────────────
     TOP TRADERS (every 1 minute)
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isConnected) return;

    setTopTraders(generateTopTraders(null));

    intervalsRef.current.topTraders = setInterval(() => {
      const newData = generateTopTraders(topTraders);
      setTopTraders(newData);
      ttSubscribers.current.forEach(callback => callback(newData));
    }, 60 * 1000); // 1 minute

    return () => {
      if (intervalsRef.current.topTraders) {
        clearInterval(intervalsRef.current.topTraders);
      }
    };
  }, [isConnected, topTraders]);

  /* ─────────────────────────────────────────────────────────────
     FUNDING RATE (every 30 seconds for countdown update)
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!isConnected) return;

    setFundingRate(generateFundingRate(null));

    intervalsRef.current.fundingRate = setInterval(() => {
      const newData = generateFundingRate(fundingRate);
      setFundingRate(newData);
      frSubscribers.current.forEach(callback => callback(newData));
    }, 30 * 1000); // 30 seconds

    return () => {
      if (intervalsRef.current.fundingRate) {
        clearInterval(intervalsRef.current.fundingRate);
      }
    };
  }, [isConnected, fundingRate]);

  /* ─────────────────────────────────────────────────────────────
     CONNECTION MANAGEMENT
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (autoConnect) {
      // Simulate connection delay
      const timeout = setTimeout(() => {
        setIsConnected(true);
        console.log('[MarketDataWS] Connected to mock WebSocket');
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [autoConnect]);

  /* ─────────────────────────────────────────────────────────────
     SUBSCRIPTION METHODS
     ───────────────────────────────────────────────────────────── */
  const subscribeLiquidations = useCallback((callback: (liq: Liquidation) => void) => {
    liqSubscribers.current.add(callback);
    return () => {
      liqSubscribers.current.delete(callback);
    };
  }, []);

  const subscribeOpenInterest = useCallback((callback: (data: OpenInterestData) => void) => {
    oiSubscribers.current.add(callback);
    return () => {
      oiSubscribers.current.delete(callback);
    };
  }, []);

  const subscribeLongShortRatio = useCallback((callback: (data: LongShortRatioData) => void) => {
    lsrSubscribers.current.add(callback);
    return () => {
      lsrSubscribers.current.delete(callback);
    };
  }, []);

  const subscribeTopTraders = useCallback((callback: (data: TopTraderData) => void) => {
    ttSubscribers.current.add(callback);
    return () => {
      ttSubscribers.current.delete(callback);
    };
  }, []);

  const subscribeFundingRate = useCallback((callback: (data: FundingRateData) => void) => {
    frSubscribers.current.add(callback);
    return () => {
      frSubscribers.current.delete(callback);
    };
  }, []);

  const value: MarketDataWSContextValue = {
    recentLiquidations,
    subscribeLiquidations,
    openInterest,
    subscribeOpenInterest,
    longShortRatio,
    subscribeLongShortRatio,
    topTraders,
    subscribeTopTraders,
    fundingRate,
    subscribeFundingRate,
    isConnected,
  };

  return (
    <MarketDataWSContext.Provider value={value}>
      {children}
    </MarketDataWSContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CUSTOM HOOKS
   ═══════════════════════════════════════════════════════════════ */

export function useMarketDataWS() {
  const context = useContext(MarketDataWSContext);
  if (!context) {
    throw new Error('useMarketDataWS must be used within MarketDataWSProvider');
  }
  return context;
}

/**
 * Hook for live liquidations stream
 */
export function useLiveLiquidations(limit = 20): Liquidation[] {
  const { recentLiquidations } = useMarketDataWS();
  return recentLiquidations.slice(0, limit);
}

/**
 * Hook for open interest with live updates
 */
export function useOpenInterest(): OpenInterestData | null {
  const { openInterest, subscribeOpenInterest } = useMarketDataWS();
  const [data, setData] = useState(openInterest);

  useEffect(() => {
    setData(openInterest);
    const unsubscribe = subscribeOpenInterest(setData);
    return unsubscribe;
  }, [openInterest, subscribeOpenInterest]);

  return data;
}

/**
 * Hook for long/short ratio with live updates
 */
export function useLongShortRatio(): LongShortRatioData | null {
  const { longShortRatio, subscribeLongShortRatio } = useMarketDataWS();
  const [data, setData] = useState(longShortRatio);

  useEffect(() => {
    setData(longShortRatio);
    const unsubscribe = subscribeLongShortRatio(setData);
    return unsubscribe;
  }, [longShortRatio, subscribeLongShortRatio]);

  return data;
}

/**
 * Hook for top traders with live updates
 */
export function useTopTraders(): TopTraderData | null {
  const { topTraders, subscribeTopTraders } = useMarketDataWS();
  const [data, setData] = useState(topTraders);

  useEffect(() => {
    setData(topTraders);
    const unsubscribe = subscribeTopTraders(setData);
    return unsubscribe;
  }, [topTraders, subscribeTopTraders]);

  return data;
}

/**
 * Hook for funding rate with live updates
 */
export function useFundingRate(): FundingRateData | null {
  const { fundingRate, subscribeFundingRate } = useMarketDataWS();
  const [data, setData] = useState(fundingRate);

  useEffect(() => {
    setData(fundingRate);
    const unsubscribe = subscribeFundingRate(setData);
    return unsubscribe;
  }, [fundingRate, subscribeFundingRate]);

  return data;
}

/**
 * Hook for liquidation notifications (only new liquidations)
 */
export function useLiquidationNotifications(
  onLiquidation: (liq: Liquidation) => void,
  minSize?: number
) {
  const { subscribeLiquidations } = useMarketDataWS();

  useEffect(() => {
    const unsubscribe = subscribeLiquidations((liq) => {
      if (minSize && liq.size < minSize) return;
      onLiquidation(liq);
    });
    return unsubscribe;
  }, [subscribeLiquidations, onLiquidation, minSize]);
}

/**
 * Connection status indicator component
 */
export function WSConnectionIndicator() {
  const { isConnected } = useMarketDataWS();

  if (!isConnected) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: '#10B981' }}
      />
      <span
        style={{
          color: '#10B981',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        LIVE
      </span>
    </div>
  );
}
