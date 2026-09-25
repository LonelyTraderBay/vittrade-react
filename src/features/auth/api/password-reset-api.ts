import { z } from 'zod';
import { apiClient } from '@/shared/api/app-client';

const resetVerificationResponseSchema = z.object({ resetToken: z.string().min(1) });

export interface PasswordResetApi {
  requestCode(email: string, signal?: AbortSignal): Promise<void>;
  verifyCode(email: string, code: string, signal?: AbortSignal): Promise<{ resetToken: string }>;
  resetPassword(
    email: string,
    resetToken: string,
    newPassword: string,
    signal?: AbortSignal,
  ): Promise<void>;
  verifyCurrentPassword(currentPassword: string, signal?: AbortSignal): Promise<void>;
  changePassword(
    request: {
      currentPassword: string;
      newPassword: string;
      mfaCode: string;
      mfaMethod: 'totp' | 'sms';
    },
    signal?: AbortSignal,
  ): Promise<void>;
}

export const passwordResetApi: PasswordResetApi = {
  requestCode: (email, signal) =>
    apiClient.request<void>({
      method: 'POST',
      path: '/auth/password-reset/request',
      body: { email },
      signal,
      skipUnauthorizedHandler: true,
    }),
  async verifyCode(email, code, signal) {
    const response = await apiClient.request<unknown>({
      method: 'POST',
      path: '/auth/password-reset/verify',
      body: { email, code },
      signal,
      skipUnauthorizedHandler: true,
    });
    return resetVerificationResponseSchema.parse(response);
  },
  resetPassword: (email, resetToken, newPassword, signal) =>
    apiClient.request<void>({
      method: 'POST',
      path: '/auth/password-reset/confirm',
      body: { email, resetToken, newPassword },
      signal,
      skipUnauthorizedHandler: true,
    }),
  verifyCurrentPassword: (currentPassword, signal) =>
    apiClient.request<void>({
      method: 'POST',
      path: '/auth/password/verify-current',
      body: { currentPassword },
      signal,
    }),
  changePassword: (request, signal) =>
    apiClient.request<void>({
      method: 'POST',
      path: '/auth/password/change',
      body: request,
      signal,
      idempotencyKey: crypto.randomUUID(),
    }),
};
