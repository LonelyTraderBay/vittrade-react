import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { toast } from 'sonner';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2P2FASettingsResponse } from '../model/p2p-types';
import { P2P2FASettingsPage } from './P2P2FASettingsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const settings: P2P2FASettingsResponse = {
  methods: [
    {
      id: '2fa_sms',
      label: 'SMS',
      description: 'Mã xác thực qua SMS',
      enabled: true,
      isPrimary: true,
      setupRequired: false,
      color: '#3B82F6',
    },
    {
      id: '2fa_authenticator',
      label: 'Authenticator App',
      description: 'Mã TOTP từ ứng dụng Authenticator',
      enabled: false,
      isPrimary: false,
      setupRequired: true,
      color: '#8B5CF6',
    },
    {
      id: '2fa_email',
      label: 'Email',
      description: 'Mã xác thực qua email',
      enabled: false,
      isPrimary: false,
      setupRequired: false,
      color: '#10B981',
    },
  ],
  thresholds: [
    {
      id: 'release',
      label: 'Release order',
      description: 'Yêu cầu 2FA khi release',
      value: 1_000,
      unit: 'USDT',
      enabled: true,
    },
  ],
};

describe('P2P 2FA settings contract page', () => {
  it('loads settings and updates a method with an idempotency key', async () => {
    let current = settings;
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(current)),
      http.patch('*/p2p/security/2fa/methods/2fa_sms', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ enabled: false });
        current = {
          ...settings,
          methods: settings.methods.map((method) =>
            method.id === '2fa_sms' ? { ...method, enabled: false, isPrimary: false } : method,
          ),
        };
        return HttpResponse.json(current);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    expect(await screen.findByText('2FA đã bật (1 phương thức)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt SMS' }));
    await waitFor(() => expect(screen.getByText('2FA chưa bật')).toBeInTheDocument());
  });

  it('runs the authenticator setup and confirm contract', async () => {
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.post('*/p2p/security/2fa/authenticator/setup', () =>
        HttpResponse.json({
          secret: 'secret-1',
          qrCodeUrl: 'https://example.test/qr.png',
          expiresAt: '2026-09-22T11:30:00.000Z',
        }),
      ),
      http.post('*/p2p/security/2fa/authenticator/confirm', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ code: '123456' });
        return HttpResponse.json({
          ...settings,
          methods: settings.methods.map((method) =>
            method.id === '2fa_authenticator'
              ? { ...method, enabled: true, setupRequired: false }
              : method,
          ),
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('Authenticator App');
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Authenticator App' }));
    expect(await screen.findByAltText('QR setup Authenticator')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Mã Authenticator' }), {
      target: { value: '123456' },
    });
    await user.click(screen.getByRole('button', { name: 'Xác nhận setup' }));
    await waitFor(() =>
      expect(screen.queryByRole('textbox', { name: 'Mã Authenticator' })).not.toBeInTheDocument(),
    );
  });

  it('sets a primary method and saves a validated transaction threshold', async () => {
    const primaryBody = vi.fn();
    const thresholdBody = vi.fn();
    const enabledMethods = {
      ...settings,
      methods: settings.methods.map((method) =>
        method.id === '2fa_email' ? { ...method, enabled: true } : method,
      ),
    };
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(enabledMethods)),
      http.post('*/p2p/security/2fa/primary', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        primaryBody(await request.json());
        return HttpResponse.json({
          ...settings,
          methods: settings.methods.map((method) => ({
            ...method,
            isPrimary: method.id === '2fa_email',
          })),
        });
      }),
      http.patch('*/p2p/security/2fa/thresholds/release', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        thresholdBody(await request.json());
        return HttpResponse.json({
          ...settings,
          thresholds: settings.thresholds.map((threshold) => ({
            ...threshold,
            value: 2_500,
          })),
        });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('2FA đã bật (2 phương thức)');

    await user.click(screen.getByRole('button', { name: 'Set primary 2FA method: Email' }));
    expect(await screen.findByText('Phương thức chính: Email')).toBeInTheDocument();
    expect(primaryBody).toHaveBeenCalledWith({ methodId: '2fa_email' });

    await user.click(screen.getByRole('button', { name: 'Sửa' }));
    const thresholdInput = screen.getByRole('spinbutton', { name: 'Giá trị threshold' });
    fireEvent.change(thresholdInput, { target: { value: '2500' } });
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(thresholdBody).toHaveBeenCalledWith({ value: 2_500 }));
  });

  it('rejects a negative threshold locally and surfaces a failed method update', async () => {
    const toastError = vi.spyOn(toast, 'error');
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.patch('*/p2p/security/2fa/thresholds/release', () =>
        HttpResponse.json({ message: 'unexpected request' }, { status: 500 }),
      ),
      http.patch('*/p2p/security/2fa/methods/2fa_sms', () =>
        HttpResponse.json({ message: 'update failed' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('2FA đã bật (1 phương thức)');

    await user.click(screen.getByRole('button', { name: 'Sửa' }));
    const thresholdInput = screen.getByRole('spinbutton', { name: 'Giá trị threshold' });
    fireEvent.change(thresholdInput, { target: { value: '-1' } });
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(toastError).toHaveBeenCalledWith(
      'Giá trị threshold không hợp lệ.',
      expect.objectContaining({ duration: 2000 }),
    );

    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt SMS' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Không thể cập nhật phương thức 2FA.',
        expect.anything(),
      ),
    );
  });

  it('keeps 2FA settings readable but blocks writes without security permission', async () => {
    server.use(http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)));
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    };

    renderWithProviders(<P2P2FASettingsPage />, { authAdapter: readOnlyAdapter });

    expect(
      await screen.findByText('P2P security write permission is required to change 2FA settings.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bật hoặc tắt SMS' })).toBeDisabled();
  });
});
