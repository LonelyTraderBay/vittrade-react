import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type {
  P2PCancelOrderRequest,
  P2PPaymentProofRequest,
  P2PRateOrderRequest,
} from './p2p-types';

export const p2pOrderActionQueryKeys = {
  order: (orderId: string) => ['p2p', 'order-action', orderId] as const,
};

/** Boundary hẹp cho các mutation trong lifecycle order. */
export function useP2POrderActionQuery(orderId: string | undefined) {
  return useQuery({
    queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
    queryFn: ({ signal }) => p2pApi.getOrder(orderId!, signal),
    enabled: Boolean(orderId),
    staleTime: 5_000,
  });
}

// Compatibility alias for the escrow page while its naming is migrated.
export const useP2POrderQuery = useP2POrderActionQuery;

export function useP2POrderActionCancelMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PCancelOrderRequest;
      idempotencyKey: string;
    }) => p2pApi.cancelOrder(orderId!, request, idempotencyKey),
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pOrderActionQueryKeys.order(orderId ?? ''), order);
      await queryClient.invalidateQueries({
        queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
      });
    },
  });
}

export function useP2PMarkPaidMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => p2pApi.markOrderPaid(orderId!),
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pOrderActionQueryKeys.order(orderId ?? ''), order);
      await queryClient.invalidateQueries({
        queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
      });
    },
  });
}

export function useP2PReleaseOrderMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      verificationToken,
      idempotencyKey,
    }: {
      verificationToken: string;
      idempotencyKey: string;
    }) => p2pApi.releaseOrder(orderId!, verificationToken, idempotencyKey),
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pOrderActionQueryKeys.order(orderId ?? ''), order);
      await queryClient.invalidateQueries({
        queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
      });
    },
  });
}

export function useP2PReleaseChallengeMutation(orderId: string | undefined) {
  return useMutation({ mutationFn: () => p2pApi.createReleaseChallenge(orderId!) });
}

export function useP2PReleaseVerificationMutation(orderId: string | undefined) {
  return useMutation({
    mutationFn: ({ challengeId, code }: { challengeId: string; code: string }) =>
      p2pApi.verifyReleaseChallenge(orderId!, challengeId, code),
  });
}

export function useP2POrderActionRateMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PRateOrderRequest;
      idempotencyKey: string;
    }) => p2pApi.rateOrder(orderId!, request, idempotencyKey),
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pOrderActionQueryKeys.order(orderId ?? ''), order);
      await queryClient.invalidateQueries({
        queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
      });
    },
  });
}

export function useP2POrderActionProofMutation(orderId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: P2PPaymentProofRequest;
      idempotencyKey: string;
    }) => p2pApi.submitPaymentProof(orderId!, request, idempotencyKey),
    onSuccess: async (order) => {
      queryClient.setQueryData(p2pOrderActionQueryKeys.order(orderId ?? ''), order);
      await queryClient.invalidateQueries({
        queryKey: p2pOrderActionQueryKeys.order(orderId ?? ''),
      });
    },
  });
}
