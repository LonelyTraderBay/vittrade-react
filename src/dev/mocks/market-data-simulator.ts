import type {
  FundingRateData,
  Liquidation,
  LongShortRatioData,
  OpenInterestData,
  TopTraderData,
} from '@/features/market/model/market-stream-types';
import { devMockNowMs, nextDevMockId, nextDevMockRandom } from './scenario-runtime';

interface SimulatorHandlers {
  onConnected: () => void;
  onLiquidation: (value: Liquidation) => void;
  onOpenInterest: (value: OpenInterestData) => void;
  onLongShortRatio: (value: LongShortRatioData) => void;
  onTopTraders: (value: TopTraderData) => void;
  onFundingRate: (value: FundingRateData) => void;
}

const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'ADA/USDT'] as const;
const prices = {
  'BTC/USDT': 67_543,
  'ETH/USDT': 3_245,
  'SOL/USDT': 145,
  'BNB/USDT': 425,
  'ADA/USDT': 0.58,
};

function generateLiquidation(): Liquidation {
  const pair = pairs[Math.floor(nextDevMockRandom() * pairs.length)];
  const basePrice = prices[pair];
  const sizeRandom = nextDevMockRandom();
  const size =
    sizeRandom > 0.95
      ? 500_000 + nextDevMockRandom() * 1_500_000
      : sizeRandom > 0.8
        ? 50_000 + nextDevMockRandom() * 450_000
        : 1_000 + nextDevMockRandom() * 49_000;

  return {
    id: nextDevMockId('liq'),
    timestamp: devMockNowMs(),
    pair,
    side: nextDevMockRandom() > 0.55 ? 'long' : 'short',
    size,
    price: basePrice + (nextDevMockRandom() - 0.5) * basePrice * 0.02,
    exchange: 'Development simulator',
  };
}

function generateOpenInterest(previous: OpenInterestData | null): OpenInterestData {
  const base = previous?.current ?? 25_680_000_000;
  const change = (nextDevMockRandom() - 0.5) * base * 0.04;
  const current = Math.max(20_000_000_000, base + change);
  return {
    current,
    change24h: change,
    change24hPct: (change / base) * 100,
    high24h: Math.max(previous?.high24h ?? current, current),
    low24h: Math.min(previous?.low24h ?? current, current),
    timestamp: devMockNowMs(),
  };
}

function generateLongShortRatio(previous: LongShortRatioData | null): LongShortRatioData {
  const longPct = Math.max(
    30,
    Math.min(70, (previous?.longPct ?? 62.5) + (nextDevMockRandom() - 0.5) * 2),
  );
  return {
    longPct,
    shortPct: 100 - longPct,
    longAccounts: Math.floor(120_000 + nextDevMockRandom() * 10_000),
    shortAccounts: Math.floor(70_000 + nextDevMockRandom() * 10_000),
    longVolume: 17_000_000_000 + nextDevMockRandom() * 3_000_000_000,
    shortVolume: 10_000_000_000 + nextDevMockRandom() * 3_000_000_000,
    timestamp: devMockNowMs(),
  };
}

function generateTopTraders(previous: TopTraderData | null): TopTraderData {
  const change24h = (nextDevMockRandom() - 0.5) * 1.5;
  const longPct = Math.max(35, Math.min(65, (previous?.longPct ?? 58.3) + change24h));
  return { longPct, shortPct: 100 - longPct, change24h, timestamp: devMockNowMs() };
}

function generateFundingRate(previous: FundingRateData | null): FundingRateData {
  const rate = Math.max(
    -0.0003,
    Math.min(0.0003, (previous?.rate ?? 0.0001) + (nextDevMockRandom() - 0.5) * 0.00005),
  );
  return {
    rate,
    avgRate: 0.0001,
    nextFundingIn: 7_200 - ((devMockNowMs() / 1_000) % 7_200),
    timestamp: devMockNowMs(),
  };
}

export function startMarketDataSimulator(handlers: SimulatorHandlers): () => void {
  let openInterest: OpenInterestData | null = null;
  let longShortRatio: LongShortRatioData | null = null;
  let topTraders: TopTraderData | null = null;
  let fundingRate: FundingRateData | null = null;
  let active = true;
  let liquidationTimer: ReturnType<typeof setTimeout> | undefined;

  const emitLiquidation = () => {
    if (!active) return;
    handlers.onLiquidation(generateLiquidation());
    liquidationTimer = setTimeout(emitLiquidation, 2_000 + nextDevMockRandom() * 8_000);
  };

  handlers.onConnected();
  emitLiquidation();

  openInterest = generateOpenInterest(openInterest);
  handlers.onOpenInterest(openInterest);
  const openInterestTimer = setInterval(
    () => {
      openInterest = generateOpenInterest(openInterest);
      handlers.onOpenInterest(openInterest);
    },
    5 * 60 * 1_000,
  );

  longShortRatio = generateLongShortRatio(longShortRatio);
  handlers.onLongShortRatio(longShortRatio);
  const longShortRatioTimer = setInterval(() => {
    longShortRatio = generateLongShortRatio(longShortRatio);
    handlers.onLongShortRatio(longShortRatio);
  }, 15 * 1_000);

  topTraders = generateTopTraders(topTraders);
  handlers.onTopTraders(topTraders);
  const topTradersTimer = setInterval(() => {
    topTraders = generateTopTraders(topTraders);
    handlers.onTopTraders(topTraders);
  }, 60 * 1_000);

  fundingRate = generateFundingRate(fundingRate);
  handlers.onFundingRate(fundingRate);
  const fundingRateTimer = setInterval(() => {
    fundingRate = generateFundingRate(fundingRate);
    handlers.onFundingRate(fundingRate);
  }, 30 * 1_000);

  return () => {
    active = false;
    if (liquidationTimer) clearTimeout(liquidationTimer);
    clearInterval(openInterestTimer);
    clearInterval(longShortRatioTimer);
    clearInterval(topTradersTimer);
    clearInterval(fundingRateTimer);
  };
}
