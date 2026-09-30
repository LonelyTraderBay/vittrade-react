import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import type { SubAccount } from '../model/profile-types';
import { SubAccountContractPage } from './SubAccountContractPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function subAccount(overrides: Partial<SubAccount> = {}): SubAccount {
  return {
    id: 'sub-1',
    name: 'Spot account',
    email: 'spot@example.com',
    type: 'spot',
    status: 'active',
    balance: 1_200,
    pnl30d: 25,
    permissions: ['trade:read'],
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActive: '2026-09-26T10:00:00.000Z',
    apiKeyCount: 2,
    tradingVolume30d: 15_000,
    ...overrides,
  };
}

function installSubAccounts(items: SubAccount[]) {
  server.use(http.get('*/profile/sub-accounts', () => HttpResponse.json({ items })));
}

describe('SubAccountContractPage', () => {
  it('renders server-owned accounts and sums their balances', async () => {
    installSubAccounts([
      subAccount(),
      subAccount({
        id: 'sub-2',
        name: 'Futures account',
        email: 'futures@example.com',
        type: 'futures',
        status: 'frozen',
        balance: 350,
        pnl30d: 15,
        apiKeyCount: 0,
      }),
    ]);
    renderWithProviders(<SubAccountContractPage />);

    expect(await screen.findByText('Spot account')).toBeVisible();
    expect(screen.getByText('Futures account')).toBeVisible();
    expect(screen.getByText('$1,550')).toBeVisible();
    expect(screen.getByText('2 tài khoản phụ')).toBeVisible();
    expect(screen.getByText('frozen')).toBeVisible();
    expect(screen.getByText('Balance $1,200')).toBeVisible();
    expect(screen.getByText('PnL $25')).toBeVisible();
  });

  it('shows a zero total when the server returns no subaccounts', async () => {
    installSubAccounts([]);
    renderWithProviders(<SubAccountContractPage />);

    expect(await screen.findByText('$0')).toBeVisible();
    expect(screen.getByText('0 tài khoản phụ')).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('Chưa có tài khoản phụ nào.');
  });
});
