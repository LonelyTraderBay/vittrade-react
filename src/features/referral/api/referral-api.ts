import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type { ReferralOverviewResponse } from '../model/referral-types';

const tierSchema = z.object({
  name: z.string(),
  nameEn: z.string(),
  friends: z.number().int().nonnegative(),
  commission: z.number().nonnegative(),
  color: z.string(),
  icon: z.string(),
  kycBonus: z.number().nonnegative(),
});
const responseSchema = z.object({
  referralCode: z.string(),
  stats: z.object({
    totalFriends: z.number().int().nonnegative(),
    activeFriends: z.number().int().nonnegative(),
    kycCompleted: z.number().int().nonnegative(),
    totalCommission: z.number().nonnegative(),
    pendingCommission: z.number().nonnegative(),
    totalVolume: z.number().nonnegative(),
    thisMonthCommission: z.number().nonnegative(),
    thisMonthFriends: z.number().int().nonnegative(),
  }),
  currentTier: tierSchema,
  nextTier: tierSchema.optional(),
  friends: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      avatar: z.string(),
      joinedDate: z.string(),
      status: z.enum(['pending_kyc', 'kyc_done', 'active_trader', 'inactive']),
      totalVolume: z.number().nonnegative(),
      totalCommission: z.number().nonnegative(),
      isActive: z.boolean(),
    }),
  ),
  campaign: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    bonusLabel: z.string(),
    daysLeft: z.number().int().nonnegative(),
    totalParticipants: z.number().int().nonnegative(),
  }),
}) satisfies z.ZodType<ReferralOverviewResponse>;

export const referralApi = {
  async getOverview(signal?: AbortSignal): Promise<ReferralOverviewResponse> {
    return responseSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/referral/overview', signal }),
    );
  },
};
