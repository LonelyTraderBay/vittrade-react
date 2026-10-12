import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import { p2pApi } from '../api/p2p-api';
import {
  P2POrderCancelContractPage,
  P2POrderProofContractPage,
  P2POrderRateContractPage,
  P2POrderTimelineContractPage,
} from './P2POrderActionPages';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const order = {
  id: 'order-1',
  orderNumber: 'P2P-001',
  adId: 'ad-1',
  type: 'buy' as const,
  asset: 'USDT',
  amount: 100,
  price: 25_000,
  total: 2_500_000,
  currency: 'VND',
  status: 'pending_payment' as const,
  merchant: 'Alpha Merchant',
  merchantId: 'merchant-1',
  counterparty: 'user-1',
  paymentMethod: 'Bank transfer',
  createdAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:30:00.000Z',
  escrowAmount: 100,
  fee: 0,
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

describe('P2P order action feature pages', () => {
  it('loads a server-owned order and submits an idempotent cancellation', async () => {
    let cancelCalls = 0;
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/cancel', async () => {
        cancelCalls += 1;
        return HttpResponse.json({ ...order, status: 'cancelled', cancelReason: 'Lý do khác' });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/cancel" element={<P2POrderCancelContractPage />} />
        <Route path="/p2p/order/:orderId" element={<div />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/cancel'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:cancel']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lý do khác' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy đơn' }));

    expect(cancelCalls).toBe(1);
  });

  it('derives the order timeline from contract timestamps', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () =>
        HttpResponse.json({ ...order, type: 'sell' as const }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/timeline" element={<P2POrderTimelineContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/order/order-1/timeline'] } },
    );

    expect(await screen.findByText('Đã tạo đơn')).toBeInTheDocument();
    expect(screen.getByText('Bán 100 USDT')).toBeInTheDocument();
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Đã release escrow')).toBeInTheDocument();
    expect(screen.getByText('Đã hủy')).toBeInTheDocument();
  });

  it('submits a rating through the typed mutation boundary', async () => {
    let rateCalls = 0;
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/rate', async ({ request }) => {
        rateCalls += 1;
        expect(request.headers.get('content-type')).toContain('application/json');
        return HttpResponse.json({ ...order, rating: 5, review: 'Giao dịch tốt' });
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/rate" element={<P2POrderRateContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/rate'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:rate']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '5 sao' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Nhận xét' }), 'Giao dịch tốt');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => expect(rateCalls).toBe(1));
  });

  it('validates and submits selected payment proof', async () => {
    const submitPaymentProof = vi
      .spyOn(p2pApi, 'submitPaymentProof')
      .mockResolvedValue({ ...order, paymentProof: ['receipt.png'] });
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/proof" element={<P2POrderProofContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/proof'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:payment-proof']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    const input = document.getElementById('p2p-payment-proof') as HTMLInputElement;
    const file = new window.File(['receipt'], 'receipt.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(await screen.findByText('receipt.png')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Gửi bằng chứng' }));

    await waitFor(() => expect(submitPaymentProof).toHaveBeenCalledTimes(1));
    expect(submitPaymentProof.mock.calls[0]?.[1].files[0]?.name).toBe('receipt.png');
  });

  it('exposes a retry action when the order query fails', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () =>
        HttpResponse.json({ code: 'ORDER_NOT_FOUND' }, { status: 503 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/cancel" element={<P2POrderCancelContractPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/order/order-1/cancel'] } },
    );

    expect(await screen.findByText('Không thể tải đơn hàng')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Không thể tải đơn hàng')).toBeInTheDocument();
  });

  it('keeps order cancellation readable but blocks the mutation without permission', async () => {
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: {
          ...testAuthAdapter.initialSession!.user,
          permissions: ['market:read', 'p2p:read'],
        },
      },
    };

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/cancel" element={<P2POrderCancelContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/cancel'] },
        authAdapter: readOnlyAdapter,
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P order write permission is required to cancel an order.',
    );
    expect(screen.getByRole('button', { name: 'Xác nhận hủy đơn' })).toBeDisabled();
  });

  it('shows the contract conflict when cancellation is rejected', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/cancel', () =>
        HttpResponse.json({ code: 'ORDER_STATE_CONFLICT' }, { status: 409 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/cancel" element={<P2POrderCancelContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/cancel'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:cancel']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lý do khác' }));
    await userEvent.click(screen.getByRole('button', { name: 'Xác nhận hủy đơn' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể hủy đơn. Vui lòng thử lại hoặc mở dispute nếu đơn đã chuyển trạng thái.',
    );
  });

  it('blocks rating when the user lacks the order-rating permission', async () => {
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/rate" element={<P2POrderRateContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/rate'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P order write permission is required to submit a rating.',
    );
    expect(screen.getByRole('button', { name: 'Gửi đánh giá' })).toBeDisabled();
  });

  it('shows the contract conflict when rating is rejected', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/rate', () =>
        HttpResponse.json({ code: 'ORDER_STATE_CONFLICT' }, { status: 409 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/rate" element={<P2POrderRateContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/rate'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:rate']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '5 sao' }));
    await userEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể gửi đánh giá. Vui lòng thử lại.',
    );
  });

  it('blocks payment proof when the user lacks the proof permission', async () => {
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/proof" element={<P2POrderProofContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/proof'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P order write permission is required to submit payment proof.',
    );
    expect(screen.getByRole('button', { name: 'Gửi bằng chứng' })).toBeDisabled();
  });

  it('validates proof image type, size and count and removes selected files', async () => {
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/proof" element={<P2POrderProofContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/proof'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:payment-proof']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    const input = document.getElementById('p2p-payment-proof') as HTMLInputElement;
    fireEvent.change(input, { target: { files: null } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const invalidType = new window.File(['receipt'], 'receipt.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [invalidType] } });
    expect(input.value).toBe('');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chỉ nhận tối đa 3 ảnh, mỗi ảnh không quá 10 MB.',
    );
    expect(screen.queryByText('receipt.txt')).not.toBeInTheDocument();

    const oversized = new window.File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chỉ nhận tối đa 3 ảnh, mỗi ảnh không quá 10 MB.',
    );

    const image = (name: string) => new window.File(['receipt'], name, { type: 'image/png' });
    fireEvent.change(input, {
      target: {
        files: [image('one.png'), image('two.png'), image('three.png'), image('four.png')],
      },
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chỉ nhận tối đa 3 ảnh, mỗi ảnh không quá 10 MB.',
    );
    expect(screen.queryByText('one.png')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { files: [image('one.png'), image('two.png')] } });
    expect(await screen.findByText('one.png')).toBeInTheDocument();
    expect(screen.getByText('two.png')).toBeInTheDocument();
    fireEvent.change(input, { target: { files: [image('three.png'), image('four.png')] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Chỉ nhận tối đa 3 ảnh, mỗi ảnh không quá 10 MB.',
    );

    fireEvent.change(input, { target: { files: [image('three.png')] } });
    expect(await screen.findByText('three.png')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Xóa two.png' }));
    expect(screen.queryByText('two.png')).not.toBeInTheDocument();
    expect(screen.getByText('one.png')).toBeInTheDocument();
    expect(screen.getByText('three.png')).toBeInTheDocument();
  });

  it('keeps a selected payment proof visible when the server rejects it', async () => {
    vi.spyOn(p2pApi, 'submitPaymentProof').mockRejectedValue(new Error('ORDER_STATE_CONFLICT'));
    server.use(http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/order/:orderId/proof" element={<P2POrderProofContractPage />} />
      </Routes>,
      {
        routerProps: { initialEntries: ['/p2p/order/order-1/proof'] },
        authAdapter: authAdapterWithPermissions(['market:read', 'p2p:read', 'p2p:payment-proof']),
      },
    );

    expect(await screen.findByText('P2P-001')).toBeInTheDocument();
    const input = document.getElementById('p2p-payment-proof') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new window.File(['receipt'], 'receipt.png', { type: 'image/png' })] },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Gửi bằng chứng' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể tải bằng chứng lên. Vui lòng thử lại.',
    );
    expect(screen.getByText('receipt.png')).toBeInTheDocument();
  });
});
