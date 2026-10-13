import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import type { P2POrder } from '../model/p2p-types';
import { p2pApi } from '../api/p2p-api';
import { P2PEscrowDetailPage } from './P2PEscrowDetailPage';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const baseOrder: P2POrder = {
  id: 'order-1',
  orderNumber: 'P2P-001',
  adId: 'ad-1',
  type: 'buy',
  asset: 'USDT',
  amount: 100,
  price: 25_000,
  total: 2_500_000,
  currency: 'VND',
  status: 'pending_payment',
  merchant: 'Alpha Merchant',
  merchantId: 'merchant-1',
  counterparty: 'user-1',
  paymentMethod: 'Bank transfer',
  createdAt: '2026-09-21T10:00:00.000Z',
  expiresAt: '2026-09-21T10:30:00.000Z',
  escrowAmount: 100,
  fee: 0,
};

function renderEscrow(authAdapter?: AuthAdapter) {
  return renderWithProviders(
    <Routes>
      <Route path="/p2p/escrow/:orderId" element={<P2PEscrowDetailPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/p2p/escrow/order-1'] }, authAdapter },
  );
}

const challenge = { id: 'challenge-1', method: 'totp', expiresAt: '2026-09-21T10:10:00.000Z' };
const verification = {
  verificationToken: 'verification-token-1',
  expiresAt: '2026-09-21T10:10:00.000Z',
};
const cases = [
  { action: 'mark-paid', path: '/mark-paid', label: 'Mark order paid' },
  { action: 'challenge', path: '/release/challenge', label: 'Start escrow release' },
  { action: 'verify', path: '/release/challenge/challenge-1/verify', label: 'Verify release code' },
  { action: 'release', path: '/release', label: 'Confirm escrow release' },
];
async function prepareRelease(action: string) {
  if (action !== 'verify' && action !== 'release') return;
  await userEvent.click(await screen.findByRole('button', { name: 'Start escrow release' }));
  await userEvent.type(
    await screen.findByRole('textbox', { name: 'Release verification code' }),
    '123456',
  );
  if (action === 'release')
    await userEvent.click(screen.getByRole('button', { name: 'Verify release code' }));
}
describe('P2P escrow failure boundaries', () => {
  it.each(cases)(
    'serializes same-turn $action callbacks before the pending render',
    async ({ action, path, label }) => {
      let releaseResponse!: () => void;
      const gate = new Promise<void>((resolve) => {
        releaseResponse = resolve;
      });
      let posts = 0;
      server.use(
        http.get('*/p2p/orders/order-1', () =>
          HttpResponse.json({
            ...baseOrder,
            status: action === 'mark-paid' ? 'pending_payment' : 'paid',
          }),
        ),
        http.post('*/p2p/orders/order-1' + path, async () => {
          posts += 1;
          await gate;
          return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
        }),
        http.post('*/p2p/orders/order-1/release/challenge', () => HttpResponse.json(challenge)),
        http.post('*/p2p/orders/order-1/release/challenge/challenge-1/verify', () =>
          HttpResponse.json(verification),
        ),
      );
      renderEscrow();
      await prepareRelease(action);
      const button = await screen.findByRole('button', { name: label });
      act(() => {
        fireEvent.click(button);
        fireEvent.click(button);
      });
      try {
        await waitFor(() => expect(posts).toBeGreaterThan(0));
      } finally {
        releaseResponse();
      }
      await screen.findByRole('alert');
      await waitFor(() => expect(button).not.toBeDisabled());
      expect(posts).toBe(1);
    },
  );
  it.each(['mark-paid', 'release'])(
    'keeps the %s intent when a parsed response has not confirmed its transition',
    async (action) => {
      const initialStatus = action === 'mark-paid' ? 'pending_payment' : 'paid';
      const keys: string[] = [];
      server.use(
        http.get('*/p2p/orders/order-1', () =>
          HttpResponse.json({ ...baseOrder, status: initialStatus }),
        ),
        http.post('*/p2p/orders/order-1/release/challenge', () => HttpResponse.json(challenge)),
        http.post('*/p2p/orders/order-1/release/challenge/challenge-1/verify', () =>
          HttpResponse.json(verification),
        ),
        http.post('*/p2p/orders/order-1/' + action, ({ request }) => {
          keys.push(request.headers.get('Idempotency-Key')!);
          return HttpResponse.json({ ...baseOrder, status: initialStatus });
        }),
      );
      renderEscrow();
      await prepareRelease(action);
      const label = action === 'mark-paid' ? 'Mark order paid' : 'Confirm escrow release';
      await userEvent.click(await screen.findByRole('button', { name: label }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Chưa xác nhận');
      const button = screen.getByRole('button', { name: label });
      await waitFor(() => expect(button).not.toBeDisabled());
      await userEvent.click(button);
      await waitFor(() => expect(keys).toHaveLength(2));
      expect(keys[1]).toBe(keys[0]);
      const releaseState = screen.getByText('Escrow released').parentElement!.querySelector('svg');
      expect(releaseState).toBeInTheDocument();
      expect(releaseState).not.toHaveAttribute('stroke', '#10B981');
    },
  );
  it.each(['mark-paid', 'release'])(
    'rejects a %s response for another order before publishing it into cache',
    async (action) => {
      server.use(
        http.post('*/p2p/orders/order-1/' + action, () =>
          HttpResponse.json({
            ...baseOrder,
            id: 'different-order',
            status: action === 'mark-paid' ? 'paid' : 'released',
          }),
        ),
      );
      const operation =
        action === 'mark-paid'
          ? p2pApi.markOrderPaid('order-1', 'attempt-1')
          : p2pApi.releaseOrder('order-1', 'verification-token-1', 'attempt-1');
      await expect(operation).rejects.toThrow();
    },
  );
});
