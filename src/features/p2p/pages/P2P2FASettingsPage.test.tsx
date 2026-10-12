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

  it('closes an authenticator setup sheet and can reopen it before confirmation', async () => {
    let setupRequests = 0;
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.post('*/p2p/security/2fa/authenticator/setup', () => {
        setupRequests += 1;
        return HttpResponse.json({
          secret: `secret-${setupRequests}`,
          qrCodeUrl: `https://example.test/qr-${setupRequests}.png`,
          expiresAt: '2026-09-22T11:30:00.000Z',
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('Authenticator App');
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Authenticator App' }));
    expect(await screen.findByAltText('QR setup Authenticator')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    await waitFor(() =>
      expect(screen.queryByAltText('QR setup Authenticator')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Authenticator App' }));

    expect(await screen.findByAltText('QR setup Authenticator')).toBeInTheDocument();
    expect(setupRequests).toBe(2);
  });

  it('enables a non-setup authentication method and confirms its success state', async () => {
    let current = settings;
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(current)),
      http.patch('*/p2p/security/2fa/methods/2fa_email', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        expect(await request.json()).toEqual({ enabled: true });
        current = {
          ...settings,
          methods: settings.methods.map((method) =>
            method.id === '2fa_email' ? { ...method, enabled: true } : method,
          ),
        };
        return HttpResponse.json(current);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('Authenticator App');

    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Email' }));

    expect(await screen.findByText('2FA đã bật (2 phương thức)')).toBeInTheDocument();
    expect(screen.getByText('Phương thức chính: SMS')).toBeInTheDocument();
  });

  it('keeps Authenticator disabled when creating its setup challenge fails', async () => {
    const toastError = vi.spyOn(toast, 'error');
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.post('*/p2p/security/2fa/authenticator/setup', () =>
        HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);

    await screen.findByText('Authenticator App');
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Authenticator App' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Không thể tạo phiên setup Authenticator.',
        expect.anything(),
      ),
    );
    expect(screen.queryByAltText('QR setup Authenticator')).not.toBeInTheDocument();
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
    expect(
      await screen.findByRole('spinbutton', { name: 'Giá trị threshold' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Đóng' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('spinbutton', { name: 'Giá trị threshold' }),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Sửa' }));
    const thresholdInput = screen.getByRole('spinbutton', { name: 'Giá trị threshold' });
    fireEvent.change(thresholdInput, { target: { value: '2500' } });
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(thresholdBody).toHaveBeenCalledWith({ value: 2_500 }));
  });

  it('updates the 2FA threshold policy through the contract', async () => {
    const thresholdRequest = vi.fn();
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.patch('*/p2p/security/2fa/thresholds/release', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBeTruthy();
        thresholdRequest(await request.json());
        return HttpResponse.json({
          ...settings,
          thresholds: settings.thresholds.map((threshold) => ({ ...threshold, enabled: false })),
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);

    await screen.findByText('2FA đã bật (1 phương thức)');
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Release order' }));

    await waitFor(() => expect(thresholdRequest).toHaveBeenCalledWith({ enabled: false }));
    await waitFor(() => expect(screen.queryByText('≥ 1,000 USDT')).not.toBeInTheDocument());
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

    fireEvent.change(thresholdInput, { target: { value: '2500' } });
    await user.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Không thể cập nhật threshold.', expect.anything()),
    );
    await user.click(screen.getByRole('button', { name: 'Đóng' }));

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
    await userEvent.click(screen.getByRole('button', { name: 'Sửa' }));
    expect(screen.queryByRole('spinbutton', { name: 'Giá trị threshold' })).not.toBeInTheDocument();
  });

  it('recovers from failed 2FA settings reads using the error-state retry action', async () => {
    let reads = 0;
    server.use(
      http.get('*/p2p/security/2fa/settings', () => {
        reads += 1;
        return reads <= 3
          ? HttpResponse.json({ message: 'Security service unavailable' }, { status: 503 })
          : HttpResponse.json(settings);
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);

    expect(
      await screen.findByText('Không thể tải cài đặt 2FA', {}, { timeout: 5_000 }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('2FA đã bật (1 phương thức)')).toBeInTheDocument();
    expect(reads).toBe(4);
  });

  it('renders multiple thresholds without a primary authentication method', async () => {
    const noPrimarySettings: P2P2FASettingsResponse = {
      ...settings,
      methods: settings.methods.map((method) => ({ ...method, isPrimary: false })),
      thresholds: [
        ...settings.thresholds,
        {
          id: 'create_order',
          label: 'Create order',
          description: 'Yêu cầu 2FA khi tạo lệnh',
          value: 0,
          unit: 'USDT',
          enabled: false,
        },
      ],
    };
    server.use(http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(noPrimarySettings)));
    renderWithProviders(<P2P2FASettingsPage />);

    expect(await screen.findByText('Phương thức chính: Chưa chọn')).toBeInTheDocument();
    expect(screen.getByText('Release order')).toBeInTheDocument();
    expect(screen.getByText('Create order')).toBeInTheDocument();
    expect(screen.queryByText('≥ 0 USDT')).not.toBeInTheDocument();
  });

  it('keeps the current primary method and reports primary-method update failures', async () => {
    const toastError = vi.spyOn(toast, 'error');
    server.use(
      http.get('*/p2p/security/2fa/settings', () =>
        HttpResponse.json({
          ...settings,
          methods: settings.methods.map((method) =>
            method.id === '2fa_email' ? { ...method, enabled: true } : method,
          ),
        }),
      ),
      http.post('*/p2p/security/2fa/primary', () =>
        HttpResponse.json({ message: 'Primary method update failed' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('Phương thức chính: SMS');

    await user.click(screen.getByRole('button', { name: 'Set primary 2FA method: Email' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Không thể đặt phương thức chính.',
        expect.anything(),
      ),
    );
    expect(screen.getByText('Phương thức chính: SMS')).toBeInTheDocument();
  });

  it('reports threshold-policy update failures and leaves the saved policy unchanged', async () => {
    const toastError = vi.spyOn(toast, 'error');
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.patch('*/p2p/security/2fa/thresholds/release', () =>
        HttpResponse.json({ message: 'Threshold update failed' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('≥ 1,000 USDT');

    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Release order' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Không thể cập nhật chính sách threshold.',
        expect.anything(),
      ),
    );
    expect(screen.getByText('≥ 1,000 USDT')).toBeInTheDocument();
  });

  it('keeps the authenticator setup available after an expired-code confirmation fails', async () => {
    const toastError = vi.spyOn(toast, 'error');
    let confirmRequests = 0;
    server.use(
      http.get('*/p2p/security/2fa/settings', () => HttpResponse.json(settings)),
      http.post('*/p2p/security/2fa/authenticator/setup', () =>
        HttpResponse.json({
          secret: 'secret-expired',
          qrCodeUrl: 'https://example.test/qr-expired.png',
          expiresAt: '2026-09-22T11:30:00.000Z',
        }),
      ),
      http.post('*/p2p/security/2fa/authenticator/confirm', () => {
        confirmRequests += 1;
        return HttpResponse.json({ message: 'Expired code' }, { status: 401 });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<P2P2FASettingsPage />);
    await screen.findByText('Authenticator App');
    await user.click(screen.getByRole('button', { name: 'Bật hoặc tắt Authenticator App' }));
    const codeInput = await screen.findByRole('textbox', { name: 'Mã Authenticator' });
    fireEvent.change(codeInput, { target: { value: '123456' } });
    expect(codeInput).toHaveValue('123456');
    expect(screen.getByRole('button', { name: 'Xác nhận setup' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Xác nhận setup' }));
    await waitFor(() => expect(confirmRequests).toBe(1));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith(
        'Mã Authenticator không hợp lệ hoặc đã hết hạn.',
        expect.anything(),
      ),
    );
    expect(screen.getByRole('textbox', { name: 'Mã Authenticator' })).toHaveValue('123456');
  });
});
