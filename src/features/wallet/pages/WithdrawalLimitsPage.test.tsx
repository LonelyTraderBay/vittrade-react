import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { WithdrawalLimitsPage } from './WithdrawalLimitsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

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
});
