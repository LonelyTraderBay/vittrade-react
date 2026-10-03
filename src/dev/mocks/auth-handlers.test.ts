import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { createAuthApi } from '@/features/auth/api/auth-api';
import { createHttpClient } from '@/shared/api/http-client';
import { handlers, resetDevAuthState } from './handlers';

const server = setupServer(...handlers);
const authApi = createAuthApi(createHttpClient({ baseUrl: 'http://localhost/api' }));
const demoPassword = 'Preview-123!';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetDevAuthState());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('development authentication handlers', () => {
  it('returns the authenticated login envelope accepted by the real adapter', async () => {
    await expect(
      authApi.login({ email: 'developer@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { id: 'dev-user-1', email: 'developer@vittrade.local' } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        email: 'developer@vittrade.local',
        permissions: expect.arrayContaining([
          'trade:read',
          'earn:write',
          'p2p:write',
          'predictions:trade',
          'profile:read',
          'profile:write',
          'profile:security:write',
        ]),
      },
    });
    await expect(authApi.refresh()).resolves.toMatchObject({
      user: { email: 'developer@vittrade.local' },
    });
  });

  it('returns the contract-supported empty session when no session can be refreshed', async () => {
    await expect(authApi.refresh()).resolves.toBeNull();
  });

  it('keeps the development demo button credentials valid', async () => {
    await expect(
      authApi.login({ email: 'demo@vittrade.vn', password: 'demo' }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'demo@vittrade.vn' } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { permissions: expect.not.arrayContaining(['earn:write']) },
    });
  });

  it('limits the Market QA persona to read, watchlist, and alert mock permissions', async () => {
    await expect(
      authApi.login({ email: 'market@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'market@vittrade.local', roles: ['user'] } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: ['market:read', 'market:watchlist:write', 'market:alerts:write'],
      },
    });
  });

  it('limits the Arena preview persona to the contract-required challenge join permission', async () => {
    await expect(
      authApi.login({ email: 'arena@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'arena@vittrade.local', roles: ['user'] } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { permissions: ['arena:join'] },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: expect.not.arrayContaining([
          'trading:write',
          'wallet:write',
          'admin:write',
          'p2p:write',
        ]),
      },
    });
  });

  it('gives the Wallet preview persona only mock wallet write permissions', async () => {
    await expect(
      authApi.login({ email: 'wallet@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'wallet@vittrade.local' } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: expect.arrayContaining(['wallet:read', 'wallet:transfer', 'wallet:withdraw']),
      },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { permissions: expect.not.arrayContaining(['earn:write', 'p2p:write']) },
    });
  });

  it('limits the DCA preview persona to mock DCA read and write permissions', async () => {
    await expect(
      authApi.login({ email: 'dca@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'dca@vittrade.local' } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { permissions: ['dca:read', 'dca:write'] },
    });
  });

  it('limits the Support preview persona to support and notification permissions', async () => {
    await expect(
      authApi.login({ email: 'support@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'support@vittrade.local' } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: ['support:read', 'support:write', 'notifications:read', 'notifications:write'],
      },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: expect.not.arrayContaining([
          'trading:write',
          'wallet:write',
          'profile:write',
          'p2p:write',
        ]),
      },
    });
  });

  it('grants the Admin preview persona read-only Admin access without inheriting other permissions', async () => {
    await expect(
      authApi.login({ email: 'admin@vittrade.local', password: demoPassword }),
    ).resolves.toMatchObject({
      status: 'authenticated',
      session: { user: { email: 'admin@vittrade.local', roles: ['admin'] } },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { roles: ['admin'], permissions: ['admin:read'] },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: {
        permissions: expect.not.arrayContaining([
          'admin:write',
          'trading:write',
          'wallet:withdraw',
          'support:write',
        ]),
      },
    });
  });

  it('returns the contract error for invalid demo credentials without authenticating', async () => {
    await expect(
      authApi.login({ email: 'developer@vittrade.local', password: 'wrong-preview-password' }),
    ).rejects.toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    await expect(authApi.getSession()).rejects.toMatchObject({ status: 401 });
  });

  it('returns an account-locked status for the locked demo persona', async () => {
    await expect(
      authApi.login({ email: 'locked@vittrade.local', password: demoPassword }),
    ).rejects.toMatchObject({ status: 423 });
    await expect(authApi.getSession()).rejects.toMatchObject({ status: 401 });
  });

  it('keeps MFA login unauthenticated until a valid, unexpired challenge is verified once', async () => {
    const result = await authApi.login({ email: 'mfa@vittrade.local', password: demoPassword });
    expect(result).toMatchObject({
      status: 'mfa_required',
      challenge: { id: expect.stringMatching(/^dev-login-mfa-/), method: 'email' },
    });
    if (result.status !== 'mfa_required') throw new Error('Expected an MFA challenge');

    await expect(authApi.getSession()).rejects.toMatchObject({ status: 401 });
    await expect(
      authApi.verifyLoginMfa({ challengeId: result.challenge.id, code: '000000' }),
    ).rejects.toMatchObject({ status: 400, code: 'INVALID_VERIFICATION_CODE' });

    await expect(
      authApi.verifyLoginMfa({ challengeId: result.challenge.id, code: '123456' }),
    ).resolves.toMatchObject({
      user: { id: 'dev-mfa@vittrade.local', email: 'mfa@vittrade.local' },
    });
    await expect(authApi.getSession()).resolves.toMatchObject({
      user: { email: 'mfa@vittrade.local' },
    });
    await expect(
      authApi.verifyLoginMfa({ challengeId: result.challenge.id, code: '123456' }),
    ).rejects.toMatchObject({ status: 410, code: 'LOGIN_CHALLENGE_EXPIRED' });
  });

  it('expires MFA challenges and rejects missing or unknown challenge IDs', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T00:00:00.000Z'));
    try {
      const result = await authApi.login({ email: 'mfa@vittrade.local', password: demoPassword });
      if (result.status !== 'mfa_required') throw new Error('Expected an MFA challenge');

      vi.setSystemTime(new Date('2026-09-27T00:06:00.000Z'));
      await expect(
        authApi.verifyLoginMfa({ challengeId: result.challenge.id, code: '123456' }),
      ).rejects.toMatchObject({ status: 410, code: 'LOGIN_CHALLENGE_EXPIRED' });
      await expect(
        authApi.verifyLoginMfa({ challengeId: 'unknown-login-challenge', code: '123456' }),
      ).rejects.toMatchObject({ status: 410, code: 'LOGIN_CHALLENGE_EXPIRED' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('invalidates any pending login challenge on sign-out', async () => {
    const result = await authApi.login({ email: 'mfa@vittrade.local', password: demoPassword });
    if (result.status !== 'mfa_required') throw new Error('Expected an MFA challenge');

    await authApi.logout();
    await expect(
      authApi.verifyLoginMfa({ challengeId: result.challenge.id, code: '123456' }),
    ).rejects.toMatchObject({ status: 410, code: 'LOGIN_CHALLENGE_EXPIRED' });
    await expect(authApi.getSession()).rejects.toMatchObject({ status: 401 });
  });
});
