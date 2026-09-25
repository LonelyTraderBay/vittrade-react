import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { arenaApi } from '../api/arena-api';

export const arenaQueryKeys = {
  all: ['arena'] as const,
  mode: (id: string) => ['arena', 'mode', id] as const,
  challenge: (id: string) => ['arena', 'challenge', id] as const,
};

export function useArenaModeQuery(id: string) {
  return useQuery({
    queryKey: arenaQueryKeys.mode(id),
    queryFn: ({ signal }) => arenaApi.getMode(id, signal),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useArenaChallengeQuery(id: string) {
  return useQuery({
    queryKey: arenaQueryKeys.challenge(id),
    queryFn: ({ signal }) => arenaApi.getChallenge(id, signal),
    enabled: Boolean(id),
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
