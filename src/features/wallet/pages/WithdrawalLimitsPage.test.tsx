import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { renderWithProviders } from '@/test/test-utils';
import { WithdrawalLimitsPage } from './WithdrawalLimitsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const singleAssetResponse = {
  items: [
    {
      id: 'btc',
      symbol: 'BTC',
      name: 'Bitcoin',
      balance: 1,
      available: 1,
      frozen: 0,
      inOrder: 0,
      usdValue: 60_000,
      change24h: 0,
      logoColor: '#F7931A',
    },
  ],
  summary: {
    totalUsd: 60_000,
    totalBtc: 1,
    availableUsd: 60_000,
    inOrderUsd: 0,
    frozenUsd: 0,
  },
};

function installSingleAssetResponse() {
  server.use(http.get('*/wallet/assets', () => HttpResponse.json(singleAssetResponse)));
}

describe('withdrawal limits page', () => {
  it('shows server-provided limits and loads policy for the selected asset', async () => {
    const requestedAssets: string[] = [];
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({
          items: [
            {
              id: 'btc',
              symbol: 'BTC',
              name: 'Bitcoin',
              balance: 1,
              available: 1,
              frozen: 0,
              inOrder: 0,
              usdValue: 60_000,
              change24h: 0,
              logoColor: '#F7931A',
            },
            {
              id: 'eth',
              symbol: 'ETH',
              name: 'Ethereum',
              balance: 5,
              available: 5,
              frozen: 0,
              inOrder: 0,
              usdValue: 15_000,
              change24h: 0,
              logoColor: '#627EEA',
            },
          ],
          summary: {
            totalUsd: 75_000,
            totalBtc: 1.25,
            availableUsd: 75_000,
            inOrderUsd: 0,
            frozenUsd: 0,
          },
        }),
      ),
      http.get('*/wallet/withdrawal/networks', ({ request }) => {
        const asset = new URL(request.url).searchParams.get('asset') ?? '';
        requestedAssets.push(asset);
        return HttpResponse.json({
          networks: [
            {
              id: `${asset}-mainnet`,
              name: `${asset} Mainnet`,
              fee: 0.001,
              minWithdraw: 0.01,
              maxWithdraw: 5,
            },
          ],
        });
      }),
    );

    renderWithProviders(<WithdrawalLimitsPage />);

    expect(await screen.findByText('BTC Mainnet')).toBeInTheDocument();
    expect(screen.getByText('0.01 BTC')).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Withdrawal asset'), 'ETH');
    expect(await screen.findByText('ETH Mainnet')).toBeInTheDocument();
    expect(requestedAssets).toEqual(['BTC', 'ETH']);
  });

  it('does not request wallet policies without read permission', async () => {
    let requests = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        requests += 1;
        return HttpResponse.json(singleAssetResponse);
      }),
      http.get('*/wallet/withdrawal/networks', () => {
        requests += 1;
        return HttpResponse.json({ networks: [] });
      }),
    );
    const noReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<WithdrawalLimitsPage />, { authAdapter: noReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent('Wallet read permission');
    expect(requests).toBe(0);
  });

  it('shows the loading state until wallet assets arrive', async () => {
    let resolveAssets!: (response: Response) => void;
    const assetsResponse = new Promise<Response>((resolve) => {
      resolveAssets = resolve;
    });
    server.use(
      http.get('*/wallet/assets', () => assetsResponse),
      http.get('*/wallet/withdrawal/networks', () =>
        HttpResponse.json({
          networks: [
            { id: 'btc-mainnet', name: 'BTC Mainnet', fee: 0, minWithdraw: 0.01, maxWithdraw: 5 },
          ],
        }),
      ),
    );

    renderWithProviders(<WithdrawalLimitsPage />);
    expect(screen.getByText('Loading wallet assets…')).toBeInTheDocument();

    await act(async () => resolveAssets(HttpResponse.json(singleAssetResponse)));
    expect(await screen.findByText('BTC Mainnet')).toBeInTheDocument();
  });

  it('shows an empty state when the server returns no wallet assets', async () => {
    let networkRequests = 0;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json({ ...singleAssetResponse, items: [] })),
      http.get('*/wallet/withdrawal/networks', () => {
        networkRequests += 1;
        return HttpResponse.json({ networks: [] });
      }),
    );

    renderWithProviders(<WithdrawalLimitsPage />);

    expect(await screen.findByText('No wallet assets are available.')).toBeInTheDocument();
    expect(networkRequests).toBe(0);
  });

  it('retries a failed wallet asset request', async () => {
    let assetsAvailable = false;
    server.use(
      http.get('*/wallet/assets', () =>
        assetsAvailable
          ? HttpResponse.json(singleAssetResponse)
          : HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 }),
      ),
      http.get('*/wallet/withdrawal/networks', () =>
        HttpResponse.json({
          networks: [
            { id: 'btc-mainnet', name: 'BTC Mainnet', fee: 0, minWithdraw: 0.01, maxWithdraw: 5 },
          ],
        }),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<WithdrawalLimitsPage />);

    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    assetsAvailable = true;
    await user.click(retry);

    expect(await screen.findByText('BTC Mainnet')).toBeInTheDocument();
  });

  it('shows the network loading state after assets have loaded', async () => {
    let resolveNetworks!: (response: Response) => void;
    const networksResponse = new Promise<Response>((resolve) => {
      resolveNetworks = resolve;
    });
    installSingleAssetResponse();
    server.use(http.get('*/wallet/withdrawal/networks', () => networksResponse));

    renderWithProviders(<WithdrawalLimitsPage />);
    expect(await screen.findByText('Loading withdrawal network policies…')).toBeInTheDocument();

    await act(async () =>
      resolveNetworks(
        HttpResponse.json({
          networks: [
            { id: 'btc-mainnet', name: 'BTC Mainnet', fee: 0, minWithdraw: 0.01, maxWithdraw: 5 },
          ],
        }),
      ),
    );
    expect(await screen.findByText('BTC Mainnet')).toBeInTheDocument();
  });

  it('retries failed network policies and renders both server memo-label forms', async () => {
    let networksAvailable = false;
    server.use(
      http.get('*/wallet/assets', () => HttpResponse.json(singleAssetResponse)),
      http.get('*/wallet/withdrawal/networks', () =>
        networksAvailable
          ? HttpResponse.json({
              networks: [
                {
                  id: 'btc-tag',
                  name: 'BTC Tag Network',
                  fee: 0.001,
                  minWithdraw: 0.01,
                  maxWithdraw: 5,
                  requiresMemo: true,
                  memoLabel: 'Destination tag',
                },
                {
                  id: 'btc-memo',
                  name: 'BTC Memo Network',
                  fee: 0.001,
                  minWithdraw: 0.01,
                  maxWithdraw: 5,
                  requiresMemo: true,
                },
              ],
            })
          : HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 }),
      ),
    );
    const user = userEvent.setup();

    renderWithProviders(<WithdrawalLimitsPage />);

    const retry = await screen.findByRole('button', { name: 'Thử lại' });
    networksAvailable = true;
    await user.click(retry);

    expect(await screen.findByText('BTC Tag Network')).toBeInTheDocument();
    expect(screen.getByText('Destination tag')).toBeInTheDocument();
    expect(screen.getByText('BTC Memo Network')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
  });

  it('shows an empty state when the selected asset has no withdrawal networks', async () => {
    installSingleAssetResponse();
    server.use(http.get('*/wallet/withdrawal/networks', () => HttpResponse.json({ networks: [] })));

    renderWithProviders(<WithdrawalLimitsPage />);

    expect(
      await screen.findByText('No withdrawal networks are available for BTC.'),
    ).toBeInTheDocument();
  });
});
