import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { profileApi } from './profile-api';

const server = setupServer();
const profile = {
  id: 'usr001',
  email: 'user@example.com',
  phone: '+84 900 000 000',
  fullName: 'Nguyễn Văn A',
  username: 'nguyenvana',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified',
  referralCode: 'VITTA-A2B3C',
  vipLevel: 1,
  joinDate: '2023-08-15',
  has2FA: true,
  totalBalance: 54_276.79,
};
const device = {
  id: 'dev001',
  name: 'Chrome Desktop',
  type: 'desktop',
  browser: 'Chrome',
  os: 'Windows',
  ip: '127.0.0.1',
  location: 'Hà Nội',
  lastActive: 'now',
  isCurrent: true,
  isTrusted: true,
  loginAt: '2026-09-22T08:00:00.000Z',
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('profile API contract', () => {
  it('loads the authenticated profile and validates the response', async () => {
    server.use(http.get('http://localhost:3000/api/profile', () => HttpResponse.json(profile)));
    await expect(profileApi.getProfile()).resolves.toMatchObject({ id: 'usr001', has2FA: true });
  });

  it('updates profile with an idempotency key', async () => {
    server.use(
      http.patch('http://localhost:3000/api/profile', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('profile-update-1');
        expect(await request.json()).toEqual({ fullName: 'Nguyễn Văn B', phone: '+84 911' });
        return HttpResponse.json({ ...profile, fullName: 'Nguyễn Văn B', phone: '+84 911' });
      }),
    );
    await expect(
      profileApi.updateProfile({ fullName: 'Nguyễn Văn B', phone: '+84 911' }, 'profile-update-1'),
    ).resolves.toMatchObject({ fullName: 'Nguyễn Văn B' });
  });

  it('loads devices and sends trust changes through a mutation boundary', async () => {
    server.use(
      http.get('http://localhost:3000/api/profile/devices', () =>
        HttpResponse.json({ items: [device] }),
      ),
      http.patch('http://localhost:3000/api/profile/devices/dev001/trust', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('device-trust-1');
        expect(await request.json()).toEqual({ trusted: false });
        return HttpResponse.json({ item: { ...device, isTrusted: false } });
      }),
    );
    await expect(profileApi.listDevices()).resolves.toEqual({ items: [device] });
    await expect(
      profileApi.setDeviceTrust('dev001', false, 'device-trust-1'),
    ).resolves.toMatchObject({ isTrusted: false });
  });

  it('revokes devices without retrying the non-idempotent mutation', async () => {
    server.use(
      http.post('http://localhost:3000/api/profile/devices/dev001/revoke', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('device-revoke-1');
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await expect(profileApi.revokeDevice('dev001', 'device-revoke-1')).resolves.toBeUndefined();
  });

  it('loads immutable activity and sub-account collections', async () => {
    server.use(
      http.get('http://localhost:3000/api/profile/activity', () =>
        HttpResponse.json({ items: [] }),
      ),
      http.get('http://localhost:3000/api/profile/sub-accounts', () =>
        HttpResponse.json({ items: [] }),
      ),
    );
    await expect(profileApi.listActivity()).resolves.toEqual({ items: [] });
    await expect(profileApi.listSubAccounts()).resolves.toEqual({ items: [] });
  });
});
