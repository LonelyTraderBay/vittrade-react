import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  CreateEarnPositionRequest,
  EarnReceipt,
  EarnSnapshot,
  EarnTransactionPage,
  EarnDomain,
  RedeemEarnPositionRequest,
} from '../model/earn-types';

const productSchema = z.object({
  id: z.string(),
  domain: z.enum(['savings', 'staking']),
  type: z.enum(['flexible', 'fixed', 'defi']),
  name: z.string(),
  asset: z.string(),
  apy: z.number().nonnegative(),
  apyBoost: z.number().nonnegative().optional(),
  minAmount: z.number().positive(),
  remainingQuota: z.string(),
  participants: z.number().int().nonnegative(),
  totalStaked: z.string(),
  lockDays: z.number().int().positive().optional(),
  color: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  isHot: z.boolean().optional(),
  isNew: z.boolean().optional(),
});

const positionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  product: z.string(),
  asset: z.string(),
  amount: z.number().nonnegative(),
  earned: z.number().nonnegative(),
  apy: z.number().nonnegative(),
  startDate: z.string(),
  endDate: z.string().optional(),
  type: z.enum(['flexible', 'fixed', 'defi']),
  color: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  lockDays: z.number().int().positive().optional(),
});

const snapshotSchema = z.object({
  products: z.array(productSchema),
  positions: z.array(positionSchema),
  balances: z.record(z.string(), z.number().nonnegative()),
  summary: z.object({
    totalDepositedUsd: z.number().nonnegative(),
    totalEarnedUsd: z.number().nonnegative(),
    averageApy: z.number().nonnegative(),
    activePositions: z.number().int().nonnegative(),
  }),
});

const receiptSchema = z.object({
  id: z.string(),
  operation: z.enum(['subscribe', 'redeem']),
  productId: z.string(),
  positionId: z.string().optional(),
  asset: z.string(),
  amount: z.number().positive(),
  status: z.enum(['pending', 'completed']),
  createdAt: z.string(),
});

const transactionPageSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      domain: z.enum(['savings', 'staking']),
      operation: z.enum(['subscribe', 'redeem']),
      productId: z.string(),
      product: z.string(),
      asset: z.string(),
      amount: z.number().positive(),
      status: z.enum(['pending', 'completed', 'failed']),
      createdAt: z.string().datetime(),
    }),
  ),
  nextCursor: z.string().optional(),
});

export interface EarnTransactionQuery {
  domain: EarnDomain;
  cursor?: string;
  limit?: number;
}

export interface EarnApi {
  getSnapshot(signal?: AbortSignal): Promise<EarnSnapshot>;
  getTransactions(query: EarnTransactionQuery, signal?: AbortSignal): Promise<EarnTransactionPage>;
  subscribe(
    request: CreateEarnPositionRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<EarnReceipt>;
  redeem(
    request: RedeemEarnPositionRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<EarnReceipt>;
}

export const earnApi: EarnApi = {
  async getSnapshot(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/earn/snapshot', signal },
      { retries: 2 },
    );
    return snapshotSchema.parse(response);
  },
  async getTransactions(query, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'GET',
        path: '/earn/transactions',
        query: { domain: query.domain, cursor: query.cursor, limit: query.limit ?? 25 },
        signal,
      },
      { retries: 2 },
    );
    return transactionPageSchema.parse(response);
  },
  async subscribe(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'POST', path: '/earn/subscriptions', body: request, signal, idempotencyKey },
      { retries: 0 },
    );
    return receiptSchema.parse(response);
  },
  async redeem(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'POST', path: '/earn/redemptions', body: request, signal, idempotencyKey },
      { retries: 0 },
    );
    return receiptSchema.parse(response);
  },
};
