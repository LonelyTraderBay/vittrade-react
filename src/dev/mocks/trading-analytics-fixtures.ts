import type {
  TradingAnalyticsPeriod,
  TradingAnalyticsResponse,
} from '@/features/trading/model/analytics-types';

const baseAnalytics: Omit<TradingAnalyticsResponse, 'period'> = {
  summary: {
    totalPnl: 1259.35,
    totalTrades: 104,
    winRate: 62.5,
    profitFactor: 1.86,
    averageTradePnl: 12.11,
    maxDrawdown: 340.2,
    bestDay: 520.85,
    worstDay: -340.2,
    largestWin: 193.8,
    largestLoss: -124,
  },
  dailyPnl: [
    { date: '01/03', pnl: 245.5, cumPnl: 245.5, trades: 8, wins: 5 },
    { date: '02/03', pnl: -120.3, cumPnl: 125.2, trades: 6, wins: 2 },
    { date: '03/03', pnl: 380.15, cumPnl: 505.35, trades: 12, wins: 9 },
    { date: '04/03', pnl: 55.8, cumPnl: 561.15, trades: 4, wins: 3 },
    { date: '05/03', pnl: 698.2, cumPnl: 1259.35, trades: 15, wins: 11 },
  ],
  bestTrades: [
    {
      id: 'analytics-best-1',
      pair: 'SOL/USDT',
      side: 'buy',
      entry: 165.4,
      exit: 178.32,
      quantity: 15,
      pnl: 193.8,
      roi: 7.8,
      date: '03/03',
    },
    {
      id: 'analytics-best-2',
      pair: 'BTC/USDT',
      side: 'buy',
      entry: 65200,
      exit: 67543,
      quantity: 0.08,
      pnl: 187.44,
      roi: 3.59,
      date: '05/03',
    },
  ],
  worstTrades: [
    {
      id: 'analytics-worst-1',
      pair: 'DOT/USDT',
      side: 'buy',
      entry: 8.45,
      exit: 7.83,
      quantity: 200,
      pnl: -124,
      roi: -7.34,
      date: '02/03',
    },
    {
      id: 'analytics-worst-2',
      pair: 'LINK/USDT',
      side: 'sell',
      entry: 13.8,
      exit: 14.23,
      quantity: 100,
      pnl: -43,
      roi: -3.12,
      date: '04/03',
    },
  ],
  assetBreakdown: [
    { asset: 'BTC', color: '#F7931A', trades: 28, pnl: 680.5, winRate: 67.8 },
    { asset: 'ETH', color: '#627EEA', trades: 22, pnl: 320.3, winRate: 59.1 },
    { asset: 'SOL', color: '#9945FF', trades: 18, pnl: 445.2, winRate: 72.2 },
    { asset: 'Other', color: '#6B7280', trades: 36, pnl: -186.65, winRate: 53.2 },
  ],
  hourlyDistribution: [
    { hour: '00-03', trades: 5, pnl: 45 },
    { hour: '03-06', trades: 3, pnl: -12 },
    { hour: '06-09', trades: 12, pnl: 230 },
    { hour: '09-12', trades: 28, pnl: 520 },
  ],
};

export function getTradingAnalytics(period: TradingAnalyticsPeriod): TradingAnalyticsResponse {
  return { period, ...baseAnalytics };
}
