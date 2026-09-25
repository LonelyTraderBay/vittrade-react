import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PDisputeEscalationRequest, P2PDisputeMessageRequest } from './p2p-types';

const p2pDisputeDetailQueryKeys = {
  root: ['p2p', 'disputes'] as const,
  detail: (disputeId: string) => ['p2p', 'dispute', disputeId] as const,
};

export function useP2PDisputeQuery(disputeId: string | undefined) {
  return useQuery({
    queryKey: p2pDisputeDetailQueryKeys.detail(disputeId ?? ''),
    queryFn: ({ signal }) => p2pApi.getDispute(disputeId!, signal),
    enabled: Boolean(disputeId),
    staleTime: 10_000,
  });
}

export function useP2PDisputeMessageMutation(disputeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PDisputeMessageRequest;
      idempotencyKey: string;
    }) => p2pApi.sendDisputeMessage(disputeId!, request, idempotencyKey),
    onSuccess: async (dispute) => {
      queryClient.setQueryData(p2pDisputeDetailQueryKeys.detail(disputeId ?? ''), dispute);
      await queryClient.invalidateQueries({ queryKey: p2pDisputeDetailQueryKeys.root });
    },
  });
}

export function useP2PDisputeEscalationMutation(disputeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PDisputeEscalationRequest;
      idempotencyKey: string;
    }) => p2pApi.escalateDispute(disputeId!, request, idempotencyKey),
    onSuccess: async (dispute) => {
      queryClient.setQueryData(p2pDisputeDetailQueryKeys.detail(disputeId ?? ''), dispute);
      await queryClient.invalidateQueries({ queryKey: p2pDisputeDetailQueryKeys.root });
    },
  });
}
