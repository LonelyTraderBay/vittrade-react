import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PPaymentMethod } from '../model/p2p-types';
import { P2PPaymentMethodAddPage } from './P2PPaymentMethodAddPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
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
    renderWithProviders(<P2PPaymentMethodAddPage />);
    await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
    await user.type(screen.getByRole('textbox', { name: 'Số tài khoản' }), '0123456789');
    await user.type(screen.getByRole('textbox', { name: 'Tên chủ tài khoản' }), 'NGUYEN VAN A');
    await user.click(screen.getByRole('button', { name: 'Thêm phương thức' }));
  });
});
