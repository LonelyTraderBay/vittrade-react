import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import {
  P2POrderCancelContractPage,
  P2POrderProofContractPage,
  P2POrderRateContractPage,
} from './P2POrderActionPages';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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

const cases = [
  { action: 'cancel', label: 'Xác nhận hủy đơn', element: <P2POrderCancelContractPage /> },
  { action: 'rate', label: 'Gửi đánh giá', element: <P2POrderRateContractPage /> },
  { action: 'payment-proof', label: 'Gửi bằng chứng', element: <P2POrderProofContractPage /> },
];
async function prepare(action: string) {
  await screen.findByText('P2P-001');
  if (action === 'cancel')
    await userEvent.click(screen.getByRole('button', { name: 'Lý do khác' }));
  else if (action === 'rate') await userEvent.click(screen.getByRole('button', { name: '5 sao' }));
  else
    fireEvent.change(screen.getByLabelText('Chọn ảnh bằng chứng (tối đa 3 ảnh)'), {
      target: { files: [new File(['image'], 'proof.png', { type: 'image/png' })] },
    });
}
function renderAction(item: (typeof cases)[number]) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/order/:orderId/action" element={item.element} />
      <Route
        path="/p2p/order/:orderId"
        element={<div data-testid="order-destination">Order destination</div>}
      />
    </Routes>,
    { routerProps: { initialEntries: ['/p2p/order/order-1/action'] } },
  );
}
describe('P2P order action failure boundaries', () => {
  it.each(cases)('serializes same-turn $action requests', async (item) => {
    let releaseResponse!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    const keys: string[] = [];
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/' + item.action, async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        await gate;
        return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
      }),
    );
    renderAction(item);
    await prepare(item.action);
    const button = screen.getByRole('button', { name: item.label });
    act(() => {
      fireEvent.click(button);
      fireEvent.click(button);
    });
    try {
      await waitFor(() => expect(keys.length).toBeGreaterThan(0));
      if (item.action === 'cancel')
        expect(screen.getByRole('button', { name: 'Lý do khác' })).toBeDisabled();
      else if (item.action === 'rate') {
        expect(screen.getByRole('button', { name: '5 sao' })).toBeDisabled();
        expect(screen.getByRole('textbox', { name: 'Nhận xét' })).toBeDisabled();
      } else {
        expect(screen.getByLabelText('Chọn ảnh bằng chứng (tối đa 3 ảnh)')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Xóa proof.png' })).toBeDisabled();
      }
    } finally {
      releaseResponse();
    }
    await screen.findByRole('alert');
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys).toHaveLength(1);
  });
  it.each(cases)(
    'retains $action key across an explicit same-intent retry after lost response',
    async (item) => {
      const keys: string[] = [];
      server.use(
        http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
        http.post('*/p2p/orders/order-1/' + item.action, ({ request }) => {
          keys.push(request.headers.get('Idempotency-Key')!);
          return HttpResponse.error();
        }),
      );
      renderAction(item);
      await prepare(item.action);
      const button = screen.getByRole('button', { name: item.label });
      await userEvent.click(button);
      await screen.findByRole('alert');
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(keys).toHaveLength(1);
      await userEvent.click(button);
      await waitFor(() => expect(keys).toHaveLength(2));
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(keys[1]).toBe(keys[0]);
    },
  );
  it('stays with the cancellation intent when a parsed order has not confirmed cancellation', async () => {
    const keys: string[] = [];
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/cancel', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        return HttpResponse.json(order);
      }),
    );
    renderAction(cases[0]);
    await prepare('cancel');
    await userEvent.click(screen.getByRole('button', { name: cases[0].label }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác nhận');
    expect(screen.queryByTestId('order-destination')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: cases[0].label }));
    await waitFor(() => expect(keys).toHaveLength(2));
    expect(keys[1]).toBe(keys[0]);
  });
  it('distinguishes a newly selected proof with identical metadata from the failed prior file', async () => {
    const keys: string[] = [];
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(order)),
      http.post('*/p2p/orders/order-1/payment-proof', ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key')!);
        return HttpResponse.error();
      }),
    );
    renderAction(cases[2]);
    await screen.findByText('P2P-001');
    const upload = screen.getByLabelText('Chọn ảnh bằng chứng (tối đa 3 ảnh)');
    const original = new File(['aaa'], 'proof.png', { type: 'image/png', lastModified: 1 });
    const replacement = new File(['bbb'], 'proof.png', { type: 'image/png', lastModified: 1 });
    fireEvent.change(upload, { target: { files: [original] } });
    const button = screen.getByRole('button', { name: cases[2].label });
    await userEvent.click(button);
    await screen.findByRole('alert');
    await waitFor(() => expect(button).not.toBeDisabled());
    await userEvent.click(button);
    await waitFor(() => expect(keys).toHaveLength(2));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys[1]).toBe(keys[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Xóa proof.png' }));
    fireEvent.change(upload, { target: { files: [replacement] } });
    await userEvent.click(button);
    await waitFor(() => expect(keys).toHaveLength(3));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(keys[2]).not.toBe(keys[1]);
  });
});
