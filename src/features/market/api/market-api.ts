import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  MarketPair,
  MarketPairsQuery,
  MarketPairsResponse,
  MarketWatchlistItem,
  MarketWatchlistResponse,
  MarketWatchlistUpdateRequest,
  MarketWatchlistCreateRequest,
  MarketOrderBookResponse,
  MarketRecentTradesResponse,
  MarketCandlesQuery,
  MarketCandlesResponse,
  MarketOverviewResponse,
  MarketMoversQuery,
  MarketMoversResponse,
  MarketPriceAlert,
  MarketPriceAlertCreateRequest,
  MarketPriceAlertUpdateRequest,
  MarketPriceAlertsQuery,
  MarketPriceAlertsResponse,
} from '../model/market-types';

const marketPairSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  price: z.number(),
  prevPrice: z.number(),
  change24h: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  volume24h: z.number(),
  marketCap: z.number(),
  sparklineData: z.array(z.number()),
  logoColor: z.string(),
  category: z.string(),
});

const marketPairsResponseSchema = z.object({
  items: z.array(marketPairSchema),
  nextCursor: z.string().optional(),
});

const marketWatchlistItemSchema = z.object({
  id: z.string().min(1),
  pairId: z.string().min(1),
  addedAt: z.string(),
  note: z.string().optional(),
});

const marketWatchlistResponseSchema = z.object({
  items: z.array(marketWatchlistItemSchema),
});

const orderBookEntrySchema = z.object({
  price: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  total: z.number().nonnegative(),
  depth: z.number().min(0).max(1),
});

const orderBookResponseSchema = z.object({
  bids: z.array(orderBookEntrySchema),
  asks: z.array(orderBookEntrySchema),
  updatedAt: z.string(),
});

const recentTradeSchema = z.object({
  id: z.string().min(1),
  price: z.number().nonnegative(),
  amount: z.number().nonnegative(),
  side: z.enum(['buy', 'sell']),
  time: z.string(),
});

const recentTradesResponseSchema = z.object({
  items: z.array(recentTradeSchema),
});

const marketCandleSchema = z
  .object({
    time: z.number().int().positive(),
    open: z.number().nonnegative(),
    high: z.number().nonnegative(),
    low: z.number().nonnegative(),
    close: z.number().nonnegative(),
    volume: z.number().nonnegative(),
  })
  .superRefine((candle, context) => {
    if (candle.high < Math.max(candle.open, candle.close)) {
      context.addIssue({
        code: 'custom',
        path: ['high'],
        message: 'Candle high must be at least its open and close prices.',
      });
    }
    if (candle.low > Math.min(candle.open, candle.close)) {
      context.addIssue({
        code: 'custom',
        path: ['low'],
        message: 'Candle low must be no greater than its open and close prices.',
      });
    }
  });

const marketCandlesResponseSchema = z
  .object({
    items: z.array(marketCandleSchema),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .superRefine(({ items }, context) => {
    for (let index = 1; index < items.length; index += 1) {
      if (items[index - 1].time >= items[index].time) {
        context.addIssue({
          code: 'custom',
          path: ['items', index, 'time'],
          message: 'Candles must have unique timestamps ordered oldest first.',
        });
      }
    }
  });

const marketOverviewStatsSchema = z.object({
  totalMarketCap: z.number().nonnegative(),
  totalMarketCapChange24h: z.number(),
  total24hVolume: z.number().nonnegative(),
  total24hVolumeChange: z.number(),
  btcDominance: z.number().min(0).max(100),
  ethDominance: z.number().min(0).max(100),
  totalCoins: z.number().int().nonnegative(),
  totalExchanges: z.number().int().nonnegative(),
  fearGreedIndex: z.number().int().min(0).max(100),
  fearGreedLabel: z.string(),
  activeCryptocurrencies: z.number().int().nonnegative(),
  defiTVL: z.number().nonnegative(),
  defiTVLChange24h: z.number(),
  stablecoinVolume24h: z.number().nonnegative(),
});

const marketOverviewBreadthSchema = z.object({
  advancing: z.number().int().nonnegative(),
  declining: z.number().int().nonnegative(),
  unchanged: z.number().int().nonnegative(),
  newATH: z.number().int().nonnegative(),
  dropping10Pct: z.number().int().nonnegative(),
});

const marketFearGreedPointSchema = z.object({
  date: z.string(),
  value: z.number().int().min(0).max(100),
  label: z.string(),
});

const marketSectorSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  nameVi: z.string(),
  color: z.string(),
  icon: z.string(),
  totalMarketCap: z.number().nonnegative(),
  change24h: z.number(),
  change7d: z.number(),
  change30d: z.number(),
  volume24h: z.number().nonnegative(),
  topCoins: z.array(z.string()),
  coinCount: z.number().int().nonnegative(),
  dominance: z.number().nonnegative(),
});

const marketMoverSummarySchema = z.object({
  id: z.string().min(1),
  symbol: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
  change1h: z.number(),
  change24h: z.number(),
  change7d: z.number(),
  volume24h: z.number().nonnegative(),
  volumeChange24h: z.number(),
  marketCap: z.number().nonnegative(),
  category: z.string(),
  color: z.string(),
  sparkline: z.array(z.number()),
  isNew: z.boolean().optional(),
  listingDate: z.string().optional(),
});

const marketOverviewResponseSchema = z.object({
  stats: marketOverviewStatsSchema,
  breadth: marketOverviewBreadthSchema,
  fearGreedHistory: z.array(marketFearGreedPointSchema),
  sectors: z.array(marketSectorSummarySchema),
  topGainers: z.array(marketMoverSummarySchema),
  topLosers: z.array(marketMoverSummarySchema),
  updatedAt: z.string(),
});

const marketMoversResponseSchema = z.object({
  items: z.array(marketMoverSummarySchema),
  updatedAt: z.string(),
});

const priceAlertSchema = z.object({
  id: z.string().min(1),
  pairId: z.string().min(1),
  symbol: z.string(),
  condition: z.enum(['above', 'below']),
  targetPrice: z.number().positive(),
  currentPrice: z.number().nonnegative(),
  isActive: z.boolean(),
  createdAt: z.string(),
  triggeredAt: z.string().optional(),
});

const priceAlertsResponseSchema = z.object({
  items: z.array(priceAlertSchema),
});

export interface MarketApi {
  listPairs(query?: MarketPairsQuery, signal?: AbortSignal): Promise<MarketPairsResponse>;
  getPair(pairId: string, signal?: AbortSignal): Promise<MarketPair>;
  getWatchlist(signal?: AbortSignal): Promise<MarketWatchlistResponse>;
  createWatchlistItem(
    request: MarketWatchlistCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<MarketWatchlistItem>;
  updateWatchlistItem(
    id: string,
    request: MarketWatchlistUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<MarketWatchlistItem>;
  deleteWatchlistItem(id: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
  getOrderBook(pairId: string, signal?: AbortSignal): Promise<MarketOrderBookResponse>;
  getRecentTrades(pairId: string, signal?: AbortSignal): Promise<MarketRecentTradesResponse>;
  getCandles(
    pairId: string,
    query: MarketCandlesQuery,
    signal?: AbortSignal,
  ): Promise<MarketCandlesResponse>;
  getOverview(signal?: AbortSignal): Promise<MarketOverviewResponse>;
  getMovers(query: MarketMoversQuery, signal?: AbortSignal): Promise<MarketMoversResponse>;
  listPriceAlerts(
    query?: MarketPriceAlertsQuery,
    signal?: AbortSignal,
  ): Promise<MarketPriceAlertsResponse>;
  createPriceAlert(
    request: MarketPriceAlertCreateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<MarketPriceAlert>;
  updatePriceAlert(
    id: string,
    request: MarketPriceAlertUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<MarketPriceAlert>;
  deletePriceAlert(id: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
}

export const marketApi: MarketApi = {
  async listPairs(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/market/pairs', query, signal },
      { retries: 2 },
    );
    return marketPairsResponseSchema.parse(response);
  },

  async getPair(pairId, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: `/market/pairs/${encodeURIComponent(pairId)}`, signal },
      { retries: 2 },
    );
    return marketPairSchema.parse(response);
  },
  async getWatchlist(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/market/watchlist', signal },
      { retries: 2 },
    );
    return marketWatchlistResponseSchema.parse(response);
  },
  async createWatchlistItem(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/market/watchlist',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return marketWatchlistItemSchema.parse(response);
  },
  async updateWatchlistItem(id, request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: `/market/watchlist/${encodeURIComponent(id)}`,
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return marketWatchlistItemSchema.parse(response);
  },
  async deleteWatchlistItem(id, idempotencyKey, signal) {
    await apiClient.request<unknown>(
      {
        method: 'DELETE',
        path: `/market/watchlist/${encodeURIComponent(id)}`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
  },
  async getOrderBook(pairId, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: `/market/pairs/${encodeURIComponent(pairId)}/orderbook`, signal },
      { retries: 2 },
    );
    return orderBookResponseSchema.parse(response);
  },
  async getRecentTrades(pairId, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: `/market/pairs/${encodeURIComponent(pairId)}/trades`, signal },
      { retries: 2 },
    );
    return recentTradesResponseSchema.parse(response);
  },
  async getCandles(pairId, query, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: `/market/pairs/${encodeURIComponent(pairId)}/candles`,
        query,
        signal,
      },
      { retries: 2 },
    );
    return marketCandlesResponseSchema.parse(response);
  },
  async getOverview(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/market/overview', signal },
      { retries: 2 },
    );
    return marketOverviewResponseSchema.parse(response);
  },
  async getMovers(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/market/movers', query, signal },
      { retries: 2 },
    );
    return marketMoversResponseSchema.parse(response);
  },
  async listPriceAlerts(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/market/price-alerts', query, signal },
      { retries: 2 },
    );
    return priceAlertsResponseSchema.parse(response);
  },
  async createPriceAlert(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/market/price-alerts',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return priceAlertSchema.parse(response);
  },
  async updatePriceAlert(id, request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: `/market/price-alerts/${encodeURIComponent(id)}`,
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return priceAlertSchema.parse(response);
  },
  async deletePriceAlert(id, idempotencyKey, signal) {
    await apiClient.request<unknown>(
      {
        method: 'DELETE',
        path: `/market/price-alerts/${encodeURIComponent(id)}`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
  },
};
