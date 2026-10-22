import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import type { P2PAdsResponse } from '../model/p2p-types';
import { P2PMarketplacePage } from './P2PMarketplacePage';
import {
  p2pMarketplaceAds as ads,
  p2pMarketplaceOverview as overview,
} from '@/test/fixtures/p2p-marketplace';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
});
afterAll(() => server.close());

function CaptureClient({ onReady }: { onReady: (client: QueryClient) => void }) {
  const client = useQueryClient();
  useEffect(() => onReady(client), [client, onReady]);
  return null;
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname + location.search}</span>;
}

async function waitForBottomSheetExit() {
  await waitFor(() =>
    expect(document.querySelector('[data-bottom-sheet-overlay]')).not.toBeInTheDocument(),
  );
}

const mixedAds: P2PAdsResponse = {
  items: [
    ...ads.items,
    { ...ads.items[0], id: 'ad-buy', type: 'buy', merchant: 'Buyer One', merchantId: 'buyer-1' },
  ],
};

const marketplaceAds: P2PAdsResponse = {
  items: [
    ...ads.items,
    { ...ads.items[0], id: 'ad-3', merchant: 'Merchant Three', merchantId: 'merchant-3' },
    { ...ads.items[0], id: 'ad-4', merchant: 'Merchant Four', merchantId: 'merchant-4' },
  ],
};

describe('P2P marketplace feature page', () => {
  it('retains focused asset and draft filters through pending, error and recovery while hiding unavailable offers', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let recover = false;
    server.use(
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
      http.get('*/p2p/ads', async ({ request }) => {
        if (new URL(request.url).searchParams.get('asset') !== 'BTC') return HttpResponse.json(ads);
        await gate;
        return recover
          ? HttpResponse.json({
              items: [
                { ...ads.items[0], id: 'btc-current', asset: 'BTC', merchant: 'Current BTC' },
              ],
            })
          : HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 });
      }),
    );
    renderWithProviders(<P2PMarketplacePage />);
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bật bộ lọc' }));
    fireEvent.change(screen.getByPlaceholderText('Nhập số tiền VND...'), {
      target: { value: '1000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Xác minh' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bank Transfer' }));
    const payment = screen.getByRole('button', { name: 'Bank Transfer' });
    const search = screen.getByPlaceholderText('Tìm merchant...');
    const asset = screen.getByRole('button', { name: 'BTC' });
    asset.focus();
    fireEvent.click(asset);
    try {
      expect(screen.getByRole('button', { name: 'BTC' })).toBe(asset);
      expect(asset).toHaveFocus();
      expect(screen.getByRole('button', { name: 'Bank Transfer' })).toBe(payment);
      expect(screen.getByPlaceholderText('Tìm merchant...')).toBe(search);
      expect(screen.getByPlaceholderText('Nhập số tiền VND...')).toHaveValue('1,000,000');
      expect(screen.queryByText('Merchant One')).not.toBeInTheDocument();
      expect(screen.queryByText('Không tìm thấy offer')).not.toBeInTheDocument();
    } finally {
      release();
    }
    expect(await screen.findByText('Không thể tải P2P')).toBeInTheDocument();
    expect(asset).toHaveFocus();
    expect(screen.getByRole('button', { name: 'BTC' })).toBe(asset);
    expect(screen.getByPlaceholderText('Nhập số tiền VND...')).toHaveValue('1,000,000');
    recover = true;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Current BTC')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'BTC' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Xác minh' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it.each(['offer', 'shortcut'] as const)(
    'retains marketplace controls and restores logical focus after an overview error with the %s modal open',
    async (kind) => {
      let fail = false;
      let queryClient: QueryClient | undefined;
      server.use(
        http.get('*/p2p/ads', () => HttpResponse.json(ads)),
        http.get('*/p2p/overview', () =>
          fail
            ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 })
            : HttpResponse.json(overview),
        ),
      );
      renderWithProviders(
        <>
          <P2PMarketplacePage />
          <CaptureClient
            onReady={(client) => {
              queryClient = client;
            }}
          />
        </>,
      );
      expect(await screen.findByText('Merchant One')).toBeInTheDocument();
      const asset = screen.getByRole('button', { name: 'BTC' });
      fireEvent.click(
        screen.getByRole('button', {
          name: kind === 'offer' ? 'Tuỳ chọn offer của Merchant One' : 'Tuỳ chọn P2P',
        }),
      );
      expect(await screen.findByRole('dialog')).toBeInTheDocument();
      fail = true;
      // A query refresh can fail while the modal correctly hides background controls.
      await act(async () => {
        await queryClient!.refetchQueries({ queryKey: ['p2p', 'overview'] });
      });
      expect(await screen.findByText('Không thể tải P2P')).toBeInTheDocument();
      await waitForBottomSheetExit();
      expect(screen.getByRole('button', { name: 'BTC' })).toBe(asset);
      await waitFor(() => expect(screen.getByRole('button', { name: 'USDT' })).toHaveFocus());
      expect(screen.getByRole('button', { name: 'Lịch sử lệnh' })).toBeInTheDocument();
      expect(screen.queryByText('Merchant One')).not.toBeInTheDocument();
      expect(screen.queryByText('Volume 24h')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Tuỳ chọn P2P' })).toBeDisabled();
      await waitForBottomSheetExit();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      fail = false;
      fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
      expect(await screen.findByText('Merchant One')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    },
  );

  it('aborts an obsolete marketplace asset read and keeps the latest result after the old handler completes', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let oldSignal: AbortSignal | undefined;
    let oldCompleted = false;
    server.use(
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
      http.get('*/p2p/ads', async ({ request }) => {
        const asset = new URL(request.url).searchParams.get('asset') ?? 'USDT';
        if (asset === 'BTC') {
          oldSignal = request.signal;
          await gate;
          oldCompleted = true;
        }
        return HttpResponse.json({
          items: [{ ...ads.items[0], asset, merchant: `Offer ${asset}` }],
        });
      }),
    );
    renderWithProviders(<P2PMarketplacePage />);
    expect(await screen.findByText('Offer USDT')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'BTC' }));
    try {
      await waitFor(() => expect(oldSignal).toBeDefined());
      fireEvent.click(screen.getByRole('button', { name: 'ETH' }));
      expect(await screen.findByText('Offer ETH')).toBeInTheDocument();
      expect(oldSignal?.aborted).toBe(true);
    } finally {
      release();
    }
    await waitFor(() => expect(oldCompleted).toBe(true));
    expect(screen.queryByText('Offer BTC')).not.toBeInTheDocument();
  });

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

  it('routes a quick sell from the selected offer in sell mode', async () => {
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(mixedAds)),
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
    fireEvent.click(screen.getByRole('tab', { name: 'BÁN' }));
    expect(await screen.findByText('Buyer One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Buyer One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Bán nhanh USDT' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/ad/ad-buy');
  });

  it('routes the order-history shortcut through the active web shell', async () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'Lịch sử lệnh' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/my-orders');
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
    await waitForBottomSheetExit();

    const compareLabel = await screen.findByText('1 offer đang so sánh');
    expect(compareLabel.parentElement?.querySelector('p:last-child')).toHaveTextContent(
      'Merchant One',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'So sánh giá' }));
    await waitForBottomSheetExit();
    expect(screen.getByText('1 offer đang so sánh')).toBeInTheDocument();

    const toastInfo = vi.spyOn(toast, 'info');
    fireEvent.click(screen.getByRole('button', { name: 'So sánh' }));
    expect(toastInfo).toHaveBeenCalledWith('So sánh chi tiết — Sắp ra mắt!');

    const clearButton = container.querySelector('.fixed.bottom-20 button:last-child');
    expect(clearButton).not.toBeNull();
    fireEvent.click(clearButton!);
    expect(screen.queryByText('1 offer đang so sánh')).not.toBeInTheDocument();
  });

  it('keeps the comparison capped at three distinct offers', async () => {
    const toastWarning = vi.spyOn(toast, 'warning');
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(marketplaceAds)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    renderWithProviders(<P2PMarketplacePage />);

    expect(await screen.findByText('Merchant Four')).toBeInTheDocument();
    for (const merchant of ['Merchant One', 'Merchant Two', 'Merchant Three']) {
      fireEvent.click(screen.getByRole('button', { name: `Tuỳ chọn offer của ${merchant}` }));
      fireEvent.click(await screen.findByRole('button', { name: 'So sánh giá' }));
      await waitForBottomSheetExit();
    }
    expect(screen.getByText('3 offer đang so sánh')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant Four' }));
    fireEvent.click(await screen.findByRole('button', { name: 'So sánh giá' }));
    await waitForBottomSheetExit();

    const comparisonBar = screen.getByText('3 offer đang so sánh').parentElement;
    expect(comparisonBar).toHaveTextContent('Merchant One vs Merchant Two vs Merchant Three');
    expect(comparisonBar).not.toHaveTextContent('Merchant Four');
    expect(toastWarning).toHaveBeenCalledWith('Tối đa 3 offer so sánh cùng lúc', {
      duration: 1500,
    });
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
    await waitForBottomSheetExit();

    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Xem hồ sơ merchant' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/w/p2p/merchant/merchant-1');
  });

  it('reports clipboard failure for the selected offer', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    const toastError = vi.spyOn(toast, 'error');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    server.use(
      http.get('*/p2p/ads', () => HttpResponse.json(ads)),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    renderWithProviders(<P2PMarketplacePage />);

    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chọn offer của Merchant One' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Chia sẻ offer' }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('Không thể sao chép liên kết offer.', {
        duration: 2000,
      }),
    );
    expect(writeText).toHaveBeenCalledTimes(1);
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
