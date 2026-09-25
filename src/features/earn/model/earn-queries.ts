import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { earnApi } from '../api/earn-api';
import type {
  CreateEarnPositionRequest,
  EarnDomain,
  RedeemEarnPositionRequest,
} from './earn-types';

export const earnQueryKeys = {
  all: ['earn'] as const,
  snapshot: ['earn', 'snapshot'] as const,
  transactions: (domain: EarnDomain) => ['earn', 'transactions', domain] as const,
};

export function useEarnSnapshotQuery({ pausePolling = false }: { pausePolling?: boolean } = {}) {
  return useQuery({
    queryKey: earnQueryKeys.snapshot,
    queryFn: ({ signal }) => earnApi.getSnapshot(signal),
    staleTime: 15_000,
    refetchInterval: pausePolling ? false : 30_000,
  });
}

export function useEarnTransactionsQuery(domain: EarnDomain) {
  return useInfiniteQuery({
    queryKey: earnQueryKeys.transactions(domain),
    queryFn: ({ signal, pageParam }) =>
      earnApi.getTransactions({ domain, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor,
    staleTime: 15_000,
  });
}

export function useCreateEarnSubscriptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: CreateEarnPositionRequest;
      idempotencyKey: string;
    }) => earnApi.subscribe(request, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: earnQueryKeys.snapshot }),
  });
}

export function useRedeemEarnPositionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: RedeemEarnPositionRequest;
      idempotencyKey: string;
    }) => earnApi.redeem(request, idempotencyKey),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: earnQueryKeys.snapshot }),
  });
}
