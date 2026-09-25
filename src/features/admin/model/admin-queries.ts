import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin-api';
import type { AdminFunnelQuery } from './admin-types';

export const adminQueryKeys = {
  all: ['admin'] as const,
  overview: ['admin', 'overview'] as const,
  funnel: (query: AdminFunnelQuery = {}) => ['admin', 'funnel', query] as const,
  abTests: ['admin', 'ab-tests'] as const,
  abTest: (testId: string) => ['admin', 'ab-test', testId] as const,
};

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: adminQueryKeys.overview,
    queryFn: ({ signal }) => adminApi.getOverview(signal),
    staleTime: 30_000,
  });
}

export function useAdminFunnelQuery(query: AdminFunnelQuery = {}) {
  return useQuery({
    queryKey: adminQueryKeys.funnel(query),
    queryFn: ({ signal }) => adminApi.getFunnel(query, signal),
    staleTime: 30_000,
  });
}

export function useAdminAbTestsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.abTests,
    queryFn: ({ signal }) => adminApi.listAbTests(signal),
    staleTime: 30_000,
  });
}

export function useAdminAbTestQuery(testId: string) {
  return useQuery({
    queryKey: adminQueryKeys.abTest(testId),
    queryFn: ({ signal }) => adminApi.getAbTest(testId, signal),
    enabled: Boolean(testId),
    staleTime: 30_000,
  });
}

export function useAdminFeatureFlagUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      flagKey,
      request,
      idempotencyKey,
    }: {
      flagKey: string;
      request: Parameters<typeof adminApi.updateFeatureFlag>[1];
      idempotencyKey: string;
    }) => adminApi.updateFeatureFlag(flagKey, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.overview });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.abTests });
    },
  });
}
