import { useQuery } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';

const achievementQueryKey = ['p2p', 'achievements'] as const;

export function useP2PAchievementsQuery() {
  return useQuery({
    queryKey: achievementQueryKey,
    queryFn: ({ signal }) => p2pApi.getAchievements(signal),
    staleTime: 30_000,
  });
}
