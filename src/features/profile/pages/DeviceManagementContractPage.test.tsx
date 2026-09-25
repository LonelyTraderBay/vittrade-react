import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { DeviceManagementContractPage } from './DeviceManagementContractPage';

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

const server = setupServer();

const currentDevice = {
  id: 'device-current',
  name: 'Current Chrome',
  type: 'desktop',
  browser: 'Chrome',
  os: 'Windows',
  ip: '127.0.0.1',
  location: 'Hà Nội',
  lastActive: 'now',
  isCurrent: true,
  isTrusted: true,
  loginAt: '2026-09-24T08:00:00.000Z',
};

const remoteDevice = {
  ...currentDevice,
  id: 'device-remote',
  name: 'Remote Safari',
  type: 'mobile',
  browser: 'Safari',
  os: 'iOS',
  ip: '203.0.113.8',
  location: 'Singapore',
  isCurrent: false,
  isTrusted: false,
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function writeAdapter(): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['profile:security:write'],
      },
    },
  };
}

function installDeviceHandler(items: Array<typeof currentDevice | typeof remoteDevice>) {
  server.use(http.get('*/profile/devices', () => HttpResponse.json({ items })));
}

describe('DeviceManagementContractPage', () => {
  it('updates trust and revokes a remote device with idempotent requests', async () => {
    const items = [currentDevice, remoteDevice];
    let trustBody: unknown;
    let trustIdempotencyKey: string | null = null;
    let revokeIdempotencyKey: string | null = null;
    installDeviceHandler(items);
    server.use(
      http.patch('*/profile/devices/device-remote/trust', async ({ request }) => {
        trustBody = await request.json();
        trustIdempotencyKey = request.headers.get('Idempotency-Key');
        const updated = { ...remoteDevice, isTrusted: true };
        items[1] = updated;
        return HttpResponse.json({ item: updated });
      }),
      http.post('*/profile/devices/device-remote/revoke', ({ request }) => {
        revokeIdempotencyKey = request.headers.get('Idempotency-Key');
        items.splice(1, 1);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: writeAdapter() });

    const user = userEvent.setup();
    expect(await screen.findByText('Thiết bị hiện tại')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tin cậy' }));

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã đánh dấu thiết bị đáng tin cậy.', {
        duration: 1500,
      }),
    );
    expect(trustBody).toEqual({ trusted: true });
    expect(trustIdempotencyKey).toMatch(/^profile-device-trust-/);
    expect(await screen.findByRole('button', { name: 'Bỏ tin cậy' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Thu hồi' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Đã thu hồi thiết bị.', { duration: 1500 }),
    );
    expect(revokeIdempotencyKey).toMatch(/^profile-device-revoke-/);
    expect(screen.queryByText('Remote Safari')).not.toBeInTheDocument();
    expect(screen.getByText('Current Chrome')).toBeVisible();
  });

  it('shows an explicit empty state when no devices are registered', async () => {
    installDeviceHandler([]);

    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: writeAdapter() });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Chưa có thiết bị nào được ghi nhận.',
    );
  });

  it('reports a failed trust mutation and keeps the device unchanged', async () => {
    installDeviceHandler([remoteDevice]);
    server.use(
      http.patch('*/profile/devices/device-remote/trust', () =>
        HttpResponse.json({ message: 'Device trust service unavailable' }, { status: 503 }),
      ),
    );
    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: writeAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Tin cậy' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Device trust service unavailable', {
        duration: 2000,
      }),
    );
    expect(screen.getByRole('button', { name: 'Tin cậy' })).toBeVisible();
    expect(screen.getByText('Chưa tin cậy')).toBeVisible();
  });

  it('reports a failed device revocation and retains the device in the list', async () => {
    installDeviceHandler([remoteDevice]);
    server.use(
      http.post('*/profile/devices/device-remote/revoke', () =>
        HttpResponse.json({ message: 'Device revocation unavailable' }, { status: 503 }),
      ),
    );
    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: writeAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Thu hồi' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Device revocation unavailable', { duration: 2000 }),
    );
    expect(screen.getByText('Remote Safari')).toBeVisible();
  });

  it('renders a retry action after device loading fails', async () => {
    let requests = 0;
    server.use(
      http.get('*/profile/devices', () => {
        requests += 1;
        return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
      }),
    );
    renderWithProviders(<DeviceManagementContractPage />, { authAdapter: writeAdapter() });

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByRole('button', { name: 'Thử lại' })).toBeVisible();
    expect(requests).toBeGreaterThan(1);
  });
});
