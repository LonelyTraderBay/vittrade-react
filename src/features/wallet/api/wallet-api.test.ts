import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { walletApi } from './wallet-api';

const server = setupServer();

const response = {
  items: [
    {
      id: 'usdt',
      symbol: 'USDT',
      name: 'Tether USD',
      balance: 1_000,
      available: 900,
      frozen: 100,
      inOrder: 100,
      usdValue: 1_000,
      change24h: 0,
      logoColor: '#26A17B',
    },
  ],
  summary: {
    totalUsd: 1_000,
    totalBtc: 0.015,
    availableUsd: 900,
    inOrderUsd: 100,
    frozenUsd: 100,
  },
};

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('wallet API contract', () => {
  it('loads balances and summary through the shared client', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/assets', () => HttpResponse.json(response)),
    );

    await expect(walletApi.getAssets()).resolves.toEqual(response);
  });

  it('rejects a response with negative balances', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/assets', () =>
        HttpResponse.json({
          ...response,
          items: [{ ...response.items[0], available: -1 }],
        }),
      ),
    );

    await expect(walletApi.getAssets()).rejects.toThrow();
  });

  it('loads typed wallet accounts', async () => {
    const accounts = {
      items: [
        { id: 'spot', name: 'Ví Spot', balanceUsd: 1_000 },
        { id: 'funding', name: 'Ví Funding', balanceUsd: 250 },
        { id: 'futures', name: 'Ví Futures', balanceUsd: 500 },
      ],
    };
    server.use(
      http.get('http://localhost:3000/api/wallet/accounts', () => HttpResponse.json(accounts)),
    );

    await expect(walletApi.getAccounts()).resolves.toEqual(accounts);
  });

  it('loads transaction history with typed pagination', async () => {
    const transactions = {
      items: [
        {
          id: 'tx-1',
          type: 'deposit',
          asset: 'USDT',
          amount: 100,
          status: 'completed',
          createdAt: '2026-09-21T10:00:00.000Z',
        },
      ],
      total: 1,
      nextCursor: 'cursor-2',
    };
    server.use(
      http.get('http://localhost:3000/api/wallet/transactions', ({ request }) => {
        expect(new URL(request.url).searchParams.get('asset')).toBe('USDT');
        return HttpResponse.json(transactions);
      }),
    );

    await expect(walletApi.getTransactions({ asset: 'USDT', limit: 20 })).resolves.toEqual(
      transactions,
    );
  });

  it('loads deposit and withdrawal network policies', async () => {
    const depositNetworks = {
      networks: [
        {
          id: 'trc20',
          name: 'TRC20',
          fee: 'Free',
          minDeposit: 1,
          address: 'T-test-address',
          arrivalTime: '~3 minutes',
          confirmations: 1,
        },
      ],
    };
    const withdrawalNetworks = {
      networks: [
        {
          id: 'trc20',
          name: 'TRC20',
          fee: 1,
          minWithdraw: 5,
          maxWithdraw: 500_000,
        },
      ],
    };
    server.use(
      http.get('http://localhost:3000/api/wallet/deposit/networks', () =>
        HttpResponse.json(depositNetworks),
      ),
      http.get('http://localhost:3000/api/wallet/withdrawal/networks', () =>
        HttpResponse.json(withdrawalNetworks),
      ),
    );

    await expect(walletApi.getDepositNetworks('USDT')).resolves.toEqual(depositNetworks.networks);
    await expect(walletApi.getWithdrawalNetworks('USDT')).resolves.toEqual(
      withdrawalNetworks.networks,
    );
  });

  it('rejects withdrawal limits where the maximum is below the minimum', async () => {
    server.use(
      http.get('http://localhost:3000/api/wallet/withdrawal/networks', () =>
        HttpResponse.json({
          networks: [{ id: 'trc20', name: 'TRC20', fee: 1, minWithdraw: 10, maxWithdraw: 5 }],
        }),
      ),
    );

    await expect(walletApi.getWithdrawalNetworks('USDT')).rejects.toThrow();
  });

  it('uses an idempotency key for internal transfers', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/transfers', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('wallet-transfer-key-001');
        return HttpResponse.json({
          id: 'transfer-1',
          fromWallet: 'spot',
          toWallet: 'funding',
          asset: 'USDT',
          amount: 100,
          status: 'completed',
          createdAt: '2026-09-21T10:00:00.000Z',
        });
      }),
    );

    await expect(
      walletApi.createTransfer(
        { fromWallet: 'spot', toWallet: 'funding', asset: 'USDT', amount: 100 },
        'wallet-transfer-key-001',
      ),
    ).resolves.toMatchObject({ id: 'transfer-1', status: 'completed' });
  });

  it('rejects a transfer receipt with identical source and destination wallets', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/transfers', () =>
        HttpResponse.json({
          id: 'transfer-invalid',
          fromWallet: 'spot',
          toWallet: 'spot',
          asset: 'USDT',
          amount: 100,
          status: 'completed',
          createdAt: '2026-09-21T10:00:00.000Z',
        }),
      ),
    );

    await expect(
      walletApi.createTransfer(
        { fromWallet: 'spot', toWallet: 'funding', asset: 'USDT', amount: 100 },
        'wallet-transfer-key-002',
      ),
    ).rejects.toThrow();
  });

  it('creates and verifies a withdrawal security challenge', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/withdrawals/challenge', () =>
        HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          maskedDestination: 'Authenticator',
          expiresAt: '2026-09-21T10:05:00.000Z',
        }),
      ),
      http.post(
        'http://localhost:3000/api/wallet/withdrawals/challenge/challenge-1/verify',
        async ({ request }) => {
          expect(await request.json()).toEqual({ code: '123456' });
          return HttpResponse.json({
            verificationToken: 'verification-1',
            expiresAt: '2026-09-21T10:07:00.000Z',
          });
        },
      ),
    );

    await expect(
      walletApi.createWithdrawalChallenge({
        asset: 'USDT',
        networkId: 'trc20',
        address: 'T-test-address',
        amount: 100,
      }),
    ).resolves.toMatchObject({ id: 'challenge-1', method: 'totp' });
    await expect(walletApi.verifyWithdrawalChallenge('challenge-1', '123456')).resolves.toEqual({
      verificationToken: 'verification-1',
      expiresAt: '2026-09-21T10:07:00.000Z',
    });
  });

  it('rejects a withdrawal challenge with an invalid expiry timestamp', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/withdrawals/challenge', () =>
        HttpResponse.json({ id: 'challenge-invalid', method: 'totp', expiresAt: 'soon' }),
      ),
    );

    await expect(
      walletApi.createWithdrawalChallenge({
        asset: 'USDT',
        networkId: 'trc20',
        address: 'T-test-address',
        amount: 10,
      }),
    ).rejects.toThrow();
  });

  it('submits withdrawals with an idempotency key', async () => {
    server.use(
      http.post('http://localhost:3000/api/wallet/withdrawals', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('wallet-withdrawal-key-001');
        return HttpResponse.json({
          id: 'withdrawal-1',
          transactionId: 'tx-withdrawal-1',
          asset: 'USDT',
          amount: 100,
          status: 'pending',
          createdAt: '2026-09-21T10:00:00.000Z',
        });
      }),
    );

    await expect(
      walletApi.createWithdrawal(
        {
          asset: 'USDT',
          networkId: 'trc20',
          address: 'T-test-address',
          amount: 100,
          verificationToken: 'verification-1',
        },
        'wallet-withdrawal-key-001',
      ),
    ).resolves.toMatchObject({ transactionId: 'tx-withdrawal-1', status: 'pending' });
  });

  it('loads and mutates the address book through idempotent API boundaries', async () => {
    const address = {
      id: 'address-1',
      label: 'Cold wallet',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f6C29f',
      network: 'ETH (ERC20)',
      asset: 'ETH',
      isFavorite: false,
      createdAt: '2026-09-21T10:00:00.000Z',
      isWhitelisted: true,
    };
    const response = { items: [address], total: 1, whitelistEnabled: true };
    server.use(
      http.get('http://localhost:3000/api/wallet/address-book', () => HttpResponse.json(response)),
      http.post('http://localhost:3000/api/wallet/address-book', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('address-book-key-001');
        return HttpResponse.json(address, { status: 201 });
      }),
      http.patch('http://localhost:3000/api/wallet/address-book/address-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('address-book-key-002');
        return HttpResponse.json({ ...address, isFavorite: true });
      }),
      http.patch('http://localhost:3000/api/wallet/address-book/settings', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('address-book-key-003');
        return HttpResponse.json({ ...response, whitelistEnabled: false });
      }),
      http.delete('http://localhost:3000/api/wallet/address-book/address-1', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toBe('address-book-key-004');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(walletApi.getAddressBook()).resolves.toEqual(response);
    await expect(
      walletApi.createAddressBookEntry(
        {
          label: address.label,
          address: address.address,
          network: address.network,
          asset: address.asset,
          isWhitelisted: true,
        },
        'address-book-key-001',
      ),
    ).resolves.toEqual(address);
    await expect(
      walletApi.updateAddressBookEntry('address-1', { isFavorite: true }, 'address-book-key-002'),
    ).resolves.toMatchObject({ isFavorite: true });
    await expect(
      walletApi.updateAddressBookSettings(false, 'address-book-key-003'),
    ).resolves.toMatchObject({ whitelistEnabled: false });
    await expect(
      walletApi.deleteAddressBookEntry('address-1', 'address-book-key-004'),
    ).resolves.toBeUndefined();
  });

  it('loads portfolio analytics for a selected period', async () => {
    const analytics = {
      period: '1M',
      history: [{ timestamp: '2026-09-21T10:00:00.000Z', value: 1_000, pnl: 50 }],
      monthlyPnl: [{ month: 'T9', pnl: 50 }],
      topPerformers: [{ symbol: 'BTC', name: 'Bitcoin', change: 10, usd: 100, color: '#F7931A' }],
      worstPerformers: [],
      totalTrades: 2,
      totalFeesUsd: 1.25,
    };
    server.use(
      http.get('http://localhost:3000/api/wallet/analytics/portfolio', ({ request }) => {
        expect(new URL(request.url).searchParams.get('period')).toBe('1M');
        return HttpResponse.json(analytics);
      }),
    );

    await expect(walletApi.getPortfolioAnalytics('1M')).resolves.toEqual(analytics);
  });
});
