export interface CandlestickData {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumeData {
  time: number;
  value: number;
  color?: string;
}

export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

/* ═══════════════════════════════════════════════════════════════
   TIMEFRAME CONFIGURATIONS
   ═══════════════════════════════════════════════════════════════ */

export const TIMEFRAME_CONFIG = {
  '5m': { interval: 5 * 60, count: 288, label: '5 minutes' },      // 24h worth
  '15m': { interval: 15 * 60, count: 96, label: '15 minutes' },    // 24h worth
  '1h': { interval: 60 * 60, count: 24, label: '1 hour' },         // 24h worth
  '4h': { interval: 4 * 60 * 60, count: 42, label: '4 hours' },    // 7 days worth
  '1d': { interval: 24 * 60 * 60, count: 30, label: '1 day' },     // 30 days worth
  '1w': { interval: 7 * 24 * 60 * 60, count: 52, label: '1 week' }, // 1 year worth
};

/**
 * Preset data generators for common scenarios
 */
export const CHART_PRESETS = {
  btc24h: () => generate24hCandlestickData(69000, 0.02, 24),
  eth24h: () => generate24hCandlestickData(3200, 0.025, 24),
  btcIntraday: () => generateIntradayData(69000, 0.005),
  ethIntraday: () => generateIntradayData(3200, 0.006),
  bullish: () => addTrend(generate24hCandlestickData(69000, 0.015, 24), 0.002),
  bearish: () => addTrend(generate24hCandlestickData(69000, 0.015, 24), -0.002),
};

/* ═══════════════════════════════════════════════════════════════
   PAIR CONFIG — Maps pairId to realistic price/volatility params
   ═══════════════════════════════════════════════════════════════ */

interface PairConfig {
  basePrice: number;
  volatility: number;
  trendBias: number;
  avgVolume: number;
}

const PAIR_CONFIGS: Record<string, PairConfig> = {
  btcusdt:  { basePrice: 69000,  volatility: 0.020, trendBias:  0.10, avgVolume: 5000000 },
  ethusdt:  { basePrice: 3200,   volatility: 0.025, trendBias:  0.05, avgVolume: 2000000 },
  bnbusdt:  { basePrice: 580,    volatility: 0.022, trendBias:  0.03, avgVolume: 800000  },
  solusdt:  { basePrice: 145,    volatility: 0.035, trendBias:  0.08, avgVolume: 1200000 },
  xrpusdt:  { basePrice: 0.62,   volatility: 0.030, trendBias: -0.02, avgVolume: 600000  },
  adausdt:  { basePrice: 0.45,   volatility: 0.028, trendBias:  0.01, avgVolume: 400000  },
  dogeusdt: { basePrice: 0.085,  volatility: 0.040, trendBias:  0.00, avgVolume: 350000  },
  dotusdt:  { basePrice: 7.50,   volatility: 0.030, trendBias: -0.03, avgVolume: 300000  },
  maticusdt:{ basePrice: 0.92,   volatility: 0.032, trendBias:  0.04, avgVolume: 250000  },
  linkusdt: { basePrice: 18.50,  volatility: 0.028, trendBias:  0.06, avgVolume: 350000  },
};

const DEFAULT_PAIR_CONFIG: PairConfig = {
  basePrice: 100,
  volatility: 0.025,
  trendBias: 0.0,
  avgVolume: 500000,
};

export function getPairConfig(pairId: string): PairConfig {
  return PAIR_CONFIGS[pairId] ?? DEFAULT_PAIR_CONFIG;
}

/* ═══════════════════════════════════════════════════════════════
   PAIR-AWARE DATA GENERATION (RECOMMENDED)
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate chart data specific to a trading pair
 * Uses pair config for realistic price/volatility
 */
export function generatePairChartData(pairId: string, timeframe: Timeframe = '1h') {
  const config = getPairConfig(pairId);
  const tfConfig = TIMEFRAME_CONFIG[timeframe];
  
  // Adjust volatility based on timeframe
  // Shorter timeframes = lower per-candle volatility
  const volatilityMultiplier = {
    '5m': 0.1,
    '15m': 0.2,
    '1h': 0.5,
    '4h': 0.8,
    '1d': 1.0,
    '1w': 1.5,
  }[timeframe];
  
  const adjustedVolatility = config.volatility * volatilityMultiplier;
  
  // Generate base candles with timeframe-specific intervals
  let candleData = generateCandlestickData(
    config.basePrice,
    adjustedVolatility,
    tfConfig.count,
    tfConfig.interval
  );
  
  // Apply trend bias if significant
  if (Math.abs(config.trendBias) > 0.05) {
    candleData = addTrend(candleData, config.trendBias * 0.001);
  }
  
  // Generate matching volume
  const volumeData = generateVolumeData(candleData, config.avgVolume);
  
  // Calculate stats
  const stats = calculateStats(candleData);
  
  return {
    candleData,
    volumeData,
    stats,
    config,
    timeframe,
  };
}

/**
 * Generic candlestick data generator with custom interval
 */
export function generateCandlestickData(
  basePrice: number,
  volatility: number,
  count: number,
  intervalSeconds: number
): CandlestickData[] {
  const now = Math.floor(Date.now() / 1000);
  const data: CandlestickData[] = [];
  
  let currentPrice = basePrice;
  
  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * intervalSeconds;
    
    // Random walk for price movement
    const change = (Math.random() - 0.5) * 2 * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    
    // High/Low with some randomness
    const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
    const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
    
    data.push({
      time,
      open,
      high,
      low,
      close,
    });
    
    currentPrice = close;
  }
  
  return data;
}

/* ═══════════════════════════════════════════════════════════════
   HELPER GENERATORS
   ═══════════════════════════════════════════════════════════════ */

/**
 * Generate 24h candlestick data (hourly candles)
 */
export function generate24hCandlestickData(
  basePrice: number,
  volatility: number,
  count: number = 24
): CandlestickData[] {
  return generateCandlestickData(basePrice, volatility, count, 60 * 60);
}

/**
 * Generate intraday data (5-minute candles for 24h)
 */
export function generateIntradayData(
  basePrice: number,
  volatility: number
): CandlestickData[] {
  return generateCandlestickData(basePrice, volatility, 288, 5 * 60);
}

/**
 * Apply a trend bias to existing candle data
 */
export function addTrend(
  data: CandlestickData[],
  trendPerCandle: number
): CandlestickData[] {
  return data.map((candle, i) => {
    const multiplier = 1 + trendPerCandle * i;
    return {
      ...candle,
      open: candle.open * multiplier,
      high: candle.high * multiplier,
      low: candle.low * multiplier,
      close: candle.close * multiplier,
    };
  });
}

/**
 * Generate volume data matching candlestick data
 */
export function generateVolumeData(
  candles: CandlestickData[],
  avgVolume: number = 1000000
): VolumeData[] {
  return candles.map((candle) => {
    const randomFactor = 0.3 + Math.random() * 1.4;
    const isUp = candle.close >= candle.open;
    return {
      time: candle.time,
      value: avgVolume * randomFactor / candles.length,
      color: isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
    };
  });
}

/**
 * Calculate statistics from candlestick data
 */
export function calculateStats(data: CandlestickData[]) {
  if (data.length === 0) {
    return { high: 0, low: 0, open: 0, close: 0, change: 0, changePercent: 0 };
  }
  
  const high = Math.max(...data.map(d => d.high));
  const low = Math.min(...data.map(d => d.low));
  const open = data[0].open;
  const close = data[data.length - 1].close;
  const change = close - open;
  const changePercent = open !== 0 ? (change / open) * 100 : 0;
  
  return { high, low, open, close, change, changePercent };
}