import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';
import type {
  ActivityLog,
  Profile,
  SubAccount,
  TrustedDevice,
  UpdateProfileRequest,
} from '../model/profile-types';

const profileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string(),
  fullName: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
  kycLevel: z.number().int().nonnegative(),
  kycStatus: z.enum(['pending', 'verified', 'rejected', 'not_started']),
  referralCode: z.string(),
  vipLevel: z.number().int().nonnegative(),
  joinDate: z.string(),
  has2FA: z.boolean(),
  totalBalance: z.number().nonnegative(),
});
const devicesResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(['desktop', 'mobile', 'tablet']),
      browser: z.string(),
      os: z.string(),
      ip: z.string(),
      location: z.string(),
      lastActive: z.string(),
      isCurrent: z.boolean(),
      isTrusted: z.boolean(),
      loginAt: z.string(),
    }),
  ),
});
const activityResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      type: z.enum([
        'login',
        'logout',
        'password_change',
        '2fa_enable',
        '2fa_disable',
        'kyc_submit',
        'api_create',
        'api_delete',
      ]),
      description: z.string(),
      ipAddress: z.string(),
      device: z.string(),
      location: z.string(),
      status: z.enum(['success', 'failed', 'suspicious']),
      timestamp: z.string(),
    }),
  ),
});
const subAccountsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
      type: z.enum(['spot', 'margin', 'futures', 'all']),
      status: z.enum(['active', 'frozen', 'pending']),
      balance: z.number(),
      pnl30d: z.number(),
      permissions: z.array(z.string()),
      createdAt: z.string(),
      lastActive: z.string(),
      apiKeyCount: z.number().int().nonnegative(),
      tradingVolume30d: z.number().nonnegative(),
    }),
  ),
});

export interface ProfileApi {
  getProfile(signal?: AbortSignal): Promise<Profile>;
  updateProfile(
    request: UpdateProfileRequest,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<Profile>;
  listDevices(signal?: AbortSignal): Promise<{ items: TrustedDevice[] }>;
  revokeDevice(deviceId: string, idempotencyKey: string, signal?: AbortSignal): Promise<void>;
  setDeviceTrust(
    deviceId: string,
    trusted: boolean,
    idempotencyKey: string,
    signal?: AbortSignal,
  ): Promise<TrustedDevice>;
  listActivity(signal?: AbortSignal): Promise<{ items: ActivityLog[] }>;
  listSubAccounts(signal?: AbortSignal): Promise<{ items: SubAccount[] }>;
}

export const profileApi: ProfileApi = {
  async getProfile(signal) {
    return profileSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/profile', signal }),
    );
  },
  async updateProfile(request, idempotencyKey, signal) {
    return profileSchema.parse(
      await apiClient.request<unknown>(
        { method: 'PATCH', path: '/profile', body: request, signal, idempotencyKey },
        { retries: 0 },
      ),
    );
  },
  async listDevices(signal) {
    return devicesResponseSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/profile/devices', signal }),
    );
  },
  async revokeDevice(deviceId, idempotencyKey, signal) {
    await apiClient.request<void>(
      {
        method: 'POST',
        path: `/profile/devices/${encodeURIComponent(deviceId)}/revoke`,
        signal,
        idempotencyKey,
      },
      { retries: 0 },
    );
  },
  async setDeviceTrust(deviceId, trusted, idempotencyKey, signal) {
    return z.object({ item: devicesResponseSchema.shape.items.element }).parse(
      await apiClient.request<unknown>(
        {
          method: 'PATCH',
          path: `/profile/devices/${encodeURIComponent(deviceId)}/trust`,
          body: { trusted },
          signal,
          idempotencyKey,
        },
        { retries: 0 },
      ),
    ).item;
  },
  async listActivity(signal) {
    return activityResponseSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/profile/activity', signal }),
    );
  },
  async listSubAccounts(signal) {
    return subAccountsResponseSchema.parse(
      await apiClient.request<unknown>({ method: 'GET', path: '/profile/sub-accounts', signal }),
    );
  },
};
