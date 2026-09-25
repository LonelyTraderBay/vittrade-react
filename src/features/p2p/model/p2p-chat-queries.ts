import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PChatMessageRequest } from './p2p-types';

const p2pChatQueryKeys = {
  chat: (orderId: string) => ['p2p', 'chat', orderId] as const,
  order: (orderId: string) => ['p2p', 'order', orderId] as const,
};

export function useP2PChatQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: p2pChatQueryKeys.chat(orderId ?? ''),
    queryFn: ({ signal }) => p2pApi.getChat(orderId!, signal),
    enabled: Boolean(orderId),
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function useP2POrderQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: p2pChatQueryKeys.order(orderId ?? ''),
    queryFn: ({ signal }) => p2pApi.getOrder(orderId!, signal),
    enabled: Boolean(orderId),
    staleTime: 5_000,
  });
}

export function useP2PChatMessageMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PChatMessageRequest;
      idempotencyKey: string;
    }) => p2pApi.sendChatMessage(orderId!, request, idempotencyKey),
    onSuccess: (chat) => {
      queryClient.setQueryData(p2pChatQueryKeys.chat(orderId ?? ''), chat);
    },
  });
}
