import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router';
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
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/order/order-created'),
    );
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

  it('routes invalid offer parameters back to Express', async () => {
    const user = userEvent.setup();
    renderExpress(testAuthAdapter, ['/p2p/express/confirm?type=buy&fiat=not-a-number']);

    expect(screen.getByText('Không thể xác thực offer Express')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại Express' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/express');
  });

  it('routes a contract-declared missing offer back to Express', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    renderExpress();

    expect(await screen.findByText('Không thể xác thực offer Express')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Quay lại Express' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/express');
  });

  it('renders sell-side labels and returns to Express when canceled', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.json({ ...ad, type: 'buy' })));
    const user = userEvent.setup();
    renderExpress(testAuthAdapter, [
      '/p2p/express',
      '/p2p/express/confirm?type=sell&asset=USDT&fiat=100000&adId=ad-1&payment=Vietcombank',
    ]);

    expect(await screen.findByText('Express Bán')).toBeInTheDocument();
    expect(screen.getByText('Sẽ nhận được')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/express');
  });

  it('keeps the order button pending until the create request resolves', async () => {
    let releaseResponse!: () => void;
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', async () => {
        await responseGate;
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderExpress();

    await user.click(await screen.findByRole('button', { name: 'Confirm P2P Express order' }));
    expect(await screen.findByText('Đang tạo order…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm P2P Express order' })).toBeDisabled();

    act(() => releaseResponse());
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/order/order-created'),
    );
  });

  it('shows an error when order creation fails', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', () =>
        HttpResponse.json({ message: 'Invalid order' }, { status: 400 }),
      ),
    );
    const user = userEvent.setup();
    renderExpress();

    await user.click(await screen.findByRole('button', { name: 'Confirm P2P Express order' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tạo order. Vui lòng thử lại hoặc chọn offer khác.',
    );
  });

  it('guards a synthetic click when payment details are missing', async () => {
    let orderRequests = 0;
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', () => {
        orderRequests += 1;
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );
    renderExpress(testAuthAdapter, ['/p2p/express/confirm?type=buy&fiat=100000&adId=ad-1']);

    const button = await screen.findByRole('button', { name: 'Confirm P2P Express order' });
    expect(button).toBeDisabled();
    fireEvent.click(button);

    expect(orderRequests).toBe(0);
  });

  it('disables confirmation when URL arithmetic produces a zero crypto amount', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)));
    renderExpress(testAuthAdapter, [
      '/p2p/express/confirm?type=buy&asset=USDT&fiat=5e-324&adId=ad-1&payment=Vietcombank',
    ]);

    expect(await screen.findByText(/0\.00000000 USDT/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm P2P Express order' })).toBeDisabled();
  });

  it('accepts the explicit order-create permission alias', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', () => HttpResponse.json(receipt, { status: 201 })),
    );
    const session = {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions: ['p2p:read', 'p2p:order:create'],
      },
    };
    const user = userEvent.setup();
    renderExpress({ ...testAuthAdapter, initialSession: session, getSession: async () => session });

    await user.click(await screen.findByRole('button', { name: 'Confirm P2P Express order' }));
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent('/p2p/order/order-created'),
    );
  });
});

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

function renderExpress(
  authAdapter: AuthAdapter = testAuthAdapter,
  initialEntries = [
    '/p2p/express/confirm?type=buy&asset=USDT&fiat=100000&adId=ad-1&payment=Vietcombank',
  ],
) {
  return renderWithProviders(
    <>
      <P2PExpressConfirmPage />
      <CurrentPath />
    </>,
    {
      authAdapter,
      routerProps: {
        initialEntries,
      },
    },
  );
}
