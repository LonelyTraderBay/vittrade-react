import type { AuthSession, MfaSetupChallenge } from '@/features/auth/api/auth-api';
import type { AuthAdapter } from '../app/contexts/AuthContext';
import { TEST_AUTH_USER } from './fixtures/auth-user';

// Legacy component tests assert the existing profile shape. New auth tests should
// provide explicit roles/permissions through a purpose-built adapter.
export const testAuthSession: AuthSession = {
  user: TEST_AUTH_USER,
  accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
  accessToken: 'test-access-token',
};

/** Deterministic adapter for component tests; never imported by production code. */
export const testAuthAdapter: AuthAdapter = {
  initialSession: testAuthSession,
  async login() {
    return { status: 'authenticated', session: testAuthSession };
  },
  loginSync() {
    return testAuthSession;
  },
  async verifyMfa() {
    return testAuthSession;
  },
  async beginMfaSetup(): Promise<MfaSetupChallenge> {
    return {
      secret: 'TEST-SECRET',
      qrCodeUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
      backupCodes: ['TEST-001', 'TEST-002'],
    };
  },
  async confirmMfaSetup() {
    return testAuthSession;
  },
  async getSession() {
    return testAuthSession;
  },
  async logout() {},
  async refresh() {
    return testAuthSession;
  },
};
