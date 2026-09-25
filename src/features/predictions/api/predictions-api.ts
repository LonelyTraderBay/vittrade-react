import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  LeaderboardTrader,
  PlacePredictionOrderRequest,
  PredictionActivity,
  PredictionEvent,
  PredictionEventsQuery,
  PredictionOrderReceipt,
  PredictionPosition,
  PredictionReward,
} from '../model/prediction-types';

const outcomeSchema = z.object({ label: z.string(), chance: z.number(), color: z.string() });
const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  outcomes: z.array(outcomeSchema),
  volume24h: z.number().nonnegative(),
  totalVolume: z.number().nonnegative(),
  endDate: z.string(),
  liquidity: z.number().nonnegative(),
  participants: z.number().int().nonnegative(),
  status: z.enum(['active', 'resolved']),
  resolvedOutcome: z.string().optional(),
  isNew: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  change24h: z.number(),
  createdAt: z.string(),
});
const positionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  outcome: z.string(),
  shares: z.number(),
  avgPrice: z.number(),
  currentPrice: z.number(),
  investedAmount: z.number(),
  currentValue: z.number(),
  pnl: z.number(),
  pnlPct: z.number(),
  status: z.enum(['open', 'won', 'lost']),
  purchasedAt: z.string(),
});
const rewardSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  category: z.string(),
  maxSpread: z.number(),
  minShares: z.number(),
  dailyReward: z.number(),
  earningsPct: z.number(),
  priceChange24h: z.number(),
  isFavorite: z.boolean().optional(),
});
const traderSchema = z.object({
  rank: z.number().int(),
  user: z.string(),
  avatar: z.string(),
  pnl: z.number(),
  pnlPct: z.number(),
  volume: z.number(),
  trades: z.number().int(),
  winRate: z.number(),
  biggestWin: z.number().optional(),
  biggestWinMarket: z.string().optional(),
});
const activitySchema = z.object({
  id: z.string(),
  user: z.string(),
  avatar: z.string(),
  action: z.enum(['bought', 'sold']),
  outcome: z.string(),
  eventId: z.string(),
  price: z.number(),
  amount: z.number(),
  shares: z.number(),
  timestamp: z.string(),
});
const receiptSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  outcome: z.string(),
  side: z.enum(['buy', 'sell']),
  orderType: z.enum(['market', 'limit']),
  shares: z.number(),
  filledShares: z.number(),
  price: z.number(),
  avgPrice: z.number(),
  total: z.number(),
  fee: z.number(),
  status: z.enum(['submitted', 'accepted', 'partially_filled', 'filled', 'canceled', 'rejected']),
  createdAt: z.string(),
  updatedAt: z.string(),
  timeline: z.array(z.object({ label: z.string(), date: z.string(), done: z.boolean() })),
});

export interface PredictionsApi {
  listEvents(
    query?: PredictionEventsQuery,
    signal?: AbortSignal,
  ): Promise<{ items: PredictionEvent[] }>;
  getEvent(id: string, signal?: AbortSignal): Promise<PredictionEvent>;
  listPositions(signal?: AbortSignal): Promise<{ items: PredictionPosition[] }>;
  listRewards(signal?: AbortSignal): Promise<{ items: PredictionReward[] }>;
  listLeaderboard(period?: string, signal?: AbortSignal): Promise<{ items: LeaderboardTrader[] }>;
  listActivity(signal?: AbortSignal): Promise<{ items: PredictionActivity[] }>;
  getOrderReceipt(id: string, signal?: AbortSignal): Promise<PredictionOrderReceipt>;
  placeOrder(
    request: PlacePredictionOrderRequest,
    idempotencyKey: string,
  ): Promise<PredictionOrderReceipt>;
}

export const predictionsApi: PredictionsApi = {
  async listEvents(query, signal) {
    return z.object({ items: z.array(eventSchema) }).parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/predictions/events',
        query,
        signal,
      }),
    );
  },
  async getEvent(id, signal) {
    return eventSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/predictions/events/${encodeURIComponent(id)}`,
        signal,
      }),
    );
  },
  async listPositions(signal) {
    return z
      .object({ items: z.array(positionSchema) })
      .parse(
        await apiClient.request<unknown>({ method: 'GET', path: '/predictions/positions', signal }),
      );
  },
  async listRewards(signal) {
    return z
      .object({ items: z.array(rewardSchema) })
      .parse(
        await apiClient.request<unknown>({ method: 'GET', path: '/predictions/rewards', signal }),
      );
  },
  async listLeaderboard(period = 'today', signal) {
    return z.object({ items: z.array(traderSchema) }).parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/predictions/leaderboard',
        query: { period },
        signal,
      }),
    );
  },
  async listActivity(signal) {
    return z
      .object({ items: z.array(activitySchema) })
      .parse(
        await apiClient.request<unknown>({ method: 'GET', path: '/predictions/activity', signal }),
      );
  },
  async getOrderReceipt(id, signal) {
    return receiptSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/predictions/orders/${encodeURIComponent(id)}`,
        signal,
      }),
    );
  },
  async placeOrder(request, idempotencyKey) {
    return receiptSchema.parse(
      await apiClient.request<unknown>(
        {
          method: 'POST',
          path: '/predictions/orders',
          body: request,
          idempotencyKey,
        },
        { retries: 0 },
      ),
    );
  },
};
