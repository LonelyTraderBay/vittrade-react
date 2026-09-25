import { act, fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAd } from '../model/p2p-types';
import { CompareBar, SwipeableAdCard } from './P2PHomeCards';

const ad: P2PAd = {
  id: 'offer-1',
  type: 'sell',
  asset: 'USDT',
  merchant: 'Verified Merchant',
  merchantId: 'merchant-1',
  merchantLevel: 3,
  merchantVerified: true,
  merchantJoinDate: '2022-01-01',
  completionRate: 98.5,
  completedOrders: 240,
  totalVolume30d: 250_000,
  price: 25_300,
  currency: 'VND',
  priceType: 'fixed',
  minLimit: 100_000,
  maxLimit: 10_000_000,
  available: 5_000,
  paymentMethods: ['Bank', 'Wallet', 'Cash', 'Other'],
  avgResponseTime: '2 phút',
  isOnline: true,
  createdAt: '2026-09-01T00:00:00.000Z',
  status: 'active',
  merchantRating: 4.9,
  merchantBadge: 'elite',
  isNewMerchant: true,
  referencePrice: 25_000,
};

function renderAdCard(overrides: Partial<Parameters<typeof SwipeableAdCard>[0]> = {}) {
  const onContextMenu = vi.fn();
  const onQuickAction = vi.fn();
  const view = renderWithProviders(
    <Routes>
      <Route
        path="/w"
        element={
          <SwipeableAdCard
            ad={ad}
            tradeType="buy"
            prefix="/w"
            index={0}
            onContextMenu={onContextMenu}
            onQuickAction={onQuickAction}
            {...overrides}
          />
        }
      />
      <Route path="/w/p2p/ad/offer-1" element={<p>Offer details</p>} />
    </Routes>,
    { routerProps: { initialEntries: ['/w'] } },
  );
  const touchSurface = view.container.querySelector<HTMLElement>('[style*="translateX"]');
  if (!touchSurface) throw new Error('Swipeable ad card touch surface was not rendered');
  return { ...view, touchSurface, onContextMenu, onQuickAction };
}

afterEach(() => vi.useRealTimers());

describe('P2P home cards', () => {
  it('renders merchant details and opens the selected offer route', async () => {
    renderAdCard();

    expect(screen.getByText('Verified Merchant')).toBeInTheDocument();
    expect(screen.getByText('Elite')).toBeInTheDocument();
    expect(screen.getByText('4.9')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
    expect(screen.getByText(/Merchant mới/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mua' }));
    expect(await screen.findByText('Offer details')).toBeVisible();
  });

  it('routes the context menu and quick trade swipe while leaving unsupported favorite actions unavailable', () => {
    const { touchSurface, onContextMenu, onQuickAction } = renderAdCard();

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Verified Merchant' }));
    expect(onContextMenu).toHaveBeenCalledWith(ad);

    fireEvent.touchStart(touchSurface, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchMove(touchSurface, { touches: [{ clientX: 20, clientY: 100 }] });
    fireEvent.touchEnd(touchSurface);
    expect(onQuickAction).not.toHaveBeenCalled();

    fireEvent.touchStart(touchSurface, { touches: [{ clientX: 20, clientY: 100 }] });
    fireEvent.touchMove(touchSurface, { touches: [{ clientX: 100, clientY: 100 }] });
    fireEvent.touchEnd(touchSurface);
    expect(onQuickAction).toHaveBeenCalledWith(ad, 'buy');
  });

  it('opens the merchant menu on long press without triggering a swipe action', () => {
    vi.useFakeTimers();
    const { touchSurface, onContextMenu, onQuickAction } = renderAdCard();

    fireEvent.touchStart(touchSurface, { touches: [{ clientX: 40, clientY: 40 }] });
    act(() => vi.advanceTimersByTime(500));
    fireEvent.touchEnd(touchSurface);

    expect(onContextMenu).toHaveBeenCalledWith(ad);
    expect(onQuickAction).not.toHaveBeenCalled();
  });

  it('keeps the comparison bar hidden until it has offers', () => {
    const onClear = vi.fn();
    const onView = vi.fn();
    const { rerender } = renderWithProviders(
      <CompareBar items={[]} onClear={onClear} onView={onView} />,
    );

    expect(screen.queryByText(/offer đang so sánh/)).not.toBeInTheDocument();
    rerender(
      <CompareBar
        items={[ad, { ...ad, id: 'offer-2', merchant: 'Other Merchant' }]}
        onClear={onClear}
        onView={onView}
      />,
    );

    expect(screen.getByText('2 offer đang so sánh')).toBeInTheDocument();
    expect(screen.getByText('Verified Merchant vs Other Merchant')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'So sánh' }));
    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(onView).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
  });
});
