import { useQuery } from '@tanstack/react-query';
import { tradingAnalyticsApi } from '../api/analytics-api';
import type { TradingAnalyticsQuery } from './analytics-types';

export const tradingAnalyticsQueryKeys = {
  analytics: (query: TradingAnalyticsQuery) => ['trading', 'analytics', query] as const,
};

export function useTradingAnalyticsQuery(query: TradingAnalyticsQuery = {}) {
  return useQuery({
    queryKey: tradingAnalyticsQueryKeys.analytics(query),
    queryFn: ({ signal }) => tradingAnalyticsApi.getAnalytics(query, signal),
    staleTime: 30_000,
  });
}
