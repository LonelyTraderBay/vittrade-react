import { useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';

const overviewQueryKeys = {
  overview: ['p2p', 'overview'] as const,
  dashboard: ['p2p', 'dashboard'] as const,
};

export function useP2POverviewQuery() {
  return useQuery({
    queryKey: overviewQueryKeys.overview,
    queryFn: ({ signal }) => p2pApi.getOverview(signal),
    staleTime: 30_000,
  });
}

export function useP2PDashboardQuery() {
  return useQuery({
    queryKey: overviewQueryKeys.dashboard,
    queryFn: ({ signal }) => p2pApi.getDashboard(signal),
    staleTime: 30_000,
  });
}
