import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { onlineManager, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import { renderWithProviders } from '@/test/test-utils';
import {
  p2pMarketplaceAds as ads,
  p2pMarketplaceOverview as overview,
} from '@/test/fixtures/p2p-marketplace';
import { P2PMarketplacePage } from './P2PMarketplacePage';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function CaptureClient({ onReady }: { onReady: (client: QueryClient) => void }) {
  const client = useQueryClient();
  useEffect(() => onReady(client), [client, onReady]);
  return null;
}

describe('P2P real read and refresh feedback', () => {
  it('uses actual paused query state for cache and new asset feedback without inventing an offline age', async () => {
    let queryClient: QueryClient | undefined;
    let reads = 0;
    server.use(
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
      http.get('*/p2p/ads', ({ request }) => {
        reads++;
        const asset = new URL(request.url).searchParams.get('asset') ?? 'USDT';
        return HttpResponse.json({
          items: [{ ...ads.items[0], asset, merchant: `Current ${asset}` }],
        });
      }),
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
    expect(await screen.findByText('Current USDT')).toBeInTheDocument();
    expect(
      screen.queryByText('Mất kết nối. Đang hiển thị dữ liệu gần nhất.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Cập nhật lần cuối: 2 phút trước')).not.toBeInTheDocument();
    const before = reads;
    try {
      act(() => onlineManager.setOnline(false));
      await act(async () => {
        await queryClient!.refetchQueries({
          queryKey: ['p2p', 'ads', { asset: 'USDT', currency: 'VND' }],
          exact: true,
        });
      });
      expect(
        await screen.findByText('Đang chờ kết nối để cập nhật dữ liệu P2P.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Current USDT')).toBeInTheDocument();
      const asset = screen.getByRole('button', { name: 'BTC' });
      asset.focus();
      fireEvent.click(asset);
      expect(await screen.findByText('Đang chờ kết nối để tải dữ liệu P2P…')).toBeInTheDocument();
      expect(asset).toHaveFocus();
      expect(screen.queryByText('Current USDT')).not.toBeInTheDocument();
      expect(screen.queryByText('Không tìm thấy offer')).not.toBeInTheDocument();
      expect(reads).toBe(before);
    } finally {
      act(() => onlineManager.setOnline(true));
    }
    expect(await screen.findByText('Current BTC')).toBeInTheDocument();
    expect(screen.queryByText('Cập nhật lần cuối: 2 phút trước')).not.toBeInTheDocument();
  });

  it('reports a failed pull read as failure and updates refresh metadata only after successful reads', async () => {
    let fail = false;
    server.use(
      http.get('*/p2p/ads', () =>
        fail ? HttpResponse.json({ code: 'UNAVAILABLE' }, { status: 503 }) : HttpResponse.json(ads),
      ),
      http.get('*/p2p/overview', () => HttpResponse.json(overview)),
    );
    const success = vi.spyOn(toast, 'success'),
      error = vi.spyOn(toast, 'error');
    const { container } = renderWithProviders(<P2PMarketplacePage />);
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    const surface = container.firstElementChild!;
    const pull = () => {
      fireEvent.touchStart(surface, { touches: [{ clientY: 0 }] });
      fireEvent.touchMove(surface, { touches: [{ clientY: 300 }] });
      fireEvent.touchEnd(surface);
    };
    fail = true;
    pull();
    expect(await screen.findByText('Không thể tải P2P')).toBeInTheDocument();
    await waitFor(() => expect(error).toHaveBeenCalledWith('Làm mới thất bại', { duration: 2000 }));
    expect(success).not.toHaveBeenCalled();
    expect(screen.queryByText(/Cập nhật: Vừa cập nhật/)).not.toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Merchant One')).toBeInTheDocument();
    expect(await screen.findByText(/Cập nhật: Vừa cập nhật/)).toBeInTheDocument();
    pull();
    await waitFor(() => expect(success).toHaveBeenCalledWith('Đã cập nhật', { duration: 1500 }));
  });
});
