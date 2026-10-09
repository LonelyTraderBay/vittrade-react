import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { arenaApi } from '../api/arena-api';

export const arenaQueryKeys = {
  all: ['arena'] as const,
  discovery: () => ['arena', 'discovery'] as const,
  mode: (id: string) => ['arena', 'mode', id] as const,
  challenge: (id: string) => ['arena', 'challenge', id] as const,
};

export function useArenaDiscoveryQuery() {
  return useQuery({
    queryKey: arenaQueryKeys.discovery(),
    queryFn: ({ signal }) => arenaApi.getDiscovery(signal),
    retry: false,
    staleTime: 30_000,
  });
}

export function useArenaModeQuery(id: string) {
  return useQuery({
    queryKey: arenaQueryKeys.mode(id),
    queryFn: ({ signal }) => arenaApi.getMode(id, signal),
    enabled: Boolean(id),
    retry: false,
    staleTime: 30_000,
  });
}

export function useArenaChallengeQuery(id: string) {
  return useQuery({
    queryKey: arenaQueryKeys.challenge(id),
    queryFn: ({ signal }) => arenaApi.getChallenge(id, signal),
    enabled: Boolean(id),
    retry: false,
    staleTime: 10_000,
  });
}

export function useJoinArenaChallengeMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => arenaApi.joinChallenge(id, `arena-join-${id}-${crypto.randomUUID()}`),
    onSuccess: async (response) => {
      await queryClient.setQueryData(arenaQueryKeys.challenge(id), response.challenge);
    },
  });
}
