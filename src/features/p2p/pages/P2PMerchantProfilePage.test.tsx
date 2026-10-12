import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { AuthAdapter } from '@/shared/session/AuthContext';
import { testAuthAdapter } from '@/test/auth-test-adapter';
import type {
  P2PAd,
  P2PBlacklistEntry,
  P2PMerchantProfileResponse,
  P2PReview,
} from '../model/p2p-types';
import { P2PMerchantProfilePage } from './P2PMerchantProfilePage';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
});
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

const sellAd: P2PAd = {
  id: 'ad-sell',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2025-01-01',
  completionRate: 98,
  completedOrders: 100,
  totalVolume30d: 10_000,
  price: 25_000,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 400,
  paymentMethods: ['Bank transfer'],
  avgResponseTime: '1m',
  isOnline: false,
  createdAt: '2026-09-22T00:00:00Z',
  status: 'active',
};

const review: P2PReview = {
  id: 'review-1',
  orderId: 'order-1',
  fromUser: 'Trading Partner',
  fromUserId: 'user-1',
  toUser: 'Merchant One',
  toUserId: 'merchant-1',
  rating: 4,
  comment: 'Thanh toán nhanh và đúng thỏa thuận.',
  createdAt: '2026-09-22',
  type: 'positive',
};

const authAdapterWithPermissions = (permissions: string[]): AuthAdapter => ({
  ...testAuthAdapter,
  initialSession: {
    ...testAuthAdapter.initialSession!,
    user: { ...testAuthAdapter.initialSession!.user, permissions },
  },
});

describe('P2P merchant profile contract page', () => {
  it('loads the merchant profile and blocks the merchant through the blacklist contract', async () => {
    let resolveBlock: (() => void) | undefined;
    const blockResponse = new Promise<Response>((resolve) => {
      resolveBlock = () => resolve(HttpResponse.json(blacklistEntry, { status: 201 }));
    });
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/blacklist', async ({ request }) => {
        expect(request.headers.get('Idempotency-Key')).toMatch(/^p2p-block-merchant-1-/);
        expect(await request.json()).toEqual({
          username: 'Merchant One',
          reason: 'other',
          note: 'Blocked merchant merchant-1',
        });
        return blockResponse;
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
        <Route path="/p2p/report/:merchantId" element={<p>merchant report form</p>} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Block P2P merchant' }));
    expect(await screen.findByText('Đang chặn…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Block P2P merchant' })).toBeDisabled();
    resolveBlock?.();
    expect(await screen.findByRole('status')).toHaveTextContent('Đã chặn merchant');
    await user.click(screen.getByRole('button', { name: 'Report P2P merchant' }));
    expect(screen.getByText('merchant report form')).toBeInTheDocument();
  });

  it('renders profile ads and reviews for a level-zero offline merchant without verified KYC', async () => {
    const richProfile: P2PMerchantProfileResponse = {
      merchant: {
        ...profile.merchant,
        kycVerified: false,
        level: 0,
        isOnline: false,
        lastActive: '30 phút trước',
      },
      ads: [sellAd, { ...sellAd, id: 'ad-buy', type: 'buy', asset: 'BTC' }],
      reviews: [review],
    };
    server.use(http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(richProfile)));

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(screen.getByText('Lv.0')).toBeInTheDocument();
    expect(screen.getByText('30 phút trước')).toBeInTheDocument();
    expect(screen.getByText('BÁN USDT')).toBeInTheDocument();
    expect(screen.getByText('MUA BTC')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Đánh giá (1)' }));
    expect(screen.getByText('Trading Partner')).toBeInTheDocument();
    expect(screen.getByText('Thanh toán nhanh và đúng thỏa thuận.')).toBeInTheDocument();
    expect(screen.getByText('★★★★')).toBeInTheDocument();
  });

  it('recovers a failed profile request when retry is selected', async () => {
    let attempts = 0;
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => {
        attempts += 1;
        return attempts === 1
          ? HttpResponse.json({ code: 'INVALID_REQUEST' }, { status: 400 })
          : HttpResponse.json(profile);
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );

    await user.click(await screen.findByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(attempts).toBe(2);
  });

  it('accepts the dedicated blacklist permission when general P2P write is absent', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/blacklist', () => HttpResponse.json(blacklistEntry, { status: 201 })),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      {
        authAdapter: authAdapterWithPermissions(['p2p:blacklist:write']),
        routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] },
      },
    );

    await screen.findByText('Merchant One');
    expect(
      screen.queryByText('P2P blacklist write permission is required to block a merchant.'),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Block P2P merchant' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã chặn merchant');
  });

  it('reports a blacklist conflict through the page error state without rejecting the click handler', async () => {
    server.use(
      http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)),
      http.post('*/p2p/blacklist', () =>
        HttpResponse.json({ code: 'P2P_BLACKLIST_CONFLICT' }, { status: 409 }),
      ),
    );

    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] } },
    );

    await screen.findByText('Merchant One');
    await user.click(screen.getByRole('button', { name: 'Block P2P merchant' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Không thể chặn merchant. Vui lòng thử lại.',
    );
  });

  it('disables blacklist changes when the user lacks blacklist permission', async () => {
    server.use(http.get('*/p2p/merchants/merchant-1', () => HttpResponse.json(profile)));

    renderWithProviders(
      <Routes>
        <Route path="/p2p/merchant/:merchantId" element={<P2PMerchantProfilePage />} />
      </Routes>,
      {
        authAdapter: authAdapterWithPermissions(['p2p:read']),
        routerProps: { initialEntries: ['/p2p/merchant/merchant-1'] },
      },
    );

    await screen.findByText('Merchant One');
    expect(screen.getByRole('button', { name: 'Block P2P merchant' })).toBeDisabled();
    expect(
      screen.getByText('P2P blacklist write permission is required to block a merchant.'),
    ).toBeInTheDocument();
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
