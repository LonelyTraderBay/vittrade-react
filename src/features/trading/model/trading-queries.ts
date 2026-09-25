import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradingApi } from '../api/trading-api';
import type {
  CopyProvidersQuery,
  ModifyOrderRequest,
  OrderListQuery,
  PlaceOrderRequest,
} from './trading-types';

export const tradingQueryKeys = {
  all: ['trading'] as const,
  openOrders: (query: OrderListQuery = {}) => ['trading', 'open-orders', query] as const,
  orderHistory: (query: OrderListQuery = {}) => ['trading', 'order-history', query] as const,
  copyProviders: (query: CopyProvidersQuery = {}) => ['trading', 'copy-providers', query] as const,
  copyProvider: (id: string) => ['trading', 'copy-provider', id] as const,
  copyRelationships: ['trading', 'copy-relationships'] as const,
};

export function useCopyProvidersQuery(query: CopyProvidersQuery = {}) {
  return useQuery({
    queryKey: tradingQueryKeys.copyProviders(query),
    queryFn: ({ signal }) => tradingApi.listCopyProviders(query, signal),
    staleTime: 30_000,
  });
}

export function useCopyProviderProfileQuery(id: string | undefined) {
  return useQuery({
    queryKey: tradingQueryKeys.copyProvider(id ?? ''),
    queryFn: ({ signal }) => tradingApi.getCopyProviderProfile(id!, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCopyRelationshipsQuery() {
  return useQuery({
    queryKey: tradingQueryKeys.copyRelationships,
    queryFn: ({ signal }) => tradingApi.listCopyRelationships(signal),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useCreateCopyRelationshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof tradingApi.createCopyRelationship>[0];
      idempotencyKey: string;
    }) => tradingApi.createCopyRelationship(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tradingQueryKeys.copyRelationships });
    },
  });
}

export function useStopCopyRelationshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      copyId,
      request,
      idempotencyKey,
    }: {
      copyId: string;
      request: Parameters<typeof tradingApi.stopCopyRelationship>[1];
      idempotencyKey: string;
    }) => tradingApi.stopCopyRelationship(copyId, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tradingQueryKeys.copyRelationships });
    },
  });
}

export function useOpenOrdersQuery(query: Omit<OrderListQuery, 'status'> = {}) {
  return useQuery({
    queryKey: tradingQueryKeys.openOrders(query),
    queryFn: ({ signal }) => tradingApi.listOpenOrders(query, signal),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useOrderHistoryQuery(query: OrderListQuery = {}) {
  return useQuery({
    queryKey: tradingQueryKeys.orderHistory(query),
    queryFn: ({ signal }) => tradingApi.listOrderHistory(query, signal),
    staleTime: 30_000,
  });
}

function invalidateTradingQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: tradingQueryKeys.all });
}

export function usePlaceOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: PlaceOrderRequest) => tradingApi.placeOrder(request),
    onSuccess: () => invalidateTradingQueries(queryClient),
  });
}

export function useModifyOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, request }: { orderId: string; request: ModifyOrderRequest }) =>
      tradingApi.modifyOrder(orderId, request),
    onSuccess: () => invalidateTradingQueries(queryClient),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, idempotencyKey }: { orderId: string; idempotencyKey: string }) =>
      tradingApi.cancelOrder(orderId, idempotencyKey),
    onSuccess: () => invalidateTradingQueries(queryClient),
  });
}
