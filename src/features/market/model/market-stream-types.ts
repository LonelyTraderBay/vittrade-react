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
  nextFundingIn: number;
  timestamp: number;
}
