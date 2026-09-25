import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  CreateDCAPlanRequest,
  DCAPlan,
  DCASnapshot,
  UpdateDCAPlanRequest,
} from '../model/dca-types';

const dateSchema = z.string().datetime();
const planSchema = z.object({
  id: z.string(),
  coinSymbol: z.string(),
  coinName: z.string(),
  coinIcon: z.string(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  amountPerPurchase: z.number().positive(),
  nextExecution: dateSchema,
  status: z.enum(['active', 'paused', 'error']),
  totalInvested: z.number().nonnegative(),
  currentHoldings: z.number().nonnegative(),
  averageCost: z.number().nonnegative(),
  createdAt: dateSchema,
  lastPurchaseAt: dateSchema.optional(),
});

const snapshotSchema = z.object({
  overview: z.object({
    currentValue: z.number(),
    totalInvested: z.number(),
    profitLoss: z.number(),
    profitLossPercent: z.number(),
    activePlans: z.number(),
    pausedPlans: z.number(),
    errorPlans: z.number(),
    nextExecution: z.object({ relativeTime: z.string(), amount: z.number() }).nullable(),
  }),
  plans: z.array(planSchema),
  purchaseHistory: z.array(
    z.object({
      id: z.string(),
      planId: z.string(),
      coinSymbol: z.string(),
      date: dateSchema,
      amountVND: z.number(),
      coinAmount: z.number(),
      pricePerCoin: z.number(),
      status: z.enum(['completed', 'failed']),
    }),
  ),
  portfolioHistory: z.array(
    z.object({
      date: dateSchema,
      portfolioValue: z.number(),
      totalInvested: z.number(),
      hasPurchase: z.boolean(),
    }),
  ),
});

function mapPlan(plan: z.infer<typeof planSchema>): DCAPlan {
  return {
    ...plan,
    nextExecution: new Date(plan.nextExecution),
    createdAt: new Date(plan.createdAt),
    lastPurchaseAt: plan.lastPurchaseAt ? new Date(plan.lastPurchaseAt) : undefined,
  };
}

function mapSnapshot(response: unknown): DCASnapshot {
  const parsed = snapshotSchema.parse(response);
  return {
    overview: parsed.overview,
    plans: parsed.plans.map(mapPlan),
    purchaseHistory: parsed.purchaseHistory.map((item) => ({ ...item, date: new Date(item.date) })),
    portfolioHistory: parsed.portfolioHistory.map((item) => ({
      ...item,
      date: new Date(item.date),
    })),
  };
}

export interface DCAApi {
  getSnapshot(signal?: AbortSignal): Promise<DCASnapshot>;
  createPlan(
    request: CreateDCAPlanRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<DCAPlan>;
  updatePlan(
    planId: string,
    request: UpdateDCAPlanRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<DCAPlan>;
  deletePlan(planId: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
}

export const dcaApi: DCAApi = {
  async getSnapshot(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/dca/snapshot', signal },
      { retries: 2 },
    );
    return mapSnapshot(response);
  },
  async createPlan(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/dca/plans',
        body: { ...request, startDate: request.startDate?.toISOString() },
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return mapPlan(planSchema.parse(response));
  },
  async updatePlan(planId, request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: `/dca/plans/${encodeURIComponent(planId)}`,
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return mapPlan(planSchema.parse(response));
  },
  async deletePlan(planId, idempotencyKey, signal) {
    await apiClient.request<void>(
      {
        method: 'DELETE',
        path: `/dca/plans/${encodeURIComponent(planId)}`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
  },
};
