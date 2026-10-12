import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAd, P2PTradingLevel, P2PUserLevel } from '../model/p2p-types';
import { ContextMenuSheet, P2PQuickActionsSheet } from './P2PHomeActionSheets';

vi.mock('@/shared/ui/BottomSheetV2', () => ({
  BottomSheetV2: ({
    open,
    ariaLabel,
    title,
    customHeader,
    children,
    onClose,
    onAfterOpen,
  }: {
    open: boolean;
    ariaLabel?: string;
    title?: string;
    customHeader?: React.ReactNode;
    children: React.ReactNode;
    onClose: () => void;
    onAfterOpen?: () => void;
  }) =>
    open ? (
      <section role="dialog" aria-label={ariaLabel}>
        {customHeader}
        {title && <h2>{title}</h2>}
        {onAfterOpen && <button onClick={onAfterOpen}>After open</button>}
        <button onClick={onClose}>Dismiss test sheet</button>
        {children}
      </section>
    ) : null,
}));

const ad: P2PAd = {
  id: 'offer-1',
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

const userLevel: P2PUserLevel = {
  currentLevel: 3,
  completedOrders: 240,
  accumulatedVolume: 50_000,
  dailyUsed: 10_000,
  dailyLimit: 500_000_000,
  fee: 0.15,
  nextLevelProgress: 0.5,
};

const tradingLevel: P2PTradingLevel = {
  id: 3,
  name: 'Advanced',
  nameVi: 'Nâng cao',
  fee: 0.15,
  dailyLimit: 500_000_000,
  perOrderLimit: 45_000_000,
  requirements: [],
  color: '#3B82F6',
  gradient: '',
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}</output>;
}

function renderActionSheets(ui: React.ReactNode, initialEntry = '/t/p2p') {
  return renderWithProviders(
    <Routes>
      <Route
        path="*"
        element={
          <>
            {ui}
            <LocationProbe />
          </>
        }
      />
    </Routes>,
    { routerProps: { initialEntries: [initialEntry] } },
  );
}

describe('P2P home action sheets', () => {
  it('keeps the context menu absent when no offer is selected', () => {
    renderActionSheets(
      <ContextMenuSheet
        ad={null}
        isOpen
        onClose={vi.fn()}
        tradeType="buy"
        onShare={vi.fn()}
        onCompare={vi.fn()}
        onQuickAction={vi.fn()}
        onViewMerchant={vi.fn()}
        prefix="/t"
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['elite', 'linear-gradient(135deg, #F59E0B, #FBBF24)'],
    ['pro', 'linear-gradient(135deg, #8B5CF6, #A78BFA)'],
    [undefined, 'linear-gradient(135deg, #3B82F6, #60A5FA)'],
  ] as const)('routes every %s offer-menu action and closes exactly once', (badge, gradient) => {
    const onClose = vi.fn();
    const onShare = vi.fn();
    const onCompare = vi.fn();
    const onQuickAction = vi.fn();
    const onViewMerchant = vi.fn();
    const onAfterOpen = vi.fn();
    const offer = { ...ad, merchantBadge: badge };
    renderActionSheets(
      <ContextMenuSheet
        ad={offer}
        isOpen
        onClose={onClose}
        tradeType="buy"
        onShare={onShare}
        onCompare={onCompare}
        onQuickAction={onQuickAction}
        onViewMerchant={onViewMerchant}
        prefix="/t"
        onAfterOpen={onAfterOpen}
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Tuỳ chọn Merchant One' })).toBeInTheDocument();
    expect(screen.getByText('M').parentElement).toHaveStyle({ background: gradient });
    fireEvent.click(screen.getByRole('button', { name: 'After open' }));
    fireEvent.click(screen.getByRole('button', { name: /Mua nhanh USDT/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Chia sẻ offer' }));
    fireEvent.click(screen.getByRole('button', { name: 'So sánh giá' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xem hồ sơ merchant' }));
    fireEvent.click(screen.getByRole('button', { name: 'Báo cáo offer' }));

    expect(onAfterOpen).toHaveBeenCalledTimes(1);
    expect(onQuickAction).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onCompare).toHaveBeenCalledTimes(1);
    expect(onViewMerchant).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(5);
    expect(screen.getByTestId('location')).toHaveTextContent('/t/p2p/report/merchant-1');
  });

  it('uses the sell label and routes report from a web shell', () => {
    renderActionSheets(
      <ContextMenuSheet
        ad={ad}
        isOpen
        onClose={vi.fn()}
        tradeType="sell"
        onShare={vi.fn()}
        onCompare={vi.fn()}
        onQuickAction={vi.fn()}
        onViewMerchant={vi.fn()}
        prefix="/w"
      />,
      '/w/p2p',
    );

    expect(screen.getByRole('button', { name: 'Bán nhanh USDT' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Báo cáo offer' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/report/merchant-1');
  });

  it('routes each quick action and sends haptic feedback after navigation', () => {
    const onClose = vi.fn();
    renderActionSheets(
      <P2PQuickActionsSheet
        isOpen
        onClose={onClose}
        userLevel={userLevel}
        currentLevelData={tradingLevel}
      />,
    );

    const actions = [
      ['Thanh toán', '/t/p2p/payment-methods'],
      ['Sổ lệnh', '/t/p2p/order-book'],
      ['Lịch sử', '/t/p2p/my-orders'],
      ['Dashboard', '/t/p2p/dashboard'],
      ['Xếp hạng', '/t/p2p/reviews'],
      ['Thành tích', '/t/p2p/achievements'],
      ['Bảo hiểm', '/t/p2p/insurance-fund'],
      ['Tranh chấp', '/t/p2p/disputes'],
      ['Cấp bậc', '/t/p2p/trading-level'],
      ['Câu hỏi thường gặp', '/t/p2p/guide'],
    ] as const;

    for (const [label, path] of actions) {
      fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
      expect(screen.getByTestId('location')).toHaveTextContent(path);
    }

    expect(onClose).toHaveBeenCalledTimes(actions.length);
  });

  it('falls back to the standard level gradient when level data has no gradient', () => {
    const onClose = vi.fn();
    renderActionSheets(
      <P2PQuickActionsSheet
        isOpen
        onClose={onClose}
        userLevel={userLevel}
        currentLevelData={{ ...tradingLevel, gradient: '' }}
      />,
    );

    expect(screen.getByRole('button', { name: /Lv\.3/ }).querySelector('.w-10.h-10')).toHaveStyle({
      background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    });
    fireEvent.click(screen.getByRole('button', { name: /Lv\.3/ }));
    expect(screen.getByTestId('location')).toHaveTextContent('/t/p2p/trading-level');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
