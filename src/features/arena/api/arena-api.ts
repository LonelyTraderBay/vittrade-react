import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  ArenaChallengeDetail,
  ArenaModeDetail,
  JoinArenaChallengeResponse,
} from '../model/arena-types';

const creatorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  trustScore: z.number().min(0).max(100),
  fairPlayBadge: z.boolean(),
});
const roomSchema = z.object({
  id: z.string(),
  title: z.string(),
  format: z.string(),
  slotsTotal: z.number().int().positive(),
  slotsFilled: z.number().int().nonnegative(),
  entryPoints: z.number().nonnegative(),
  status: z.enum(['waiting', 'in_progress', 'completed']),
});
const modeSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  cloneCount: z.number().int().nonnegative(),
  activeChallenges: z.number().int().nonnegative(),
  fairPlay: z.boolean(),
});
const modeSchema = z.object({
  ...modeSummarySchema.shape,
  template: z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string(),
    color: z.string(),
    complexity: z.enum(['easy', 'medium', 'advanced']),
  }),
  creator: creatorSchema,
  tags: z.array(z.string()),
  completionRate: z.number().min(0).max(100),
  allowedFormats: z.array(z.string()),
  winCondition: z.string().optional(),
  resolutionType: z.string().optional(),
  avgDuration: z.string().optional(),
  disputeRiskLevel: z.enum(['low', 'medium', 'high']).optional(),
  relatedRooms: z.array(roomSchema),
  relatedModes: z.array(modeSummarySchema),
}) satisfies z.ZodType<ArenaModeDetail>;
const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  role: z.enum(['host', 'player', 'captain']),
  status: z.enum(['joined', 'invited', 'waiting', 'confirmed', 'left']),
  teamId: z.string().optional(),
});
const challengeSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  modeId: z.string(),
  modeName: z.string(),
  creator: creatorSchema,
  entryPoints: z.number().nonnegative(),
  prizePool: z.number().nonnegative(),
  slotsTotal: z.number().int().positive(),
  slotsFilled: z.number().int().nonnegative(),
  status: z.enum(['waiting', 'in_progress', 'completed']),
  privacy: z.enum(['public', 'private', 'friends_only']),
  format: z.string(),
  rules: z.array(z.string()),
  startAt: z.string(),
  endAt: z.string(),
  leaderboard: z.array(
    z.object({
      rank: z.number().int(),
      name: z.string(),
      avatar: z.string(),
      points: z.number(),
      accuracy: z.number().optional(),
    }),
  ),
  challengeState: z
    .enum([
      'open',
      'full',
      'live',
      'pending_result',
      'resolved',
      'under_review',
      'reported',
      'hidden',
      'canceled',
      'error',
      'offline',
    ])
    .optional(),
  participantLayout: z.enum(['1v1', '1vN', 'NvN', 'open_lobby']).optional(),
  participants: z.array(participantSchema),
  winCondition: z.string().optional(),
  resolutionMethod: z.string().optional(),
  evidenceRequirement: z.string().optional(),
  voidRule: z.string().optional(),
  warningBanners: z.array(z.string()).optional(),
  rewardTiers: z.array(z.object({ rank: z.string(), pct: z.number() })).optional(),
  refundPolicy: z.string().optional(),
}) satisfies z.ZodType<ArenaChallengeDetail>;
const joinedSchema = z.object({
  challenge: challengeSchema,
  auditEventId: z.string(),
}) satisfies z.ZodType<JoinArenaChallengeResponse>;

export interface ArenaApi {
  getMode(id: string, signal?: AbortSignal): Promise<ArenaModeDetail>;
  getChallenge(id: string, signal?: AbortSignal): Promise<ArenaChallengeDetail>;
  joinChallenge(id: string, idempotencyKey: string): Promise<JoinArenaChallengeResponse>;
}

export const arenaApi: ArenaApi = {
  async getMode(id, signal) {
    return modeSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/arena/modes/${encodeURIComponent(id)}`,
        signal,
      }),
    );
  },
  async getChallenge(id, signal) {
    return challengeSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/arena/challenges/${encodeURIComponent(id)}`,
        signal,
      }),
    );
  },
  async joinChallenge(id, idempotencyKey) {
    return joinedSchema.parse(
      await apiClient.request<unknown>(
        {
          method: 'POST',
          path: `/arena/challenges/${encodeURIComponent(id)}/join`,
          body: {},
          idempotencyKey,
        },
        { retries: 0 },
      ),
    );
  },
};
