export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  permissions: string[];
  kycStatus: 'pending' | 'verified' | 'rejected' | 'not_started';
  phone?: string;
  username?: string;
  avatar?: string | null;
  kycLevel?: number;
  vipLevel?: number;
  joinDate?: string;
  has2FA?: boolean;
  totalBalance?: number;
  accountStatus?: 'active' | 'locked' | 'suspended';
}

export interface AuthSession {
  user: AuthUser;
  accessTokenExpiresAt: string;
  /** Held in memory only; never persist this value in browser storage. */
  accessToken?: string;
}

export interface LoginMfaChallenge {
  id: string;
  method: 'totp' | 'sms' | 'email';
  maskedDestination?: string;
  expiresAt: string;
}

export interface AuthenticatedLoginResult {
  status: 'authenticated';
  session: AuthSession;
}

export interface MfaRequiredLoginResult {
  status: 'mfa_required';
  challenge: LoginMfaChallenge;
}

export type LoginResult = AuthenticatedLoginResult | MfaRequiredLoginResult;

export interface LoginMfaVerificationRequest {
  challengeId: string;
  code: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MfaVerificationRequest {
  contact: string;
  code: string;
  purpose?: string;
}

export interface MfaSetupConfirmationRequest {
  code: string;
}

export interface MfaSetupChallenge {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  expiresAt?: string;
}
