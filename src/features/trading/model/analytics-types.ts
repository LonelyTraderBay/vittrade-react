export type TradingAnalyticsPeriod = '7D' | '1M' | '3M' | '1Y';

export interface TradingAnalyticsQuery {
  period?: TradingAnalyticsPeriod;
}

export interface TradingAnalyticsDay {
  date: string;
  pnl: number;
  cumPnl: number;
  trades: number;
  wins: number;
}

export interface TradingAnalyticsTrade {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  entry: number;
  exit: number;
  quantity: number;
  pnl: number;
  roi: number;
  date: string;
}

export interface TradingAnalyticsAsset {
  asset: string;
  color: string;
  trades: number;
  pnl: number;
  winRate: number;
}

export interface TradingAnalyticsTimeBucket {
  hour: string;
  trades: number;
  pnl: number;
}

export interface TradingAnalyticsSummary {
  totalPnl: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTradePnl: number;
  maxDrawdown: number;
  bestDay: number;
  worstDay: number;
  largestWin: number;
  largestLoss: number;
}

export interface TradingAnalyticsResponse {
  period: TradingAnalyticsPeriod;
  summary: TradingAnalyticsSummary;
  dailyPnl: TradingAnalyticsDay[];
  bestTrades: TradingAnalyticsTrade[];
  worstTrades: TradingAnalyticsTrade[];
  assetBreakdown: TradingAnalyticsAsset[];
  hourlyDistribution: TradingAnalyticsTimeBucket[];
}
