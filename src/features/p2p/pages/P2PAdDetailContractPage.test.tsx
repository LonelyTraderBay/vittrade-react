import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes, useParams } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { P2PAd, P2POrderReceipt } from '../model/p2p-types';
import { P2PAdDetailContractPage } from './P2PAdDetailContractPage';

function OrderDestination() {
  const { orderId } = useParams();
  return <p data-testid="created-order-route">Order: {orderId}</p>;
}

function renderAdDetail(authAdapter: AuthAdapter = testAuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/ad/:id" element={<P2PAdDetailContractPage />} />
      <Route path="/p2p/order/:orderId" element={<OrderDestination />} />
    </Routes>,
    { authAdapter, routerProps: { initialEntries: ['/p2p/ad/ad-1'] } },
  );
}

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

describe('P2P ad detail contract page', () => {
  it('loads the ad and creates an order with an idempotency key', async () => {
    let orderRequest: unknown;
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-order-/);
        orderRequest = await request.json();
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    await user.click(screen.getByRole('button', { name: 'Confirm P2P order' }));

    await vi.waitFor(() => {
      expect(orderRequest).toEqual({
        adId: 'ad-1',
        asset: 'USDT',
        currency: 'VND',
        amount: 4,
        fiatAmount: 100_000,
        paymentMethod: 'Vietcombank',
      });
    });
    expect(await screen.findByTestId('created-order-route')).toHaveTextContent('order-created');
  });

  it('keeps order creation disabled for read-only users', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)));

    const user = userEvent.setup();
    renderAdDetail({
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['p2p:read'] },
      },
    });

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    expect(
      screen.getByText('P2P order write permission is required to create an order.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Xem xác nhận đơn P2P/i })).toBeDisabled();
  });

  it('shows the API error state and allows retry', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.error()));
    renderAdDetail();
    expect(await screen.findByText('Không thể tải quảng cáo P2P')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry|thử lại/i })).toBeInTheDocument();
  });
});
