import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  DiscoverySearchResponse,
  DiscoveryTopicId,
  DiscoveryTopicResponse,
} from '../model/discovery-types';

const topicSchema = z.object({
  id: z.enum(['crypto', 'macro', 'politics', 'sports', 'tech', 'ai', 'culture', 'community']),
  label: z.string(),
  color: z.string(),
  description: z.string(),
});
const predictionSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  topOutcome: z.object({ label: z.string(), chance: z.number(), color: z.string() }),
  volume24h: z.number().nonnegative(),
  participants: z.number().int().nonnegative(),
  status: z.enum(['active', 'resolved']),
  isTrending: z.boolean().optional(),
});
const modeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
  cloneCount: z.number().int().nonnegative(),
  activeChallenges: z.number().int().nonnegative(),
  fairPlay: z.boolean(),
  creator: z.object({ id: z.string(), name: z.string(), avatar: z.string() }),
});
const roomSchema = z.object({
  id: z.string(),
  title: z.string(),
  modeId: z.string(),
  format: z.string(),
  slotsTotal: z.number().int().positive(),
  slotsFilled: z.number().int().nonnegative(),
  entryPoints: z.number().nonnegative(),
  status: z.enum(['waiting', 'in_progress', 'completed']),
  creator: z.object({ name: z.string(), avatar: z.string() }),
});
const creatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  bio: z.string().optional(),
  trustScore: z.number().min(0).max(100),
  fairPlayBadge: z.boolean(),
});
const pairSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  baseAsset: z.string(),
  quoteAsset: z.string(),
  price: z.number(),
  change24h: z.number(),
  volume24h: z.number().nonnegative(),
  logoColor: z.string(),
});

const searchSchema = z.object({
  query: z.string(),
  predictions: z.array(predictionSchema),
  arenaModes: z.array(modeSchema),
  arenaRooms: z.array(roomSchema),
  creators: z.array(creatorSchema),
  tradingPairs: z.array(pairSchema),
}) satisfies z.ZodType<DiscoverySearchResponse>;

const topicResponseSchema = z.object({
  topic: topicSchema,
  stats: z.object({
    events: z.number().int().nonnegative(),
    rooms: z.number().int().nonnegative(),
    modes: z.number().int().nonnegative(),
    creators: z.number().int().nonnegative(),
  }),
  predictions: z.array(predictionSchema),
  arenaRooms: z.array(roomSchema),
  arenaModes: z.array(modeSchema),
  creators: z.array(creatorSchema),
}) satisfies z.ZodType<DiscoveryTopicResponse>;

export interface DiscoveryApi {
  search(query: string, signal?: AbortSignal): Promise<DiscoverySearchResponse>;
  getTopic(topicId: DiscoveryTopicId, signal?: AbortSignal): Promise<DiscoveryTopicResponse>;
}

export const discoveryApi: DiscoveryApi = {
  async search(query, signal) {
    return searchSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/discovery/search',
        query: { query },
        signal,
      }),
    );
  },
  async getTopic(topicId, signal) {
    return topicResponseSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/discovery/topics/${encodeURIComponent(topicId)}`,
        signal,
      }),
    );
  },
};
