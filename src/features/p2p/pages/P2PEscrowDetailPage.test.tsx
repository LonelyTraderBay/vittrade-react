import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2POrder } from '../model/p2p-types';
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

describe('P2P escrow detail contract page', () => {
  it('executes mark-paid, challenge, verification and release transitions', async () => {
    const paidOrder = { ...baseOrder, status: 'paid' as const };
    const releasedOrder = { ...baseOrder, status: 'released' as const };
    let currentOrder: P2POrder = baseOrder;
    const releaseKeys: string[] = [];
    let releaseAttempts = 0;

    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json(currentOrder)),
      http.post('*/p2p/orders/order-1/mark-paid', () => {
        currentOrder = paidOrder;
        return HttpResponse.json(paidOrder);
      }),
      http.post('*/p2p/orders/order-1/release/challenge', () =>
        HttpResponse.json({
          id: 'challenge-1',
          method: 'totp',
          expiresAt: '2026-09-21T10:10:00.000Z',
        }),
      ),
      http.post(
        '*/p2p/orders/order-1/release/challenge/challenge-1/verify',
        async ({ request }) => {
          expect(await request.json()).toEqual({ code: '123456' });
          return HttpResponse.json({
            verificationToken: 'verification-token-1',
            expiresAt: '2026-09-21T10:10:00.000Z',
          });
        },
      ),
      http.post('*/p2p/orders/order-1/release', async ({ request }) => {
        releaseKeys.push(request.headers.get('Idempotency-Key') ?? '');
        expect(await request.json()).toEqual({ verificationToken: 'verification-token-1' });
        releaseAttempts += 1;
        if (releaseAttempts === 1) {
          return HttpResponse.json({ code: 'TEMPORARY_FAILURE' }, { status: 503 });
        }
        currentOrder = releasedOrder;
        return HttpResponse.json(releasedOrder);
      }),
    );

    const user = userEvent.setup();
    renderEscrow();

    expect(await screen.findByText('Order #P2P-001')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mark order paid' }));
    expect(await screen.findByRole('button', { name: 'Start escrow release' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start escrow release' }));
    expect(
      await screen.findByRole('textbox', { name: 'Release verification code' }),
    ).toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Release verification code' }), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify release code' }));
    expect(
      await screen.findByRole('button', { name: 'Confirm escrow release' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Confirm escrow release' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể release escrow');
    await user.click(screen.getByRole('button', { name: 'Confirm escrow release' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Start escrow release' }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Escrow released')).toBeInTheDocument();
    expect(releaseKeys).toHaveLength(2);
    expect(releaseKeys[0]).toMatch(/^p2p-escrow-release-order-1-/);
    expect(releaseKeys[1]).toBe(releaseKeys[0]);
  });

  it('hides state-transition actions for a cancelled order', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () =>
        HttpResponse.json({ ...baseOrder, status: 'cancelled' }),
      ),
    );

    renderEscrow();

    expect(await screen.findByText('Order #P2P-001')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark order paid' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Start escrow release' })).not.toBeInTheDocument();
  });

  it('keeps escrow state readable but blocks actions without P2P write permission', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () => HttpResponse.json({ ...baseOrder, status: 'paid' })),
    );
    const readOnlyAdapter: AuthAdapter = {
      ...testAuthAdapter,
      initialSession: {
        ...testAuthAdapter.initialSession!,
        user: { ...testAuthAdapter.initialSession!.user, permissions: ['market:read'] },
      },
    };

    renderEscrow(readOnlyAdapter);

    expect(await screen.findByRole('alert')).toHaveTextContent('P2P write permission is required');
    expect(screen.queryByRole('button', { name: 'Start escrow release' })).not.toBeInTheDocument();
  });

  it('renders and retries the shared error state', async () => {
    server.use(
      http.get('*/p2p/orders/order-1', () =>
        HttpResponse.json({ code: 'P2P_ORDER_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderEscrow();

    expect(await screen.findByText('Unable to load P2P escrow')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P escrow')).toBeInTheDocument();
  });
});
