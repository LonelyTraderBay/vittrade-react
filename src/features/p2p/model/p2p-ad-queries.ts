import { useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2PAdsQuery } from './p2p-types';

const adQueryKeys = {
  list: (query: P2PAdsQuery = {}) => ['p2p', 'ads', query] as const,
  detail: (adId: string) => ['p2p', 'ad', adId] as const,
  analytics: (adId: string) => ['p2p', 'ad-analytics', adId] as const,
};

export function useP2PAdsQuery(query: P2PAdsQuery = {}) {
  return useQuery({
    queryKey: adQueryKeys.list(query),
    queryFn: ({ signal }) => p2pApi.listAds(query, signal),
    staleTime: 5_000,
    refetchInterval: 15_000,
  });
}

export function useP2PAdQuery(adId: string | undefined) {
  return useQuery({
    queryKey: adQueryKeys.detail(adId ?? ''),
    queryFn: ({ signal }) => p2pApi.getAd(adId!, signal),
    enabled: Boolean(adId),
    staleTime: 5_000,
  });
}

export function useP2PAdAnalyticsQuery(adId: string | undefined) {
  return useQuery({
    queryKey: adQueryKeys.analytics(adId ?? ''),
    queryFn: ({ signal }) => p2pApi.getAdAnalytics(adId!, signal),
    enabled: Boolean(adId),
    staleTime: 30_000,
  });
}
