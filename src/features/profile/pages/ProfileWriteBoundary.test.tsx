import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderWithProviders, screen } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { DeviceManagementContractPage } from './DeviceManagementContractPage';
import { EditProfileContractPage } from './EditProfileContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function readOnlyAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: { ...testAuthAdapter.initialSession!.user, permissions: ['profile:read'] },
    },
  };
}

const profile = {
  id: 'user-1',
  email: 'user@example.com',
  phone: '+84 900 000 000',
  fullName: 'Nguyễn Văn A',
  username: 'vana',
  avatar: null,
  kycLevel: 2,
  kycStatus: 'verified',
  referralCode: 'VITTA',
  vipLevel: 1,
  joinDate: '2026-01-01',
  has2FA: true,
  totalBalance: 1000,
};

describe('Profile write permission boundary', () => {
  it('keeps profile editing disabled for read-only sessions', async () => {
    server.use(http.get('*/profile', () => HttpResponse.json(profile)));

    renderWithProviders(<EditProfileContractPage />, { authAdapter: readOnlyAdapter() });

    expect(
      await screen.findByText('Profile edit permission is required to update account details.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lưu/i })).toBeDisabled();
  });

  it('keeps trusted-device mutations disabled for read-only sessions', async () => {
    server.use(
      http.get('*/profile/devices', () =>
        HttpResponse.json({
          items: [
            {
              id: 'device-1',
              name: 'Chrome Desktop',
              type: 'desktop',
              browser: 'Chrome',
              os: 'Windows',
              ip: '127.0.0.1',
              location: 'Hanoi',
              lastActive: '2026-09-23T00:00:00.000Z',
              isCurrent: false,
              isTrusted: false,
              loginAt: '2026-09-22T00:00:00.000Z',
            },
          ],
        }),
      ),
    );

    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: readOnlyAdapter() });

    expect(
      await screen.findByText('Profile security permission is required to manage trusted devices.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tin cậy' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Thu hồi' })).toBeDisabled();
  });
});
