import { createElement, type PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider, type UseMutationResult } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { p2pApi } from '../api/p2p-api';
import {
  useP2PMarkPaidMutation,
  useP2POrderActionCancelMutation,
  useP2POrderActionProofMutation,
  useP2POrderActionQuery,
  useP2POrderActionRateMutation,
  useP2PReleaseChallengeMutation,
  useP2PReleaseOrderMutation,
  useP2PReleaseVerificationMutation,
} from './p2p-order-action-queries';

type UntypedMutation = () => UseMutationResult<unknown, Error, unknown, unknown>;

const queryClients: QueryClient[] = [];

function useCancellationMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2POrderActionCancelMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function useMarkPaidMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2PMarkPaidMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function useReleaseMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2PReleaseOrderMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function useReleaseChallengeMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2PReleaseChallengeMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function useReleaseVerificationMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2PReleaseVerificationMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function useRatingMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2POrderActionRateMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function usePaymentProofMutationWithoutOrderId(): ReturnType<UntypedMutation> {
  return useP2POrderActionProofMutation(undefined) as unknown as ReturnType<UntypedMutation>;
}

function createQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  queryClients.push(client);
  return client;
}

function createWrapper(client: QueryClient) {
  return ({ children }: PropsWithChildren) =>
    createElement(QueryClientProvider, { client, children });
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const client of queryClients.splice(0)) client.clear();
});

describe('P2P order-action query identifiers', () => {
  it('keeps the order query disabled until an order ID is available', () => {
    const client = createQueryClient();
    const getOrder = vi.spyOn(p2pApi, 'getOrder').mockResolvedValue({} as never);
    const { result } = renderHook(() => useP2POrderActionQuery(undefined), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(getOrder).not.toHaveBeenCalled();
    expect(client.getQueryState(['p2p', 'order-action', ''])).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
    });
  });

  it.each([
    {
      name: 'cancellation',
      hook: useCancellationMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'cancelOrder').mockResolvedValue({} as never),
      variables: {
        request: { reason: 'Order no longer needed' },
        idempotencyKey: 'cancel-missing-id',
      },
    },
    {
      name: 'mark-paid',
      hook: useMarkPaidMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'markOrderPaid').mockResolvedValue({} as never),
      variables: { idempotencyKey: 'paid-missing-id' },
    },
    {
      name: 'escrow release',
      hook: useReleaseMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'releaseOrder').mockResolvedValue({} as never),
      variables: {
        verificationToken: 'verification-token',
        idempotencyKey: 'release-missing-id',
      },
    },
    {
      name: 'release challenge creation',
      hook: useReleaseChallengeMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'createReleaseChallenge').mockResolvedValue({} as never),
      variables: undefined,
    },
    {
      name: 'release challenge verification',
      hook: useReleaseVerificationMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'verifyReleaseChallenge').mockResolvedValue({} as never),
      variables: { challengeId: 'challenge-1', code: '123456' },
    },
    {
      name: 'rating',
      hook: useRatingMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'rateOrder').mockResolvedValue({} as never),
      variables: { request: { rating: 5 }, idempotencyKey: 'rate-missing-id' },
    },
    {
      name: 'payment proof',
      hook: usePaymentProofMutationWithoutOrderId,
      spy: () => vi.spyOn(p2pApi, 'submitPaymentProof').mockResolvedValue({} as never),
      variables: {
        request: { files: [new File(['proof'], 'proof.png', { type: 'image/png' })] },
        idempotencyKey: 'proof-missing-id',
      },
    },
  ])(
    'refuses $name before calling the API without an order ID',
    async ({ hook, spy, variables }) => {
      const apiCall = spy();
      const client = createQueryClient();
      const { result } = renderHook(hook, { wrapper: createWrapper(client) });

      await expect(result.current.mutateAsync(variables)).rejects.toThrow(
        'P2P order id is required',
      );
      expect(apiCall).not.toHaveBeenCalled();
    },
  );
});
