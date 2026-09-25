/**
 * ══════════════════════════════════════════════════════════════════
 *  MARKET DATA WEBSOCKET STREAM PROVIDER
 * ══════════════════════════════════════════════════════════════════
 *  Exposes real-time market data streams for:
 *  - Liquidations feed
 *  - Open Interest updates
 *  - Long/Short ratio changes
 *  - Funding rate updates
 *  - Top trader positions
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { env, isDevelopmentBuild } from '@/shared/config/env';
import { connectMarketStream, type MarketStreamMessage } from '@/features/market';
import type {
  FundingRateData,
  Liquidation,
  LongShortRatioData,
  OpenInterestData,
  TopTraderData,
} from '@/features/market';

/* ═══════════════════════════════════════════════════════════════
   TYPE DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */

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
   STREAM PAYLOAD VALIDATORS
   ═══════════════════════════════════════════════════════════════ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function isLiquidation(value: unknown): value is Liquidation {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.timestamp === 'number' &&
    typeof value.pair === 'string' &&
    (value.side === 'long' || value.side === 'short') &&
    typeof value.size === 'number' &&
    typeof value.price === 'number'
  );
}

function isOpenInterest(value: unknown): value is OpenInterestData {
  return (
    isRecord(value) &&
    typeof value.current === 'number' &&
    typeof value.change24h === 'number' &&
    typeof value.change24hPct === 'number' &&
    typeof value.high24h === 'number' &&
    typeof value.low24h === 'number' &&
    typeof value.timestamp === 'number'
  );
}

function isLongShortRatio(value: unknown): value is LongShortRatioData {
  return (
    isRecord(value) &&
    typeof value.longPct === 'number' &&
    typeof value.shortPct === 'number' &&
    typeof value.longAccounts === 'number' &&
    typeof value.shortAccounts === 'number' &&
    typeof value.longVolume === 'number' &&
    typeof value.shortVolume === 'number' &&
    typeof value.timestamp === 'number'
  );
}

function isTopTrader(value: unknown): value is TopTraderData {
  return (
    isRecord(value) &&
    typeof value.longPct === 'number' &&
    typeof value.shortPct === 'number' &&
    typeof value.change24h === 'number' &&
    typeof value.timestamp === 'number'
  );
}

function isFundingRate(value: unknown): value is FundingRateData {
  return (
    isRecord(value) &&
    typeof value.rate === 'number' &&
    typeof value.avgRate === 'number' &&
    typeof value.nextFundingIn === 'number' &&
    typeof value.timestamp === 'number'
  );
}

/* ═══════════════════════════════════════════════════════════════
   PROVIDER COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface MarketDataWSProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
}

export function MarketDataWSProvider({ children, autoConnect = true }: MarketDataWSProviderProps) {
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

  /* ─────────────────────────────────────────────────────────────
     LIQUIDATIONS STREAM (every 2-10 seconds)
     ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     OPEN INTEREST (every 5 minutes)
     ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     LONG/SHORT RATIO (every 15 seconds)
     ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     TOP TRADERS (every 1 minute)
     ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     FUNDING RATE (every 30 seconds for countdown update)
     ───────────────────────────────────────────────────────────── */
  /* ─────────────────────────────────────────────────────────────
     CONNECTION MANAGEMENT
     ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!autoConnect) return;

    // Non-development builds always use the backend stream. The simulator
    // branch is guarded by Vite's compile-time DEV flag so it is excluded
    // from staging and production bundles entirely.
    if (!isDevelopmentBuild) {
      if (!env.wsUrl) return;

      const handleMessage = ({ type, data }: MarketStreamMessage) => {
        switch (type) {
          case 'liquidation':
            if (isLiquidation(data)) {
              setRecentLiquidations((previous) => [data, ...previous].slice(0, 50));
              liqSubscribers.current.forEach((callback) => callback(data));
            }
            break;
          case 'open_interest':
            if (isOpenInterest(data)) {
              setOpenInterest(data);
              oiSubscribers.current.forEach((callback) => callback(data));
            }
            break;
          case 'long_short_ratio':
            if (isLongShortRatio(data)) {
              setLongShortRatio(data);
              lsrSubscribers.current.forEach((callback) => callback(data));
            }
            break;
          case 'top_traders':
            if (isTopTrader(data)) {
              setTopTraders(data);
              ttSubscribers.current.forEach((callback) => callback(data));
            }
            break;
          case 'funding_rate':
            if (isFundingRate(data)) {
              setFundingRate(data);
              frSubscribers.current.forEach((callback) => callback(data));
            }
            break;
        }
      };

      return connectMarketStream(env.wsUrl, {
        onMessage: handleMessage,
        onStatus: setIsConnected,
      });
    }

    if (isDevelopmentBuild) {
      let cancelled = false;
      let stopSimulator = () => {};

      void import('@/dev/mocks/market-data-simulator').then(({ startMarketDataSimulator }) => {
        if (cancelled) return;
        stopSimulator = startMarketDataSimulator({
          onConnected: () => setIsConnected(true),
          onLiquidation: (value) => {
            setRecentLiquidations((previous) => [value, ...previous].slice(0, 50));
            liqSubscribers.current.forEach((callback) => callback(value));
          },
          onOpenInterest: (value) => {
            setOpenInterest(value);
            oiSubscribers.current.forEach((callback) => callback(value));
          },
          onLongShortRatio: (value) => {
            setLongShortRatio(value);
            lsrSubscribers.current.forEach((callback) => callback(value));
          },
          onTopTraders: (value) => {
            setTopTraders(value);
            ttSubscribers.current.forEach((callback) => callback(value));
          },
          onFundingRate: (value) => {
            setFundingRate(value);
            frSubscribers.current.forEach((callback) => callback(value));
          },
        });
      });

      return () => {
        cancelled = true;
        stopSimulator();
      };
    }

    return undefined;
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

  return <MarketDataWSContext.Provider value={value}>{children}</MarketDataWSContext.Provider>;
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
  minSize?: number,
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
      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10B981' }} />
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
