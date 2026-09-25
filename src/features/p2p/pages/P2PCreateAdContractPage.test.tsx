import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { P2PCreateAdContractPage } from './P2PCreateAdContractPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createdAd = {
  id: 'ad-created',
  type: 'sell' as const,
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
  priceType: 'fixed' as const,
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 1_000,
  paymentMethods: ['Vietcombank'],
  avgResponseTime: '1m',
  isOnline: true,
  createdAt: '2026-09-22',
  status: 'active' as const,
};

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('spinbutton', { name: 'Giá (VND/USDT)' }), '25000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tổng USDT' }), '1000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tối thiểu (VND)' }), '100000');
  await user.type(screen.getByRole('spinbutton', { name: 'Tối đa (VND)' }), '10000000');
  await user.click(screen.getByRole('button', { name: 'Vietcombank' }));
}

describe('P2P create ad contract page', () => {
  it('validates the form and creates an ad with an idempotency key', async () => {
    let requestBody: unknown;
    server.use(
      http.post('*/p2p/ads', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-/);
        requestBody = await request.json();
        return HttpResponse.json(createdAd, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));

    await vi.waitFor(() => {
      expect(requestBody).toMatchObject({
        type: 'sell',
        asset: 'USDT',
        currency: 'VND',
        priceType: 'fixed',
        price: 25_000,
        available: 1_000,
        minLimit: 100_000,
        maxLimit: 10_000_000,
        paymentMethods: ['Vietcombank'],
      });
    });
  });

  it('blocks invalid submission and displays API errors', async () => {
    const user = userEvent.setup();
    renderWithProviders(<P2PCreateAdContractPage />);
    expect(screen.getByRole('alert')).toHaveTextContent('Nhập giá quảng cáo hợp lệ.');

    await fillValidForm(user);
    server.use(http.post('*/p2p/ads', () => HttpResponse.error()));
    await user.click(screen.getByRole('button', { name: 'Xem xác nhận đăng quảng cáo' }));
    await user.click(screen.getByRole('button', { name: 'Xác nhận đăng' }));

    expect(
      await screen.findByText('Không thể đăng quảng cáo. Vui lòng thử lại.'),
    ).toBeInTheDocument();
  });
});
