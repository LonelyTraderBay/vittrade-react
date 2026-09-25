import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PBlacklistEntry, P2PMerchantProfileResponse } from '../model/p2p-types';
import { P2PMerchantProfilePage } from './P2PMerchantProfilePage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const profile: P2PMerchantProfileResponse = {
  merchant: {
    id: 'merchant-1',
    name: 'Merchant One',
    level: 3,
    kycVerified: true,
    joinDate: '2025-01-01',
    totalTrades: 100,
    totalTrades30d: 20,
    completionRate: 98,
    avgReleaseTime: '2m',
    avgPayTime: '1m',
    totalVolume30d: 10_000,
    isOnline: true,
    lastActive: 'now',
    positiveRate: 99,
    negativeCount: 1,
    activeAds: 2,
  },
  ads: [],
  reviews: [],
};

const blacklistEntry: P2PBlacklistEntry = {
  id: 'blacklist-1',
  userId: 'merchant-1',
  username: 'Merchant One',
  reason: 'other',
  blockedAt: '2026-09-22',
  tradesBefore: 100,
  completionRate: 98,
  isVerified: true,
};

describe('P2P merchant profile contract page', () => {
  it('loads the merchant profile and blocks the merchant through the blacklist contract', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/blacklist', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-block-merchant-1-/);
        expect(await request.json()).toEqual({
          username: 'Merchant One',
          reason: 'other',
          note: 'Blocked merchant merchant-1',
        });
        return HttpResponse.json(blacklistEntry, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Block P2P merchant' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã chặn merchant');
  });

  it('renders a retryable profile error', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () =>
        HttpResponse.json({ code: 'P2P_MERCHANT_UNAVAILABLE' }, { status: 503 }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );
    expect(await screen.findByText('Không thể tải hồ sơ merchant')).toBeInTheDocument();
  });
});
