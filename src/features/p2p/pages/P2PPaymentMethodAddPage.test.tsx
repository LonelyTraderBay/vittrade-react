import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { toast } from 'sonner';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { renderWithProviders } from '@/test/test-utils';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type { P2PPaymentMethod } from '../model/p2p-types';
import { P2PPaymentMethodAddPage } from './P2PPaymentMethodAddPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

const created: P2PPaymentMethod = {
  id: 'pm-1',
  type: 'bank',
  bankName: 'Vietcombank',
  accountNumber: '0123456789',
  accountName: 'NGUYEN VAN A',
  isDefault: false,
  isVerified: false,
  createdAt: '2026-09-22',
};

const ewalletCreated: P2PPaymentMethod = {
  ...created,
  id: 'pm-ewallet',
  type: 'ewallet',
  bankName: 'Momo',
  accountNumber: '0987654321',
};

const authAdapterWithPermissions = (permissions: string[]): AuthAdapter => ({
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions },
  },
});

describe('P2P payment method add contract page', () => {
  it('creates a payment method through the feature-owned mutation boundary', async () => {
    server.use(
      http.post('*/p2p/payment-methods', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-payment-method-create-/);
        expect(await request.json()).toEqual({
          type: 'bank',
          bankName: 'Vietcombank',
          accountNumber: '0123456789',
          accountName: 'NGUYEN VAN A',
        });
        return HttpResponse.json(created, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/payment-method/add" element={<P2PPaymentMethodAddPage />} />
        <Route path="/p2p/payment-methods" element={<p>payment methods list</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/payment-method/add'] } },
    );
    await user.click(screen.getByRole('button', { name: 'Ngân hàng' }));
    await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
    await user.type(screen.getByRole('textbox', { name: 'Số tài khoản' }), '0123456789');
    await user.type(screen.getByRole('textbox', { name: 'Tên chủ tài khoản' }), 'NGUYEN VAN A');
    await user.click(screen.getByRole('button', { name: 'Thêm phương thức' }));

    expect(await screen.findByText('payment methods list')).toBeInTheDocument();
  });

  it('creates an e-wallet from the query type using the dedicated write permission', async () => {
    server.use(
      http.post('*/p2p/payment-methods', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-payment-method-create-/);
        expect(await request.json()).toEqual({
          type: 'ewallet',
          bankName: 'Momo',
          accountNumber: '0987654321',
          accountName: 'NGUYEN VAN A',
        });
        return HttpResponse.json(ewalletCreated, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/payment-method/add" element={<P2PPaymentMethodAddPage />} />
        <Route path="/p2p/payment-methods" element={<p>payment methods list</p>} />
      </Routes>,
      {
        authAdapter: authAdapterWithPermissions(['p2p:payment-methods:write']),
        routerProps: { initialEntries: ['/p2p/payment-method/add?type=ewallet'] },
      },
    );

    expect(screen.getByText('Thêm ví điện tử')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Số tài khoản' })).toHaveAttribute(
      'placeholder',
      '0901234567',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ngân hàng' }));
    expect(screen.getByRole('button', { name: 'Vietcombank' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ví điện tử' }));
    await user.click(screen.getByRole('button', { name: 'Momo' }));
    await user.type(screen.getByRole('textbox', { name: 'Số tài khoản' }), ' 0987654321 ');
    await user.type(screen.getByRole('textbox', { name: 'Tên chủ tài khoản' }), 'nguyen van a');
    expect(screen.getByRole('textbox', { name: 'Tên chủ tài khoản' })).toHaveValue('NGUYEN VAN A');
    expect(screen.getByRole('button', { name: 'Thêm phương thức' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Thêm phương thức' }));

    expect(await screen.findByText('payment methods list')).toBeInTheDocument();
  });

  it('shows the permission requirement and disables submission without write permission', async () => {
    renderWithProviders(<P2PPaymentMethodAddPage />, {
      authAdapter: authAdapterWithPermissions(['p2p:read']),
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'P2P payment-method write permission is required to add a payment method.',
    );
    expect(screen.getByRole('button', { name: 'Thêm phương thức' })).toBeDisabled();
  });

  it('keeps the form visible and does not navigate when the API rejects a duplicate method', async () => {
    let duplicateRequests = 0;
    const errorToast = vi.spyOn(toast, 'error');
    server.use(
      http.post('*/p2p/payment-methods', () => {
        duplicateRequests += 1;
        return HttpResponse.json({ code: 'P2P_PAYMENT_METHOD_DUPLICATE' }, { status: 409 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/payment-method/add" element={<P2PPaymentMethodAddPage />} />
        <Route path="/p2p/payment-methods" element={<p>payment methods list</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/payment-method/add'] } },
    );

    await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
    await user.type(screen.getByRole('textbox', { name: 'Số tài khoản' }), '0123456789');
    await user.type(screen.getByRole('textbox', { name: 'Tên chủ tài khoản' }), 'NGUYEN VAN A');
    await user.click(screen.getByRole('button', { name: 'Thêm phương thức' }));

    await waitFor(() => expect(duplicateRequests).toBe(1));
    await waitFor(() =>
      expect(errorToast).toHaveBeenCalledWith('Không thể thêm phương thức thanh toán.'),
    );
    expect(screen.queryByText('payment methods list')).not.toBeInTheDocument();
  });
});
