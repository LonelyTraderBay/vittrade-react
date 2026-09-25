import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  TradingAnalyticsPeriod,
  TradingAnalyticsQuery,
  TradingAnalyticsResponse,
} from '../model/analytics-types';

const periodSchema = z.enum(['7D', '1M', '3M', '1Y']);

const analyticsSchema = z.object({
  period: periodSchema,
  summary: z.object({
    totalPnl: z.number(),
    totalTrades: z.number().int().nonnegative(),
    winRate: z.number().min(0).max(100),
    profitFactor: z.number().nonnegative(),
    averageTradePnl: z.number(),
    maxDrawdown: z.number().nonnegative(),
    bestDay: z.number(),
    worstDay: z.number(),
    largestWin: z.number(),
    largestLoss: z.number(),
  }),
  dailyPnl: z.array(
    z.object({
      date: z.string(),
      pnl: z.number(),
      cumPnl: z.number(),
      trades: z.number().int().nonnegative(),
      wins: z.number().int().nonnegative(),
    }),
  ),
  bestTrades: z.array(
    z.object({
      id: z.string(),
      pair: z.string(),
      side: z.enum(['buy', 'sell']),
      entry: z.number(),
      exit: z.number(),
      quantity: z.number().positive(),
      pnl: z.number(),
      roi: z.number(),
      date: z.string(),
    }),
  ),
  worstTrades: z.array(
    z.object({
      id: z.string(),
      pair: z.string(),
      side: z.enum(['buy', 'sell']),
      entry: z.number(),
      exit: z.number(),
      quantity: z.number().positive(),
      pnl: z.number(),
      roi: z.number(),
      date: z.string(),
    }),
  ),
  assetBreakdown: z.array(
    z.object({
      asset: z.string(),
      color: z.string(),
      trades: z.number().int().nonnegative(),
      pnl: z.number(),
      winRate: z.number().min(0).max(100),
    }),
  ),
  hourlyDistribution: z.array(
    z.object({
      hour: z.string(),
      trades: z.number().int().nonnegative(),
      pnl: z.number(),
    }),
  ),
});

export const tradingAnalyticsApi = {
  async getAnalytics(
    query: TradingAnalyticsQuery = {},
    signal?: AbortSignal,
  ): Promise<TradingAnalyticsResponse> {
    return analyticsSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/trading/analytics',
        query: { period: query.period },
        signal,
      }),
    );
  },
};

export type { TradingAnalyticsPeriod };
