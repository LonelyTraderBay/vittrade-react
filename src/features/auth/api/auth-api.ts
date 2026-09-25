import { z } from 'zod';
import type { HttpClient } from '@/shared/api/http-client';
import type {
  AuthSession,
  LoginMfaVerificationRequest,
  LoginResult,
  LoginRequest,
  MfaSetupChallenge,
  MfaSetupConfirmationRequest,
  MfaVerificationRequest,
} from '@/shared/session/session-types';

export type {
  AuthSession,
  AuthUser,
  AuthenticatedLoginResult,
  LoginMfaChallenge,
  LoginMfaVerificationRequest,
  LoginResult,
  LoginRequest,
  MfaRequiredLoginResult,
  MfaSetupChallenge,
  MfaSetupConfirmationRequest,
  MfaVerificationRequest,
} from '@/shared/session/session-types';

export interface AuthApi {
  login(request: LoginRequest): Promise<LoginResult>;
  verifyLoginMfa(request: LoginMfaVerificationRequest): Promise<AuthSession>;
  verifyMfa(request: MfaVerificationRequest): Promise<AuthSession>;
  beginMfaSetup(): Promise<MfaSetupChallenge>;
  confirmMfaSetup(request: MfaSetupConfirmationRequest): Promise<AuthSession>;
  getSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  refresh(): Promise<AuthSession | null>;
}

const authSessionSchema = z.object({
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    fullName: z.string().min(1),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    kycStatus: z.enum(['pending', 'verified', 'rejected', 'not_started']),
    phone: z.string().optional(),
    username: z.string().optional(),
    avatar: z.string().nullable().optional(),
    kycLevel: z.number().nonnegative().optional(),
    vipLevel: z.number().nonnegative().optional(),
    joinDate: z.string().optional(),
    has2FA: z.boolean().optional(),
    totalBalance: z.number().nonnegative().optional(),
    accountStatus: z.enum(['active', 'locked', 'suspended']).optional(),
  }),
  accessTokenExpiresAt: z.string().datetime({ offset: true }),
  accessToken: z.string().min(1).optional(),
});

const mfaSetupChallengeSchema = z.object({
  secret: z.string().min(1),
  qrCodeUrl: z.string().min(1),
  backupCodes: z.array(z.string().min(1)).min(1),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

const loginResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('authenticated'),
    session: authSessionSchema,
  }),
  z.object({
    status: z.literal('mfa_required'),
    challenge: z.object({
      id: z.string().trim().min(1),
      method: z.enum(['totp', 'sms', 'email']),
      maskedDestination: z.string().min(1).optional(),
      expiresAt: z.string().datetime({ offset: true }),
    }),
  }),
]);

function parseNullableSession(response: unknown): AuthSession | null {
  return response === null ? null : authSessionSchema.parse(response);
}

/** Adapter xác thực theo contract; backend chịu trách nhiệm gia hạn session bằng cookie. */
export function createAuthApi(client: HttpClient): AuthApi {
  return {
    login: async (request) =>
      loginResultSchema.parse(
        await client.request<unknown>({
          method: 'POST',
          path: '/auth/login',
          body: request,
          skipUnauthorizedHandler: true,
        }),
      ),
    verifyLoginMfa: async (request) =>
      authSessionSchema.parse(
        await client.request<unknown>({
          method: 'POST',
          path: '/auth/login/mfa/verify',
          body: request,
          skipUnauthorizedHandler: true,
        }),
      ),
    verifyMfa: async (request) =>
      authSessionSchema.parse(
        await client.request<unknown>({ method: 'POST', path: '/auth/mfa/verify', body: request }),
      ),
    beginMfaSetup: async () =>
      mfaSetupChallengeSchema.parse(
        await client.request<unknown>({ method: 'POST', path: '/auth/mfa/setup' }),
      ),
    confirmMfaSetup: async (request) =>
      authSessionSchema.parse(
        await client.request<unknown>({
          method: 'POST',
          path: '/auth/mfa/setup/confirm',
          body: request,
        }),
      ),
    getSession: async () =>
      parseNullableSession(
        await client.request<unknown>({
          method: 'GET',
          path: '/auth/session',
          skipUnauthorizedHandler: true,
        }),
      ),
    logout: () =>
      client.request<void>({ method: 'POST', path: '/auth/logout', skipUnauthorizedHandler: true }),
    refresh: async () =>
      parseNullableSession(
        await client.request<unknown>({
          method: 'POST',
          path: '/auth/refresh',
          skipUnauthorizedHandler: true,
        }),
      ),
  };
}
