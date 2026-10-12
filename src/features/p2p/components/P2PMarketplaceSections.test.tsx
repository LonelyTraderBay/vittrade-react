import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAd, P2PPlatformStats } from '../model/p2p-types';
import { P2PMarketplaceSections, type P2PMarketplaceSectionsProps } from './P2PMarketplaceSections';

const stats: P2PPlatformStats = {
  volume24h: 250_000_000,
  volume24hChange: 2.5,
  totalTrades24h: 1_200,
  activeMerchants: 85,
  onlineTraders: 3_400,
  avgCompletionRate: 98.2,
  avgCompletionTime: '3 phút',
  totalUsers: 100_000,
  supportedFiats: 2,
  escrowProtected: 80_000_000,
};

const ad: P2PAd = {
  id: 'ad-1',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Merchant One',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2024-01-01',
  completionRate: 98,
  completedOrders: 240,
  totalVolume30d: 50_000,
  price: 25_300,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 5_000,
  paymentMethods: ['Bank Transfer'],
  avgResponseTime: '2 phút',
  isOnline: true,
  createdAt: '2026-10-01T00:00:00.000Z',
  status: 'active',
};

function makeProps(
  overrides: Partial<P2PMarketplaceSectionsProps> = {},
): P2PMarketplaceSectionsProps {
  return {
    platformStats: stats,
    tab: 'buy',
    handleTabSwitch: vi.fn(),
    asset: 'USDT',
    setAsset: vi.fn(),
    fiatCurrency: 'VND',
    setFiatCurrency: vi.fn(),
    searchText: '',
    setSearchText: vi.fn(),
    showFilters: false,
    setShowFilters: vi.fn(),
    sortBy: 'price',
    setSortBy: vi.fn(),
    merchantType: 'all',
    setMerchantType: vi.fn(),
    filterPayment: '',
    setFilterPayment: vi.fn(),
    amountInput: '',
    setAmountInput: vi.fn(),
    activeFilterCount: 0,
    allPaymentMethods: ['Bank Transfer', 'Momo'],
    ads: [ad],
    onContextMenu: vi.fn(),
    onQuickAction: vi.fn(),
    prefix: '/w',
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function renderSections(props: P2PMarketplaceSectionsProps) {
  return renderWithProviders(
    <Routes>
      <Route
        path="*"
        element={
          <>
            <P2PMarketplaceSections {...props} />
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { routerProps: { initialEntries: ['/w/p2p'] } },
  );
}

describe('P2PMarketplaceSections', () => {
  it('shows marketplace stats and routes through both quick actions', () => {
    renderSections(makeProps());

    expect(screen.getByText('Volume 24h')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'SPAN' && element.textContent?.replace(/\D/g, '') === '3400',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Escrow/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /Express Trade/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/express');
    fireEvent.click(screen.getByRole('button', { name: /Đăng offer/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/create');
  });

  it('forwards tab, asset, currency, search, and filter-panel changes', () => {
    const props = makeProps();
    renderSections(props);

    fireEvent.click(screen.getByRole('tab', { name: 'BÁN' }));
    fireEvent.click(screen.getByRole('button', { name: 'BTC' }));
    fireEvent.click(screen.getByRole('button', { name: 'ETH' }));
    fireEvent.click(screen.getByRole('button', { name: 'USD' }));
    fireEvent.change(screen.getByPlaceholderText('Tìm merchant...'), {
      target: { value: 'Merchant One' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Bật bộ lọc' }));

    expect(props.handleTabSwitch).toHaveBeenCalledWith('sell');
    expect(props.setAsset).toHaveBeenNthCalledWith(1, 'BTC');
    expect(props.setAsset).toHaveBeenNthCalledWith(2, 'ETH');
    expect(props.setFiatCurrency).toHaveBeenCalledWith('USD');
    expect(props.setSearchText).toHaveBeenCalledWith('Merchant One');
    expect(props.setShowFilters).toHaveBeenCalledWith(true);
  });

  it('updates each advanced filter, toggles selected payments, and clears active filters', () => {
    const props = makeProps({
      showFilters: true,
      sortBy: 'price',
      merchantType: 'all',
      filterPayment: '',
      activeFilterCount: 3,
    });
    renderSections(props);

    expect(screen.getByText(/1 offer/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tỷ lệ hoàn thành' }));
    fireEvent.click(screen.getByRole('button', { name: 'Số đơn nhiều nhất' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elite' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Tất cả' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Bank Transfer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Momo' }));
    fireEvent.change(screen.getByLabelText('Số tiền'), { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xóa bộ lọc' }));

    expect(props.setSortBy).toHaveBeenNthCalledWith(1, 'completion');
    expect(props.setSortBy).toHaveBeenNthCalledWith(2, 'orders');
    expect(props.setMerchantType).toHaveBeenNthCalledWith(1, 'elite');
    expect(props.setMerchantType).toHaveBeenNthCalledWith(2, 'pro');
    expect(props.setMerchantType).toHaveBeenNthCalledWith(3, 'verified');
    expect(props.setMerchantType).toHaveBeenNthCalledWith(4, 'all');
    expect(props.setFilterPayment).toHaveBeenNthCalledWith(1, '');
    expect(props.setFilterPayment).toHaveBeenNthCalledWith(2, 'Bank Transfer');
    expect(props.setFilterPayment).toHaveBeenNthCalledWith(3, 'Momo');
    expect(props.setAmountInput).toHaveBeenCalledWith('250000');
    expect(props.setSortBy).toHaveBeenLastCalledWith('price');
    expect(props.setFilterPayment).toHaveBeenLastCalledWith('');
    expect(props.setAmountInput).toHaveBeenLastCalledWith('');
  });

  it('reflects selected sort and filter values, switches a selected payment off, and renders an empty state', () => {
    const props = makeProps({
      showFilters: true,
      sortBy: 'completion',
      merchantType: 'elite',
      filterPayment: 'Bank Transfer',
      ads: [],
    });
    const { rerender } = renderSections(props);
    expect(screen.getByText('Không tìm thấy offer')).toBeInTheDocument();
    expect(screen.getByText('0 offer').parentElement).toHaveTextContent('Tỷ lệ hoàn thành');

    fireEvent.click(screen.getByRole('button', { name: 'Bank Transfer' }));
    expect(props.setFilterPayment).toHaveBeenCalledWith('');

    rerender(
      <Routes>
        <Route
          path="*"
          element={
            <>
              <P2PMarketplaceSections {...props} filterPayment="Momo" sortBy="orders" />
              <LocationProbe />
            </>
          }
        />
      </Routes>,
    );
    expect(screen.getByText('0 offer').parentElement).toHaveTextContent('Số đơn nhiều nhất');
    fireEvent.click(screen.getByRole('button', { name: 'Momo' }));
    expect(props.setFilterPayment).toHaveBeenCalledWith('');
  });

  it('exposes the offer menu and quick trade callback for a listed ad', () => {
    const props = makeProps();
    const { container } = renderSections(props);

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    expect(props.onContextMenu).toHaveBeenCalledWith(ad);
    const touchSurface = container.querySelector<HTMLElement>('[style*="translateX"]');
    expect(touchSurface).not.toBeNull();
    fireEvent.touchStart(touchSurface!, { touches: [{ clientX: 20, clientY: 100 }] });
    fireEvent.touchMove(touchSurface!, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(touchSurface!);
    expect(props.onQuickAction).toHaveBeenCalledWith(ad, 'buy');
  });
});
