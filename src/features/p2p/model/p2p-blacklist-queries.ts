import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PBlacklistCreateRequest, P2PBlacklistQuery } from './p2p-types';

const blacklistQueryKeys = {
  root: ['p2p', 'blacklist'] as const,
  list: (query: P2PBlacklistQuery = {}) => ['p2p', 'blacklist', query] as const,
};

export function useP2PBlacklistQuery(query: P2PBlacklistQuery = {}) {
  return useQuery({
    queryKey: blacklistQueryKeys.list(query),
    queryFn: ({ signal }) => p2pApi.listBlacklist(query, signal),
    staleTime: 15_000,
  });
}

export function useP2PBlacklistCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PBlacklistCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.createBlacklistEntry(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blacklistQueryKeys.root });
    },
  });
}

export function useP2PBlacklistRemoveMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, idempotencyKey }: { entryId: string; idempotencyKey: string }) =>
      p2pApi.removeBlacklistEntry(entryId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: blacklistQueryKeys.root });
    },
  });
}
