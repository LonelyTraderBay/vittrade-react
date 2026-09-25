import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { p2pApi } from '../api/p2p-api';
import type { P2P2FAMethodId, P2P2FAThresholdId, P2P2FASettingsResponse } from './p2p-types';

const securityQueryKeys = {
  twoFactor: ['p2p', 'security', '2fa'] as const,
};

function setTwoFactorSettings(
  queryClient: ReturnType<typeof useQueryClient>,
  settings: P2P2FASettingsResponse,
) {
  queryClient.setQueryData(securityQueryKeys.twoFactor, settings);
}

export function useP2P2FASettingsQuery() {
  return useQuery({
    queryKey: securityQueryKeys.twoFactor,
    queryFn: ({ signal }) => p2pApi.get2FASettings(signal),
    staleTime: 30_000,
  });
}

export function useP2P2FAMethodMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      methodId,
      enabled,
      idempotencyKey,
    }: {
      methodId: P2P2FAMethodId;
      enabled: boolean;
      idempotencyKey: string;
    }) => p2pApi.toggle2FAMethod(methodId, enabled, idempotencyKey),
    onSuccess: (settings) => setTwoFactorSettings(queryClient, settings),
  });
}

export function useP2P2FAPrimaryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      methodId,
      idempotencyKey,
    }: {
      methodId: P2P2FAMethodId;
      idempotencyKey: string;
    }) => p2pApi.setPrimary2FAMethod(methodId, idempotencyKey),
    onSuccess: (settings) => setTwoFactorSettings(queryClient, settings),
  });
}

export function useP2P2FAThresholdMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      thresholdId,
      request,
      idempotencyKey,
    }: {
      thresholdId: P2P2FAThresholdId;
      request: Parameters<typeof p2pApi.update2FAThreshold>[1];
      idempotencyKey: string;
    }) => p2pApi.update2FAThreshold(thresholdId, request, idempotencyKey),
    onSuccess: (settings) => setTwoFactorSettings(queryClient, settings),
  });
}

export function useP2PAuthenticatorSetupMutation() {
  return useMutation({ mutationFn: () => p2pApi.beginAuthenticatorSetup() });
}

export function useP2PAuthenticatorConfirmMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, idempotencyKey }: { code: string; idempotencyKey: string }) =>
      p2pApi.confirmAuthenticatorSetup(code, idempotencyKey),
    onSuccess: (settings) => setTwoFactorSettings(queryClient, settings),
  });
}
