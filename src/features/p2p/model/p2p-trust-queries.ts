import { useMutation, useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PReportCreateRequest, P2PReviewScope } from './p2p-types';

const trustQueryKeys = {
  merchant: (merchantId: string) => ['p2p', 'merchant', merchantId] as const,
  reviews: (scope: P2PReviewScope) => ['p2p', 'reviews', scope] as const,
};

export function useP2PMerchantProfileQuery(merchantId: string | undefined) {
  return useQuery({
    queryKey: trustQueryKeys.merchant(merchantId ?? ''),
    queryFn: ({ signal }) => p2pApi.getMerchantProfile(merchantId!, signal),
    enabled: Boolean(merchantId),
    staleTime: 30_000,
  });
}

export function useP2PMerchantReportMutation() {
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PReportCreateRequest;
      idempotencyKey: string;
    }) => p2pApi.reportMerchant(request, idempotencyKey),
  });
}

export function useP2PReviewsQuery(scope: P2PReviewScope = 'received') {
  return useQuery({
    queryKey: trustQueryKeys.reviews(scope),
    queryFn: ({ signal }) => p2pApi.listReviews(scope, signal),
    staleTime: 30_000,
  });
}
