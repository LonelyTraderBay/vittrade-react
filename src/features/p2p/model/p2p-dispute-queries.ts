import { useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PDisputesQuery } from './p2p-types';

const p2pDisputeQueryKeys = {
  disputes: (query: P2PDisputesQuery = {}) => ['p2p', 'disputes', query] as const,
};

/** Query boundary for the migrated dispute-list compliance slice. */
export function useP2PDisputesQuery(query: P2PDisputesQuery = {}) {
  return useQuery({
    queryKey: p2pDisputeQueryKeys.disputes(query),
    queryFn: ({ signal }) => p2pApi.listDisputes(query, signal),
    staleTime: 15_000,
  });
}
