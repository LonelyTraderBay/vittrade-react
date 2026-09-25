import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  ModifyOrderRequest,
  OrderListQuery,
  OrderListResponse,
  PlaceOrderRequest,
  TradingOrder,
  CopyProvidersQuery,
  CopyProvidersResponse,
  CopyProviderProfileResponse,
  CopyActivationReceipt,
  CopyConfigurationRequest,
  CopyRelationship,
  CopyRelationshipsResponse,
  StopCopyRequest,
} from '../model/trading-types';

const orderSchema = z
  .object({
    id: z.string().min(1),
    clientOrderId: z.string().optional(),
    symbol: z.string().min(1),
    side: z.enum(['buy', 'sell']),
    type: z.enum(['market', 'limit', 'stop', 'stop-limit', 'trailing', 'oco', 'bracket']),
    price: z.number().positive(),
    amount: z.number().positive(),
    filled: z.number().nonnegative(),
    status: z.enum(['open', 'filled', 'partial', 'cancelled', 'rejected']),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).optional(),
    fee: z.number().nonnegative(),
    tpPrice: z.number().optional(),
    slPrice: z.number().optional(),
    bracketMode: z.boolean().optional(),
    ocoLinked: z.boolean().optional(),
  })
  .superRefine((order, context) => {
    if (order.filled > order.amount) {
      context.addIssue({
        code: 'custom',
        path: ['filled'],
        message: 'Filled order amount cannot exceed the requested amount.',
      });
    }
    if (order.status === 'filled' && order.filled !== order.amount) {
      context.addIssue({
        code: 'custom',
        path: ['filled'],
        message: 'A filled order must have its full requested amount filled.',
      });
    }
    if (order.status === 'partial' && (order.filled <= 0 || order.filled >= order.amount)) {
      context.addIssue({
        code: 'custom',
        path: ['filled'],
        message: 'A partial order must have a fill greater than zero and below its amount.',
      });
    }
  });

const orderListResponseSchema = z.object({
  items: z.array(orderSchema),
  nextCursor: z.string().optional(),
});

const copyTraderSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string(),
  winRate: z.number().min(0).max(100),
  totalPnl: z.number(),
  totalPnlPct: z.number(),
  aum: z.number().nonnegative(),
  copiers: z.number().int().nonnegative(),
  maxCopiers: z.number().int().positive(),
  sharpeRatio: z.number(),
  maxDrawdown: z.number(),
  totalTrades: z.number().int().nonnegative(),
  avgHoldingTime: z.string(),
  weeklyPnl: z.array(z.number()),
  tags: z.array(z.string()),
  isFollowing: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  verified: z.boolean(),
});
const copyProvidersResponseSchema = z.object({ items: z.array(copyTraderSchema) });
const copyProviderProfileResponseSchema = z.object({
  provider: copyTraderSchema,
  pnlHistory: z.array(z.object({ day: z.string(), pnl: z.number(), cumPnl: z.number() })),
  recentTrades: z.array(
    z.object({
      id: z.string(),
      pair: z.string(),
      side: z.enum(['long', 'short']),
      entry: z.number(),
      exit: z.number().optional(),
      pnl: z.number(),
      pnlPct: z.number(),
      time: z.string(),
      status: z.enum(['open', 'closed']),
    }),
  ),
});
const copyRelationshipSchema = z.object({
  id: z.string(),
  provider: copyTraderSchema,
  status: z.enum(['active', 'paused', 'cooling-off', 'stopped']),
  copyMode: z.enum(['mirror', 'fixed', 'smart']),
  positionSizing: z.enum(['percentage', 'fixed']),
  copyRatio: z.number().min(0).max(100).optional(),
  capital: z.number().positive(),
  currentValue: z.number().nonnegative(),
  pnl: z.number(),
  pnlPct: z.number(),
  trades: z.number().int().nonnegative(),
  winRate: z.number().min(0).max(100),
  coolingOffUntil: z.string().optional(),
  hasCustomStopLoss: z.boolean(),
  stopLossLevel: z.number().positive().optional(),
  performanceHistory: z.array(z.object({ date: z.string(), value: z.number() })),
});
const copyRelationshipsResponseSchema = z.object({ items: z.array(copyRelationshipSchema) });
const copyActivationReceiptSchema = z.object({
  copyId: z.string(),
  status: z.enum(['active', 'cooling-off']),
  coolingOffUntil: z.string().optional(),
});

export interface TradingApi {
  listCopyProviders(
    query?: CopyProvidersQuery,
    signal?: AbortSignal,
  ): Promise<CopyProvidersResponse>;
  getCopyProviderProfile(id: string, signal?: AbortSignal): Promise<CopyProviderProfileResponse>;
  listCopyRelationships(signal?: AbortSignal): Promise<CopyRelationshipsResponse>;
  createCopyRelationship(
    request: CopyConfigurationRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<CopyActivationReceipt>;
  stopCopyRelationship(
    copyId: string,
    request: StopCopyRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<CopyRelationship>;
  listOpenOrders(
    query?: Omit<OrderListQuery, 'status'>,
    signal?: AbortSignal,
  ): Promise<OrderListResponse>;
  listOrderHistory(query?: OrderListQuery, signal?: AbortSignal): Promise<OrderListResponse>;
  placeOrder(request: PlaceOrderRequest, signal?: AbortSignal): Promise<TradingOrder>;
  modifyOrder(
    orderId: string,
    request: ModifyOrderRequest,
    signal?: AbortSignal,
  ): Promise<TradingOrder>;
  cancelOrder(orderId: string, idempotencyKey: string, signal?: AbortSignal): Promise<TradingOrder>;
}

export const tradingApi: TradingApi = {
  async listCopyProviders(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/trading/copy/providers', query, signal },
      { retries: 2 },
    );
    return copyProvidersResponseSchema.parse(response);
  },
  async getCopyProviderProfile(id, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: `/trading/copy/providers/${encodeURIComponent(id)}`, signal },
      { retries: 2 },
    );
    return copyProviderProfileResponseSchema.parse(response);
  },
  async listCopyRelationships(signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/trading/copy/relationships', signal },
      { retries: 2 },
    );
    return copyRelationshipsResponseSchema.parse(response);
  },
  async createCopyRelationship(request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: '/trading/copy/relationships',
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return copyActivationReceiptSchema.parse(response);
  },
  async stopCopyRelationship(copyId, request, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: `/trading/copy/relationships/${encodeURIComponent(copyId)}/stop`,
        body: request,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return copyRelationshipSchema.parse(response);
  },
  async listOpenOrders(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/trading/orders', query: { ...query, status: 'open' }, signal },
      { retries: 2 },
    );
    return orderListResponseSchema.parse(response);
  },

  async listOrderHistory(query, signal) {
    const response = await apiClient.request<unknown>(
      { method: 'GET', path: '/trading/orders/history', query, signal },
      { retries: 2 },
    );
    return orderListResponseSchema.parse(response);
  },

  async placeOrder(request, signal) {
    const { idempotencyKey, ...body } = request;
    const response = await apiClient.request<unknown>(
      { method: 'POST', path: '/trading/orders', body, signal, idempotencyKey },
      { retries: 0 },
    );
    return orderSchema.parse(response);
  },

  async modifyOrder(orderId, request, signal) {
    const { idempotencyKey, ...body } = request;
    const response = await apiClient.request<unknown>(
      {
        method: 'PATCH',
        path: `/trading/orders/${encodeURIComponent(orderId)}`,
        body,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return orderSchema.parse(response);
  },

  async cancelOrder(orderId, idempotencyKey, signal) {
    const response = await apiClient.request<unknown>(
      {
        method: 'POST',
        path: `/trading/orders/${encodeURIComponent(orderId)}/cancel`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
    return orderSchema.parse(response);
  },
};
