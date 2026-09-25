import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  LaunchpadProjectDetail,
  LaunchpadProjectListResponse,
  LaunchpadProjectSummary,
} from '../model/launchpad-types';

const summarySchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  logo: z.string(),
  logoColor: z.string(),
  description: z.string(),
  type: z.enum(['ido', 'ieo', 'launchpool']),
  status: z.enum(['upcoming', 'active', 'ended']),
  totalRaise: z.string(),
  price: z.number().nonnegative(),
  priceUnit: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  listingDate: z.string(),
  progress: z.number().min(0).max(100),
  participants: z.number().int().nonnegative(),
  subscribed: z.number().nonnegative(),
  allocation: z.number().nonnegative(),
  roi: z.number().optional(),
  tags: z.array(z.string()),
  kyc: z.boolean(),
  kycLevel: z.number().int().nonnegative(),
  whitelist: z.boolean(),
  chain: z.string(),
}) satisfies z.ZodType<LaunchpadProjectSummary>;

const detailSchema = summarySchema.extend({
  longDescription: z.string(),
  hardCap: z.string(),
  minBuy: z.number().nonnegative(),
  maxBuy: z.number().nonnegative(),
  contractAddress: z.string(),
  website: z.string(),
  twitter: z.string(),
  telegram: z.string(),
  tokenomics: z.array(
    z.object({ label: z.string(), percent: z.number().nonnegative(), color: z.string() }),
  ),
  vesting: z.array(
    z.object({
      label: z.string(),
      percent: z.number().nonnegative(),
      date: z.string(),
      status: z.enum(['locked', 'claimable', 'claimed']),
    }),
  ),
  team: z.array(
    z.object({ name: z.string(), role: z.string(), avatar: z.string(), verified: z.boolean() }),
  ),
  audit: z.object({
    auditor: z.string(),
    status: z.enum(['passed', 'pending', 'issues']),
    critical: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    reportUrl: z.string(),
  }),
  platformFee: z.number().nonnegative(),
  restrictions: z.array(z.string()),
}) satisfies z.ZodType<LaunchpadProjectDetail>;

const listSchema = z.object({
  projects: z.array(summarySchema),
  total: z.number().int().nonnegative(),
  activeCount: z.number().int().nonnegative(),
}) satisfies z.ZodType<LaunchpadProjectListResponse>;

export interface LaunchpadProjectQuery {
  status?: LaunchpadProjectSummary['status'];
  type?: LaunchpadProjectSummary['type'];
  search?: string;
}

export const launchpadApi = {
  async getProjects(
    query: LaunchpadProjectQuery = {},
    signal?: AbortSignal,
  ): Promise<LaunchpadProjectListResponse> {
    return listSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: '/launchpad/projects',
        query: { status: query.status, type: query.type, search: query.search },
        signal,
      }),
    );
  },

  async getProject(id: string, signal?: AbortSignal): Promise<LaunchpadProjectDetail> {
    return detailSchema.parse(
      await apiClient.request<unknown>({
        method: 'GET',
        path: `/launchpad/projects/${encodeURIComponent(id)}`,
        signal,
      }),
    );
  },
};
