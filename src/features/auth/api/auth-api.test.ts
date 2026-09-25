import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { apiClient } from '@/shared/api/app-client';
import { createAuthApi } from './auth-api';

const server = setupServer();
const authApiForTest = createAuthApi(apiClient);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const session = {
  user: {
    id: 'usr001',
    email: 'user@example.com',
    fullName: 'Test User',
    roles: ['user'],
    permissions: ['market:read'],
    kycStatus: 'verified',
  },
  accessTokenExpiresAt: '2026-09-22T20:00:00.000Z',
  accessToken: 'memory-only-token',
};

describe('auth API contract', () => {
  it('sends credentials to the login contract', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', async ({ request }) => {
        expect(await request.json()).toEqual({ email: 'user@example.com', password: 'secret' });
        expect(request.headers.get('Authorization')).toBeNull();
        return HttpResponse.json({ status: 'authenticated', session });
      }),
    );

    await expect(
      authApiForTest.login({ email: 'user@example.com', password: 'secret' }),
    ).resolves.toMatchObject({ status: 'authenticated', session: { user: { id: 'usr001' } } });
  });

  it('parses a backend-issued login MFA challenge', async () => {
    const challenge = {
      id: 'login-challenge-001',
      method: 'totp',
      maskedDestination: 'u***@example.com',
      expiresAt: '2026-09-22T20:00:00.000Z',
    };
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({ status: 'mfa_required', challenge }),
      ),
    );

    await expect(
      authApiForTest.login({ email: 'user@example.com', password: 'secret' }),
    ).resolves.toEqual({ status: 'mfa_required', challenge });
  });

  it('verifies a login challenge with only its ID and code', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login/mfa/verify', async ({ request }) => {
        expect(await request.json()).toEqual({
          challengeId: 'login-challenge-001',
          code: '123456',
        });
        return HttpResponse.json(session);
      }),
    );

    await expect(
      authApiForTest.verifyLoginMfa({ challengeId: 'login-challenge-001', code: '123456' }),
    ).resolves.toMatchObject({ user: { id: 'usr001' } });
  });

  it('rejects malformed login MFA challenges at the API boundary', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({
          status: 'mfa_required',
          challenge: { id: '', method: 'password', expiresAt: 'not-a-date' },
        }),
      ),
    );

    await expect(
      authApiForTest.login({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow();
  });

  it('rejects a whitespace-only login challenge ID', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({
          status: 'mfa_required',
          challenge: {
            id: '   ',
            method: 'totp',
            expiresAt: '2026-09-22T20:00:00.000Z',
          },
        }),
      ),
    );

    await expect(
      authApiForTest.login({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow();
  });

  it('refreshes and logs out through the session contract', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/refresh', () => HttpResponse.json(session)),
      http.post(
        'http://localhost:3000/api/auth/logout',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    await expect(authApiForTest.refresh()).resolves.toMatchObject({
      accessTokenExpiresAt: session.accessTokenExpiresAt,
    });
    await expect(authApiForTest.logout()).resolves.toBeUndefined();
  });

  it('verifies MFA, manages setup and reads the current contract session', async () => {
    const challenge = {
      secret: 'TEST-SECRET',
      qrCodeUrl: 'data:image/svg+xml,<svg/>',
      backupCodes: ['TEST-001', 'TEST-002'],
    };
    server.use(
      http.post('http://localhost:3000/api/auth/mfa/verify', async ({ request }) => {
        expect(await request.json()).toEqual({ contact: 'user@example.com', code: '123456' });
        return HttpResponse.json(session);
      }),
      http.post('http://localhost:3000/api/auth/mfa/setup', () => HttpResponse.json(challenge)),
      http.post('http://localhost:3000/api/auth/mfa/setup/confirm', async ({ request }) => {
        expect(await request.json()).toEqual({ code: '654321' });
        return HttpResponse.json(session);
      }),
      http.get('http://localhost:3000/api/auth/session', () => HttpResponse.json(null)),
    );

    await expect(
      authApiForTest.verifyMfa({ contact: 'user@example.com', code: '123456' }),
    ).resolves.toMatchObject({ user: { id: 'usr001' } });
    await expect(authApiForTest.beginMfaSetup()).resolves.toEqual(challenge);
    await expect(authApiForTest.confirmMfaSetup({ code: '654321' })).resolves.toMatchObject({
      user: { id: 'usr001' },
    });
    await expect(authApiForTest.getSession()).resolves.toBeNull();
  });

  it('rejects malformed session and MFA setup responses at the API boundary', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () =>
        HttpResponse.json({
          status: 'authenticated',
          session: { ...session, user: { ...session.user, permissions: undefined } },
        }),
      ),
      http.post('http://localhost:3000/api/auth/mfa/setup', () =>
        HttpResponse.json({
          secret: 'TEST-SECRET',
          qrCodeUrl: 'data:image/svg+xml,<svg/>',
          backupCodes: [],
        }),
      ),
    );

    await expect(
      authApiForTest.login({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toThrow();
    await expect(authApiForTest.beginMfaSetup()).rejects.toThrow();
  });
});
