import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { marketApi } from '../api/market-api';
import type {
  MarketCandlesQuery,
  MarketMoversQuery,
  MarketPairsQuery,
  MarketPriceAlertsQuery,
} from './market-types';

export const marketQueryKeys = {
  all: ['market'] as const,
  pairs: (query: MarketPairsQuery = {}) => ['market', 'pairs', query] as const,
  pair: (pairId: string) => ['market', 'pair', pairId] as const,
  watchlist: ['market', 'watchlist'] as const,
  watchlistForUser: (userId: string) => ['market', 'watchlist', userId] as const,
  orderBook: (pairId: string) => ['market', 'order-book', pairId] as const,
  recentTrades: (pairId: string) => ['market', 'recent-trades', pairId] as const,
  candles: (pairId: string, query: MarketCandlesQuery) =>
    ['market', 'candles', pairId, query] as const,
  overview: ['market', 'overview'] as const,
  movers: (query: MarketMoversQuery) => ['market', 'movers', query] as const,
  priceAlerts: (query: MarketPriceAlertsQuery = {}) => ['market', 'price-alerts', query] as const,
};

export function useMarketPairsQuery(query: MarketPairsQuery = {}) {
  return useQuery({
    queryKey: marketQueryKeys.pairs(query),
    queryFn: ({ signal }) => marketApi.listPairs(query, signal),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMarketPairQuery(pairId: string) {
  return useQuery({
    queryKey: marketQueryKeys.pair(pairId),
    queryFn: ({ signal }) => marketApi.getPair(pairId, signal),
    enabled: Boolean(pairId),
    staleTime: 5_000,
  });
}

export function useMarketWatchlistQuery(options: { enabled?: boolean; userId?: string } = {}) {
  return useQuery({
    queryKey: marketQueryKeys.watchlistForUser(options.userId ?? 'anonymous'),
    queryFn: ({ signal }) => marketApi.getWatchlist(signal),
    enabled: Boolean(options.userId) && (options.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useMarketWatchlistCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof marketApi.createWatchlistItem>[0];
      idempotencyKey: string;
    }) => marketApi.createWatchlistItem(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketQueryKeys.watchlist });
      await queryClient.invalidateQueries({ queryKey: ['market', 'pairs'] });
    },
  });
}

export function useMarketWatchlistUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      idempotencyKey,
    }: {
      id: string;
      request: Parameters<typeof marketApi.updateWatchlistItem>[1];
      idempotencyKey: string;
    }) => marketApi.updateWatchlistItem(id, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketQueryKeys.watchlist });
      await queryClient.invalidateQueries({ queryKey: ['market', 'pairs'] });
    },
  });
}

export function useMarketWatchlistDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      marketApi.deleteWatchlistItem(id, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: marketQueryKeys.watchlist });
      await queryClient.invalidateQueries({ queryKey: ['market', 'pairs'] });
    },
  });
}

export function useMarketOrderBookQuery(pairId: string) {
  return useQuery({
    queryKey: marketQueryKeys.orderBook(pairId),
    queryFn: ({ signal }) => marketApi.getOrderBook(pairId, signal),
    enabled: Boolean(pairId),
    staleTime: 1_000,
    refetchInterval: 5_000,
  });
}

export function useMarketRecentTradesQuery(pairId: string) {
  return useQuery({
    queryKey: marketQueryKeys.recentTrades(pairId),
    queryFn: ({ signal }) => marketApi.getRecentTrades(pairId, signal),
    enabled: Boolean(pairId),
    staleTime: 1_000,
    refetchInterval: 5_000,
  });
}

export function useMarketCandlesQuery(
  pairId: string,
  query: MarketCandlesQuery = { interval: '1h', limit: 24 },
) {
  return useQuery({
    queryKey: marketQueryKeys.candles(pairId, query),
    queryFn: ({ signal }) => marketApi.getCandles(pairId, query, signal),
    enabled: Boolean(pairId),
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useMarketOverviewQuery() {
  return useQuery({
    queryKey: marketQueryKeys.overview,
    queryFn: ({ signal }) => marketApi.getOverview(signal),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarketMoversQuery(query: MarketMoversQuery) {
  return useQuery({
    queryKey: marketQueryKeys.movers(query),
    queryFn: ({ signal }) => marketApi.getMovers(query, signal),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useMarketPriceAlertsQuery(query: MarketPriceAlertsQuery = {}) {
  return useQuery({
    queryKey: marketQueryKeys.priceAlerts(query),
    queryFn: ({ signal }) => marketApi.listPriceAlerts(query, signal),
    staleTime: 10_000,
  });
}

export function useMarketPriceAlertCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof marketApi.createPriceAlert>[0];
      idempotencyKey: string;
    }) => marketApi.createPriceAlert(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['market', 'price-alerts'] });
    },
  });
}

export function useMarketPriceAlertUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      idempotencyKey,
    }: {
      id: string;
      request: Parameters<typeof marketApi.updatePriceAlert>[1];
      idempotencyKey: string;
    }) => marketApi.updatePriceAlert(id, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['market', 'price-alerts'] });
    },
  });
}

export function useMarketPriceAlertDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      marketApi.deletePriceAlert(id, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['market', 'price-alerts'] });
    },
  });
}
