import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { P2PMyAdsContractPage } from './P2PMyAdsContractPage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const activeAd = {
  id: 'ad-active',
  type: 'sell' as const,
  asset: 'USDT',
  merchant: 'My merchant',
  merchantId: 'me',
  merchantLevel: 2,
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

const pausedAd = { ...activeAd, id: 'ad-paused', status: 'paused' as const };

describe('P2P my ads contract page', () => {
  it('loads owned ads, filters them and pauses an active ad with idempotency', async () => {
    let statusBody: unknown;
    server.use(
      http.get('*/p2p/ads', ({ request }) => {
        expect(new URL(request.url).searchParams.get('mine')).toBe('true');
        return HttpResponse.json({ items: [activeAd, pausedAd] });
      }),
      http.patch('*/p2p/ads/ad-active', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-ad-status-ad-active-/);
        statusBody = await request.json();
        return HttpResponse.json({ ...activeAd, status: 'paused' }, { status: 200 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<P2PMyAdsContractPage />);
    expect(await screen.findAllByText('BÁN USDT/VND')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /Hoạt động \(1\)/ }));
    expect(await screen.findAllByText('BÁN USDT/VND')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Pause ad-active' }));

    await vi.waitFor(() => {
      expect(statusBody).toEqual({ status: 'paused' });
    });
  });

  it('shows API errors and supports retry', async () => {
    server.use(http.get('*/p2p/ads', () => HttpResponse.error()));
    renderWithProviders(<P2PMyAdsContractPage />);
    expect(await screen.findByText('Không thể tải quảng cáo')).toBeInTheDocument();
    const retry = screen.getByRole('button', { name: /retry|thử lại/i });
    expect(retry).toBeInTheDocument();
  });
});
