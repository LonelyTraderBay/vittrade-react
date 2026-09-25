import { useMutation, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2POrderRequest } from './p2p-types';

const adsQueryRoot = ['p2p', 'ads'] as const;

export function useP2POrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2POrderRequest;
      idempotencyKey: string;
    }) => p2pApi.createOrder(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adsQueryRoot });
    },
  });
}
