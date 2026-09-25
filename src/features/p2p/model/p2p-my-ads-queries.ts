import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PAdsQuery, P2PAdStatusUpdateRequest } from './p2p-types';

const adsQueryRoot = ['p2p', 'ads'] as const;
const myAdsQueryKey = [...adsQueryRoot, { mine: true }] as const;

export function useP2PMyAdsQuery() {
  return useQuery({
    queryKey: myAdsQueryKey,
    queryFn: ({ signal }) => p2pApi.listAds({ mine: true } satisfies P2PAdsQuery, signal),
    staleTime: 5_000,
  });
}

export function useP2PAdStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adId,
      request,
      idempotencyKey,
    }: {
      adId: string;
      request: P2PAdStatusUpdateRequest;
      idempotencyKey: string;
    }) => p2pApi.updateAdStatus(adId, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adsQueryRoot });
    },
  });
}

export function useP2PAdDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ adId, idempotencyKey }: { adId: string; idempotencyKey: string }) =>
      p2pApi.deleteAd(adId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adsQueryRoot });
    },
  });
}
