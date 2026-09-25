import type {
  AuthSession,
  AuthUser,
  LoginMfaVerificationRequest,
  LoginRequest,
  LoginResult,
  MfaSetupChallenge,
  MfaSetupConfirmationRequest,
  MfaVerificationRequest,
} from './session-types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export interface AuthAdapter {
  login(request: LoginRequest): Promise<LoginResult>;
  /** Legacy test adapter hook; production adapters must use the async API. */
  loginSync?(request: LoginRequest): AuthSession;
  getSession(): Promise<AuthSession | null>;
  logout(): Promise<void>;
  refresh(): Promise<AuthSession | null>;
  verifyMfa?(request: MfaVerificationRequest): Promise<AuthSession>;
  verifyLoginMfa?(request: LoginMfaVerificationRequest): Promise<AuthSession>;
  beginMfaSetup?(): Promise<MfaSetupChallenge>;
  confirmMfaSetup?(request: MfaSetupConfirmationRequest): Promise<AuthSession>;
  /** Test/dev adapters may provide a deterministic initial state without a network call. */
  readonly initialSession?: AuthSession | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  session: AuthSession | null;
  roles: string[];
  permissions: string[];
  error: Error | null;
  signIn: (request: LoginRequest) => Promise<LoginResult>;
  verifyMfa: (request: MfaVerificationRequest) => Promise<AuthSession>;
  verifyLoginMfa: (request: LoginMfaVerificationRequest) => Promise<AuthSession>;
  beginMfaSetup: () => Promise<MfaSetupChallenge>;
  confirmMfaSetup: (request: MfaSetupConfirmationRequest) => Promise<AuthSession>;
  /** @deprecated Use signIn. Kept temporarily for legacy pages during migration. */
  login: (email: string, password: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  /** @deprecated Use signOut. */
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthSession | null>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}
