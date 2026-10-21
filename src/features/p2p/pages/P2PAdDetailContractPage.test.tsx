import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
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
  paymentMethods: ['Vietcombank', 'MoMo'],
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

function authAdapterWithPermissions(permissions: string[]): AuthAdapter {
  return {
    ...testAuthAdapter,
    initialSession: {
      ...testAuthAdapter.initialSession!,
      user: {
        ...testAuthAdapter.initialSession!.user,
        permissions,
      },
    },
  };
}

describe('P2P ad detail contract page', () => {
  it('blocks order review when a loaded advertisement is no longer active', async () => {
    server.use(http.get('*/p2p/ads/ad-1', () => HttpResponse.json({ ...ad, status: 'paused' })));
    const user = userEvent.setup();
    renderAdDetail(authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:order:create']));
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    expect(await screen.findByRole('alert')).toHaveTextContent('Offer không còn khả dụng.');
    expect(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Confirm P2P order' })).not.toBeInTheDocument();
  });
  it('serializes two confirmations before React commits its pending state', async () => {
    let releaseResponse!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const keys: string[] = [];
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        await gate;
        return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
      }),
    );
    const user = userEvent.setup();
    renderAdDetail();
    await user.type(await screen.findByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    const button = await screen.findByRole('button', { name: 'Confirm P2P order' });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    try {
      await waitFor(() => expect(keys.length).toBeGreaterThan(0));
    } finally {
      releaseResponse();
    }
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys).toHaveLength(1);
  });

  it('retains the same-intent key after a lost create response until an explicit retry', async () => {
    const keys: string[] = [];
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        return HttpResponse.error();
      }),
    );
    const user = userEvent.setup();
    renderAdDetail();
    await user.type(await screen.findByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    const button = await screen.findByRole('button', { name: 'Confirm P2P order' });
    await user.click(button);
    await within(screen.getByRole('dialog')).findByRole('alert');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys).toHaveLength(1);
    await user.click(button);
    await waitFor(() => expect(keys).toHaveLength(2));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys[1]).toBe(keys[0]);
  });

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
    renderAdDetail(authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:order:create']));

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    await user.click(screen.getByRole('button', { name: 'MoMo' }));
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Xác nhận đơn P2P');
    expect(screen.getByRole('dialog')).toHaveTextContent('qua MoMo');
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    await user.click(screen.getByRole('button', { name: 'Confirm P2P order' }));

    await vi.waitFor(() => {
      expect(orderRequest).toEqual({
        adId: 'ad-1',
        asset: 'USDT',
        currency: 'VND',
        amount: 4,
        fiatAmount: 100_000,
        paymentMethod: 'MoMo',
      });
    });
    expect(await screen.findByTestId('created-order-route')).toHaveTextContent('order-created');
  });

  it('shows conflict guidance after one 409 response without submitting again', async () => {
    let createRequestCount = 0;
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', ({ request }) => {
        createRequestCount += 1;
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-order-/);
        return HttpResponse.json(
          { code: 'P2P_ORDER_CONFLICT', message: 'Duplicate or conflicting order request.' },
          { status: 409 },
        );
      }),
    );

    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    await user.click(screen.getByRole('button', { name: 'Confirm P2P order' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Yêu cầu tạo đơn P2P bị trùng hoặc xung đột (HTTP 409). Hãy kiểm tra danh sách đơn trước khi gửi yêu cầu mới.',
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('created-order-route')).not.toBeInTheDocument();
    expect(createRequestCount).toBe(1);
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

  it('shows the API error state and retries the ad query', async () => {
    let allowRetry = false;
    let attempts = 0;
    server.use(
      http.get('*/p2p/ads/ad-1', () => {
        attempts += 1;
        return allowRetry
          ? HttpResponse.json(ad)
          : HttpResponse.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 503 });
      }),
    );
    renderAdDetail();
    expect(await screen.findByText('Không thể tải quảng cáo P2P')).toBeInTheDocument();
    allowRetry = true;
    await userEvent.click(screen.getByRole('button', { name: /retry|thử lại/i }));
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(attempts).toBeGreaterThan(1);
  });

  it('shows amount validation for zero, below-minimum, above-maximum and unavailable size', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json({ ...ad, maxLimit: 30_000_000 })),
    );
    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    const amount = screen.getByRole('spinbutton', { name: 'Fiat amount' });
    expect(screen.getByRole('alert')).toHaveTextContent('Nhập số tiền muốn giao dịch.');

    await user.type(amount, '0');
    expect(screen.getByRole('alert')).toHaveTextContent('Số tiền phải lớn hơn 0.');
    await user.clear(amount);
    await user.type(amount, '99999');
    expect(screen.getByRole('alert')).toHaveTextContent('Tối thiểu 100.000 VND.');
    await user.clear(amount);
    await user.type(amount, '30000001');
    expect(screen.getByRole('alert')).toHaveTextContent('Tối đa 30.000.000 VND.');
    await user.clear(amount);
    await user.type(amount, '25000001');
    expect(screen.getByRole('alert')).toHaveTextContent('Chỉ còn 1000 USDT khả dụng.');
    expect(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' })).toBeDisabled();
  });

  it('reports a contract-valid ad without payment methods and displays buy/unverified values', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () =>
        HttpResponse.json({ ...ad, type: 'buy', merchantVerified: false, paymentMethods: [] }),
      ),
    );
    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(screen.getByText(/Chưa xác minh/)).toBeInTheDocument();
    expect(screen.getByText('Bán USDT')).toBeInTheDocument();
    await user.type(screen.getByRole('spinbutton', { name: 'Fiat amount' }), '100000');
    expect(screen.getByRole('alert')).toHaveTextContent('Chọn phương thức thanh toán.');
    expect(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' })).toBeDisabled();
  });

  it('keeps the order confirmation disabled if the amount becomes invalid while it is open', async () => {
    let createRequestCount = 0;
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', () => {
        createRequestCount += 1;
        return HttpResponse.json(receipt, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    const amount = screen.getByRole('spinbutton', { name: 'Fiat amount' });
    await user.type(amount, '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    // Simulate an out-of-band data change; the modal keeps background controls inert.
    fireEvent.change(amount, { target: { value: '99999' } });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm P2P order' })).toBeDisabled();
    expect(createRequestCount).toBe(0);
  });

  it('shows the generic server error and clears it when the amount changes', async () => {
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post('*/p2p/orders', () =>
        HttpResponse.json({ code: 'SERVICE_UNAVAILABLE' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    const amount = screen.getByRole('spinbutton', { name: 'Fiat amount' });
    await user.type(amount, '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    await user.click(screen.getByRole('button', { name: 'Confirm P2P order' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tạo đơn P2P. Vui lòng thử lại.',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Hủy' }));
    await user.type(amount, '0');
    expect(screen.queryByText('Không thể tạo đơn P2P. Vui lòng thử lại.')).not.toBeInTheDocument();
  });

  it('shows a pending order mutation until its receipt is returned', async () => {
    let finishRequest: (response: Response) => void = () => undefined;
    server.use(
      http.get('*/p2p/ads/ad-1', () => HttpResponse.json(ad)),
      http.post(
        '*/p2p/orders',
        () =>
          new Promise((resolve) => {
            finishRequest = resolve;
          }),
      ),
    );
    const user = userEvent.setup();
    renderAdDetail();

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    const amount = screen.getByRole('spinbutton', { name: 'Fiat amount' });
    const payment = screen.getByRole('button', { name: 'MoMo' });
    await user.type(amount, '100000');
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đơn P2P' }));
    await user.click(screen.getByRole('button', { name: 'Confirm P2P order' }));

    expect(await screen.findByRole('button', { name: 'Confirm P2P order' })).toHaveTextContent(
      'Đang tạo…',
    );
    expect(screen.getByRole('button', { name: 'Confirm P2P order' })).toBeDisabled();
    expect(amount).toBeDisabled();
    expect(payment).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Hủy' })).toBeDisabled();
    finishRequest(HttpResponse.json(receipt, { status: 201 }) as unknown as Response);
    expect(await screen.findByTestId('created-order-route')).toHaveTextContent('order-created');
  });
});
