import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { predictionsApi } from '../api/predictions-api';
import type { PlacePredictionOrderRequest, PredictionEventsQuery } from './prediction-types';

export const predictionQueryKeys = {
  all: ['predictions'] as const,
  events: (query?: PredictionEventsQuery) => ['predictions', 'events', query] as const,
  event: (id: string) => ['predictions', 'event', id] as const,
  positions: ['predictions', 'positions'] as const,
  rewards: ['predictions', 'rewards'] as const,
  leaderboard: (period: string) => ['predictions', 'leaderboard', period] as const,
  activity: ['predictions', 'activity'] as const,
  receipt: (id: string) => ['predictions', 'receipt', id] as const,
};

export function usePredictionEventsQuery(query?: PredictionEventsQuery) {
  return useQuery({
    queryKey: predictionQueryKeys.events(query),
    queryFn: ({ signal }) => predictionsApi.listEvents(query, signal),
    staleTime: 15_000,
  });
}
export function usePredictionEventQuery(id: string) {
  return useQuery({
    queryKey: predictionQueryKeys.event(id),
    queryFn: ({ signal }) => predictionsApi.getEvent(id, signal),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}
export function usePredictionPositionsQuery() {
  return useQuery({
    queryKey: predictionQueryKeys.positions,
    queryFn: ({ signal }) => predictionsApi.listPositions(signal),
  });
}
export function usePredictionRewardsQuery() {
  return useQuery({
    queryKey: predictionQueryKeys.rewards,
    queryFn: ({ signal }) => predictionsApi.listRewards(signal),
    staleTime: 60_000,
  });
}
export function usePredictionLeaderboardQuery(period = 'today') {
  return useQuery({
    queryKey: predictionQueryKeys.leaderboard(period),
    queryFn: ({ signal }) => predictionsApi.listLeaderboard(period, signal),
    staleTime: 30_000,
  });
}
export function usePredictionActivityQuery() {
  return useQuery({
    queryKey: predictionQueryKeys.activity,
    queryFn: ({ signal }) => predictionsApi.listActivity(signal),
    staleTime: 10_000,
  });
}
export function usePredictionReceiptQuery(id: string) {
  return useQuery({
    queryKey: predictionQueryKeys.receipt(id),
    queryFn: ({ signal }) => predictionsApi.getOrderReceipt(id, signal),
    enabled: Boolean(id),
  });
}
export function usePlacePredictionOrderMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: PlacePredictionOrderRequest;
      idempotencyKey: string;
    }) => predictionsApi.placeOrder(request, idempotencyKey),
    onSuccess: async (receipt) => {
      await Promise.all([
        client.invalidateQueries({ queryKey: predictionQueryKeys.positions }),
        client.invalidateQueries({ queryKey: predictionQueryKeys.receipt(receipt.id) }),
      ]);
    },
  });
}
