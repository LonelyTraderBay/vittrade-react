import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile-api';
import type { UpdateProfileRequest } from './profile-types';

export const profileQueryKeys = {
  all: ['profile'] as const,
  overview: ['profile', 'overview'] as const,
  devices: ['profile', 'devices'] as const,
  activity: ['profile', 'activity'] as const,
  subAccounts: ['profile', 'sub-accounts'] as const,
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKeys.overview,
    queryFn: ({ signal }) => profileApi.getProfile(signal),
    staleTime: 30_000,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      idempotencyKey,
    }: {
      request: UpdateProfileRequest;
      idempotencyKey: string;
    }) => profileApi.updateProfile(request, idempotencyKey),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: profileQueryKeys.overview }),
  });
}

export function useDevicesQuery() {
  return useQuery({
    queryKey: profileQueryKeys.devices,
    queryFn: ({ signal }) => profileApi.listDevices(signal),
    staleTime: 15_000,
  });
}

export function useRevokeDeviceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ deviceId, idempotencyKey }: { deviceId: string; idempotencyKey: string }) =>
      profileApi.revokeDevice(deviceId, idempotencyKey),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: profileQueryKeys.devices }),
  });
}

export function useSetDeviceTrustMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      deviceId,
      trusted,
      idempotencyKey,
    }: {
      deviceId: string;
      trusted: boolean;
      idempotencyKey: string;
    }) => profileApi.setDeviceTrust(deviceId, trusted, idempotencyKey),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: profileQueryKeys.devices }),
  });
}

export function useActivityQuery() {
  return useQuery({
    queryKey: profileQueryKeys.activity,
    queryFn: ({ signal }) => profileApi.listActivity(signal),
    staleTime: 30_000,
  });
}

export function useSubAccountsQuery() {
  return useQuery({
    queryKey: profileQueryKeys.subAccounts,
    queryFn: ({ signal }) => profileApi.listSubAccounts(signal),
    staleTime: 30_000,
  });
}
