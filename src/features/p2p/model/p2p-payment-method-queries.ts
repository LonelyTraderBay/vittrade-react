import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';

const p2pPaymentMethodQueryKeys = {
  methods: ['p2p', 'payment-methods'] as const,
};

export function useP2PPaymentMethodsQuery() {
  return useQuery({
    queryKey: p2pPaymentMethodQueryKeys.methods,
    queryFn: ({ signal }) => p2pApi.listPaymentMethods(signal),
    staleTime: 30_000,
  });
}

export function useP2PPaymentMethodCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: Parameters<typeof p2pApi.createPaymentMethod>[0];
      idempotencyKey: string;
    }) => p2pApi.createPaymentMethod(request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pPaymentMethodQueryKeys.methods });
    },
  });
}

export function useP2PPaymentMethodUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      request,
      idempotencyKey,
    }: {
      id: string;
      request: Parameters<typeof p2pApi.updatePaymentMethod>[1];
      idempotencyKey: string;
    }) => p2pApi.updatePaymentMethod(id, request, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pPaymentMethodQueryKeys.methods });
    },
  });
}

export function useP2PPaymentMethodDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, idempotencyKey }: { id: string; idempotencyKey: string }) =>
      p2pApi.deletePaymentMethod(id, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: p2pPaymentMethodQueryKeys.methods });
    },
  });
}
