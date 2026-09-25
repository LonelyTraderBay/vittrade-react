import { useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2POrdersQuery } from './p2p-types';

const p2pOrderQueryKeys = {
  orders: (query: P2POrdersQuery = {}) => ['p2p', 'orders', query] as const,
};

/** Query boundary for the migrated order-history vertical slice. */
export function useP2POrdersQuery(query: P2POrdersQuery = {}) {
  return useQuery({
    queryKey: p2pOrderQueryKeys.orders(query),
    queryFn: ({ signal }) => p2pApi.listOrders(query, signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}
