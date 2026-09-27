import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAdsResponse, P2POverviewResponse } from '../model/p2p-types';
import { P2PMarketplacePage } from './P2PMarketplacePage';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
afterEach(() => {
  server.resetHandlers();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});
afterAll(() => server.close());

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

const ads: P2PAdsResponse = {
  items: [
    {
      id: 'ad-1',
      type: 'sell',
      asset: 'USDT',
      merchant: 'Merchant One',
      merchantId: 'merchant-1',
      merchantLevel: 1,
      merchantVerified: true,
      merchantJoinDate: '2024-01-01',
      completionRate: 98,
      completedOrders: 120,
      totalVolume30d: 50_000,
      price: 25_300,
      currency: 'VND',
      priceType: 'fixed',
      minLimit: 100_000,
      maxLimit: 20_000_000,
      available: 2_000,
      paymentMethods: ['Bank Transfer'],
      avgResponseTime: '2m',
      isOnline: true,
      createdAt: '2026-09-23T00:00:00.000Z',
      status: 'active',
      merchantBadge: 'elite',
    },
    {
      id: 'ad-2',
      type: 'sell',
      asset: 'USDT',
      merchant: 'Merchant Two',
      merchantId: 'merchant-2',
      merchantLevel: 2,
      merchantVerified: false,
      merchantJoinDate: '2023-06-01',
      completionRate: 95,
      completedOrders: 100,
      totalVolume30d: 30_000,
      price: 25_400,
      currency: 'VND',
      priceType: 'fixed',
      minLimit: 100_000,
      maxLimit: 10_000_000,
      available: 1_000,
      paymentMethods: ['Bank Transfer'],
      avgResponseTime: '3m',
      isOnline: true,
      createdAt: '2026-09-22T00:00:00.000Z',
      status: 'active',
      merchantBadge: 'pro',
    },
  ],
};

const overview: P2POverviewResponse = {
  userLevel: {
    currentLevel: 1,
    completedOrders: 12,
    accumulatedVolume: 20_000,
    dailyUsed: 1_000,
    dailyLimit: 10_000,
    fee: 0.2,
    nextLevelProgress: 0.4,
  },
  tradingLevels: [
    {
      id: 1,
      name: 'Starter',
      nameVi: 'Khởi đầu',
      fee: 0.2,
      dailyLimit: 10_000,
      perOrderLimit: 2_000,
      requirements: ['KYC cơ bản'],
      color: '#3B82F6',
      gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    },
  ],
  platformStats: {
    volume24h: 100_000,
    volume24hChange: 2,
    totalTrades24h: 100,
    activeMerchants: 10,
    onlineTraders: 20,
    avgCompletionRate: 95,
    avgCompletionTime: '3m',
    totalUsers: 1_000,
    supportedFiats: 4,
    escrowProtected: 80,
  },
};

describe('P2P marketplace feature page', () => {
  it('renders server-backed marketplace ads and overview stats', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );

    const onQuickActionsOpen = vi.fn();
    const onContextMenuOpen = vi.fn();
    renderWithProviders(
      <P2PMarketplacePage
        onQuickActionsOpen={onQuickActionsOpen}
        onContextMenuOpen={onContextMenuOpen}
      />,
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(screen.getByText('Volume 24h')).toBeInTheDocument();
    expect(screen.getByText(/10 merchants/)).toBeInTheDocument();
  });

  it('filters verified merchants and opens the selected offer menu accessibly', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    const onContextMenuOpen = vi.fn();
    renderWithProviders(<P2PMarketplacePage onContextMenuOpen={onContextMenuOpen} />);

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(screen.getByText('Merchant Two')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bật bộ lọc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));

    expect(screen.getByText('Merchant One')).toBeInTheDocument();
    expect(screen.queryByText('Merchant Two')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));
    expect(screen.getByText('Merchant Two')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    await waitFor(() => expect(onContextMenuOpen).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'So sánh giá' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /yêu thích/i })).not.toBeInTheDocument();
  });

  it('opens an offer action and routes a quick buy within the active web shell', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    renderWithProviders(
      <>
        <P2PMarketplacePage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Mua nhanh USDT' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/ad/ad-1');
  });

  it('adds an offer to comparison and clears the comparison bar', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    const { container } = renderWithProviders(<P2PMarketplacePage />);

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'So sánh giá' }));

    const compareLabel = await screen.findByText('1 offer đang so sánh');
    expect(compareLabel.parentElement?.querySelector('p:last-child')).toHaveTextContent(
      'Merchant One',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'So sánh giá' }));
    expect(screen.getByText('1 offer đang so sánh')).toBeInTheDocument();

    const clearButton = container.querySelector('.fixed.bottom-20 button:last-child');
    expect(clearButton).not.toBeNull();
    fireEvent.click(clearButton!);
    expect(screen.queryByText('1 offer đang so sánh')).not.toBeInTheDocument();
  });

  it('copies a share link and opens the merchant profile in the web shell', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    renderWithProviders(
      <>
        <P2PMarketplacePage />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Chia sẻ offer' }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/w/p2p/ad/ad-1')),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xem hồ sơ merchant' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/merchant/merchant-1');
  });

  it('switches to sell mode and routes from the P2P quick actions sheet', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    const onQuickActionsOpen = vi.fn();
    renderWithProviders(
      <>
        <P2PMarketplacePage onQuickActionsOpen={onQuickActionsOpen} />
        <LocationProbe />
      </>,
      { routerProps: { initialEntries: ['/w/p2p'] } },
    );

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'BÁN' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn P2P' }));

    expect(await screen.findByRole('dialog', { name: 'Tuỳ chọn P2P' })).toBeInTheDocument();
    expect(screen.getByText('Giao dịch')).toBeInTheDocument();
    await waitFor(() => expect(onQuickActionsOpen).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Thanh toán' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/payment-methods');
  });

  it('recovers from a marketplace query error when the user retries', async () => {
    let attempts = 0;
    server.use(
      http.get('*/p2p/ads', () => {
        attempts += 1;
        return attempts <= 3
          ? HttpResponse.json({ message: 'temporarily unavailable' }, { status: 503 })
          : HttpResponse.json(ads);
      }),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    renderWithProviders(<P2PMarketplacePage />);

    expect(await screen.findByText('Không thể tải P2P')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(attempts).toBe(4);
  });
});
