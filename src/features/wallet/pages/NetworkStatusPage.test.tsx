import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { NetworkStatusPage } from './NetworkStatusPage';

const server = setupServer();
const networkStatuses = {
  items: [
    {
      id: 'network-1',
      name: 'Network One',
      status: 'operational',
      depositEnabled: true,
      withdrawalEnabled: true,
      updatedAt: '2026-09-25T10:00:00.000Z',
    },
    {
      id: 'network-2',
      name: 'Network Two',
      status: 'maintenance',
      depositEnabled: false,
      withdrawalEnabled: false,
      updatedAt: '2026-09-25T10:00:00.000Z',
      message: 'Maintenance notice from the API.',
    },
  ],
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Wallet network status page', () => {
  it('renders contract data and availability returned by the wallet API', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/network-status', () =>
        HttpResponse.json(networkStatuses),
      ),
    );

    renderWithProviders(<NetworkStatusPage />);

    expect(await screen.findByText('Network One')).toBeInTheDocument();
    expect(screen.getByText('1 hoạt động · 1 cần chú ý')).toBeInTheDocument();
    expect(screen.getByText('Maintenance notice from the API.')).toBeInTheDocument();
    expect(screen.getByText('Nạp: tạm dừng')).toBeInTheDocument();
    expect(screen.getByText('Rút: tạm dừng')).toBeInTheDocument();
  });

  it('hides cached status when a refresh fails instead of presenting stale availability', async () => {
    let requestCount = 0;
    server.use(
      http.get('http://localhost:3000/api/wallet/network-status', () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json(networkStatuses)
          : HttpResponse.json(
              { code: 'WALLET_NETWORK_STATUS_UNAVAILABLE', message: 'Source unavailable.' },
              { status: 503 },
            );
      }),
    );

    renderWithProviders(<NetworkStatusPage />);

    expect(await screen.findByText('Network One')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật trạng thái mạng' }));

    expect(
      await screen.findByText(/Wallet API chưa trả dữ liệu trạng thái mạng/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Network One')).not.toBeInTheDocument();
  });

  it('shows an explicit unavailable state when the API has no network records', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/network-status', () =>
        HttpResponse.json({ items: [] }),
      ),
    );

    renderWithProviders(<NetworkStatusPage />);

    expect(await screen.findByText('Chưa có trạng thái mạng')).toBeInTheDocument();
    expect(screen.queryByText('0 hoạt động · 0 cần chú ý')).not.toBeInTheDocument();
  });

  it('does not request network status without wallet read permission', async () => {
    let requested = false;
    server.use(
      http.get('http://localhost:3000/api/wallet/network-status', () => {
        requested = true;
        return HttpResponse.json(networkStatuses);
      }),
    );
    const readlessAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<NetworkStatusPage />, { authAdapter: readlessAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tài khoản của bạn không có quyền xem trạng thái mạng.',
    );
    expect(requested).toBe(false);
  });
});
