/** Export tương thích cho infrastructure trong giai đoạn auth chuyển về feature boundary. */
export {
  createAuthApi,
  type AuthApi,
  type AuthSession,
  type AuthUser,
  type AuthenticatedLoginResult,
  type LoginMfaChallenge,
  type LoginMfaVerificationRequest,
  type LoginResult,
  type LoginRequest,
  type MfaRequiredLoginResult,
  type MfaSetupChallenge,
  type MfaSetupConfirmationRequest,
  type MfaVerificationRequest,
} from '@/features/auth/api/auth-api';
