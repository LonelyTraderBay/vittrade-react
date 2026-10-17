import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { WalletTransferContractPage } from './WalletTransferContractPage';

const server = setupServer();

const accounts = {
  items: [
    { id: 'spot', name: 'Spot wallet', balanceUsd: 1_000 },
    { id: 'funding', name: 'Funding wallet', balanceUsd: 500 },
    { id: 'futures', name: 'Futures wallet', balanceUsd: 250 },
  ],
};

const assets = {
  items: [
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether',
      balance: 100,
      available: 75,
      frozen: 25,
      inOrder: 25,
      usdValue: 100,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: { totalUsd: 100, totalBtc: 0.001, availableUsd: 75, inOrderUsd: 25, frozenUsd: 0 },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function installReadHandlers() {
  server.use(
    http.get('*/wallet/accounts', () => HttpResponse.json(accounts)),
    http.get('*/wallet/assets', () => HttpResponse.json(assets)),
  );
}

describe('Wallet transfer contract page', () => {
  it('renders typed account and asset data', async () => {
    installReadHandlers();

    renderWithProviders(<WalletTransferContractPage />);

    expect(await screen.findByLabelText('From wallet')).toHaveValue('spot');
    expect(screen.getByLabelText('To wallet')).toHaveValue('funding');
    expect(screen.getByText(/Available: 75/)).toBeInTheDocument();
  });

  it('recovers from a wallet asset query failure when the user retries', async () => {
    installReadHandlers();
    let allowSuccess = false;
    let attempts = 0;
    server.use(
      http.get('*/wallet/assets', () => {
        attempts += 1;
        return allowSuccess
          ? HttpResponse.json(assets)
          : HttpResponse.json({ code: 'WALLET_UNAVAILABLE' }, { status: 503 });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);

    const retryButton = await screen.findByRole('button', { name: 'Thử lại' }, { timeout: 5_000 });
    allowSuccess = true;
    await userEvent.click(retryButton);

    expect(await screen.findByLabelText('Transfer amount')).toBeInTheDocument();
    expect(attempts).toBeGreaterThan(1);
  });

  it('validates amount before creating a transfer', async () => {
    installReadHandlers();

    renderWithProviders(<WalletTransferContractPage />);
    await screen.findByLabelText('Transfer amount');

    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter an amount greater than zero.');
  });

  it('rejects transfers above the selected asset available balance', async () => {
    installReadHandlers();
    let transferRequests = 0;
    server.use(
      http.post('*/wallet/transfers', () => {
        transferRequests += 1;
        return HttpResponse.json({ id: 'unexpected-transfer' }, { status: 201 });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    const amountInput = await screen.findByLabelText('Transfer amount');
    await userEvent.type(amountInput, '75.01');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'The transfer amount exceeds the available balance.',
    );
    expect(transferRequests).toBe(0);
  });

  it('swaps wallet direction and submits the max available amount', async () => {
    installReadHandlers();
    let receivedBody: unknown;
    server.use(
      http.post('*/wallet/transfers', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({
          id: 'transfer-max',
          fromWallet: 'funding',
          toWallet: 'spot',
          asset: 'USDT',
          amount: 75,
          status: 'completed',
          createdAt: '2026-09-22T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await screen.findByLabelText('Transfer amount');
    await userEvent.click(screen.getByRole('button', { name: 'Swap wallets' }));
    expect(screen.getByLabelText('From wallet')).toHaveValue('funding');
    expect(screen.getByLabelText('To wallet')).toHaveValue('spot');
    await userEvent.click(screen.getByRole('button', { name: /Max 75/ }));
    expect(screen.getByLabelText('Transfer amount')).toHaveValue(75);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('75.0000 USDT');
    expect(receivedBody).toEqual({
      fromWallet: 'funding',
      toWallet: 'spot',
      asset: 'USDT',
      amount: 75,
    });
  });

  it('selects an asset and destination wallet in the web shell', async () => {
    installReadHandlers();
    const transferRequests: unknown[] = [];
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({
          ...assets,
          items: [
            ...assets.items,
            {
              id: 'btc',
              symbol: 'BTC',
              name: 'Bitcoin',
              balance: 5,
              available: 4,
              frozen: 1,
              inOrder: 0,
              usdValue: 300,
              change24h: 1,
              logoColor: '#F7931A',
            },
          ],
        }),
      ),
      http.post('*/wallet/transfers', async ({ request }) => {
        transferRequests.push(await request.json());
        return HttpResponse.json({
          id: 'transfer-btc-1',
          fromWallet: 'spot',
          toWallet: 'futures',
          asset: 'BTC',
          amount: 2.5,
          status: 'completed',
          createdAt: '2026-10-09T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />, {
      routerProps: { initialEntries: ['/w/wallet/transfer'] },
    });
    await screen.findByLabelText('Transfer amount');
    await userEvent.selectOptions(screen.getByLabelText('Asset'), 'BTC');
    await userEvent.selectOptions(screen.getByLabelText('To wallet'), 'futures');
    await userEvent.type(screen.getByLabelText('Transfer amount'), '2.5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Transfer completed');
    expect(transferRequests).toEqual([
      { fromWallet: 'spot', toWallet: 'futures', asset: 'BTC', amount: 2.5 },
    ]);
    expect(screen.getByText(/Futures wallet .* shell/)).toBeInTheDocument();
  });

  it('rejects a blank asset symbol returned by the wallet asset contract', async () => {
    installReadHandlers();
    let transferRequests = 0;
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({
          ...assets,
          items: [{ ...assets.items[0], id: 'blank-symbol', symbol: '' }],
        }),
      ),
      http.post('*/wallet/transfers', () => {
        transferRequests += 1;
        return HttpResponse.json({ id: 'unexpected' }, { status: 201 });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await userEvent.type(await screen.findByLabelText('Transfer amount'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Choose an asset to transfer.');
    expect(transferRequests).toBe(0);
  });

  it('avoids a non-finite USD estimate when an asset has no balance', async () => {
    installReadHandlers();
    server.use(
      http.get('*/wallet/assets', () =>
        HttpResponse.json({
          ...assets,
          items: [{ ...assets.items[0], balance: 0, available: 0, usdValue: 0 }],
        }),
      ),
    );

    renderWithProviders(<WalletTransferContractPage />);

    expect(await screen.findByText(/Available:/)).toHaveTextContent(
      'Available: 0.00 USDT · ≈ $0.00',
    );
  });

  it.each([
    {
      missing: 'funding',
      items: [
        { id: 'spot', name: 'Spot wallet', balanceUsd: 1_000 },
        { id: 'futures', name: 'Futures wallet', balanceUsd: 250 },
      ],
      footer: 'Spot wallet → —',
    },
    {
      missing: 'spot',
      items: [
        { id: 'funding', name: 'Funding wallet', balanceUsd: 500 },
        { id: 'futures', name: 'Futures wallet', balanceUsd: 250 },
      ],
      footer: '— → Funding wallet',
    },
  ] as const)(
    'shows a fallback label when the contract omits the $missing account',
    async (scenario) => {
      installReadHandlers();
      server.use(http.get('*/wallet/accounts', () => HttpResponse.json({ items: scenario.items })));

      renderWithProviders(<WalletTransferContractPage />);

      expect(await screen.findByText(scenario.footer)).toBeInTheDocument();
    },
  );

  it('submits an idempotent transfer and renders the completed receipt', async () => {
    installReadHandlers();
    let receivedBody: unknown;
    server.use(
      http.post('*/wallet/transfers', async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          {
            id: 'transfer-1',
            fromWallet: 'spot',
            toWallet: 'funding',
            asset: 'USDT',
            amount: 12.5,
            status: 'completed',
            createdAt: '2026-09-22T08:00:00.000Z',
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await screen.findByLabelText('Transfer amount');
    await userEvent.type(screen.getByLabelText('Transfer amount'), '12.5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Transfer completed');
    expect(screen.getByRole('status')).toHaveTextContent('Reference transfer-1');
    expect(receivedBody).toEqual({
      fromWallet: 'spot',
      toWallet: 'funding',
      asset: 'USDT',
      amount: 12.5,
    });
  });

  it('shows a pending transfer reference and blocks resubmitting the same intent', async () => {
    installReadHandlers();
    let requests = 0;
    server.use(
      http.post('*/wallet/transfers', () => {
        requests += 1;
        return HttpResponse.json({
          id: 'transfer-pending-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 12.5,
          status: 'pending',
          createdAt: '2026-09-22T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await userEvent.type(await screen.findByLabelText('Transfer amount'), '12.5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Transfer pending');
    expect(screen.getByRole('status')).toHaveTextContent('Reference transfer-pending-1');
    expect(screen.getByText(/This exact transfer is still pending/)).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Confirm transfer' });
    expect(submit).toBeDisabled();
    await userEvent.click(submit);
    expect(requests).toBe(1);
  });

  it('shows a readable busy label while the transfer response is pending', async () => {
    installReadHandlers();
    let requests = 0;
    let release!: () => void;
    const pendingResponse = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post('*/wallet/transfers', async () => {
        requests += 1;
        await pendingResponse;
        return HttpResponse.json({
          id: 'transfer-inflight-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 12.5,
          status: 'pending',
          createdAt: '2026-09-22T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await userEvent.type(await screen.findByLabelText('Transfer amount'), '12.5');
    const submit = screen.getByRole('button', { name: 'Confirm transfer' });
    act(() => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    try {
      await waitFor(() => expect(requests).toBe(1));
      expect(await screen.findByRole('button', { name: 'Submitting transfer…' })).toBeDisabled();
      expect(submit).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByLabelText('Transfer amount')).toBeDisabled();
      expect(screen.getByLabelText('From wallet')).toBeDisabled();
      expect(screen.getByLabelText('To wallet')).toBeDisabled();
      expect(screen.getByLabelText('Asset')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Swap wallets' })).toBeDisabled();
    } finally {
      release();
    }
    expect(await screen.findByRole('status')).toHaveTextContent('Transfer pending');
    expect(requests).toBe(1);
  });

  it('surfaces API failure without pretending the transfer succeeded', async () => {
    installReadHandlers();
    server.use(
      http.post('*/wallet/transfers', () =>
        HttpResponse.json({ code: 'TRANSFER_REJECTED' }, { status: 409 }),
      ),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await screen.findByLabelText('Transfer amount');
    await userEvent.type(screen.getByLabelText('Transfer amount'), '12.5');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('could not be completed'),
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('reuses the idempotency key when retrying the same transfer after a transient failure', async () => {
    installReadHandlers();
    const idempotencyKeys: string[] = [];
    let requests = 0;
    server.use(
      http.post('*/wallet/transfers', ({ request }) => {
        requests += 1;
        idempotencyKeys.push(request.headers.get('Idempotency-Key') ?? '');
        if (requests === 1) {
          return HttpResponse.json({ message: 'Temporarily unavailable' }, { status: 503 });
        }
        return HttpResponse.json({
          id: 'transfer-retry-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 12.5,
          status: 'completed',
          createdAt: '2026-09-22T08:00:00.000Z',
        });
      }),
    );

    renderWithProviders(<WalletTransferContractPage />);
    await userEvent.type(await screen.findByLabelText('Transfer amount'), '12.5');
    const submit = screen.getByRole('button', { name: 'Confirm transfer' });
    await userEvent.click(submit);
    await waitFor(() => expect(requests).toBe(1));
    await waitFor(() => expect(submit).toBeEnabled());
    await userEvent.click(submit);

    expect(await screen.findByRole('status')).toHaveTextContent('Transfer completed');
    expect(requests).toBe(2);
    expect(idempotencyKeys[0]).toEqual(expect.any(String));
    expect(idempotencyKeys[1]).toBe(idempotencyKeys[0]);
  });

  it('keeps wallet data readable but blocks transfer without a write permission', async () => {
    installReadHandlers();
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['wallet:read'] },
      },
    };

    renderWithProviders(<WalletTransferContractPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet transfer permission is required',
    );
    const submit = screen.getByTestId('wallet-transfer-submit');
    expect(submit).toBeDisabled();
  });

  it('does not read accounts or assets without wallet read permission', async () => {
    let accountReads = 0;
    let assetReads = 0;
    server.use(
      http.get('*/wallet/accounts', () => {
        accountReads += 1;
        return HttpResponse.json(accounts);
      }),
      http.get('*/wallet/assets', () => {
        assetReads += 1;
        return HttpResponse.json(assets);
      }),
    );
    const noWalletReadAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: [] },
      },
    };

    renderWithProviders(<WalletTransferContractPage />, { authAdapter: noWalletReadAdapter });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Wallet read permission is required to view transfer balances.',
    );
    expect(accountReads).toBe(0);
    expect(assetReads).toBe(0);
  });
});
