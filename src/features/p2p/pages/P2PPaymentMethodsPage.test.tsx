import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2PPaymentMethod } from '../model/p2p-types';
import { P2PPaymentMethodsPage } from './P2PPaymentMethodsPage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const bank: P2PPaymentMethod = {
  id: 'pm-bank',
  type: 'bank',
  bankName: 'Vietcombank',
  accountNumber: '0123456789',
  accountName: 'NGUYEN VAN A',
  isDefault: true,
  isVerified: true,
  createdAt: '2026-09-01T10:00:00.000Z',
};

const wallet: P2PPaymentMethod = {
  id: 'pm-wallet',
  type: 'ewallet',
  bankName: 'MoMo',
  accountNumber: '0987654321',
  accountName: 'NGUYEN VAN A',
  isDefault: false,
  isVerified: false,
  createdAt: '2026-09-02T10:00:00.000Z',
};

describe('P2P payment methods contract page', () => {
  it('updates the default method and deletes a method through typed mutations', async () => {
    let currentMethods = [bank, wallet];
    server.use(
      http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: currentMethods })),
      http.patch('*/p2p/payment-methods/pm-wallet', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-payment-method-default-/);
        expect(await request.json()).toEqual({ isDefault: true });
        currentMethods = [
          { ...bank, isDefault: false },
          { ...wallet, isDefault: true },
        ];
        return HttpResponse.json({ ...wallet, isDefault: true });
      }),
      http.delete('*/p2p/payment-methods/pm-bank', ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-payment-method-delete-/);
        currentMethods = currentMethods.filter((method) => method.id !== 'pm-bank');
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PPaymentMethodsPage />);

    expect(await screen.findByText('Vietcombank')).toBeInTheDocument();
    expect(screen.getByText('MoMo')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Set default MoMo' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Set default MoMo' })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: 'Delete Vietcombank' }));
    expect(
      await screen.findByRole('heading', { name: 'Delete payment method?' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.queryByText('Vietcombank')).not.toBeInTheDocument());
  });

  it('renders the empty state for an account without payment methods', async () => {
    server.use(http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: [] })));

    renderWithProviders(<P2PPaymentMethodsPage />);

    expect(
      await screen.findByRole('status', { name: 'No P2P payment methods' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add bank payment method' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add e-wallet payment method' })).toBeInTheDocument();
  });

  it('renders and retries the shared error state', async () => {
    server.use(
      http.get('*/p2p/payment-methods', () =>
        HttpResponse.json({ code: 'P2P_PAYMENT_METHODS_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(<P2PPaymentMethodsPage />);

    expect(await screen.findByText('Unable to load P2P payment methods')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Unable to load P2P payment methods')).toBeInTheDocument();
  });

  it('keeps payment methods readable but blocks writes without permission', async () => {
    server.use(
      http.get('*/p2p/payment-methods', () => HttpResponse.json({ items: [bank, wallet] })),
    );

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

    renderWithProviders(<P2PPaymentMethodsPage />, { authAdapter: readOnlyAdapter });

    expect(await screen.findByText('Vietcombank')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P payment-method write permission is required to manage payment methods.',
    );
    expect(screen.getByRole('button', { name: 'Add bank payment method' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Vietcombank' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Set default MoMo' })).toBeDisabled();
  });
});
