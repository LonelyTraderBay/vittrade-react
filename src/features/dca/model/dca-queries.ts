import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dcaApi } from '../api/dca-api';
import type { CreateDCAPlanRequest, UpdateDCAPlanRequest } from './dca-types';

export const dcaQueryKeys = {
  all: ['dca'] as const,
  snapshot: ['dca', 'snapshot'] as const,
};

export function useDCASnapshotQuery(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: dcaQueryKeys.snapshot,
    queryFn: ({ signal }) => dcaApi.getSnapshot(signal),
    enabled: options.enabled ?? true,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCreateDCAPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: CreateDCAPlanRequest;
      idempotencyKey: string;
    }) => dcaApi.createPlan(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dcaQueryKeys.snapshot });
    },
  });
}

export function useUpdateDCAPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      request,
      idempotencyKey,
    }: {
      planId: string;
      request: UpdateDCAPlanRequest;
      idempotencyKey: string;
    }) => dcaApi.updatePlan(planId, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dcaQueryKeys.snapshot });
    },
  });
}

export function useDeleteDCAPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, idempotencyKey }: { planId: string; idempotencyKey: string }) =>
      dcaApi.deletePlan(planId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dcaQueryKeys.snapshot });
    },
  });
}
