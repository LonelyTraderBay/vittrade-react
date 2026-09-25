import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  AdminAbTest,
  AdminFeatureFlag,
  AdminFeatureFlagUpdateRequest,
  AdminFunnelQuery,
  AdminFunnelResponse,
  AdminOverview,
} from '../model/admin-types';

const adminOverviewSchema = z.object({
  activeUsers: z.number().int().nonnegative(),
  verifiedUsers: z.number().int().nonnegative(),
  grossVolume: z.string().min(1),
  generatedAt: z.string().min(1),
});

const funnelResponseSchema = z.object({
  steps: z.array(
    z.object({
      key: z.string().min(1),
      count: z.number().int().nonnegative(),
      conversionRate: z.number().min(0).max(1),
    }),
  ),
});

const abTestSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  status: z.enum(['draft', 'running', 'paused', 'completed', 'expired']),
  owner: z.string().min(1),
  expiresAt: z.string().min(1),
  variants: z.array(
    z.object({
      key: z.string().min(1),
      rolloutPercentage: z.number().int().min(0).max(100),
    }),
  ),
});

const abTestsResponseSchema = z.object({ tests: z.array(abTestSchema) });

const featureFlagSchema = z.object({
  key: z.string().min(1),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0).max(100),
  owner: z.string().min(1),
  expiresAt: z.string().min(1),
  rollbackBehavior: z.string().optional(),
});

export interface AdminApi {
  getOverview(signal?: AbortSignal): Promise<AdminOverview>;
  getFunnel(query?: AdminFunnelQuery, signal?: AbortSignal): Promise<AdminFunnelResponse>;
  listAbTests(signal?: AbortSignal): Promise<{ tests: AdminAbTest[] }>;
  getAbTest(testId: string, signal?: AbortSignal): Promise<AdminAbTest>;
  updateFeatureFlag(
    flagKey: string,
    request: AdminFeatureFlagUpdateRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<AdminFeatureFlag>;
}

export const adminApi: AdminApi = {
  async getOverview(signal) {
    return adminOverviewSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/admin/overview', signal }),
    );
  },

  async getFunnel(query, signal) {
    return funnelResponseSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/admin/analytics/funnel',
        query: query ? { from: query.from, to: query.to } : undefined,
        signal,
      }),
    );
  },

  async listAbTests(signal) {
    return abTestsResponseSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/admin/analytics/ab-tests',
        signal,
      }),
    );
  },

  async getAbTest(testId, signal) {
    return abTestSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/admin/analytics/ab-tests/${encodeURIComponent(testId)}`,
        signal,
      }),
    );
  },

  async updateFeatureFlag(flagKey, request, idempotencyKey, signal) {
    return featureFlagSchema.parse(
      await apiClient.request<unknown>(
        {
          method: 'PATCH',
          path: `/admin/feature-flags/${encodeURIComponent(flagKey)}`,
          body: request,
          idempotencyKey,
          signal,
        },
        { retries: 0 },
      ),
    );
  },
};
