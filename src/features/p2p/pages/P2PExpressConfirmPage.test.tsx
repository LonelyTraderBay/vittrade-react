import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { P2PAd, P2POrderReceipt } from '../model/p2p-types';
import { P2PExpressConfirmPage } from './P2PExpressConfirmPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ad: P2PAd = {
  id: 'ad-1',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 20,
  totalVolume30d: 100_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Vietcombank'],
  avgResponseTime: '1m',
  isOnline: true,
  createdAt: '2026-09-22',
  status: 'active',
};

const receipt: P2POrderReceipt = {
  orderId: 'order-created',
  status: 'created',
  expiresAt: '2026-09-22T12:00:00.000Z',
};

describe('P2P Express confirmation contract page', () => {
  it('creates the escrow order with an idempotency key', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-express-order-/);
        expect(await request.json()).toEqual({
          adId: 'ad-1',
          asset: 'USDT',
          currency: 'VND',
          amount: 4,
          fiatAmount: 100_000,
          paymentMethod: 'Vietcombank',
        });
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderExpress();
    expect(await screen.findByText('Express Mua')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Confirm P2P Express order' }));
  });

  it('keeps the Express order mutation disabled for read-only users', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)));

    renderExpress({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    });

    expect(await screen.findByText('Express Mua')).toBeInTheDocument();
    expect(
      screen.getByText('P2P order write permission is required to create an Express order.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm P2P Express order' })).toBeDisabled();
  });
});

function renderExpress(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(<P2PExpressConfirmPage />, {
    authAdapter,
    routerProps: {
      initialEntries: [
        '/p2p/express/confirm?type=buy&asset=USDT&fiat=100000&adId=ad-1&payment=Vietcombank',
      ],
    },
  });
}
