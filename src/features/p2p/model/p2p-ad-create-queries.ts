import { useMutation, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PAdCreateRequest } from './p2p-types';

const adsQueryRoot = ['p2p', 'ads'] as const;

export function useP2PAdCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PAdCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.createAd(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adsQueryRoot });
    },
  });
}
